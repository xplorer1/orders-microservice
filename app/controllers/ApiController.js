let ProductModel = require('../models/ProductModel.js');
let ProductOrdersModel = require('../models/ProductOrdersModel.js');

let config = require('../../config');

module.exports = {

    logIn: async function(req, res) {
        if(!req.body.email || !req.body.password) return res.status(400).json({status: 400, message: "Email and password required."});

        try {
            let user = await UserModel.findOne({email: req.body.email.trim().toLowerCase()}).exec();
            if(!user) return res.status(404).json({status: 404, message: 'Email or password incorrect.'});

            let match = await bcrypt.compare(req.body.password.trim(), user.password.trim());

            if (!match) return res.status(404).json({status: 404, success: false, message: 'Email or password incorrect.'});
            
            else {
                if(!user.verified) {
                    return res.status(400).json({status: 400, message: "Your email is yet to be verified. Check your mail for an activation code or request for a new link."})
                } else {

                    var token = jwt.sign({email: user.email, role: user.role}, secret, {expiresIn: 86400000});

                    return res.status(200).json({status: 200, success: true,message: 'Have fun!',token: token});
                }
            }
        } catch (error) {
            return res.status(500).json({status: 500, message: 'Error processing requests.', error: error.message});
        }
    },

    createItem: async function(req, res) {

        if( !req.body.name || !req.body.item) return res.status(400).json({status: 400, message: "Your request cannot be processed. Supply missing fields."});

        let admin = await UserModel.findOne({email: req.verified.email, role: "ADMIN"}).exec();
        if(!admin) return res.status(404).json({status: 404, message: "Admin not found."});

        cloudinary.uploader.upload(req.body.item, {public_id: "item" + imageId()},
            function(error, result) {
                if(error) return res.status(500).json({status: 500, message: 'Unable to process your request.', error: error });

                var item = new ItemModel({
                    item: result.secure_url,
                    name: req.body.name,
                    price: req.body.price,
                    addedby: admin._id
                });

                item.save((err) => {
                    if(err) return res.status(500).json({status: 500, message: 'Unable to process your request.', error: error});

                    return res.status(200).json({status: 200, message: "Item added."});
                });
            }
        );
    },

    addItemToCart: async function(req, res) {
        if(!req.body.item) return res.status(400).json({status: 400, message: "Item required."});

        try {
            let user = await UserModel.findOne({email: req.verified.email, role: "CUSTOMER"}).exec();
            if(!user) return res.status(404).json({status: 404, message: "User not found."});

            let usercart = await ShoppingCartModel.findOne({user: user._id});
            if(!usercart) return res.status(404).json({status: 404, message: "User's cart not found."});

            if(usercart.items.includes(req.body.item))  return res.status(500).json({message: "Item already in shopping cart.", status: 500});

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