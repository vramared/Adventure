var mongoose = require('mongoose');

var chatSchema = new mongoose.Schema({
  user:{
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
  msg: String,
  created: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Message', chatSchema);
