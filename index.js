const opt = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const mqtt = require('mqtt')
opt.broker = opt.broker
opt.subbroker = opt.subbroker || opt.broker
opt.submode = opt.submode || false
opt.subtimeout = opt.subtimeout || 5
opt.clients = opt.clients || 10 ;
opt.count = opt.count || 100 ;
opt.topic = opt.topic || "/mqttjs-bench" ;
opt.qos = opt.qos || 0 ;
opt.size = opt.size || 1024 ;
opt.sleep = opt.sleep || 0
opt.message = new Array(opt.size+ 1).join('h');
opt.ca = opt.ca &&  fs.readFileSync(opt.ca)
opt.key = opt.key &&  fs.readFileSync(opt.key)
opt.cert = opt.cert &&  fs.readFileSync(opt.cert)

// help functions
const now = ()=>Date.now()
const sleep = (t=opt.sleep)=> new Promise(resolve => setTimeout(resolve, t))


let clients = []
let failedClients = 0

const connectToClients = (broker=opt.broker)=> new Promise((resolve, reject) =>{
  const c = mqtt.connect(opt.broker,opt)
  c.on('connect', ()=>resolve(c))
  c.on('error',  (err)=>reject(err))
})

const publish = async (c, counter = 0 , success = 0) =>{
  if(opt.sleep > 0){
    await sleep()
  }
  if (counter == 0 ) {
    c.startTime =now()
  }
  if (counter >= opt.count ){
    //bandwidth
    opt.submode?subresult(c):pubresult(success / (now() - c.startTime) * 1000)
    return
  } else {
    c.publish(opt.topic, opt.message,{qos:opt.qos},(err)=>{
      opt.d && err && console.log(err);
      !err && success++
      counter ++;
      publish(c,counter,success)
    })
  }
}
let subs = []
const markSubbed = async(t)=>{
  subs.push(t)
  if(subs.length == opt.clients) {
    console.log('All clients sucessfully subscribed, startting publish');
    let c = false
    while (!c) {
      try{
        c = await connectToClients(opt.subbroker)
      } catch (err) {
        opt.d && console.log("subscription mode: Couldn't connect to puplish");
      }
    }
    publish(c)
  }
}

const subscribe = (c) =>{
    c.recivedCount = 0
    c.subscribe(opt.topic,{qos:opt.qos},async(err)=>{
        if (err) {
          await sleep(5)
          subscribe(c)
        } else {
          markSubbed(true)
        }
    })
    c.on('message', (topic, message)=>(c.recivedCount++))
}

let results = []
const pubresult = (result)=>{
  results.push(result)
  if(results.length == opt.clients){
    console.log("Bandwidth (messages/second):",results.reduce((a,b)=>(a+b))/results.length)
    clients.forEach((c)=>c.end(true))
  }
}

const subresult = async (c)=>{
  await sleep(opt.subtimeout*1000)
  const duraion = now()-c.startTime

  const totalAvgMsgRecived = clients.reduce((a,b)=>(a+b.recivedCount),0)/clients.length
  console.log("total avg recived:",totalAvgMsgRecived);
  console.log("Bandwidth (messages/second):",totalAvgMsgRecived/duraion*1000)
  c.end(true)
  clients.forEach((c)=>c.end(true))
}

const start = async ()=> {

  // trying to connect to all clients before starting the test
  console.log(`trying to conenct to ${opt.clients} clients ...`);
  while (clients.length < opt.clients && failedClients <opt.clients) {
    try {
      clients.push(await connectToClients())
    } catch (er) {
      opt.d && console.log(err);
      failedClients ++
    }
  }

  if (!(failedClients <opt.clients)) {
    console.log("Please check the broker address, Could not connect to clients");
    process.exit(1);
  }
  console.log(`Conencted to ${opt.clients} sucessfully`);
  const action  = opt.submode?subscribe:publish
  for (let i = 0 ; i <clients.length ; i++) {
    action(clients[i])
  }

}

start()
