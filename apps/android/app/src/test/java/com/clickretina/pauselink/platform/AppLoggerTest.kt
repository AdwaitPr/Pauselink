package com.clickretina.pauselink.platform

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class AppLoggerTest {

    @Before
    fun setUp() {
        AppLogger.clear()
    }

    @Test
    fun logAnalysisMetric_recordsStructuredDataOnly() {
        AppLogger.logAnalysisMetric(ruleCode = "U001", count = 2, durationMs = 15L)

        val events = AppLogger.getEvents()
        assertEquals(1, events.size)

        val event = events.first()
        assertEquals(AppLogger.Category.ANALYSIS_EXECUTION, event.category)
        assertEquals("U001", event.ruleCode)
        assertEquals(2, event.count)
        assertEquals(15L, event.durationMs)
        assertEquals(null, event.exceptionClass)
    }

    @Test
    fun logError_recordsExceptionClassNameOnly() {
        AppLogger.logError(exceptionClass = "java.lang.IllegalArgumentException")

        val events = AppLogger.getEvents()
        assertEquals(1, events.size)

        val event = events.first()
        assertEquals(AppLogger.Category.ERROR, event.category)
        assertEquals("java.lang.IllegalArgumentException", event.exceptionClass)
        assertEquals(null, event.ruleCode)
    }

    @Test
    fun clear_removesAllEvents() {
        AppLogger.logError("NullPointerException")
        assertEquals(1, AppLogger.getEvents().size)

        AppLogger.clear()
        assertTrue(AppLogger.getEvents().isEmpty())
    }

    @Test
    fun appLoggerMethods_doNotAcceptRawInputPayloads() {
        val methods = AppLogger::class.java.declaredMethods
        for (method in methods) {
            val paramNames = method.parameters.map { it.name }
            for (name in paramNames) {
                assertTrue(
                    "Method ${method.name} has parameter '$name' that risks logging raw inputs",
                    !name.contains("url", ignoreCase = true) &&
                        !name.contains("input", ignoreCase = true) &&
                        !name.contains("text", ignoreCase = true) &&
                        !name.contains("payload", ignoreCase = true) &&
                        !name.contains("message", ignoreCase = true)
                )
            }
        }
    }
}
