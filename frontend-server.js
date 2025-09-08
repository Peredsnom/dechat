const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 5000;

// Статические файлы (веб-интерфейс)
app.use(express.static(path.join(__dirname, 'backend/public')));

// Проксирование API запросов к backend серверу
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true // Поддержка WebSocket для Socket.io
}));

// Проксирование Socket.io статических файлов
app.use('/socket.io/socket.io.js', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true
}));

// Проксирование Socket.io WebSocket соединений
app.use('/socket.io', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true
}));

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'backend/public/index.html'));
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Frontend server running on http://0.0.0.0:${PORT}`);
  console.log(`🔗 Proxying API requests to backend on port 3000`);
});