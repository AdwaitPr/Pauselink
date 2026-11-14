package com.clickretina.pauselink.analyzer.unicode

/**
 * Detection and manipulation utilities for zero-width, bidi formatting, and invisible characters.
 * Matches Unicode ranges specified in Section E2 of the PauseLink Blueprint.
 */
object InvisibleChars {

    /**
     * Checks whether the specified Unicode code point is an invisible or formatting character.
     * Includes soft hyphen (U+00AD), zero-width characters (U+200B-U+200F),
     * bidirectional embeddings/overrides (U+202A-U+202E), invisible operators/separators (U+2060-U+2064),
     * bidirectional isolates (U+2066-U+2069), and byte order mark / ZWNBSP (U+FEFF).
     */
    fun isHidden(codePoint: Int): Boolean {
        return codePoint == 0x00AD ||
            (codePoint in 0x200B..0x200F) ||
            (codePoint in 0x202A..0x202E) ||
            (codePoint in 0x2060..0x2064) ||
            (codePoint in 0x2066..0x2069) ||
            codePoint == 0xFEFF
    }

    /**
     * Returns true if the character sequence contains one or more invisible/formatting characters.
     */
    fun containsHidden(text: CharSequence): Boolean {
        var i = 0
        val len = text.length
        while (i < len) {
            val cp = Character.codePointAt(text, i)
            if (isHidden(cp)) return true
            i += Character.charCount(cp)
        }
        return false
    }

    /**
     * Returns the count of invisible/formatting characters in the character sequence.
     */
    fun countHidden(text: CharSequence): Int {
        var count = 0
        var i = 0
        val len = text.length
        while (i < len) {
            val cp = Character.codePointAt(text, i)
            if (isHidden(cp)) count++
            i += Character.charCount(cp)
        }
        return count
    }

    /**
     * Strips all invisible/formatting characters from the character sequence.
     */
    fun stripHidden(text: CharSequence): String {
        val sb = StringBuilder(text.length)
        var i = 0
        val len = text.length
        while (i < len) {
            val cp = Character.codePointAt(text, i)
            if (!isHidden(cp)) {
                sb.appendCodePoint(cp)
            }
            i += Character.charCount(cp)
        }
        return sb.toString()
    }
}
