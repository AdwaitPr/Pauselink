package com.clickretina.pauselink.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.clickretina.pauselink.navigation.PauseLinkNavHost
import com.clickretina.pauselink.ui.theme.PAUSELINKTheme

/**
 * Shared Compose root composable for PauseLink.
 */
@Composable
fun PauseLinkRoot(
    modifier: Modifier = Modifier
) {
    PAUSELINKTheme {
        Surface(
            modifier = modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            PauseLinkNavHost()
        }
    }
}
