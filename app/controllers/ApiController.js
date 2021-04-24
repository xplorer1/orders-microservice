let ProductOrderModel = require('../models/ProductOrderModel.js');
let Producer = require('../services/kafka-producer');

let config = require('../../config');
let uuid = require('node-uuid');

module.exports = {

    placeOrder: async function(req, res) {
        if(!req.body.product_id || !req.body.product_price || !req.body.product_name) return res.status(400).json({status: 400, message: "Supplied missing fields."});

        try {
            let order = new ProductOrderModel();

            order.product_name = req.body.product_name;
            order.product_id = req.body.product_id;
            order.product_price = req.body.product_price;
            order.order_id = uuid.v4().split('').splice(0, 20).join('').toUpperCase();

            await order.save();

            let data = {product_id: req.body.product_id};

            Producer.sendRecord(data, function(err, success) {
                if(err) console.log("err: ", err);

                console.log("success: ", success);
            });
            
            return res.status(200).json({message: "Order placed.", status: 200});
        } catch (error) {
            return res.status(500).json({status: 500, message: error.message});
        }
    }
}

//come to a site. 
//see a list of products
//select one and place an order.
//After placing an order. Communicate to products service to update order list.