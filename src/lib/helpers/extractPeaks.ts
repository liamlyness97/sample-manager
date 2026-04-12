export function extractPeaks(buffer: AudioBuffer, numBars: number): number[] {
    // Get raw PCM amplitude samples for the left channel
    // Values range from -1.0 to 1.0
    const channelData = buffer.getChannelData(0);

    const blockSize = Math.floor(channelData.length / numBars);

    const peaks: number[] = [];

    for (let i = 0; i < numBars; i++) {
        let max = 0;

        for (let j = 0; j < blockSize; j++) {
            const val = Math.abs(channelData[i * blockSize + j]);
            if (val > max) max = val;
        }
        peaks.push(max);
    }


    // Normalise so the loudest peak is always 1.0,
    // making the waveform fill the available height regardless of volume
    const globalMax = Math.max(...peaks) || 1;
    return peaks.map(p => p / globalMax);
}