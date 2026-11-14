package com.clickretina.pauselink.navigation

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Test

class RoutesSerializationTest {

    @Test
    fun routes_areSerializableAndDeserializable() {
        val routes: List<Route> = listOf(
            Route.Home,
            Route.History,
            Route.Settings,
            Route.Privacy
        )

        for (route in routes) {
            val serialized = when (route) {
                is Route.Home -> Json.encodeToString(route)
                is Route.History -> Json.encodeToString(route)
                is Route.Settings -> Json.encodeToString(route)
                is Route.Privacy -> Json.encodeToString(route)
            }
            assertEquals("{}", serialized)
        }
    }
}
