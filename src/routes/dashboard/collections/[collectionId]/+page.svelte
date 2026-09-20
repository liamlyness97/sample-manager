<script lang="ts">
	import SampleList from '$lib/components/sample-list/SampleList.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let samples = $derived(data.samples);
	let collection = $derived(data.collection);
	let totalSamples = $derived(samples.length);

	let searchTerm = $state();
</script>

<div class="flex h-full w-full grow flex-col gap-4 overflow-hidden">
	<div class="flex w-full flex-col gap-2">
		<h2 class="text-4xl font-light text-white">Browse {collection.name} Collection</h2>
		<div class="mt-2 flex justify-between text-white/50">
			<p>{totalSamples} samples | sorted by recently added</p>
			<div class="flex gap-2"></div>
		</div>
	</div>
	<div class="flex h-full min-h-0 w-full flex-col gap-8">
		<div class="flex items-center gap-4">
			<div class="w-1/3">
				<input
					class="w-full rounded border border-white/20 px-4 py-2.5 placeholder:text-white"
					type="text"
					name="searchTerm"
					bind:value={searchTerm}
					placeholder="Search samples..."
				/>
			</div>
			<div class="flex gap-2">
				<button class="rounded-xl border border-white/20 px-4 py-2 text-white/50"> All </button>
				<button class="rounded-xl border border-white/20 px-4 py-2 text-white/50"> Kicks </button>
			</div>
		</div>

		<SampleList samples={data.samples} types={data.types} />
	</div>
</div>
