<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SampleList from '$lib/components/sample-list/SampleList.svelte';
	import { extractPeaks } from '$lib/helpers/extractPeaks.js';

	let { data } = $props();

	let searchTerm = $state('');
	let uploadToggle = $state(false);
	let fileError = $state('');
	let uploading = $state(false);
	let uploadError = $state('');
	let uploadType = $state('none');

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

	async function handleUpload(file: File) {
		uploading = true;
		uploadError = '';
		try {
			const audioCtx = new AudioContext();
			const audioBuffer = await audioCtx.decodeAudioData(await file.arrayBuffer());
			const peaks = extractPeaks(audioBuffer, 200);

			const formData = new FormData();
			formData.append('file', file);
			formData.append('peaks', JSON.stringify(peaks));
			formData.append('sampleType', uploadType);

			const res = await fetch('?/upload', { method: 'POST', body: formData });
			if (!res.ok) throw new Error('Upload failed');

			uploadToggle = false;
			invalidateAll();
		} catch (err) {
			uploadError = 'Something went wrong during upload.';
		} finally {
			uploading = false;
		}
	}
</script>

<div class="flex scrollbar-hidden h-full w-full grow gap-4 overflow-y-scroll px-8">
	<div class="flex h-full w-full flex-col gap-8">
		<div class="flex gap-4">
			<input
				class="border-blue w-full rounded border px-4 py-2.5"
				type="text"
				name="searchTerm"
				bind:value={searchTerm}
				placeholder="Search samples..."
			/>
			<button
				onclick={() => {
					uploadToggle = !uploadToggle;
				}}
				class="bg-blue w-28 cursor-pointer rounded text-white"
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
				<form
					class="flex gap-4"
					onsubmit={async (e) => {
						e.preventDefault();
						const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
						const file = input.files?.[0];
						if (!file) return;
						await handleUpload(file);
					}}
				>
					<div class="flex w-full flex-col gap-1">
						<input
							class="w-full rounded border px-4 py-2.5 {fileError
								? 'border-red-500'
								: 'border-blue'}"
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
					<div>
						<select
							name="sample-type"
							id="sample-type"
							class="border-blue h-full rounded border px-4"
							bind:value={uploadType}
						>
							<option value="none">Select Sample Type</option>
							{#each data.types as type (type.id)}
								<option value={type.id}>
									{type.name}
								</option>
							{/each}
						</select>
					</div>
					<button
						class="bg-blue w-40 cursor-pointer rounded text-white disabled:opacity-50"
						type="submit"
						disabled={!!fileError || uploading}
					>
						{uploading ? 'Uploading...' : 'Upload sample'}
					</button>
				</form>
			</div>
		{/if}
		<SampleList samples={data.samples} />
	</div>
</div>
