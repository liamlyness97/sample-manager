<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import SampleItem from './SampleItem.svelte';
	import { player, type Sample } from '$lib/stores/player.svelte';
	import EditCollectionsModal from '../collections/EditCollectionsModal.svelte';
	import RenameSamplesModal from './RenameSamplesModal.svelte';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';

	type SampleTypeOption = { id: string; name: string };
	type CollectionsOption = { id: string; name: string };
	type SampleWithCollections = Sample & {
		collectionSamples?: { collectionId: string; collection: CollectionsOption }[];
	};

	let {
		samples,
		types = [],
		collections = []
	}: {
		samples: SampleWithCollections[];
		types?: SampleTypeOption[];
		collections?: CollectionsOption[];
	} = $props();

	let editCollection = $state(false);
	let renameSamples = $state(false);
	let deleteForm = $state<HTMLFormElement>();
	let deleting = $state(false);
	let reanalyseForm = $state<HTMLFormElement>();
	let reanalysing = $state(false);

	const typeNames = $derived(new Map(types.map((t) => [t.id, t.name])));

	const selectedIds = new SvelteSet<string>();
	const allSelected = $derived(samples.length > 0 && selectedIds.size === samples.length);
	const someSelected = $derived(selectedIds.size > 0 && !allSelected);
	let selectedSamples = $derived(samples.filter((s) => selectedIds.has(s.id)));

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

	function confirmDelete() {
		if (selectedSamples.length === 0 || deleting) return;
		const label =
			selectedSamples.length === 1 ? 'this sample' : `these ${selectedSamples.length} samples`;
		if (!confirm(`Delete ${label}? This can't be undone.`)) return;
		deleteForm?.requestSubmit();
	}

	function confirmReanalysis() {
		if (selectedSamples.length === 0 || reanalysing) return;
		const label =
			selectedSamples.length === 1 ? 'this sample' : `these ${selectedSamples.length} samples`;
		if (!confirm(`Re-analyse ${label}?`)) return;
		reanalyseForm?.requestSubmit();
	}
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

	{#if selectedSamples.length > 0}
		<div
			in:fly={{ y: 50, duration: 300 }}
			out:fly={{ y: 50, duration: 200 }}
			class="absolute right-0 bottom-20 left-0 mx-auto flex w-fit gap-4 rounded-full border border-blue-100 bg-blue-300 px-4 py-2 text-sm text-white"
		>
			<button class="cursor-pointer" onclick={() => (renameSamples = true)}> Rename Sample </button>
			<button class="cursor-pointer" onclick={() => (editCollection = true)}>
				Edit Collection
			</button>
			<button class="cursor-pointer" disabled={reanalysing} onclick={confirmReanalysis}>
				Re-Analyse
			</button>
			<button class="cursor-pointer text-red-500" disabled={deleting} onclick={confirmDelete}>
				Delete Sample
			</button>
		</div>
	{/if}
</div>

<EditCollectionsModal
	bind:open={editCollection}
	samples={selectedSamples}
	{collections}
	onsuccess={() => invalidateAll()}
	action="?/editSampleCollection"
/>

<RenameSamplesModal
	bind:open={renameSamples}
	samples={selectedSamples}
	onsuccess={() => invalidateAll()}
	action="?/renameSamples"
/>

<form
	bind:this={reanalyseForm}
	action="?/reanalyseSamples"
	method="POST"
	class="hidden"
	use:enhance={() => {
		reanalysing = true;
		return async ({ result, update }) => {
			reanalysing = false;
			if (result.type === 'success') {
				selectedIds.clear();
			}
			await update();
		};
	}}
>
	{#each selectedSamples as sample (sample.id)}
		<input type="hidden" name="sampleIds" value={sample.id} />
	{/each}
</form>

<form
	bind:this={deleteForm}
	method="POST"
	action="?/deleteSamples"
	class="hidden"
	use:enhance={() => {
		deleting = true;
		return async ({ result, update }) => {
			deleting = false;
			if (result.type === 'success') {
				selectedIds.clear();
			}
			await update();
		};
	}}
>
	{#each selectedSamples as sample (sample.id)}
		<input type="hidden" name="sampleIds" value={sample.id} />
	{/each}
</form>
