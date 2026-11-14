package com.clickretina.pauselink.analyzer.model

/**
 * The outcome of running URL extraction across text, tracking extracted candidates and limit flags.
 */
data class ExtractionResult(
    val urls: List<ExtractedUrl>,
    val truncatedInput: Boolean,
    val skippedLinks: Int
)
