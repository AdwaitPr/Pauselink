package com.clickretina.pauselink.analyzer.model

/**
 * Origin of the analyzed text or payload (e.g. share sheet, text selection, paste, QR).
 */
enum class InputSource {
    SHARED_TEXT,
    PROCESS_TEXT,
    PASTED,
    QR_CODE
}
