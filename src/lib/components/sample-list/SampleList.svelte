<script lang="ts">
	import SampleItem from './SampleItem.svelte';

	let { samples } = $props();
</script>

<div class="grid w-full snap-y snap-always grid-cols-1 gap-3 overflow-scroll">
	{#each samples as sample (sample.id)}
		<SampleItem sampleName={sample.name} sampleId={sample.id} />
	{/each}
</div>
