package com.clickretina.pauselink.analyzer.model

import kotlinx.serialization.Serializable

/**
 * Informational notes regarding input constraints, edge cases, and processing limits.
 */
@Serializable
sealed interface ReportNote {

    @Serializable
    data object NoLinksFound : ReportNote

    @Serializable
    data object InputTruncated : ReportNote

    @Serializable
    data class LinksLimitReached(
        val analysed: Int,
        val found: Int
    ) : ReportNote

    @Serializable
    data class QrNotALink(
        val payloadType: String
    ) : ReportNote
}
