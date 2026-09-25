import type { JobWithMetadata } from "pg-boss";
import type { AnalysisJobData } from "./boss";
import { db } from '$lib/server/db';
import { samples } from '$lib/server/db/schema';
import { eq } from "drizzle-orm";
import { posix } from 'node:path'
import { env } from "$env/dynamic/private";


export async function analyseSample([job]: JobWithMetadata<AnalysisJobData>[]) {
    // Checks if the job count has reached its retry limit to use in the clean up
    const isFinalAttempt = job.retryCount >= job.retryLimit;

    const [sample] = await db.select().from(samples).where(eq(samples.id, job.data.sampleId));

    if (!sample) return console.warn(`Sample ${job.data.sampleId} not found`);

    try {
        // Status updated ahead of analysis
        await db.update(samples).set({
            status: 'processing'
        }).where(eq(samples.id, job.data.sampleId))

        const filename= posix.basename(sample.sampleUrl)

        const librosa = await fetch(`${env.FASTAPI_URL}/files/analyse/${sample.userId}/${filename}`)

        if (!librosa.ok) {
            const body = await librosa.text();
            throw new Error(
                `FastAPI analysis failed for sample ${sample.id}: ${librosa.status} ${body.slice(0, 200)}`
            )
        }

        const librosaRes = await librosa.json()

        // Completed analysis
        await db.update(samples).set({
            sampleBpm: librosaRes.bpm,
            sampleRate: librosaRes.sampleRate,
            duration: librosaRes.duration,
            estimatedKey: librosaRes.key,
            harmonicRatio: librosaRes.harmonicRatio,
            tonality: librosaRes.tonality,
            status: 'complete',
            analysisVersion: librosaRes.analysisVersion,
            analysedAt: new Date(),
            analysisError: null
        }).where(eq(samples.id, job.data.sampleId))
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        try {
            await db.update(samples).set({
                status: isFinalAttempt ? 'failed' : 'pending',
                analysisError: message
            }).where(eq(samples.id, sample.id));
        } catch (updateErr) {
            console.error(`Failed to record analysis error for sample ${sample.id}`, updateErr);
        }

        throw err
    }

    
}