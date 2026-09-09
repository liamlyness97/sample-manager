<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import Waveform from './Waveform.svelte';

	const state = $derived(player.state);
</script>

{#if state.activeSample}
	<div
		class="fixed bottom-0 left-0 flex h-16 w-full items-center gap-6 border-t border-blue-100/70 bg-blue-300 px-4 text-white"
	>
		<div class="sample-info flex w-56 shrink-0 items-center gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-100/40">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3zm-2 16a2 2 0 1 1 0-4a2 2 0 0 1 0 4"
					/>
				</svg>
			</div>
			<div class="flex min-w-0 flex-col">
				<p class="truncate text-sm font-medium">{state.activeSample.sampleName}</p>
				<p class="text-xs text-white/70">
					{state.activeSample.bpm ? `${state.activeSample.bpm} BPM` : '—'}
				</p>
			</div>
		</div>

		<div class="player-controls flex shrink-0 items-center gap-2">
			<button
				class="flex h-9 w-9 items-center justify-center rounded-full hover:bg-blue-100/40"
				aria-label="Previous sample"
				onclick={() => player.prev()}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
					<path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
				</svg>
			</button>
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-300"
				aria-label={state.isPlaying ? 'Pause' : 'Play'}
				onclick={() => player.togglePlay()}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
					{#if state.isPlaying}
						<path
							fill="currentColor"
							d="M9 16q-.425 0-.712-.288T8 15V9q0-.425.288-.712T9 8t.713.288T10 9v6q0 .425-.288.713T9 16m6 0q-.425 0-.712-.288T14 15V9q0-.425.288-.712T15 8t.713.288T16 9v6q0 .425-.288.713T15 16"
						/>
					{:else}
						<path fill="currentColor" d="M8 5v14l11-7z" />
					{/if}
				</svg>
			</button>
			<button
				class="flex h-9 w-9 items-center justify-center rounded-full hover:bg-blue-100/40"
				aria-label="Next sample"
				onclick={() => player.next()}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
					<path fill="currentColor" d="M16 6h2v12h-2zm-2.5 6L6 6v12z" />
				</svg>
			</button>
		</div>

		<div class="h-10 flex-1">
			<Waveform
				peaks={state.activeSample.peaks}
				progress={state.progress}
				onseek={(p) => player.seek(p)}
			/>
		</div>

		<div class="volume-controls flex w-32 shrink-0 items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02M3 9v6h4l5 5V4L7 9z"
				/>
			</svg>
			<input
				class="w-full accent-white"
				type="range"
				min="0"
				max="1"
				step="0.01"
				value={state.volume}
				aria-label="Volume"
				oninput={(e) => player.setVolume(e.currentTarget.valueAsNumber)}
			/>
		</div>
	</div>
{/if}
