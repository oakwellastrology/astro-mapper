import { writable } from 'svelte/store';
import type { BirthData } from '../types';

const STORAGE_KEY = 'localspace-birthdata';

function loadBirthData(): BirthData | null {
	if (typeof sessionStorage === 'undefined') return null;
	const saved = sessionStorage.getItem(STORAGE_KEY);
	if (saved) {
		try {
			return JSON.parse(saved) as BirthData;
		} catch {
			return null;
		}
	}
	return null;
}

export const birthDataStore = writable<BirthData | null>(loadBirthData());

let debounceTimer: ReturnType<typeof setTimeout>;
birthDataStore.subscribe((value) => {
	if (typeof sessionStorage === 'undefined') return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		if (value === null) {
			sessionStorage.removeItem(STORAGE_KEY);
		} else {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
		}
	}, 300);
});

export function setBirthData(data: BirthData) {
	birthDataStore.set(data);
}

export function clearBirthData() {
	birthDataStore.set(null);
}
