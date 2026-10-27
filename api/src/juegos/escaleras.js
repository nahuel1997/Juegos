// Escaleras y serpientes 1vs1: se tira un dado y se avanza. Si caés al pie de una escalera subís; si
// caés en la cabeza de una serpiente bajás hasta la cola. Gana el primero en llegar a la última casilla.
// Las escaleras y serpientes salen al azar en cada partida. Opcional: llegar justo (si te pasás, rebotás)
// y volver a tirar con un 6.
import { ErrorJuego, entero } from './comun.js';

export const CANTIDAD = { pocas: 5, normal: 8, muchas: 11 };
export const CONFIG_DEFECTO = { casillas: 100, cantidad: 'normal', exacto: true, seisRepite: true };

export function validarConfig(c = {}) {
  const config = {
    casillas: [49, 64, 100].includes(Number(c.casillas ?? CONFIG_DEFECTO.casillas)) ? Number(c.casillas ?? CONFIG_DEFECTO.casillas) : null,
    cantidad: c.cantidad ?? CONFIG_DEFECTO.cantidad,
    exacto: !!(c.exacto ?? CONFIG_DEFECTO.exacto),
    seisRepite: !!(c.seisRepite ?? CONFIG_DEFECTO.seisRepite),
  };
  if (!config.casillas) throw new ErrorJuego('El tablero tiene que ser de 49, 64 o 100 casillas');
  if (!(config.cantidad in CANTIDAD)) throw new ErrorJuego('Cantidad inválida');
  return config;
}

// Arma escaleras y serpientes sin que se pisen: ningún extremo en la misma casilla, ni en la 1 ni en la última.
export function armarTablero(casillas, cantidad, rand = Math.random) {
  const lado = Math.sqrt(casillas);
  const n = Math.round((CANTIDAD[cantidad] * casillas) / 100);
  const usadas = new Set([1, casillas]);
  const fila = (x) => Math.floor((x - 1) / lado);
  const libre = (desde, hasta) => {
    for (let i = 0; i < 200; i++) {
      const x = desde + Math.floor(rand() * (hasta - desde + 1));
      if (!usadas.has(x)) return x;
    }
    return null;
  };
  const saltos = {};
  const poner = (tipo) => {
    for (let i = 0; i < 50; i++) {
      const a = libre(2, casillas - lado - 1);
      if (a === null) return;
      const b = libre(Math.min(casillas - 1, (fila(a) + 1) * lado + 1), Math.min(casillas - 1, a + lado * 4));
      if (b === null || fila(b) <= fila(a)) continue;
      const [desde, hasta] = tipo === 'escalera' ? [a, b] : [b, a];
      usadas.add(a);
      usadas.add(b);
      saltos[desde] = { hasta, tipo };
      return;
    }
  };
  for (let i = 0; i < n; i++) { poner('escalera'); poner('serpiente'); }
  return saltos;
}

export class PartidaEscaleras {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'escaleras';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.saltos = armarTablero(config.casillas, config.cantidad, rand);
    this.pos = Object.fromEntries(jugadores.map((j) => [j, 0])); // 0 = afuera, antes de la 1
    this.turno = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.ultima = null;
    this.tiradas = 0;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (tipo !== 'tirar') throw new ErrorJuego('Acción desconocida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const dado = 1 + Math.floor((this.rand ?? Math.random)() * 6);
    const meta = this.config.casillas;
    const desde = this.pos[j];
    let paso = desde + dado;
    let rebote = false;
    if (paso > meta) {
      if (this.config.exacto) { paso = meta - (paso - meta); rebote = true; } else paso = meta;
    }
    const salto = this.saltos[paso];
    const hasta = salto ? salto.hasta : paso;
    this.pos[j] = hasta;
    this.ultima = { por: j, dado, desde, paso, hasta, via: salto?.tipo ?? null, rebote, n: ++this.tiradas };
    if (hasta === meta) {
      this.estado = 'terminada';
      this.ganador = j;
      this.motivoFin = 'meta';
      this.turno = null;
      return;
    }
    if (!(dado === 6 && this.config.seisRepite)) this.turno = this.rival(j);
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { tiradas: this.tiradas };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      turno: this.turno,
      saltos: this.saltos,
      pos: { yo: this.pos[j], rival: this.pos[rival] },
      ultima: this.ultima && { ...this.ultima, por: this.ultima.por === j ? 'yo' : 'rival' },
    };
  }
}
