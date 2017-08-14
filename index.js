const opt = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const print = require("./print.js")
const mqtt = require('mqtt')
opt.subbroker = opt.subbroker || opt.broker
opt.submode = opt.submode || false
opt.subqos = opt.subqos || 0
opt.subtimeout = opt.subtimeout || 2
opt.clients = opt.clients || 10 ;
opt.count = opt.count || 100 ;
opt.topic = opt.topic || "/mqttjs-bench" ;
opt.qos = opt.qos || opt.submode?0:1 ;
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
let results = []
let avgConTime = 0;
let failedClients = 0

const connectToClients = (broker)=> new Promise((resolve, reject) =>{
  const c = mqtt.connect(broker,opt)
  c.on('connect', ()=>resolve(c))
  c.on('error',  (err)=>reject(err))
})


/////////////////// Publishing Code
/////////////////// Publishing Code
/////////////////// Publishing Code
/////////////////// Publishing Code
const publish = async (c ) =>{
  if(opt.sleep > 0){
    await sleep()
  }
  if (!c.counter) {
    c.counter = 0
    c.results =[]
    c.push = (state)=>{
      c.results.push(state);
      if (c.results.length==opt.count) {
        const success = c.results.reduce((a,b)=>(a + (b && 1)),0)
        const failure = c.results.reduce((a,b)=>(a + (!b && 1)),0);
        const duraion = (now() - c.startTime) / 1000
        const throughput = success/duraion
        opt.submode?subresult(c):pubresult({success,failure,duraion,throughput})

      }
    }
    c.startTime = now()
    print.debug(`Client sequence ${c.order} started publishing`);
  }

  // recursive publishing
  if (c.counter == opt.count ){
    print.debug(`Client sequence ${c.order} finished publishing`);
    return
  } else {
    c.counter ++;
    print.debug(`Client sequence ${c.order} publishing message number ${c.counter}`);
    c.publish(opt.topic, opt.message,{qos:opt.qos},(err)=>{
      err && print.debug(err);
      err?c.push(false):c.push(true)

    })
    publish(c)
  }
}

const pubresult = (result)=>{
  print.debug(result);
  results.push(result)
  if(results.length == opt.clients){
    print.publish(opt,results,avgConTime)
    clients.forEach((c)=>c.end(true))
  }
}

/////////////////// Subscribe Code
/////////////////// Subscribe Code
/////////////////// Subscribe Code
/////////////////// Subscribe Code
let subs = []
const markSubbed = async(t)=>{
  subs.push(t)
  if(subs.length == opt.clients) {
    console.log('All clients sucessfully subscribed, startting publish');
    let c = false
    while (!c) {
      try{
        c = await connectToClients(opt.broker)
      } catch (err) {
        print.debug("subscription mode: Couldn't connect to puplish");
      }
    }
    publish(c)
  }
}

const subscribe = (c) =>{
    c.recivedCount = 0
    c.subscribe(opt.topic,{qos:opt.subqos},async(err)=>{
        if (err) {
          // if could not sub, tryin again until you can
          await sleep(5)
          subscribe(c)
        } else {
          markSubbed(true)
        }
    })
    c.on('message', (topic, message)=>(c.recivedCount++))
}


const subresult = async (c)=>{
  await sleep(opt.subtimeout*1000)
  const duraion = now()-c.startTime

  const totalAvgMsgRecived = clients.reduce((a,b)=>(a+b.recivedCount),0)/clients.length
  print.subscribe(opt,totalAvgMsgRecived,duraion,avgConTime)
  c.end(true)
  clients.forEach((c)=>c.end(true))
}

/////////////////// start test  Code
/////////////////// start test  Code
/////////////////// start test  Code
/////////////////// start test  Code
const start = async ()=> {

  // trying to connect to all clients before starting the test
  console.log(`\nTrying to conenct to ${opt.clients} clients ...`);
  const conStartTime = now()
  while (clients.length < opt.clients && failedClients <opt.clients) {

    try {
      const index = clients.push(await connectToClients(opt.submode?opt.subbroker:opt.broker))
      print.debug(`Client ${index} has successfully connected`);
    } catch (err) {
      print.debug(err);
      failedClients ++
    }
  }
  avgConTime = (now() - conStartTime)/1000.0/opt.clients
  if (!(failedClients <opt.clients)) {
    console.log("Please check the broker address, Could not connect to clients");
    process.exit(1);
  }
  console.log(`Conencted to ${opt.clients} sucessfully`);
  const action  = opt.submode?subscribe:publish
  for (let i = 0 ; i <clients.length ; i++) {
    clients[i].order =i
    action(clients[i])
  }

}

module.exports = ()=>{
  if(opt.help || !opt.broker) {
    print.help()
  } else {
    start()

  }
}
