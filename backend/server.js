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

// Socket.IO обработчики
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Присоединение к комнате чата
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👥 User ${socket.id} joined chat ${chatId}`);
  });

  // Отправка сообщения
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
