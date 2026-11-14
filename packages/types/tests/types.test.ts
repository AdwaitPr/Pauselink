import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AnalysisReportDto, ScanRecord } from '../src';

describe('Shared DTO validation', () => {
  it('correctly constructs and serializes an AnalysisReportDto', () => {
    const report: AnalysisReportDto = {
      source: 'WEB_PASTE',
      links: [
        {
          displayUrl: 'http://192.0.2.1/login',
          host: '192.0.2.1',
          decodedHost: '192.0.2.1',
          registrableDomain: null,
          findings: [
            {
              ruleId: 'U001',
              severity: 'LOW',
              confidence: 'HIGH',
              score: 10,
              evidence: [{ key: 'SCHEME', value: 'http' }]
            }
          ],
          assessment: { score: 10, band: 'NOTICE' }
        }
      ],
      messageFindings: [],
      overall: { score: 10, band: 'NOTICE' },
      notes: [{ type: 'InputTruncated' }],
      analyzerVersion: 1
    };

    const serialized = JSON.stringify(report);
    const parsed = JSON.parse(serialized) as AnalysisReportDto;

    assert.equal(parsed.source, 'WEB_PASTE');
    assert.equal(parsed.links.length, 1);
    assert.equal(parsed.links[0].displayUrl, 'http://192.0.2.1/login');
    assert.equal(parsed.links[0].findings[0].ruleId, 'U001');
    assert.equal(parsed.overall.band, 'NOTICE');
  });

  it('correctly validates a ScanRecord schema', () => {
    const scan: ScanRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      source: 'SHARED_TEXT',
      input_text: 'Check this link: http://example.com',
      overall_score: 10,
      risk_band: 'NOTICE',
      links_count: 1,
      report_json: {
        source: 'SHARED_TEXT',
        links: [],
        messageFindings: [],
        overall: { score: 10, band: 'NOTICE' },
        notes: [],
        analyzerVersion: 1
      },
      device_origin: 'ANDROID',
      created_at: new Date().toISOString()
    };

    assert.equal(scan.device_origin, 'ANDROID');
    assert.equal(scan.risk_band, 'NOTICE');
  });
});
