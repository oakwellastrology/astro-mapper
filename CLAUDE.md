# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What

Client-side SvelteKit web app that projects Local Space astrology azimuth lines onto an OpenStreetMap/Leaflet map. No backend, no API keys, no accounts. See SPEC.md for full architecture, data model, and feature specs.

## Stack

SvelteKit (adapter-static), TypeScript (strict), Leaflet + OpenStreetMap, Tailwind CSS, html2canvas, localStorage, Nominatim geocoder, pnpm

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build (static output)
- `pnpm preview` — preview production build locally
- `pnpm test` — run all Vitest tests
- `pnpm test src/tests/geo.test.ts` — run a single test file
- `pnpm lint` — ESLint + Prettier
- `pnpm check` — svelte-check (type checking)

## Architecture

Single-page app: `src/routes/+page.svelte` renders a two-column layout (sidebar + map). All routing is disabled via `export const ssr = false` in `+layout.ts` because Leaflet requires `window`.

**State flow**: Svelte writable stores (`chartStore`, `settingsStore`) are the single source of truth. Components read stores via `$store` syntax. The map component reactively redraws polylines when store values change. localStorage sync is debounced 300ms on every store change.

**Geodesic rendering pipeline**: Azimuth → `geodesicPoints()` computes 100 intermediate points via `destinationPoint()` (Vincenty-style forward projection) → points rendered as `L.polyline`. Each planet gets a forward line (azimuth) and backward line (azimuth + 180°), concatenated into a single polyline. This is required because Leaflet draws straight Mercator lines, not great circles.

**Export pipeline**: Full screenshot uses html2canvas (requires `preferCanvas: true` on Leaflet map). Transparent overlay renders lines only onto an off-screen `<canvas>` by projecting lat/lng → pixel via `map.latLngToContainerPoint()`.

## Key Files

- `src/lib/types.ts` — `ChartConfig`, `PlanetLine` interfaces
- `src/lib/constants.ts` — `DEFAULT_PLANETS` (14 planets/points), `SAMPLE_CHART`
- `src/lib/utils/geo.ts` — `destinationPoint()`, `geodesicPoints()` (core math)
- `src/lib/stores/chartStore.ts` — active chart state + localStorage sync
- `src/lib/components/Map.svelte` — Leaflet map wrapper (dynamic import in onMount)

## Critical Rules

- **Leaflet SSR crash**: Leaflet must be dynamically imported inside `onMount()` — it accesses `window`/`document` at import time
- **Canvas renderer**: Always set `preferCanvas: true` on the Leaflet map instance (required for html2canvas export to work)
- **Geodesic lines**: Leaflet does NOT support `geodesic: true`. Compute 100 intermediate points via `geodesicPoints()` and draw as a regular `L.polyline`. Never use a simple two-point polyline for azimuth lines.
- **Reactive map updates**: Use Svelte `$:` blocks and store subscriptions to keep the map in sync — do NOT imperatively manage Leaflet objects outside of reactive flows
- **localStorage**: Serialize/deserialize JSON, debounce writes 300ms
- **Nominatim geocoder**: Max 1 req/sec, include `User-Agent: LocalSpaceMap/1.0` header, debounce input 500ms

## Line Styling

Lines are styled by planet category. See SPEC.md for the full table, but the key distinction: `personal`/`social` planets use solid lines, `transpersonal`/`point` use dashed (`dashArray`). Hover increases opacity to 1.0 and weight by 1, showing a tooltip with symbol, name, and azimuth.

## ACG + Auto-Azimuth Extension

- See ACG_FEATURE_SPEC.md for full spec.
- Depends on sweph-wasm (Swiss Ephemeris compiled to WASM). Must be dynamically imported in onMount — crashes during SSR.
- New files go in src/lib/astro/ (ephemeris.ts, azimuth.ts, acg.ts, timezone.ts).
- CRITICAL: swe_azalt() returns azimuth from SOUTH clockwise. Convert to North-clockwise: (az + 180) % 360.
- ACG lines are a separate Leaflet layer group from Local Space lines. User toggles between them.
- License: AGPL-3.0 (required by Swiss Ephemeris). Add LICENSE file.
