package com.clickretina.pauselink.platform

/**
 * Strict, privacy-preserving application logger.
 *
 * Mandatory contract:
 * - NEVER log raw input, URLs, hosts, paths, queries, message text, QR payloads, clipboard contents, or evidence values.
 * - Accepts ONLY rule codes, event counts, durations, and exception class names.
 */
object AppLogger {

    data class LogEvent(
        val category: Category,
        val ruleCode: String? = null,
        val count: Int? = null,
        val durationMs: Long? = null,
        val exceptionClass: String? = null
    )

    enum class Category {
        ANALYSIS_EXECUTION,
        PERFORMANCE,
        ERROR
    }

    private val recordedEvents = mutableListOf<LogEvent>()

    fun logAnalysisMetric(ruleCode: String?, count: Int?, durationMs: Long?) {
        synchronized(recordedEvents) {
            recordedEvents.add(
                LogEvent(
                    category = Category.ANALYSIS_EXECUTION,
                    ruleCode = ruleCode,
                    count = count,
                    durationMs = durationMs
                )
            )
        }
    }

    fun logError(exceptionClass: String) {
        synchronized(recordedEvents) {
            recordedEvents.add(
                LogEvent(
                    category = Category.ERROR,
                    exceptionClass = exceptionClass
                )
            )
        }
    }

    fun getEvents(): List<LogEvent> {
        synchronized(recordedEvents) {
            return recordedEvents.toList()
        }
    }

    fun clear() {
        synchronized(recordedEvents) {
            recordedEvents.clear()
        }
    }
}
