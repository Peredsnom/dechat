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

// Хранилище подключенных пользователей
const connectedUsers = new Map(); // socketId -> userData

// Socket.IO обработчики
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Пользователь присоединился к чату
  socket.on('user_joined', (data) => {
    console.log(`👤 User joined: ${data.username}`);
    
    // Сохраняем пользователя
    connectedUsers.set(socket.id, {
      username: data.username,
      online: true,
      socketId: socket.id
    });
    
    // Уведомляем всех о новом пользователе
    socket.broadcast.emit('user_joined', { username: data.username });
    
    // Отправляем список всех пользователей новому клиенту
    const usersList = Array.from(connectedUsers.values());
    socket.emit('users_list', usersList);
    
    // Отправляем обновленный список всем остальным
    socket.broadcast.emit('users_list', usersList);
  });
  
  // Отправка личного сообщения
  socket.on('send_message', (data) => {
    console.log(`💬 Message from ${data.sender} to ${data.recipient}: ${data.text}`);
    
    // Находим сокет получателя
    const recipientSocket = Array.from(connectedUsers.entries())
      .find(([id, user]) => user.username === data.recipient);
    
    if (recipientSocket) {
      // Отправляем сообщение получателю
      io.to(recipientSocket[0]).emit('new_message', data);
    }
    
    // Также отправляем отправителю для синхронизации
    socket.emit('new_message', data);
  });
  
  // WebRTC обработчики для голосовых звонков
  socket.on('call_offer', (data) => {
    console.log(`📞 Call offer from ${data.caller} to ${data.callee}`);
    
    // Находим сокет получателя
    const recipientSocket = Array.from(connectedUsers.entries())
      .find(([id, user]) => user.username === data.callee);
    
    if (recipientSocket) {
      io.to(recipientSocket[0]).emit('call_offer', data);
    }
  });
  
  socket.on('call_answer', (data) => {
    console.log(`📞 Call answer from ${data.callee} to ${data.caller}`);
    
    // Находим сокет звонящего
    const callerSocket = Array.from(connectedUsers.entries())
      .find(([id, user]) => user.username === data.caller);
    
    if (callerSocket) {
      io.to(callerSocket[0]).emit('call_answer', data);
    }
  });
  
  socket.on('ice_candidate', (data) => {
    console.log(`🧊 ICE candidate for ${data.targetUser}`);
    
    // Находим сокет получателя
    const targetSocket = Array.from(connectedUsers.entries())
      .find(([id, user]) => user.username === data.targetUser);
    
    if (targetSocket) {
      io.to(targetSocket[0]).emit('ice_candidate', data);
    }
  });
  
  socket.on('call_ended', (data) => {
    console.log(`📞 Call ended with ${data.targetUser}`);
    
    // Находим сокет получателя
    const targetSocket = Array.from(connectedUsers.entries())
      .find(([id, user]) => user.username === data.targetUser);
    
    if (targetSocket) {
      io.to(targetSocket[0]).emit('call_ended', data);
    }
  });

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

  // Отправка сообщения (для старого API)
  socket.on('send_message', async (data) => {
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

  // Голосовой вызов
  socket.on('voice_call_request', (data) => {
    const { targetUserId, callerId, offer } = data;
    socket.to(targetUserId).emit('incoming_call', {
      callerId,
      offer
    });
  });

  socket.on('voice_call_answer', (data) => {
    const { callerId, answer } = data;
    socket.to(callerId).emit('call_answered', { answer });
  });

  socket.on('ice_candidate', (data) => {
    const { targetUserId, candidate } = data;
    socket.to(targetUserId).emit('ice_candidate', { candidate });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    // Удаляем пользователя из списка
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      
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
