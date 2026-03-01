<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import AzimuthForm from '$lib/components/AzimuthForm.svelte';
	import CompassPreview from '$lib/components/CompassPreview.svelte';
</script>

<div class="flex h-screen w-screen">
	<aside class="flex w-80 shrink-0 flex-col overflow-y-auto bg-[#1a1a2e] p-4 text-white">
		<h1 class="mb-4 text-lg font-semibold">Local Space Map</h1>
		<CompassPreview />
		<div class="mt-4">
			<AzimuthForm />
		</div>
	</aside>
	<main class="grow">
		<Map />
	</main>
</div>
