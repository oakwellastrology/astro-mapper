import { describe, it, expect } from 'vitest';
import { destinationPoint, geodesicPoints } from '../lib/utils/geo';

describe('destinationPoint', () => {
	it('bearing 0° from equator goes due north', () => {
		const result = destinationPoint({ lat: 0, lng: 0 }, 0, 111_195);
		// ~1 degree of latitude north
		expect(result.lat).toBeCloseTo(1.0, 0);
		expect(result.lng).toBeCloseTo(0, 5);
	});

	it('bearing 90° from (0, 0) goes due east', () => {
		const result = destinationPoint({ lat: 0, lng: 0 }, 90, 111_195);
		expect(result.lat).toBeCloseTo(0, 5);
		expect(result.lng).toBeCloseTo(1.0, 0);
	});

	it('100km north of London arrives at roughly correct latitude', () => {
		// London: 51.5074° N, 0.1278° W
		const london = { lat: 51.5074, lng: -0.1278 };
		const result = destinationPoint(london, 0, 100_000);
		// 100km north ≈ +0.9° latitude
		expect(result.lat).toBeCloseTo(52.41, 0);
		expect(result.lng).toBeCloseTo(london.lng, 0);
	});

	it('bearing 180° goes due south', () => {
		const result = destinationPoint({ lat: 10, lng: 0 }, 180, 111_195);
		expect(result.lat).toBeCloseTo(9.0, 0);
		expect(result.lng).toBeCloseTo(0, 5);
	});
});

describe('geodesicPoints', () => {
	it('returns numPoints + 1 points (inclusive of start)', () => {
		const points = geodesicPoints({ lat: 0, lng: 0 }, 45, 1_000_000, 50);
		expect(points).toHaveLength(51);
	});

	it('first point is at the origin', () => {
		const origin = { lat: 37.44, lng: -122.14 };
		const points = geodesicPoints(origin, 90, 1_000_000, 10);
		expect(points[0].lat).toBeCloseTo(origin.lat, 10);
		expect(points[0].lng).toBeCloseTo(origin.lng, 10);
	});

	it('default parameters return 101 points', () => {
		const points = geodesicPoints({ lat: 0, lng: 0 }, 0);
		expect(points).toHaveLength(101);
	});
});
