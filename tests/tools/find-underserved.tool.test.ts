/**
 * @fileoverview Tests for the fcc_find_underserved tool.
 * @module tests/tools/find-underserved.tool.test
 */

import { createMockContext } from '@cyanheads/mcp-ts-core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findUnderservedTool } from '@/mcp-server/tools/definitions/find-underserved.tool.js';

const mockGetAreaStatsByType = vi.fn();

vi.mock('@/services/open-data/open-data-service.js', () => ({
  getOpenDataService: () => ({ getAreaStatsByType: mockGetAreaStatsByType }),
}));

const MOCK_STATS = [
  {
    id: '28049',
    noCoverage: 30000,
    oneProvider: 20000,
    twoProviders: 5000,
    threeOrMore: 1000,
    total: 56000,
  },
  {
    id: '28071',
    noCoverage: 15000,
    oneProvider: 10000,
    twoProviders: 3000,
    threeOrMore: 500,
    total: 28500,
  },
  {
    id: '28001',
    noCoverage: 5000,
    oneProvider: 8000,
    twoProviders: 2000,
    threeOrMore: 500,
    total: 15500,
  },
];

describe('findUnderservedTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAreaStatsByType.mockResolvedValue(MOCK_STATS);
  });

  it('returns underserved areas ranked by noCoverage descending', async () => {
    const ctx = createMockContext({ errors: findUnderservedTool.errors });
    const input = findUnderservedTool.input.parse({ geography_type: 'county' });
    const result = await findUnderservedTool.handler(input, ctx);
    expect(result.areas[0].id).toBe('28049');
    expect(result.areas[0].rank).toBe(1);
    expect(result.areas[0].noCoverage).toBe(30000);
    expect(result.totalFound).toBe(3);
  });

  it('filters by min_unserved_pop', async () => {
    const ctx = createMockContext({ errors: findUnderservedTool.errors });
    const input = findUnderservedTool.input.parse({
      geography_type: 'county',
      min_unserved_pop: 10000,
    });
    const result = await findUnderservedTool.handler(input, ctx);
    expect(result.areas.length).toBe(2);
    expect(result.areas.every((a) => a.noCoverage >= 10000)).toBe(true);
  });

  it('respects limit parameter', async () => {
    const ctx = createMockContext({ errors: findUnderservedTool.errors });
    const input = findUnderservedTool.input.parse({
      geography_type: 'county',
      limit: 1,
    });
    const result = await findUnderservedTool.handler(input, ctx);
    expect(result.areas).toHaveLength(1);
    expect(result.totalFound).toBe(3);
  });

  it('returns empty areas with notice when no data after filter', async () => {
    const ctx = createMockContext({ errors: findUnderservedTool.errors });
    const input = findUnderservedTool.input.parse({
      geography_type: 'county',
      min_unserved_pop: 999999,
    });
    const result = await findUnderservedTool.handler(input, ctx);
    expect(result.areas).toHaveLength(0);
    expect(result.notice).toBeDefined();
  });

  it('formats output with rank, unserved, and oneProvider columns', () => {
    const output = {
      areas: [
        {
          id: '28049',
          rank: 1,
          noCoverage: 30000,
          oneProvider: 20000,
          total: 56000,
          unservedPct: 53.6,
          coveragePct: 46.4,
        },
      ],
      totalFound: 1,
      geographyType: 'county',
      speedDownMbps: 25,
      urbanRuralFilter: 'R',
      dataVintage: 'June 2021 (last Form 477 filing period)',
    };
    const blocks = findUnderservedTool.format!(output);
    const text = (blocks[0] as { text: string }).text;
    expect(text).toContain('28049');
    expect(text).toContain('30,000');
    expect(text).toContain('20,000');
    expect(text).toContain('53.6');
    expect(text).toContain('R');
    expect(text).toContain('county');
    expect(text).toContain('25');
  });
});
