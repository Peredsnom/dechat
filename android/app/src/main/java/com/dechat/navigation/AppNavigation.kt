package com.dechat.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.dechat.ui.auth.AuthScreen
import com.dechat.ui.chat.ChatListScreen
import com.dechat.ui.chat.ChatScreen
import com.dechat.ui.splash.SplashScreen

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(navController = navController)
        }

        composable(Screen.Auth.route) {
            AuthScreen(navController = navController)
        }

        composable(Screen.ChatList.route) {
            ChatListScreen(navController = navController)
        }

        composable(Screen.Chat.route) {
            ChatScreen(navController = navController)
        }
    }
}

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Auth : Screen("auth")
    object ChatList : Screen("chat_list")
    object Chat : Screen("chat/{chatId}") {
        fun createRoute(chatId: String) = "chat/$chatId"
    }
}
