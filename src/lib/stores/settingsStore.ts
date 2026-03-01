import { writable } from 'svelte/store';

interface Settings {
	opacity: number; // 0.0–1.0
	thicknessMultiplier: number; // 0.5–3.0
}

const STORAGE_KEY = 'localspace-settings';

function loadSettings(): Settings {
	const defaults: Settings = { opacity: 0.7, thicknessMultiplier: 1.0 };
	if (typeof localStorage === 'undefined') return defaults;
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved) {
		try {
			return { ...defaults, ...JSON.parse(saved) };
		} catch {
			return defaults;
		}
	}
	return defaults;
}

export const settingsStore = writable<Settings>(loadSettings());

let debounceTimer: ReturnType<typeof setTimeout>;
settingsStore.subscribe((value) => {
	if (typeof localStorage === 'undefined') return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	}, 300);
});
