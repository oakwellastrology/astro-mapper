<script lang="ts">
	import { chartStore, updatePlanetAzimuth, togglePlanetVisibility } from '$lib/stores/chartStore';
	import type { PlanetLine } from '$lib/types';

	const CATEGORIES = [
		{ key: 'personal', label: 'Personal' },
		{ key: 'social', label: 'Social' },
		{ key: 'transpersonal', label: 'Transpersonal' },
		{ key: 'point', label: 'Points' },
	] as const;

	let collapsed: Record<string, boolean> = $state({});

	function toggleGroup(key: string) {
		collapsed[key] = !collapsed[key];
	}

	function groupPlanets(planets: PlanetLine[]) {
		const groups: Record<string, PlanetLine[]> = {};
		for (const cat of CATEGORIES) {
			groups[cat.key] = planets.filter((p) => p.category === cat.key);
		}
		return groups;
	}

	function handleAzimuthInput(planetId: string, e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value === '' ? null : parseFloat(input.value);
		if (value !== null && (value < 0 || value > 360 || isNaN(value))) return;
		updatePlanetAzimuth(planetId, value);
	}
</script>

<div class="space-y-1">
	{#each CATEGORIES as cat}
		{@const planets = groupPlanets($chartStore.planets)[cat.key]}
		<div>
			<button
				class="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm font-semibold uppercase tracking-wide text-gray-300 hover:bg-white/10"
				onclick={() => toggleGroup(cat.key)}
			>
				{cat.label}
				<span class="text-xs">{collapsed[cat.key] ? '▸' : '▾'}</span>
			</button>

			{#if !collapsed[cat.key]}
				<div class="space-y-0.5">
					{#each planets as planet (planet.id)}
						<div class="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/5">
							<span class="w-6 text-center text-sm" style="color: {planet.color}">
								{planet.symbol}
							</span>
							<span class="w-16 truncate text-sm">{planet.name}</span>
							<input
								type="number"
								min="0"
								max="360"
								step="0.1"
								value={planet.azimuth ?? ''}
								oninput={(e) => handleAzimuthInput(planet.id, e)}
								placeholder="—"
								class="w-16 rounded bg-white/10 px-1.5 py-0.5 text-right text-sm text-white placeholder-gray-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
							/>
							<span class="text-xs text-gray-400">°</span>
							<span
								class="h-3 w-3 shrink-0 rounded-full"
								style="background-color: {planet.color}"
							></span>
							<label class="ml-auto flex cursor-pointer items-center">
								<input
									type="checkbox"
									checked={planet.visible}
									onchange={() => togglePlanetVisibility(planet.id)}
									class="sr-only"
								/>
								<span
									class="h-4 w-8 rounded-full transition-colors {planet.visible ? 'bg-blue-500' : 'bg-gray-600'}"
								>
									<span
										class="mt-0.5 block h-3 w-3 rounded-full bg-white transition-transform {planet.visible ? 'translate-x-4' : 'translate-x-0.5'}"
									></span>
								</span>
							</label>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>
