import type { JobWithMetadata } from 'pg-boss';
import { ANALYSIS_QUEUE, getBoss, type AnalysisJobData } from "./boss";

declare global {
    var __sampleManagerAnalysisWorker: Promise<string> | undefined
}

async function registerWorker() {
    const boss = await getBoss();

    return boss.work(
        ANALYSIS_QUEUE,
        { includeMetadata: true, localConcurrency: 3 },
        async ([job]: JobWithMetadata<AnalysisJobData>[]) => {
            console.log(
                `[analysis] job ${job.id} (attempt ${job.retryCount + 1}) sample ${job.data.sampleId}`
            )
        }
    );
}

export async function startAnalysisWorker() {
    if (!globalThis.__sampleManagerAnalysisWorker) {
        globalThis.__sampleManagerAnalysisWorker = registerWorker().catch((err) => {
            globalThis.__sampleManagerAnalysisWorker = undefined;
            throw err;
        });
    }
    return globalThis.__sampleManagerAnalysisWorker
    
}