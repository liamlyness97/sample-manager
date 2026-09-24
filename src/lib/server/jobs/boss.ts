import { PgBoss, type Queue, } from 'pg-boss';
import { POSTGRES_URL } from '$env/static/private';

declare global {
    var __sampleManagerBoss: Promise<PgBoss> | undefined;
}

export const ANALYSIS_QUEUE = 'sample-analysis';
export type AnalysisJobData = { sampleId: string };

const queueOptions: Omit<Queue, 'name'> = {
    retryLimit: 5,
    retryDelay: 10,
    retryBackoff: true,
    expireInSeconds: 240,
    notify: true
}

async function createBoss() {
    const boss = new PgBoss(POSTGRES_URL);

    boss.on('error', console.error)

    await boss.start()

    await boss.createQueue(ANALYSIS_QUEUE, queueOptions);

    await boss.updateQueue(ANALYSIS_QUEUE, queueOptions);

    return boss
}

export function getBoss() {
    if (!globalThis.__sampleManagerBoss) {
        globalThis.__sampleManagerBoss = createBoss().catch((err) => {
            globalThis.__sampleManagerBoss = undefined;
            throw err;
        })
    }
    return globalThis.__sampleManagerBoss
}