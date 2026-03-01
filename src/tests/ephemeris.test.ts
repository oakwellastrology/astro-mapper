/**
 * Swiss Ephemeris WASM integration tests.
 *
 * These tests verify that sweph-wasm initializes correctly and returns
 * accurate astronomical data. They require WASM support in the test
 * environment — if they fail due to WASM loading issues, run them
 * manually in the browser via `pnpm dev` (smoke tests log to console).
 */
import { describe, it, expect } from 'vitest';
import SwissEPH from 'sweph-wasm';

describe('Swiss Ephemeris WASM', () => {
	it('swe_julday returns the J2000 epoch value', async () => {
		const swe = await SwissEPH.init();
		const jd = swe.swe_julday(2000, 1, 1, 12, 1); // 1 = Gregorian
		expect(jd).toBeCloseTo(2451545.0, 1);
	});

	it('swe_calc_ut returns Sun longitude ~280° for Jan 1 2000 noon', async () => {
		const swe = await SwissEPH.init();
		const jd = swe.swe_julday(2000, 1, 1, 12, 1);
		const sunPos = swe.swe_calc_ut(jd, 0, 0); // planet 0 = Sun
		// Sun at J2000 should be in Capricorn, ~280° ecliptic longitude
		expect(sunPos[0]).toBeGreaterThan(270);
		expect(sunPos[0]).toBeLessThan(290);
	});

	it('swe_azalt returns valid horizontal coordinates', async () => {
		const swe = await SwissEPH.init();
		const jd = swe.swe_julday(2000, 1, 1, 12, 1);
		const sunPos = swe.swe_calc_ut(jd, 0, 0);
		// Greenwich Observatory: lon=0, lat=51.5, elev=0
		const geopos: [number, number, number] = [0, 51.5, 0];
		const xin: [number, number, number] = [sunPos[0], sunPos[1], sunPos[2]];
		const xaz = swe.swe_azalt(jd, 0, geopos, 0, 0, xin);
		// Should return [azimuth, altitude, apparent_altitude]
		expect(xaz).toHaveLength(3);
		// Azimuth should be 0-360
		expect(xaz[0]).toBeGreaterThanOrEqual(0);
		expect(xaz[0]).toBeLessThan(360);
		// Altitude should be -90 to 90
		expect(xaz[1]).toBeGreaterThanOrEqual(-90);
		expect(xaz[1]).toBeLessThanOrEqual(90);
	});
});
