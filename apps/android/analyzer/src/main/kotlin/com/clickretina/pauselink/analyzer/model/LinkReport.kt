package com.clickretina.pauselink.analyzer.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

/**
 * Detailed analysis report for a single extracted link.
 */
@Serializable
data class LinkReport(
    val displayUrl: String,
    val host: String?,
    val decodedHost: String?,
    val registrableDomain: String?,
    val findings: List<Finding>,
    val assessment: RiskAssessment,
    @Transient val rawUrl: String? = null
)
