<script lang="ts">
	import NavBar from '$lib/components/ui/NavBar.svelte';
	import PlaybackBar from '$lib/components/ui/PlaybackBar.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children, data } = $props();
</script>

<NavBar name={data.user.name} />

<div class="flex h-screen w-full justify-between gap-8 bg-offWhite py-24 pb-20">
	<div class="flex h-full w-1/8 shrink-0 flex-col gap-2 border-r px-4 py-8">
		<a
			href={resolve('/dashboard')}
			class="rounded-xl px-4 py-2 font-medium duration-200 ease-out hover:bg-white {page.url
				.pathname === '/dashboard'
				? 'bg-white'
				: ''}">Dashboard</a
		>
		<a
			href={resolve('/dashboard/samples')}
			class="rounded-xl px-4 py-2 font-medium duration-200 ease-out hover:bg-white {page.url
				.pathname === '/dashboard/samples'
				? 'bg-white'
				: ''}">Samples</a
		>
	</div>
	{@render children()}
</div>

<PlaybackBar />
