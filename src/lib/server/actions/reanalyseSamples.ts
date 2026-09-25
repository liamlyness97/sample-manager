import { fail, type Action } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { samples } from '$lib/server/db/schema';
import { enqueueAnalysis } from '$lib/server/jobs';

// Shared by every route that renders SampleList, so the toolbar's
// ?/reanalyseSamples works wherever the list is shown.
export const reanalyseSamples: Action = async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not signed in' });

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
        .where(and(inArray(samples.id, sampleIds), eq(samples.userId, locals.user.id)));
    const ownedSampleIds = ownedSamples.map((s) => s.id);

    if (ownedSampleIds.length === 0) {
        return fail(403, { error: 'Not authorised to re-analyse these samples' });
    }

    // Rows go back to pending and their jobs are queued together:
    // if anything fails, nothing is marked pending without a job behind it.
    await db.transaction(async (tx) => {
        await tx
            .update(samples)
            .set({ status: 'pending', analysisError: null })
            .where(inArray(samples.id, ownedSampleIds));

        for (const sampleId of ownedSampleIds) {
            await enqueueAnalysis(sampleId, tx);
        }
    });

    return { success: true };
};
