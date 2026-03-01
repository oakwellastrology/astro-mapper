# Local Space Astrology Map Overlay

## What
Client-side SvelteKit web app that projects Local Space astrology azimuth lines onto an OpenStreetMap/Leaflet map. No backend, no API keys, no accounts. See SPEC.md for full architecture and data model.

## Stack
SvelteKit (adapter-static), TypeScript (strict), Leaflet + OpenStreetMap, Tailwind CSS, html2canvas, localStorage, Nominatim geocoder

## Key Commands
- `pnpm dev` — start dev server
- `pnpm build` — production build (static output)
- `pnpm preview` — preview production build locally
- `pnpm test` — run Vitest
- `pnpm lint` — ESLint + Prettier
- `pnpm check` — svelte-check (type checking)

## Structure
- `src/routes/+page.svelte` — single page app (map + sidebar)
- `src/routes/+layout.ts` — `export const ssr = false` (Leaflet needs window)
- `src/lib/components/` — Svelte components (Map, Sidebar, AzimuthForm, etc.)
- `src/lib/stores/` — Svelte writable stores (chartStore, settingsStore)
- `src/lib/utils/geo.ts` — geodesic math (destinationPoint, geodesicPoints)
- `src/lib/utils/export.ts` — PNG export logic (html2canvas + off-screen canvas)
- `src/lib/utils/geocoder.ts` — Nominatim API helper
- `src/lib/types.ts` — ChartConfig, PlanetLine interfaces
- `src/lib/constants.ts` — DEFAULT_PLANETS, SAMPLE_CHART

## Critical Rules
- Leaflet must be dynamically imported inside `onMount()` — it crashes during SSR
- Always set `preferCanvas: true` on the Leaflet map (required for html2canvas export)
- All data persistence uses localStorage — serialize/deserialize JSON, debounce writes 300ms
- Nominatim geocoder: max 1 req/sec, include `User-Agent: LocalSpaceMap/1.0` header, debounce 500ms
- Geodesic lines: Leaflet does NOT support `geodesic: true`. Compute 100 intermediate points via `geodesicPoints()` and draw as a regular `L.polyline`. See SPEC.md "Geodesic Math" section.
- Use Svelte's reactive `$:` blocks and store subscriptions to keep the map in sync with UI state — do NOT imperatively manage Leaflet objects outside of reactive flows
- For geodesic math details, see SPEC.md or docs/geodesic-math.md
