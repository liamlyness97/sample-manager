<script lang="ts">
	let {
		accept = 'audio/*',
		disabled = false,
		onfile
	}: {
		accept?: string;
		disabled?: boolean;
		onfile: (file: File) => void;
	} = $props();

	let input = $state<HTMLInputElement>();
	let dragging = $state(false);

	function take(files: FileList | null | undefined) {
		const file = files?.[0];
		if (file) onfile(file);
	}
</script>

<button
	type="button"
	{disabled}
	class="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50
		{dragging ? 'border-orange-400 bg-orange-400/10' : 'border-white/15 hover:border-white/30'}"
	onclick={() => input?.click()}
	ondragover={(event) => {
		event.preventDefault();
		if (!disabled) dragging = true;
	}}
	ondragleave={(event) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node)) dragging = false;
	}}
	ondrop={(event) => {
		event.preventDefault();
		dragging = false;
		if (!disabled) take(event.dataTransfer?.files);
	}}
>
	<svg
		class="h-8 w-8 {dragging ? 'text-orange-400' : 'text-white/40'}"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M12 15V3m0 0L8 7m4-4l4 4" />
		<path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
	</svg>
	<span class="text-sm text-white/80">
		Drop an audio file here, or <span class="text-white underline">click to browse</span>
	</span>
	<span class="text-xs text-white/40">WAV, MP3 or AIFF</span>
</button>

<input
	bind:this={input}
	class="sr-only"
	type="file"
	{accept}
	tabindex="-1"
	aria-hidden="true"
	onchange={(event) => {
		take(event.currentTarget.files);
		event.currentTarget.value = '';
	}}
/>
