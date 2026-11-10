package com.clickretina.pauselink.analyzer.extract

import com.clickretina.pauselink.analyzer.AnalyzerConfig
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.system.measureTimeMillis

/**
 * Adversarial input timing tests conforming to Section F5 of the PauseLink Blueprint.
 * Ensures the linear scan implementation does not exhibit polynomial or exponential
 * backtracking (ReDoS) behavior under pathological inputs.
 *
 * Note: Timing benchmarks reflect the local JVM environment (MacBook Apple Silicon / JBR 25)
 * and provide robustness validation against catastrophic backtracking rather than
 * absolute universal performance guarantees.
 */
class ExtractionPathologicalTimingTest {

    // Use a large input limit for testing raw extractor performance on oversized strings
    private val config = AnalyzerConfig(maxInputChars = 500_000)
    private val extractor = DefaultUrlExtractor(config)

    @Test
    fun pathologicalString_hundredThousandAs_completesWellWithinBudget() {
        val input = "a".repeat(100_000)
        val elapsed = measureTimeMillis {
            val result = extractor.extract(input)
            assertTrue(result.urls.isEmpty())
        }
        // Generous budget: 2,000 ms (typically executes in < 50 ms)
        assertTrue("Expected < 2000 ms, took ${elapsed}ms", elapsed < 2_000)
    }

    @Test
    fun pathologicalString_fiftyThousandHttpSchemes_completesWellWithinBudget() {
        val input = "http://".repeat(50_000)
        val elapsed = measureTimeMillis {
            extractor.extract(input)
        }
        assertTrue("Expected < 2000 ms, took ${elapsed}ms", elapsed < 2_000)
    }

    @Test
    fun pathologicalString_nestedBrackets_completesWellWithinBudget() {
        val input = "(".repeat(10_000) + "https://example.com/test" + ")".repeat(10_000)
        val elapsed = measureTimeMillis {
            val result = extractor.extract(input)
            assertTrue(result.urls.isNotEmpty())
        }
        assertTrue("Expected < 2000 ms, took ${elapsed}ms", elapsed < 2_000)
    }

    @Test
    fun pathologicalString_repeatedAtSymbols_completesWellWithinBudget() {
        val input = "user" + "@".repeat(20_000) + "example.com"
        val elapsed = measureTimeMillis {
            extractor.extract(input)
        }
        assertTrue("Expected < 2000 ms, took ${elapsed}ms", elapsed < 2_000)
    }

    @Test
    fun pathologicalString_extremelyLongLabel_completesWellWithinBudget() {
        val input = "https://" + "sub.".repeat(1_000) + "a".repeat(50_000) + ".example/path"
        val elapsed = measureTimeMillis {
            extractor.extract(input)
        }
        assertTrue("Expected < 2000 ms, took ${elapsed}ms", elapsed < 2_000)
    }
}
