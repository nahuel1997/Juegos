// Truco argentino 1vs1 a 15 o 30. Tres cartas, tres bazas; envido (envido, real envido, falta envido),
// truco / retruco / vale cuatro, irse al mazo y flor opcional (se canta sola: 3 puntos).
// Las respuestas (quiero / no quiero / subir) las da el rival del que cantó; mientras tanto no se juega.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { meta: 30, flor: false };

export function validarConfig(c = {}) {
  const meta = Number(c.meta ?? CONFIG_DEFECTO.meta);
  if (![15, 30].includes(meta)) throw new ErrorJuego('Se juega a 15 o a 30');
  return { meta, flor: !!(c.flor ?? CONFIG_DEFECTO.flor) };
}

export const PALOS = ['espadas', 'bastos', 'oros', 'copas'];
const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

// Qué tan alta es cada carta en el truco (más es mejor).
export function jerarquia({ numero, palo }) {
  if (numero === 1 && palo === 'espadas') return 14;
  if (numero === 1 && palo === 'bastos') return 13;
  if (numero === 7 && palo === 'espadas') return 12;
  if (numero === 7 && palo === 'oros') return 11;
  return { 3: 10, 2: 9, 1: 8, 12: 7, 11: 6, 10: 5, 7: 4, 6: 3, 5: 2, 4: 1 }[numero];
}

const valorEnvido = (c) => (c.numero >= 10 ? 0 : c.numero);

export function envidoDe(cartas) {
  let mejor = Math.max(...cartas.map(valorEnvido));
  for (const palo of PALOS) {
    const del = cartas.filter((c) => c.palo === palo).map(valorEnvido).sort((a, b) => b - a);
    if (del.length >= 2) mejor = Math.max(mejor, 20 + del[0] + del[1]);
  }
  return mejor;
}

export const tieneFlor = (cartas) => cartas.length === 3 && cartas.every((c) => c.palo === cartas[0].palo);
const valorFlor = (cartas) => 20 + cartas.reduce((t, c) => t + valorEnvido(c), 0);

const NOMBRE_ENVIDO = { envido: 'Envido', real: 'Real envido', falta: 'Falta envido' };
const NOMBRE_TRUCO = { 1: 'Truco', 2: 'Retruco', 3: 'Vale cuatro' };

export class PartidaTruco {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'truco';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.manoDe = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.numero = 0;
    this.eventos = [];
    this.#repartir();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #repartir(cartas) {
    this.numero++;
    if (this.numero > 1) this.manoDe = this.rival(this.manoDe);
    const rand = this.rand ?? Math.random;
    const mazo = [];
    for (const palo of PALOS) for (const numero of NUMEROS) mazo.push({ id: `${numero}-${palo}`, numero, palo });
    for (let i = mazo.length - 1; i > 0; i--) {
      const k = Math.floor(rand() * (i + 1));
      [mazo[i], mazo[k]] = [mazo[k], mazo[i]];
    }
    const [a, b] = this.jugadores;
    this.iniciales = cartas ?? { [a]: mazo.slice(0, 3), [b]: mazo.slice(3, 6) };
    this.mano = Object.fromEntries(this.jugadores.map((j) => [j, [...this.iniciales[j]]]));
    this.fase = 'jugando';
    this.bazas = [];
    this.turno = this.manoDe;
    this.truco = { nivel: 0, valor: 1, puedeSubir: null };
    this.envido = { estado: 'libre', resultado: null };
    this.pendiente = null;
    this.flor = null;
    this.resumen = null;
    this.listosSiguiente = new Set();
    this.#evento(`Mano ${this.numero}: es mano @${this.manoDe}@`);
    if (this.config.flor) this.#cantarFlor();
  }

  // Flor: si alguno tiene, se canta sola y ya no hay envido.
  #cantarFlor() {
    const con = this.jugadores.filter((j) => tieneFlor(this.iniciales[j]));
    if (!con.length) return;
    this.envido.estado = 'cerrado';
    let ganador = con[0];
    let pts = 3;
    if (con.length === 2) {
      const [a, b] = con.map((j) => valorFlor(this.iniciales[j]));
      ganador = a === b ? this.manoDe : a > b ? con[0] : con[1];
      pts = 6;
    }
    this.flor = { quienes: con, ganador, puntos: pts };
    this.#evento(`${con.map((x) => `@${x}@`).join(' y ')} ${con.length === 2 ? 'tienen' : 'tiene'} flor: ${pts} para @${ganador}@`);
    this.#sumar(ganador, pts);
  }

  #evento(texto) {
    this.eventos.push(texto);
    if (this.eventos.length > 12) this.eventos.shift();
  }

  #sumar(j, n) {
    if (this.estado !== 'jugando') return;
    this.puntos[j] = Math.min(this.config.meta, this.puntos[j] + n);
    if (this.puntos[j] >= this.config.meta) {
      this.estado = 'terminada';
      this.ganador = j;
      this.motivoFin = 'puntos';
      this.fase = 'resumen';
      this.turno = null;
      this.pendiente = null;
    }
  }

  get bazaActual() {
    const ultima = this.bazas[this.bazas.length - 1];
    return ultima && !ultima.cerrada ? ultima : null;
  }

  jugoEnPrimera(j) {
    return this.bazas.length > 1 || !!this.bazas[0]?.cartas[j];
  }

  // Qué puede hacer j ahora.
  opciones(j) {
    if (this.estado !== 'jugando' || this.fase !== 'jugando') return [];
    const ops = [];
    const r = this.rival(j);
    const p = this.pendiente;
    const puedeEnvido = this.envido.estado === 'libre' && this.bazas.length <= 1 && !this.jugoEnPrimera(j) && this.truco.nivel <= 1 && !(this.truco.nivel === 1 && !p);
    if (p) {
      if (p.por === j) return [];
      ops.push('quiero', 'noquiero');
      if (p.tipo === 'envido') {
        const c = p.cadena;
        const envidos = c.filter((x) => x === 'envido').length;
        if (!c.includes('real') && !c.includes('falta') && envidos < 2) ops.push('envido');
        if (!c.includes('real') && !c.includes('falta')) ops.push('real');
        if (!c.includes('falta')) ops.push('falta');
      } else {
        // "El envido está primero": contestar un truco con envido.
        if (p.nivel === 1 && this.envido.estado === 'libre' && this.bazas.length <= 1 && !this.jugoEnPrimera(j)) ops.push('envido', 'real', 'falta');
        if (p.nivel < 3) ops.push('truco');
      }
      ops.push('mazo');
      return ops;
    }
    if (this.turno !== j) return [];
    ops.push('jugar');
    if (puedeEnvido) ops.push('envido', 'real', 'falta');
    if (this.truco.nivel < 3 && (this.truco.puedeSubir === null ? this.truco.nivel === 0 : this.truco.puedeSubir === j)) ops.push('truco');
    ops.push('mazo');
    void r;
    return ops;
  }

  accion(j, tipo, datos = {}) {
    const r = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'resumen') throw new ErrorJuego('La mano no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) this.#repartir();
      return;
    }
    if (!this.opciones(j).includes(tipo)) throw new ErrorJuego('Ahora no podés hacer eso');
    switch (tipo) {
      case 'jugar': return this.#jugar(j, String(datos.carta));
      case 'envido': case 'real': case 'falta': return this.#cantarEnvido(j, tipo);
      case 'truco': return this.#cantarTruco(j);
      case 'quiero': return this.#responder(j, true);
      case 'noquiero': return this.#responder(j, false);
      case 'mazo':
        if (this.pendiente?.tipo === 'envido') {
          const pe = this.pendiente;
          this.#sumar(pe.por, pe.cadena.length === 1 ? 1 : this.#puntosEnvido(pe.cadena.slice(0, -1)));
          this.envido.estado = 'jugado';
          this.pendiente = pe.trucoEnEspera;
          if (this.estado !== 'jugando') return;
        }
        this.#evento(`@${j}@ se fue al mazo`);
        // Si se va antes de que se juegue el envido en la primera, el otro se lleva 1 más.
        return this.#cerrarMano(r, this.pendiente?.tipo === 'truco' ? this.#valorTrucoAnterior() : this.truco.valor, 'mazo',
          this.envido.estado === 'libre' && this.bazas.length <= 1 && !this.jugoEnPrimera(j) && j === this.manoDe ? 1 : 0);
      default: throw new ErrorJuego('Acción desconocida');
    }
  }

  #jugar(j, id) {
    const i = this.mano[j].findIndex((c) => c.id === id);
    if (i < 0) throw new ErrorJuego('Esa carta no la tenés');
    const [carta] = this.mano[j].splice(i, 1);
    let baza = this.bazaActual;
    if (!baza) { baza = { cartas: {}, ganador: undefined, cerrada: false, empezo: j }; this.bazas.push(baza); }
    baza.cartas[j] = carta;
    const r = this.rival(j);
    if (!baza.cartas[r]) { this.turno = r; return; }
    // Se cierra la baza.
    const [a, b] = [jerarquia(baza.cartas[j]), jerarquia(baza.cartas[r])];
    baza.ganador = a === b ? null : a > b ? j : r;
    baza.cerrada = true;
    const ganador = this.#ganadorMano();
    if (ganador) return this.#cerrarMano(ganador, this.truco.valor, 'bazas');
    this.turno = baza.ganador ?? this.manoDe;
  }

  #ganadorMano() {
    const res = this.bazas.map((b) => b.ganador);
    for (const j of this.jugadores) if (res.filter((x) => x === j).length >= 2) return j;
    const [b1, b2, b3] = res;
    if (res.length >= 2) {
      if (b1 === null && b2 !== null) return b2;
      if (b1 !== null && b2 === null) return b1;
    }
    if (res.length === 3) {
      if (b3 === null) return b1 ?? b2 ?? this.manoDe;
      return b3;
    }
    return null;
  }

  #cantarEnvido(j, tipo) {
    const p = this.pendiente;
    if (p?.tipo === 'envido') {
      p.cadena.push(tipo);
      p.por = j;
    } else {
      // Nuevo (o contestando un truco: el truco queda en espera).
      this.pendiente = { tipo: 'envido', por: j, cadena: [tipo], trucoEnEspera: p?.tipo === 'truco' ? p : null, turnoAntes: p?.turnoAntes ?? this.turno };
      this.envido.estado = 'cantado';
    }
    this.#evento(`@${j}@: ¡${NOMBRE_ENVIDO[tipo]}!`);
  }

  #valorFalta() {
    return this.config.meta - Math.max(...this.jugadores.map((x) => this.puntos[x]));
  }

  #puntosEnvido(cadena) {
    let t = 0;
    for (const x of cadena) t = x === 'falta' ? this.#valorFalta() : t + (x === 'envido' ? 2 : 3);
    return t;
  }

  #cantarTruco(j) {
    const p = this.pendiente;
    const nivel = (p?.tipo === 'truco' ? p.nivel : this.truco.nivel) + 1;
    if (p?.tipo === 'truco') {
      // Subir es aceptar lo anterior.
      this.truco.nivel = p.nivel;
      this.truco.valor = p.nivel + 1;
    }
    this.pendiente = { tipo: 'truco', por: j, nivel, turnoAntes: p?.turnoAntes ?? this.turno };
    this.#evento(`@${j}@: ¡${NOMBRE_TRUCO[nivel]}!`);
  }

  #valorTrucoAnterior() {
    return this.pendiente.nivel; // lo que valía antes del último canto (1, 2 o 3)
  }

  #responder(j, quiere) {
    const p = this.pendiente;
    this.#evento(`@${j}@: ${quiere ? 'quiero' : 'no quiero'}`);
    if (p.tipo === 'envido') {
      const r = p.por;
      if (quiere) {
        const valores = Object.fromEntries(this.jugadores.map((x) => [x, envidoDe(this.iniciales[x])]));
        const [a, b] = this.jugadores;
        const gana = valores[a] === valores[b] ? this.manoDe : valores[a] > valores[b] ? a : b;
        const pts = this.#puntosEnvido(p.cadena);
        this.envido.resultado = { valores, ganador: gana, puntos: pts, querido: true };
        this.#evento(`Envido: @${a}@ ${valores[a]}, @${b}@ ${valores[b]}. ${pts} para @${gana}@`);
        this.#sumar(gana, pts);
      } else {
        const pts = p.cadena.length === 1 ? 1 : this.#puntosEnvido(p.cadena.slice(0, -1));
        this.envido.resultado = { ganador: r, puntos: pts, querido: false };
        this.#sumar(r, pts);
      }
      this.envido.estado = 'jugado';
      this.pendiente = p.trucoEnEspera || null;
      if (!this.pendiente) this.turno = p.turnoAntes;
      return;
    }
    // Truco.
    if (quiere) {
      this.truco.nivel = p.nivel;
      this.truco.valor = p.nivel + 1;
      this.truco.puedeSubir = j;
      this.pendiente = null;
      this.turno = p.turnoAntes;
      return;
    }
    this.#cerrarMano(p.por, p.nivel, 'noquiero');
  }

  #cerrarMano(ganador, puntos, motivo, extra = 0) {
    this.pendiente = null;
    this.fase = 'resumen';
    this.turno = null;
    this.resumen = { ganador, puntos: puntos + extra, motivo };
    this.#evento(`@${ganador}@ se lleva ${puntos + extra} ${puntos + extra === 1 ? 'punto' : 'puntos'}`);
    this.#sumar(ganador, puntos + extra);
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { puntos: this.puntos, manos: this.numero };
  }

  vistaPara(j) {
    const r = this.rival(j);
    const quien = (x) => (x == null ? x : x === j ? 'yo' : 'rival');
    const p = this.pendiente;
    const fin = this.fase === 'resumen';
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      fase: this.fase,
      numero: this.numero,
      soyMano: this.manoDe === j,
      turno: quien(this.turno),
      miMano: this.mano[j],
      misIniciales: this.iniciales[j],
      cartasRival: this.mano[r].length,
      // Al terminar la mano se muestran las cartas que el rival no jugó.
      rivalIniciales: fin ? this.iniciales[r] : null,
      bazas: this.bazas.map((b) => ({ yo: b.cartas[j] || null, rival: b.cartas[r] || null, ganador: b.cerrada ? (b.ganador === null ? 'parda' : quien(b.ganador)) : null })),
      puntos: { yo: this.puntos[j], rival: this.puntos[r] },
      truco: { nivel: this.truco.nivel, valor: this.truco.valor },
      pendiente: p && { tipo: p.tipo, por: quien(p.por), nombre: p.tipo === 'envido' ? NOMBRE_ENVIDO[p.cadena[p.cadena.length - 1]] : NOMBRE_TRUCO[p.nivel], cadena: p.cadena, nivel: p.nivel, puntos: p.tipo === 'envido' ? this.#puntosEnvido(p.cadena) : p.nivel + 1 },
      miEnvido: envidoDe(this.iniciales[j]),
      envido: this.envido.resultado && {
        ganador: quien(this.envido.resultado.ganador),
        puntos: this.envido.resultado.puntos,
        querido: this.envido.resultado.querido,
        valores: this.envido.resultado.valores && { yo: this.envido.resultado.valores[j], rival: this.envido.resultado.valores[r] },
      },
      flor: this.flor && { ganador: quien(this.flor.ganador), puntos: this.flor.puntos, yo: this.flor.quienes.includes(j), rival: this.flor.quienes.includes(r) },
      opciones: this.opciones(j),
      resumen: this.resumen && { ...this.resumen, ganador: quien(this.resumen.ganador) },
      // '@R@' lo reemplaza el front por el nombre del rival.
      eventos: this.eventos.map((e) => e.replaceAll(`@${j}@`, 'Vos').replaceAll(`@${r}@`, '@R@')),
      listosSiguiente: [...this.listosSiguiente].map(quien),
    };
  }
}

void entero;
