<script lang="ts">
	import { onMount } from 'svelte';
	import Map from '$lib/components/Map.svelte';
	import AzimuthForm from '$lib/components/AzimuthForm.svelte';
	import CompassPreview from '$lib/components/CompassPreview.svelte';
	import LocationPanel from '$lib/components/LocationPanel.svelte';
	import BirthDataForm from '$lib/components/BirthDataForm.svelte';
	import { settingsStore } from '$lib/stores/settingsStore';

	let activeTab: 'birthdata' | 'azimuths' | 'location' | 'settings' = $state('birthdata');
	let mapSection: HTMLElement;
	let controlsSection: HTMLElement;

	function scrollToMap() {
		mapSection?.scrollIntoView({ behavior: 'smooth' });
	}

	function scrollToControls() {
		controlsSection?.scrollIntoView({ behavior: 'smooth' });
	}

	onMount(async () => {
		const { initEphemeris } = await import('$lib/astro/ephemeris');
		await initEphemeris();
	});
</script>

<div class="flex h-screen w-screen flex-col lg:flex-row">
	<aside bind:this={controlsSection} class="flex w-full shrink-0 flex-col bg-[#1a1a2e] text-white lg:h-screen lg:w-96 lg:overflow-y-auto">
		<h1 class="px-4 pt-4 text-lg font-semibold">Local Space Map</h1>

		<!-- Tabs -->
		<div class="mt-3 flex border-b border-white/10 px-4">
			{#each [{ key: 'birthdata', label: 'Birth Data' }, { key: 'azimuths', label: 'Azimuths' }, { key: 'location', label: 'Location' }, { key: 'settings', label: 'Settings' }] as tab (tab.key)}
				<button
					class="px-3 py-1.5 text-sm transition-colors {activeTab === tab.key
						? 'border-b-2 border-blue-400 text-white'
						: 'text-gray-400 hover:text-gray-200'}"
					onclick={() => (activeTab = tab.key as typeof activeTab)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- Tab content -->
		<div class="p-4 lg:flex-1 lg:overflow-y-auto">
			{#if activeTab === 'birthdata'}
				<BirthDataForm onCalculated={scrollToMap} />
			{:else if activeTab === 'azimuths'}
				<CompassPreview />
				<div class="mt-4">
					<AzimuthForm />
				</div>
			{:else if activeTab === 'location'}
				<LocationPanel />
			{:else if activeTab === 'settings'}
				<div class="space-y-3">
					<div>
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-300">Opacity</span>
							<span class="text-gray-400">{Math.round($settingsStore.opacity * 100)}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={$settingsStore.opacity * 100}
							oninput={(e) => {
								const v = parseInt((e.target as HTMLInputElement).value);
								settingsStore.update((s) => ({ ...s, opacity: v / 100 }));
							}}
							class="mt-1 w-full accent-blue-500"
						/>
					</div>
					<div>
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-300">Thickness</span>
							<span class="text-gray-400">{$settingsStore.thicknessMultiplier.toFixed(1)}x</span>
						</div>
						<input
							type="range"
							min="5"
							max="30"
							value={$settingsStore.thicknessMultiplier * 10}
							oninput={(e) => {
								const v = parseInt((e.target as HTMLInputElement).value);
								settingsStore.update((s) => ({ ...s, thicknessMultiplier: v / 10 }));
							}}
							class="mt-1 w-full accent-blue-500"
						/>
					</div>
				</div>
			{/if}
		</div>
		<p class="px-4 py-3 text-lg text-gray-500">&copy; Sam Oakwell 2026</p>
	</aside>
	<main bind:this={mapSection} class="relative h-[100svh] w-full shrink-0 lg:h-auto lg:grow">
		<button
			onclick={scrollToControls}
			class="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-[#1a1a2e]/90 px-4 py-1.5 text-lg text-white shadow-lg backdrop-blur transition-colors hover:bg-[#1a1a2e] cursor-pointer lg:hidden"
		>
			&uarr; Controls
		</button>
		<Map />
	</main>
</div>
