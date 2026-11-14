import { FindingDto, LinkReportDto, RiskAssessmentDto, AnalysisReportDto, InputSource, RiskBand, RuleId, Severity, Confidence } from '@pauselink/types';

export type LinkKind = 'SCHEME_PREFIXED' | 'WWW_PREFIXED' | 'BARE_DOMAIN';

export interface ExtractedUrl {
  raw: string;
  kind: LinkKind;
  start: number;
  end: number;
}

export interface ExtractionResult {
  urls: ExtractedUrl[];
  truncatedInput: boolean;
  skippedLinks: number;
}

export interface SanitizedText {
  value: string;
  wasTruncated: boolean;
  hadHiddenChars: boolean;
}

export interface AnalyzerConfig {
  maxInputChars: number;
  maxLinks: number;
}

export const DEFAULT_ANALYZER_CONFIG: AnalyzerConfig = {
  maxInputChars: 10_000,
  maxLinks: 12,
};
