<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import CreateCollectionModal from '$lib/components/collections/CreateCollectionModal.svelte';

	let { data } = $props();

	let collectionCount = $derived(data.collectionsList.length);

	let createModal: boolean = $state(false);
</script>

<div class="flex h-full w-full grow flex-col gap-8 overflow-hidden">
	<div class="flex w-full flex-col gap-2">
		<h2 class="text-4xl font-light text-white">Collections</h2>
		<div class="mt-2 flex items-center justify-between text-white/50">
			<p>
				{collectionCount}
				{collectionCount > 1 ? 'Collections' : 'Collection'} | sorted by recently added
			</p>
			<div class="flex gap-2">
				<button
					onclick={() => (createModal = true)}
					class="cursor-pointer rounded-md bg-orange-600 px-6 py-2 text-white"
				>
					Create Collection
				</button>
			</div>
		</div>
	</div>
	{#if data.collectionsList}
		<div class="grid grid-cols-5 gap-4">
			{#each data.collectionsList as collection (collection.id)}
				<button
					onclick={() => goto(`/dashboard/collections/${collection.id}`)}
					style="--highlight: {collection.highlight}"
					class="flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-blue-100 bg-blue-100 p-4 duration-200 hover:border-white/20"
				>
					<div class="h-8 w-8 rounded-lg bg-(--highlight)"></div>
					<p class="text-xl font-medium text-white">{collection.name}</p>
					<p class="text-sm font-light text-blue-50 opacity-50">142 samples</p>
				</button>
			{/each}
		</div>
	{:else}
		<div>
			<p class="text-white">No collections found</p>
		</div>
	{/if}
</div>

<CreateCollectionModal bind:open={createModal} onsuccess={() => invalidateAll()} />
