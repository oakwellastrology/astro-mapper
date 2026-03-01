import { writable } from 'svelte/store';
import type { ChartConfig } from '../types';
import { SAMPLE_CHART } from '../constants';

const STORAGE_KEY = 'localspace-chart';

function loadChart(): ChartConfig {
	if (typeof localStorage === 'undefined') return SAMPLE_CHART;
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved) {
		try {
			return JSON.parse(saved) as ChartConfig;
		} catch {
			return SAMPLE_CHART;
		}
	}
	return SAMPLE_CHART;
}

export const chartStore = writable<ChartConfig>(loadChart());

let debounceTimer: ReturnType<typeof setTimeout>;
chartStore.subscribe((value) => {
	if (typeof localStorage === 'undefined') return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
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

export function setCenter(lat: number, lng: number, label: string) {
	chartStore.update((chart) => ({
		...chart,
		centerLocation: { lat, lng, label },
	}));
}
