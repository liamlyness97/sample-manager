<script lang="ts">
	import { player, type Sample } from '$lib/stores/player.svelte';
	import Waveform from '$lib/components/ui/Waveform.svelte';

	let { sample }: { sample: Sample } = $props();

	const isActive = $derived(player.state.activeSample?.id === sample.id);
	const isPlaying = $derived(isActive && player.state.isPlaying);
	const progress = $derived(isActive ? player.state.progress : 0);
</script>

<div class="flex w-full snap-proximity snap-start items-center gap-4 rounded bg-white px-4 py-2">
	<button
		class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-300 text-white"
		aria-label={isPlaying ? `Pause ${sample.sampleName}` : `Play ${sample.sampleName}`}
		onclick={() => player.load(sample)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			preserveAspectRatio="xMidYMid meet"
			class="h-full w-full object-contain"
			viewBox="0 0 24 24"
		>
			{#if isPlaying}
				<path
					fill="currentColor"
					d="M9 16q-.425 0-.712-.288T8 15V9q0-.425.288-.712T9 8t.713.288T10 9v6q0 .425-.288.713T9 16m6 0q-.425 0-.712-.288T14 15V9q0-.425.288-.712T15 8t.713.288T16 9v6q0 .425-.288.713T15 16"
				/>
			{:else}
				<path
					fill="currentColor"
					d="M9 15.714V8.287q0-.368.244-.588q.243-.22.568-.22q.102 0 .213.028q.11.027.211.083l5.843 3.733q.186.13.28.298q.093.167.093.379t-.093.379t-.28.298l-5.843 3.733q-.101.055-.213.083t-.213.028q-.326 0-.568-.22T9 15.714"
				/>
			{/if}
		</svg>
	</button>
	<div class="flex w-full flex-col gap-4">
		<p class="shrink-0 truncate font-medium">{sample.sampleName}</p>
		<div class="h-12 w-full">
			<Waveform
				peaks={sample.peaks}
				{progress}
				onseek={(p) => (isActive ? player.seek(p) : player.load(sample))}
			/>
		</div>
	</div>
</div>
