import kafka from "kafka-node";
import uuid from "uuid";
const config = require('../config');

const client = new kafka.Client("http://localhost:2181", "my-client-id", {
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
        if (!userId) {
            return callback(new Error("A userId must be provided."));
        }

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

export default KafkaService;