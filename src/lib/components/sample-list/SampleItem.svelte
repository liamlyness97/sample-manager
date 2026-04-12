<script lang="ts">
	import { drawWaveform } from '$lib/helpers/drawWaveform';
	import { onMount } from 'svelte';

	let { name, id, url, format, folder, fileSize, createdAt, peaks } = $props();

	let waveForm = $state();

	onMount(() => {
		const parsedPeaks = typeof peaks === 'string' ? JSON.parse(peaks) : peaks;
		drawWaveform(waveForm, parsedPeaks);
	});
</script>

<div class="flex h-16 w-full snap-proximity snap-start items-center gap-4 rounded bg-white px-4">
	<p class="w-40 shrink-0 truncate text-sm">{name}</p>
	<div class="relative h-12 w-full">
		<canvas bind:this={waveForm} class="absolute inset-0 h-full w-full"></canvas>
	</div>
</div>
