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
