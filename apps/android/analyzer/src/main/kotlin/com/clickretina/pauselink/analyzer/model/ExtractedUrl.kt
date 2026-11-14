package com.clickretina.pauselink.analyzer.model

/**
 * An individual URL candidate extracted from input text with its span offsets.
 */
data class ExtractedUrl(
    val raw: String,
    val kind: LinkKind,
    val start: Int,
    val end: Int
)
