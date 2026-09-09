export function drawWaveform(canvas: HTMLCanvasElement, peaks: number[], progress = 0): void {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Downsample peaks to fit the available width
    // Aim for ~2px per bar minimum, so cap at w / 3
    const maxBars = Math.floor(w / 3);
    const step = peaks.length > maxBars ? peaks.length / maxBars : 1;
    const displayPeaks: number[] = [];

    for (let i = 0; i < peaks.length; i += step) {
        const slice = peaks.slice(Math.floor(i), Math.floor(i + step));
        displayPeaks.push(Math.max(...slice));
    }

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const colourPlayed = '#fbab29';
    const colourUnplayed = isDark ? '#1d324f' : '#1d324f';

    const barWidth = Math.max(2, (w / displayPeaks.length) - 1);
    const gap = Math.min(1.5, barWidth * 0.3);
    const midY = h / 2;
    const playedX = progress * w;

    ctx.clearRect(0, 0, w, h);

    displayPeaks.forEach((peak, i) => {
        const x = (i / displayPeaks.length) * w;
        const barH = Math.max(2, peak * midY * 0.88);
        ctx.fillStyle = x <= playedX ? colourPlayed : colourUnplayed;
        ctx.beginPath();
        ctx.roundRect(x, midY - barH, Math.max(1, barWidth - gap), barH * 2, 1.5);
        ctx.fill();
    });
}