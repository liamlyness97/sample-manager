<script lang="ts">
	import SampleList from '$lib/components/sample-list/SampleList.svelte';

	let searchTerm = $state('');

	const tempSamples = [
		{
			id: 1,
			name: 'Sample 1'
		},
		{
			id: 2,
			name: 'Sample 2'
		},
		{
			id: 3,
			name: 'Sample 3'
		},
		{
			id: 4,
			name: 'Sample 4'
		},
		{
			id: 5,
			name: 'Sample 5'
		}
	];
</script>

<div class="flex h-full flex-col gap-8">
	<div class="w-full">
		<input
			class="w-full rounded border border-blue px-4 py-2.5"
			type="text"
			name="searchTerm"
			bind:value={searchTerm}
			placeholder="Search samples..."
		/>
	</div>
	<SampleList samples={tempSamples} />
</div>
