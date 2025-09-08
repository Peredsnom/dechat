const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Проверка подключения к MongoDB Atlas...');
console.log('URI:', process.env.MONGODB_URI ? '✅ Установлен' : '❌ НЕ установлен');

if (!process.env.MONGODB_URI) {
  console.log('❌ Ошибка: MONGODB_URI не найден в файле .env');
  console.log('📝 Создайте файл backend/.env со следующим содержимым:');
  console.log('MONGODB_URI=mongodb+srv://ВАШ_USERNAME:ВАШ_PASSWORD@ВАШ_CLUSTER.mongodb.net/dechat?retryWrites=true&w=majority');
  console.log('PORT=3000');
  console.log('JWT_SECRET=dechat_local_development_secret_key_2024');
  process.exit(1);
}

console.log('🔌 Подключение к MongoDB...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 секунд таймаут
})
.then(() => {
  console.log('✅ Подключение к MongoDB Atlas успешно!');
  console.log('📊 Тестирование создания коллекций...');

  // Проверка моделей
  const User = require('./models/User');
  const Chat = require('./models/Chat');
  const Message = require('./models/Message');

  console.log('✅ Модели загружены успешно');
  console.log('🎉 MongoDB Atlas готов к работе!');

  return mongoose.connection.close();
})
.catch((error) => {
  console.log('❌ Ошибка подключения к MongoDB:');
  console.log('📋 Детали ошибки:', error.message);

  if (error.message.includes('authentication failed')) {
    console.log('💡 Решение: Проверьте логин и пароль в URI');
  } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
    console.log('💡 Решение: Проверьте правильность cluster name в URI');
  } else if (error.message.includes('not authorized')) {
    console.log('💡 Решение: Проверьте права пользователя в MongoDB Atlas');
  }

  console.log('\n🔧 Шаги по исправлению:');
  console.log('1. Перейдите в MongoDB Atlas → Database Access');
  console.log('2. Создайте пользователя с правами Read and write');
  console.log('3. Перейдите в Network Access → добавьте IP 0.0.0.0/0');
  console.log('4. Скопируйте connection string из Connect → Connect your application');
  console.log('5. Замените <password> и <database> в URI');

  process.exit(1);
});
