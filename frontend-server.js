const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 5000;

// Отключение кэширования для разработки
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': false,
    'Last-Modified': false
  });
  next();
});

// Статические файлы (веб-интерфейс)
app.use(express.static(path.join(__dirname, 'backend/public')));

// Проксирование API запросов к backend серверу
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true // Поддержка WebSocket для Socket.io
}));

// Проксирование Socket.io - СНАЧАЛА файлы, потом WebSocket
app.use('/socket.io', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true,
  logLevel: 'silent',
  pathRewrite: {
    '^/socket.io': '/socket.io'
  }
}));

// Главная страница - WhatsApp-подобный чат  
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'backend/public/whatsapp-chat.html'));
});

// Старый интерфейс с регистрацией (на случай если понадобится)
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'backend/public/index.html'));
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Frontend server running on http://0.0.0.0:${PORT}`);
  console.log(`🔗 Proxying API requests to backend on port 3000`);
});