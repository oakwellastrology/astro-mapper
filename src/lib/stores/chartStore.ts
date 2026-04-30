import { writable } from 'svelte/store';
import type { ChartConfig, PlanetLine } from '../types';
import { DEFAULT_PLANETS, DEFAULT_CHART } from '../constants';

const STORAGE_KEY = 'localspace-chart';

const VALID_IDS = new Set(DEFAULT_PLANETS.map((p) => p.id));

type PersistedPlanet = Pick<PlanetLine, 'id' | 'visible'>;

function loadChart(): ChartConfig {
	if (typeof localStorage === 'undefined') return DEFAULT_CHART;
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved) {
		try {
			const persisted = JSON.parse(saved) as { planets: PersistedPlanet[] };
			const cachedById = new Map(persisted.planets.map((p) => [p.id, p]));
			return {
				...DEFAULT_CHART,
				planets: DEFAULT_PLANETS.map((def) => {
					const cached = cachedById.get(def.id);
					return { ...def, azimuth: null, visible: cached?.visible ?? def.visible };
				}),
			};
		} catch {
			return DEFAULT_CHART;
		}
	}
	return DEFAULT_CHART;
}

export const chartStore = writable<ChartConfig>(loadChart());

let debounceTimer: ReturnType<typeof setTimeout>;
chartStore.subscribe((value) => {
	if (typeof localStorage === 'undefined') return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		const persisted: { planets: PersistedPlanet[] } = {
			planets: value.planets.map(({ id, visible }) => ({ id, visible })),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
	}, 300);
});

export function updatePlanetAzimuth(planetId: string, azimuth: number | null) {
	chartStore.update((chart) => ({
		...chart,
		planets: chart.planets.map((p) =>
			p.id === planetId ? { ...p, azimuth } : p
		),
	}));
}

export function togglePlanetVisibility(planetId: string) {
	chartStore.update((chart) => ({
		...chart,
		planets: chart.planets.map((p) =>
			p.id === planetId ? { ...p, visible: !p.visible } : p
		),
	}));
}

export function setCategoryVisibility(category: string, visible: boolean) {
	chartStore.update((chart) => ({
		...chart,
		planets: chart.planets.map((p) =>
			p.category === category ? { ...p, visible } : p
		),
	}));
}

export function setAllVisibility(visible: boolean) {
	chartStore.update((chart) => ({
		...chart,
		planets: chart.planets.map((p) => ({ ...p, visible })),
	}));
}

export function restoreVisibility(snapshot: Record<string, boolean>) {
	chartStore.update((chart) => ({
		...chart,
		planets: chart.planets.map((p) => ({
			...p,
			visible: snapshot[p.id] ?? p.visible,
		})),
	}));
}

/**
 * Stores the last auto-calculated azimuth values (from calculateAzimuths).
 * Used to detect when a user has manually overridden an auto-calculated value.
 */
export const autoAzimuthsStore = writable<Record<string, number>>({});

export function setAutoAzimuths(azimuths: Record<string, number>) {
	autoAzimuthsStore.set(azimuths);
}

export function setCenter(lat: number, lng: number, label: string) {
	chartStore.update((chart) => ({
		...chart,
		centerLocation: { lat, lng, label },
	}));
}
