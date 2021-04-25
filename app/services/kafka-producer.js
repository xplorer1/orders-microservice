const kafka = require("kafka-node");
const uuid = require("node-uuid");

const client = new kafka.KafkaClient("http://localhost:2181", "iron-phantom-justice-storm-fury-desert", {
    sessionTimeout: 300,
    spinDelay: 100,
    retries: 2
});

const Producer = kafka.Producer;
//const client = new kafka.KafkaClient('localhost:2181');
const producer = new Producer(client);

//const producer = new kafka.HighLevelProducer(client);
producer.on("ready", function() {
    console.log("Kafka Producer is connected and ready.");
});

// to handle this error.
producer.on("error", function(error) {
    console.log("error: ", error);
});

const KafkaService = {
    sendRecord: (data, callback = (err, data) => {console.log(err, data)}) => {
    
        const event = {
            id: uuid.v4(),
            timestamp: Date.now(),
            data: "data"
        };

        //const buffer = new Buffer.from();

        // Create a new payload
        const record = [{
                topic: "order_events",
                messages: JSON.stringify(event)
            }];

        //Send record to Kafka and log result/error
        producer.send(record, callback);
    }
};

module.exports = KafkaService;