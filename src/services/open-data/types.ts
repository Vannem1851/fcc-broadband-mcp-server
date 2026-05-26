/**
 * @fileoverview Types for the FCC Open Data (Socrata) service.
 * @module services/open-data/types
 */

/** Dataset IDs on opendata.fcc.gov for Form 477 data. */
export const DATASET_IDS = {
  /** Block-level deployment: provider × block × technology × speed (Jun 2021) */
  DEPLOYMENT: 'jdr4-3q4p',
  /** Area table: population by provider-count × speed tier × urban/rural × tribal (Jun 2021) */
  AREA_TABLE: 'xvwq-qtaj',
  /** Provider summary table: national totals by tech × speed tier (Jun 2021) */
  PROVIDER_SUMMARY: 'yd9y-6jqe',
  /** Geography lookup: GEOID → name, centroid, bounding box */
  GEOGRAPHY_LOOKUP: 'v5vt-e7vw',
} as const;

/** Raw row from the deployment table (jdr4-3q4p). Socrata returns all fields as strings. */
export interface RawDeploymentRow {
  blockcode?: string;
  business?: string;
  consumer?: string;
  frn?: string;
  hoconum?: string;
  holdingcompanyname?: string;
  maxaddown?: string;
  maxadup?: string;
  provider_id?: string;
  providername?: string;
  stateabbr?: string;
  techcode?: string;
}

/** Raw row from the area table (xvwq-qtaj). */
export interface RawAreaRow {
  has_0?: string;
  has_1?: string;
  has_2?: string;
  has_3more?: string;
  id?: string;
  speed?: string;
  tech?: string;
  tribal_non?: string;
  type?: string;
  urban_rural?: string;
}

/** Raw row from a grouped provider query on the deployment table. */
export interface RawProviderRow {
  hoconum?: string;
  holdingcompanyname?: string;
  stateabbr?: string;
  techcode?: string;
}

/** Raw row from the provider summary table (yd9y-6jqe). */
export interface RawProviderSummaryRow {
  d_1?: string;
  d_2?: string;
  d_3?: string;
  d_4?: string;
  d_5?: string;
  d_6?: string;
  d_7?: string;
  d_8?: string;
  hoconum?: string;
  holdingcompanyname?: string;
  techcode?: string;
}

/** Raw row from the geography lookup table (v5vt-e7vw). */
export interface RawGeographyRow {
  geoid?: string;
  name?: string;
  type?: string;
}

/** Normalized deployment record for fcc_search_availability. */
export interface DeploymentRecord {
  blockFips: string;
  business: boolean;
  consumer: boolean;
  hoconum: string;
  holdingCompanyName: string;
  maxDownloadMbps: number;
  maxUploadMbps: number;
  providerId: string;
  providerName: string;
  stateAbbr: string;
  techCode: string;
}

/** Normalized area summary for a geography × segment. */
export interface AreaSegment {
  coveragePct: number;
  population: {
    noCoverage: number;
    oneProvider: number;
    twoProviders: number;
    threeOrMore: number;
    total: number;
  };
  tribal: 'T' | 'N';
  unservedPct: number;
  urbanRural: 'R' | 'U';
}

/** Normalized provider record for fcc_search_providers. */
export interface ProviderRecord {
  hoconum: string;
  holdingCompanyName: string;
  statesServed: string[];
  techCodes: string[];
}

/** FCC Form 477 technology code labels. */
export const TECH_CODE_LABELS: Record<string, string> = {
  '10': 'DSL (ADSL)',
  '11': 'DSL (ADSL2)',
  '12': 'DSL (VDSL)',
  '40': 'Cable modem (standard)',
  '41': 'Cable modem (DOCSIS 3.0)',
  '42': 'Cable modem (DOCSIS 3.1)',
  '43': 'Cable modem (other)',
  '50': 'Fiber to premises',
  '60': 'Satellite',
  '70': 'Fixed wireless',
};

/** Speed tier labels for provider summary — download tier indices d_1 to d_8. */
export const SPEED_TIER_LABELS: Record<string, string> = {
  d_1: '0.2 Mbps',
  d_2: '4 Mbps',
  d_3: '10 Mbps',
  d_4: '25 Mbps',
  d_5: '50 Mbps',
  d_6: '100 Mbps',
  d_7: '250 Mbps',
  d_8: '1000 Mbps',
};
