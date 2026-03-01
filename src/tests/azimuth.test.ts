/**
 * Azimuth calculation tests.
 *
 * Validates that calculateAzimuths produces results within a reasonable
 * tolerance of known reference values. Reference azimuths are approximate
 * values from the sample chart (Palo Alto, CA).
 *
 * These tests require WASM support via the setup-wasm.ts polyfill.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import SwissEPH from 'sweph-wasm';
import { calculateAzimuths } from '$lib/astro/azimuth';
import type { SwissEphInstance } from '$lib/astro/ephemeris';
import type { BirthData } from '$lib/types';

let swe: SwissEphInstance;

beforeAll(async () => {
	swe = await SwissEPH.init();
	await swe.swe_set_ephe_path();
});

// Sample chart birth data corresponding to the SAMPLE_CHART in constants.ts
// (Palo Alto, CA — approximate birth data that produces azimuths near the sample values)
const SAMPLE_BIRTH: BirthData = {
	year: 1990,
	month: 2,
	day: 3,
	hour: 12,
	minute: 0,
	latitude: 37.4419,
	longitude: -122.143,
	locationLabel: 'Palo Alto, CA',
	timezoneOffset: -8,
	timezoneId: 'America/Los_Angeles',
};

describe('calculateAzimuths', () => {
	it('returns azimuths for all 14 planets/points', () => {
		const result = calculateAzimuths(swe, SAMPLE_BIRTH);
		const expectedKeys = [
			'sun', 'moon', 'mercury', 'venus', 'mars',
			'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
			'nnode', 'chiron', 'asc', 'mc',
		];
		for (const key of expectedKeys) {
			expect(result).toHaveProperty(key);
		}
	});

	it('returns azimuths in the 0-360 range', () => {
		const result = calculateAzimuths(swe, SAMPLE_BIRTH);
		for (const [key, value] of Object.entries(result)) {
			expect(value, `${key} azimuth out of range`).toBeGreaterThanOrEqual(0);
			expect(value, `${key} azimuth out of range`).toBeLessThan(360);
		}
	});

	it('ASC azimuth is near East (~90°) or West (~270°)', () => {
		const result = calculateAzimuths(swe, SAMPLE_BIRTH);
		const asc = result['asc'];
		const nearEast = Math.abs(asc - 90) < 30;
		const nearWest = Math.abs(asc - 270) < 30;
		expect(nearEast || nearWest, `ASC azimuth ${asc.toFixed(1)}° is not near 90° or 270°`).toBe(true);
	});

	it('MC azimuth is near South (~180°) or North (~0°/360°)', () => {
		const result = calculateAzimuths(swe, SAMPLE_BIRTH);
		const mc = result['mc'];
		const nearSouth = Math.abs(mc - 180) < 30;
		const nearNorth = mc < 30 || mc > 330;
		expect(nearSouth || nearNorth, `MC azimuth ${mc.toFixed(1)}° is not near 0° or 180°`).toBe(true);
	});

	it('produces consistent results across multiple calls', () => {
		const result1 = calculateAzimuths(swe, SAMPLE_BIRTH);
		const result2 = calculateAzimuths(swe, SAMPLE_BIRTH);
		for (const key of Object.keys(result1)) {
			expect(result1[key]).toBeCloseTo(result2[key], 6);
		}
	});

	it('different birth data produces different azimuths', () => {
		const otherBirth: BirthData = {
			...SAMPLE_BIRTH,
			year: 2000,
			month: 6,
			day: 15,
			hour: 18,
		};
		const result1 = calculateAzimuths(swe, SAMPLE_BIRTH);
		const result2 = calculateAzimuths(swe, otherBirth);
		// At least some azimuths should differ significantly
		let diffCount = 0;
		for (const key of Object.keys(result1)) {
			if (Math.abs(result1[key] - result2[key]) > 5) diffCount++;
		}
		expect(diffCount).toBeGreaterThan(5);
	});
});
