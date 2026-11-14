package com.clickretina.pauselink.analyzer.model

/**
 * Normalized structural breakdown of a URL for link-level rule evaluation.
 */
data class ParsedUrl(
    val scheme: String?,
    val userInfo: String?,
    val hostAscii: String,
    val hostUnicode: String,
    val labels: List<String>,
    val ip: IpHost?,
    val port: Int?,
    val path: String,
    val query: String?,
    val fragment: String?,
    val registrableDomain: String?,
    val publicSuffix: String?,
    val subdomainLabels: List<String>,
    val hadHiddenChars: Boolean,
    val hostWasPercentEncoded: Boolean
)
