import type { JobWithMetadata } from 'pg-boss';
import { ANALYSIS_QUEUE, getBoss, type AnalysisJobData } from "./boss";

export async function startAnalysisWorker() {
    const boss = await getBoss();

    return boss.work(
        ANALYSIS_QUEUE,
        { includeMetadata: true, localConcurrency: 3 },
        async ([job]: JobWithMetadata<AnalysisJobData>[]) => {
            console.log(
                `[analysis] job ${job.id} (attempt ${job.retryCount + 1}) sample ${job.data.sampleId}`
            )
        }
    )
}