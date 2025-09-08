# DeChat - Корпоративный чат для Android

## Описание проекта
Безопасный корпоративный чат для Android с голосовыми вызовами. Переписка хранится в зашифрованном виде на сервере.

## Архитектура

### Backend
- **Replit** - бесплатный хостинг
- **Node.js + Express** - API сервер
- **Socket.io** - real-time коммуникация
- **MongoDB Atlas** - база данных (бесплатный tier)

### Frontend
- **Android (Kotlin + Jetpack Compose)**
- **WebRTC** - голосовые вызовы
- **AES шифрование** - защита сообщений

### Безопасность
- End-to-End шифрование сообщений
- JWT аутентификация
- HTTPS соединения

## Установка и запуск

### Backend (Replit)
1. Создайте новый Replit проект
2. Выберите Node.js шаблон
3. Установите зависимости:
```bash
npm install express socket.io mongoose bcryptjs jsonwebtoken cors
```

### Android
1. Создайте новый Android проект в Android Studio
2. Добавьте зависимости в `build.gradle`:
```kotlin
dependencies {
    // Jetpack Compose
    implementation 'androidx.compose.ui:ui'
    implementation 'androidx.compose.material3:material3'

    // Network
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'io.socket:socket.io-client:2.0.0'

    // WebRTC
    implementation 'org.webrtc:google-webrtc:1.0.32006'

    // Database
    implementation 'androidx.room:room-runtime:2.6.1'
}
```

## Структура проекта
```
dechat/
├── backend/           # Replit backend
│   ├── server.js      # Главный сервер
│   ├── models/        # Модели MongoDB
│   ├── routes/        # API маршруты
│   └── middleware/    # Middleware функции
├── android/           # Android приложение
│   ├── app/
│   │   ├── src/main/java/com/dechat/
│   │   └── src/main/res/
│   └── build.gradle
└── docs/             # Документация
```
