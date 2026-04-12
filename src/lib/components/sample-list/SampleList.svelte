<script lang="ts">
	import SampleItem from './SampleItem.svelte';

	let { samples } = $props();
</script>

<div class="grid scrollbar-hidden w-full snap-y snap-always grid-cols-1 gap-3 overflow-scroll">
	{#each samples as sample (sample.id)}
		<SampleItem
			name={sample.sampleName}
			id={sample.id}
			url={sample.sampleUrl}
			format={sample.sampleFormat}
			folder={sample.sampleFolder}
			fileSize={sample.fileSize}
			createdAt={sample.createdAt}
			peaks={sample.peaks}
		/>
	{/each}
</div>
