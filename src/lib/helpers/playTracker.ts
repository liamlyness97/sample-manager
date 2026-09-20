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

export function reportPlay(sampleId: string) {
    fetch(`/api/samples/${sampleId}/played`, {method: 'POST', keepalive: true}).catch(() => {});
}