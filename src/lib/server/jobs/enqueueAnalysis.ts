import { fromDrizzle } from "pg-boss";
import type { Transaction } from "$lib/server/db";
import { ANALYSIS_QUEUE, getBoss, type AnalysisJobData } from "./boss";
import { sql } from "drizzle-orm";

export async function enqueueAnalysis(sampleId: string, tx?: Transaction) {
    const boss = await getBoss();

    const jobId = await boss.send(ANALYSIS_QUEUE, { sampleId } satisfies AnalysisJobData, tx ? { db: fromDrizzle(tx, sql) } : {})

    return jobId
}