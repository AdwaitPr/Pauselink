package com.clickretina.pauselink.data.sync

import com.clickretina.pauselink.platform.AppLogger
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DefaultCloudSyncManager @Inject constructor() : CloudSyncManager {

    private val _isSyncEnabled = MutableStateFlow(false)
    override val isSyncEnabled: StateFlow<Boolean> = _isSyncEnabled.asStateFlow()

    private val _pairingStatus = MutableStateFlow<PairingStatus>(PairingStatus.Unpaired)
    override val pairingStatus: StateFlow<PairingStatus> = _pairingStatus.asStateFlow()

    override suspend fun setSyncEnabled(enabled: Boolean) {
        _isSyncEnabled.value = enabled
    }

    override suspend fun pairWithCode(code: String): Result<Unit> {
        val trimmed = code.trim()
        if (trimmed.length != 6 || !trimmed.all { it.isDigit() }) {
            _pairingStatus.value = PairingStatus.Error("Invalid 6-digit code format")
            return Result.failure(IllegalArgumentException("Code must be 6 digits"))
        }

        _pairingStatus.value = PairingStatus.Pairing
        return try {
            val userId = "device_user_" + trimmed.take(4)
            _pairingStatus.value = PairingStatus.Paired(userId, System.currentTimeMillis().toString())
            _isSyncEnabled.value = true
            Result.success(Unit)
        } catch (e: Exception) {
            _pairingStatus.value = PairingStatus.Error(e.javaClass.simpleName)
            AppLogger.logError(e.javaClass.simpleName)
            Result.failure(e)
        }
    }

    override suspend fun generatePairingCode(): Result<String> {
        return try {
            val code = (100000..999999).random().toString()
            Result.success(code)
        } catch (e: Exception) {
            AppLogger.logError(e.javaClass.simpleName)
            Result.failure(e)
        }
    }

    override suspend fun syncScan(scan: CloudScanDto): Result<Unit> {
        if (!_isSyncEnabled.value) {
            return Result.success(Unit) // Offline/local only
        }

        return try {
            Result.success(Unit)
        } catch (e: Exception) {
            AppLogger.logError(e.javaClass.simpleName)
            Result.failure(e)
        }
    }
}
