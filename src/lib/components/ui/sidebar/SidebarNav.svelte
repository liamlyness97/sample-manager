<script lang="ts">
	import SidebarNavItem from './SidebarNavItem.svelte';

	let { recentSamples } = $props();
</script>

<div class="flex h-full w-1/6 shrink-0 flex-col gap-2 bg-blue-300 px-4 py-24 text-sm">
	<SidebarNavItem label="Dashboard" icon="hugeicons:home-07" link="/dashboard" />
	<SidebarNavItem label="Samples" icon="hugeicons:audio-wave-02" link="/dashboard/samples" />
	<SidebarNavItem label="Samples Types" icon="hugeicons:folder-01" link="/dashboard/sample-types" />
	<SidebarNavItem label="Collections" icon="hugeicons:layers-01" link="/dashboard/collections" />

	<div class="mt-8 flex flex-col items-start gap-2 px-2">
		<p class="text-sm font-light tracking-wider text-white uppercase">Recent</p>
		{#each recentSamples as sample (sample.id)}
			<p class="text-sm font-light tracking-wider text-blue-50">{sample.sampleName}</p>
		{/each}
	</div>
</div>
