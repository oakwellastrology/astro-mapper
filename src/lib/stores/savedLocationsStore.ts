import { writable } from 'svelte/store';
import type { SavedLocation } from '../types';

const STORAGE_KEY = 'localspace-saved-locations';

function load(): SavedLocation[] {
	if (typeof localStorage === 'undefined') return [];
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved) {
		try {
			return JSON.parse(saved) as SavedLocation[];
		} catch {
			return [];
		}
	}
	return [];
}

export const savedLocationsStore = writable<SavedLocation[]>(load());

let debounceTimer: ReturnType<typeof setTimeout>;
savedLocationsStore.subscribe((value) => {
	if (typeof localStorage === 'undefined') return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	}, 300);
});

export function addSavedLocation(lat: number, lng: number, label: string) {
	savedLocationsStore.update((locs) => [
		...locs,
		{ id: crypto.randomUUID(), lat, lng, label },
	]);
}

export function removeSavedLocation(id: string) {
	savedLocationsStore.update((locs) => locs.filter((l) => l.id !== id));
}
