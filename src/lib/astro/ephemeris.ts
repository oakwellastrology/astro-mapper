import type SwissEPH from 'sweph-wasm';

type SwissEphInstance = InstanceType<typeof SwissEPH>;

let swe: SwissEphInstance | null = null;

/**
 * Dynamically imports and initializes the Swiss Ephemeris WASM module.
 * Must be called from onMount or another browser-only context — crashes during SSR.
 */
export async function initEphemeris(): Promise<SwissEphInstance> {
	if (swe) return swe;

	const { default: SwissEPH } = await import('sweph-wasm');
	swe = await SwissEPH.init();
	await swe.swe_set_ephe_path();
	return swe;
}

/**
 * Returns the initialized Swiss Ephemeris instance.
 * Throws if initEphemeris() has not been called yet.
 */
export function getEphemeris(): SwissEphInstance {
	if (!swe) {
		throw new Error('Swiss Ephemeris not initialized. Call initEphemeris() first.');
	}
	return swe;
}

export type { SwissEphInstance };
