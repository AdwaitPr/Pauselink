package com.clickretina.pauselink.analyzer.model

import kotlinx.serialization.Serializable

/**
 * Standard keys identifying specific pieces of structured evidence supporting a finding.
 */
enum class EvidenceKey {
    OBSERVED_HOST,
    DECODED_HOST,
    REGISTRABLE_DOMAIN,
    SCHEME,
    PORT,
    SCRIPTS,
    CHARACTERS,
    MATCHED_BRAND,
    OFFICIAL_DOMAIN,
    MATCH_KIND,
    LABEL_COUNT,
    SERVICE,
    PARAM_NAME,
    IP_FORM,
    PHRASE,
    WORD,
    PAYLOAD_TYPE,
    USERINFO_PRESENT
}

/**
 * Key-value evidence item documenting the concrete observable artifact that triggered a rule.
 */
@Serializable
data class Evidence(
    val key: EvidenceKey,
    val value: String
)
