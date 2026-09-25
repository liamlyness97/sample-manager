<script lang="ts">
	let { data } = $props();
</script>

<div class="flex h-full w-full justify-center">
	<div class="flex w-1/2 flex-col gap-8 rounded bg-white p-8">
		<p class="text-2xl">{data.user.name} Profile</p>
		<div>
			<p class="text-lg">Info</p>
			<p>Name: {data.user.name}</p>
			<p>Email Address: {data.user.email}</p>
		</div>
	</div>
</div>
