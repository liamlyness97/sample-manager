<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import CreateCollectionModal from '$lib/components/collections/CreateCollectionModal.svelte';

	let createModal: boolean = $state(false);
</script>

<div class="flex h-full w-full grow flex-col gap-8 overflow-hidden">
	<div class="flex w-full flex-col gap-2">
		<h2 class="text-4xl font-light text-white">Collections</h2>
		<div class="mt-2 flex items-center justify-between text-white/50">
			<p>17 Collections | sorted by recently added</p>
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
	<div class="grid grid-cols-5 gap-4">
		<div class="flex flex-col gap-2 rounded-2xl border border-blue-100/50 bg-blue-100 p-4">
			<div class="h-8 w-8 rounded-lg bg-lime-400"></div>
			<p class="text-xl font-medium text-white">Collection</p>
			<p class="text-sm font-light text-blue-50 opacity-50">142 samples</p>
		</div>
		<div class="flex flex-col gap-2 rounded-2xl border border-blue-100/50 bg-blue-100 p-4">
			<div class="h-8 w-8 rounded-lg bg-lime-400"></div>
			<p class="text-xl text-white">Collection</p>
			<p class="text-sm font-light text-blue-50 opacity-50">142 samples</p>
		</div>
		<div class="flex flex-col gap-2 rounded-2xl border border-blue-100/50 bg-blue-100 p-4">
			<div class="h-8 w-8 rounded-lg bg-lime-400"></div>
			<p class="text-xl text-white">Collection</p>
			<p class="text-sm font-light text-blue-50 opacity-50">142 samples</p>
		</div>
		<div class="flex flex-col gap-2 rounded-2xl border border-blue-100/50 bg-blue-100 p-4">
			<div class="h-8 w-8 rounded-lg bg-lime-400"></div>
			<p class="text-xl text-white">Collection</p>
			<p class="text-sm font-light text-blue-50 opacity-50">142 samples</p>
		</div>
		<div class="flex flex-col gap-2 rounded-2xl border border-blue-100/50 bg-blue-100 p-4">
			<div class="h-8 w-8 rounded-lg bg-lime-400"></div>
			<p class="text-xl text-white">Collection</p>
			<p class="text-sm font-light text-blue-50 opacity-50">142 samples</p>
		</div>
		<div class="flex flex-col gap-2 rounded-2xl border border-blue-100/50 bg-blue-100 p-4">
			<div class="h-8 w-8 rounded-lg bg-lime-400"></div>
			<p class="text-xl text-white">Collection</p>
			<p class="text-sm font-light text-blue-50 opacity-50">142 samples</p>
		</div>
		<div class="flex flex-col gap-2 rounded-2xl border border-blue-100/50 bg-blue-100 p-4">
			<div class="h-8 w-8 rounded-lg bg-lime-400"></div>
			<p class="text-xl text-white">Collection</p>
			<p class="text-sm font-light text-blue-50 opacity-50">142 samples</p>
		</div>
		<div class="flex flex-col gap-2 rounded-2xl border border-blue-100/50 bg-blue-100 p-4">
			<div class="h-8 w-8 rounded-lg bg-lime-400"></div>
			<p class="text-xl text-white">Collection</p>
			<p class="text-sm font-light text-blue-50 opacity-50">142 samples</p>
		</div>
	</div>
</div>

<CreateCollectionModal bind:open={createModal} onsuccess={() => invalidateAll()} />
