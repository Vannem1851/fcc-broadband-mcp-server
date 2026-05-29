/**
 * @fileoverview FCC BDC Public Data API service — wraps bdc.fcc.gov/api/public/map/.
 * Provides access to BDC filing dates and bulk download manifests (post-2022 data).
 * Requires FCC account credentials via FCC_BDC_USERNAME and FCC_BDC_HASH_VALUE env vars.
 * @module services/bdc-api/bdc-api-service
 */

import type { Context } from '@cyanheads/mcp-ts-core';
import type { AppConfig } from '@cyanheads/mcp-ts-core/config';
import { serviceUnavailable, unauthorized, validationError } from '@cyanheads/mcp-ts-core/errors';
import type { StorageService } from '@cyanheads/mcp-ts-core/storage';
import { httpErrorFromResponse, withRetry } from '@cyanheads/mcp-ts-core/utils';
import type { ServerConfig } from '@/config/server-config.js';
import {
  type BdcApiEnvelope,
  type BdcAsOfDate,
  type BdcDownloadFile,
  type DownloadFile,
  type FilingPeriod,
  FORM477_PERIODS,
} from './types.js';

const BASE_URL = 'https://bdc.fcc.gov/api/public/map';
const TIMEOUT_MS = 30_000;

export class BdcApiService {
  constructor(
    readonly config: AppConfig,
    readonly storage: StorageService,
    private readonly _serverConfig: ServerConfig,
  ) {}

  private get hasCredentials(): boolean {
    return !!(this._serverConfig.bdcUsername && this._serverConfig.bdcHashValue);
  }

  private requireCredentials(): void {
    if (!this.hasCredentials) {
      throw unauthorized(
        'BDC API credentials not configured. Set FCC_BDC_USERNAME and FCC_BDC_HASH_VALUE ' +
          'from the broadbandmap.fcc.gov "Manage API Access" page.',
        {
          reason: 'credentials_required',
          recovery: {
            hint: 'Set FCC_BDC_USERNAME and FCC_BDC_HASH_VALUE environment variables from broadbandmap.fcc.gov "Manage API Access" page.',
          },
        },
      );
    }
  }

  private getAuthHeaders(): Record<string, string> {
    // requireCredentials() guards this path — values are guaranteed non-nullish here
    return {
      username: this._serverConfig.bdcUsername ?? '',
      hash_value: this._serverConfig.bdcHashValue ?? '',
    };
  }

  private fetchBdc<T>(url: string, ctx: Context): Promise<T> {
    return withRetry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const signal = ctx.signal
          ? AbortSignal.any([ctx.signal, controller.signal])
          : controller.signal;

        let response: Response;
        try {
          response = await fetch(url, { signal, headers: this.getAuthHeaders() });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          throw await httpErrorFromResponse(response, { service: 'FCC BDC API' });
        }

        const text = await response.text();
        if (/^\s*<(!DOCTYPE\s+html|html[\s>])/i.test(text)) {
          throw serviceUnavailable(
            'BDC API returned HTML — likely rate-limited or temporarily unavailable.',
          );
        }
        const envelope: BdcApiEnvelope<T> = JSON.parse(text) as BdcApiEnvelope<T>;
        if (envelope.status !== 'successful' && envelope.status_code !== 200) {
          throw serviceUnavailable(`BDC API error: ${envelope.message ?? envelope.status}`, {
            statusCode: envelope.status_code,
          });
        }
        return envelope.data;
      },
      {
        operation: 'BdcApiService.fetchBdc',
        baseDelayMs: 2000, // BDC rate limit: 10 calls/min
        signal: ctx.signal,
      },
    );
  }

  /**
   * Returns available filing periods. Always includes hardcoded Form 477 periods.
   */
  async listFilingPeriods(options: { includeBdc: boolean }, ctx: Context): Promise<FilingPeriod[]> {
    const periods: FilingPeriod[] = [...FORM477_PERIODS];

    if (!options.includeBdc || !this.hasCredentials) {
      return periods;
    }

    const url = `${BASE_URL}/listAsOfDates`;
    const bdcDates = await this.fetchBdc<BdcAsOfDate[] | string[]>(url, ctx);

    const bdcPeriods: FilingPeriod[] = bdcDates.map((d) => {
      if (typeof d === 'string') {
        return { asOfDate: d, source: 'bdc' as const };
      }
      return {
        asOfDate: d.as_of_date,
        source: 'bdc' as const,
        ...(d.publication_date && { publicationDate: d.publication_date }),
      };
    });

    return [...periods, ...bdcPeriods];
  }

  /**
   * Lists downloadable BDC files for a specific as-of date.
   */
  async listDownloads(
    options: {
      asOfDate: string;
      dataType: 'availability' | 'challenge';
      category?: string;
      technologyType?: string;
      state?: string;
      providerName?: string;
    },
    ctx: Context,
  ): Promise<DownloadFile[]> {
    this.requireCredentials();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(options.asOfDate)) {
      throw validationError(
        `Invalid as_of_date format "${options.asOfDate}". Expected YYYY-MM-DD (e.g., "2024-06-30").`,
        { reason: 'invalid_as_of_date', asOfDate: options.asOfDate },
      );
    }

    const endpoint =
      options.dataType === 'availability'
        ? `/downloads/listAvailabilityData/${options.asOfDate}`
        : `/downloads/listChallengeData/${options.asOfDate}`;

    const url = `${BASE_URL}${endpoint}`;
    const files = await this.fetchBdc<BdcDownloadFile[]>(url, ctx);

    let filtered = files;

    if (options.category) {
      const cat = options.category;
      filtered = filtered.filter((f) => f.category?.toLowerCase() === cat.toLowerCase());
    }
    if (options.technologyType) {
      const tech = options.technologyType;
      filtered = filtered.filter((f) =>
        f.technology_type?.toLowerCase().includes(tech.toLowerCase()),
      );
    }
    if (options.state) {
      const st = options.state;
      filtered = filtered.filter((f) => f.state_abbr?.toUpperCase() === st.toUpperCase());
    }
    if (options.providerName) {
      const search = options.providerName.toLowerCase();
      filtered = filtered.filter((f) => f.provider_name?.toLowerCase().includes(search));
    }

    return filtered.map((f) => ({
      fileId: f.file_id ?? f.id ?? '',
      fileName: f.file_name ?? f.name ?? '',
      category: f.category ?? '',
      ...(f.subcategory && { subcategory: f.subcategory }),
      ...(f.technology_type && { technologyType: f.technology_type }),
      ...(f.state_name && { stateName: f.state_name }),
      ...(f.state_abbr && { stateAbbr: f.state_abbr }),
      ...(f.provider_name && { providerName: f.provider_name }),
      ...(f.file_size !== undefined && { fileSizeBytes: f.file_size }),
      ...(f.record_count !== undefined && { recordCount: f.record_count }),
      downloadUrl: f.download_url ?? f.url ?? '',
      asOfDate: f.as_of_date ?? options.asOfDate,
    }));
  }
}

// --- Init/accessor pattern ---

let _service: BdcApiService | undefined;

export function initBdcApiService(
  config: AppConfig,
  storage: StorageService,
  serverConfig: ServerConfig,
): void {
  _service = new BdcApiService(config, storage, serverConfig);
}

export function getBdcApiService(): BdcApiService {
  if (!_service) {
    throw new Error('BdcApiService not initialized — call initBdcApiService() in setup()');
  }
  return _service;
}
