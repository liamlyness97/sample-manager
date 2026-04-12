type PlayerState = {
    activeSampleId: string | null;
    isPlaying: boolean;
    progress: number;
    currentTime: number;
    duration: number;
}

let state = $state<PlayerState>({
    activeSampleId: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    duration: 0
});

let audioCtx: AudioContext | null = null;
let sourceNode: AudioBufferSourceNode | null = null;
let audioBuffer: AudioBuffer | null = null;
let startTime = 0;
let startOffset = 0;
let rafId: number;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx
}

function stop() {
    if (sourceNode) {
        sourceNode.onended = null;
        try { sourceNode.stop(); } catch (e) {
            console.error(e)
        }
        sourceNode = null;
    }
    cancelAnimationFrame(rafId);
    state.isPlaying = false;
}

function tick() {
    if (!audioBuffer || !state.isPlaying) return;
    const elapsed = getAudioCtx().currentTime - startTime + startOffset;
    state.currentTime = elapsed;
    state.progress = Math.min(elapsed / audioBuffer.duration, 1);
    rafId = requestAnimationFrame(tick);
}

async function play(sampleId: string, url: string) {
    stop();

    // If tapping the already active sample, just stop
    if (state.activeSampleId === sampleId && state.progress > 0) {
        state.activeSampleId = null;
        startOffset = 0;
        state.progress = 0;
        return
    }

    state.activeSampleId = sampleId;
    startOffset = 0;

    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const res = await fetch(url);
    audioBuffer = await ctx.decodeAudioData(await res.arrayBuffer());
    state.duration = audioBuffer.duration;

    sourceNode = ctx.createBufferSource();
    sourceNode.buffer = audioBuffer
    sourceNode.connect(ctx.destination);
    sourceNode.start(0, startOffset);
    startTime = ctx.currentTime;
    state.isPlaying = true;

    sourceNode.onended = () => {
        if (state.isPlaying) {
            state.isPlaying = false;
            state.progress = 0;
            state.currentTime = 0;
            state.activeSampleId = null;
        }
    };

    tick();
}

function seek(progress: number) {
    if (!audioBuffer) return;
    startOffset = progress * audioBuffer.duration;
    if (state.isPlaying) {
        stop();
        sourceNode = getAudioCtx().createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(getAudioCtx().destination);
        sourceNode.start(0, startOffset);
        startTime = getAudioCtx().currentTime;
        state.isPlaying = true;
        sourceNode.onended = () => {
            state.isPlaying = false;
            state.progress = 0;
            state.activeSampleId = null;
        };
        tick();
    } else {
        state.progress = progress;
    }
}

export const player = {
    get state() { return state; },
    play,
    stop,
    seek
};