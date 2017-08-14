
# mqtt-benchmark


A simple consistant MQTT benchmarking tool  (under devolopment)


### Install

```
npm install mqtt-benchmark -g
```

### Usages

```
mqtt-benchmark --broker=mqtt://iot.eclipse.org:1883

\\ or for TLS

mqtt-benchmark --broker=mqtts://iot.eclipse.org:8883

```

### Result Sample
```
Trying to conenct to 10 clients ...
Conencted to 10 sucessfully

	Average result for each client of the 10 clients.

	Establishing connection (sec):	 0.5642
	Success in publishing (msg):	 100/100
	Failure in publishing (msg):	 0/100
	Duraion in publishing (sec):	 0.8284
	Throughput (msg/sec):     	 121.6008

```

### Options

```
	Usage: mqtt-benchmark --broker=mqtts://example.com:8883 [options]


	Options:

	--broker    	[Required] mqtt://example.com:1883 or for tls mqtts://example.com:8883
	--username  	username for the broker
	--password  	password for the broker
	--clients   	Number of clients (default=10)
	--count     	Number of messages per client (default=100)
	--qos      	Publish QoS (default=1) in submode (default=0)
	--topic     	MQTT topic (default=/mqttjs-bench)
	--size      	Messages size (default=1024)
	--sleep     	Interval between each publish per client in ms (default=0 no sleep)
	--ca      	CA file to be used for self signed certficates on the broker
	--key      	key file to be used to authenticate with the broker
	--cert      	cert file to be used to authenticate with the broker



	Subscribe Mode Options:

	--submode   	benchmark multiple clients subscribing with 1 publisher (default=false)
	--subbroker 	Broker to be used for subscribing clients (default= --broker)
	--subqos    	Subscribing clients QoS (default=0)
	--subtimeout	Seconds subscribers will wait after publishing is finished (defaults=2)



	Advanced Options:

	-d        	Show all debug messgages

	All options of mqttjs connections can passed as a flag
	https://github.com/mqttjs/MQTT.js#connect

	All options of nodejs net or tls socket can passed as a flag
	https://nodejs.org/api/net.html

```
