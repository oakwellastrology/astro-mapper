<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import AzimuthForm from '$lib/components/AzimuthForm.svelte';
	import CompassPreview from '$lib/components/CompassPreview.svelte';
	import { settingsStore } from '$lib/stores/settingsStore';
</script>

<div class="flex h-screen w-screen">
	<aside class="flex w-80 shrink-0 flex-col overflow-y-auto bg-[#1a1a2e] p-4 text-white">
		<h1 class="mb-4 text-lg font-semibold">Local Space Map</h1>
		<CompassPreview />
		<div class="mt-4">
			<AzimuthForm />
		</div>
		<div class="mt-4 space-y-3 border-t border-white/10 pt-4">
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
	</aside>
	<main class="grow">
		<Map />
	</main>
</div>
