package com.clickretina.pauselink.analyzer.extract

import com.clickretina.pauselink.analyzer.AnalyzerConfig
import com.clickretina.pauselink.analyzer.model.LinkKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class UrlExtractorTest {

    private val extractor = DefaultUrlExtractor()

    @Test
    fun tableDrivenExtractionEdgeTests() {
        val stream = javaClass.getResourceAsStream("/testdata/extraction_edge.csv")
            ?: error("extraction_edge.csv fixture not found")

        stream.bufferedReader().useLines { lines ->
            val iterator = lines.iterator()
            if (!iterator.hasNext()) return@useLines
            val header = iterator.next() // Skip header: id,input,expected_count,expected_urls

            while (iterator.hasNext()) {
                val line = iterator.next().trim()
                if (line.isEmpty()) continue

                val parts = parseCsvLine(line)
                val id = parts[0]
                var input = parts[1]
                val expectedCount = parts[2].toInt()
                val expectedUrls = if (parts.size > 3 && parts[3].isNotEmpty()) {
                    parts[3].split('|').map {
                        it.replace("\\u200B", "\u200B")
                    }
                } else {
                    emptyList()
                }

                // Unescape unicode escape sequences like \u200B if present in input
                if (input.contains("\\u200B")) {
                    input = input.replace("\\u200B", "\u200B")
                }

                val result = extractor.extract(input)
                assertEquals(
                    "Failure in test case $id for input: '$input'",
                    expectedCount,
                    result.urls.size
                )

                if (expectedUrls.isNotEmpty()) {
                    val actualUrls = result.urls.map { it.raw }
                    assertEquals(
                        "URL mismatch in test case $id for input: '$input'",
                        expectedUrls,
                        actualUrls
                    )
                }
            }
        }
    }

    @Test
    fun twelveLinksLimit_returnsTenAndSkipsTwo() {
        val config = AnalyzerConfig(maxLinks = 10)
        val customExtractor = DefaultUrlExtractor(config)

        val input = (1..12).joinToString(separator = " ") { "https://site$it.example" }
        val result = customExtractor.extract(input)

        assertEquals("Should cap at maxLinks (10)", 10, result.urls.size)
        assertEquals("Should record 2 skipped links", 2, result.skippedLinks)
        assertFalse("Input was within maxInputChars limit", result.truncatedInput)

        // Verify first 10 URLs are preserved in order
        for (i in 1..10) {
            assertEquals("https://site$i.example", result.urls[i - 1].raw)
        }
    }

    @Test
    fun emptyAndBlankInputs_returnZeroLinks() {
        val emptyResult = extractor.extract("")
        assertEquals(0, emptyResult.urls.size)
        assertEquals(0, emptyResult.skippedLinks)
        assertFalse(emptyResult.truncatedInput)

        val whitespaceResult = extractor.extract("   \t\n  \r\n   ")
        assertEquals(0, whitespaceResult.urls.size)
        assertEquals(0, whitespaceResult.skippedLinks)
        assertFalse(whitespaceResult.truncatedInput)
    }

    @Test
    fun linkKinds_areAccuratelyClassified() {
        val input = "https://example.com www.example.org example.net/path"
        val result = extractor.extract(input)

        assertEquals(3, result.urls.size)
        assertEquals(LinkKind.SCHEME_PREFIXED, result.urls[0].kind)
        assertEquals(LinkKind.WWW_PREFIXED, result.urls[1].kind)
        assertEquals(LinkKind.BARE_DOMAIN, result.urls[2].kind)
    }

    @Test
    fun deduplication_preservesFirstSeenOrder() {
        val input = "https://first.example https://second.example https://first.example https://third.example"
        val result = extractor.extract(input)

        assertEquals(3, result.urls.size)
        assertEquals("https://first.example", result.urls[0].raw)
        assertEquals("https://second.example", result.urls[1].raw)
        assertEquals("https://third.example", result.urls[2].raw)
    }

    @Test
    fun inputTruncationFlag_isSetWhenInputExceedsLimit() {
        val config = AnalyzerConfig(maxInputChars = 100)
        val customExtractor = DefaultUrlExtractor(config)

        val longInput = "https://example.com/ " + "a".repeat(200)
        val result = customExtractor.extract(longInput)

        assertTrue(result.truncatedInput)
        assertEquals(1, result.urls.size)
        assertEquals("https://example.com/", result.urls[0].raw)
    }

    private fun parseCsvLine(line: String): List<String> {
        val tokens = mutableListOf<String>()
        var inQuotes = false
        val sb = StringBuilder()
        var i = 0
        while (i < line.length) {
            val c = line[i]
            when {
                c == '"' -> inQuotes = !inQuotes
                c == ',' && !inQuotes -> {
                    tokens.add(sb.toString())
                    sb.setLength(0)
                }
                else -> sb.append(c)
            }
            i++
        }
        tokens.add(sb.toString())
        return tokens
    }
}
