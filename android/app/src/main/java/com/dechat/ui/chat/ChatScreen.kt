package com.dechat.ui.chat

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(navController: NavController) {
    val messages = remember { mutableStateListOf<MessageItem>() }
    val newMessage = remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    // Mock messages for demonstration
    LaunchedEffect(Unit) {
        messages.addAll(listOf(
            MessageItem("1", "Привет, как дела?", "user1", "10:30", true),
            MessageItem("2", "Отлично! Работаю над новым проектом", "user2", "10:31", false),
            MessageItem("3", "Круто! Расскажи подробнее", "user1", "10:32", true),
            MessageItem("4", "Это корпоративный чат с шифрованием. Сейчас разрабатываю Android приложение", "user2", "10:33", false)
        ))

        // Scroll to bottom
        scope.launch {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Общая группа") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = androidx.compose.material.icons.Icons.Default.ArrowBack,
                            contentDescription = "Назад"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { /* TODO: Voice call */ }) {
                        Icon(
                            imageVector = androidx.compose.material.icons.Icons.Default.Call,
                            contentDescription = "Голосовой вызов"
                        )
                    }
                }
            )
        },
        bottomBar = {
            MessageInput(
                value = newMessage.value,
                onValueChange = { newMessage.value = it },
                onSend = {
                    if (newMessage.value.isNotBlank()) {
                        val message = MessageItem(
                            id = System.currentTimeMillis().toString(),
                            content = newMessage.value,
                            senderId = "user1",
                            timestamp = "сейчас",
                            isFromMe = true
                        )
                        messages.add(message)
                        newMessage.value = ""

                        // Scroll to new message
                        scope.launch {
                            listState.animateScrollToItem(messages.size - 1)
                        }
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            state = listState,
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(messages) { message ->
                MessageBubble(message = message)
            }
        }
    }
}

@Composable
fun MessageBubble(message: MessageItem) {
    val alignment = if (message.isFromMe) Alignment.End else Alignment.Start

    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = alignment
    ) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = if (message.isFromMe)
                MaterialTheme.colorScheme.primary
            else
                MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Column(
                modifier = Modifier.padding(12.dp)
            ) {
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (message.isFromMe)
                        MaterialTheme.colorScheme.onPrimary
                    else
                        MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = message.timestamp,
                    style = MaterialTheme.typography.bodySmall,
                    color = if (message.isFromMe)
                        MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
                    else
                        MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessageInput(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit
) {
    Surface(
        tonalElevation = 3.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                placeholder = { Text("Введите сообщение...") },
                modifier = Modifier.weight(1f),
                maxLines = 5,
                shape = RoundedCornerShape(24.dp)
            )

            Spacer(modifier = Modifier.width(8.dp))

            FloatingActionButton(
                onClick = onSend,
                modifier = Modifier.size(48.dp),
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(
                    imageVector = androidx.compose.material.icons.Icons.Default.Send,
                    contentDescription = "Отправить"
                )
            }
        }
    }
}

data class MessageItem(
    val id: String,
    val content: String,
    val senderId: String,
    val timestamp: String,
    val isFromMe: Boolean
)
