<script lang="ts">
	import { onMount } from 'svelte';
	import { chartStore, setCenter } from '$lib/stores/chartStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { geodesicPoints } from '$lib/utils/geo';
	import type { PlanetLine } from '$lib/types';
	import type { ChartConfig } from '$lib/types';

	let container: HTMLDivElement;
	let leafletModule: typeof import('leaflet');
	let map: L.Map;
	let polylines: L.Polyline[] = [];
	let centerMarker: L.Marker;

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

	function hasLocation(chart: ChartConfig): boolean {
		const c = chart.centerLocation;
		return c.label !== '' || c.lat !== 0 || c.lng !== 0;
	}

	function drawLines(chart: ChartConfig, opacity: number, thicknessMultiplier: number) {
		if (!map || !leafletModule) return;

		const L = leafletModule;

		for (const pl of polylines) {
			pl.remove();
		}
		polylines = [];

		const center = chart.centerLocation;
		const locationSet = hasLocation(chart);

		// Manage the draggable center marker — only show when a location is set
		if (locationSet) {
			if (centerMarker) {
				centerMarker.setLatLng([center.lat, center.lng]);
			} else {
				centerMarker = L.marker([center.lat, center.lng], { draggable: true })
					.addTo(map)
					.bindTooltip('Drag to relocate center');
				centerMarker.on('dragend', () => {
					const pos = centerMarker.getLatLng();
					setCenter(pos.lat, pos.lng, `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
				});
			}
		} else {
			if (centerMarker) {
				centerMarker.remove();
				centerMarker = undefined!;
			}
			return; // No location — skip drawing lines
		}

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

			line.bindTooltip(`${planet.symbol} ${planet.name} — ${planet.azimuth}°`, { sticky: true });

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

		const { get } = await import('svelte/store');
		const initialChart = get(chartStore);
		const initialHasLocation = hasLocation(initialChart);
		map = L.map(container, { preferCanvas: true }).setView(
			initialHasLocation
				? [initialChart.centerLocation.lat, initialChart.centerLocation.lng]
				: [20, 0],
			initialHasLocation ? 6 : 2
		);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors',
		}).addTo(map);

		let currentChart: ChartConfig;
		let currentOpacity: number;
		let currentThickness: number;
		let lastCenter: { lat: number; lng: number } | null = null;

		const unsubChart = chartStore.subscribe((chart) => {
			currentChart = chart;
			// Recenter map if center location changed
			const c = chart.centerLocation;
			const locationSet = hasLocation(chart);
			if (locationSet && lastCenter && (lastCenter.lat !== c.lat || lastCenter.lng !== c.lng)) {
				map.setView([c.lat, c.lng], Math.max(map.getZoom(), 6));
			}
			lastCenter = { lat: c.lat, lng: c.lng };
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
