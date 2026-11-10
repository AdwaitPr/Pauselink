package com.clickretina.pauselink.analyzer.extract

import com.clickretina.pauselink.analyzer.unicode.InvisibleChars
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TextSanitizerTest {

    @Test
    fun prepare_emptyInput_returnsEmptyResult() {
        val result = TextSanitizer.prepare("")
        assertEquals("", result.value)
        assertFalse(result.wasTruncated)
        assertFalse(result.hadHiddenChars)
    }

    @Test
    fun prepare_normalizesLineEndings() {
        val input = "Line1\r\nLine2\rLine3\nLine4"
        val result = TextSanitizer.prepare(input)
        assertEquals("Line1\nLine2\nLine3\nLine4", result.value)
        assertFalse(result.wasTruncated)
        assertFalse(result.hadHiddenChars)
    }

    @Test
    fun prepare_preservesCase() {
        val input = "HTTPS://Example.COM/Path?Param=VALUE"
        val result = TextSanitizer.prepare(input)
        assertEquals("HTTPS://Example.COM/Path?Param=VALUE", result.value)
    }

    @Test
    fun prepare_truncatesAtMaxChars() {
        val input = "a".repeat(10_500)
        val result = TextSanitizer.prepare(input, maxChars = 10_000)
        assertEquals(10_000, result.value.length)
        assertTrue(result.wasTruncated)
    }

    @Test
    fun prepare_detectsHiddenCharacters() {
        // Zero-width space U+200B
        val input = "https://exam\u200Bple.com"
        val result = TextSanitizer.prepare(input)
        assertTrue(result.hadHiddenChars)
        // Hidden char is preserved in text value, not silently deleted
        assertEquals("https://exam\u200Bple.com", result.value)
    }

    @Test
    fun prepare_detectsSoftHyphen() {
        // Soft hyphen U+00AD
        val input = "https://pay\u00ADpal.example"
        val result = TextSanitizer.prepare(input)
        assertTrue(result.hadHiddenChars)
    }

    @Test
    fun prepare_detectsBidiOverride() {
        // RLO U+202E
        val input = "https://example.com/\u202Eexe.doc"
        val result = TextSanitizer.prepare(input)
        assertTrue(result.hadHiddenChars)
    }

    @Test
    fun invisibleChars_stripHidden_removesOnlyHiddenChars() {
        val input = "he\u200Bl\u00ADlo\u202Eworld\uFEFF!"
        val stripped = InvisibleChars.stripHidden(input)
        assertEquals("helloworld!", stripped)
    }
}
