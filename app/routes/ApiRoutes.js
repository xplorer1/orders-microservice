var express = require('express');
var router = express.Router();
var ApiController = require('../controllers/ApiController.js');

var middlewares = require("../utils/middleware.js");

router.post('/signup', ApiController.createCustomer); //tick

router.post('/auth/login', ApiController.logIn); //tick

router.post('/auth/verify', ApiController.verifyCode); //tick

router.post('/auth/verify/resend', ApiController.requestVerificationCode); //tick

router.get('/auth/logout', middlewares.checkToken, ApiController.logOut);

router.post('/admin/create_item', middlewares.checkToken, ApiController.createItem); //tick

router.post('/customer/add_to_cart', middlewares.checkToken, ApiController.addItemToCart); //tick

router.post('/customer/remove_from_cart', middlewares.checkToken, ApiController.removeItemFromCart); //tick

router.post('/customer/make_purchase', middlewares.checkToken, ApiController.makeAPurchase); //tick

router.get('/admin/customers', middlewares.checkToken,  ApiController.listCustomers); //tick

router.get('/admin/orders/:user', middlewares.checkToken,  ApiController.listOrders);

router.post('/admin/update_order', middlewares.checkToken, ApiController.updateOrder);

router.use(function(req, res) {
    return res.status(404).send({ message: 'The url you visited does not exist.' });
});

module.exports = router;