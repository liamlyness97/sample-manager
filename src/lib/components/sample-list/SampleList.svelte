<script lang="ts">
	import SampleItem from './SampleItem.svelte';
	import { player, type Sample } from '$lib/stores/player.svelte';

	let { samples }: { samples: Sample[] } = $props();

	// Keep the playback bar's prev/next in sync with the list being browsed.
	$effect(() => {
		player.setQueue(samples);
	});
</script>

<div
	class="grid w-full grid-cols-8 rounded-t-xl border border-blue-100 bg-blue-300 py-2 text-white uppercase"
>
	<div class=""></div>
	<div class="col-span-4">
		<p>Sample</p>
	</div>
	<div>
		<p>BPM</p>
	</div>
	<div>
		<p>Length</p>
	</div>
	<div>
		<p>Type</p>
	</div>
</div>

<div class="grid scrollbar-hidden w-full snap-y snap-always grid-cols-1 gap-3 overflow-scroll">
	{#each samples as sample (sample.id)}
		<SampleItem {sample} />
	{/each}
</div>
