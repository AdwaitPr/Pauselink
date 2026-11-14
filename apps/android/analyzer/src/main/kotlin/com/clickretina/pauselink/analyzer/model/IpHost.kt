package com.clickretina.pauselink.analyzer.model

/**
 * Notation used to encode an IP address host in a URL.
 */
enum class IpForm {
    DOTTED_DECIMAL,
    DECIMAL_INTEGER,
    HEX,
    OCTAL,
    MIXED,
    IPV6
}

/**
 * Representation of an IP address host with its canonical representation and reservation status.
 */
data class IpHost(
    val canonical: String,
    val form: IpForm,
    val isPrivateOrReserved: Boolean
)
