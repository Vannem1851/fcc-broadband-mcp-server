/**
 * @fileoverview Barrel export for all FCC broadband MCP prompt definitions.
 * @module mcp-server/prompts/definitions/index
 */

export { broadbandEquityAnalysisPrompt } from './broadband-equity-analysis.prompt.js';

import { broadbandEquityAnalysisPrompt } from './broadband-equity-analysis.prompt.js';

export const allPromptDefinitions = [broadbandEquityAnalysisPrompt] as const;
