package com.clickretina.pauselink.analyzer.model

import kotlinx.serialization.Serializable

/**
 * Complete, immutable report produced by the analyzer engine for an analysis request.
 */
@Serializable
data class AnalysisReport(
    val source: InputSource,
    val links: List<LinkReport>,
    val messageFindings: List<Finding>,
    val overall: RiskAssessment,
    val notes: List<ReportNote>,
    val analyzerVersion: Int
)
