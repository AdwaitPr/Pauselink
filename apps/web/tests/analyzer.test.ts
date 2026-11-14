import test from 'node:test';
import assert from 'node:assert/strict';
import { UrlExtractor } from '../lib/analyzer/UrlExtractor';
import { TextSanitizer } from '../lib/analyzer/TextSanitizer';
import { InvisibleChars } from '../lib/analyzer/InvisibleChars';
import { analyzeContent } from '../lib/analyzer/index';

test('InvisibleChars detects and handles hidden characters', () => {
  const textWithBOM = '\uFEFFhttps://example.com';
  assert.equal(InvisibleChars.containsHidden(textWithBOM), true);
  assert.equal(InvisibleChars.countHidden(textWithBOM), 1);
  assert.equal(InvisibleChars.stripHidden(textWithBOM), 'https://example.com');

  const textWithZeroWidth = 'https://ex\u200Bample.com';
  assert.equal(InvisibleChars.containsHidden(textWithZeroWidth), true);
  assert.equal(InvisibleChars.stripHidden(textWithZeroWidth), 'https://example.com');

  const cleanText = 'https://example.com';
  assert.equal(InvisibleChars.containsHidden(cleanText), false);
  assert.equal(InvisibleChars.countHidden(cleanText), 0);
});

test('TextSanitizer normalizes line endings and enforces character limits', () => {
  const crlfText = 'line1\r\nline2\rline3\nline4';
  const sanitized = TextSanitizer.prepare(crlfText);
  assert.equal(sanitized.value, 'line1\nline2\nline3\nline4');
  assert.equal(sanitized.wasTruncated, false);

  const longText = 'a'.repeat(12_000);
  const truncated = TextSanitizer.prepare(longText, 10_000);
  assert.equal(truncated.value.length, 10_000);
  assert.equal(truncated.wasTruncated, true);
});

test('UrlExtractor adheres to extraction_edge test vectors', () => {
  const vectors = [
    { id: 'B10', input: 'e.g. report.final and notes.txt', count: 0, urls: [] },
    { id: 'B11', input: '(see https://example.com/a_(b))', count: 1, urls: ['https://example.com/a_(b)'] },
    { id: 'B12', input: 'Visit example.com.', count: 1, urls: ['example.com'] },
    { id: 'B13', input: 'HTTPS://EXAMPLE.COM/', count: 1, urls: ['HTTPS://EXAMPLE.COM/'] },
    { id: 'EDGE_01', input: '<https://example.com>', count: 1, urls: ['https://example.com'] },
    { id: 'EDGE_02', input: '"https://example.com"', count: 1, urls: ['https://example.com'] },
    { id: 'EDGE_03', input: "'https://example.com'", count: 1, urls: ['https://example.com'] },
    { id: 'EDGE_04', input: 'Check https://example.com, and https://example.org;', count: 2, urls: ['https://example.com', 'https://example.org'] },
    { id: 'EDGE_05', input: 'https://example.com/wiki/Rust_(programming_language)', count: 1, urls: ['https://example.com/wiki/Rust_(programming_language)'] },
    { id: 'EDGE_06', input: '((https://example.com/path))', count: 1, urls: ['https://example.com/path'] },
    { id: 'EDGE_07', input: '[https://example.com]', count: 1, urls: ['https://example.com'] },
    { id: 'EDGE_08', input: '{https://example.com}', count: 1, urls: ['https://example.com'] },
    { id: 'EDGE_09', input: 'example.com/login?foo=bar', count: 1, urls: ['example.com/login?foo=bar'] },
    { id: 'EDGE_10', input: 'Download report.zip and video.mov', count: 0, urls: [] },
    { id: 'EDGE_11', input: 'Download report.zip/get and video.mov/play', count: 2, urls: ['report.zip/get', 'video.mov/play'] },
    { id: 'EDGE_12', input: 'Visit www.report.zip', count: 1, urls: ['www.report.zip'] },
    { id: 'EDGE_13', input: 'See https://example.com and https://example.com again', count: 1, urls: ['https://example.com'] },
    { id: 'EDGE_14', input: '', count: 0, urls: [] },
    { id: 'EDGE_15', input: '   ', count: 0, urls: [] },
    { id: 'EDGE_16', input: 'Meeting at 5pm in the conference room.', count: 0, urls: [] },
    { id: 'EDGE_17', input: 'Contact alice@example.com for info', count: 0, urls: [] },
    { id: 'EDGE_18', input: 'Info(https://example.com/docs)', count: 1, urls: ['https://example.com/docs'] },
    { id: 'EDGE_19', input: 'https://ex\u200Bample.com', count: 1, urls: ['https://ex\u200Bample.com'] },
  ];

  for (const v of vectors) {
    const res = UrlExtractor.extract(v.input);
    assert.equal(res.urls.length, v.count, `Failed vector ${v.id} for count`);
    const actualUrls = res.urls.map((u) => u.raw);
    assert.deepEqual(actualUrls, v.urls, `Failed vector ${v.id} for urls`);
  }
});

test('UrlExtractor enforces maxLinks limit and reports skippedLinks', () => {
  const links = Array.from({ length: 15 }, (_, i) => `https://site${i}.example`).join(' ');
  const res = UrlExtractor.extract(links, { maxInputChars: 10_000, maxLinks: 12 });
  assert.equal(res.urls.length, 12);
  assert.equal(res.skippedLinks, 3);
});

test('analyzeContent produces deterministic report with findings and risk bands', () => {
  // Test 1: Benign URL
  const benignReport = analyzeContent('Visit https://example.com today!');
  assert.equal(benignReport.links.length, 1);
  assert.equal(benignReport.overall.band, 'NO_WARNING_SIGNS');

  // Test 2: IP host (U001)
  const ipReport = analyzeContent('http://192.0.2.1/login');
  assert.equal(ipReport.links.length, 1);
  const u001 = ipReport.links[0].findings.find((f: any) => f.ruleId === 'U001');
  assert.ok(u001, 'Should trigger U001');
  assert.equal(u001.score, 30);

  // Test 3: Urgent message (M002) + Brand typosquatting (U008)
  const phishingMessage = 'URGENT ACTION REQUIRED: Your account suspended! Verify at http://examplebank.phishing.click/login';
  const phishingReport = analyzeContent(phishingMessage);
  assert.equal(phishingReport.overall.band, 'STRONG_WARNING');
  assert.ok(phishingReport.overall.score >= 65);
  assert.ok(phishingReport.messageFindings.some((f: any) => f.ruleId === 'M002'));
  assert.ok(phishingReport.links[0].findings.some((f: any) => f.ruleId === 'U008'));
});
