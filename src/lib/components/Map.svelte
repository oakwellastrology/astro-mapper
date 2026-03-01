<script lang="ts">
	import { onMount } from 'svelte';
	import { chartStore } from '$lib/stores/chartStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { geodesicPoints } from '$lib/utils/geo';
	import type { PlanetLine } from '$lib/types';
	import type { ChartConfig } from '$lib/types';

	let container: HTMLDivElement;
	let leafletModule: typeof import('leaflet');
	let map: L.Map;
	let polylines: L.Polyline[] = [];

	const BASE_WEIGHTS: Record<PlanetLine['category'], number> = {
		personal: 3,
		social: 2.5,
		transpersonal: 2,
		point: 1.5,
	};

	const DASH_ARRAYS: Record<PlanetLine['category'], string | undefined> = {
		personal: undefined,
		social: undefined,
		transpersonal: '8, 6',
		point: '4, 4',
	};

	function drawLines(chart: ChartConfig, opacity: number, thicknessMultiplier: number) {
		if (!map || !leafletModule) return;

		const L = leafletModule;

		for (const pl of polylines) {
			pl.remove();
		}
		polylines = [];

		const center = chart.centerLocation;

		for (const planet of chart.planets) {
			if (planet.azimuth === null || !planet.visible) continue;

			const baseWeight = BASE_WEIGHTS[planet.category] * thicknessMultiplier;
			const dashArray = DASH_ARRAYS[planet.category];

			const forward = geodesicPoints(center, planet.azimuth, 20_000_000, 100);
			const backward = geodesicPoints(center, (planet.azimuth + 180) % 360, 20_000_000, 100);
			const fullPath = [...backward.reverse(), ...forward];

			const line = L.polyline(
				fullPath.map((p) => [p.lat, p.lng] as L.LatLngTuple),
				{
					color: planet.color,
					weight: baseWeight,
					dashArray,
					opacity,
				}
			).addTo(map);

			line.bindTooltip(`${planet.symbol} ${planet.name} — ${planet.azimuth}°`);

			line.on('mouseover', () => {
				line.setStyle({ opacity: 1.0, weight: baseWeight + 1 });
			});
			line.on('mouseout', () => {
				line.setStyle({ opacity, weight: baseWeight });
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

		let currentChart: ChartConfig;
		let currentOpacity: number;
		let currentThickness: number;

		const unsubChart = chartStore.subscribe((chart) => {
			currentChart = chart;
			if (currentOpacity !== undefined) {
				drawLines(currentChart, currentOpacity, currentThickness);
			}
		});

		const unsubSettings = settingsStore.subscribe((settings) => {
			currentOpacity = settings.opacity;
			currentThickness = settings.thicknessMultiplier;
			if (currentChart) {
				drawLines(currentChart, currentOpacity, currentThickness);
			}
		});

		return () => {
			unsubChart();
			unsubSettings();
			map.remove();
		};
	});
</script>

<div bind:this={container} class="h-full w-full"></div>
