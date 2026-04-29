<script lang="ts">
	import { slide } from 'svelte/transition';

	let { data } = $props();

	let addType = $state(false);
</script>

<div class="flex w-full flex-col gap-4 pr-8">
	<div class="flex w-full justify-between">
		<h2 class="text-3xl font-medium">Sample Types</h2>
		<button
			onclick={() => (addType = !addType)}
			class="cursor-pointer rounded border border-blue px-4 duration-200 hover:bg-blue hover:text-white"
		>
			{#if addType}
				Close
			{:else}
				Add Type
			{/if}
		</button>
	</div>
	{#if addType}
		<div
			transition:slide={{ duration: 200 }}
			class="flex w-full flex-col gap-2 rounded bg-white p-4"
		>
			<p class="text-xl font-medium">Add Type</p>
			<form action="?/addType" method="POST" class="flex gap-4">
				<input
					type="text"
					name="name"
					id="name"
					class="w-full rounded border border-blue p-2"
					placeholder="Enter Sample Type Name"
				/>
				<button type="submit" class="shrink-0 rounded bg-blue px-4 text-white"> Add Type </button>
			</form>
		</div>
	{/if}
	<div class="grid grid-cols-5 gap-4 py-8">
		{#if data.sampleTypes}
			{#each data.sampleTypes as type (type.id)}
				<button
					class="flex h-[6rem] w-full flex-col items-start justify-center rounded-md border px-8 text-xl duration-300 hover:bg-white"
				>
					<p>{type.name}</p>
				</button>
			{/each}
		{:else}
			<p>You currently have no Sample Types created</p>
		{/if}
	</div>
</div>
