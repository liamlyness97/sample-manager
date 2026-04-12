<script lang="ts">
	import SampleList from '$lib/components/sample-list/SampleList.svelte';

	let searchTerm = $state('');

	let uploadToggle = $state(false);
	let fileError = $state('');

	let { data } = $props();

	function validateAudioFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file && !file.type.startsWith('audio/')) {
			fileError = `"${file.name}" is not a supported audio file.`;
			input.value = '';
		} else {
			fileError = '';
		}
	}
</script>

<div class="flex scrollbar-hidden h-full w-full grow gap-4 overflow-y-scroll">
	<div class="w-1/6 bg-blue"></div>
	<div class="flex h-full w-full flex-col gap-8">
		<div class="flex gap-4">
			<input
				class="w-full rounded border border-blue px-4 py-2.5"
				type="text"
				name="searchTerm"
				bind:value={searchTerm}
				placeholder="Search samples..."
			/>
			<button
				onclick={() => {
					uploadToggle = !uploadToggle;
				}}
				class="w-28 cursor-pointer rounded bg-blue text-white"
			>
				{#if uploadToggle}
					Close
				{:else}
					Upload
				{/if}
			</button>
		</div>
		{#if uploadToggle}
			<div class="flex w-full flex-col gap-4 rounded bg-white p-4">
				<p class="text-lg">Upload sample</p>
				<form action="?/upload" method="POST" enctype="multipart/form-data" class="flex gap-4">
					<div class="flex w-full flex-col gap-1">
						<input
							class="w-full rounded border px-4 py-2.5 {fileError ? 'border-red-500' : 'border-blue'}"
							type="file"
							name="file"
							id="file"
							accept="audio/*"
							onchange={validateAudioFile}
						/>
						{#if fileError}
							<p class="text-sm text-red-500">{fileError}</p>
						{/if}
					</div>
					<button
						class="w-40 cursor-pointer rounded bg-blue text-white disabled:opacity-50"
						type="submit"
						disabled={!!fileError}
					>Upload sample</button
					>
				</form>
			</div>
		{/if}
		<SampleList samples={data.samples} />
	</div>
	<div class="w-1/6 bg-blue"></div>
</div>
