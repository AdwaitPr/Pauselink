import {
  FindingDto,
  LinkReportDto,
  RiskAssessmentDto,
  AnalysisReportDto,
  InputSource,
  RiskBand,
  RuleId,
  ReportNoteDto,
} from '@pauselink/types';
import { InvisibleChars } from './InvisibleChars';
import { ExtractedUrl } from './types';

export const KNOWN_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'adf.ly',
  'short.example', // test shortener
]);

export const SUSPICIOUS_TLDS = new Set([
  'top',
  'xyz',
  'click',
  'buzz',
  'country',
  'stream',
  'fit',
  'work',
  'loan',
  'gq',
  'cf',
  'tk',
  'ml',
  'ga',
]);

export const SENSITIVE_KEYWORDS = [
  'login',
  'signin',
  'verify',
  'banking',
  'account',
  'secure',
  'update',
  'authenticate',
  'wallet',
  'password',
  'credential',
];

export const URGENT_PHRASES = [
  'account suspended',
  'urgent action required',
  'verify your account',
  '24 hours',
  'unauthorized access',
  'immediate attention',
  'security alert',
  'action required',
  'suspended immediately',
];

export function determineRiskBand(score: number): RiskBand {
  if (score >= 65) return 'STRONG_WARNING';
  if (score >= 35) return 'CAUTION';
  if (score >= 15) return 'NOTICE';
  return 'NO_WARNING_SIGNS';
}

/**
 * Deterministic threat scorer evaluating URLs and message content against blueprint rules.
 */
export const Scorer = {
  analyzeLink(extracted: ExtractedUrl, fullText: string): LinkReportDto {
    const findings: FindingDto[] = [];
    const raw = extracted.raw;

    // Parse URL components deterministically without external network
    let host: string | null = null;
    let path = '';
    let query = '';
    let scheme: string | null = null;
    let port: string | null = null;
    let userinfo: string | null = null;

    try {
      let urlToParse = raw;
      if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
        urlToParse = 'https://' + raw;
      }
      const parsed = new URL(urlToParse);
      scheme = raw.startsWith('http://') ? 'http' : raw.startsWith('https://') ? 'https' : null;
      host = parsed.hostname;
      path = parsed.pathname;
      query = parsed.search;
      port = parsed.port || null;
      userinfo = parsed.username ? parsed.username + (parsed.password ? ':' + parsed.password : '') : null;
    } catch {
      // Fallback simple parsing
      const withoutScheme = raw.replace(/^https?:\/\//i, '');
      const slashIdx = withoutScheme.indexOf('/');
      host = slashIdx >= 0 ? withoutScheme.substring(0, slashIdx) : withoutScheme;
    }

    if (host) {
      // U001: IP Host
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipv4Regex.test(host)) {
        findings.push({
          ruleId: 'U001',
          severity: 'HIGH',
          confidence: 'HIGH',
          score: 30,
          evidence: [
            { key: 'OBSERVED_HOST', value: host },
            { key: 'IP_FORM', value: 'IPv4' },
          ],
        });
      }

      // U002: Non-standard port
      if (port && port !== '80' && port !== '443') {
        findings.push({
          ruleId: 'U002',
          severity: 'MEDIUM',
          confidence: 'HIGH',
          score: 15,
          evidence: [{ key: 'PORT', value: port }],
        });
      }

      // U003: Excessive subdomain labels
      const labels = host.split('.');
      if (labels.length >= 5) {
        findings.push({
          ruleId: 'U003',
          severity: 'MEDIUM',
          confidence: 'HIGH',
          score: 15,
          evidence: [{ key: 'LABEL_COUNT', value: String(labels.length) }],
        });
      }

      // U004: Suspicious TLD
      const tld = labels[labels.length - 1]?.toLowerCase();
      if (tld && SUSPICIOUS_TLDS.has(tld)) {
        findings.push({
          ruleId: 'U004',
          severity: 'MEDIUM',
          confidence: 'MEDIUM',
          score: 20,
          evidence: [{ key: 'OBSERVED_HOST', value: host }],
        });
      }

      // U005: Userinfo present
      if (userinfo || raw.includes('@')) {
        findings.push({
          ruleId: 'U005',
          severity: 'HIGH',
          confidence: 'HIGH',
          score: 35,
          evidence: [{ key: 'USERINFO_PRESENT', value: 'true' }],
        });
      }

      // U006: URL Shortener
      const hostLower = host.toLowerCase();
      if (KNOWN_SHORTENERS.has(hostLower)) {
        findings.push({
          ruleId: 'U006',
          severity: 'MEDIUM',
          confidence: 'HIGH',
          score: 20,
          evidence: [{ key: 'SERVICE', value: hostLower }],
        });
      }

      // U007: Hidden characters or non-ASCII in host
      if (InvisibleChars.containsHidden(host) || /[^\x20-\x7E]/.test(host)) {
        findings.push({
          ruleId: 'U007',
          severity: 'HIGH',
          confidence: 'HIGH',
          score: 35,
          evidence: [{ key: 'OBSERVED_HOST', value: host }],
        });
      }

      // U008: Brand typosquatting / synthetic brand ExampleBank
      if (hostLower.includes('examplebank') && !hostLower.endsWith('examplebank.example')) {
        findings.push({
          ruleId: 'U008',
          severity: 'HIGH',
          confidence: 'HIGH',
          score: 40,
          evidence: [
            { key: 'MATCHED_BRAND', value: 'ExampleBank' },
            { key: 'OFFICIAL_DOMAIN', value: 'examplebank.example' },
          ],
        });
      }

      // U009: Misleading double extension in path
      if (/\.(pdf|doc|docx|xls|xlsx|jpg|png)\.(exe|scr|bat|cmd|apk|vbs|js|msi)$/i.test(path)) {
        findings.push({
          ruleId: 'U009',
          severity: 'HIGH',
          confidence: 'HIGH',
          score: 25,
          evidence: [{ key: 'PAYLOAD_TYPE', value: 'EXECUTABLE' }],
        });
      }

      // U011: Excessive path or query length
      if (path.length + query.length > 120) {
        findings.push({
          ruleId: 'U011',
          severity: 'LOW',
          confidence: 'MEDIUM',
          score: 10,
          evidence: [{ key: 'OBSERVED_HOST', value: host }],
        });
      }

      // U012: Sensitive keyword in path/query with non-official host
      const lowerPathAndQuery = (path + query).toLowerCase();
      const matchedKeyword = SENSITIVE_KEYWORDS.find((kw) => lowerPathAndQuery.includes(kw));
      if (matchedKeyword && !hostLower.endsWith('.gov') && !hostLower.endsWith('.edu')) {
        findings.push({
          ruleId: 'U012',
          severity: 'MEDIUM',
          confidence: 'MEDIUM',
          score: 15,
          evidence: [{ key: 'WORD', value: matchedKeyword }],
        });
      }
    }

    const totalScore = findings.reduce((acc, f) => acc + f.score, 0);
    const band = determineRiskBand(totalScore);

    return {
      displayUrl: raw,
      host,
      decodedHost: host,
      registrableDomain: host,
      findings,
      assessment: {
        score: totalScore,
        band,
      },
    };
  },

  analyzeMessage(text: string, linksCount: number): FindingDto[] {
    const findings: FindingDto[] = [];

    // M001: Invisible characters in message text
    if (InvisibleChars.containsHidden(text)) {
      findings.push({
        ruleId: 'M001',
        severity: 'HIGH',
        confidence: 'HIGH',
        score: 25,
        evidence: [{ key: 'CHARACTERS', value: 'INVISIBLE_OR_FORMATTING' }],
      });
    }

    // M002: Urgent / pressure language
    const lower = text.toLowerCase();
    const matchedUrgency = URGENT_PHRASES.find((phrase) => lower.includes(phrase));
    if (matchedUrgency) {
      findings.push({
        ruleId: 'M002',
        severity: 'MEDIUM',
        confidence: 'MEDIUM',
        score: 20,
        evidence: [{ key: 'PHRASE', value: matchedUrgency }],
      });
    }

    // M003: Excessive links in message
    if (linksCount > 3) {
      findings.push({
        ruleId: 'M003',
        severity: 'LOW',
        confidence: 'HIGH',
        score: 10,
        evidence: [{ key: 'LABEL_COUNT', value: String(linksCount) }],
      });
    }

    return findings;
  },
};
