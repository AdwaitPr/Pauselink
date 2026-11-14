package com.clickretina.pauselink.analyzer.model

/**
 * Syntactic classification of how a link candidate was represented in the input text.
 */
enum class LinkKind {
    SCHEME_PREFIXED,
    WWW_PREFIXED,
    BARE_DOMAIN,
    QR_PAYLOAD
}
