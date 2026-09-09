<script lang="ts">
	import { drawWaveform } from '$lib/helpers/drawWaveform';

	let {
		peaks,
		progress = 0,
		onseek
	}: {
		peaks: string | number[] | null | undefined;
		progress?: number;
		onseek?: (progress: number) => void;
	} = $props();

	let canvas = $state<HTMLCanvasElement>();

	const parsedPeaks = $derived(
		typeof peaks === 'string' ? (JSON.parse(peaks) as number[]) : (peaks ?? [])
	);

	$effect(() => {
		if (canvas) drawWaveform(canvas, parsedPeaks, progress);
	});

	$effect(() => {
		if (!canvas) return;
		const observer = new ResizeObserver(() => {
			if (canvas) drawWaveform(canvas, parsedPeaks, progress);
		});
		observer.observe(canvas);
		return () => observer.disconnect();
	});

	function seekFromEvent(event: MouseEvent & { currentTarget: HTMLElement }) {
		if (!onseek) return;
		const rect = event.currentTarget.getBoundingClientRect();
		onseek((event.clientX - rect.left) / rect.width);
	}
</script>

<button
	type="button"
	class="relative block h-full w-full appearance-none {onseek
		? 'cursor-pointer'
		: 'cursor-default'}"
	disabled={!onseek}
	aria-label="Seek within waveform"
	onclick={seekFromEvent}
>
	<canvas bind:this={canvas} class="absolute inset-0 h-full w-full"></canvas>
</button>
