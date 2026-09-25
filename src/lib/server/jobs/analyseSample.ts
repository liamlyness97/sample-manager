import type { JobWithMetadata } from "pg-boss";
import type { AnalysisJobData } from "./boss";
import { db } from '$lib/server/db';
import { samples } from '$lib/server/db/schema';
import { eq } from "drizzle-orm";
import { posix } from 'node:path'
import { env } from "$env/dynamic/private";


export async function analyseSample([job]: JobWithMetadata<AnalysisJobData>[]) {
    const [sample] = await db.select().from(samples).where(eq(samples.id, job.data.sampleId));

    if (!sample) return console.warn(`Sample ${job.data.sampleId} not found`);

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
}