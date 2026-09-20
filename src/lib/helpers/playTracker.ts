import { invalidate } from "$app/navigation";

export function createPlayTracker(report: (sampleId: string) => void, qualifyAferMs = 2000) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let activeId: string | null = null;

    function cancel() {
        if (timer) clearTimeout(timer);
        timer = null;
        activeId = null;
    }

    function complete() {
        if (!activeId) return;
        const id = activeId;
        cancel();
        report(id)
    }

    return {
        start(sampleId: string) {
            cancel();
            activeId = sampleId;
            timer = setTimeout(complete, qualifyAferMs);
        },
        finish: complete,
        cancel
    }
}

export async function reportPlay(sampleId: string) {
    try {
        const res = await fetch(`/api/samples/${sampleId}/played`, {
            method: 'POST', keepalive: true
        });

        if (res.ok) await invalidate('app:recent-samples');
    } catch {
        // A failed report must never interrupt playback
    }
}