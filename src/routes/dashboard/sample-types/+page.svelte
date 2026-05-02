<script lang="ts">
	import { slide } from 'svelte/transition';

	let { data, form } = $props();

	let addType = $state(false);
</script>

<div class="flex w-full flex-col gap-4">
	<div class="flex w-full flex-col gap-2">
		<h2 class="text-4xl font-light text-white">Sample Types</h2>
		<div class="mt-2 flex justify-between text-white/50">
			<p>9 types | drag any sample onto a type to tag it</p>
		</div>
	</div>

	<div
		transition:slide={{ duration: 200 }}
		class="flex w-full flex-col gap-2 rounded-md bg-blue-300 p-6"
	>
		<p class="text-xl font-light text-white">Add Type</p>
		{#if form?.missing}
			<p class="text-red-500">You must enter a name for the sample type</p>
		{/if}
		<form action="?/addType" method="POST" class="flex gap-4">
			<input
				type="text"
				name="name"
				id="name"
				class="border-blue w-full rounded-md border bg-blue-200 px-3 py-2 placeholder:text-white/50"
				placeholder="Enter Sample Type Name"
			/>
			<button type="submit" class="shrink-0 rounded bg-orange-600 px-4 text-white">
				Add Type
			</button>
		</form>
	</div>

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
