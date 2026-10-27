// Sonidos generados con Web Audio (sin archivos). Se pueden silenciar; la preferencia queda en el navegador.

let ctx = null;

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // Los navegadores arrancan el audio "suspendido" hasta que el usuario toca algo.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Al primer toque/tecla se habilita el audio, así el primer "te toca" ya suena.
if (typeof window !== 'undefined') {
  const habilitar = () => contexto();
  window.addEventListener('pointerdown', habilitar, { once: true });
  window.addEventListener('keydown', habilitar, { once: true });
}

export function sonidoActivo() {
  try {
    return localStorage.getItem('sonido') !== 'no';
  } catch {
    return true;
  }
}

export function setSonidoActivo(si) {
  try {
    localStorage.setItem('sonido', si ? 'si' : 'no');
  } catch { /* sin storage: dura hasta recargar */ }
}

function nota(c, frecuencia, inicio, duracion, volumen = 0.18) {
  const osc = c.createOscillator();
  const gan = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = frecuencia;
  gan.gain.setValueAtTime(0, inicio);
  gan.gain.linearRampToValueAtTime(volumen, inicio + 0.02);
  gan.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);
  osc.connect(gan).connect(c.destination);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.05);
}

// "Ding-dong" corto para avisar que te toca.
export function sonarTurno() {
  if (!sonidoActivo()) return;
  const c = contexto();
  if (!c) return;
  const t = c.currentTime + 0.01;
  nota(c, 784, t, 0.35); // sol
  nota(c, 1047, t + 0.14, 0.5); // do
}

// ===== Efectos de los juegos (todo sintetizado, sin archivos) =====

let ruidoBuf = null;
function ruido(c) {
  if (!ruidoBuf) {
    ruidoBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = ruidoBuf;
  return s;
}

// Ruido filtrado con envolvente: la base de explosiones, agua, dados y barridos.
function soplo(c, { inicio, duracion, volumen, tipo = 'lowpass', desde, hasta, q = 1 }) {
  const s = ruido(c);
  const f = c.createBiquadFilter();
  f.type = tipo;
  f.Q.value = q;
  f.frequency.setValueAtTime(desde, inicio);
  f.frequency.exponentialRampToValueAtTime(hasta, inicio + duracion);
  const g = c.createGain();
  g.gain.setValueAtTime(0, inicio);
  g.gain.linearRampToValueAtTime(volumen, inicio + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);
  s.connect(f).connect(g).connect(c.destination);
  s.start(inicio, Math.random() * 0.4);
  s.stop(inicio + duracion + 0.05);
}

function golpeGrave(c, inicio, desde, hasta, duracion, volumen) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(desde, inicio);
  o.frequency.exponentialRampToValueAtTime(hasta, inicio + duracion);
  g.gain.setValueAtTime(volumen, inicio);
  g.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);
  o.connect(g).connect(c.destination);
  o.start(inicio);
  o.stop(inicio + duracion + 0.05);
}

function conAudio(fn) {
  if (!sonidoActivo()) return;
  const c = contexto();
  if (c) fn(c, c.currentTime + 0.01);
}

export const efectoSonido = {
  explosion: (grande = false) => conAudio((c, t) => {
    golpeGrave(c, t, 120, 30, grande ? 1.1 : 0.7, 0.5);
    soplo(c, { inicio: t, duracion: grande ? 1.6 : 1, volumen: 0.45, desde: 3000, hasta: 80 });
    if (grande) soplo(c, { inicio: t + 0.25, duracion: 1.2, volumen: 0.3, desde: 1200, hasta: 60 });
  }),
  agua: () => conAudio((c, t) => {
    soplo(c, { inicio: t, duracion: 0.45, volumen: 0.25, tipo: 'bandpass', desde: 2500, hasta: 600, q: 0.8 });
    soplo(c, { inicio: t + 0.12, duracion: 0.3, volumen: 0.12, tipo: 'highpass', desde: 4000, hasta: 1500 });
  }),
  dados: () => conAudio((c, t) => {
    // Cubilete: varios golpecitos al azar que se van apagando.
    for (let i = 0; i < 9; i++) {
      const at = t + i * 0.07 + Math.random() * 0.05;
      soplo(c, { inicio: at, duracion: 0.05, volumen: 0.35 * (1 - i / 12), tipo: 'bandpass', desde: 2200 + Math.random() * 1500, hasta: 1500, q: 4 });
    }
  }),
  fanfarria: () => conAudio((c, t) => {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => nota(c, f, t + i * 0.11, i === 5 ? 0.7 : 0.25, 0.14));
    [1568, 2093, 2637].forEach((f, i) => nota(c, f, t + 0.7 + i * 0.06, 0.4, 0.05));
  }),
  escoba: () => conAudio((c, t) => {
    soplo(c, { inicio: t, duracion: 0.6, volumen: 0.3, tipo: 'bandpass', desde: 600, hasta: 5000, q: 1.5 });
    nota(c, 880, t + 0.5, 0.2, 0.12);
    nota(c, 1319, t + 0.62, 0.45, 0.12);
  }),
  ganar: () => conAudio((c, t) => {
    [392, 523, 659, 784].forEach((f, i) => nota(c, f, t + i * 0.13, 0.3, 0.15));
    [523, 659, 784].forEach((f) => nota(c, f * 2, t + 0.6, 0.9, 0.08));
  }),
  perder: () => conAudio((c, t) => {
    [392, 370, 349, 330].forEach((f, i) => nota(c, f, t + i * 0.3, i === 3 ? 0.9 : 0.3, 0.13));
  }),
};
