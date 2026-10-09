// Ambient soundscape: fully synthesized with WebAudio (no audio files).
// Water = looped brown noise through a lowpass; air = soft detuned pads.
export function createAmbience() {
  let ctx = null, master = null, running = false;
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    // brown noise buffer (8s loop)
    const len = ctx.sampleRate * 8;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.4;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.8;
    const gWater = ctx.createGain(); gWater.gain.value = 0.5;
    const gHiss = ctx.createGain(); gHiss.gain.value = 0.05;
    noise.connect(lp).connect(gWater).connect(master);
    noise.connect(bp).connect(gHiss).connect(master);
    // slow swell LFO on the water
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.09;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.16;
    lfo.connect(lfoG).connect(gWater.gain);
    // soft pads: root + fifth, barely there
    for (const [f, g] of [[110, 0.018], [164.81, 0.014], [220, 0.009]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = g;
      o.connect(og).connect(master); o.start();
    }
    noise.start(); lfo.start();
  }
  return {
    toggle() {
      if (!ctx) build();
      if (ctx.state === 'suspended') ctx.resume();
      running = !running;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.linearRampToValueAtTime(running ? 0.9 : 0.0, t + 1.2);
      return running;
    },
    isRunning: () => running,
  };
}
