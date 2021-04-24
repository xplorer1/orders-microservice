const kafka = require("kafka-node");
const uuid = require("node-uuid");
const config = require('../../config');

//new kafka.KafkaClient();

const client = new kafka.KafkaClient("http://localhost:2181", "iron-phantom-justice-storm-fury-desert", {
    sessionTimeout: 300,
    spinDelay: 100,
    retries: 2
});

const producer = new kafka.HighLevelProducer(client);
producer.on("ready", function() {
    console.log("Kafka Producer is connected and ready.");
});

// to handle this error.
producer.on("error", function(error) {
    console.error(error);
});

const KafkaService = {
    sendRecord: (data, callback = () => {}) => {
    
        const event = {
            id: uuid.v4(),
            timestamp: Date.now(),
            data: data
        };

        const buffer = new Buffer.from(JSON.stringify(event));

        // Create a new payload
        const record = [
            {
                topic: "order_events",
                messages: buffer,
                attributes: 1 /* Use GZip compression for the payload */
            }
        ];

        //Send record to Kafka and log result/error
        producer.send(record, callback);
    }
};

module.exports = KafkaService;