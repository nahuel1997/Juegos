import { randomUUID } from 'node:crypto';
import { usuarioDeCookie, todosLosUsuarios, buscarUsuario } from './auth.js';
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
import { registrarPartida, resumen } from './historial.js';
import { montarChat } from './chat.js';
import { cargarSalas, crearGuardador } from './persistencia.js';

// Juegos disponibles. Para sumar uno: un módulo con CONFIG_DEFECTO, validarConfig y una clase de
// partida (accion, abandonar, vistaPara, detalleHistorial), y su entrada acá.
export const JUEGOS = {
  'batalla-naval': { nombre: 'Batalla naval', mod: batallaNaval, Clase: batallaNaval.PartidaBatallaNaval },
  ahorcado: { nombre: 'Ahorcado', mod: ahorcado, Clase: ahorcado.PartidaAhorcado },
  'tuti-fruti': { nombre: 'Tuti fruti', mod: tutiFruti, Clase: tutiFruti.PartidaTutiFruti },
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
};

// Emoticones que se pueden mandar en una sala (los dibujos están en web/src/iconos.jsx).
export const EMOTES = ['fuckyou', 'risa', 'llanto', 'enojo', 'beso', 'corazon', 'fuego', 'aplauso', 'facha', 'pulgar', 'sorpresa', 'caca', 'ojitos'];

// Una sala = dos jugadores y un juego. Arranca en configuración (reglas editables por los dos,
// en vivo); cuando los dos están listos empieza la partida. Al terminar: revancha, reglas o salir.
export function montarSalas(io) {
  const conectados = new Map(); // usuario -> Set de sockets
  const invitaciones = new Map(); // "de>a" -> { de, a, juego, nombreJuego }
  const salas = new Map(); // id -> sala
  const salaDe = new Map(); // usuario -> id de su sala
  const ultimaConfig = new Map(); // juego -> última config usada (la próxima sala arranca con esa)

  // Las salas y partidas se guardan en disco en cada cambio: sobreviven a reinicios y deploys.
  const guardador = crearGuardador(() => ({ salas: [...salas.values()], salaDe: [...salaDe], ultimaConfig: [...ultimaConfig] }));

  const canal = (u) => `u:${u}`;
  const aviso = (u, texto) => io.to(canal(u)).emit('aviso', { texto });
  const nombre = (u) => buscarUsuario(u)?.nombre || u;
  const rivalDe = (sala, u) => sala.jugadores.find((x) => x !== u);
  const enJuego = (sala) => sala.partida && sala.partida.estado !== 'terminada';

  function emitirLobby() {
    for (const u of conectados.keys()) {
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
        juegos: Object.entries(JUEGOS).map(([id, j]) => ({ id, nombre: j.nombre })),
        stats: resumen(u),
      });
    }
  }

  function emitirSala(sala) {
    guardador.luego();
    for (const j of sala.jugadores) {
      const rival = rivalDe(sala, j);
      io.to(canal(j)).emit('sala', {
        id: sala.id,
        juego: sala.juego,
        nombreJuego: JUEGOS[sala.juego].nombre,
        yo: j,
        rival,
        rivalOnline: conectados.has(rival),
        rivalEnSala: salaDe.get(rival) === sala.id,
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
    registrarPartida({ juego: sala.juego, jugadores: p.jugadores, ganador: p.ganador, motivoFin: p.motivoFin, detalle: p.detalleHistorial() });
    emitirLobby();
  }

  function crearSala(a, b, juego) {
    const sala = {
      id: randomUUID(),
      juego,
      jugadores: [a, b],
      config: ultimaConfig.get(juego) || JUEGOS[juego].mod.CONFIG_DEFECTO,
      listos: new Set(),
      revancha: new Set(),
      partida: null,
    };
    salas.set(sala.id, sala);
    for (const j of [a, b]) {
      salaDe.set(j, sala.id);
      // Al entrar a una sala se descartan otras invitaciones de los dos.
      for (const [k, inv] of invitaciones) if (inv.de === j || inv.a === j) invitaciones.delete(k);
    }
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
    guardador.luego();
    for (const j of sala.jugadores) {
      if (salaDe.get(j) === sala.id) salaDe.delete(j);
      io.to(canal(j)).emit('sala', null);
    }
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

  io.use((socket, next) => {
    const u = usuarioDeCookie(socket.handshake.headers.cookie);
    if (!u) return next(new Error('sin-sesion'));
    socket.data.usuario = u.usuario;
    next();
  });

  io.on('connection', (socket) => {
    const yo = socket.data.usuario;
    socket.join(canal(yo));
    if (!conectados.has(yo)) conectados.set(yo, new Set());
    conectados.get(yo).add(socket.id);

    const s0 = salas.get(salaDe.get(yo));
    if (s0) emitirSala(s0); // reconexión: vuelve a su sala (y el rival se entera de que volvió)
    else socket.emit('sala', null);
    emitirLobby();
    montarChat(io, socket, yo);

    // Envuelve cada evento: los errores de juego vuelven como { error } por el ack, nunca tiran el server.
    const on = (evento, fn) =>
      socket.on(evento, (datos, ack) => {
        const responder = typeof ack === 'function' ? ack : () => {};
        try {
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

    on('invitar', ({ a, juego }) => {
      if (!JUEGOS[juego]) throw new ErrorJuego('Juego desconocido');
      if (a === yo || !buscarUsuario(a)) throw new ErrorJuego('Jugador desconocido');
      if (!conectados.has(a)) throw new ErrorJuego('No está conectado');
      if (salaDe.has(yo)) throw new ErrorJuego('Salí de tu sala primero');
      if (salaDe.has(a)) throw new ErrorJuego('Está en otra sala');
      // Si el otro ya me había invitado al mismo juego, se acepta directo.
      const suya = invitaciones.get(`${a}>${yo}`);
      if (suya && suya.juego === juego) return crearSala(a, yo, juego);
      invitaciones.set(`${yo}>${a}`, { de: yo, a, juego, nombreJuego: JUEGOS[juego].nombre });
      emitirLobby();
    });

    on('cancelarInvitacion', ({ a }) => {
      invitaciones.delete(`${yo}>${a}`);
      emitirLobby();
    });

    on('responder', ({ de, acepta }) => {
      const inv = invitaciones.get(`${de}>${yo}`);
      if (!inv) throw new ErrorJuego('La invitación ya no existe');
      invitaciones.delete(`${de}>${yo}`);
      if (!acepta) {
        aviso(de, `${nombre(yo)} no quiso jugar ahora`);
        return emitirLobby();
      }
      if (salaDe.has(de)) throw new ErrorJuego('Ya está en otra sala');
      crearSala(de, yo, inv.juego);
    });

    on('configurar', ({ config }) => {
      const s = miSala();
      if (s.partida && s.partida.estado !== 'terminada') throw new ErrorJuego('No se pueden cambiar las reglas en medio de la partida');
      s.config = JUEGOS[s.juego].mod.validarConfig(config);
      s.partida = null;
      s.listos.clear(); // reglas nuevas: los dos tienen que volver a confirmar
      emitirSala(s);
    });

    on('listo', ({ listo = true }) => {
      const s = miSala();
      if (s.partida) throw new ErrorJuego('La partida ya empezó');
      if (listo) s.listos.add(yo);
      else s.listos.delete(yo);
      if (s.listos.size === 2) return iniciarPartida(s);
      emitirSala(s);
    });

    on('accion', ({ tipo, datos }) => {
      const s = miSala();
      if (!enJuego(s)) throw new ErrorJuego('La partida no está en juego');
      s.partida.accion(yo, String(tipo), datos || {});
      registrarSiTermino(s);
      emitirSala(s);
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
      if (s.revancha.size === 2) return iniciarPartida(s);
      emitirSala(s);
    });

    // Vuelve los dos a la configuración (para cambiar las reglas después de una partida).
    on('volverAConfig', () => {
      const s = miSala();
      if (enJuego(s)) throw new ErrorJuego('Terminá la partida primero');
      s.partida = null;
      s.listos.clear();
      s.revancha.clear();
      emitirSala(s);
    });

    // Emoticón para el rival: le aparece grande en pantalla. Con freno para que no sea spam.
    let ultimoEmote = 0;
    on('emote', ({ id }) => {
      const s = miSala();
      if (!EMOTES.includes(id)) throw new ErrorJuego('Emoticón desconocido');
      if (Date.now() - ultimoEmote < 1200) throw new ErrorJuego('Más despacio');
      ultimoEmote = Date.now();
      for (const j of s.jugadores) io.to(canal(j)).emit('emote', { de: yo, id, n: Date.now() });
    });

    on('salir', () => {
      const s = miSala();
      if (enJuego(s)) throw new ErrorJuego('Para salir tenés que abandonar la partida');
      aviso(rivalDe(s, yo), `${nombre(yo)} salió de la sala`);
      cerrarSala(s);
    });

    socket.on('disconnect', () => {
      const set = conectados.get(yo);
      set?.delete(socket.id);
      if (set && set.size === 0) {
        conectados.delete(yo);
        // Las invitaciones de alguien desconectado ya no tienen sentido.
        for (const [k, inv] of invitaciones) if (inv.de === yo || inv.a === yo) invitaciones.delete(k);
        const s = salas.get(salaDe.get(yo));
        if (s) emitirSala(s);
        emitirLobby();
      }
    });
  });

  // Para que el resto de la app avise cambios (ej. alguien cambió su nombre o su foto).
  return {
    guardarYa: () => guardador.ya(),
    refrescar() {
      emitirLobby();
      for (const s of salas.values()) emitirSala(s);
    },
  };
}
