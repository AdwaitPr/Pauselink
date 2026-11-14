import {
  AnalysisReportDto,
  InputSource,
  LinkReportDto,
  ReportNoteDto,
  RiskAssessmentDto,
} from '@pauselink/types';
import { Scorer, determineRiskBand } from './Scorer';
import { TextSanitizer } from './TextSanitizer';
import { AnalyzerConfig, DEFAULT_ANALYZER_CONFIG } from './types';
import { UrlExtractor } from './UrlExtractor';

export * from './types';
export * from './InvisibleChars';
export * from './TextSanitizer';
export * from './TldRegistry';
export * from './UrlExtractor';
export * from './Scorer';

/**
 * Main entry point for offline deterministic text/link risk analysis.
 * Produces an AnalysisReportDto identical in structure and schema to the Kotlin engine.
 */
export function analyzeContent(
  text: string,
  source: InputSource = 'WEB_PASTE',
  config: AnalyzerConfig = DEFAULT_ANALYZER_CONFIG
): AnalysisReportDto {
  const sanitized = TextSanitizer.prepare(text, config.maxInputChars);
  const extraction = UrlExtractor.extract(sanitized.value, config);

  const notes: ReportNoteDto[] = [];

  if (sanitized.wasTruncated) {
    notes.push({ type: 'InputTruncated' });
  }

  if (extraction.urls.length === 0) {
    notes.push({ type: 'NoLinksFound' });
  }

  if (extraction.skippedLinks > 0) {
    notes.push({
      type: 'LinksLimitReached',
      analysed: extraction.urls.length,
      found: extraction.urls.length + extraction.skippedLinks,
    });
  }

  // Analyze each link
  const linkReports: LinkReportDto[] = extraction.urls.map((u) =>
    Scorer.analyzeLink(u, sanitized.value)
  );

  // Analyze message context
  const messageFindings = Scorer.analyzeMessage(sanitized.value, extraction.urls.length);

  // Compute composite overall score
  const maxLinkScore = linkReports.reduce((max, r) => Math.max(max, r.assessment.score), 0);
  const messageScore = messageFindings.reduce((sum, f) => sum + f.score, 0);
  const overallScore = maxLinkScore + messageScore;
  const overallBand = determineRiskBand(overallScore);

  const overall: RiskAssessmentDto = {
    score: overallScore,
    band: overallBand,
  };

  return {
    source,
    links: linkReports,
    messageFindings,
    overall,
    notes,
    analyzerVersion: 1,
  };
}
