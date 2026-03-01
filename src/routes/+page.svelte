<script lang="ts">
	import Map from '$lib/components/Map.svelte';
</script>

<div class="flex h-screen w-screen">
	<aside class="w-80 shrink-0 bg-[#1a1a2e] p-4 text-white">
		<h1 class="text-lg font-semibold">Local Space Map</h1>
	</aside>
	<main class="grow">
		<Map />
	</main>
</div>
