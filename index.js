const opt = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const mqtt = require('mqtt')
opt.broker = opt.broker || "mqtt://locahost:1883"
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
const sleep = ()=> new Promise(resolve => setTimeout(resolve, opt.sleep))


let clients = []
let failedClients = 0

const connectToClients = ()=> new Promise((resolve, reject) =>{
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
    pushResult(success / (now() - c.startTime) * 1000)
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

let results = []
const pushResult = (result)=>{
  results.push(result)
  if(results.length == opt.clients){
    console.log("Bandwidth (messages/second):",results.reduce((a,b)=>(a+b))/results.length)
    clients.forEach((c)=>c.end(true))
  }

}

const start = async ()=> {

  // trying to connect to all clients before starting the test
  console.log(`trying to conenct to ${opt.clients}...`);
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
  for (let i = 0 ; i <clients.length ; i++) {
    publish(clients[i])
  }

}

start()
