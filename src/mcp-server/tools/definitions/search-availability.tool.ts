/**
 * @fileoverview FCC broadband availability search by census block — queries ISPs and speeds.
 * @module mcp-server/tools/definitions/search-availability.tool
 */

import { tool, z } from '@cyanheads/mcp-ts-core';
import { JsonRpcErrorCode } from '@cyanheads/mcp-ts-core/errors';
import { getOpenDataService } from '@/services/open-data/open-data-service.js';
import { TECH_CODE_LABELS } from '@/services/open-data/types.js';

export const searchAvailabilityTool = tool('fcc_search_availability', {
  title: 'Search Broadband Availability',
  description:
    'Queries broadband providers and advertised speeds at a census block from FCC Form 477 data (as of June 2021). ' +
    'Answers "which ISPs serve this location and what speeds do they offer?" — the core tool for address-level broadband lookup. ' +
    'Requires a 15-digit census block FIPS code; use fcc_geocode_block to convert coordinates first. ' +
    'Data reflects ISP-reported availability at the block level, which may overstate actual coverage for some addresses.',
  annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },

  input: z.object({
    block_fips: z
      .string()
      .regex(/^\d{15}$/)
      .describe(
        '15-digit census block FIPS code (e.g., "530330081021016"). Obtain from fcc_geocode_block using address coordinates.',
      ),
    tech_filter: z
      .array(z.enum(['10', '11', '12', '40', '41', '42', '43', '50', '60', '70']))
      .optional()
      .describe(
        'Technology codes to filter. 50=Fiber to premises, 40–43=Cable modem, 10–12=DSL variants, 60=Satellite, 70=Fixed wireless. Omit to return all technologies.',
      ),
    min_speed_down: z
      .number()
      .min(0)
      .optional()
      .describe(
        'Minimum advertised download speed in Mbps to include in results. Omit to return all providers regardless of speed.',
      ),
    consumer: z
      .boolean()
      .optional()
      .describe(
        'Filter to consumer service (true) or business service (false). Omit to return both consumer and business offerings.',
      ),
  }),

  output: z.object({
    blockFips: z.string().describe('The queried census block FIPS code.'),
    providers: z
      .array(
        z
          .object({
            providerId: z.string().describe('FCC provider registration number (FRN).'),
            providerName: z.string().describe('Registered provider name.'),
            holdingCompanyName: z
              .string()
              .describe('Parent holding company name (e.g., "Comcast").'),
            hoconum: z
              .string()
              .describe(
                'Holding company number — use with fcc_get_provider for a national profile.',
              ),
            stateAbbr: z.string().describe('State where coverage is reported.'),
            techCode: z
              .string()
              .describe('Technology code (e.g., "50" = fiber, "40" = cable, "60" = satellite).'),
            techLabel: z.string().describe('Human-readable technology description.'),
            maxDownloadMbps: z.number().describe('Maximum advertised download speed in Mbps.'),
            maxUploadMbps: z.number().describe('Maximum advertised upload speed in Mbps.'),
            consumer: z.boolean().describe('Whether this offering serves consumers.'),
            business: z.boolean().describe('Whether this offering serves businesses.'),
          })
          .describe('One ISP offering at this census block.'),
      )
      .describe('ISP offerings reported for this census block.'),
    totalProviders: z
      .number()
      .describe('Total number of distinct holding companies offering service at this block.'),
    dataVintage: z
      .string()
      .describe(
        'Data vintage — all Form 477 data on FCC Open Data is as of June 2021. For newer BDC data, use fcc_list_downloads.',
      ),
  }),

  errors: [
    {
      reason: 'block_not_found',
      code: JsonRpcErrorCode.NotFound,
      when: 'No providers in the FCC dataset for this census block.',
      recovery:
        'Block may be non-residential or have no reported coverage. Try fcc_geocode_block to verify the FIPS code or check a nearby block.',
    },
  ],

  async handler(input, ctx) {
    ctx.log.info('fcc_search_availability', { blockFips: input.block_fips });
    const service = getOpenDataService();

    const records = await service.getDeploymentByBlock(
      input.block_fips,
      {
        ...(input.tech_filter?.length && { techCodes: input.tech_filter }),
        ...(input.min_speed_down !== undefined && { minSpeedDown: input.min_speed_down }),
        ...(input.consumer !== undefined && { consumer: input.consumer }),
      },
      ctx,
    );

    const holdingCompanyNames = new Set(records.map((r) => r.holdingCompanyName));

    const providers = records.map((r) => ({
      providerId: r.providerId,
      providerName: r.providerName,
      holdingCompanyName: r.holdingCompanyName,
      hoconum: r.hoconum,
      stateAbbr: r.stateAbbr,
      techCode: r.techCode,
      techLabel: TECH_CODE_LABELS[r.techCode] ?? `Technology ${r.techCode}`,
      maxDownloadMbps: r.maxDownloadMbps,
      maxUploadMbps: r.maxUploadMbps,
      consumer: r.consumer,
      business: r.business,
    }));

    ctx.log.info('fcc_search_availability succeeded', {
      blockFips: input.block_fips,
      recordCount: records.length,
      distinctHolcos: holdingCompanyNames.size,
    });

    return {
      blockFips: input.block_fips,
      providers,
      totalProviders: holdingCompanyNames.size,
      dataVintage: 'June 2021 (last Form 477 filing period)',
    };
  },

  format: (result) => {
    const lines = [
      `## Broadband Availability — Block ${result.blockFips}`,
      `**Data Vintage:** ${result.dataVintage}`,
      `**Distinct Providers:** ${result.totalProviders}`,
      '',
    ];

    if (result.providers.length === 0) {
      lines.push('No providers found for this census block.');
    } else {
      for (const p of result.providers) {
        lines.push(`### ${p.holdingCompanyName} (${p.providerName})`);
        lines.push(`**Hoconum:** ${p.hoconum} | **Provider ID:** ${p.providerId}`);
        lines.push(`**Technology:** ${p.techLabel} (code: ${p.techCode})`);
        lines.push(`**Speed:** ${p.maxDownloadMbps} Mbps down / ${p.maxUploadMbps} Mbps up`);
        const serviceTypes = [p.consumer && 'Consumer', p.business && 'Business']
          .filter(Boolean)
          .join(', ');
        lines.push(`**Service Type:** ${serviceTypes || 'Unknown'} | **State:** ${p.stateAbbr}`);
        lines.push('');
      }
    }
    return [{ type: 'text', text: lines.join('\n') }];
  },
});
