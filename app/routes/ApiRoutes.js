var express = require('express');
var router = express.Router();
var ApiController = require('../controllers/ApiController.js');

router.post('/placeOrder', ApiController.placeOrder);

module.exports = router;