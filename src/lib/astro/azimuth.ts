import type { SwissEphInstance } from './ephemeris';
import type { BirthData } from '../types';

/**
 * Maps planet IDs used in the app to Swiss Ephemeris planet numbers.
 * 'asc' and 'mc' are handled separately via swe_houses.
 */
const PLANET_MAP: [string, number][] = [
	['sun', 0],
	['moon', 1],
	['mercury', 2],
	['venus', 3],
	['mars', 4],
	['jupiter', 5],
	['saturn', 6],
	['uranus', 7],
	['neptune', 8],
	['pluto', 9],
	['nnode', 11], // True Node
	['chiron', 15],
];

/**
 * Calculate Local Space azimuths for all planets given birth data.
 * Returns a Record mapping planet IDs to azimuth bearings (0-360, from North clockwise).
 *
 * CRITICAL: swe_azalt() returns azimuth from SOUTH clockwise.
 * We convert to North-clockwise: (az + 180) % 360.
 */
export function calculateAzimuths(
	swe: SwissEphInstance,
	birth: BirthData
): Record<string, number> {
	const utcHour = birth.hour + birth.minute / 60 - birth.timezoneOffset;
	const jd = swe.swe_julday(birth.year, birth.month, birth.day, utcHour, 1);
	swe.swe_set_topo(birth.longitude, birth.latitude, 0);

	const geopos: [number, number, number] = [birth.longitude, birth.latitude, 0];
	const results: Record<string, number> = {};

	for (const [name, planetId] of PLANET_MAP) {
		const pos = swe.swe_calc_ut(jd, planetId, 0);
		const xin: [number, number, number] = [pos[0], pos[1], pos[2]];
		// SE_ECL2HOR = 0
		const xaz = swe.swe_azalt(jd, 0, geopos, 0, 0, xin);
		// xaz[0] = azimuth from South clockwise → convert to North clockwise
		results[name] = (xaz[0] + 180) % 360;
	}

	// ASC and MC from house calculation (Placidus)
	const houses = swe.swe_houses(jd, birth.latitude, birth.longitude, 'P');
	// houses.ascmc[0] = Ascendant ecliptic longitude
	// houses.ascmc[1] = MC ecliptic longitude

	for (const [name, eclLon] of [
		['asc', houses.ascmc[0]],
		['mc', houses.ascmc[1]],
	] as const) {
		const xin: [number, number, number] = [eclLon, 0, 1]; // latitude 0 for ecliptic points
		const xaz = swe.swe_azalt(jd, 0, geopos, 0, 0, xin);
		results[name] = (xaz[0] + 180) % 360;
	}

	return results;
}
