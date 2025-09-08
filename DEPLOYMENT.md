# 🚀 Развертывание DeChat

## Предварительные требования

### Для Backend (Replit)
1. Аккаунт на [Replit](https://replit.com)
2. Аккаунт MongoDB Atlas (бесплатный)

### Для Android
1. Android Studio Arctic Fox или новее
2. JDK 11 или новее
3. Android SDK API 24+

## Развертывание Backend

### Шаг 1: Настройка MongoDB Atlas
1. Перейдите на [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Создайте бесплатный кластер
3. Создайте пользователя базы данных
4. Получите connection string

### Шаг 2: Настройка Replit проекта
1. Создайте новый Replit проект:
   - Выберите "Node.js" как шаблон
   - Назовите проект "dechat-backend"

2. Загрузите файлы backend:
   - `package.json`
   - `server.js`
   - `models/` (все файлы)
   - `routes/` (все файлы)

3. Установите зависимости:
```bash
npm install
```

4. Настройте переменные окружения:
Создайте файл `.env` в корне проекта:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_here
PORT=3000
```

5. Запустите сервер:
```bash
npm start
```

6. Получите URL вашего Replit проекта (например: `https://dechat-backend.yourusername.replit.dev`)

## Настройка Android приложения

### Шаг 1: Импорт проекта
1. Откройте Android Studio
2. Выберите "Open" и укажите папку `android/`

### Шаг 2: Настройка зависимостей
Android Studio автоматически загрузит все зависимости из `build.gradle.kts`

### Шаг 3: Настройка API URL
Отредактируйте файл конфигурации для указания URL вашего backend:
```kotlin
// В файле где настраивается Retrofit
const val BASE_URL = "https://dechat-backend.yourusername.replit.dev"
```

## Структура проекта

```
dechat/
├── backend/                    # Replit backend
│   ├── package.json           # Зависимости Node.js
│   ├── server.js             # Главный сервер Express + Socket.io
│   ├── models/               # MongoDB модели
│   │   ├── User.js          # Модель пользователя
│   │   ├── Chat.js          # Модель чата
│   │   └── Message.js       # Модель сообщения
│   └── routes/               # API маршруты
│       ├── auth.js          # Аутентификация
│       └── chat.js          # Чат API
├── android/                   # Android приложение
│   ├── app/
│   │   ├── build.gradle.kts # Gradle конфигурация
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/dechat/
│   │       │   ├── MainActivity.kt
│   │       │   ├── navigation/
│   │       │   ├── ui/
│   │       │   │   ├── auth/
│   │       │   │   ├── chat/
│   │       │   │   ├── splash/
│   │       │   │   └── theme/
│   │       │   └── service/
│   │       └── res/values/
│   └── build.gradle.kts      # Project-level Gradle
└── docs/                     # Документация
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `GET /api/auth/profile` - Профиль пользователя

### Чат
- `GET /api/chat/chats` - Список чатов
- `POST /api/chat/chats` - Создать чат
- `GET /api/chat/chats/:chatId/messages` - Сообщения чата
- `POST /api/chat/chats/:chatId/messages` - Отправить сообщение

### WebSocket Events
- `join_chat` - Присоединиться к чату
- `send_message` - Отправить сообщение
- `new_message` - Новое сообщение
- `voice_call_request` - Запрос голосового вызова
- `voice_call_answer` - Ответ на вызов

## Безопасность

### Шифрование
- **Сообщения**: AES-256 шифрование на устройстве
- **Передача**: HTTPS для всех соединений
- **Аутентификация**: JWT токены

### WebRTC для голосовых вызовов
- **STUN/TURN сервера**: Настроены для обхода NAT
- **Шифрование**: DTLS + SRTP для медиа-потоков
- **ICE**: Для установления P2P соединений

## Мониторинг и поддержка

### Логи
- Backend логи доступны в Replit console
- Android логи через Android Studio Logcat

### Отладка
- Используйте `console.log()` в backend
- Используйте `Log.d()` в Android

## Следующие шаги

1. **Реализовать шифрование** - Добавить AES шифрование сообщений
2. **Добавить голосовые вызовы** - Интегрировать WebRTC
3. **Push-уведомления** - Firebase Cloud Messaging
4. **Файловые вложения** - Поддержка изображений и документов
5. **Синхронизация** - Offline режим и синхронизация

## Troubleshooting

### Backend проблемы
- Проверьте MongoDB connection string
- Убедитесь что все зависимости установлены (`npm install`)
- Проверьте логи в Replit console

### Android проблемы
- Очистите кэш Gradle: `File > Invalidate Caches / Restart`
- Проверьте target SDK и min SDK версии
- Убедитесь что все разрешения добавлены в Manifest

### Сетевые проблемы
- Проверьте что backend URL правильный
- Убедитесь что backend запущен
- Проверьте firewall настройки
