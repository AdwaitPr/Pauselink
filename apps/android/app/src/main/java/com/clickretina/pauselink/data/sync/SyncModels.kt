package com.clickretina.pauselink.data.sync

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class CloudDeviceOrigin {
    @SerialName("ANDROID") ANDROID,
    @SerialName("WEB") WEB
}

@Serializable
data class CloudScanDto(
    val id: String? = null,
    @SerialName("user_id") val userId: String,
    val source: String,
    @SerialName("input_text") val inputText: String,
    @SerialName("overall_score") val overallScore: Int,
    @SerialName("risk_band") val riskBand: String,
    @SerialName("links_count") val linksCount: Int,
    @SerialName("report_json") val reportJson: String,
    @SerialName("device_origin") val deviceOrigin: CloudDeviceOrigin = CloudDeviceOrigin.ANDROID,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class CloudProfileDto(
    val id: String,
    val email: String? = null,
    @SerialName("is_anonymous") val isAnonymous: Boolean = true,
    @SerialName("pairing_code") val pairingCode: String? = null,
    @SerialName("device_sync_enabled") val deviceSyncEnabled: Boolean = false
)

sealed interface PairingStatus {
    data object Unpaired : PairingStatus
    data object Pairing : PairingStatus
    data class Paired(val userId: String, val pairedAt: String) : PairingStatus
    data class Error(val message: String) : PairingStatus
}
