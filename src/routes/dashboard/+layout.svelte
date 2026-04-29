<script lang="ts">
	import NavBar from '$lib/components/ui/NavBar.svelte';
	import PlaybackBar from '$lib/components/ui/PlaybackBar.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children, data } = $props();
</script>

<NavBar name={data.user.name} />

<div class="flex h-screen w-full justify-between gap-8 bg-blue-200">
	<div class="flex h-full w-1/6 shrink-0 flex-col gap-2 bg-blue-300 px-4 py-24 text-sm">
		<a
			href={resolve('/dashboard')}
			class="flex items-center gap-2 rounded-lg px-2 py-2 text-white duration-200 ease-out hover:bg-blue-100 {page
				.url.pathname === '/dashboard'
				? 'bg-blue-100'
				: ''}"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
				><g
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					><path
						d="m12.892 2.81l8.596 6.785A1.347 1.347 0 0 1 20.653 12H20v3.5c0 2.828 0 4.243-.879 5.121c-.878.879-2.293.879-5.121.879h-4c-2.828 0-4.243 0-5.121-.879C4 19.743 4 18.328 4 15.5V12h-.653a1.347 1.347 0 0 1-.835-2.405l8.596-6.785a1.44 1.44 0 0 1 1.784 0"
					/><path
						d="M14.5 21.5V17c0-.935 0-1.402-.201-1.75a1.5 1.5 0 0 0-.549-.549c-.348-.201-.815-.201-1.75-.201s-1.402 0-1.75.201a1.5 1.5 0 0 0-.549.549c-.201.348-.201.815-.201 1.75v4.5"
					/></g
				></svg
			>
			<span>Dashboard</span>
		</a>
		<a
			href={resolve('/dashboard/samples')}
			class="flex items-center gap-2 rounded-lg px-2 py-2 text-white duration-200 ease-out hover:bg-blue-100 {page
				.url.pathname === '/dashboard/samples'
				? 'bg-blue-100'
				: ''}"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
				><path
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M3 14V9.5a1.5 1.5 0 1 1 3 0v7a1.5 1.5 0 0 0 3 0v-12a1.5 1.5 0 1 1 3 0v15a1.5 1.5 0 0 0 3 0v-11a1.5 1.5 0 0 1 3 0v7a1.5 1.5 0 0 0 3 0V12"
				/></svg
			>
			<span>Samples</span></a
		>
		<a
			href={resolve('/dashboard/sample-types')}
			class="flex items-center gap-2 rounded-lg px-2 py-2 text-white duration-200 ease-out hover:bg-blue-100 {page
				.url.pathname === '/dashboard/sample-types'
				? 'bg-blue-100'
				: ''}"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
				><path
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-width="1.5"
					d="M8 7h8.75c2.107 0 3.16 0 3.917.506a3 3 0 0 1 .827.827C22 9.09 22 10.143 22 12.25c0 3.511 0 5.267-.843 6.528a5 5 0 0 1-1.38 1.38C18.518 21 16.762 21 13.25 21H12c-4.714 0-7.071 0-8.536-1.465C2 18.072 2 15.715 2 11V7.944c0-1.816 0-2.724.38-3.406A3 3 0 0 1 3.538 3.38C4.22 3 5.128 3 6.944 3C8.108 3 8.69 3 9.2 3.191c1.163.436 1.643 1.493 2.168 2.542L12 7"
				/></svg
			>
			<span>Sample Types</span>
		</a>
	</div>
	{@render children()}
</div>

<PlaybackBar />
