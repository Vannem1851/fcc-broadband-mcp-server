/**
 * @fileoverview FCC broadband providers list resource — all Form 477 holding companies.
 * @module mcp-server/resources/definitions/providers-list.resource
 */

import { resource, z } from '@cyanheads/mcp-ts-core';
import { getOpenDataService } from '@/services/open-data/open-data-service.js';

export const providersListResource = resource('fcc-broadband://providers/list', {
  name: 'fcc-broadband-providers-list',
  description:
    'List of all Form 477 holding companies with hoconum identifiers and names, derived from the deployment table. ' +
    'Reference for resolving hoconum before calling fcc_get_provider. ' +
    'Data is as of June 2021.',
  mimeType: 'application/json',
  params: z.object({}),
  output: z.object({
    providers: z
      .array(
        z
          .object({
            hoconum: z.string().describe('Holding company number.'),
            holdingCompanyName: z.string().describe('Holding company name.'),
          })
          .describe('A holding company entry.'),
      )
      .describe('All distinct holding companies in Form 477 data.'),
    count: z.number().describe('Total number of holding companies.'),
    dataVintage: z.string().describe('Data vintage.'),
  }),

  async handler(_params, ctx) {
    const service = getOpenDataService();
    const providers = await service.listAllProviders(ctx);

    return {
      providers,
      count: providers.length,
      dataVintage: 'June 2021 (last Form 477 filing period)',
    };
  },
});
