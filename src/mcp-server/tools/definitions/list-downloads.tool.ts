/**
 * @fileoverview FCC BDC bulk download file lister — manifests for post-2022 data.
 * @module mcp-server/tools/definitions/list-downloads.tool
 */

import { tool, z } from '@cyanheads/mcp-ts-core';
import { JsonRpcErrorCode } from '@cyanheads/mcp-ts-core/errors';
import { getBdcApiService } from '@/services/bdc-api/bdc-api-service.js';

export const listDownloadsTool = tool('fcc_list_downloads', {
  title: 'List BDC Downloads',
  description:
    'Lists downloadable BDC data files for a specific as-of date — fixed availability by state and provider, mobile coverage, and challenge data — with file metadata (provider, state, technology, record count). ' +
    'Download URLs are included for each file. ' +
    'Requires FCC BDC API credentials (FCC_BDC_USERNAME and FCC_BDC_HASH_VALUE). ' +
    'Use fcc_list_filing_periods first to determine valid as_of_date values (BDC dates start June 2022).',
  annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },

  input: z.object({
    as_of_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe(
        'BDC as-of date in YYYY-MM-DD format (e.g., "2024-06-30"). Get valid dates from fcc_list_filing_periods with include_bdc=true.',
      ),
    data_type: z
      .enum(['availability', 'challenge'])
      .default('availability')
      .describe(
        '"availability" = ISP-reported coverage files (by state and provider). "challenge" = consumer and government dispute records.',
      ),
    category: z
      .enum(['Summary', 'State', 'Provider'])
      .optional()
      .describe(
        'File category. "State" = per-state coverage files. "Provider" = per-provider files. "Summary" = aggregate coverage tables.',
      ),
    technology_type: z
      .enum(['Fixed Broadband', 'Mobile Broadband', 'Mobile Voice'])
      .optional()
      .describe('Filter to a specific technology type of coverage data.'),
    state: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional()
      .describe('Filter to one state\'s files (2-letter abbreviation, e.g., "WA").'),
    provider_name: z
      .string()
      .optional()
      .describe('Partial provider holding company name to filter results (case-insensitive).'),
  }),

  output: z.object({
    files: z
      .array(
        z
          .object({
            fileId: z.string().describe('Unique file identifier.'),
            fileName: z.string().describe('File name.'),
            category: z.string().describe('File category (e.g., "State", "Provider", "Summary").'),
            subcategory: z.string().optional().describe('File subcategory when available.'),
            technologyType: z
              .string()
              .optional()
              .describe('Technology type covered (e.g., "Fixed Broadband", "Mobile Broadband").'),
            stateName: z.string().optional().describe('State name for state-level files.'),
            stateAbbr: z.string().optional().describe('State abbreviation for state-level files.'),
            providerName: z.string().optional().describe('Provider name for provider-level files.'),
            fileSizeBytes: z.number().optional().describe('File size in bytes when available.'),
            recordCount: z
              .number()
              .optional()
              .describe('Number of records in the file when available.'),
            downloadUrl: z.string().describe('Direct download URL for the file.'),
            asOfDate: z.string().describe('As-of date for this file.'),
          })
          .describe('A downloadable BDC file entry.'),
      )
      .describe('Downloadable BDC files matching the filters.'),
    totalFiles: z.number().describe('Total number of files returned after filtering.'),
    asOfDate: z.string().describe('The queried as-of date.'),
    dataType: z.string().describe('Data type queried (availability or challenge).'),
  }),

  errors: [
    {
      reason: 'credentials_required',
      code: JsonRpcErrorCode.Unauthorized,
      when: 'FCC_BDC_USERNAME or FCC_BDC_HASH_VALUE environment variables are not set.',
      recovery:
        'Set FCC_BDC_USERNAME and FCC_BDC_HASH_VALUE from the broadbandmap.fcc.gov "Manage API Access" page.',
    },
    {
      reason: 'invalid_as_of_date',
      code: JsonRpcErrorCode.InvalidParams,
      when: 'The as_of_date is not a valid BDC filing period.',
      recovery:
        'Call fcc_list_filing_periods with include_bdc=true to get valid BDC as-of dates (semi-annual, starting June 2022).',
    },
  ],

  async handler(input, ctx) {
    ctx.log.info('fcc_list_downloads', {
      asOfDate: input.as_of_date,
      dataType: input.data_type,
    });

    const service = getBdcApiService();
    const files = await service.listDownloads(
      {
        asOfDate: input.as_of_date,
        dataType: input.data_type,
        ...(input.category !== undefined && { category: input.category }),
        ...(input.technology_type !== undefined && { technologyType: input.technology_type }),
        ...(input.state !== undefined && { state: input.state }),
        ...(input.provider_name !== undefined && { providerName: input.provider_name }),
      },
      ctx,
    );

    ctx.log.info('fcc_list_downloads succeeded', {
      fileCount: files.length,
      asOfDate: input.as_of_date,
    });

    return {
      files,
      totalFiles: files.length,
      asOfDate: input.as_of_date,
      dataType: input.data_type,
    };
  },

  format: (result) => {
    const lines = [
      `## BDC Download Files — ${result.asOfDate}`,
      `**Data Type:** ${result.dataType} | **Total Files:** ${result.totalFiles}`,
      '',
    ];

    if (result.files.length === 0) {
      lines.push('No files found matching the filters.');
    } else {
      for (const f of result.files) {
        lines.push(`### ${f.fileName}`);
        lines.push(
          `**File ID:** ${f.fileId} | **Category:** ${f.category}${f.subcategory ? ` / ${f.subcategory}` : ''} | **As-Of Date:** ${f.asOfDate}`,
        );
        if (f.technologyType) lines.push(`**Technology:** ${f.technologyType}`);
        if (f.stateName) lines.push(`**State:** ${f.stateName} (${f.stateAbbr})`);
        if (f.providerName) lines.push(`**Provider:** ${f.providerName}`);
        if (f.recordCount !== undefined)
          lines.push(`**Records:** ${f.recordCount.toLocaleString()}`);
        lines.push(
          `**File Size:** ${f.fileSizeBytes !== undefined ? `${f.fileSizeBytes} bytes (${(f.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)` : 'Not available'}`,
        );
        lines.push(`**Download URL:** ${f.downloadUrl}`);
        lines.push('');
      }
    }

    return [{ type: 'text', text: lines.join('\n') }];
  },
});
