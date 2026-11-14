package com.clickretina.pauselink

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NavigationTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun navigateFromHomeToHistoryAndBack() {
        // Assert on Home
        composeTestRule.onNodeWithTag("home_title").assertIsDisplayed()

        // Tap History
        composeTestRule.onNodeWithTag("home_history_button").performClick()
        composeTestRule.onNodeWithTag("history_title").assertIsDisplayed()

        // Navigate Back
        composeTestRule.onNodeWithTag("history_back_button").performClick()
        composeTestRule.onNodeWithTag("home_title").assertIsDisplayed()
    }

    @Test
    fun navigateFromHomeToSettingsToPrivacyAndBack() {
        // Assert on Home
        composeTestRule.onNodeWithTag("home_title").assertIsDisplayed()

        // Tap Settings
        composeTestRule.onNodeWithTag("home_settings_button").performClick()
        composeTestRule.onNodeWithTag("settings_title").assertIsDisplayed()

        // Tap Privacy Information
        composeTestRule.onNodeWithTag("settings_privacy_button").performClick()
        composeTestRule.onNodeWithTag("privacy_title").assertIsDisplayed()

        // Back to Settings
        composeTestRule.onNodeWithTag("privacy_back_button").performClick()
        composeTestRule.onNodeWithTag("settings_title").assertIsDisplayed()

        // Back to Home
        composeTestRule.onNodeWithTag("settings_back_button").performClick()
        composeTestRule.onNodeWithTag("home_title").assertIsDisplayed()
    }
}
