/**
 * @fileoverview Broadband equity analysis prompt — guides digital divide research.
 * @module mcp-server/prompts/definitions/broadband-equity-analysis.prompt
 */

import { prompt, z } from '@cyanheads/mcp-ts-core';

export const broadbandEquityAnalysisPrompt = prompt('broadband_equity_analysis', {
  description:
    'Structures a digital divide analysis comparing broadband access across demographic groups. ' +
    'Guides chaining FCC broadband data with Census demographics and BLS labor statistics.',
  args: z.object({
    region: z
      .string()
      .describe(
        'Geographic scope of the analysis — e.g., "Mississippi", "rural Appalachia", "King County WA", or "nationwide".',
      ),
    focus: z
      .enum(['underserved', 'rural', 'tribal', 'all'])
      .describe(
        '"underserved" = areas with no broadband. "rural" = rural-specific gap analysis. "tribal" = Native American connectivity. "all" = comprehensive analysis across all segments.',
      ),
  }),

  generate: (args) => {
    const focusInstructions: Record<string, string> = {
      underserved: `Focus on areas with zero broadband providers at 25 Mbps and 100 Mbps thresholds.
Cross-reference with Census income and poverty data to identify economic correlations.
Use fcc_find_underserved to rank areas by unserved population.`,
      rural: `Focus on rural vs. urban broadband disparities using the urban_rural_filter parameter.
Compare rural unserved percentages against national and state averages.
Use fcc_get_coverage_summary with urban_rural_filter="R" for each geography of interest.`,
      tribal: `Focus on tribal land connectivity using the tribal_filter="T" parameter.
Compare tribal vs. non-tribal coverage rates at the same geography level.
Note that tribal areas often show the highest unserved rates in FCC data.`,
      all: `Conduct a comprehensive analysis covering:
1. Urban vs. rural disparities (urban_rural_filter)
2. Tribal land connectivity gaps (tribal_filter="T")
3. Speed tier analysis (compare 25 Mbps vs. 100 Mbps thresholds)
4. Competitive access (percentage with 2+ providers)`,
    };

    const focusText = focusInstructions[args.focus] ?? focusInstructions.all;

    return [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Conduct a broadband equity analysis for: **${args.region}**

## Analysis Framework

### Step 1 — Establish baseline coverage
Use \`fcc_get_coverage_summary\` or \`fcc_find_underserved\` to get broadband coverage data for the region.
- Technology filter: "acfosw" (all wired and fixed wireless)
- Compare at both 25 Mbps (FCC legacy standard) and 100 Mbps (BEAD program standard)

### Step 2 — Focus area
${focusText}

### Step 3 — Cross-reference with demographic data
Use Census or BLS MCP tools to correlate broadband access with:
- Median household income and poverty rates
- Educational attainment
- Remote work capability (BLS occupational data)
- Healthcare access patterns (CDC telehealth usage)

### Step 4 — Provider landscape
Use \`fcc_search_providers\` and \`fcc_compare_areas\` to:
- Identify which ISPs serve the region and what technologies they deploy
- Compare counties or areas within the region by coverage metrics
- Highlight areas with single-provider or no-provider coverage (monopoly/gap zones)

### Step 5 — BEAD program context
For rural and underserved areas:
- Identify BEAD-eligible locations (unserved at 25/100 Mbps)
- Rank by unserved population for funding prioritization
- Note that Form 477 data is from June 2021; current conditions may differ

### Data limitations to acknowledge
- All FCC broadband data is Form 477 (as of June 2021) — ISP self-reported, may overstate coverage
- Census block-level reporting means some addresses within a "covered" block may lack service
- BDC data (2022+) is available via bulk download only — not queryable row-by-row via this server

Begin the analysis now.`,
        },
      },
    ];
  },
});
