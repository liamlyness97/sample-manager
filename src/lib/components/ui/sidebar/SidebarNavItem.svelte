<script lang="ts">
	import { page } from '$app/state';

	let { icon, label, link }: { icon: string; label: string; link: string } = $props();
</script>

<a
	href={link}
	class="flex items-center gap-2 rounded-lg px-2 py-2 text-white duration-200 ease-out hover:bg-blue-100 {page
		.url.pathname === link
		? 'bg-blue-100'
		: ''}"
>
	<iconify-icon class="text-xl" {icon}></iconify-icon>
	<span>{label}</span></a
>
