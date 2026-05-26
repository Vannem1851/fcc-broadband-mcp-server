/**
 * @fileoverview Server-specific environment variable configuration for fcc-broadband-mcp-server.
 * @module config/server-config
 */

import { z } from '@cyanheads/mcp-ts-core';
import { parseEnvConfig } from '@cyanheads/mcp-ts-core/config';

const ServerConfigSchema = z.object({
  bdcUsername: z
    .string()
    .optional()
    .describe(
      'FCC account email for BDC API. Required for fcc_list_downloads and BDC filing periods.',
    ),
  bdcHashValue: z
    .string()
    .optional()
    .describe('API token hash from broadbandmap.fcc.gov "Manage API Access" page.'),
  opendataAppToken: z
    .string()
    .optional()
    .describe('Socrata app token for FCC Open Data. Increases rate limits; not required.'),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

let _config: ServerConfig | undefined;

export function getServerConfig(): ServerConfig {
  _config ??= parseEnvConfig(ServerConfigSchema, {
    bdcUsername: 'FCC_BDC_USERNAME',
    bdcHashValue: 'FCC_BDC_HASH_VALUE',
    opendataAppToken: 'FCC_OPENDATA_APP_TOKEN',
  });
  return _config;
}
