import { randomUUID, randomInt } from 'node:crypto';
import { usuarioDeCookie, invitadoDeCookie, todosLosUsuarios, buscarUsuario } from './auth.js';
import { ErrorJuego } from './juegos/comun.js';
import * as batallaNaval from './juegos/batallaNaval.js';
import * as ahorcado from './juegos/ahorcado.js';
import * as tutiFruti from './juegos/tutiFruti.js';
import * as generala from './juegos/generala.js';
import * as escoba from './juegos/escoba.js';
import * as cuatroEnLinea from './juegos/cuatroEnLinea.js';
import * as ppt from './juegos/piedraPapelTijera.js';
import * as damas from './juegos/damas.js';
import * as memotest from './juegos/memotest.js';
import * as stopPalabras from './juegos/stopPalabras.js';
import * as domino from './juegos/domino.js';
import * as ludo from './juegos/ludo.js';
import * as quien from './juegos/quienEsQuien.js';
import * as pool from './juegos/pool.js';
import * as penales from './juegos/penales.js';
import * as gatoRaton from './juegos/gatoRaton.js';
import * as uno from './juegos/uno.js';
import * as chinchon from './juegos/chinchon.js';
import * as tateti from './juegos/tateti.js';
import * as cajitas from './juegos/cajitas.js';
import * as mastermind from './juegos/mastermind.js';
import * as escaleras from './juegos/escaleras.js';
import * as caballos from './juegos/caballos.js';
import * as backgammon from './juegos/backgammon.js';
import * as sudoku from './juegos/sudoku.js';
import * as quoridor from './juegos/quoridor.js';
import * as dibujar from './juegos/dibujar.js';
import * as monopoly from './juegos/monopoly.js';
import * as truco from './juegos/truco.js';
import * as ajedrez from './juegos/ajedrez.js';
import * as reversi from './juegos/reversi.js';
import * as tron from './juegos/tron.js';
import * as botellas from './juegos/botellas.js';
import * as emojis from './juegos/emojis.js';
import * as simon from './juegos/simon.js';
import * as colores from './juegos/colores.js';
import * as palabrasCruzadas from './juegos/palabrasCruzadas.js';
import * as jenga from './juegos/jenga.js';
import * as nim from './juegos/nim.js';
import * as masOMenos from './juegos/masOMenos.js';
import * as tocaElPunto from './juegos/tocaElPunto.js';
import * as contaObjetos from './juegos/contaObjetos.js';
import * as ruletaEmojis from './juegos/ruletaEmojis.js';
import * as adivina from './juegos/adivina.js';
import { registrarPartida, resumen } from './historial.js';
import { montarChat } from './chat.js';
import { cargarSalas, crearGuardador } from './persistencia.js';

// Juegos disponibles. Para sumar uno: un módulo con CONFIG_DEFECTO, validarConfig y una clase de
// partida (accion, abandonar, vistaPara, detalleHistorial), y su entrada acá. `max`: hasta cuántos
// jugadores admite (2 si no dice); los de más de 2 trabajan con la lista de jugadores, no con un rival.
export const JUEGOS = {
  'batalla-naval': { nombre: 'Batalla naval', mod: batallaNaval, Clase: batallaNaval.PartidaBatallaNaval },
  ahorcado: { nombre: 'Ahorcado', mod: ahorcado, Clase: ahorcado.PartidaAhorcado },
  'tuti-fruti': { nombre: 'Tuti fruti', mod: tutiFruti, Clase: tutiFruti.PartidaTutiFruti, max: 8 },
  generala: { nombre: 'Generala', mod: generala, Clase: generala.PartidaGenerala },
  escoba: { nombre: 'Escoba del 15', mod: escoba, Clase: escoba.PartidaEscoba },
  'cuatro-en-linea': { nombre: 'Cuatro en línea', mod: cuatroEnLinea, Clase: cuatroEnLinea.PartidaCuatroEnLinea },
  'piedra-papel-tijera': { nombre: 'Piedra, papel o tijera', mod: ppt, Clase: ppt.PartidaPiedraPapelTijera },
  damas: { nombre: 'Damas', mod: damas, Clase: damas.PartidaDamas },
  memotest: { nombre: 'Memotest', mod: memotest, Clase: memotest.PartidaMemotest },
  'stop-palabras': { nombre: 'Stop de palabras', mod: stopPalabras, Clase: stopPalabras.PartidaStopPalabras },
  domino: { nombre: 'Dominó', mod: domino, Clase: domino.PartidaDomino },
  ludo: { nombre: 'Ludo', mod: ludo, Clase: ludo.PartidaLudo },
  'quien-es-quien': { nombre: '¿Quién es quién?', mod: quien, Clase: quien.PartidaQuienEsQuien },
  pool: { nombre: 'Pool', mod: pool, Clase: pool.PartidaPool },
  penales: { nombre: 'Penales', mod: penales, Clase: penales.PartidaPenales },
  'gato-raton': { nombre: 'El gato y el ratón', mod: gatoRaton, Clase: gatoRaton.PartidaGatoRaton },
  uno: { nombre: 'UNO', mod: uno, Clase: uno.PartidaUno },
  chinchon: { nombre: 'Chinchón', mod: chinchon, Clase: chinchon.PartidaChinchon },
  tateti: { nombre: 'Ta te ti', mod: tateti, Clase: tateti.PartidaTateti },
  cajitas: { nombre: 'Puntos y cajitas', mod: cajitas, Clase: cajitas.PartidaCajitas },
  mastermind: { nombre: 'Mastermind', mod: mastermind, Clase: mastermind.PartidaMastermind },
  escaleras: { nombre: 'Escaleras y serpientes', mod: escaleras, Clase: escaleras.PartidaEscaleras },
  caballos: { nombre: 'Carrera de caballos', mod: caballos, Clase: caballos.PartidaCaballos },
  backgammon: { nombre: 'Backgammon', mod: backgammon, Clase: backgammon.PartidaBackgammon },
  sudoku: { nombre: 'Sudoku duelo', mod: sudoku, Clase: sudoku.PartidaSudoku },
  quoridor: { nombre: 'Quoridor', mod: quoridor, Clase: quoridor.PartidaQuoridor },
  dibujar: { nombre: 'Dibujá y adiviná', mod: dibujar, Clase: dibujar.PartidaDibujar },
  monopoly: { nombre: 'Monopoly Lanús', mod: monopoly, Clase: monopoly.PartidaMonopoly },
  truco: { nombre: 'Truco', mod: truco, Clase: truco.PartidaTruco },
  ajedrez: { nombre: 'Ajedrez', mod: ajedrez, Clase: ajedrez.PartidaAjedrez },
  reversi: { nombre: 'Reversi', mod: reversi, Clase: reversi.PartidaReversi },
  tron: { nombre: 'Motos de luz (Tron)', mod: tron, Clase: tron.PartidaTron },
  botellas: { nombre: 'Botellas de colores', mod: botellas, Clase: botellas.PartidaBotellas },
  emojis: { nombre: 'Adiviná la canción', mod: emojis, Clase: emojis.PartidaEmojis },
  simon: { nombre: 'Memoria de secuencia', mod: simon, Clase: simon.PartidaSimon },
  colores: { nombre: 'Contrarreloj de colores', mod: colores, Clase: colores.PartidaColores },
  'palabras-cruzadas': { nombre: 'Palabras cruzadas', mod: palabrasCruzadas, Clase: palabrasCruzadas.PartidaPalabrasCruzadas, max: 4 },
  jenga: { nombre: 'Jenga', mod: jenga, Clase: jenga.PartidaJenga, max: 4 },
  nim: { nombre: 'Nim (palitos)', mod: nim, Clase: nim.PartidaNim },
  'mas-o-menos': { nombre: 'Más o menos', mod: masOMenos, Clase: masOMenos.PartidaMasOMenos, max: 8 },
  'toca-el-punto': { nombre: 'Tocá el punto', mod: tocaElPunto, Clase: tocaElPunto.PartidaTocaElPunto, max: 8 },
  'conta-objetos': { nombre: 'Contá los objetos', mod: contaObjetos, Clase: contaObjetos.PartidaContaObjetos, max: 8 },
  'ruleta-emojis': { nombre: 'Ruleta de emojis', mod: ruletaEmojis, Clase: ruletaEmojis.PartidaRuletaEmojis, max: 8 },
  adivina: { nombre: 'Adiviná', mod: adivina, Clase: adivina.PartidaAdivina, max: 8 },
};

// Emoticones que se pueden mandar en una sala (los dibujos están en web/src/iconos.jsx).
export const EMOTES = ['fuckyou', 'risa', 'llanto', 'enojo', 'beso', 'corazon', 'fuego', 'aplauso', 'facha', 'pulgar', 'sorpresa', 'caca', 'ojitos'];

// Una sala = un juego y sus jugadores. Arranca en configuración (reglas editables en vivo); cuando
// todos están listos empieza la partida. Al terminar: revancha, reglas o salir.
// Dos formas de armarla: desafiando a otro usuario (1vs1) o con un código que se comparte: entran
// usuarios del sitio o invitados sin cuenta, hasta el máximo del juego (`max`, 2 si no dice).
const LETRAS_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I para que no se confundan
const esInvitado = (u) => String(u).startsWith('inv-');
export const maxJugadores = (juego) => JUEGOS[juego]?.max || 2;

export function montarSalas(io) {
  const conectados = new Map(); // usuario -> Set de sockets
  const invitaciones = new Map(); // "de>a" -> { de, a, juego, nombreJuego, sala? }
  const salas = new Map(); // id -> sala
  const salaDe = new Map(); // usuario -> id de su sala
  const ultimaConfig = new Map(); // juego -> última config usada (la próxima sala arranca con esa)

  // Las salas y partidas se guardan en disco en cada cambio: sobreviven a reinicios y deploys.
  const guardador = crearGuardador(() => ({ salas: [...salas.values()], salaDe: [...salaDe], ultimaConfig: [...ultimaConfig] }));

  const canal = (u) => `u:${u}`;
  const aviso = (u, texto) => io.to(canal(u)).emit('aviso', { texto });
  const nombre = (u, sala) => sala?.invitados?.[u] || buscarUsuario(u)?.nombre || u;
  const rivalDe = (sala, u) => sala.jugadores.find((x) => x !== u) ?? null;
  const enJuego = (sala) => sala.partida && sala.partida.estado !== 'terminada';
  const salaPorCodigo = (codigo) => [...salas.values()].find((s) => s.codigo && s.codigo === codigo);

  function nuevoCodigo() {
    for (;;) {
      const c = Array.from({ length: 5 }, () => LETRAS_CODIGO[randomInt(LETRAS_CODIGO.length)]).join('');
      if (!salaPorCodigo(c)) return c;
    }
  }

  function emitirLobby() {
    for (const u of conectados.keys()) {
      if (esInvitado(u)) continue;
      io.to(canal(u)).emit('lobby', {
        yo: u,
        usuarios: todosLosUsuarios()
          .filter((x) => x.usuario !== u)
          .map((x) => {
            const s = salas.get(salaDe.get(x.usuario));
            return { ...x, online: conectados.has(x.usuario), enSala: s ? JUEGOS[s.juego].nombre : null };
          }),
        invitaciones: {
          recibidas: [...invitaciones.values()].filter((i) => i.a === u),
          enviadas: [...invitaciones.values()].filter((i) => i.de === u),
        },
        juegos: Object.entries(JUEGOS).map(([id, j]) => ({ id, nombre: j.nombre, max: maxJugadores(id) })),
        stats: resumen(u),
      });
    }
  }

  function emitirSala(sala) {
    guardador.luego();
    const jugadores = sala.jugadores.map((x) => ({
      id: x,
      nombre: nombre(x, sala),
      online: conectados.has(x),
      enSala: salaDe.get(x) === sala.id,
      invitado: esInvitado(x),
    }));
    for (const j of sala.jugadores) {
      const rival = rivalDe(sala, j);
      io.to(canal(j)).emit('sala', {
        id: sala.id,
        juego: sala.juego,
        nombreJuego: JUEGOS[sala.juego].nombre,
        yo: j,
        rival,
        rivalOnline: rival !== null && conectados.has(rival),
        rivalEnSala: rival !== null && salaDe.get(rival) === sala.id,
        jugadores,
        codigo: sala.codigo || null,
        anfitrion: sala.anfitrion || null,
        max: maxJugadores(sala.juego),
        config: sala.config,
        configDefecto: JUEGOS[sala.juego].mod.CONFIG_DEFECTO,
        listos: [...sala.listos],
        revancha: [...sala.revancha],
        estado: !sala.partida ? 'config' : sala.partida.estado === 'terminada' ? 'terminada' : 'jugando',
        partida: sala.partida ? sala.partida.vistaPara(j) : null,
      });
    }
  }

  function registrarSiTermino(sala) {
    const p = sala.partida;
    if (!p || p.estado !== 'terminada' || p.registrada) return;
    p.registrada = true;
    const nombres = Object.fromEntries(p.jugadores.filter(esInvitado).map((x) => [x, nombre(x, sala)]));
    registrarPartida({ juego: sala.juego, jugadores: p.jugadores, ganador: p.ganador, motivoFin: p.motivoFin, detalle: p.detalleHistorial(), nombres });
    emitirLobby();
  }

  // Al entrar a una sala se descartan las otras invitaciones de esa persona.
  function limpiarInvitaciones(u) {
    for (const [k, inv] of invitaciones) if (inv.de === u || inv.a === u) invitaciones.delete(k);
  }

  function nuevaSala(juego, jugadores, extra = {}) {
    const sala = {
      id: randomUUID(),
      juego,
      jugadores: [...jugadores],
      config: ultimaConfig.get(juego) || JUEGOS[juego].mod.CONFIG_DEFECTO,
      listos: new Set(),
      revancha: new Set(),
      partida: null,
      ...extra,
    };
    salas.set(sala.id, sala);
    for (const j of sala.jugadores) {
      salaDe.set(j, sala.id);
      limpiarInvitaciones(j);
    }
    emitirSala(sala);
    emitirLobby();
    return sala;
  }

  const crearSala = (a, b, juego) => nuevaSala(juego, [a, b]);

  function unirASala(sala, u) {
    if (enJuego(sala)) throw new ErrorJuego('La partida ya empezó: esperá a que termine');
    if (sala.jugadores.includes(u)) return;
    if (sala.jugadores.length >= maxJugadores(sala.juego)) throw new ErrorJuego('La sala está llena');
    sala.partida = null; // si venían de una partida terminada, vuelven todos a la configuración
    sala.revancha.clear();
    sala.jugadores.push(u);
    salaDe.set(u, sala.id);
    limpiarInvitaciones(u);
    for (const j of sala.jugadores) if (j !== u) aviso(j, `${nombre(u, sala)} entró a la sala`);
    emitirSala(sala);
    emitirLobby();
  }

  // Saca a alguien de una sala con código (la sala sigue para los demás).
  function quitarDeSala(sala, u, texto) {
    sala.jugadores = sala.jugadores.filter((x) => x !== u);
    sala.listos.delete(u);
    sala.revancha.delete(u);
    if (salaDe.get(u) === sala.id) salaDe.delete(u);
    if (sala.invitados) delete sala.invitados[u];
    io.to(canal(u)).emit('sala', null);
    if (!sala.jugadores.length) return cerrarSala(sala);
    if (sala.anfitrion === u) sala.anfitrion = sala.jugadores.find((x) => !esInvitado(x)) || sala.jugadores[0];
    sala.partida = null;
    for (const j of sala.jugadores) aviso(j, texto);
    emitirSala(sala);
    emitirLobby();
  }

  // Avisos de la partida que no vienen de una acción (ej. se terminó el tiempo del basta).
  function conectarPartida(sala) {
    sala.partida.notificar = () => {
      registrarSiTermino(sala);
      emitirSala(sala);
    };
  }

  function iniciarPartida(sala) {
    const { Clase } = JUEGOS[sala.juego];
    sala.partida = new Clase(sala.jugadores, sala.config);
    conectarPartida(sala);
    sala.listos.clear();
    sala.revancha.clear();
    ultimaConfig.set(sala.juego, sala.config);
    emitirSala(sala);
  }

  function cerrarSala(sala) {
    salas.delete(sala.id);
    clearTimeout(sala.partida?.timer);
    guardador.luego();
    for (const j of sala.jugadores) {
      if (salaDe.get(j) === sala.id) salaDe.delete(j);
      io.to(canal(j)).emit('sala', null);
    }
    for (const [k, inv] of invitaciones) if (inv.sala === sala.id) invitaciones.delete(k);
    emitirLobby();
  }

  // Al arrancar: vuelven las salas y partidas que había antes de reiniciar.
  const guardado = cargarSalas();
  if (guardado) {
    for (const [juego, cfg] of guardado.ultimaConfig || []) if (JUEGOS[juego]) ultimaConfig.set(juego, cfg);
    for (const datos of guardado.salas || []) {
      if (!JUEGOS[datos.juego]) continue;
      try {
        const sala = { ...datos, partida: null };
        if (datos.partida) {
          // Se crea la partida de nuevo (así tiene sus métodos) y se le pisa el estado guardado.
          const { Clase } = JUEGOS[datos.juego];
          sala.partida = Object.assign(new Clase(datos.partida.jugadores, datos.partida.config), datos.partida);
          conectarPartida(sala);
          sala.partida.reanudar?.();
        }
        salas.set(sala.id, sala);
      } catch (e) {
        console.error('No se pudo restaurar una sala:', e.message);
      }
    }
    for (const [u, id] of guardado.salaDe || []) if (salas.has(id)) salaDe.set(u, id);
    if (salas.size) console.log(`Salas restauradas: ${salas.size}`);
  }

  // Un invitado entra con el código (lo llama POST /api/invitado). Devuelve sus datos para la sesión.
  function unirInvitado(codigo, nombreInv) {
    const sala = codigo ? salaPorCodigo(codigo) : null;
    if (!sala) throw Object.assign(new ErrorJuego('No hay ninguna sala con ese código'), { codigoMal: true });
    const usados = new Set(sala.jugadores.map((x) => nombre(x, sala).toLowerCase()));
    let n = nombreInv;
    for (let i = 2; usados.has(n.toLowerCase()); i++) n = `${nombreInv} ${i}`;
    const id = `inv-${randomUUID().slice(0, 8)}`;
    sala.invitados = { ...(sala.invitados || {}), [id]: n };
    try {
      unirASala(sala, id);
    } catch (e) {
      delete sala.invitados[id];
      throw e;
    }
    return { id, nombre: n, sala: sala.id };
  }

  io.use((socket, next) => {
    const u = usuarioDeCookie(socket.handshake.headers.cookie);
    if (u) {
      socket.data.usuario = u.usuario;
      return next();
    }
    // Un invitado solo existe mientras siga en su sala.
    const inv = invitadoDeCookie(socket.handshake.headers.cookie);
    if (inv && salaDe.get(inv.usuario) === inv.sala) {
      socket.data.usuario = inv.usuario;
      socket.data.invitado = true;
      return next();
    }
    next(new Error(inv ? 'sala-cerrada' : 'sin-sesion'));
  });

  io.on('connection', (socket) => {
    const yo = socket.data.usuario;
    const invitado = !!socket.data.invitado;
    socket.join(canal(yo));
    if (!conectados.has(yo)) conectados.set(yo, new Set());
    conectados.get(yo).add(socket.id);

    const s0 = salas.get(salaDe.get(yo));
    if (s0) emitirSala(s0); // reconexión: vuelve a su sala (y los demás se enteran de que volvió)
    else socket.emit('sala', null);
    emitirLobby();
    if (!invitado) montarChat(io, socket, yo);

    // Envuelve cada evento: los errores de juego vuelven como { error } por el ack, nunca tiran el server.
    const on = (evento, fn, { paraInvitados = true } = {}) =>
      socket.on(evento, (datos, ack) => {
        const responder = typeof ack === 'function' ? ack : () => {};
        try {
          if (invitado && !paraInvitados) throw new ErrorJuego('Los invitados solo pueden jugar en su sala');
          responder(fn(datos || {}) || { ok: true });
        } catch (e) {
          if (!(e instanceof ErrorJuego)) console.error(`Error en ${evento}:`, e);
          responder({ error: e instanceof ErrorJuego ? e.message : 'Error inesperado' });
        }
      });
    const miSala = () => {
      const s = salas.get(salaDe.get(yo));
      if (!s) throw new ErrorJuego('No estás en ninguna sala');
      return s;
    };
    const soloUsuarios = { paraInvitados: false };

    on('invitar', ({ a, juego }) => {
      if (a === yo || !buscarUsuario(a)) throw new ErrorJuego('Jugador desconocido');
      if (!conectados.has(a)) throw new ErrorJuego('No está conectado');
      if (salaDe.has(a)) throw new ErrorJuego('Está en otra sala');
      // Desde una sala con código: lo invita a sumarse a esa sala.
      const mia = salas.get(salaDe.get(yo));
      if (mia) {
        if (!mia.codigo) throw new ErrorJuego('Salí de tu sala primero');
        if (mia.jugadores.length >= maxJugadores(mia.juego)) throw new ErrorJuego('La sala está llena');
        invitaciones.set(`${yo}>${a}`, { de: yo, a, juego: mia.juego, nombreJuego: JUEGOS[mia.juego].nombre, sala: mia.id });
        return emitirLobby();
      }
      if (!JUEGOS[juego]) throw new ErrorJuego('Juego desconocido');
      // Si el otro ya me había invitado al mismo juego, se acepta directo.
      const suya = invitaciones.get(`${a}>${yo}`);
      if (suya && suya.juego === juego && !suya.sala) return void crearSala(a, yo, juego);
      invitaciones.set(`${yo}>${a}`, { de: yo, a, juego, nombreJuego: JUEGOS[juego].nombre });
      emitirLobby();
    }, soloUsuarios);

    on('cancelarInvitacion', ({ a }) => {
      invitaciones.delete(`${yo}>${a}`);
      emitirLobby();
    }, soloUsuarios);

    on('responder', ({ de, acepta }) => {
      const inv = invitaciones.get(`${de}>${yo}`);
      if (!inv) throw new ErrorJuego('La invitación ya no existe');
      invitaciones.delete(`${de}>${yo}`);
      if (!acepta) {
        aviso(de, `${nombre(yo)} no quiso jugar ahora`);
        return emitirLobby();
      }
      if (salaDe.has(yo)) throw new ErrorJuego('Salí de tu sala primero');
      if (inv.sala) {
        const s = salas.get(inv.sala);
        if (!s) throw new ErrorJuego('Esa sala ya se cerró');
        return unirASala(s, yo);
      }
      if (salaDe.has(de)) throw new ErrorJuego('Ya está en otra sala');
      crearSala(de, yo, inv.juego);
    }, soloUsuarios);

    // Sala con código: la crea uno y la comparte (con usuarios del sitio o con invitados).
    on('crearConCodigo', ({ juego }) => {
      if (!JUEGOS[juego]) throw new ErrorJuego('Juego desconocido');
      if (salaDe.has(yo)) throw new ErrorJuego('Salí de tu sala primero');
      const s = nuevaSala(juego, [yo], { codigo: nuevoCodigo(), anfitrion: yo, invitados: {} });
      return { ok: true, codigo: s.codigo };
    }, soloUsuarios);

    on('unirmeConCodigo', ({ codigo }) => {
      const s = salaPorCodigo(String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
      if (!s) throw new ErrorJuego('No hay ninguna sala con ese código');
      if (salaDe.has(yo) && salaDe.get(yo) !== s.id) throw new ErrorJuego('Salí de tu sala primero');
      unirASala(s, yo);
    }, soloUsuarios);

    on('expulsar', ({ jugador }) => {
      const s = miSala();
      if (!s.codigo || s.anfitrion !== yo) throw new ErrorJuego('Solo el que armó la sala puede sacar gente');
      if (jugador === yo || !s.jugadores.includes(jugador)) throw new ErrorJuego('Jugador inválido');
      if (enJuego(s)) throw new ErrorJuego('Esperá a que termine la partida');
      aviso(jugador, 'Te sacaron de la sala');
      quitarDeSala(s, jugador, `${nombre(jugador, s)} ya no está en la sala`);
    });

    on('configurar', ({ config }) => {
      const s = miSala();
      if (s.codigo && s.anfitrion !== yo) throw new ErrorJuego('Las reglas las elige el que armó la sala');
      if (s.partida && s.partida.estado !== 'terminada') throw new ErrorJuego('No se pueden cambiar las reglas en medio de la partida');
      s.config = JUEGOS[s.juego].mod.validarConfig(config);
      s.partida = null;
      s.listos.clear(); // reglas nuevas: todos tienen que volver a confirmar
      emitirSala(s);
    });

    on('listo', ({ listo = true }) => {
      const s = miSala();
      if (s.partida) throw new ErrorJuego('La partida ya empezó');
      if (listo) s.listos.add(yo);
      else s.listos.delete(yo);
      if (s.jugadores.length >= 2 && s.jugadores.every((j) => s.listos.has(j))) return iniciarPartida(s);
      emitirSala(s);
    });

    on('accion', ({ tipo, datos }) => {
      const s = miSala();
      if (!enJuego(s)) throw new ErrorJuego('La partida no está en juego');
      const r = s.partida.accion(yo, String(tipo), datos || {});
      registrarSiTermino(s);
      emitirSala(s);
      // Los juegos de adivinar contestan si acertaste (para sacudir el campo si no).
      return r && typeof r === 'object' && 'acierto' in r ? { ok: true, acierto: r.acierto } : undefined;
    });

    on('abandonar', () => {
      const s = miSala();
      if (!enJuego(s)) throw new ErrorJuego('No hay partida en juego');
      s.partida.abandonar(yo);
      registrarSiTermino(s);
      emitirSala(s);
    });

    on('revancha', () => {
      const s = miSala();
      if (s.partida?.estado !== 'terminada') throw new ErrorJuego('La partida no terminó');
      s.revancha.add(yo);
      if (s.jugadores.every((j) => s.revancha.has(j))) return iniciarPartida(s);
      emitirSala(s);
    });

    // Vuelve todos a la configuración (para cambiar las reglas después de una partida).
    on('volverAConfig', () => {
      const s = miSala();
      if (enJuego(s)) throw new ErrorJuego('Terminá la partida primero');
      s.partida = null;
      s.listos.clear();
      s.revancha.clear();
      emitirSala(s);
    });

    // Emoticón para los demás: les aparece grande en pantalla. Con freno para que no sea spam.
    let ultimoEmote = 0;
    on('emote', ({ id }) => {
      const s = miSala();
      if (!EMOTES.includes(id)) throw new ErrorJuego('Emoticón desconocido');
      if (Date.now() - ultimoEmote < 1200) throw new ErrorJuego('Más despacio');
      ultimoEmote = Date.now();
      for (const j of s.jugadores) io.to(canal(j)).emit('emote', { de: yo, nombre: nombre(yo, s), id, n: Date.now() });
    });

    on('salir', () => {
      const s = miSala();
      if (enJuego(s)) throw new ErrorJuego('Para salir tenés que abandonar la partida');
      if (s.codigo) return quitarDeSala(s, yo, `${nombre(yo, s)} salió de la sala`);
      const rival = rivalDe(s, yo);
      if (rival) aviso(rival, `${nombre(yo)} salió de la sala`);
      cerrarSala(s);
    });

    socket.on('disconnect', () => {
      const set = conectados.get(yo);
      set?.delete(socket.id);
      if (set && set.size === 0) {
        conectados.delete(yo);
        // Las invitaciones de alguien desconectado ya no tienen sentido.
        limpiarInvitaciones(yo);
        const s = salas.get(salaDe.get(yo));
        if (s) emitirSala(s);
        emitirLobby();
      }
    });
  });

  // Para que el resto de la app avise cambios (ej. alguien cambió su nombre o su foto).
  return {
    guardarYa: () => guardador.ya(),
    unirInvitado,
    refrescar() {
      emitirLobby();
      for (const s of salas.values()) emitirSala(s);
    },
  };
}
