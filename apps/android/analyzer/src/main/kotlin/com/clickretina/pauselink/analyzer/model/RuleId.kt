package com.clickretina.pauselink.analyzer.model

/**
 * Stable, permanent identifiers for analysis rules across URL, message, and QR domains.
 * Codes must never be renumbered or changed as UI resources and persisted history depend on them.
 */
enum class RuleId(val code: String) {
    INSECURE_SCHEME("U001"),
    IP_ADDRESS_HOST("U002"),
    USERINFO_IN_URL("U003"),
    PUNYCODE_DOMAIN("U004"),
    MIXED_SCRIPT_LABEL("U005"),
    CONFUSABLE_CHARACTERS("U006"),
    BRAND_LOOKALIKE("U007"),
    BRAND_IN_HOST("U008"),
    DOMAIN_IN_SUBDOMAIN("U009"),
    COMPLEX_HOST("U010"),
    URL_SHORTENER("U011"),
    UNUSUAL_PORT("U012"),
    REDIRECT_PARAMETER("U013"),
    HIDDEN_CHARACTERS("U014"),
    ENCODED_HOST("U015"),
    UNEXPECTED_SCHEME("U016"),
    SENSITIVE_WORDS("U017"),
    URGENCY_LANGUAGE("M001"),
    PAYMENT_REQUEST("M002"),
    CREDENTIAL_REQUEST("M003"),
    THREAT_LANGUAGE("M004"),
    REWARD_LURE("M005"),
    SENDER_LINK_MISMATCH("M006"),
    QR_PAYMENT_REQUEST("Q001"),
    QR_ACTION_PAYLOAD("Q002");

    companion object {
        fun fromCode(code: String): RuleId? = entries.firstOrNull { it.code == code }
    }
}
