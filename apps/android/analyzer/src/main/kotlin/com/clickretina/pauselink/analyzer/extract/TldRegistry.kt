package com.clickretina.pauselink.analyzer.extract

import java.util.Locale

/**
 * Registry of valid ICANN Top Level Domains (and RFC 2606 test TLDs) along with
 * common file extension heuristics used during bare-domain URL extraction.
 */
object TldRegistry {

    private val commonFileExtensions = setOf(
        "zip", "mov", "tar", "gz", "rar", "7z", "iso", "bin",
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        "txt", "csv", "json", "xml", "html", "htm",
        "png", "jpg", "jpeg", "gif", "svg", "webp",
        "mp3", "mp4", "wav", "avi", "mkv", "ogg"
    )

    private val tlds: Set<String> by lazy {
        loadTlds()
    }

    private fun loadTlds(): Set<String> {
        val loaded = mutableSetOf<String>()
        val resourceStream = TldRegistry::class.java.getResourceAsStream("/pauselink/icann_tlds.txt")
        if (resourceStream != null) {
            resourceStream.bufferedReader().useLines { lines ->
                lines.forEach { line ->
                    val trimmed = line.trim().lowercase(Locale.ROOT)
                    if (trimmed.isNotEmpty() && !trimmed.startsWith("#")) {
                        loaded.add(trimmed)
                    }
                }
            }
        }

        // Guaranteed baseline including RFC 2606 test domains
        loaded.addAll(listOf("com", "net", "org", "edu", "gov", "example", "test", "invalid", "localhost"))
        return loaded
    }

    /**
     * Checks if the given label is a recognized ICANN or test TLD.
     */
    fun isIcannTld(tld: String): Boolean {
        return tlds.contains(tld.lowercase(Locale.ROOT))
    }

    /**
     * Checks if the given TLD/extension matches a common file extension.
     * Bare domains ending in these extensions require a path or `www.` prefix to be considered a link.
     */
    fun isCommonFileExtension(ext: String): Boolean {
        return commonFileExtensions.contains(ext.lowercase(Locale.ROOT))
    }
}
