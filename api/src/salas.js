import { randomUUID } from 'node:crypto';
import { usuarioDeCookie, todosLosUsuarios, buscarUsuario } from './auth.js';
import { PartidaBatallaNaval, ErrorJuego } from './juegos/batallaNaval.js';
import { registrarPartida, resumen } from './historial.js';

// Juegos disponibles. Para sumar uno: una clase con colocar/abandonar/vistaPara y su entrada acá.
export const JUEGOS = {
  'batalla-naval': { nombre: 'Batalla naval', crear: (a, b) => new PartidaBatallaNaval(a, b) },
};

export function montarSalas(io) {
  const conectados = new Map(); // usuario -> Set de sockets
  const invitaciones = new Map(); // "de>a" -> { de, a, juego }
  const partidas = new Map(); // id -> partida
  const partidaDe = new Map(); // usuario -> id de su partida actual
  const revanchas = new Map(); // id de partida -> Set de usuarios que la pidieron

  const sala = (u) => `u:${u}`;
  const aviso = (u, texto) => io.to(sala(u)).emit('aviso', { texto });

  function emitirLobby() {
    for (const u of conectados.keys()) {
      io.to(sala(u)).emit('lobby', {
        yo: u,
        usuarios: todosLosUsuarios()
          .filter((x) => x.usuario !== u)
          .map((x) => ({ ...x, online: conectados.has(x.usuario), jugando: partidaActiva(x.usuario) })),
        invitaciones: {
          recibidas: [...invitaciones.values()].filter((i) => i.a === u),
          enviadas: [...invitaciones.values()].filter((i) => i.de === u),
        },
        juegos: Object.entries(JUEGOS).map(([id, j]) => ({ id, nombre: j.nombre })),
        stats: resumen(u),
      });
    }
  }

  function partidaActiva(u) {
    const p = partidas.get(partidaDe.get(u));
    return !!p && p.estado !== 'terminada';
  }

  function emitirPartida(p) {
    for (const j of p.jugadores) {
      io.to(sala(j)).emit('partida', {
        id: p.id,
        ...p.vistaPara(j),
        revancha: [...(revanchas.get(p.id) || [])],
        rivalOnline: conectados.has(p.rival(j)),
      });
    }
  }

  function terminarSiCorresponde(p) {
    if (p.estado !== 'terminada' || p.registrada) return;
    p.registrada = true;
    registrarPartida({
      juego: p.juego,
      jugadores: p.jugadores,
      ganador: p.ganador,
      motivoFin: p.motivoFin,
      disparos: Object.fromEntries(p.jugadores.map((j) => [j, p.disparos[j].size])),
    });
  }

  function iniciarPartida(a, b, juego) {
    const p = JUEGOS[juego].crear(a, b);
    p.id = randomUUID();
    partidas.set(p.id, p);
    for (const j of [a, b]) {
      const anterior = partidaDe.get(j);
      if (anterior && anterior !== p.id) limpiarSiNadieLaUsa(anterior, j);
      partidaDe.set(j, p.id);
      // Al arrancar se descartan otras invitaciones de los dos.
      for (const [k, inv] of invitaciones) if (inv.de === j || inv.a === j) invitaciones.delete(k);
    }
    emitirPartida(p);
    emitirLobby();
  }

  function limpiarSiNadieLaUsa(id, saliente) {
    const p = partidas.get(id);
    if (!p) return;
    if (p.jugadores.every((j) => j === saliente || partidaDe.get(j) !== id)) {
      partidas.delete(id);
      revanchas.delete(id);
    }
  }

  io.use((socket, next) => {
    const u = usuarioDeCookie(socket.handshake.headers.cookie);
    if (!u) return next(new Error('sin-sesion'));
    socket.data.usuario = u.usuario;
    next();
  });

  io.on('connection', (socket) => {
    const yo = socket.data.usuario;
    socket.join(sala(yo));
    const primera = !conectados.has(yo);
    if (primera) conectados.set(yo, new Set());
    conectados.get(yo).add(socket.id);

    const p0 = partidas.get(partidaDe.get(yo));
    if (p0) emitirPartida(p0); // reconexión: vuelve a su partida (y el rival se entera de que volvió)
    else socket.emit('partida', null);
    emitirLobby();

    // Envuelve cada evento: errores de juego vuelven como { error } por el ack, nunca tiran el server.
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
    const miPartida = () => {
      const p = partidas.get(partidaDe.get(yo));
      if (!p) throw new ErrorJuego('No estás en ninguna partida');
      return p;
    };

    on('invitar', ({ a, juego = 'batalla-naval' }) => {
      if (!JUEGOS[juego]) throw new ErrorJuego('Juego desconocido');
      if (a === yo || !buscarUsuario(a)) throw new ErrorJuego('Jugador desconocido');
      if (!conectados.has(a)) throw new ErrorJuego('No está conectado');
      if (partidaActiva(yo)) throw new ErrorJuego('Terminá tu partida primero');
      if (partidaActiva(a)) throw new ErrorJuego('Está jugando otra partida');
      // Si el otro ya me había invitado, se acepta directo.
      if (invitaciones.has(`${a}>${yo}`)) return iniciarPartida(a, yo, invitaciones.get(`${a}>${yo}`).juego);
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
        aviso(de, `${buscarUsuario(yo).nombre} no quiso jugar ahora`);
        return emitirLobby();
      }
      if (partidaActiva(de)) throw new ErrorJuego('Ya está jugando otra partida');
      iniciarPartida(de, yo, inv.juego);
    });

    on('colocar', ({ barcos }) => {
      const p = miPartida();
      p.colocar(yo, barcos);
      emitirPartida(p);
    });

    on('disparar', ({ fila, col }) => {
      const p = miPartida();
      p.disparar(yo, fila, col);
      terminarSiCorresponde(p);
      emitirPartida(p);
      if (p.estado === 'terminada') emitirLobby();
    });

    on('abandonar', () => {
      const p = miPartida();
      p.abandonar(yo);
      terminarSiCorresponde(p);
      emitirPartida(p);
      emitirLobby();
    });

    on('revancha', () => {
      const p = miPartida();
      if (p.estado !== 'terminada') throw new ErrorJuego('La partida no terminó');
      const rival = p.rival(yo);
      if (partidaDe.get(rival) !== p.id) throw new ErrorJuego('Tu rival ya se fue de la partida');
      const pedidos = revanchas.get(p.id) || new Set();
      pedidos.add(yo);
      revanchas.set(p.id, pedidos);
      if (pedidos.size === 2) return iniciarPartida(p.jugadores[0], p.jugadores[1], p.juego);
      emitirPartida(p);
    });

    on('salir', () => {
      const id = partidaDe.get(yo);
      const p = partidas.get(id);
      if (p && p.estado !== 'terminada') throw new ErrorJuego('Para salir tenés que abandonar la partida');
      partidaDe.delete(yo);
      limpiarSiNadieLaUsa(id, yo);
      if (p) emitirPartida(p);
      socket.emit('partida', null);
      emitirLobby();
    });

    socket.on('disconnect', () => {
      const set = conectados.get(yo);
      set?.delete(socket.id);
      if (set && set.size === 0) {
        conectados.delete(yo);
        // Las invitaciones de alguien desconectado ya no tienen sentido.
        for (const [k, inv] of invitaciones) if (inv.de === yo || inv.a === yo) invitaciones.delete(k);
        const p = partidas.get(partidaDe.get(yo));
        if (p) emitirPartida(p);
        emitirLobby();
      }
    });
  });
}
