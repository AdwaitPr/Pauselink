package com.clickretina.pauselink.analyzer

import org.junit.Assert.assertEquals
import org.junit.Test

class AnalyzerMarkerTest {
    @Test
    fun moduleName_isAnalyzer() {
        assertEquals("analyzer", AnalyzerMarker.MODULE_NAME)
    }

    @Test
    fun engineVersion_isPositive() {
        assertEquals(1, AnalyzerMarker.ENGINE_VERSION)
    }
}
