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

	function toggleUpload() {
		uploadToggle = !uploadToggle;
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

<div class="flex scrollbar-hidden h-full w-full grow flex-col gap-4 overflow-y-scroll">
	{#if uploadToggle}
		<div class="fixed top-0 left-0 z-100 flex h-screen w-full items-center justify-center">
			<div
				class="absolute top-0 left-0 z-110 h-screen w-full bg-blue-300/20 backdrop-blur-sm"
				onclick={toggleUpload}
			></div>
			<form
				class="relative z-120 flex w-200 flex-col rounded-2xl bg-white"
				onsubmit={async (e) => {
					e.preventDefault();
					const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
					const file = input.files?.[0];
					if (!file) return;
					await handleUpload(file);
				}}
			>
				<div class="flex justify-between px-8 py-6">
					<p>Upload samples</p>
					<button onclick={toggleUpload} class="cursor-pointer text-2xl font-light"> x </button>
				</div>
				<div class="flex items-center justify-center border-y px-8 py-6">
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
				</div>
				<div class="flex justify-between px-8 py-6">
					<div class="">Stats</div>
					<div class="flex gap-2">
						<button onclick={toggleUpload}> Cancel </button>
						<button
							class="w-40 cursor-pointer rounded bg-blue-100 text-white disabled:opacity-50"
							type="submit"
							disabled={!!fileError || uploading}
						>
							{uploading ? 'Uploading...' : 'Upload sample'}
						</button>
					</div>
				</div>
			</form>
		</div>
	{/if}
	<div class="flex w-full flex-col gap-2">
		<h2 class="text-4xl font-light text-white">Browse</h2>
		<div class="mt-2 flex justify-between text-white/50">
			<p>{data.sampleCount} of {data.sampleCount} | sorted by recently added</p>
			<div class="flex gap-2">
				<button
					class="rounded-md bg-orange-600 px-6 py-2 text-white"
					onclick={() => {
						uploadToggle = !uploadToggle;
					}}
					>{#if uploadToggle}
						Close
					{:else}
						Upload
					{/if}</button
				>
			</div>
		</div>
	</div>
	<div class="flex h-full w-full flex-col gap-8">
		<div class="flex items-center gap-4">
			<div class="w-1/3">
				<input
					class="w-full rounded border border-white/20 px-4 py-2.5 placeholder:text-white"
					type="text"
					name="searchTerm"
					bind:value={searchTerm}
					placeholder="Search samples..."
				/>
			</div>
			<div class="flex gap-2">
				<button class="rounded-xl border border-white/20 px-4 py-2 text-white/50"> All </button>
				<button class="rounded-xl border border-white/20 px-4 py-2 text-white/50"> Kicks </button>
			</div>
		</div>

		<SampleList samples={data.samples} />
	</div>
</div>
