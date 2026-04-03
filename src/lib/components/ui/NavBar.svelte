<script lang="ts">
	let title = $state('Sample Manager');

	let { name }: { name: string } = $props();
</script>

<nav class="fixed top-0 left-0 flex w-full justify-between bg-blue p-4 text-white">
	<div>
		<p>{title}</p>
	</div>
	<div class="flex gap-4">
		<p>{name}</p>
		<form action="/login?/signout" method="POST">
			<button class="cursor-pointer duration-200 ease-out hover:opacity-75"> Sign Out </button>
		</form>
	</div>
</nav>
