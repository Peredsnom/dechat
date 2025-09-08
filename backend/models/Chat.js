const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    }
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Обновление updatedAt при изменении
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Индексы для оптимизации запросов
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ updatedAt: -1 });

// Метод для получения публичных данных чата
chatSchema.methods.toPublicData = function() {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    type: this.type,
    participants: this.participants.map(p => ({
      user: p.user,
      joinedAt: p.joinedAt,
      role: p.role
    })),
    lastMessage: this.lastMessage,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Chat', chatSchema);
