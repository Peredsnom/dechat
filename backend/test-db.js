const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Проверка подключения к MongoDB...');
console.log('URI:', process.env.MONGODB_URI ? 'Установлен' : 'НЕ установлен');

if (!process.env.MONGODB_URI) {
  console.log('❌ MONGODB_URI не найден в .env файле');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Подключение к MongoDB успешно!');
  console.log('📊 Тестирование создания пользователя...');

  // Тестируем модель User
  const User = require('./models/User');

  // Создаем тестового пользователя
  const testUser = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  });

  return testUser.save();
})
.then((user) => {
  console.log('✅ Тестовый пользователь создан:', user.username);
  console.log('📧 Email:', user.email);
  console.log('🔑 Пароль захэширован:', user.password.startsWith('$2'));

  // Тестируем проверку пароля
  return user.comparePassword('password123');
})
.then((isValid) => {
  console.log('✅ Проверка пароля:', isValid ? 'УСПЕШНО' : 'ОШИБКА');

  console.log('\n🎉 Все тесты пройдены! База данных работает корректно.');
  console.log('📝 Теперь можно регистрировать пользователей через веб-интерфейс');

  process.exit(0);
})
.catch((error) => {
  console.log('❌ Ошибка:', error.message);
  process.exit(1);
});
