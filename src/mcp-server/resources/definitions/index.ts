/**
 * @fileoverview Barrel export for all FCC broadband MCP resource definitions.
 * @module mcp-server/resources/definitions/index
 */

export { geographySummaryResource } from './geography-summary.resource.js';
export { providersListResource } from './providers-list.resource.js';

import { geographySummaryResource } from './geography-summary.resource.js';
import { providersListResource } from './providers-list.resource.js';

export const allResourceDefinitions = [geographySummaryResource, providersListResource] as const;
