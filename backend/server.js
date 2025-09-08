const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Настройка Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Статические файлы для веб-интерфейса
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Подключение к MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dechat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// История 1:1 сообщений (перенесено из конца файла)
app.get('/api/direct/messages', async (req, res) => {
  try {
    console.log('📜 GET /api/direct/messages, query:', req.query);
    const { me, peer, limit = 100 } = req.query;
    if (!me || !peer) {
      return res.status(400).json({ error: 'me and peer are required' });
    }
    const DirectMessage = require('./models/DirectMessage');
    const conversationId = [String(me), String(peer)].sort().join('::');
    const items = await DirectMessage.find({ conversationId })
      .sort({ timestamp: 1 })
      .limit(parseInt(limit));
    console.log('📜 Found', items.length, 'messages for', conversationId);
    res.json({ messages: items.map(m => ({ sender: m.sender, recipient: m.recipient, text: m.text, timestamp: m.timestamp })) });
  } catch (err) {
    console.error('Load direct history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Хранилище подключенных пользователей
const connectedUsers = new Map(); // socketId -> userData
const usernameToSocketId = new Map(); // username -> socketId

// Socket.IO обработчики
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Пользователь присоединился к чату
  socket.on('user_joined', (data) => {
    console.log(`👤 User joined: ${data.username}, socketId: ${socket.id}`);
    
    // Сохраняем пользователя
    connectedUsers.set(socket.id, {
      username: data.username,
      online: true,
      socketId: socket.id
    });
    usernameToSocketId.set(data.username, socket.id);
    console.log(`🗂️ usernameToSocketId map:`, Array.from(usernameToSocketId.entries()));
    // Комната пользователя (на случай нескольких вкладок)
    try { socket.join(`user:${data.username}`); } catch (e) {}
    
    // Уведомляем всех о новом пользователе
    socket.broadcast.emit('user_joined', { username: data.username });
    
    // Отправляем список всех пользователей новому клиенту
    const usersList = Array.from(connectedUsers.values());
    socket.emit('users_list', usersList);
    
    // Отправляем обновленный список всем остальным
    socket.broadcast.emit('users_list', usersList);
  });
  
  // Отправка личного сообщения (1:1)
  socket.on('send_message', async (data) => {
    // Ветка комнат (старого API) обрабатывается ниже, здесь 1:1 если нет chatId
    if (data && !data.chatId && data.sender && data.recipient && data.text) {
      try {
        const payload = {
          sender: data.sender,
          recipient: data.recipient,
          text: data.text,
          timestamp: data.timestamp || Date.now()
        };

        // Сохраняем историю
        try {
          const DirectMessage = require('./models/DirectMessage');
          const conversationId = [payload.sender, payload.recipient].sort().join('::');
          await DirectMessage.create({
            conversationId,
            sender: payload.sender,
            recipient: payload.recipient,
            text: payload.text,
            timestamp: payload.timestamp
          });
        } catch (e) {
          console.error('DirectMessage save error:', e.message);
        }

        // Отправляем получателю (если онлайн)
        const recipientSocketId = usernameToSocketId.get(payload.recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new_message', payload);
        }

        // Эхо отправителю (не дублировать на фронте второй раз)
        socket.emit('new_message', payload);
        return;
      } catch (err) {
        console.error('Direct send_message error:', err);
        socket.emit('error', { message: 'Failed to send direct message' });
        return;
      }
    }
    // иначе продолжит обработчик комнат ниже
  });
  
  // Старые WebRTC обработчики удалены - используем только новую систему voice_call_*

  // Простой анонимный чат (для совместимости)
  socket.on('message', (data) => {
    console.log('📨 Message received:', data);
    socket.broadcast.emit('message', {
      type: 'message',
      user: data.user || 'Аноним',
      content: data.content,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  // Присоединение к комнате чата (для старого API)
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👥 User ${socket.id} joined chat ${chatId}`);
  });

  // Отправка сообщения в комнату чата (для старого API чатов)
  socket.on('send_message', async (data) => {
    // Если нет chatId — это не сообщение комнаты, игнорируем, чтобы не мешать 1:1 сообщениям
    if (!data || !data.chatId) {
      return;
    }
    try {
      const { chatId, encryptedMessage, senderId } = data;

      // Сохранение сообщения в БД
      const Message = require('./models/Message');
      const newMessage = new Message({
        chatId,
        senderId,
        encryptedContent: encryptedMessage,
        timestamp: new Date()
      });

      await newMessage.save();

      // Отправка сообщения всем в комнате
      io.to(chatId).emit('new_message', {
        id: newMessage._id,
        chatId,
        senderId,
        encryptedContent: encryptedMessage,
        timestamp: newMessage.timestamp
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Голосовой вызов (маршрутизация по username -> socketId)
  socket.on('voice_call_request', (data) => {
    try {
      const { targetUserId, callerId, offer } = data || {};
      if (!targetUserId) return;
      const targetSocketId = usernameToSocketId.get(targetUserId) || null;
      console.log('voice_call_request:', { from: callerId, to: targetUserId, targetSocketId });
      if (targetSocketId) {
        io.to(targetSocketId).emit('incoming_call', { callerId, offer });
        console.log(`➡️ incoming_call sent to ${targetUserId} via socketId`);
      } else {
        // Резерв: посылаем в комнату пользователя если нет прямого socketId
        io.to(`user:${targetUserId}`).emit('incoming_call', { callerId, offer });
        console.log(`➡️ incoming_call sent to ${targetUserId} via room`);
      }
    } catch (e) {
      console.error('voice_call_request error:', e);
    }
  });

  socket.on('voice_call_answer', (data) => {
    try {
      const { callerId, answer } = data || {};
      if (!callerId) return;
      const callerSocketId = usernameToSocketId.get(callerId) || null;
      console.log('voice_call_answer:', { to: callerId, callerSocketId, answer });
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_answered', { answer });
        console.log(`➡️ call_answered sent to ${callerId} via socketId`);
      } else {
        io.to(`user:${callerId}`).emit('call_answered', { answer });
        console.log(`➡️ call_answered sent to ${callerId} via room`);
      }
    } catch (e) {
      console.error('voice_call_answer error:', e);
    }
  });

  socket.on('ice_candidate', (data) => {
    try {
      const { targetUserId, candidate } = data || {};
      if (!targetUserId) return;
      const targetSocketId = usernameToSocketId.get(targetUserId) || null;
      if (targetSocketId) {
        io.to(targetSocketId).emit('ice_candidate', { candidate });
      }
      io.to(`user:${targetUserId}`).emit('ice_candidate', { candidate });
    } catch (e) {
      console.error('ice_candidate error:', e);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    // Удаляем пользователя из списка
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      if (user.username) {
        usernameToSocketId.delete(user.username);
      }
      
      // Уведомляем всех об уходе пользователя
      socket.broadcast.emit('user_left', { username: user.username });
      
      // Отправляем обновленный список пользователей
      const usersList = Array.from(connectedUsers.values());
      socket.broadcast.emit('users_list', usersList);
      
      console.log(`👤 User left: ${user.username}`);
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Test route для отладки
app.get('/api/test', (req, res) => {
  res.json({ message: 'API работает', timestamp: new Date() });
});

// Удален дубликат - перенесен выше

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Socket.IO ready for connections`);
});
