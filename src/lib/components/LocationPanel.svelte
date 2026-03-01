<script lang="ts">
	import { chartStore, setCenter } from '$lib/stores/chartStore';
	import {
		savedLocationsStore,
		addSavedLocation,
		removeSavedLocation,
	} from '$lib/stores/savedLocationsStore';
	import { searchLocation, type GeocoderResult } from '$lib/utils/geocoder';

	let searchQuery = $state('');
	let searchResults: GeocoderResult[] = $state([]);
	let searching = $state(false);
	let showResults = $state(false);
	let gpsLoading = $state(false);
	let gpsError = $state('');
	let manualLat = $state($chartStore.centerLocation.lat);
	let manualLng = $state($chartStore.centerLocation.lng);
	let confirmDeleteId: string | null = $state(null);

	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleSearchInput() {
		clearTimeout(debounceTimer);
		if (searchQuery.trim().length < 2) {
			searchResults = [];
			showResults = false;
			return;
		}
		debounceTimer = setTimeout(async () => {
			searching = true;
			try {
				searchResults = await searchLocation(searchQuery.trim());
				showResults = searchResults.length > 0;
			} finally {
				searching = false;
			}
		}, 500);
	}

	function selectResult(result: GeocoderResult) {
		setCenter(result.lat, result.lng, result.label);
		manualLat = result.lat;
		manualLng = result.lng;
		searchQuery = '';
		searchResults = [];
		showResults = false;
	}

	function useMyLocation() {
		if (!navigator.geolocation) {
			gpsError = 'Geolocation not supported';
			return;
		}
		gpsLoading = true;
		gpsError = '';
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const lat = parseFloat(pos.coords.latitude.toFixed(4));
				const lng = parseFloat(pos.coords.longitude.toFixed(4));
				setCenter(lat, lng, `${lat}, ${lng}`);
				manualLat = lat;
				manualLng = lng;
				gpsLoading = false;
			},
			(err) => {
				gpsLoading = false;
				switch (err.code) {
					case err.PERMISSION_DENIED:
						gpsError = 'Location permission denied';
						break;
					case err.POSITION_UNAVAILABLE:
						gpsError = 'Position unavailable';
						break;
					case err.TIMEOUT:
						gpsError = 'Location request timed out';
						break;
					default:
						gpsError = 'Could not get location';
				}
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}

	function applyManual() {
		if (isNaN(manualLat) || isNaN(manualLng)) return;
		const lat = Math.max(-90, Math.min(90, manualLat));
		const lng = Math.max(-180, Math.min(180, manualLng));
		setCenter(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
	}

	function saveCurrentLocation() {
		const loc = $chartStore.centerLocation;
		addSavedLocation(loc.lat, loc.lng, loc.label);
	}

	function handleDelete(id: string) {
		if (confirmDeleteId === id) {
			removeSavedLocation(id);
			confirmDeleteId = null;
		} else {
			confirmDeleteId = id;
		}
	}

	function loadSavedLocation(loc: { lat: number; lng: number; label: string }) {
		setCenter(loc.lat, loc.lng, loc.label);
		manualLat = loc.lat;
		manualLng = loc.lng;
	}
</script>

<div class="space-y-4">
	<!-- Current location -->
	<div>
		<div class="text-xs uppercase tracking-wide text-gray-400">Current Center</div>
		<div class="mt-1 truncate text-sm">{$chartStore.centerLocation.label}</div>
		<div class="text-xs text-gray-400">
			{$chartStore.centerLocation.lat.toFixed(4)}, {$chartStore.centerLocation.lng.toFixed(4)}
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<input
			type="text"
			bind:value={searchQuery}
			oninput={handleSearchInput}
			placeholder="Search location..."
			class="w-full rounded bg-white/10 px-3 py-1.5 text-sm text-white placeholder-gray-500"
		/>
		{#if searching}
			<div class="absolute right-2 top-2 text-xs text-gray-400">...</div>
		{/if}
		{#if showResults}
			<div class="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded bg-[#252547] shadow-lg">
				{#each searchResults as result}
					<button
						class="w-full px-3 py-2 text-left text-sm hover:bg-white/10"
						onclick={() => selectResult(result)}
					>
						<div class="truncate">{result.label}</div>
						<div class="text-xs text-gray-400">{result.lat.toFixed(4)}, {result.lng.toFixed(4)}</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- GPS -->
	<button
		class="w-full rounded bg-white/10 px-3 py-1.5 text-sm transition-colors hover:bg-white/20 disabled:opacity-50"
		onclick={useMyLocation}
		disabled={gpsLoading}
	>
		{gpsLoading ? 'Getting location...' : 'Use My Location'}
	</button>
	{#if gpsError}
		<div class="text-xs text-red-400">{gpsError}</div>
	{/if}

	<!-- Manual -->
	<div>
		<div class="mb-1 text-xs uppercase tracking-wide text-gray-400">Manual Entry</div>
		<div class="flex gap-2">
			<label class="flex-1">
				<span class="text-xs text-gray-400">Lat</span>
				<input
					type="number"
					step="0.0001"
					min="-90"
					max="90"
					bind:value={manualLat}
					onchange={applyManual}
					class="w-full rounded bg-white/10 px-2 py-1 text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
			</label>
			<label class="flex-1">
				<span class="text-xs text-gray-400">Lng</span>
				<input
					type="number"
					step="0.0001"
					min="-180"
					max="180"
					bind:value={manualLng}
					onchange={applyManual}
					class="w-full rounded bg-white/10 px-2 py-1 text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
			</label>
			<button
				class="mt-4 shrink-0 rounded bg-blue-600 px-2 py-1 text-sm hover:bg-blue-500"
				onclick={applyManual}
			>
				Set
			</button>
		</div>
	</div>

	<!-- Saved locations -->
	<div>
		<div class="mb-1 flex items-center justify-between">
			<span class="text-xs uppercase tracking-wide text-gray-400">Saved Locations</span>
			<button
				class="rounded bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20"
				onclick={saveCurrentLocation}
			>
				+ Save Current
			</button>
		</div>
		{#if $savedLocationsStore.length === 0}
			<div class="text-xs text-gray-500">No saved locations</div>
		{:else}
			<div class="space-y-1">
				{#each $savedLocationsStore as loc (loc.id)}
					<div class="flex items-center gap-1 rounded px-2 py-1 hover:bg-white/5">
						<button
							class="flex-1 truncate text-left text-sm"
							onclick={() => loadSavedLocation(loc)}
						>
							{loc.label}
						</button>
						<button
							class="shrink-0 rounded px-1.5 py-0.5 text-xs {confirmDeleteId === loc.id
								? 'bg-red-600 text-white'
								: 'text-gray-400 hover:text-red-400'}"
							onclick={() => handleDelete(loc.id)}
						>
							{confirmDeleteId === loc.id ? 'Confirm?' : 'Del'}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Info note -->
	<div class="rounded bg-white/5 p-2 text-xs leading-relaxed text-gray-400">
		Note: In strict Local Space practice, changing your location requires recalculating the chart.
		This tool projects your original chart's azimuths from a new origin for exploratory purposes.
	</div>
</div>
