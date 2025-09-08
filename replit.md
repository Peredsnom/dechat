# DeChat - Corporate Android Chat Application

## Overview

DeChat is a secure corporate messaging application designed for Android platforms with voice calling capabilities. The system implements end-to-end encryption for message security and consists of a Node.js backend hosted on Replit and an Android frontend built with Kotlin and Jetpack Compose. The application focuses on providing secure, real-time communication for corporate environments with features like encrypted messaging, voice calls via WebRTC, and user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Runtime Environment**: Node.js with Express.js framework for RESTful API endpoints
- **Real-time Communication**: Socket.io for bidirectional event-based communication between clients and server
- **Database**: MongoDB Atlas (cloud-hosted) for persistent data storage
- **Authentication**: JWT (JSON Web Tokens) for stateless user authentication and session management
- **Security Middleware**: 
  - CORS (Cross-Origin Resource Sharing) for cross-domain request handling
  - Express Rate Limiter for preventing abuse and DDoS attacks
  - bcryptjs for password hashing and validation

### Data Models
- **User Model**: Stores user credentials, profile information, online status, and public encryption keys
- **Chat Model**: Manages chat rooms with support for both direct messages and group conversations
- **Message Model**: Handles encrypted message content with support for different message types (text, images, files, voice)

### Security Implementation
- **Message Encryption**: AES encryption applied to message content before database storage
- **Password Security**: bcryptjs hashing with salt for secure password storage
- **Token-based Authentication**: JWT tokens for secure API access with expiration handling
- **Input Validation**: Server-side validation for all user inputs to prevent injection attacks

### API Structure
- **Authentication Routes** (`/api/auth`): User registration, login, and token validation
- **Chat Routes** (`/api/chat`): Chat management, message retrieval, and user communication

### Real-time Features
- **WebSocket Connections**: Socket.io for instant message delivery and typing indicators
- **Online Presence**: Real-time user status updates and last seen timestamps
- **Live Notifications**: Instant push notifications for new messages and chat invitations

## External Dependencies

### Database Services
- **MongoDB Atlas**: Cloud-hosted MongoDB database service for user data, chat messages, and application state persistence

### Node.js Dependencies
- **express**: Web application framework for building RESTful APIs
- **socket.io**: Real-time bidirectional communication library
- **mongoose**: MongoDB object modeling library with schema validation
- **bcryptjs**: Password hashing utility for secure authentication
- **jsonwebtoken**: JWT implementation for secure token-based authentication
- **cors**: Middleware for handling cross-origin requests
- **dotenv**: Environment variable management for secure configuration
- **express-rate-limit**: Rate limiting middleware for API protection

### Development Dependencies
- **nodemon**: Development utility for automatic server restarts during development

### Deployment Platform
- **Replit**: Cloud-based development and hosting platform for the backend server

### Future Android Dependencies (Referenced)
- **Retrofit**: HTTP client library for API communication
- **WebRTC**: Real-time communication framework for voice calling features
- **Jetpack Compose**: Modern Android UI toolkit for building native interfaces