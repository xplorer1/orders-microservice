var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var ItemSchema = new Schema({
	'addedby' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'User'
	},
	'item' : String,
    'name' : String,
	'price' : Number,
    'status' : {type: String, default: "PENDING"},
	'createdon' : {type: Date, default: Date.now()}
});

module.exports = mongoose.model('Item', ItemSchema);