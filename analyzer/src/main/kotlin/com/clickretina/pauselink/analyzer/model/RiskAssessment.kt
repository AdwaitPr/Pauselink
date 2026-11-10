package com.clickretina.pauselink.analyzer.model

import kotlinx.serialization.Serializable

/**
 * Composite risk score and corresponding risk band for a link or entire analysis session.
 */
@Serializable
data class RiskAssessment(
    val score: Int,
    val band: RiskBand
)
