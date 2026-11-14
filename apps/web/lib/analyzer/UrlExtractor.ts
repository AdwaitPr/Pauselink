import { TextSanitizer } from './TextSanitizer';
import { TldRegistry } from './TldRegistry';
import { AnalyzerConfig, DEFAULT_ANALYZER_CONFIG, ExtractedUrl, ExtractionResult, LinkKind } from './types';

/**
 * Standard URL extractor implementation adhering strictly to Section E3 of the PauseLink Blueprint.
 * Employs a linear scan with no nested quantifiers to guarantee resistance against ReDoS attacks.
 * Matches Kotlin DefaultUrlExtractor.
 */
export const UrlExtractor = {
  extract(text: string, config: AnalyzerConfig = DEFAULT_ANALYZER_CONFIG): ExtractionResult {
    const sanitized = TextSanitizer.prepare(text, config.maxInputChars);
    const content = sanitized.value;

    if (!content || content.length === 0) {
      return {
        urls: [],
        truncatedInput: sanitized.wasTruncated,
        skippedLinks: 0,
      };
    }

    const rawCandidates = this.scanCandidates(content);

    // Deduplicate while maintaining first-seen insertion order (Section E3)
    const uniqueUrls: ExtractedUrl[] = [];
    const seenRaws = new Set<string>();
    for (const extracted of rawCandidates) {
      if (!seenRaws.has(extracted.raw)) {
        seenRaws.add(extracted.raw);
        uniqueUrls.push(extracted);
      }
    }

    const maxAllowed = config.maxLinks;
    const acceptedUrls = uniqueUrls.length > maxAllowed ? uniqueUrls.slice(0, maxAllowed) : uniqueUrls;
    const skippedCount = uniqueUrls.length > maxAllowed ? uniqueUrls.length - maxAllowed : 0;

    return {
      urls: acceptedUrls,
      truncatedInput: sanitized.wasTruncated,
      skippedLinks: skippedCount,
    };
  },

  scanCandidates(content: string): ExtractedUrl[] {
    const results: ExtractedUrl[] = [];
    const length = content.length;
    let index = 0;

    while (index < length) {
      // Skip delimiters
      while (index < length && this.isDelimiter(content[index])) {
        index++;
      }
      if (index >= length) break;

      const tokenStart = index;
      while (index < length && !this.isDelimiter(content[index])) {
        index++;
      }
      const tokenEnd = index;

      const extracted = this.processToken(content, tokenStart, tokenEnd);
      if (extracted) {
        results.push(extracted);
      }
    }

    return results;
  },

  processToken(content: string, tokenStart: number, tokenEnd: number): ExtractedUrl | null {
    let start = tokenStart;
    const end = tokenEnd;

    // Check if token embeds an explicit scheme (e.g. "Check(https://example.com)")
    const tokenText = content.substring(start, end);
    const schemeOffset = this.findSchemeOffset(tokenText);
    if (schemeOffset > 0) {
      start += schemeOffset;
    } else {
      const wwwOffset = this.findWwwOffset(tokenText);
      if (wwwOffset > 0) {
        start += wwwOffset;
      }
    }

    // Strip leading opening brackets or quotes
    while (start < end && "([{'\"“‘<`".includes(content[start])) {
      start++;
    }

    if (start >= end) return null;

    let candidate = content.substring(start, end);

    // Clean trailing punctuation and unbalanced brackets (Section E3)
    candidate = this.cleanTrailingPunctuation(candidate);
    if (!candidate || candidate.length === 0) return null;

    const kind = this.classifyCandidate(candidate);
    if (!kind) return null;

    const actualStart = start;
    const actualEnd = start + candidate.length;

    return {
      raw: candidate,
      kind,
      start: actualStart,
      end: actualEnd,
    };
  },

  classifyCandidate(candidate: string): LinkKind | null {
    const lower = candidate.toLowerCase();

    // 1. http:// / https://
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      const schemeEnd = candidate.indexOf('://') + 3;
      if (candidate.length > schemeEnd) {
        const hostPart = candidate.substring(schemeEnd);
        if (hostPart.length > 0 && !this.isDelimiter(hostPart[0])) {
          return 'SCHEME_PREFIXED';
        }
      }
      return null;
    }

    // 2. www. prefix
    if (lower.startsWith('www.')) {
      const afterWww = candidate.substring(4);
      const hostEnd = this.findHostBoundary(afterWww);
      const hostLabels = afterWww.substring(0, hostEnd);
      if (hostLabels.length > 0 && this.isValidHostName(hostLabels)) {
        return 'WWW_PREFIXED';
      }
      return null;
    }

    // 3. Bare domain (example.com/login)
    return this.classifyBareDomain(candidate);
  },

  classifyBareDomain(candidate: string): LinkKind | null {
    const hostEnd = this.findHostBoundary(candidate);
    const hostPart = candidate.substring(0, hostEnd);
    const restPart = candidate.substring(hostEnd);

    // Emails are not web links (e.g. user@example.com)
    if (hostPart.includes('@')) {
      return null;
    }

    const labels = hostPart.split('.');
    if (labels.length < 2) return null;

    // Each label must be a valid host label
    for (const label of labels) {
      if (!this.isValidHostLabel(label)) {
        return null;
      }
    }

    const tld = labels[labels.length - 1];
    if (!TldRegistry.isIcannTld(tld)) {
      return null;
    }

    // File extension guard: bare-domain candidates whose TLD is a common file extension
    // require a path or www. to count (Section E3)
    if (TldRegistry.isCommonFileExtension(tld)) {
      const hasPath = restPart.startsWith('/') && restPart.length > 1;
      if (!hasPath) {
        return null;
      }
    }

    return 'BARE_DOMAIN';
  },

  cleanTrailingPunctuation(input: string): string {
    let cleaned = input;
    let changed = true;

    while (changed && cleaned.length > 0) {
      changed = false;
      const lastChar = cleaned[cleaned.length - 1];

      if (".,;:!?\"'“”‘’`>".includes(lastChar)) {
        cleaned = cleaned.substring(0, cleaned.length - 1);
        changed = true;
      } else if (lastChar === ')') {
        const openCount = (cleaned.match(/\(/g) || []).length;
        const closeCount = (cleaned.match(/\)/g) || []).length;
        if (closeCount > openCount) {
          cleaned = cleaned.substring(0, cleaned.length - 1);
          changed = true;
        }
      } else if (lastChar === ']') {
        const openCount = (cleaned.match(/\[/g) || []).length;
        const closeCount = (cleaned.match(/\]/g) || []).length;
        if (closeCount > openCount) {
          cleaned = cleaned.substring(0, cleaned.length - 1);
          changed = true;
        }
      } else if (lastChar === '}') {
        const openCount = (cleaned.match(/\{/g) || []).length;
        const closeCount = (cleaned.match(/\}/g) || []).length;
        if (closeCount > openCount) {
          cleaned = cleaned.substring(0, cleaned.length - 1);
          changed = true;
        }
      }
    }

    return cleaned;
  },

  findHostBoundary(candidate: string): number {
    for (let i = 0; i < candidate.length; i++) {
      const c = candidate[i];
      if (c === '/' || c === '?' || c === '#' || c === ':') {
        return i;
      }
    }
    return candidate.length;
  },

  isValidHostName(host: string): boolean {
    const labels = host.split('.');
    if (labels.length === 0) return false;
    for (const label of labels) {
      if (!this.isValidHostLabel(label)) return false;
    }
    return true;
  },

  isValidHostLabel(label: string): boolean {
    if (!label || label.length === 0 || label.length > 63) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
    for (let i = 0; i < label.length; i++) {
      const c = label[i];
      if (!/[a-zA-Z0-9-]/.test(c)) {
        return false;
      }
    }
    return true;
  },

  findSchemeOffset(token: string): number {
    const lower = token.toLowerCase();
    const httpIdx = lower.indexOf('http://');
    const httpsIdx = lower.indexOf('https://');
    if (httpIdx >= 0 && httpsIdx >= 0) return Math.min(httpIdx, httpsIdx);
    if (httpIdx >= 0) return httpIdx;
    if (httpsIdx >= 0) return httpsIdx;
    return -1;
  },

  findWwwOffset(token: string): number {
    const lower = token.toLowerCase();
    const idx = lower.indexOf('www.');
    if (idx > 0 && /[a-zA-Z0-9]/.test(token[idx - 1])) {
      // Embedded inside a word (e.g. "awww.com"), not a standalone www. prefix
      return -1;
    }
    return idx;
  },

  isDelimiter(c: string): boolean {
    const code = c.charCodeAt(0);
    return (
      /\s/.test(c) ||
      code <= 0x1f ||
      (code >= 0x7f && code <= 0x9f) ||
      c === '<' ||
      c === '>' ||
      c === '"' ||
      c === '“' ||
      c === '”' ||
      c === '`'
    );
  },
};
