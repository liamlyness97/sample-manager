<script lang="ts">
	import { player, type Sample } from '$lib/stores/player.svelte';
	import Waveform from '$lib/components/ui/Waveform.svelte';

	let {
		sample,
		selected = false,
		ontoggle,
		typeName = '—'
	}: {
		sample: Sample;
		selected?: boolean;
		ontoggle?: () => void;
		typeName?: string;
	} = $props();

	const isActive = $derived(player.state.activeSample?.id === sample.id);
	const isPlaying = $derived(isActive && player.state.isPlaying);
	const progress = $derived(isActive ? player.state.progress : 0);

	let roundedBpm: number = $derived(Math.round(sample.sampleBpm ?? 0));
	let formattedDuration = $derived(sample.duration?.toFixed(2));
</script>

<div
	class="grid w-full snap-start grid-cols-8 items-center gap-2 border-b border-blue-100 px-3 py-2 text-white last:border-b-0 {selected
		? 'bg-blue-100/25'
		: ''}"
>
	<div class="flex items-center gap-3">
		<input
			type="checkbox"
			class="h-4 w-4 shrink-0 accent-orange-500"
			checked={selected}
			onchange={() => ontoggle?.()}
			aria-label={`Select ${sample.sampleName}`}
		/>
		<div class="flex w-full justify-center">
			<button
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-white transition-colors hover:bg-blue-100/80"
				aria-label={isPlaying ? `Pause ${sample.sampleName}` : `Play ${sample.sampleName}`}
				onclick={() => player.load(sample)}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24">
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
		</div>
	</div>

	<div class="col-span-3 flex min-w-0 flex-col gap-1">
		<p class="truncate text-sm font-medium">{sample.sampleName}</p>
		<div class="h-10 w-full">
			<Waveform
				peaks={sample.peaks}
				{progress}
				onseek={(p) => (isActive ? player.seek(p) : player.load(sample))}
			/>
		</div>
	</div>
	<div>
		<p class="text-center text-sm text-white/70">{roundedBpm ?? '—'}</p>
	</div>
	<!-- Length: no duration is stored on the sample record yet -->
	<div>
		<p class="text-center text-sm text-white/70">{formattedDuration ?? '—'}</p>
	</div>
	<div>
		<p class="text-center text-sm text-white/70">{sample.estimatedKey ?? '—'}</p>
	</div>
	<div>
		<p class="truncate text-center text-sm text-white/70">{typeName}</p>
	</div>
</div>
