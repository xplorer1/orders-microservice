let ProductOrdersModel = require('../models/ProductOrdersModel.js');

let config = require('../../config');

module.exports = {

    placeOrder: async function(req, res) {
        if(!req.body.product_id) return res.status(400).json({status: 400, message: "Item required."});

        try {
            let o
            let updatecart = await ShoppingCartModel.findOneAndUpdate({user: user._id}, {$push: {"items" : req.body.item}}).exec();
            if(!updatecart) return res.status(500).json({message: "Unable to update shopping cart", status: 500});
            
            return res.status(200).json({message: "Item added to cart.", status: 200});
        } catch (error) {
            return res.status(500).json({status: 500, message: error.message});
        }
    },

    removeItemFromCart: async function(req, res) {
        if(!req.body.item) return res.status(400).json({status: 400, message: "Item required."});

        try {
            let user = await UserModel.findOne({email: req.verified.email, role: "CUSTOMER"}).exec();
            if(!user) return res.status(404).json({status: 404, message: "User not found."});

            let usercart = await ShoppingCartModel.findOne({user: user._id});
            if(!usercart) return res.status(404).json({status: 404, message: "User's cart not found."});

            if(!usercart.items.includes(req.body.item))  return res.status(500).json({message: "Item not found in cart.", status: 500});

            let existingcart = usercart.items;

            existingcart = existingcart.filter(item => item.toString() !== req.body.item.toString());

            let updatecart = await ShoppingCartModel.findOneAndUpdate({user: user._id}, {$set: {"items" : existingcart}}).exec();
            if(!updatecart) return res.status(500).json({message: "Unable to update shopping cart", status: 500});

            return res.status(200).json({message: "Item successfully removed", status: 200});

        } catch (error) {
            return res.status(500).json({status: 500, message: error.message});
        }
    },

    makeAPurchase: async function(req, res) {
        if(!req.body.items || !req.body.items.length) return res.status(400).json({status: 400, message: "Items required."});

        try {
            let user = await UserModel.findOne({email: req.verified.email, role: "CUSTOMER"}).exec();
            if(!user) return res.status(404).json({status: 404, message: "User not found."});

            let usercart = await ShoppingCartModel.findOne({user: user._id});
            if(!usercart) return res.status(404).json({status: 404, message: "User's cart not found."});

            let purchases = [];
            req.body.items.forEach(item => {
                let obj = {};

                obj["price"] = item.price;
                obj["item"] = item.item;
                obj["orderid"] = config.generateCode(10);
                obj["user"] = user._id;

                purchases.push(obj);
            });

            let insertmanypurchases = await ItemOrdersModel.create(purchases);

            if(!insertmanypurchases) return res.status(500).json({message: "Unable to update orders", status: 500});
            
            return res.status(200).json({message: "Purchase successful.", status: 200});

        } catch (error) {
            return res.status(500).json({status: 500, message: error.message});
        }
    }
}

//come to a site. 
//see a list of products
//select one and place an order.
//After placing an order. Communicate to products service to update order list.