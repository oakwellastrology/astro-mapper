# Feature Spec: ACG Lines + Auto-Azimuth Calculation

## Overview

Two features that share a common dependency on the Swiss Ephemeris (WASM):

**Feature A — Auto-Azimuth:** Given birth date, time, and location, automatically calculate planetary azimuth bearings (Local Space chart) and populate the azimuth form.

**Feature B — ACG Lines:** Compute and render Astro*Carto*Graphy lines (MC/IC/ASC/DSC for each planet) on the Leaflet map.

---

## Dependency: Swiss Ephemeris WASM

**Package:** `sweph-wasm` (by PtPrashantTripathi) — TypeScript bindings for Swiss Ephemeris compiled to WebAssembly.

```bash
pnpm add sweph-wasm
```

**Initialization (must be in onMount or dynamic import):**

```typescript
import SwissEPH from "sweph-wasm";

let swe: Awaited<ReturnType<typeof SwissEPH.init>>;

onMount(async () => {
  swe = await SwissEPH.init();
  // Optionally load high-precision ephemeris files:
  // await swe.swe_set_ephe_path('/ephe');
});
```

**License:** AGPL-3.0. The entire app must be open-sourced under AGPL. Add `LICENSE` file accordingly.

**Precision:** The built-in Moshier ephemeris (~1 arcsec) is more than sufficient for astrological purposes. No ephemeris files needed unless you want 0.001 arcsec precision.

---

## New Files

```
src/lib/astro/
  ├── ephemeris.ts       # SwissEph WASM singleton init + wrapper
  ├── azimuth.ts         # calculateAzimuths(birthData) → Record<string, number>
  ├── acg.ts             # computeACGLines(birthData) → ACGLine[]
  └── timezone.ts        # TZ lookup from lat/lng, UTC conversion
src/lib/components/
  ├── BirthDataForm.svelte   # Date, time, location, TZ inputs
  ├── ACGToggle.svelte       # Layer toggle for ACG line visibility
  └── MapLegendACG.svelte    # Legend showing ACG line types
src/lib/stores/
  └── birthDataStore.ts      # BirthData state + computed results
src/lib/types.ts             # Add BirthData, ACGLine interfaces
static/ephe/                 # Optional: sepl_18.se1, semo_18.se1 for high precision
```

---

## Data Model

### BirthData

```typescript
interface BirthData {
  year: number;
  month: number;        // 1-12
  day: number;          // 1-31
  hour: number;         // 0-23
  minute: number;       // 0-59
  latitude: number;
  longitude: number;
  locationLabel: string; // e.g. "New York, NY"
  timezoneOffset: number; // hours from UTC (e.g. -5 for EST)
  timezoneId: string;   // IANA timezone ID, e.g. "America/New_York"
}
```

### ACGLine

```typescript
interface ACGLine {
  planetId: string;     // 'sun', 'moon', 'mercury', etc.
  planetName: string;
  planetSymbol: string;
  angleType: 'MC' | 'IC' | 'ASC' | 'DSC';
  points: { lat: number; lng: number }[];
  color: string;        // uses same planet color from DEFAULT_PLANETS
  visible: boolean;
}
```

---

## Feature A: Auto-Calculate Azimuths

### Algorithm

```typescript
// src/lib/astro/azimuth.ts

const PLANET_MAP = [
  ['sun', 0], ['moon', 1], ['mercury', 2], ['venus', 3], ['mars', 4],
  ['jupiter', 5], ['saturn', 6], ['uranus', 7], ['neptune', 8], ['pluto', 9],
  ['nnode', 11],   // True Node
  ['chiron', 15],
] as const;

async function calculateAzimuths(
  swe: SwissEphInstance,
  birth: BirthData
): Promise<Record<string, number>> {
  const utcHour = birth.hour + birth.minute / 60 - birth.timezoneOffset;
  const jd = swe.swe_julday(birth.year, birth.month, birth.day, utcHour, 1);
  swe.swe_set_topo(birth.longitude, birth.latitude, 0);

  const geopos = [birth.longitude, birth.latitude, 0];
  const results: Record<string, number> = {};

  for (const [name, planetId] of PLANET_MAP) {
    const pos = swe.swe_calc_ut(jd, planetId, 0); // ecliptic lon, lat, dist
    const xin = [pos[0], pos[1], pos[2]];
    // SE_ECL2HOR = 0
    const xaz = swe.swe_azalt(jd, 0, geopos, 0, 0, xin);
    // xaz[0] = azimuth from South, clockwise
    // Convert to azimuth from North, clockwise:
    results[name] = (xaz[0] + 180) % 360;
  }

  // ASC and MC from house calculation
  const houses = swe.swe_houses(jd, birth.latitude, birth.longitude, 'P'.charCodeAt(0));
  // houses.ascmc[0] = Ascendant ecliptic longitude
  // houses.ascmc[1] = MC ecliptic longitude

  for (const [name, eclLon] of [['asc', houses.ascmc[0]], ['mc', houses.ascmc[1]]]) {
    const xin = [eclLon, 0, 1]; // latitude 0 for ecliptic points
    const xaz = swe.swe_azalt(jd, 0, geopos, 0, 0, xin);
    results[name] = (xaz[0] + 180) % 360;
  }

  return results; // e.g. { sun: 211.3, moon: 195.1, ... }
}
```

### CRITICAL: Azimuth Convention

SwissEph `swe_azalt()` returns azimuth measured from **South**, clockwise.
Your app uses azimuth from **North**, clockwise (standard compass bearing).

**Always convert:** `azimuth_north = (azimuth_south + 180) % 360`

**Validation:** The ASC azimuth should always be close to ~90° (East) or ~270° (West). If it's near 0° or 180°, you have the convention backwards.

### Integration

When the user clicks "Calculate" in BirthDataForm:
1. Call `calculateAzimuths(swe, birthData)`
2. For each planet in the result, update `chartStore` → `planet.azimuth = result[planet.id]`
3. The existing reactive system automatically redraws Local Space lines on the map.
4. The user can still manually edit any azimuth value afterward.

---

## Feature B: ACG Lines

### MC / IC Lines (Easy)

For each planet, the MC line is a vertical line at the longitude where the planet culminates.

```typescript
function computeMCLongitude(
  swe: SwissEphInstance,
  jd: number,
  planetEclLon: number
): number {
  // Get Greenwich Sidereal Time in degrees
  const gst = swe.swe_sidtime(jd) * 15; // convert hours to degrees

  // The MC longitude for a planet is where its ecliptic longitude
  // equals the local MC. Approximate via RA:
  // For a more precise (zodiacal) calculation, iterate:
  // find the geographic longitude where swe_houses() produces
  // a MC that matches the planet's ecliptic longitude.

  // Quick method using ARMC:
  // ARMC = GST + geographic_longitude (in degrees)
  // We want: MC(ARMC, obliquity) = planet_ecliptic_longitude
  // Solve for geographic_longitude

  const obliquity = swe.swe_calc_ut(jd, -1, 0)[0]; // SE_ECL_NUT
  // For MC: MC = atan2(sin(ARMC), cos(ARMC) * cos(obliquity))
  // This needs to be solved numerically for ARMC given MC = planetLon
  // Then: geo_longitude = ARMC - GST

  // Practical approach: use swe_houses_armc in a binary search
  // or use the simplified RA-based method (accurate to ~1°)
  const planetRA = eclipticToRA(planetEclLon, 0, obliquity);
  let lon = planetRA - gst;
  // Normalize to -180..180
  lon = ((lon + 180) % 360) - 180;
  return lon;
}
```

MC line: vertical polyline at `[{lat: -90, lng: mcLon}, {lat: 90, lng: mcLon}]`
IC line: same but at `mcLon + 180` (normalized)

### ASC / DSC Lines (Medium-Hard)

For each planet, sweep latitudes from -66 to +66 and find the longitude where the planet's ecliptic longitude matches the local Ascendant.

```typescript
function computeASCLine(
  swe: SwissEphInstance,
  jd: number,
  planetEclLon: number
): { lat: number; lng: number }[] {
  const gst = swe.swe_sidtime(jd) * 15;
  const points: { lat: number; lng: number }[] = [];

  for (let lat = -65; lat <= 65; lat += 1) {
    // Binary search for the longitude where ASC = planetEclLon
    let lo = -180, hi = 180;
    for (let iter = 0; iter < 30; iter++) {
      const mid = (lo + hi) / 2;
      const armc = gst + mid;
      const houses = swe.swe_houses_armc(armc, lat, obliquity, 'P'.charCodeAt(0));
      const localAsc = houses.ascmc[0];
      const diff = angleDiff(localAsc, planetEclLon);
      if (diff > 0) hi = mid; else lo = mid;
    }
    const lng = (lo + hi) / 2;
    // Normalize longitude
    const normalizedLng = ((lng + 180) % 360) - 180;
    points.push({ lat, lng: normalizedLng });
  }

  return points;
}

function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}
```

DSC line: same computation but target `planetEclLon + 180` (the Descendant is opposite the Ascendant).

### Edge Cases

- **Polar latitudes (above ~66°):** Some planets are circumpolar and never rise/set. The binary search will fail to converge. Skip those latitudes — the line simply doesn't exist there. This creates natural endpoints for ASC/DSC curves, which is correct ACG behavior.
- **Planets near the ecliptic poles:** Pluto can have high ecliptic latitude (~17°). This affects the ASC/DSC curve shape but doesn't break the algorithm.
- **Date line crossing:** ACG lines that cross the 180° meridian may need to be split into two polyline segments to avoid Leaflet drawing a line across the entire map.

### Performance

- ~10 planets × 4 line types = 40 lines
- ASC/DSC: ~130 latitude points each × 30 binary search iterations = ~3,900 swe_houses_armc calls per line
- Total: ~31,200 calls for all ASC/DSC lines
- At ~10-50μs per call in WASM: **~0.3 to 1.5 seconds total**
- Compute once on birth data entry, cache the results. Recompute only when birth data changes.

---

## UI Integration

### New Sidebar Tab: Birth Data

Position: between "Charts" and "Azimuths" tabs.

Contents:
- Date picker (year/month/day)
- Time input (HH:MM, 24h format)
- Location search (reuse existing Nominatim component)
- Timezone selector (auto-detected from lat/lng, manually overridable)
- "Calculate" button → computes azimuths + ACG lines
- Status indicator: "Calculated for [date] at [location]" or "Not yet calculated"

### Map Layer Controls

Floating control panel (top-right of map):
- Toggle: "Local Space Lines" (on/off)
- Toggle: "ACG Lines" (on/off)
- Sub-toggles for ACG: "MC/IC" (on/off), "ASC/DSC" (on/off)

Per-planet ACG visibility: reuse existing planet toggle rows, add an "ACG" column.

### ACG Line Styling

| Line Type | Weight | Dash Pattern | Label Format |
|-----------|--------|--------------|--------------|
| MC        | 2px    | solid        | "☉ MC" at top of line |
| IC        | 2px    | "6, 4"       | "☉ IC" at bottom of line |
| ASC       | 2.5px  | solid        | "☉ ASC" near equator crossing |
| DSC       | 2.5px  | "6, 4"       | "☉ DSC" near equator crossing |

Colors: same as Local Space planet colors. Opacity: 0.6 (slightly more transparent than Local Space lines to distinguish layers).

---

## Build Phases

| Phase | Scope | Est. |
|-------|-------|------|
| E1 | Install sweph-wasm, init WASM in onMount, verify swe_calc_ut + swe_azalt work. Unit tests. | 2-3 days |
| E2 | BirthDataForm.svelte, timezone detection, birthDataStore with localStorage. | 2-3 days |
| E3 | azimuth.ts: auto-calculate azimuths, wire to chartStore. Validate vs astro-seek.com. | 2-3 days |
| E4 | acg.ts: MC/IC lines. Render as vertical polylines. Layer group + toggle. | 1-2 days |
| E5 | acg.ts: ASC/DSC curves. Binary search sweep. Polar edge cases. Validate vs astro.com. | 3-5 days |
| E6 | Polish: legend, labels, hover tooltips, combined toggle, mobile layout, performance. | 2-3 days |
