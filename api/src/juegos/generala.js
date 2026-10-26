// Generala 1vs1: 5 dados, hasta 3 tiros por turno guardando los que quieras, y una categoría
// por turno (anotar o tachar). Reglas argentinas: escalera 20, full 30, póker 40, generala 50,
// doble generala 100; "servido" (en el primer tiro) suma 5. Generala servida puede ganar en el acto.
import { ErrorJuego, ganadorPorPuntos } from './comun.js';

export const CONFIG_DEFECTO = { servidaGana: true, dobleGenerala: true, bonoServido: true };

export const CATEGORIAS = [
  { id: '1', nombre: 'Unos' },
  { id: '2', nombre: 'Doses' },
  { id: '3', nombre: 'Treses' },
  { id: '4', nombre: 'Cuatros' },
  { id: '5', nombre: 'Cincos' },
  { id: '6', nombre: 'Seises' },
  { id: 'escalera', nombre: 'Escalera' },
  { id: 'full', nombre: 'Full' },
  { id: 'poker', nombre: 'Póker' },
  { id: 'generala', nombre: 'Generala' },
  { id: 'doble', nombre: 'Doble generala' },
];

export function validarConfig(c = {}) {
  return {
    servidaGana: c.servidaGana !== false,
    dobleGenerala: c.dobleGenerala !== false,
    bonoServido: c.bonoServido !== false,
  };
}

export const categoriasDe = (config) => CATEGORIAS.filter((c) => c.id !== 'doble' || config.dobleGenerala);

// Puntos que daría cada categoría con estos dados.
export function puntosPosibles(dados, servido, config, planilla = {}) {
  const cuenta = [0, 0, 0, 0, 0, 0, 0];
  dados.forEach((d) => cuenta[d]++);
  const reps = cuenta.slice(1).filter(Boolean).sort((a, b) => b - a);
  const ordenados = [...dados].sort().join('');
  const bono = servido && config.bonoServido ? 5 : 0;
  const out = {};
  for (const c of categoriasDe(config)) {
    if (/^\d$/.test(c.id)) out[c.id] = cuenta[Number(c.id)] * Number(c.id);
  }
  // La escalera puede ser 1-2-3-4-5, 2-3-4-5-6 o 3-4-5-6-1.
  out.escalera = ['12345', '23456', '13456'].includes(ordenados) ? 20 + bono : 0;
  out.full = reps[0] === 3 && reps[1] === 2 ? 30 + bono : 0;
  out.poker = reps[0] >= 4 ? 40 + bono : 0;
  out.generala = reps[0] === 5 ? 50 : 0;
  if (config.dobleGenerala) {
    // La doble solo vale si ya anotaste (no tachaste) la generala.
    out.doble = reps[0] === 5 && planilla.generala > 0 ? 100 : 0;
  }
  return out;
}

const tirarDado = (rand) => 1 + Math.floor(rand() * 6);

export class PartidaGenerala {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'generala';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.turno = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.planillas = { [jugadores[0]]: {}, [jugadores[1]]: {} };
    this.ultimaAnotacion = null;
    this.#nuevoTurno();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nuevoTurno() {
    this.dados = [0, 0, 0, 0, 0]; // 0 = todavía no tiró
    this.guardados = [false, false, false, false, false];
    this.tiros = 0;
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');

    if (tipo === 'tirar') {
      if (this.tiros >= 3) throw new ErrorJuego('Ya tiraste 3 veces: anotá');
      const guardar = this.tiros === 0 ? [false, false, false, false, false] : (datos.guardar || []).map(Boolean);
      if (this.tiros > 0 && guardar.length === 5 && guardar.every(Boolean)) throw new ErrorJuego('Soltá al menos un dado para tirar');
      this.dados = this.dados.map((d, i) => (guardar[i] ? d : tirarDado(this.rand)));
      this.guardados = Array.from({ length: 5 }, (_, i) => !!guardar[i]);
      this.tiros++;
      return;
    }
    if (tipo === 'anotar') {
      if (this.tiros === 0) throw new ErrorJuego('Primero tirá los dados');
      const cat = categoriasDe(this.config).find((c) => c.id === datos.categoria);
      if (!cat) throw new ErrorJuego('Categoría desconocida');
      const planilla = this.planillas[j];
      if (planilla[cat.id] !== undefined) throw new ErrorJuego('Esa categoría ya está usada');
      const servido = this.tiros === 1;
      const puntos = puntosPosibles(this.dados, servido, this.config, planilla)[cat.id];
      planilla[cat.id] = puntos; // 0 = tachada
      const juego = ['escalera', 'full', 'poker', 'generala', 'doble'].includes(cat.id);
      this.ultimaAnotacion = { por: j, categoria: cat.nombre, puntos, servido: juego && servido && puntos > 0 };
      if (cat.id === 'generala' && puntos > 0 && servido && this.config.servidaGana) {
        return this.#terminar(j, 'servida');
      }
      if (this.jugadores.every((x) => Object.keys(this.planillas[x]).length === categoriasDe(this.config).length)) {
        return this.#terminar(ganadorPorPuntos(this.jugadores, this.totales()), 'puntos');
      }
      this.turno = this.rival(j);
      this.#nuevoTurno();
      return;
    }
    throw new ErrorJuego('Acción desconocida');
  }

  totales() {
    return Object.fromEntries(this.jugadores.map((j) => [j, Object.values(this.planillas[j]).reduce((a, b) => a + b, 0)]));
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
    return { puntos: this.totales() };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const totales = this.totales();
    const posibles = this.tiros > 0 ? puntosPosibles(this.dados, this.tiros === 1, this.config, this.planillas[this.turno]) : null;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      categorias: categoriasDe(this.config),
      turno: this.turno,
      dados: this.dados,
      guardados: this.guardados,
      tiros: this.tiros,
      posibles,
      planillas: { yo: this.planillas[j], rival: this.planillas[rival] },
      totales: { yo: totales[j], rival: totales[rival] },
      ultimaAnotacion: this.ultimaAnotacion,
    };
  }
}
