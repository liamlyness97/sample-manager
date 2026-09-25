export async function stopJobs() {
    const cached = globalThis.__sampleManagerBoss;

    // Nothing was started, so there's nothing to stop
    if (!cached) return;

    globalThis.__sampleManagerBoss = undefined;
    globalThis.__sampleManagerAnalysisWorker = undefined;

    const boss = await cached.catch(() => undefined);
    if (!boss) return;

    await boss.stop({ graceful: true });
}
