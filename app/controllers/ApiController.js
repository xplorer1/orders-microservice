const ProductOrderModel = require('../models/ProductOrderModel.js');
const config = require('../../config');
const uuid = require('node-uuid');
const request = require('request');

const { Kafka } = require('kafkajs');
 
const kafka = new Kafka({
    clientId: 'order-products-group',
    brokers: ['localhost:9092', 'localhost:9093']
});
 
const producer = kafka.producer();

const products_service = config.products_service;

module.exports = {

    placeOrder: async function(req, res) {
        if(!req.body.product_id) return res.status(400).json({status: 400, message: "Supplied missing fields."});

        try {

            request.get({
                headers: {'content-type': 'application/json'},
                url: `${products_service}/api/get_product/${req.body.product_id}`
            }, async (err, product_response, response) => {

                response = JSON.parse(response);

                if (!err) {

                    let order = new ProductOrderModel();

                    order.product_name = response.data.product_name;
                    order.product_id = req.body.product_id;
                    order.product_price = response.data.product_price;
                    order.order_id = uuid.v4().split('').splice(0, 20).join('').toUpperCase();

                    await order.save();

                    await producer.connect();

                    let data = {product_id: req.body.product_id};

                    await producer.send({
                        topic: 'order_events',
                        messages: [
                            { value: req.body.product_id },
                        ],
                    });

                    return res.status(200).json({message: "Order placed.", status: 200});
                          
                } else {
                    res.status(500).json({status: 500, message: `Product Service responded with issue ${err.message}`});
                }
            });
            
        } catch (error) {
            return res.status(500).json({status: 500, message: error.message});
        }
    }
}

//come to a site. 
//see a list of products
//select one and place an order.
//After placing an order. Communicate to products service to update order list.