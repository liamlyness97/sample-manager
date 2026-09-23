import { unlink } from "fs/promises";
import { db } from "$lib/server/db";
import { samples } from "$lib/server/db/schema";
import { collectionSamples } from "$lib/server/db/schema/collectionSamples";
import { and, eq, inArray } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { collections } from "$lib/server/db/schema/collections";

export const load: PageServerLoad = async ({params, locals}) => {
    if (!locals.user) error(401, 'Not signed in');

	const [collection] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, params.collectionId))
		.limit(1);

	if (!collection || collection.userId !== locals.user!.id) error(404, 'Collection not found');

	const membership = await db
		.select({ sampleId: collectionSamples.sampleId })
		.from(collectionSamples)
		.where(eq(collectionSamples.collectionId, collection.id));

	const sampleIds = membership.map((m) => m.sampleId);

	const collectionSampleList = sampleIds.length === 0
		? []
		: await db.query.samples.findMany({
			where: and(eq(samples.userId, locals.user!.id), inArray(samples.id, sampleIds)),
			with: {
					collectionSamples: {
							with: { collection: true }
					}
			},
		});

	return { collection, samples: collectionSampleList };
}

export const actions = {
	editSampleCollection: async ({ request, locals }) => {
		const data = await request.formData();

		const sampleIds = [
			...new Set(data.getAll('sampleIds').filter((v): v is string => typeof v === 'string'))
		];

		if (sampleIds.length === 0) {
			return fail(400, { error: 'No samples selected' });
		}

		const ownedSamples = await db
			.select({ id: samples.id })
			.from(samples)
			.where(and(inArray(samples.id, sampleIds), eq(samples.userId, locals.user!.id)));
		const ownedSampleIds = ownedSamples.map((s) => s.id);

		if (ownedSampleIds.length === 0) {
			return fail(403, { error: 'Not authorized to edit these samples' });
		}

		for (const sampleId of ownedSampleIds) {
			const requestedCollectionIds = [
				...new Set(
					data.getAll(`collectionIds_${sampleId}`).filter((v): v is string => typeof v === 'string')
				)
			];

			const validCollectionIds = requestedCollectionIds.length > 0
				? (
					await db
						.select({ id: collections.id })
						.from(collections)
						.where(and(inArray(collections.id, requestedCollectionIds), eq(collections.userId, locals.user!.id)))
				).map((r) => r.id)
				: [];

			await db.delete(collectionSamples).where(eq(collectionSamples.sampleId, sampleId));

			if (validCollectionIds.length > 0) {
				await db.insert(collectionSamples).values(
					validCollectionIds.map((collectionId) => ({ collectionId, sampleId }))
				).onConflictDoNothing();
			}
		}

		return { success: true };
	},
	renameSamples: async ({ request, locals }) => {
		const data = await request.formData();

		const sampleIds = [
			...new Set(data.getAll('sampleIds').filter((v): v is string => typeof v === 'string'))
		];

		if (sampleIds.length === 0) {
			return fail(400, { error: 'No samples selected' });
		}

		const ownedSamples = await db
			.select({ id: samples.id })
			.from(samples)
			.where(and(inArray(samples.id, sampleIds), eq(samples.userId, locals.user!.id)));
		const ownedSampleIds = ownedSamples.map((s) => s.id);

		if (ownedSampleIds.length === 0) {
			return fail(403, { error: 'Not authorized to rename these samples' });
		}

		for (const sampleId of ownedSampleIds) {
			const newName = (data.get(`sampleName_${sampleId}`) as string | null)?.trim();
			if (!newName) continue;

			await db.update(samples).set({ sampleName: newName }).where(eq(samples.id, sampleId));
		}

		return { success: true };
	},
	deleteSamples: async ({ request, locals }) => {
		const data = await request.formData();

		const sampleIds = [
			...new Set(data.getAll('sampleIds').filter((v): v is string => typeof v === 'string'))
		];

		if (sampleIds.length === 0) {
			return fail(400, { error: 'No samples selected' });
		}

		const ownedSamples = await db
			.select({ id: samples.id, sampleUrl: samples.sampleUrl })
			.from(samples)
			.where(and(inArray(samples.id, sampleIds), eq(samples.userId, locals.user!.id)));

		if (ownedSamples.length === 0) {
			return fail(403, { error: 'Not authorized to delete these samples' });
		}

		await db.delete(samples).where(inArray(samples.id, ownedSamples.map((s) => s.id)));

		await Promise.all(ownedSamples.map((s) => unlink(s.sampleUrl).catch(() => {})));

		return { success: true };
	}
} satisfies Actions