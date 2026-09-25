import { ANALYSIS_QUEUE, getBoss } from "./boss";
import { analyseSample } from './analyseSample';

declare global {
    var __sampleManagerAnalysisWorker: Promise<string> | undefined
}

async function registerWorker() {
    const boss = await getBoss();

    return boss.work(
        ANALYSIS_QUEUE,
        { includeMetadata: true, localConcurrency: 3 },
        analyseSample
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