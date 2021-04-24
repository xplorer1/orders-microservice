var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var ProductOrderSchema = new Schema({
    'product_name' : String,
    'product_price': Number,
    'product_id': String,
    'order_id': String,
    'order_status' : {type: String, default: "PENDING"},
	'createdon' : {type: Date, default: Date.now()}
});

module.exports = mongoose.model('ProductOrder', ProductOrderSchema);