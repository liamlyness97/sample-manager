import { createPlayTracker, reportPlay } from '$lib/helpers/playTracker';

export type Sample = {
	id: string;
	sampleName: string;
	sampleUrl: string;
	peaks: string | null;
	sampleBpm?: number | null;
	duration?: number | null;
	sampleRate?: number | null;
	estimatedKey?: string | null;
	typeId?: string | null;
	status: 'pending' | 'processing' | 'failed' | 'complete'
};

type PlayerState = {
	activeSample: Sample | null;
	isPlaying: boolean;
	progress: number;
	currentTime: number;
	duration: number;
	volume: number;
};

const state = $state<PlayerState>({
	activeSample: null,
	isPlaying: false,
	progress: 0,
	currentTime: 0,
	duration: 0,
	volume: 1
});

let queue = $state<Sample[]>([]);

let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let sourceNode: AudioBufferSourceNode | null = null;
let audioBuffer: AudioBuffer | null = null;
let startTime = 0;
let startOffset = 0;
let rafId = 0;
// Bumped on every load() so a slow fetch/decode that resolves after the
// user has already picked another sample can bail out instead of playing.
let loadToken = 0;

// True once the current play-through has been reported, so pausing and
// resuming (or seeking) can never count the same play twice. Reset whenever
// playback starts from the beginning.
let playCounted = false;
const tracker = createPlayTracker((id) => {
	playCounted = true;
	reportPlay(id);
}, 1000);

function getAudioCtx() {
	if (!audioCtx) {
		audioCtx = new AudioContext();
		gainNode = audioCtx.createGain();
		gainNode.gain.value = state.volume;
		gainNode.connect(audioCtx.destination);
	}
	return audioCtx;
}

function teardownSource() {
	// Any pause, seek, or sample change drops a play that has not qualified yet.
	tracker.cancel();
	if (sourceNode) {
		sourceNode.onended = null;
		try {
			sourceNode.stop();
		} catch (e) {
			console.error(e);
		}
		sourceNode.disconnect();
		sourceNode = null;
	}
	cancelAnimationFrame(rafId);
}

function tick() {
	if (!audioBuffer || !state.isPlaying) return;
	const elapsed = getAudioCtx().currentTime - startTime + startOffset;
	if (elapsed >= audioBuffer.duration) {
		state.currentTime = audioBuffer.duration;
		state.progress = 1;
		return;
	}
	state.currentTime = elapsed;
	state.progress = elapsed / audioBuffer.duration;
	rafId = requestAnimationFrame(tick);
}

function startPlayback(offset: number) {
	const ctx = getAudioCtx();
	teardownSource();

	sourceNode = ctx.createBufferSource();
	sourceNode.buffer = audioBuffer;
	sourceNode.connect(gainNode!);
	sourceNode.start(0, offset);

	startTime = ctx.currentTime;
	startOffset = offset;
	state.isPlaying = true;

	// Starting from the beginning is a fresh play-through
	if (offset === 0) playCounted = false;
	const sampleId = state.activeSample?.id;
	if (sampleId && !playCounted) tracker.start(sampleId);

	sourceNode.onended = () => {
		// Only reached on natural end: teardownSource() nulls this handler first.
		// Short samples end before the qualify timer fires, so report them here.
		tracker.finish();
		state.isPlaying = false;
		state.progress = 0;
		state.currentTime = 0;
		startOffset = 0;
	};

	tick();
}

/** Keep the store aware of the list the user is browsing so prev/next can walk it. */
function setQueue(samples: Sample[]) {
	queue = samples;
}

/**
 * Load a sample into the playback bar and start playing it. Clicking the sample
 * that is already active toggles play/pause instead of reloading.
 */
async function load(sample: Sample) {
	if (state.activeSample?.id === sample.id) {
		togglePlay();
		return;
	}

	teardownSource();
	state.isPlaying = false;
	state.activeSample = sample;
	state.progress = 0;
	state.currentTime = 0;
	state.duration = 0;
	startOffset = 0;
	audioBuffer = null;

	const token = ++loadToken;
	const ctx = getAudioCtx();
	if (ctx.state === 'suspended') await ctx.resume();

	const res = await fetch(`/${sample.sampleUrl}`);
	const decoded = await ctx.decodeAudioData(await res.arrayBuffer());
	if (token !== loadToken) return; // a newer load() has taken over

	audioBuffer = decoded;
	state.duration = decoded.duration;
	startPlayback(0);
}

function togglePlay() {
	if (!audioBuffer || !state.activeSample) return;

	if (state.isPlaying) {
		const elapsed = getAudioCtx().currentTime - startTime + startOffset;
		teardownSource();
		startOffset = Math.min(elapsed, audioBuffer.duration);
		state.isPlaying = false;
	} else {
		startPlayback(startOffset >= audioBuffer.duration ? 0 : startOffset);
	}
}

function seek(progress: number) {
	if (!audioBuffer) return;
	const clamped = Math.min(Math.max(progress, 0), 1);
	const offset = clamped * audioBuffer.duration;

	state.progress = clamped;
	state.currentTime = offset;

	if (state.isPlaying) {
		startPlayback(offset);
	} else {
		startOffset = offset;
	}
}

function setVolume(volume: number) {
	state.volume = Math.min(Math.max(volume, 0), 1);
	if (gainNode) gainNode.gain.value = state.volume;
}

function step(delta: number) {
	if (!state.activeSample || queue.length === 0) return;
	const index = queue.findIndex((s) => s.id === state.activeSample!.id);
	if (index === -1) return;
	const next = queue[index + delta];
	if (next) load(next);
}

export const player = {
	get state() {
		return state;
	},
	get queue() {
		return queue;
	},
	setQueue,
	load,
	togglePlay,
	seek,
	setVolume,
	next: () => step(1),
	prev: () => step(-1)
};