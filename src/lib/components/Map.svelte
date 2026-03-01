<script lang="ts">
	import { onMount } from 'svelte';

	let container: HTMLDivElement;

	onMount(async () => {
		const L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		const map = L.map(container, { preferCanvas: true }).setView([37.44, -122.14], 6);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(map);
	});
</script>

<div bind:this={container} class="h-full w-full"></div>
