<script lang="ts">
	import SidebarNavItem from './SidebarNavItem.svelte';
</script>

<div class="flex h-full w-1/6 shrink-0 flex-col gap-2 bg-blue-300 px-4 py-24 text-sm">
	<SidebarNavItem label="Dashboard" icon="hugeicons:home-07" link="/dashboard" />
	<SidebarNavItem label="Samples" icon="hugeicons:audio-wave-02" link="/dashboard/samples" />
	<SidebarNavItem label="Samples Types" icon="hugeicons:folder-01" link="/dashboard/sample-types" />
	<SidebarNavItem label="Collections" icon="hugeicons:layers-01" link="/dashboard/collections" />
</div>
