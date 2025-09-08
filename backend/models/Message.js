const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  encryptedContent: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null // Для файлов и изображений
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Индексы для оптимизации
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });

// Метод для получения публичных данных сообщения
messageSchema.methods.toPublicData = function() {
  return {
    _id: this._id,
    chatId: this.chatId,
    senderId: this.senderId,
    encryptedContent: this.encryptedContent,
    messageType: this.messageType,
    fileUrl: this.fileUrl,
    fileName: this.fileName,
    fileSize: this.fileSize,
    replyTo: this.replyTo,
    timestamp: this.timestamp,
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    readBy: this.readBy
  };
};

module.exports = mongoose.model('Message', messageSchema);
