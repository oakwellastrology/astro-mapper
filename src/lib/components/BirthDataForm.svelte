<script lang="ts">
	import { birthDataStore, setBirthData } from '$lib/stores/birthDataStore';
	import { chartStore, updatePlanetAzimuth, setCenter } from '$lib/stores/chartStore';
	import { searchLocation, type GeocoderResult } from '$lib/utils/geocoder';
	import { getTimezoneFromCoords, getUtcOffset } from '$lib/astro/timezone';
	import { getEphemeris } from '$lib/astro/ephemeris';
	import { calculateAzimuths } from '$lib/astro/azimuth';

	// Form fields
	let year = $state($birthDataStore?.year ?? 1990);
	let month = $state($birthDataStore?.month ?? 1);
	let day = $state($birthDataStore?.day ?? 1);
	let hour = $state($birthDataStore?.hour ?? 12);
	let minute = $state($birthDataStore?.minute ?? 0);
	let latitude = $state($birthDataStore?.latitude ?? NaN);
	let longitude = $state($birthDataStore?.longitude ?? NaN);
	let locationLabel = $state($birthDataStore?.locationLabel ?? '');
	let timezoneId = $state($birthDataStore?.timezoneId ?? '');
	let timezoneOffset = $state($birthDataStore?.timezoneOffset ?? 0);

	// Location search state
	let searchQuery = $state('');
	let searchResults: GeocoderResult[] = $state([]);
	let searching = $state(false);
	let showResults = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;

	// Timezone editing
	let editingTimezone = $state(false);
	let tzEditValue = $state($birthDataStore?.timezoneId ?? '');

	// Calculation state
	let calculating = $state(false);
	let calcError = $state('');

	// Status
	let status = $derived(
		calculating
			? 'Calculating...'
			: $birthDataStore
				? `Calculated for ${$birthDataStore.year}-${String($birthDataStore.month).padStart(2, '0')}-${String($birthDataStore.day).padStart(2, '0')} at ${$birthDataStore.locationLabel}`
				: 'Not yet calculated'
	);

	let formValid = $derived(
		year >= 1900 &&
			year <= 2100 &&
			month >= 1 &&
			month <= 12 &&
			day >= 1 &&
			day <= 31 &&
			hour >= 0 &&
			hour <= 23 &&
			minute >= 0 &&
			minute <= 59 &&
			!isNaN(latitude) &&
			!isNaN(longitude) &&
			locationLabel.length > 0 &&
			timezoneId.length > 0
	);

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
		latitude = result.lat;
		longitude = result.lng;
		locationLabel = result.label;
		searchQuery = '';
		searchResults = [];
		showResults = false;

		// Auto-detect timezone
		const tz = getTimezoneFromCoords(result.lat, result.lng);
		timezoneId = tz;
		tzEditValue = tz;
		const date = new Date(year, month - 1, day, hour, minute);
		timezoneOffset = getUtcOffset(tz, date);
	}

	function applyTimezoneEdit() {
		timezoneId = tzEditValue;
		const date = new Date(year, month - 1, day, hour, minute);
		timezoneOffset = getUtcOffset(tzEditValue, date);
		editingTimezone = false;
	}

	async function handleCalculate() {
		if (!formValid) return;
		calculating = true;
		calcError = '';

		const data = {
			year,
			month,
			day,
			hour,
			minute,
			latitude,
			longitude,
			locationLabel,
			timezoneOffset,
			timezoneId,
		};

		try {
			const swe = getEphemeris();
			const azimuths = calculateAzimuths(swe, data);

			// Update all planet azimuths in the chart store
			for (const planet of $chartStore.planets) {
				const az = azimuths[planet.id];
				updatePlanetAzimuth(planet.id, az !== undefined ? az : null);
			}

			// Re-center the map to the birth location
			setCenter(latitude, longitude, locationLabel);

			// Persist birth data
			setBirthData(data);
		} catch (err) {
			calcError = err instanceof Error ? err.message : 'Calculation failed';
			console.error('Azimuth calculation error:', err);
		} finally {
			calculating = false;
		}
	}

	function formatOffset(offset: number): string {
		const sign = offset >= 0 ? '+' : '';
		const h = Math.floor(Math.abs(offset));
		const m = Math.round((Math.abs(offset) - h) * 60);
		return `UTC${sign}${offset < 0 ? '-' : ''}${h}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}`;
	}
</script>

<div class="space-y-4">
	<!-- Date -->
	<div>
		<div class="mb-1 text-xs uppercase tracking-wide text-gray-400">Birth Date</div>
		<div class="flex gap-2">
			<label class="flex-1">
				<span class="text-xs text-gray-400">Year</span>
				<input
					type="number"
					min="1900"
					max="2100"
					bind:value={year}
					class="w-full rounded bg-white/10 px-2 py-1 text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
			</label>
			<label class="w-20">
				<span class="text-xs text-gray-400">Month</span>
				<select
					bind:value={month}
					class="w-full rounded bg-white/10 px-2 py-1 text-sm text-white"
				>
					{#each Array.from({ length: 12 }, (_, i) => i + 1) as m}
						<option value={m}>{String(m).padStart(2, '0')}</option>
					{/each}
				</select>
			</label>
			<label class="w-16">
				<span class="text-xs text-gray-400">Day</span>
				<input
					type="number"
					min="1"
					max="31"
					bind:value={day}
					class="w-full rounded bg-white/10 px-2 py-1 text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
			</label>
		</div>
	</div>

	<!-- Time -->
	<div>
		<div class="mb-1 text-xs uppercase tracking-wide text-gray-400">Birth Time</div>
		<div class="flex gap-2">
			<label class="flex-1">
				<span class="text-xs text-gray-400">Hour (0-23)</span>
				<input
					type="number"
					min="0"
					max="23"
					bind:value={hour}
					class="w-full rounded bg-white/10 px-2 py-1 text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
			</label>
			<label class="flex-1">
				<span class="text-xs text-gray-400">Minute (0-59)</span>
				<input
					type="number"
					min="0"
					max="59"
					bind:value={minute}
					class="w-full rounded bg-white/10 px-2 py-1 text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
			</label>
		</div>
	</div>

	<!-- Location search -->
	<div>
		<div class="mb-1 text-xs uppercase tracking-wide text-gray-400">Birth Location</div>
		<div class="relative">
			<input
				type="text"
				bind:value={searchQuery}
				oninput={handleSearchInput}
				placeholder="Search birth location..."
				class="w-full rounded bg-white/10 px-3 py-1.5 text-sm text-white placeholder-gray-500"
			/>
			{#if searching}
				<div class="absolute right-2 top-2 text-xs text-gray-400">...</div>
			{/if}
			{#if showResults}
				<div
					class="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded bg-[#252547] shadow-lg"
				>
					{#each searchResults as result}
						<button
							class="w-full px-3 py-2 text-left text-sm hover:bg-white/10"
							onclick={() => selectResult(result)}
						>
							<div class="truncate">{result.label}</div>
							<div class="text-xs text-gray-400">
								{result.lat.toFixed(4)}, {result.lng.toFixed(4)}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
		{#if locationLabel}
			<div class="mt-1 truncate text-sm">{locationLabel}</div>
			<div class="text-xs text-gray-400">
				{latitude.toFixed(4)}, {longitude.toFixed(4)}
			</div>
		{/if}
	</div>

	<!-- Timezone -->
	{#if timezoneId}
		<div>
			<div class="mb-1 text-xs uppercase tracking-wide text-gray-400">Timezone</div>
			{#if editingTimezone}
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={tzEditValue}
						placeholder="e.g. America/New_York"
						class="flex-1 rounded bg-white/10 px-2 py-1 text-sm text-white"
					/>
					<button
						class="rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-500"
						onclick={applyTimezoneEdit}
					>
						Apply
					</button>
					<button
						class="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
						onclick={() => {
							tzEditValue = timezoneId;
							editingTimezone = false;
						}}
					>
						Cancel
					</button>
				</div>
			{:else}
				<div class="flex items-center gap-2 text-sm">
					<span>{timezoneId}</span>
					<span class="text-gray-400">({formatOffset(timezoneOffset)})</span>
					<button
						class="rounded bg-white/10 px-1.5 py-0.5 text-xs hover:bg-white/20"
						onclick={() => (editingTimezone = true)}
					>
						Edit
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Calculate button -->
	<button
		class="w-full cursor-pointer rounded bg-blue-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
		disabled={!formValid || calculating}
		onclick={handleCalculate}
	>
		{calculating ? 'Calculating...' : 'Calculate Chart'}
	</button>

	<!-- Error -->
	{#if calcError}
		<div class="text-xs text-red-400">{calcError}</div>
	{/if}

	<!-- Status -->
	<div class="text-xs text-gray-400">{status}</div>
</div>
