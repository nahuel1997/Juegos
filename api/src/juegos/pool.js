// Pool (bola 8) 1vs1. La física corre en el server: cada tiro se simula completo y se manda la
// trayectoria (cuadro por cuadro) para que los dos vean exactamente lo mismo.
// Reglas simplificadas: la primera que metés define tu grupo (lisas 1-7 o rayadas 9-15); si metés
// una tuya seguís; falta = meter la blanca, no tocar ninguna o (opcional) tocar primero una ajena.
// La 8 se mete al final: antes de tiempo, o con falta, perdés.
import { ErrorJuego } from './comun.js';

export const CONFIG_DEFECTO = { faltaPrimerToque: true, ayudaPunteria: true };

export const MESA = { ancho: 1000, alto: 500, radio: 12, tronera: 24 };
const TRONERAS = [[0, 0], [MESA.ancho / 2, -4], [MESA.ancho, 0], [0, MESA.alto], [MESA.ancho / 2, MESA.alto + 4], [MESA.ancho, MESA.alto]];
const SALIDA_BLANCA = [250, 250];
const FRICCION = 0.988;
const PARADA = 0.04;
const VEL_MAX = 26;
const CADA = 3; // se guarda un cuadro cada 3 pasos

export function validarConfig(c = {}) {
  return { faltaPrimerToque: c.faltaPrimerToque !== false, ayudaPunteria: c.ayudaPunteria !== false };
}

const grupoDe = (n) => (n === 0 ? 'blanca' : n === 8 ? 'ocho' : n < 8 ? 'lisas' : 'rayadas');

function armarTriangulo(rand) {
  const r = MESA.radio;
  const dx = r * Math.sqrt(3) + 0.6;
  const resto = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15].sort(() => rand() - 0.5);
  // El 8 va en el medio; en las dos puntas de atrás, una lisa y una rayada.
  const lisa = resto.find((n) => n < 8);
  const rayada = resto.find((n) => n > 8);
  const otras = resto.filter((n) => n !== lisa && n !== rayada);
  const orden = [];
  let k = 0;
  for (let fila = 0; fila < 5; fila++) {
    for (let i = 0; i <= fila; i++) {
      if (fila === 2 && i === 1) orden.push(8);
      else if (fila === 4 && i === 0) orden.push(lisa);
      else if (fila === 4 && i === 4) orden.push(rayada);
      else orden.push(otras[k++]);
    }
  }
  const bolas = [{ n: 0, x: SALIDA_BLANCA[0], y: SALIDA_BLANCA[1], vx: 0, vy: 0, en: true }];
  let idx = 0;
  for (let fila = 0; fila < 5; fila++) {
    for (let i = 0; i <= fila; i++) {
      bolas.push({ n: orden[idx++], x: 720 + fila * dx, y: 250 + (i - fila / 2) * (2 * r + 0.6), vx: 0, vy: 0, en: true });
    }
  }
  return bolas;
}

// Simula un tiro completo. Devuelve los cuadros, las bolas metidas (en orden) y la primera tocada.
export function simular(bolas, angulo, fuerza) {
  const r = MESA.radio;
  const blanca = bolas.find((b) => b.n === 0);
  const v = Math.max(0.05, Math.min(1, fuerza)) * VEL_MAX;
  blanca.vx = Math.cos(angulo) * v;
  blanca.vy = Math.sin(angulo) * v;
  const cuadros = [];
  const metidas = [];
  let primera = null;
  const foto = () => cuadros.push(bolas.map((b) => (b.en ? [Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10] : null)));
  foto();
  for (let paso = 1; paso <= 4000; paso++) {
    // Subpasos para que las bolas rápidas no se atraviesen.
    for (let sub = 0; sub < 4; sub++) {
      for (const b of bolas) {
        if (!b.en) continue;
        b.x += b.vx / 4;
        b.y += b.vy / 4;
      }
      // Choques entre bolas (elásticos, misma masa).
      for (let i = 0; i < bolas.length; i++) {
        const a = bolas[i];
        if (!a.en) continue;
        for (let k = i + 1; k < bolas.length; k++) {
          const c = bolas[k];
          if (!c.en) continue;
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= 4 * r * r || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const solape = 2 * r - d;
          a.x -= (nx * solape) / 2; a.y -= (ny * solape) / 2;
          c.x += (nx * solape) / 2; c.y += (ny * solape) / 2;
          const rel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
          if (rel <= 0) continue;
          a.vx -= rel * nx; a.vy -= rel * ny;
          c.vx += rel * nx; c.vy += rel * ny;
          if (primera === null && (a.n === 0 || c.n === 0)) primera = a.n === 0 ? c.n : a.n;
        }
      }
      for (const b of bolas) {
        if (!b.en) continue;
        // Troneras.
        if (TRONERAS.some(([tx, ty]) => (b.x - tx) ** 2 + (b.y - ty) ** 2 < MESA.tronera ** 2)) {
          b.en = false;
          b.vx = 0;
          b.vy = 0;
          metidas.push(b.n);
          continue;
        }
        // Bandas.
        if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx) * 0.8; }
        if (b.x > MESA.ancho - r) { b.x = MESA.ancho - r; b.vx = -Math.abs(b.vx) * 0.8; }
        if (b.y < r) { b.y = r; b.vy = Math.abs(b.vy) * 0.8; }
        if (b.y > MESA.alto - r) { b.y = MESA.alto - r; b.vy = -Math.abs(b.vy) * 0.8; }
      }
    }
    let quietas = true;
    for (const b of bolas) {
      if (!b.en) continue;
      b.vx *= FRICCION;
      b.vy *= FRICCION;
      if (Math.hypot(b.vx, b.vy) < PARADA) { b.vx = 0; b.vy = 0; } else quietas = false;
    }
    if (paso % CADA === 0) foto();
    if (quietas) break;
  }
  foto();
  return { cuadros, metidas, primera };
}

export class PartidaPool {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'pool';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.turno = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.bolas = armarTriangulo(rand);
    this.grupos = { [jugadores[0]]: null, [jugadores[1]]: null };
    this.ultimoTiro = null;
    this.tiros = 0;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #quedan(grupo) {
    return this.bolas.filter((b) => b.en && grupoDe(b.n) === grupo).length;
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (tipo !== 'tirar') throw new ErrorJuego('Acción desconocida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const angulo = Number(datos.angulo);
    const fuerza = Number(datos.fuerza);
    if (!Number.isFinite(angulo) || !Number.isFinite(fuerza)) throw new ErrorJuego('Tiro inválido');

    const miGrupoAntes = this.grupos[j];
    const { cuadros, metidas, primera } = simular(this.bolas, angulo, fuerza);
    this.tiros++;

    const metioBlanca = metidas.includes(0);
    const metioOcho = metidas.includes(8);
    let falta = null;
    if (metioBlanca) falta = 'Metiste la blanca';
    else if (primera === null) falta = 'No tocaste ninguna bola';
    else if (this.config.faltaPrimerToque && miGrupoAntes) {
      const libreOcho = this.#quedan(miGrupoAntes) + metidas.filter((n) => grupoDe(n) === miGrupoAntes).length === 0;
      const valida = grupoDe(primera) === miGrupoAntes || (primera === 8 && libreOcho);
      if (!valida) falta = 'Tocaste primero una bola que no es tuya';
    }

    // Grupos: la primera bola (no 8) metida sin falta define el grupo de quien tiró.
    const propias = metidas.filter((n) => n !== 0 && n !== 8);
    if (!miGrupoAntes && !falta && propias.length) {
      const g = grupoDe(propias[0]);
      this.grupos[j] = g;
      this.grupos[rival] = g === 'lisas' ? 'rayadas' : 'lisas';
    }
    const miGrupo = this.grupos[j];
    let mensaje = falta;

    if (metioOcho) {
      const limpio = miGrupoAntes && this.#quedan(miGrupoAntes) === 0;
      if (limpio && !falta) this.#terminar(j, 'ocho');
      else this.#terminar(rival, falta ? 'falta-ocho' : 'ocho-temprano');
      mensaje = limpio && !falta ? '¡Metiste la 8!' : 'La 8 entró antes de tiempo o con falta';
    } else {
      if (metioBlanca) {
        // La blanca vuelve a su lugar (o lo más cerca posible si está ocupado).
        const blanca = this.bolas.find((b) => b.n === 0);
        let [x, y] = SALIDA_BLANCA;
        while (this.bolas.some((b) => b.en && b.n !== 0 && Math.hypot(b.x - x, b.y - y) < 2 * MESA.radio + 1)) x -= 2 * MESA.radio;
        Object.assign(blanca, { x, y, vx: 0, vy: 0, en: true });
      }
      const metiMias = miGrupo ? metidas.some((n) => grupoDe(n) === miGrupo) : propias.length > 0;
      if (falta || !metiMias) this.turno = rival;
      if (!mensaje) mensaje = metiMias ? '¡Adentro! Seguís vos' : metidas.length ? 'Metiste una del rival' : null;
    }

    this.ultimoTiro = { id: this.tiros, por: j, cuadros, metidas, falta, mensaje, angulo, fuerza };
  }

  #terminar(ganador, motivo) {
    this.estado = 'terminada';
    this.ganador = ganador;
    this.motivoFin = motivo;
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.#terminar(rival, 'abandono');
  }

  detalleHistorial() {
    return { tiros: this.tiros };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const t = this.ultimoTiro;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      mesa: MESA,
      turno: this.turno,
      bolas: this.bolas.map(({ n, x, y, en }) => ({ n, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, en })),
      grupos: { yo: this.grupos[j], rival: this.grupos[rival] },
      quedan: {
        yo: this.grupos[j] ? this.#quedan(this.grupos[j]) : null,
        rival: this.grupos[rival] ? this.#quedan(this.grupos[rival]) : null,
      },
      ultimoTiro: t && { ...t, mio: t.por === j },
    };
  }
}
