<script lang="ts">
	import { onMount } from 'svelte';
	import { chartStore } from '$lib/stores/chartStore';
	import { geodesicPoints } from '$lib/utils/geo';
	import type { PlanetLine } from '$lib/types';

	let container: HTMLDivElement;
	let leafletModule: typeof import('leaflet');
	let map: L.Map;
	let polylines: L.Polyline[] = [];

	const LINE_STYLES: Record<
		PlanetLine['category'],
		{ weight: number; dashArray: string | undefined }
	> = {
		personal: { weight: 3, dashArray: undefined },
		social: { weight: 2.5, dashArray: undefined },
		transpersonal: { weight: 2, dashArray: '8, 6' },
		point: { weight: 1.5, dashArray: '4, 4' },
	};

	function drawLines(chart: typeof $chartStore) {
		if (!map || !leafletModule) return;

		const L = leafletModule;

		// Clear existing polylines
		for (const pl of polylines) {
			pl.remove();
		}
		polylines = [];

		const center = chart.centerLocation;

		for (const planet of chart.planets) {
			if (planet.azimuth === null || !planet.visible) continue;

			const style = LINE_STYLES[planet.category];
			const forward = geodesicPoints(center, planet.azimuth, 20_000_000, 100);
			const backward = geodesicPoints(center, (planet.azimuth + 180) % 360, 20_000_000, 100);
			const fullPath = [...backward.reverse(), ...forward];

			const baseWeight = style.weight;
			const baseOpacity = 0.7;

			const line = L.polyline(
				fullPath.map((p) => [p.lat, p.lng] as L.LatLngTuple),
				{
					color: planet.color,
					weight: baseWeight,
					dashArray: style.dashArray,
					opacity: baseOpacity,
				}
			).addTo(map);

			line.bindTooltip(`${planet.symbol} ${planet.name} — ${planet.azimuth}°`);

			line.on('mouseover', () => {
				line.setStyle({ opacity: 1.0, weight: baseWeight + 1 });
			});
			line.on('mouseout', () => {
				line.setStyle({ opacity: baseOpacity, weight: baseWeight });
			});

			polylines.push(line);
		}
	}

	onMount(async () => {
		leafletModule = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		const L = leafletModule;

		map = L.map(container, { preferCanvas: true }).setView([37.44, -122.14], 6);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors',
		}).addTo(map);

		// Draw initial lines and subscribe to changes
		const unsubscribe = chartStore.subscribe((chart) => {
			drawLines(chart);
		});

		return () => {
			unsubscribe();
			map.remove();
		};
	});
</script>

<div bind:this={container} class="h-full w-full"></div>
