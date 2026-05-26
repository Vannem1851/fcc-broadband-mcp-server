# fcc-broadband-mcp-server

FCC Broadband Data Collection — internet availability, speeds, and provider coverage across the US.

## API

- **Base**: `https://broadbandmap.fcc.gov/api/` (public map API)
- **Auth**: None for public endpoints
- **Docs**: https://broadbandmap.fcc.gov/developer-resources
- **Bulk data**: https://broadbandmap.fcc.gov/data-download
- **Alt**: FCC Open Data (Socrata) at https://opendata.fcc.gov/

## Key data

- **Fixed broadband**: Provider availability by address/census block, technology type (fiber, cable, DSL, fixed wireless, satellite), advertised speeds
- **Mobile broadband**: 5G/4G/3G coverage by provider and technology
- **Fabric**: The FCC's address-level location fabric (Broadband Serviceable Locations)
- **Form 477**: Historical provider-reported coverage (legacy, pre-BDC)
- **Subscription**: Broadband adoption rates by geography
- **Community anchor institutions**: Schools, libraries, hospitals — broadband status

## Cross-domain value

| Chain to | Query |
|---|---|
| Census | Broadband availability → demographic and income correlations (digital divide) |
| BLS | Internet access → remote work capability by region |
| College Scorecard | Online degree accessibility by student location |
| CDC | Telehealth access → broadband availability |
| OpenStates | State broadband funding legislation |
| Congress | Federal broadband infrastructure bills (BEAD program, etc.) |
| OpenStreetMap | Provider coverage mapped against population density |
| NOAA / NWS | Disaster response + broadband outages |

## Tool ideas

- `fcc_search_availability` — broadband providers and speeds at a location
- `fcc_get_coverage_area` — provider coverage for a geographic area (county, state)
- `fcc_compare_areas` — broadband metrics comparison across geographies
- `fcc_search_providers` — find ISPs by name, technology, service area
- `fcc_get_provider` — provider profile with coverage footprint
- `fcc_get_adoption` — broadband subscription/adoption rates by geography

## Licensing (audited 2026-05-25)

- **Status: Clear to host**
- US federal government data (FCC) — public domain under 17 USC §105
- No auth required for public endpoints
- Bulk data downloads also freely available

## Notes

- Broadband Map underwent a major overhaul in 2022–2023 (BDC replaced Form 477) — use the new BDC API, not legacy endpoints
- Digital divide analysis is a natural cross-domain scenario — broadband + census + BLS + education
- BEAD (Broadband Equity, Access, and Deployment) program funding flows make this a live policy topic
