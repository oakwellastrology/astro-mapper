# Local Space Astrology Map Overlay — Web App Spec

## Overview

A client-side SvelteKit web app that renders Local Space astrology azimuth lines as interactive geodesic polylines on an OpenStreetMap/Leaflet map. Users enter planetary bearings, see them projected onto a real map, toggle lines on/off, and export overlays as transparent PNGs. No API keys, no accounts, no backend.

---

## Tech Stack

| Category         | Choice                              | Notes                                                        |
|------------------|-------------------------------------|--------------------------------------------------------------|
| Language         | TypeScript (strict)                 |                                                              |
| Framework        | SvelteKit                           | Use `adapter-static` for pure static output                  |
| Maps             | Leaflet + OpenStreetMap tiles       | No API key needed. Set `preferCanvas: true` on the map       |
| Styling          | Tailwind CSS                        |                                                              |
| Export           | html2canvas + custom canvas logic   | Full screenshot + transparent overlay                        |
| Persistence      | localStorage                        | Serialized chart JSON on every change                        |
| Geocoding        | Nominatim (OSM)                     | Free, no API key. Max 1 req/sec, debounce 500ms             |
| Hosting          | Cloudflare Pages (free)             | Or Vercel free tier, or GitHub Pages                         |
| Package Manager  | pnpm                                |                                                              |
| Testing          | Vitest                              |                                                              |
| Linting          | ESLint + Prettier                   |                                                              |

---

## Project Structure

```
local-space-app/
├── svelte.config.js            # adapter-static
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── CLAUDE.md
├── SPEC.md                     # This file
├── static/                     # Favicon, OG image
├── src/
│   ├── app.html
│   ├── app.css                 # Tailwind @import directives
│   ├── routes/
│   │   ├── +page.svelte        # Main (only) page — map + sidebar
│   │   └── +layout.ts          # export const ssr = false;
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Map.svelte              # Leaflet map wrapper
│   │   │   ├── Sidebar.svelte          # Tabbed control panel
│   │   │   ├── AzimuthForm.svelte      # Per-planet azimuth entry
│   │   │   ├── CompassPreview.svelte   # Live SVG compass
│   │   │   ├── LocationPanel.svelte    # Search, GPS, manual, saved
│   │   │   ├── ChartManager.svelte     # Select/create/import/export charts
│   │   │   ├── ExportPanel.svelte      # PNG export buttons
│   │   │   └── LineToggle.svelte       # Individual planet toggle row
│   │   ├── stores/
│   │   │   ├── chartStore.ts           # Active chart state + localStorage sync
│   │   │   └── settingsStore.ts        # Opacity, theme, preferences
│   │   ├── utils/
│   │   │   ├── geo.ts                  # destinationPoint, intermediatePoints
│   │   │   ├── export.ts              # html2canvas + transparent overlay logic
│   │   │   └── geocoder.ts            # Nominatim search helper
│   │   ├── types.ts                    # ChartConfig, PlanetLine, etc.
│   │   └── constants.ts               # DEFAULT_PLANETS, SAMPLE_CHART
│   └── tests/
│       ├── geo.test.ts
│       └── store.test.ts
└── docs/
    └── geodesic-math.md
```

---

## Critical SvelteKit + Leaflet Constraint

Leaflet depends on `window` and `document`. These don't exist during SSR. Handle this by:

```typescript
// src/routes/+layout.ts
export const ssr = false;
```

This makes the entire app client-rendered only. Since there's no SEO-critical content (it's an interactive tool), this is the right tradeoff.

Inside `Map.svelte`, import Leaflet dynamically in `onMount`:

```typescript
import { onMount } from 'svelte';

let map: L.Map;

onMount(async () => {
  const L = await import('leaflet');
  await import('leaflet/dist/leaflet.css');
  
  map = L.map(container, { preferCanvas: true }).setView([lat, lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
});
```

---

## Data Model

### ChartConfig

```typescript
interface ChartConfig {
  id: string;                     // crypto.randomUUID()
  name: string;                   // e.g. "My Birth Chart"
  centerLocation: {
    lat: number;
    lng: number;
    label: string;                // e.g. "Palo Alto, CA"
  };
  planets: PlanetLine[];
  createdAt: string;              // ISO 8601
}
```

### PlanetLine

```typescript
interface PlanetLine {
  id: string;                     // e.g. "sun", "moon", "mars"
  name: string;
  symbol: string;                 // Unicode glyph
  azimuth: number | null;         // 0–360 clockwise from North; null = not yet entered
  color: string;                  // hex, e.g. "#FF4444"
  lineStyle: "solid" | "dashed";
  visible: boolean;
  category: "personal" | "social" | "transpersonal" | "point";
}
```

### Default Planet Definitions

```typescript
export const DEFAULT_PLANETS: Omit<PlanetLine, "azimuth">[] = [
  { id: "sun",      name: "Sun",      symbol: "☉",   color: "#FF4444", lineStyle: "solid",  visible: true, category: "personal" },
  { id: "moon",     name: "Moon",     symbol: "☽",   color: "#4444FF", lineStyle: "solid",  visible: true, category: "personal" },
  { id: "mercury",  name: "Mercury",  symbol: "☿",   color: "#44AA44", lineStyle: "solid",  visible: true, category: "personal" },
  { id: "venus",    name: "Venus",    symbol: "♀",   color: "#44CC44", lineStyle: "solid",  visible: true, category: "personal" },
  { id: "mars",     name: "Mars",     symbol: "♂",   color: "#FF4444", lineStyle: "solid",  visible: true, category: "personal" },
  { id: "jupiter",  name: "Jupiter",  symbol: "♃",   color: "#CC4444", lineStyle: "solid",  visible: true, category: "social" },
  { id: "saturn",   name: "Saturn",   symbol: "♄",   color: "#333333", lineStyle: "solid",  visible: true, category: "social" },
  { id: "uranus",   name: "Uranus",   symbol: "♅",   color: "#4444FF", lineStyle: "dashed", visible: true, category: "transpersonal" },
  { id: "neptune",  name: "Neptune",  symbol: "♆",   color: "#6644FF", lineStyle: "dashed", visible: true, category: "transpersonal" },
  { id: "pluto",    name: "Pluto",    symbol: "♇",   color: "#44AA44", lineStyle: "dashed", visible: true, category: "transpersonal" },
  { id: "nnode",    name: "N. Node",  symbol: "☊",   color: "#666666", lineStyle: "dashed", visible: true, category: "point" },
  { id: "chiron",   name: "Chiron",   symbol: "⚷",   color: "#666666", lineStyle: "dashed", visible: true, category: "point" },
  { id: "asc",      name: "ASC",      symbol: "ASC", color: "#888888", lineStyle: "solid",  visible: true, category: "point" },
  { id: "mc",       name: "MC",       symbol: "MC",  color: "#888888", lineStyle: "solid",  visible: true, category: "point" },
];
```

### Sample Chart (preloaded on first visit)

```typescript
export const SAMPLE_CHART: ChartConfig = {
  id: "sample",
  name: "Sample Chart (Palo Alto)",
  centerLocation: { lat: 37.4419, lng: -122.143, label: "Palo Alto, CA" },
  createdAt: new Date().toISOString(),
  planets: DEFAULT_PLANETS.map(p => ({
    ...p,
    azimuth: SAMPLE_AZIMUTHS[p.id] ?? null,
  })),
};

const SAMPLE_AZIMUTHS: Record<string, number> = {
  sun: 211, moon: 195, mercury: 215, venus: 239, mars: 200,
  jupiter: 68, saturn: 301, uranus: 307, neptune: 318, pluto: 266,
  nnode: 136, chiron: 157, asc: 332, mc: 270,
};
```

---

## Geodesic Math

### Core: `destinationPoint`

```typescript
function destinationPoint(
  origin: { lat: number; lng: number },
  bearingDeg: number,
  distanceMeters: number
): { lat: number; lng: number } {
  const R = 6_371_000;
  const δ = distanceMeters / R;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (origin.lat * Math.PI) / 180;
  const λ1 = (origin.lng * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );

  return { lat: (φ2 * 180) / Math.PI, lng: (λ2 * 180) / Math.PI };
}
```

### Computing Intermediate Points for a Geodesic Polyline

Leaflet draws straight Mercator lines, not great circles. Compute ~100 intermediate points to simulate geodesic rendering:

```typescript
function geodesicPoints(
  origin: { lat: number; lng: number },
  bearingDeg: number,
  totalDistanceMeters: number = 20_000_000,
  numPoints: number = 100
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const d = (i / numPoints) * totalDistanceMeters;
    points.push(destinationPoint(origin, bearingDeg, d));
  }
  return points;
}
```

### Drawing a Line for One Planet

1. `const forward = geodesicPoints(center, azimuth, 20_000_000, 100);`
2. `const backward = geodesicPoints(center, (azimuth + 180) % 360, 20_000_000, 100);`
3. `const fullPath = [...backward.reverse(), ...forward];`
4. `L.polyline(fullPath.map(p => [p.lat, p.lng]), { color, weight, dashArray, opacity }).addTo(map);`

### Line Styling by Category

| Category        | Weight | dashArray | Opacity |
|-----------------|--------|-----------|---------|
| personal        | 3      | null      | 0.7     |
| social          | 2.5    | null      | 0.7     |
| transpersonal   | 2      | "8, 6"   | 0.7     |
| point           | 1.5    | "4, 4"   | 0.7     |

Hover: opacity → 1.0, weight += 1. Show tooltip: "{symbol} {name} — {azimuth}°".

---

## Feature Specs

### Azimuth Entry

- One row per planet, grouped by category with collapsible group headers.
- Each row: symbol, name, `<input type="number" min="0" max="360" step="0.1">`, color swatch, line style toggle, visibility toggle.
- Compass preview (SVG circle, 150px) updates reactively as values change.
- Auto-save to localStorage on change (debounce 300ms).

### Location Management

- **Search**: Text input → Nominatim API (`https://nominatim.openstreetmap.org/search?q=...&format=json&limit=5`). Debounce 500ms. Show results in dropdown; click to select. Include `User-Agent: LocalSpaceMap/1.0` header.
- **GPS**: "Use My Location" button → `navigator.geolocation.getCurrentPosition()`.
- **Manual**: Lat/lng numeric inputs.
- **Saved locations**: Array in localStorage. Add/rename/delete. Click to switch.
- On center change: clear existing polylines, redraw all from new origin.
- Show note: "In strict Local Space practice, changing location requires recalculating the chart for that location."

### Line Toggles

- Per-planet toggle (checkbox/switch) in azimuth form row.
- Per-group toggle-all in group header.
- Solo mode: icon button per row. Click → hide all others. Click again → restore.
- Global opacity slider (range 0–100, maps to 0.0–1.0).
- Global thickness multiplier (range 0.5x–3x).

### Export

- **Full Screenshot**: Capture map viewport (tiles + lines) via html2canvas. `preferCanvas: true` required on Leaflet map. Download as PNG.
- **Transparent Overlay**: Lines only (no tiles) on off-screen `<canvas>`. Use `map.latLngToContainerPoint()` to project coordinates. Stroke lines with transparent background. Download as PNG.
- **2x Scale**: Optional toggle for retina-quality exports.
- **JSON Export/Import**: Download ChartConfig as `.json`. Upload `.json` to restore.

### Chart Management

- Multiple saved charts in localStorage.
- Chart list: name, location, date. Click to activate.
- "New Chart" pre-fills DEFAULT_PLANETS with null azimuths.
- "Load Sample" loads pre-filled sample chart.
- "Duplicate" clones active chart.
- "Delete" with confirmation.

---

## UI Layout

### Desktop (≥1024px)
Two-column: 320px collapsible sidebar (left) + full map (right). Sidebar tabs: Charts, Azimuths, Location, Settings. Floating legend top-right of map.

### Mobile (<1024px)
Full-width map. Bottom drawer (swipe up/down). Same tabs inside drawer.

### Theme
Sidebar: dark navy `#1a1a2e`, white text. Map: default OSM tiles, optional CartoDB Dark Matter. Line colors: customizable per planet.

---

## Nominatim Usage Rules

- Max 1 request per second. Debounce search to 500ms.
- Include `User-Agent: LocalSpaceMap/1.0` header.
- Endpoint: `https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5`
- Fallback geocoder: Photon by Komoot (also free, no key).

---

## Build Milestones

| Phase | Scope | Time |
|-------|-------|------|
| 1: Scaffold | SvelteKit + TS + Tailwind + adapter-static. Route with `ssr = false`. Leaflet map + OSM tiles. Two-column layout. | 2–3 days |
| 2: Azimuth Entry | Svelte stores, azimuth form, DEFAULT_PLANETS, localStorage persistence, compass preview, sample chart. | 3–4 days |
| 3: Line Rendering | `destinationPoint`, `geodesicPoints`, polylines on map, styling by category, hover tooltips, reactive redraw. | 3–4 days |
| 4: Controls | Per-planet toggles, group toggles, solo mode, opacity slider, thickness multiplier. | 2–3 days |
| 5: Location | Nominatim search, geolocation, manual entry, saved locations, redraw on change. | 2–3 days |
| 6: Export | Full screenshot PNG, transparent overlay PNG, 2x scale, JSON import/export. | 2–3 days |
| 7: Polish & Deploy | Mobile layout, dark theme, error handling, sample chart UX, deploy to Cloudflare Pages. | 2–3 days |
