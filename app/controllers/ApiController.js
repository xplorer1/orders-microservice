let UserModel = require('../models/UserModel.js');
let ShoppingCartModel = require('../models/ShoppingCartModel.js');
let ItemModel = require('../models/ItemModel.js');
let ItemOrdersModel = require('../models/ItemOrdersModel.js');

let config = require('../../config');
let uuid = require('node-uuid');

let jwt = require('jsonwebtoken');
let secret = config.secret;
let bcrypt = require('bcrypt');
let mailer = require('../utils/mailer');
let cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dvytkanrg',
    api_key: '695117327935385',
    api_secret: 'WTms8o2ny61A3h2WsogjapwVBJQ'
});

let imageId = function () {
    return Math.random().toString(36).substr(2, 4);
};

module.exports = {
    createCustomer: async function (req, res) {

        if(!req.body.email) {
            return res.status(400).json({status: 400, message: "Email address is required."});
        }
        if(!config.validateEmail(req.body.email)) {
            return res.status(400).json({status: 400, message: "Email address is not valid."});
        }
        if(!req.body.firstname) {
            return res.status(400).json({status: 400, message: "We require your first and last names."});
        }
        if(!req.body.lastname) {
            return res.status(400).json({status: 400, message: "We require your first and last names."});
        }
        if(!req.body.password) {
            return res.status(400).json({status: 400, message: "Password is required."});
        }

        try {

            let user = await UserModel.findOne({email: req.body.email}).exec();
            if(user) return res.status(500).json({status: 500, message: "User exists."});

            let verificationcode = config.generateCode(5);

            let newuser = new UserModel({
                firstname : req.body.firstname,
                lastname : req.body.lastname,
                email : req.body.email.trim().toLowerCase(),
                password: req.body.password,
                verificationcode: verificationcode,
                verified: true,
                role: req.body.role || "CUSTOMER"
            });

            newuser.save(function (err, user) {
                
                if (err) {
                    return res.status(500).json({
                        message: 'Error when creating admin.',
                        error: err
                    });
                }

                if(!req.body.role) {
                    let cart = new ShoppingCartModel();

                    cart.user = user._id;
                    cart.lastmodified = new Date();

                    cart.save();
                }

                mailer.sendVerificationCodeMail(req.body.email, verificationcode);

                return res.status(200).json({status: 200, message: "Account has been created."});
            });

        } catch (error) {
            return res.status(500).json({status: 500, error: error.message, message: 'Error while processing requests.'});
        }
    },

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

    logOut: function (req, res) {
        let blacklistarray = appstorage.get("blacklist");
    
        blacklistarray.push(req.verified.token);
        appstorage.set("blacklist", blacklistarray);
    
        return res.send({status: 200});
    },

    requestVerificationCode: async function(req, res) {
        if(!req.body.email) return res.status(400).json({message: "Email is required."});

        var verificationcode = config.generateCode(5);

        try {
            let user = await UserModel.findOne({email: req.body.email}).exec();
            if(!user) return res.status(404).json({message: "User not found."});

            let updateuser = await UserModel.findOneAndUpdate({email: req.body.email}, {$set: {verificationcode: verificationcode, createdon: new Date().toLocaleString()}}).exec();
            if(!updateuser) return res.status(500).json({message: "Unable to update user."});

            mailer.sendVerificationCodeMail(req.body.email, verificationcode);

            return res.status(200).json({message: "Verification code has been sent to user's registered email address."});

        } catch (error) {
            return res.status(500).json({error: error.message,message: 'Error when processing requests.'});
        }
    },

    verifyCode: async function (req, res) {
        var code = req.body.code.toUpperCase();
        if(!code) return res.status(400).json({status: 400, message: "Code is required."});

        try {
            let user = await UserModel.findOne({verificationcode: code}).exec();
            if(!user) return res.status(404).json({status: 404, message: "Code invalid."});

            if(user.verified) return res.status(400).json({status: 400, message: 'Email already verified.'});
            
            if(!user.verified) {
                var expirydate = new Date(user.createdon);
                expirydate.setDate(expirydate.getDate() + 2);

                if (expirydate > new Date()) { //token is still valid.

                    user.verified = true;
                    user.verifiedon = new Date();
                    
                    user.save();

                    return res.status(200).json({status: 200, message: 'Activation successful!'});
                }
                else {
                    var verificationcode = config.generateCode(5);
                            
                    mailer.sendVerificationCodeMail(user.email, verificationcode);

                    return res.status(404).json({message: 'Activation code expired.'});
                }
            }
        } catch (error) {
            return res.status(500).json({error: error.message,message: 'Error when processing requests.'});
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
    },

    listOrders: async function(req, res) {

        try {
            let admin = await UserModel.findOne({email: req.verified.email, role: "ADMIN"}).exec();
            if(!admin) return res.status(404).json({status: 404, message: "User not found."});

            let orders = await ItemOrdersModel.find({user: req.params.user}).exec();

            return res.status(200).json({data: orders, status: 200});

        } catch (error) {
            return res.status(500).json({status: 500, message: error.message});
        }
    },

    listCustomers: async function(req, res) {

        try {
            let admin = await UserModel.findOne({email: req.verified.email, role: "ADMIN"}).exec();
            if(!admin) return res.status(404).json({status: 404, message: "User not found."});

            let orders = await UserModel.find({role: "CUSTOMER", verified: true}, {"password": false, "__v": false, "verificationcode" : false}).exec();

            return res.status(200).json({data: orders, status: 200});

        } catch (error) {
            return res.status(500).json({status: 500, message: error.message});
        }
    },

    updateOrder: async function (req, res) {

        try{
            let admin = UserModel.findOne({email: req.verified.email, role: "ADMIN"}).exec();
            if(!admin) return res.status(404).json({status: 404, message: "Admin does not exist."});

            let action = req.body.action === "reject" ? "REJECTED" : "APPROVED"

            let rejection = await ItemOrdersModel.findOneAndUpdate({orderid: req.body.orderid}, {$set: {orderstatus: action}}).exec();
            if(!rejection) return res.status(500).json({status: 500, message: "Unable to reject order."});

            return res.status(200).json({ status: 200, message: 'Update was successful.'});
        }
        catch (error) {
            return res.status(500).json({status: 500, message: error.message});
        }
    }
}