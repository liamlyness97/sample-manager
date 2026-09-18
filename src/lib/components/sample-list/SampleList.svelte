<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import SampleItem from './SampleItem.svelte';
	import { player, type Sample } from '$lib/stores/player.svelte';

	type SampleTypeOption = { id: string; name: string };

	let { samples, types = [] }: { samples: Sample[]; types?: SampleTypeOption[] } = $props();

	const typeNames = $derived(new Map(types.map((t) => [t.id, t.name])));

	const selectedIds = new SvelteSet<string>();
	const allSelected = $derived(samples.length > 0 && selectedIds.size === samples.length);
	const someSelected = $derived(selectedIds.size > 0 && !allSelected);

	function toggle(id: string) {
		if (selectedIds.has(id)) selectedIds.delete(id);
		else selectedIds.add(id);
	}

	function toggleAll() {
		if (allSelected) {
			selectedIds.clear();
		} else {
			for (const sample of samples) selectedIds.add(sample.id);
		}
	}

	// Keep the playback bar's prev/next in sync with the list being browsed.
	$effect(() => {
		player.setQueue(samples);
	});
</script>

<div class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-blue-100">
	<div
		class="grid w-full grid-cols-8 items-center gap-2 border-b border-blue-100 bg-blue-300 px-3 py-2 text-xs text-white/60 uppercase"
	>
		<div class="flex items-center">
			<input
				type="checkbox"
				class="h-4 w-4 accent-orange-500"
				checked={allSelected}
				onchange={toggleAll}
				aria-label="Select all samples"
				{@attach (el) => {
					(el as HTMLInputElement).indeterminate = someSelected;
				}}
			/>
		</div>
		<div class="col-span-3">
			<p>Sample</p>
		</div>
		<div class="flex justify-center">
			<p>BPM</p>
		</div>
		<div class="flex justify-center">
			<p>Length (seconds)</p>
		</div>
		<div class="flex justify-center">
			<p>Key</p>
		</div>
		<div class="flex justify-center">
			<p>Type</p>
		</div>
	</div>

	<div
		class="grid scrollbar-hidden min-h-0 w-full snap-y snap-always grid-cols-1 overflow-y-scroll"
	>
		{#each samples as sample (sample.id)}
			<SampleItem
				{sample}
				selected={selectedIds.has(sample.id)}
				ontoggle={() => toggle(sample.id)}
				typeName={sample.typeId ? (typeNames.get(sample.typeId) ?? '—') : '—'}
			/>
		{/each}
	</div>
</div>
