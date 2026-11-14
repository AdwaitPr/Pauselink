package com.clickretina.pauselink.analyzer.model

/**
 * Raw input provided to the analyzer along with its origin source.
 */
data class AnalysisInput(
    val text: String,
    val source: InputSource
)
