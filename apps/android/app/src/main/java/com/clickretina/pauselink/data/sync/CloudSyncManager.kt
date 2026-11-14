package com.clickretina.pauselink.data.sync

import kotlinx.coroutines.flow.StateFlow

/**
 * Manager handling real-time cloud sync and 6-digit device pairing with the PauseLink Web Console.
 */
interface CloudSyncManager {
    val isSyncEnabled: StateFlow<Boolean>
    val pairingStatus: StateFlow<PairingStatus>

    suspend fun setSyncEnabled(enabled: Boolean)
    suspend fun pairWithCode(code: String): Result<Unit>
    suspend fun generatePairingCode(): Result<String>
    suspend fun syncScan(scan: CloudScanDto): Result<Unit>
}
