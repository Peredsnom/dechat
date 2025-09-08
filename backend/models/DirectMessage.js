const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    index: true,
    required: true
  },
  sender: {
    type: String,
    required: true,
    trim: true
  },
  recipient: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('DirectMessage', directMessageSchema);


