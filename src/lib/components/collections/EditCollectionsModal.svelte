<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		open = $bindable(false),
		action = '?/editSampleCollection',
		onsuccess
	}: {
		open?: boolean;
		action?: string;
		onsuccess?: () => void;
	} = $props();

	let dialog = $state<HTMLDivElement>();

	let error = $state<string | null>(null);
	let submitting = $state(false);

	function close() {
		open = false;
	}

	const handleSubmitting: SubmitFunction = () => {
		submitting = true;
		error = null;

		return async ({ result, update }) => {
			submitting = false;

			if (result.type === 'success') {
				await update();
				close();
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
				action="?/create"
				use:enhance={handleSubmitting}
				class="flex min-h-0 flex-col gap-5 overflow-y-auto border-t border-white/10 px-6 py-6"
			>
				<label class="flex flex-col gap-1.5 text-sm">
					<span class="text-white/60">Collection Name</span>
					<input
						class="rounded-lg border border-white/15 bg-blue-300 px-3 py-2 text-white outline-none focus:border-white/40"
						type="text"
						name="name"
						id="name"
						placeholder="Enter a collection name"
					/>
				</label>
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
						Create
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
