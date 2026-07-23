let audioContext: AudioContext | null = null;

export function playPageTurnSound(): void {
  if (typeof window === "undefined" || !("AudioContext" in window || "webkitAudioContext" in window)) return;
  const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return;
  audioContext ??= new Context();
  const context = audioContext;
  if (context.state === "suspended") void context.resume();

  const duration = 0.34;
  const sampleCount = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / sampleCount;
    const envelope = Math.sin(Math.PI * progress) * Math.pow(1 - progress, 0.42);
    const texture = Math.random() * 2 - 1;
    const flutter = 0.58 + Math.sin(progress * Math.PI * 18) * 0.21;
    data[index] = texture * envelope * flutter * 0.34;
  }

  const source = context.createBufferSource();
  const highPass = context.createBiquadFilter();
  const lowPass = context.createBiquadFilter();
  const gain = context.createGain();
  highPass.type = "highpass";
  highPass.frequency.setValueAtTime(480, context.currentTime);
  highPass.frequency.exponentialRampToValueAtTime(1100, context.currentTime + duration);
  lowPass.type = "lowpass";
  lowPass.frequency.setValueAtTime(5400, context.currentTime);
  lowPass.frequency.exponentialRampToValueAtTime(2100, context.currentTime + duration);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  source.buffer = buffer;
  source.connect(highPass).connect(lowPass).connect(gain).connect(context.destination);
  source.start();
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
