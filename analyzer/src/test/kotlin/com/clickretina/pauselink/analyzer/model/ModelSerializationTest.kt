package com.clickretina.pauselink.analyzer.model

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ModelSerializationTest {

    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = false
    }

    @Test
    fun analysisReport_serializesAndDeserializesRoundTrip() {
        val evidence = listOf(
            Evidence(EvidenceKey.SCHEME, "http"),
            Evidence(EvidenceKey.OBSERVED_HOST, "192.0.2.1")
        )
        val finding = Finding(
            ruleId = RuleId.INSECURE_SCHEME,
            severity = Severity.LOW,
            confidence = Confidence.HIGH,
            score = 10,
            evidence = evidence
        )
        val linkAssessment = RiskAssessment(score = 10, band = RiskBand.NOTICE)
        val linkReport = LinkReport(
            displayUrl = "http://192.0.2.1/login",
            host = "192.0.2.1",
            decodedHost = "192.0.2.1",
            registrableDomain = null,
            findings = listOf(finding),
            assessment = linkAssessment,
            rawUrl = "http://192.0.2.1/login?token=sensitive_secret" // @Transient, must not be serialized
        )
        val overallAssessment = RiskAssessment(score = 10, band = RiskBand.NOTICE)
        val notes = listOf<ReportNote>(
            ReportNote.InputTruncated,
            ReportNote.LinksLimitReached(analysed = 10, found = 12)
        )
        val originalReport = AnalysisReport(
            source = InputSource.SHARED_TEXT,
            links = listOf(linkReport),
            messageFindings = emptyList(),
            overall = overallAssessment,
            notes = notes,
            analyzerVersion = 1
        )

        val encoded = json.encodeToString(originalReport)
        val decoded = json.decodeFromString<AnalysisReport>(encoded)

        assertEquals(originalReport.source, decoded.source)
        assertEquals(originalReport.analyzerVersion, decoded.analyzerVersion)
        assertEquals(originalReport.overall, decoded.overall)
        assertEquals(originalReport.notes, decoded.notes)
        assertEquals(1, decoded.links.size)

        val decodedLink = decoded.links[0]
        assertEquals(linkReport.displayUrl, decodedLink.displayUrl)
        assertEquals(linkReport.host, decodedLink.host)
        assertEquals(linkReport.decodedHost, decodedLink.decodedHost)
        assertEquals(linkReport.registrableDomain, decodedLink.registrableDomain)
        assertEquals(linkReport.assessment, decodedLink.assessment)
        assertEquals(linkReport.findings, decodedLink.findings)

        // Verify that rawUrl is transient and never serialized
        assertNull("rawUrl must be transient and null after deserialization", decodedLink.rawUrl)
    }

    @Test
    fun ruleId_fromCode_resolvesAllTwentyFiveRules() {
        assertEquals(25, RuleId.entries.size)
        for (rule in RuleId.entries) {
            val resolved = RuleId.fromCode(rule.code)
            assertEquals("Failed to resolve ${rule.name} from code ${rule.code}", rule, resolved)
        }
    }
}
