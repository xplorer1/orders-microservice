var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var ItemOrdersSchema = new Schema({
	'user' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'User'
	},
    'item' : {type: Schema.Types.ObjectId, ref: 'Item'},
    'orderid': String,
    'orderstatus' : {type: String, default: "PENDING"},
    'status' : {type: String, default: "PENDING"},
	'createdon' : {type: Date, default: Date.now()}
});

module.exports = mongoose.model('ItemOrders', ItemOrdersSchema);