/**
 * @fileoverview FCC broadband providers list resource — all Form 477 holding companies.
 * @module mcp-server/resources/definitions/providers-list.resource
 */

import { resource, z } from '@cyanheads/mcp-ts-core';
import { getOpenDataService } from '@/services/open-data/open-data-service.js';

export const providersListResource = resource('fcc-broadband://providers/list', {
  name: 'fcc-broadband-providers-list',
  description:
    'Complete list of all Form 477 holding company numbers (hoconum) from the provider summary table. ' +
    'Use as a directory of valid hoconum identifiers before calling fcc_get_provider. ' +
    'Names are not included — use fcc_search_providers to resolve a company name to its hoconum. ' +
    'Data is as of June 2021.',
  mimeType: 'application/json',
  params: z.object({}),
  output: z.object({
    providers: z
      .array(
        z
          .object({
            hoconum: z.string().describe('Holding company number.'),
          })
          .describe('A holding company entry.'),
      )
      .describe('All distinct holding company numbers in Form 477 data.'),
    count: z.number().describe('Total number of holding companies.'),
    dataVintage: z.string().describe('Data vintage.'),
    notice: z.string().describe('Usage note for resolving names.'),
  }),

  async handler(_params, ctx) {
    const service = getOpenDataService();
    const providers = await service.listAllProviders(ctx);

    return {
      providers,
      count: providers.length,
      dataVintage: 'June 2021 (last Form 477 filing period)',
      notice: 'Use fcc_search_providers with a name fragment to resolve hoconum → company name.',
    };
  },
});
