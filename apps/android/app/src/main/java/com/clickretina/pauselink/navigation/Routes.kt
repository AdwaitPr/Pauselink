package com.clickretina.pauselink.navigation

import kotlinx.serialization.Serializable

/**
 * Type-safe navigation routes for PauseLink.
 */
sealed interface Route {

    @Serializable
    data object Home : Route

    @Serializable
    data object History : Route

    @Serializable
    data object Settings : Route

    @Serializable
    data object Privacy : Route
}
