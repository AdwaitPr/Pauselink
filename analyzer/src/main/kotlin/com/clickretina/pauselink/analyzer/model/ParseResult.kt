package com.clickretina.pauselink.analyzer.model

/**
 * Reasons why a candidate URL string could not be parsed into a valid URL structure.
 */
enum class RejectReason {
    EMPTY,
    NO_HOST,
    INVALID_PORT,
    INVALID_HOST_CHARACTERS,
    TOO_LONG,
    MALFORMED_PUNYCODE
}

/**
 * Result of parsing a candidate URL string into a structured representation or explicit rejection.
 */
sealed interface ParseResult {
    data class Parsed(val url: ParsedUrl) : ParseResult
    data class Rejected(val reason: RejectReason) : ParseResult
}
