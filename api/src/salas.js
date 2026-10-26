import { randomUUID } from 'node:crypto';
import { usuarioDeCookie, todosLosUsuarios, buscarUsuario } from './auth.js';
import { ErrorJuego } from './juegos/comun.js';
import * as batallaNaval from './juegos/batallaNaval.js';
import * as ahorcado from './juegos/ahorcado.js';
import * as tutiFruti from './juegos/tutiFruti.js';
import * as generala from './juegos/generala.js';
import * as escoba from './juegos/escoba.js';
import { registrarPartida, resumen } from './historial.js';
import { montarChat } from './chat.js';

// Juegos disponibles. Para sumar uno: un módulo con CONFIG_DEFECTO, validarConfig y una clase de
// partida (accion, abandonar, vistaPara, detalleHistorial), y su entrada acá.
export const JUEGOS = {
  'batalla-naval': { nombre: 'Batalla naval', mod: batallaNaval, Clase: batallaNaval.PartidaBatallaNaval },
  ahorcado: { nombre: 'Ahorcado', mod: ahorcado, Clase: ahorcado.PartidaAhorcado },
  'tuti-fruti': { nombre: 'Tuti fruti', mod: tutiFruti, Clase: tutiFruti.PartidaTutiFruti },
  generala: { nombre: 'Generala', mod: generala, Clase: generala.PartidaGenerala },
  escoba: { nombre: 'Escoba del 15', mod: escoba, Clase: escoba.PartidaEscoba },
};

// Una sala = dos jugadores y un juego. Arranca en configuración (reglas editables por los dos,
// en vivo); cuando los dos están listos empieza la partida. Al terminar: revancha, reglas o salir.
export function montarSalas(io) {
  const conectados = new Map(); // usuario -> Set de sockets
  const invitaciones = new Map(); // "de>a" -> { de, a, juego, nombreJuego }
  const salas = new Map(); // id -> sala
  const salaDe = new Map(); // usuario -> id de su sala
  const ultimaConfig = new Map(); // juego -> última config usada (la próxima sala arranca con esa)

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

  function iniciarPartida(sala) {
    const { Clase } = JUEGOS[sala.juego];
    sala.partida = new Clase(sala.jugadores, sala.config);
    sala.partida.notificar = () => {
      registrarSiTermino(sala);
      emitirSala(sala);
    };
    sala.listos.clear();
    sala.revancha.clear();
    ultimaConfig.set(sala.juego, sala.config);
    emitirSala(sala);
  }

  function cerrarSala(sala) {
    salas.delete(sala.id);
    for (const j of sala.jugadores) {
      if (salaDe.get(j) === sala.id) salaDe.delete(j);
      io.to(canal(j)).emit('sala', null);
    }
    emitirLobby();
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
    refrescar() {
      emitirLobby();
      for (const s of salas.values()) emitirSala(s);
    },
  };
}
