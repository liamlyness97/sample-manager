<script lang="ts">
	import NavBar from '$lib/components/ui/NavBar.svelte';
	import PlaybackBar from '$lib/components/ui/PlaybackBar.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import 'iconify-icon';
	import SidebarNav from '$lib/components/ui/sidebar/SidebarNav.svelte';

	let { children, data } = $props();
</script>

<NavBar name={data.user.name} />

<div class="flex h-screen w-full justify-between gap-8 bg-blue-200">
	<SidebarNav recentSamples={data.recentSamples} />
	<div class="h-full w-full py-20 pr-8">
		{@render children()}
	</div>
</div>

<PlaybackBar />
