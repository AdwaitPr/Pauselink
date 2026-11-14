package com.clickretina.pauselink.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.clickretina.pauselink.ui.history.HistoryScreen
import com.clickretina.pauselink.ui.home.HomeScreen
import com.clickretina.pauselink.ui.privacy.PrivacyScreen
import com.clickretina.pauselink.ui.settings.SettingsScreen

@Composable
fun PauseLinkNavHost(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Route.Home,
        modifier = modifier
    ) {
        composable<Route.Home> {
            HomeScreen(
                onNavigateToHistory = { navController.navigate(Route.History) },
                onNavigateToSettings = { navController.navigate(Route.Settings) }
            )
        }
        composable<Route.History> {
            HistoryScreen(
                onNavigateBack = { navController.navigateUp() }
            )
        }
        composable<Route.Settings> {
            SettingsScreen(
                onNavigateBack = { navController.navigateUp() },
                onNavigateToPrivacy = { navController.navigate(Route.Privacy) }
            )
        }
        composable<Route.Privacy> {
            PrivacyScreen(
                onNavigateBack = { navController.navigateUp() }
            )
        }
    }
}
