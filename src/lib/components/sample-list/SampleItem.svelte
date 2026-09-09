<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { drawWaveform } from '$lib/helpers/drawWaveform';
	import { onMount, tick } from 'svelte';

	let { id, name, url, peaks } = $props();

	let canvas = $state<HTMLCanvasElement>();
	let isActive = $derived(player.state.activeSampleId === id);

	onMount(async () => {
		await tick();
		const parsedPeaks = typeof peaks === 'string' ? JSON.parse(peaks) : peaks;
		drawWaveform(canvas!, parsedPeaks, 0);
	});

	$effect(() => {
		if (!canvas) return;
		const parsedPeaks = typeof peaks === 'string' ? JSON.parse(peaks) : peaks;
		const progress = isActive ? player.state.progress : 0;
		drawWaveform(canvas, parsedPeaks, progress);
	});
</script>

<div class="flex w-full snap-proximity snap-start items-center gap-4 rounded bg-white px-4 py-2">
	<button
		class="items rounded-ful flex h-12 w-12 justify-center bg-blue-300 text-white"
		onclick={() => player.play(id, `/${url}`)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			preserveAspectRatio="xMidYMid meet"
			class="h-full w-full object-contain"
			viewBox="0 0 24 24"
			><path
				fill="currentColor"
				d="M9 15.714V8.287q0-.368.244-.588q.243-.22.568-.22q.102 0 .213.028q.11.027.211.083l5.843 3.733q.186.13.28.298q.093.167.093.379t-.093.379t-.28.298l-5.843 3.733q-.101.055-.213.083t-.213.028q-.326 0-.568-.22T9 15.714"
			/></svg
		>
	</button>
	<div class="flex w-full flex-col gap-4">
		<p class="shrink-0 truncate font-medium">{name}</p>
		<div
			class="relative h-12 w-full cursor-pointer"
			onclick={(e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				player.seek((e.clientX - rect.left) / rect.width);
			}}
		>
			<canvas bind:this={canvas} class="absolute inset-0 h-full w-full"></canvas>
		</div>
	</div>
</div>
