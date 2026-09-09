<script lang="ts">
	import { tick } from 'svelte';
	import FileDropZone from './FileDropZone.svelte';
	import Waveform from '$lib/components/ui/Waveform.svelte';
	import { extractPeaks } from '$lib/helpers/extractPeaks';

	type SampleTypeOption = { id: string; name: string };

	let {
		open = $bindable(false),
		types,
		action = '?/upload',
		onsuccess
	}: {
		open?: boolean;
		types: SampleTypeOption[];
		action?: string;
		onsuccess?: () => void;
	} = $props();

	let file = $state<File | null>(null);
	let fileError = $state('');
	let reading = $state(false);
	let uploading = $state(false);
	let uploadError = $state('');
	let sampleTypeId = $state('none');
	let meta = $state<{
		duration: number;
		peaks: number[];
		sizeLabel: string;
		formatLabel: string;
	} | null>(null);

	let dialog = $state<HTMLDivElement>();

	function clearFile() {
		file = null;
		meta = null;
		fileError = '';
		uploadError = '';
	}

	function resetAll() {
		clearFile();
		reading = false;
		uploading = false;
		sampleTypeId = 'none';
	}

	function close() {
		open = false;
	}

	$effect(() => {
		if (!open) return;
		resetAll();
		const previouslyFocused = document.activeElement as HTMLElement | null;
		document.body.style.overflow = 'hidden';
		tick().then(() => dialog?.focus());
		return () => {
			document.body.style.overflow = '';
			previouslyFocused?.focus?.();
		};
	});

	async function selectFile(picked: File) {
		uploadError = '';
		if (!picked.type.startsWith('audio/')) {
			clearFile();
			fileError = "That file isn't audio. Choose a WAV, MP3, or AIFF file.";
			return;
		}

		fileError = '';
		file = picked;
		meta = null;
		reading = true;
		try {
			const audioCtx = new AudioContext();
			const buffer = await audioCtx.decodeAudioData(await picked.arrayBuffer());
			await audioCtx.close();
			meta = {
				duration: buffer.duration,
				peaks: extractPeaks(buffer, 200),
				sizeLabel: formatSize(picked.size),
				formatLabel: formatLabel(picked)
			};
		} catch {
			file = null;
			fileError = 'Couldn’t read that audio file — it may be corrupted or an unsupported format.';
		} finally {
			reading = false;
		}
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!file || !meta || uploading) return;

		uploading = true;
		uploadError = '';
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('peaks', JSON.stringify(meta.peaks));
			formData.append('sampleType', sampleTypeId);

			const res = await fetch(action, { method: 'POST', body: formData });
			if (!res.ok) throw new Error('Upload failed');

			close();
			onsuccess?.();
		} catch {
			uploadError = 'Upload failed. Check your connection and try again.';
		} finally {
			uploading = false;
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
			return;
		}
		if (event.key !== 'Tab' || !dialog) return;

		const focusable = Array.from(
			dialog.querySelectorAll<HTMLElement>(
				'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDuration(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function formatLabel(f: File) {
		const ext = f.name.includes('.') ? f.name.split('.').pop() : '';
		return (ext || f.type.split('/')[1] || 'audio').toUpperCase();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<button
			type="button"
			tabindex="-1"
			class="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
			aria-label="Close upload dialog"
			onclick={close}
		></button>

		<div
			bind:this={dialog}
			class="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-blue-200 text-white shadow-2xl outline-none"
			role="dialog"
			aria-modal="true"
			aria-labelledby="upload-modal-title"
			tabindex="-1"
			onkeydown={onKeydown}
		>
			<div class="flex items-center justify-between px-6 py-5">
				<h2 id="upload-modal-title" class="text-lg font-light">Upload a sample</h2>
				<button
					type="button"
					class="text-white/50 transition-colors hover:text-white"
					aria-label="Close"
					onclick={close}
				>
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"
						/>
					</svg>
				</button>
			</div>

			<form
				class="flex min-h-0 flex-col gap-5 overflow-y-auto border-t border-white/10 px-6 py-6"
				onsubmit={submit}
			>
				{#if file && meta}
					<div class="flex flex-col gap-3 rounded-xl bg-blue-300 p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{file.name}</p>
								<p class="mt-0.5 text-xs text-white/50">
									{meta.sizeLabel} &middot; {formatDuration(meta.duration)} &middot; {meta.formatLabel}
								</p>
							</div>
							<button
								type="button"
								class="shrink-0 text-white/50 transition-colors hover:text-white"
								aria-label="Remove file"
								onclick={clearFile}
							>
								<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"
									/>
								</svg>
							</button>
						</div>
						<div class="h-14 w-full">
							<Waveform peaks={meta.peaks} />
						</div>
					</div>
				{:else}
					<FileDropZone disabled={reading} onfile={selectFile} />
					{#if reading}
						<p class="text-xs text-white/50">Reading audio&hellip;</p>
					{/if}
				{/if}

				{#if fileError}
					<p class="text-sm text-red-400">{fileError}</p>
				{/if}

				<label class="flex flex-col gap-1.5 text-sm">
					<span class="text-white/60">Sample type</span>
					<select
						class="rounded-lg border border-white/15 bg-blue-300 px-3 py-2 text-white outline-none focus:border-white/40"
						bind:value={sampleTypeId}
					>
						<option value="none">No type</option>
						{#each types as type (type.id)}
							<option value={type.id}>{type.name}</option>
						{/each}
					</select>
				</label>

				{#if uploadError}
					<p class="text-sm text-red-400">{uploadError}</p>
				{/if}

				<div class="flex items-center justify-end gap-3 pt-1">
					<button
						type="button"
						class="text-sm text-white/60 transition-colors hover:text-white"
						onclick={close}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-500 disabled:opacity-50"
						disabled={!file || !meta || reading || uploading}
					>
						{uploading ? 'Uploading…' : 'Upload sample'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
