<script lang="ts">
	import { chartStore } from '$lib/stores/chartStore';

	const SIZE = 150;
	const CENTER = SIZE / 2;
	const RADIUS = SIZE / 2 - 10;
</script>

<svg width={SIZE} height={SIZE} class="mx-auto">
	<!-- Outer circle -->
	<circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#444" stroke-width="1.5" />

	<!-- Cardinal direction ticks and labels -->
	{#each [{ label: 'N', angle: 0 }, { label: 'E', angle: 90 }, { label: 'S', angle: 180 }, { label: 'W', angle: 270 }] as dir}
		{@const rad = ((dir.angle - 90) * Math.PI) / 180}
		{@const tickInner = RADIUS - 6}
		{@const labelR = RADIUS + 2}
		<line
			x1={CENTER + tickInner * Math.cos(rad)}
			y1={CENTER + tickInner * Math.sin(rad)}
			x2={CENTER + RADIUS * Math.cos(rad)}
			y2={CENTER + RADIUS * Math.sin(rad)}
			stroke="#666"
			stroke-width="1"
		/>
		<text
			x={CENTER + labelR * Math.cos(rad)}
			y={CENTER + labelR * Math.sin(rad)}
			fill="#888"
			font-size="9"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{dir.label}
		</text>
	{/each}

	<!-- Center dot -->
	<circle cx={CENTER} cy={CENTER} r="2" fill="#666" />

	<!-- Planet lines -->
	{#each $chartStore.planets as planet (planet.id)}
		{#if planet.azimuth !== null && planet.visible}
			{@const rad = ((planet.azimuth - 90) * Math.PI) / 180}
			<line
				x1={CENTER}
				y1={CENTER}
				x2={CENTER + RADIUS * Math.cos(rad)}
				y2={CENTER + RADIUS * Math.sin(rad)}
				stroke={planet.color}
				stroke-width="1.5"
				opacity="0.8"
			/>
		{/if}
	{/each}
</svg>
