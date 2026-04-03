<script lang="ts">
	import NavBar from '$lib/components/ui/NavBar.svelte';
	import PlaybackBar from '$lib/components/ui/PlaybackBar.svelte';

	let { children, data } = $props();
</script>

<NavBar name={data.user.name} />

<div class="h-screen w-full justify-between gap-8 bg-offWhite px-4 py-24 pb-20">
	{@render children()}
</div>

<PlaybackBar />
