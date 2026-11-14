package com.clickretina.pauselink.analyzer.extract

import com.clickretina.pauselink.analyzer.unicode.InvisibleChars

/**
 * Result of preparing input text, carrying the normalized text and metadata flags.
 */
data class SanitizedText(
    val value: String,
    val wasTruncated: Boolean,
    val hadHiddenChars: Boolean
)

/**
 * Sanitizes input text by normalizing line endings and enforcing character limits
 * while preserving character cases and detecting invisible/formatting characters.
 */
object TextSanitizer {

    /**
     * Prepares raw input text:
     * - Normalizes CRLF and CR line endings to LF.
     * - Preserves case (paths and parameters are case-sensitive).
     * - Detects invisible/formatting characters without silently deleting them.
     * - Caps text length at [maxChars].
     */
    fun prepare(input: String, maxChars: Int = 10_000): SanitizedText {
        if (input.isEmpty()) {
            return SanitizedText(value = "", wasTruncated = false, hadHiddenChars = false)
        }

        val hasHidden = InvisibleChars.containsHidden(input)

        // Normalize line endings: \r\n -> \n, \r -> \n
        val normalized = normalizeLineEndings(input)

        val wasTruncated = normalized.length > maxChars
        val value = if (wasTruncated) normalized.substring(0, maxChars) else normalized

        return SanitizedText(
            value = value,
            wasTruncated = wasTruncated,
            hadHiddenChars = hasHidden
        )
    }

    /**
     * Checks whether the given character sequence contains hidden or formatting characters.
     */
    fun hasHiddenChars(sequence: CharSequence): Boolean {
        return InvisibleChars.containsHidden(sequence)
    }

    /**
     * Strips hidden characters from the given character sequence.
     */
    fun stripHiddenChars(sequence: CharSequence): String {
        return InvisibleChars.stripHidden(sequence)
    }

    private fun normalizeLineEndings(text: String): String {
        val len = text.length
        val sb = StringBuilder(len)
        var i = 0
        while (i < len) {
            val c = text[i]
            when {
                c == '\r' -> {
                    sb.append('\n')
                    if (i + 1 < len && text[i + 1] == '\n') {
                        i++ // Skip \n in \r\n
                    }
                }
                else -> sb.append(c)
            }
            i++
        }
        return sb.toString()
    }
}
