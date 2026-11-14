package com.clickretina.pauselink.analyzer.extract

import com.clickretina.pauselink.analyzer.model.ExtractionResult

/**
 * Extracts URL candidates from text according to Section E3 of the PauseLink Blueprint.
 */
interface UrlExtractor {

    /**
     * Scans the provided text and returns extracted URL candidates, truncation state, and skipped link count.
     */
    fun extract(text: String): ExtractionResult
}
