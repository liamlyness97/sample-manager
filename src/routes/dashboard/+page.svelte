<script lang="ts">
	import { keys } from '$lib/components/defaults/keys.svelte.js';

	let { data } = $props();

	let recentSamples = $derived(data.recentSamples);

	let collections = $derived(data.collections);
</script>

<div class="flex w-full flex-col">
	<h2 class="text-4xl font-light text-white">Browse</h2>
	<div class="mt-2 flex justify-between text-white/50">
		<p>Stats</p>
		<div class="flex gap-2">
			<div>Quick Search</div>
			<div>Upload</div>
		</div>
	</div>
	<div class="grid grid-cols-12 gap-4 py-8">
		<div class="col-span-8 flex flex-col gap-4 rounded-xl bg-blue-300 p-8">
			<p class="text-sm tracking-wider text-white/50 uppercase">All Samples</p>
			<p class="text-7xl text-white">{data.sampleCount}</p>
			<p class="text-sm tracking-wider text-white/50 uppercase">29.3GB</p>
		</div>
		<div class="col-span-4 flex flex-col rounded-xl bg-blue-100">
			<div class="border-b border-white/50 p-4">
				<p class="text-sm tracking-wider text-white/50 uppercase">Recently Played</p>
			</div>
			<div class="flex flex-col gap-1 p-4">
				{#each recentSamples as sample (sample.id)}
					<p class="font-light tracking-wider text-white">{sample.sampleName}</p>
				{/each}
			</div>
		</div>
		<div class="col-span-4 flex flex-col gap-4 rounded-xl bg-blue-100 p-8">
			<p class="text-sm tracking-wider text-white/50 uppercase">Collections</p>
			<div class="flex flex-wrap gap-2">
				{#each collections as collection (collection.id)}
					<button
						style="--highlight: {collection.highlight}"
						class="cursor-pointer rounded-full bg-(--highlight) px-4 py-2 text-xs text-white duration-200 hover:opacity-80"
					>
						{collection.name}
					</button>
				{/each}
			</div>
		</div>
		<div class="col-span-4 flex flex-col gap-4 rounded-xl bg-blue-100 p-8">
			<p class="text-sm tracking-wider text-white/50 uppercase">BPM</p>
		</div>
		<div class="col-span-4 flex flex-col gap-4 rounded-xl bg-blue-100 p-8">
			<p class="text-sm tracking-wider text-white/50 uppercase">Key</p>
			<div class="grid grid-cols-6 gap-1">
				{#each keys as key, i (i)}
					<button
						class="cursor-pointer rounded bg-white/10 py-2 text-xs font-light text-white duration-200 hover:opacity-80"
					>
						{key.key} - {key.type}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
