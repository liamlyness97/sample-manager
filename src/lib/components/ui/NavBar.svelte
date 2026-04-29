<script lang="ts">
	import { resolve } from '$app/paths';

	let title = $state('Sample Manager');

	let { name }: { name: string } = $props();
</script>

<nav
	class="fixed top-0 left-0 flex w-full items-center justify-between bg-blue-300 px-4 py-2 text-white"
>
	<div class="flex items-center gap-4">
		<div class="h-10 w-10">
			<svg
				width="100%"
				height="100%"
				viewBox="0 0 95 70"
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
				><path
					d="M0,34.098c0,0 22.422,-77.1 46.523,0.572c24.102,77.673 46.455,3.602 47.552,-0.572l-47.552,0.572l-46.523,-0.572"
					style="fill:#fff;"
				/></svg
			>
		</div>
		<p>{title}</p>
	</div>
	<div class="flex gap-8">
		<a href={resolve('/dashboard')}>Dashboard</a>
		<a href={resolve('/dashboard/samples')}>Samples</a>
	</div>
	<div class="flex items-center gap-4">
		<a href={resolve('/dashboard/profile')}>{name}</a>
		<form action="/login?/signout" method="POST">
			<button
				class="cursor-pointer rounded-md border border-white/75 px-2 py-1.5 text-sm text-white/75 duration-200 ease-out hover:border-white hover:text-white"
			>
				Sign Out
			</button>
		</form>
	</div>
</nav>
