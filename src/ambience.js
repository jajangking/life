/** Quiet, locally generated ambience. No network audio or autoplay. */
export function createAmbience() {
  let context, master, timer, windSource;
  let enabled = false;
  let period = 'sore';
  function chirp() {
    if (!enabled || !context || document.hidden) return;
    const t = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    const base = period === 'malam' ? 2900 : 1900 + Math.random() * 1100;
    oscillator.frequency.setValueAtTime(base, t);
    oscillator.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.08);
    oscillator.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.19);
    envelope.gain.setValueAtTime(0, t);
    envelope.gain.linearRampToValueAtTime(0.04, t + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    oscillator.connect(envelope); envelope.connect(master);
    oscillator.start(t); oscillator.stop(t + 0.25);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }
  async function toggle() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Browser ini belum mendukung audio kota.');
      context = new AudioContext();
      master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
      const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) { last = (last + (Math.random() * 2 - 1) * 0.018) / 1.018; data[i] = last * 0.7; }
      windSource = context.createBufferSource(); windSource.buffer = buffer; windSource.loop = true;
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 650;
      windSource.connect(filter); filter.connect(master); windSource.start();
    }
    enabled = !enabled;
    await context.resume();
    master.gain.setTargetAtTime(enabled ? 0.5 : 0, context.currentTime, 0.4);
    clearInterval(timer);
    if (enabled) { chirp(); timer = setInterval(chirp, 2400); }
    return enabled;
  }
  return { toggle, setPeriod(value) { period = value; }, get enabled() { return enabled; }, dispose() { clearInterval(timer); windSource?.stop(); context?.close(); } };
}
