/**
 * @fileoverview Types for the FCC Geo API service.
 * @module services/geo-api/types
 */

/** Raw response from FCC Geo API `/api/census/block/find`. */
export interface GeoApiBlockResponse {
  Block?: {
    FIPS?: string;
    bbox?: number[];
  };
  County?: {
    FIPS?: string;
    name?: string;
  };
  executionTime?: string;
  isError?: boolean;
  messages?: string[];
  State?: {
    FIPS?: string;
    code?: string;
    name?: string;
  };
  status?: string;
}

/** Normalized census block location result. */
export interface BlockLocation {
  blockFips: string;
  countyFips: string;
  countyName: string;
  stateCode: string;
  stateFips: string;
  stateName: string;
}
