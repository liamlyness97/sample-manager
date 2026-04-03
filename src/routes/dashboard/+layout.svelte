<script lang="ts">
	import NavBar from '$lib/components/ui/NavBar.svelte';
	import PlaybackBar from '$lib/components/ui/PlaybackBar.svelte';

	let { children, data } = $props();

	$inspect(data.user);
</script>

<NavBar />

<div class="flex h-screen justify-between gap-8 bg-offWhite px-4 py-20">
	<div class="w-1/6 bg-blue"></div>
	<div class="scrollbar-hidden h-full grow overflow-y-scroll">
		{@render children()}
	</div>
	<div class="w-1/6 bg-blue"></div>
</div>

<PlaybackBar />
