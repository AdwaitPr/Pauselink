package com.clickretina.pauselink.analyzer.extract

import com.clickretina.pauselink.analyzer.AnalyzerConfig
import com.clickretina.pauselink.analyzer.model.ExtractedUrl
import com.clickretina.pauselink.analyzer.model.ExtractionResult
import com.clickretina.pauselink.analyzer.model.LinkKind
import java.util.Locale

/**
 * Standard URL extractor implementation adhering strictly to Section E3 of the PauseLink Blueprint.
 * Employs a linear scan with no nested quantifiers to guarantee resistance against ReDoS attacks.
 */
class DefaultUrlExtractor(
    private val config: AnalyzerConfig = AnalyzerConfig()
) : UrlExtractor {

    override fun extract(text: String): ExtractionResult {
        val sanitized = TextSanitizer.prepare(text, config.maxInputChars)
        val content = sanitized.value
        if (content.isEmpty()) {
            return ExtractionResult(
                urls = emptyList(),
                truncatedInput = sanitized.wasTruncated,
                skippedLinks = 0
            )
        }

        val rawCandidates = scanCandidates(content)

        // Deduplicate while maintaining first-seen insertion order (Section E3)
        val uniqueUrls = mutableListOf<ExtractedUrl>()
        val seenRaws = mutableSetOf<String>()
        for (extracted in rawCandidates) {
            if (seenRaws.add(extracted.raw)) {
                uniqueUrls.add(extracted)
            }
        }

        val maxAllowed = config.maxLinks
        val acceptedUrls = if (uniqueUrls.size > maxAllowed) {
            uniqueUrls.subList(0, maxAllowed)
        } else {
            uniqueUrls
        }
        val skippedCount = if (uniqueUrls.size > maxAllowed) uniqueUrls.size - maxAllowed else 0

        return ExtractionResult(
            urls = acceptedUrls,
            truncatedInput = sanitized.wasTruncated,
            skippedLinks = skippedCount
        )
    }

    private fun scanCandidates(content: String): List<ExtractedUrl> {
        val results = mutableListOf<ExtractedUrl>()
        val length = content.length
        var index = 0

        while (index < length) {
            // Skip delimiters
            while (index < length && isDelimiter(content[index])) {
                index++
            }
            if (index >= length) break

            val tokenStart = index
            while (index < length && !isDelimiter(content[index])) {
                index++
            }
            val tokenEnd = index

            processToken(content, tokenStart, tokenEnd)?.let { extracted ->
                results.add(extracted)
            }
        }

        return results
    }

    private fun processToken(content: String, tokenStart: Int, tokenEnd: Int): ExtractedUrl? {
        var start = tokenStart
        val end = tokenEnd

        // Check if token embeds an explicit scheme (e.g. "Check(https://example.com)")
        val tokenText = content.substring(start, end)
        val schemeOffset = findSchemeOffset(tokenText)
        if (schemeOffset > 0) {
            start += schemeOffset
        } else {
            val wwwOffset = findWwwOffset(tokenText)
            if (wwwOffset > 0) {
                start += wwwOffset
            }
        }

        // Strip leading opening brackets or quotes
        while (start < end && content[start] in "([{'\"“‘<`") {
            start++
        }

        if (start >= end) return null

        var candidate = content.substring(start, end)

        // Clean trailing punctuation and unbalanced brackets (Section E3)
        candidate = cleanTrailingPunctuation(candidate)
        if (candidate.isEmpty()) return null

        val kind = classifyCandidate(candidate) ?: return null

        val actualStart = start
        val actualEnd = start + candidate.length

        return ExtractedUrl(
            raw = candidate,
            kind = kind,
            start = actualStart,
            end = actualEnd
        )
    }

    private fun classifyCandidate(candidate: String): LinkKind? {
        val lower = candidate.lowercase(Locale.ROOT)

        // 1. http:// / https://
        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            val schemeEnd = candidate.indexOf("://") + 3
            if (candidate.length > schemeEnd) {
                val hostPart = candidate.substring(schemeEnd)
                if (hostPart.isNotEmpty() && !isDelimiter(hostPart[0])) {
                    return LinkKind.SCHEME_PREFIXED
                }
            }
            return null
        }

        // 2. www. prefix
        if (lower.startsWith("www.")) {
            val afterWww = candidate.substring(4)
            val hostEnd = findHostBoundary(afterWww)
            val hostLabels = afterWww.substring(0, hostEnd)
            if (hostLabels.isNotEmpty() && isValidHostName(hostLabels)) {
                return LinkKind.WWW_PREFIXED
            }
            return null
        }

        // 3. Bare domain (example.com/login)
        return classifyBareDomain(candidate)
    }

    private fun classifyBareDomain(candidate: String): LinkKind? {
        val hostEnd = findHostBoundary(candidate)
        val hostPart = candidate.substring(0, hostEnd)
        val restPart = candidate.substring(hostEnd)

        // Emails are not web links (e.g. user@example.com)
        if (hostPart.contains('@')) {
            return null
        }

        val labels = hostPart.split('.')
        if (labels.size < 2) return null

        // Each label must be a valid host label
        for (label in labels) {
            if (!isValidHostLabel(label)) {
                return null
            }
        }

        val tld = labels.last()
        if (!TldRegistry.isIcannTld(tld)) {
            return null
        }

        // File extension guard: bare-domain candidates whose TLD is a common file extension
        // require a path or www. to count (Section E3)
        if (TldRegistry.isCommonFileExtension(tld)) {
            val hasPath = restPart.startsWith("/") && restPart.length > 1
            if (!hasPath) {
                return null
            }
        }

        return LinkKind.BARE_DOMAIN
    }

    private fun cleanTrailingPunctuation(input: String): String {
        var cleaned = input
        var changed = true

        while (changed && cleaned.isNotEmpty()) {
            changed = false
            val lastChar = cleaned.last()

            if (lastChar in ".,;:!?\"'“”‘’`>") {
                cleaned = cleaned.substring(0, cleaned.length - 1)
                changed = true
            } else if (lastChar == ')') {
                val openCount = cleaned.count { it == '(' }
                val closeCount = cleaned.count { it == ')' }
                if (closeCount > openCount) {
                    cleaned = cleaned.substring(0, cleaned.length - 1)
                    changed = true
                }
            } else if (lastChar == ']') {
                val openCount = cleaned.count { it == '[' }
                val closeCount = cleaned.count { it == ']' }
                if (closeCount > openCount) {
                    cleaned = cleaned.substring(0, cleaned.length - 1)
                    changed = true
                }
            } else if (lastChar == '}') {
                val openCount = cleaned.count { it == '{' }
                val closeCount = cleaned.count { it == '}' }
                if (closeCount > openCount) {
                    cleaned = cleaned.substring(0, cleaned.length - 1)
                    changed = true
                }
            }
        }

        return cleaned
    }

    private fun findHostBoundary(candidate: String): Int {
        for (i in candidate.indices) {
            val c = candidate[i]
            if (c == '/' || c == '?' || c == '#' || c == ':') {
                return i
            }
        }
        return candidate.length
    }

    private fun isValidHostName(host: String): Boolean {
        val labels = host.split('.')
        if (labels.isEmpty()) return false
        for (label in labels) {
            if (!isValidHostLabel(label)) return false
        }
        return true
    }

    private fun isValidHostLabel(label: String): Boolean {
        if (label.isEmpty() || label.length > 63) return false
        if (label.startsWith('-') || label.endsWith('-')) return false
        for (c in label) {
            if (!c.isLetterOrDigit() && c != '-') {
                return false
            }
        }
        return true
    }

    private fun findSchemeOffset(token: String): Int {
        val lower = token.lowercase(Locale.ROOT)
        val httpIdx = lower.indexOf("http://")
        val httpsIdx = lower.indexOf("https://")
        return when {
            httpIdx >= 0 && httpsIdx >= 0 -> minOf(httpIdx, httpsIdx)
            httpIdx >= 0 -> httpIdx
            httpsIdx >= 0 -> httpsIdx
            else -> -1
        }
    }

    private fun findWwwOffset(token: String): Int {
        val lower = token.lowercase(Locale.ROOT)
        val idx = lower.indexOf("www.")
        if (idx > 0 && (token[idx - 1].isLetterOrDigit())) {
            // Embedded inside a word (e.g. "awww.com"), not a standalone www. prefix
            return -1
        }
        return idx
    }

    private fun isDelimiter(c: Char): Boolean {
        return c.isWhitespace() ||
            c <= '\u001F' ||
            (c in '\u007F'..'\u009F') ||
            c == '<' || c == '>' ||
            c == '"' || c == '“' || c == '”' ||
            c == '`'
    }
}
