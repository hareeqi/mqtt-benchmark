const isdebug = require('minimist')(process.argv.slice(2)).d;
const round = (n)=> Math.round(n* 10000) / 10000
const debug = (...arg)=>isdebug && console.log(...arg);



const publish = (opt,results,avgConTime)=>{
  console.log(`\n\tAverage result for each client of the ${opt.clients} clients.\n `);
  console.log("\tEstablishing connection (sec):\t",round(avgConTime));
  console.log(`\tSuccess in publishing (msg):\t ${round(results.reduce((a,b)=>(a+b.success),0)/results.length)}/${opt.count}`);
  console.log(`\tFailure in publishing (msg):\t ${round(results.reduce((a,b)=>(a+b.failure),0)/results.length)}/${opt.count}`);
  console.log("\tDuraion in publishing (sec):\t",round(results.reduce((a,b)=>(a+b.duraion),0)/results.length));
  console.log("\tThroughput (msg/sec):     \t",round(results.reduce((a,b)=>(a+b.throughput),0)/results.length));
  console.log("\n")
}

const subscribe = (opt,totalAvgMsgRecived,duraion,avgConTime)=>{
  console.log(`\n\tAverage result for each client of the ${opt.clients} clients.\n `);
  console.log("\tEstablishing connection (sec):\t",round(avgConTime));
  console.log(`\tRecived Messages (msg):   \t ${round(totalAvgMsgRecived)}/${opt.count}`);
  console.log("\tThroughput (msg/sec):     \t",round(totalAvgMsgRecived/duraion*1000));
  console.log("\n")
}




let helptxt = `\n\tUsage: mqtt-benchmark --broker=mqtts://example.com:8883 [options]\n\n\n\tOptions:\n\n`
const popt = (name, des)=> (helptxt+= `\t--${(name+"      ").substring(0,10)}\t${des}\n`);


popt('broker', "[Required] mqtt://example.com:1883 or for tls mqtts://example.com:8883")
popt('username', "username for the broker")
popt('password', "password for the broker")
popt('clients', "Number of clients (default=10)")
popt('count', "Number of messages per client (default=100)")
popt('qos', "Publish QoS (default=1) in submode (default=0)")
popt('topic', "MQTT topic (default=/mqttjs-bench)")
popt('size', "Messages size (default=1024)")
popt('sleep', "Interval between each publish per client in ms (default=0 no sleep) ")
popt('ca', "CA file to be used for self signed certficates on the broker")
popt('key', "key file to be used to authenticate with the broker")
popt('cert', "cert file to be used to authenticate with the broker")

helptxt += `\n\n\n\tSubscribe Mode Options:\n\n`

popt('submode', "benchmark multiple clients subscribing with 1 publisher (default=false)")
popt('subbroker', "Broker to be used for subscribing clients (default= --broker)")
popt('subqos', "Subscribing clients QoS (default=0)")
popt('subtimeout', "Seconds subscribers will wait after publishing is finished (defaults=2) ")



helptxt += `\n\n\n\tAdvanced Options:\n\n`
helptxt += `\t-d        \tShow all debug messgages \n\n`
helptxt += `\tAll options of mqttjs connections can passed as a flag \n\thttps://github.com/mqttjs/MQTT.js#connect\n\n`
helptxt += `\tAll options of nodejs net or tls socket can passed as a flag\n\thttps://nodejs.org/api/net.html\n\n`

const help = ()=> console.log(helptxt);


module.exports = {help,publish,subscribe,debug}
