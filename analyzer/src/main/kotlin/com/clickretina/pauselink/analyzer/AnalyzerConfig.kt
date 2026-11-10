package com.clickretina.pauselink.analyzer

/**
 * Deterministic configuration limits and parameters for input processing, URL extraction, and analysis.
 */
data class AnalyzerConfig(
    val maxInputChars: Int = 10_000,
    val maxLinks: Int = 10,
    val maxUrlLength: Int = 2_048,
    val maxHostLength: Int = 253,
    val analyzerVersion: Int = 1
)
