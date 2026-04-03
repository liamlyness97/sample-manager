<script lang="ts">
	let { name, id, url, format, folder, fileSize, createdAt } = $props();
</script>

<div
	class="flex h-16 w-full snap-proximity snap-start items-center justify-between rounded bg-white px-4"
>
	<p>{name}</p>
</div>
