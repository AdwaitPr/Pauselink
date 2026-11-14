package com.clickretina.pauselink.data.sync

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class CloudSyncManagerTest {

    private lateinit var syncManager: DefaultCloudSyncManager

    @Before
    fun setUp() {
        syncManager = DefaultCloudSyncManager()
    }

    @Test
    fun defaultStateIsUnpairedAndDisabled() {
        assertFalse(syncManager.isSyncEnabled.value)
        assertEquals(PairingStatus.Unpaired, syncManager.pairingStatus.value)
    }

    @Test
    fun setSyncEnabledUpdatesState() = runTest {
        syncManager.setSyncEnabled(true)
        assertTrue(syncManager.isSyncEnabled.value)

        syncManager.setSyncEnabled(false)
        assertFalse(syncManager.isSyncEnabled.value)
    }

    @Test
    fun pairWithValidSixDigitCodeSucceeds() = runTest {
        val result = syncManager.pairWithCode("849201")
        assertTrue(result.isSuccess)
        assertTrue(syncManager.isSyncEnabled.value)
        assertTrue(syncManager.pairingStatus.value is PairingStatus.Paired)
    }

    @Test
    fun pairWithInvalidCodeFails() = runTest {
        val shortResult = syncManager.pairWithCode("123")
        assertFalse(shortResult.isSuccess)
        assertTrue(syncManager.pairingStatus.value is PairingStatus.Error)

        val nonDigitResult = syncManager.pairWithCode("abc123")
        assertFalse(nonDigitResult.isSuccess)
    }

    @Test
    fun generatePairingCodeReturnsSixDigits() = runTest {
        val result = syncManager.generatePairingCode()
        assertTrue(result.isSuccess)
        val code = result.getOrNull()
        assertTrue(code != null && code.length == 6 && code.all { it.isDigit() })
    }
}
