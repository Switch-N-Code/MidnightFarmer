const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function noise(duration, freq, q, gain, startDelay = 0) {
  const c = getCtx();
  const bufSize = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;

  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime + startDelay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startDelay + duration);

  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(c.currentTime + startDelay);
  src.stop(c.currentTime + startDelay + duration);
}

function osc(freq, duration, type, gainVal, startDelay = 0) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gainVal, c.currentTime + startDelay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startDelay + duration);
  o.connect(g);
  g.connect(c.destination);
  o.start(c.currentTime + startDelay);
  o.stop(c.currentTime + startDelay + duration);
}

window.playPlant = function () {
  noise(0.18, 600, 1.5, 0.22);
  noise(0.1,  1400, 0.6, 0.1);
  osc(440, 0.1, "sine", 0.1, 0.0);
  osc(660, 0.1, "sine", 0.07, 0.08);
};

window.playStrike = function () {
  const c = getCtx();
  const bufSize = Math.floor(c.sampleRate * 0.28);
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(200, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(55, c.currentTime + 0.25);

  const g = c.createGain();
  g.gain.setValueAtTime(0.55, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.28);

  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start();
  src.stop(c.currentTime + 0.28);

  osc(110, 0.2, "triangle", 0.18, 0.0);
};

window.playCaught = function () {
  [523, 415, 330, 262].forEach((f, i) => osc(f, 0.2, "sawtooth", 0.14, i * 0.13));
  noise(0.6, 280, 0.35, 0.28, 0.0);
};

window.playPerfect = function () {
  [523, 659, 784, 1047].forEach((f, i) => osc(f, 0.22, "sine", 0.18, i * 0.1));
  [1047, 1319, 1568, 2093].forEach((f, i) => osc(f, 0.25, "sine", 0.14, 0.5 + i * 0.09));
};

window.playTimeUp = function () {
  osc(440, 0.15, "sine", 0.18, 0.0);
  osc(370, 0.2,  "sine", 0.16, 0.16);
  osc(294, 0.3,  "sine", 0.14, 0.34);
};
