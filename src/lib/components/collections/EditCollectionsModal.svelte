<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { fade, fly } from 'svelte/transition';

	type CollectionsOption = { id: string; name: string };
	type SampleWithCollections = {
		id: string;
		sampleName: string;
		collectionSamples?: { collectionId: string; collection: CollectionsOption }[];
	};

	let {
		open = $bindable(false),
		action = '?/editSampleCollection',
		onsuccess,
		samples,
		collections
	}: {
		open?: boolean;
		action?: string;
		onsuccess?: () => void;
		samples: SampleWithCollections[];
		collections: CollectionsOption[];
	} = $props();

	let dialog = $state<HTMLDivElement>();

	let error = $state<string | null>(null);
	let submitting = $state(false);

	// Per-sample picker state, keyed by sample id — mirrors UploadModal's collection picker.
	let collectionInputBySample = $state<Record<string, string>>({});
	let selectedCollectionsBySample = $state<Record<string, CollectionsOption[]>>({});

	function filteredCollections(sampleId: string) {
		const input = collectionInputBySample[sampleId] ?? '';
		const selectedIds = new Set((selectedCollectionsBySample[sampleId] ?? []).map((c) => c.id));
		return collections.filter(
			(c) => !selectedIds.has(c.id) && c.name.toLowerCase().includes(input.trim().toLowerCase())
		);
	}

	function addCollection(sampleId: string, collection: CollectionsOption) {
		const current = selectedCollectionsBySample[sampleId] ?? [];
		selectedCollectionsBySample[sampleId] = [...current, collection];
		collectionInputBySample[sampleId] = '';
	}

	function removeCollection(sampleId: string, collectionId: string) {
		selectedCollectionsBySample[sampleId] = (selectedCollectionsBySample[sampleId] ?? []).filter(
			(c) => c.id !== collectionId
		);
	}

	function close() {
		open = false;
	}

	// Reset/seed the picker from each sample's current collections whenever the modal opens.
	$effect(() => {
		if (!open) return;
		const inputs: Record<string, string> = {};
		const selected: Record<string, CollectionsOption[]> = {};
		for (const sample of samples) {
			inputs[sample.id] = '';
			selected[sample.id] = (sample.collectionSamples ?? []).map((cs) => cs.collection);
		}
		collectionInputBySample = inputs;
		selectedCollectionsBySample = selected;
	});

	const handleSubmitting: SubmitFunction = () => {
		submitting = true;
		error = null;

		return async ({ result, update }) => {
			submitting = false;

			if (result.type === 'success') {
				await update();
				close();
				onsuccess?.();
			} else if (result.type === 'failure') {
				error = (result.data?.error as string) ?? 'Something went wrong editing sample collection';
			} else {
				await update();
			}
		};
	};

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
</script>

{#if open}
	<div
		transition:fade={{ duration: 100 }}
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
	>
		<button
			type="button"
			tabindex="-1"
			class="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
			aria-label="Close upload dialog"
			onclick={close}
		></button>

		<div
			in:fly={{ duration: 300, y: 50 }}
			out:fly={{ duration: 200, y: 50 }}
			bind:this={dialog}
			class="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-blue-200 text-white shadow-2xl outline-none"
			role="dialog"
			aria-modal="true"
			aria-labelledby="upload-modal-title"
			tabindex="-1"
			onkeydown={onKeydown}
		>
			<div class="flex items-center justify-between px-6 py-5">
				<h2 id="upload-modal-title" class="text-lg font-light">Edit Samples Collections</h2>
				<button
					type="button"
					class="cursor-pointer text-white/50 transition-colors hover:text-white"
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
				method="POST"
				{action}
				use:enhance={handleSubmitting}
				class="flex min-h-0 flex-col gap-5 overflow-y-auto border-t border-white/10 px-6 py-6"
			>
				{#each samples as sample (sample.id)}
					<label class="flex flex-col gap-1.5 text-sm">
						<input type="hidden" name="sampleIds" value={sample.id} />
						<span class="text-white/60">{sample.sampleName}</span>
						<div class="relative">
							<input
								class="w-full rounded-lg border border-white/15 bg-blue-300 px-3 py-2 text-white outline-none focus:border-white/40"
								type="text"
								placeholder="Assign sample to collections"
								bind:value={collectionInputBySample[sample.id]}
							/>
							{#if collectionInputBySample[sample.id]}
								<div
									class="absolute top-full left-0 z-20 flex w-full flex-col items-start rounded-b-xl bg-blue-300 py-2"
								>
									{#each filteredCollections(sample.id) as collection (collection.id)}
										<button
											type="button"
											onclick={() => addCollection(sample.id, collection)}
											class="w-full cursor-pointer px-4 py-2 text-left duration-200 hover:bg-blue-100"
										>
											{collection.name}
										</button>
									{/each}
								</div>
							{/if}
						</div>
						{#if (selectedCollectionsBySample[sample.id] ?? []).length > 0}
							<div class="flex flex-wrap gap-2 pt-2">
								{#each selectedCollectionsBySample[sample.id] as collection (collection.id)}
									<button
										type="button"
										class="cursor-pointer rounded-full bg-orange-600 px-4 py-2 text-xs text-white duration-200 hover:opacity-80"
										onclick={() => removeCollection(sample.id, collection.id)}
									>
										{collection.name}
										<span> X </span>
									</button>
									<input type="hidden" name={`collectionIds_${sample.id}`} value={collection.id} />
								{/each}
							</div>
						{/if}
					</label>
				{/each}
				{#if error}
					<p class="text-red-500">{error}</p>
				{/if}
				<div class="flex items-center justify-end gap-3 pt-1">
					<button
						type="button"
						class="cursor-pointer text-sm text-white/60 transition-colors hover:text-white"
						onclick={close}
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={submitting}
						class="cursor-pointer rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-500 disabled:opacity-50"
					>
						Save
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
