<script lang="ts">
	import { onMount } from 'svelte';
	import Map from '$lib/components/Map.svelte';
	import AzimuthForm from '$lib/components/AzimuthForm.svelte';
	import CompassPreview from '$lib/components/CompassPreview.svelte';
	import LocationPanel from '$lib/components/LocationPanel.svelte';
	import BirthDataForm from '$lib/components/BirthDataForm.svelte';
	import { settingsStore } from '$lib/stores/settingsStore';

	let activeTab: 'birthdata' | 'azimuths' | 'location' | 'settings' = $state('azimuths');

	onMount(async () => {
		const { initEphemeris } = await import('$lib/astro/ephemeris');
		await initEphemeris();
	});
</script>

<div class="flex h-screen w-screen">
	<aside class="flex w-96 shrink-0 flex-col overflow-y-auto bg-[#1a1a2e] text-white">
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
		<div class="flex-1 overflow-y-auto p-4">
			{#if activeTab === 'birthdata'}
				<BirthDataForm />
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
	<main class="grow">
		<Map />
	</main>
</div>
