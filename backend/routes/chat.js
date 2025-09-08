const express = require('express');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Получение списка чатов пользователя
router.get('/chats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.find({
      'participants.user': userId
    })
    .populate('participants.user', 'username avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
      const chatData = chat.toPublicData();

      // Получение количества непрочитанных сообщений
      const unreadCount = await Message.countDocuments({
        chatId: chat._id,
        senderId: { $ne: userId },
        'readBy.user': { $ne: userId }
      });

      return {
        ...chatData,
        unreadCount
      };
    }));

    res.json({ chats: chatsWithDetails });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создание нового чата
router.post('/chats', authenticateToken, async (req, res) => {
  try {
    const { name, description, participants, type = 'group' } = req.body;
    const creatorId = req.user.userId;

    if (!name || !participants || participants.length === 0) {
      return res.status(400).json({ error: 'Chat name and participants are required' });
    }

    // Проверка существования участников
    const existingUsers = await User.find({
      _id: { $in: participants }
    });

    if (existingUsers.length !== participants.length) {
      return res.status(400).json({ error: 'Some participants not found' });
    }

    // Добавление создателя в участники
    const allParticipants = [...new Set([...participants, creatorId])];

    const chat = new Chat({
      name: name.trim(),
      description: description?.trim(),
      type,
      participants: allParticipants.map(userId => ({
        user: userId,
        role: userId === creatorId ? 'admin' : 'member'
      })),
      createdBy: creatorId
    });

    await chat.save();
    await chat.populate('participants.user', 'username avatar isOnline lastSeen');

    res.status(201).json({
      message: 'Chat created successfully',
      chat: chat.toPublicData()
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение сообщений чата
router.get('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Проверка доступа к чату
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.user': userId
    });

    if (!chat) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    const messages = await Message.find({ chatId })
      .populate('senderId', 'username avatar')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    // Отметка сообщений как прочитанные
    await Message.updateMany(
      {
        chatId,
        senderId: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      messages: messages.reverse().map(msg => msg.toPublicData())
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Отправка сообщения
router.post('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { encryptedContent, messageType = 'text' } = req.body;
    const senderId = req.user.userId;

    if (!encryptedContent) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Проверка доступа к чату
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.user': senderId
    });

    if (!chat) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    const message = new Message({
      chatId,
      senderId,
      encryptedContent,
      messageType
    });

    await message.save();

    // Обновление последнего сообщения в чате
    chat.lastMessage = message._id;
    await chat.save();

    await message.populate('senderId', 'username avatar');

    res.status(201).json({
      message: 'Message sent successfully',
      message: message.toPublicData()
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение участников чата
router.get('/chats/:chatId/participants', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findOne({
      _id: chatId,
      'participants.user': userId
    }).populate('participants.user', 'username avatar isOnline lastSeen');

    if (!chat) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    res.json({
      participants: chat.participants.map(p => ({
        user: p.user.toPublicData ? p.user.toPublicData() : p.user,
        joinedAt: p.joinedAt,
        role: p.role
      }))
    });

  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
