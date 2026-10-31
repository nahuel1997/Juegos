// Jugadas de un bot simple para cada juego, a partir de lo que ve un jugador (vistaPara).
// Lo usan el bot de pruebas (scripts/bot-rival.mjs) y la simulación de la vista previa del front.
// Devuelve la acción a hacer ({ tipo, datos }) o nada si no le toca.
import { flotaAlAzar } from './juegos/batallaNaval.js';
import { PALABRAS } from './juegos/stopPalabras.js';
import { distancias, vecinos } from './juegos/gatoRaton.js';
import { mejorArreglo } from './juegos/chinchon.js';
import { evaluar } from './juegos/mastermind.js';
import { PALABRAS as DIBUJOS } from './juegos/dibujar.js';
import { jerarquia } from './juegos/truco.js';
import { DIRS as DIRS_TRON } from './juegos/tron.js';
import { resolver as resolverBotellas, cuantoVuelca } from './juegos/botellas.js';
import { CANCIONES } from './juegos/emojis.js';

const azar = (n) => Math.floor(Math.random() * n);
const accion = (tipo, datos) => ({ tipo, datos });

// Resuelve un sudoku (para que el bot juegue el duelo).
function resolverSudoku(g) {
  const puede = (f, c, n) => {
    for (let i = 0; i < 9; i++) if (g[f][i] === n || g[i][c] === n) return false;
    const bf = f - (f % 3); const bc = c - (c % 3);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) if (g[bf + i][bc + k] === n) return false;
    return true;
  };
  for (let i = 0; i < 81; i++) {
    const f = Math.floor(i / 9); const c = i % 9;
    if (g[f][c]) continue;
    for (let n = 1; n <= 9; n++) {
      if (!puede(f, c, n)) continue;
      g[f][c] = n;
      if (resolverSudoku(g)) return true;
      g[f][c] = 0;
    }
    return false;
  }
  return true;
}
let solucionSudoku = null;
// Lo que vio cada bot de la secuencia del Simón (mientras repite ya no se ve).
const memoriaSimon = new Map();
// Plan de cada bot en las botellas (si recalcula en cada movida puede dar vueltas en círculo).
const planesBotellas = new Map();

// espera(ms): cuánto "piensa" el bot (en la simulación se puede saltear).
export async function jugadaBot(juego, p, yo, { rival, espera = () => Promise.resolve() } = {}) {
  switch (juego) {
    case 'batalla-naval':
      if (p.estado === 'colocando' && !p.listo.yo) return accion('colocar', { barcos: flotaAlAzar(p.flota, p.filas, p.columnas, { pegados: p.pegados }) });
      if (p.estado === 'jugando' && p.turno === yo) {
        const hechos = new Set(p.misDisparos.map((d) => `${d.fila},${d.col}`));
        let f, c;
        do { f = azar(p.filas); c = azar(p.columnas); } while (hechos.has(`${f},${c}`));
        return accion('disparar', { fila: f, col: c });
      }
      return;
    case 'ahorcado': {
      const r = p.ronda;
      if (r.fase === 'eligiendo' && !r.adivinoYo) return accion('palabra', { palabra: ['DULCE DE LECHE', 'MARIPOSA', 'GUITARRA', 'ELEFANTE'][azar(4)], pista: 'la eligió el bot' });
      if (r.fase === 'adivinando' && r.adivinoYo) {
        const libres = [...'AEIOSRNLTCDMUP'].filter((l) => !r.letras.includes(l));
        return accion('letra', { letra: libres[0] || 'Z' });
      }
      return;
    }
    case 'tuti-fruti': {
      const ronda = p.rondas[p.rondas.length - 1];
      if (p.fase === 'escribiendo' || (p.fase === 'basta' && p.bastaPor !== yo)) {
        await new Promise((ok) => setTimeout(ok, (p.arrancaEnMs || 0) + 2500));
        return accion('basta', { valores: p.config.columnas.map((c) => `${ronda.letra}${c.toLowerCase().slice(1, 5)}`) });
      }
      if (p.fase === 'puntuando' && !p.confirmados.includes(yo) && p.confirmados.includes(rival)) return accion('confirmar');
      return;
    }
    case 'generala': {
      if (p.turno !== yo) return;
      if (p.tiros === 0) return accion('tirar');
      const libres = p.categorias.filter((c) => p.planillas.yo[c.id] === undefined);
      const mejor = libres.sort((a, b) => (p.posibles[b.id] || 0) - (p.posibles[a.id] || 0))[0];
      return accion('anotar', { categoria: mejor.id });
    }
    case 'escoba':
      if (p.fase === 'resumen') return p.listosSiguiente.includes(yo) ? undefined : accion('siguiente');
      if (p.turno !== yo) return;
      for (const carta of p.miMano) {
        for (let m = 1; m < 1 << p.mesa.length; m++) {
          const sel = p.mesa.filter((_, i) => m & (1 << i));
          if (carta.valor + sel.reduce((t, x) => t + x.valor, 0) === 15) return accion('jugar', { carta: carta.id, levantar: sel.map((x) => x.id) });
        }
      }
      return accion('jugar', { carta: p.miMano[0].id });
    case 'cuatro-en-linea': {
      if (p.turno !== yo) return;
      const libres = p.tablero[0].map((v, c) => (v === null ? c : -1)).filter((c) => c >= 0);
      return accion('soltar', { col: libres[azar(libres.length)] });
    }
    case 'piedra-papel-tijera':
      if (p.miEleccion) return;
      await espera(1200);
      return accion('elegir', { jugada: p.opciones[azar(p.opciones.length)] });
    case 'damas':
      if (p.turno !== yo || !p.movidas.length) return;
      {
        const comer = p.movidas.filter((m) => m.come);
        const lista = comer.length ? comer : p.movidas;
        const m = lista[azar(lista.length)];
        return accion('mover', { de: m.de, a: m.a });
      }
    case 'memotest': {
      if (p.turno !== yo || p.mirando) return;
      const tapadas = p.cartas.map((c, i) => (c.dibujo ? -1 : i)).filter((i) => i >= 0);
      return accion('voltear', { i: tapadas[azar(tapadas.length)] });
    }
    case 'stop-palabras':
      if (p.fase === 'resultado') return p.listos.includes(yo) ? undefined : accion('siguiente');
      if (p.mio.terminado) return;
      await espera(2500);
      {
        const lista = PALABRAS[p.config.largo];
        return accion('intentar', { palabra: lista[azar(lista.length)] });
      }
    case 'domino':
      if (p.fase === 'resumen') return p.listos.includes(yo) ? undefined : accion('siguiente');
      if (p.turno !== yo) return;
      {
        const f = p.jugables.find((x) => x.lados.length);
        if (f) return accion('jugar', { ficha: f.id, lado: f.lados[0] });
        return accion(p.puedeRobar ? 'robar' : 'pasar');
      }
    case 'ludo':
      if (p.turno !== yo) return;
      if (!p.dado) return accion('tirar');
      return accion('mover', { pieza: p.movibles.findIndex(Boolean) });
    case 'quien-es-quien': {
      // Responde según su personaje si la pregunta coincide con una sugerida; si no, al azar.
      if (p.pendiente && !p.pendiente.mia) {
        const mio = p.personajes[p.miSecreto];
        let si = Math.random() < 0.5;
        for (const [at, v] of Object.entries(p.preguntas)) for (const [val, txt] of Object.entries(v.valores)) if (txt === p.pendiente.texto) si = mio[at] === val;
        await espera(1200);
        return accion('responder', { si });
      }
      if (p.turno !== yo || p.pendiente) return;
      const attrs = Object.keys(p.preguntas);
      const at = attrs[azar(attrs.length)];
      const vals = Object.values(p.preguntas[at].valores);
      return accion('preguntar', { texto: vals[azar(vals.length)] });
    }
    case 'pool': {
      if (p.turno !== yo) return;
      await espera(2500);
      const blanca = p.bolas.find((b) => b.n === 0);
      const otras = p.bolas.filter((b) => b.en && b.n !== 0);
      const obj = otras[azar(otras.length)];
      return accion('tirar', { angulo: Math.atan2(obj.y - blanca.y, obj.x - blanca.x), fuerza: 0.5 + Math.random() * 0.4 });
    }
    case 'penales':
      if (p.yaElegi) return;
      await espera(1200);
      return accion('elegir', { zona: azar(p.config.zonas) });
    case 'uno': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'resumen') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      if (p.sinUno === 'rival') return accion('acusar');
      if (p.sinUno === 'yo' && Math.random() < 0.5) return accion('uno');
      if (p.turno !== yo) return;
      await espera(900);
      // A veces se olvida de decir UNO (para probar el castigo).
      if (p.miMano.length === 2 && !p.dijoUno && Math.random() < 0.6) return accion('uno');
      const va = (c) => c.color === 'negro' || c.color === p.color || c.valor === p.tope.valor;
      const opciones = p.miMano.filter((c) => (p.robada ? c.id === p.robada : va(c)));
      if (!opciones.length) return p.robada ? accion('pasar') : accion('robar');
      // Primero las de color, los comodines al final.
      opciones.sort((a, b) => (a.color === 'negro') - (b.color === 'negro'));
      const c = opciones[0];
      const colores = ['rojo', 'amarillo', 'verde', 'azul'];
      const color = colores.sort((a, b) => p.miMano.filter((x) => x.color === b).length - p.miMano.filter((x) => x.color === a).length)[0];
      return accion('jugar', { carta: c.id, color });
    }
    case 'chinchon': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'resumen') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      if (p.turno !== yo) return;
      await espera(900);
      if (p.paso === 'robar') {
        // Levanta del pozo si le baja lo suelto; si no, del mazo.
        const sin = mejorArreglo(p.miMano, p.config).puntos;
        const con = p.tope ? Math.min(...[...p.miMano, p.tope].map((_, i, todas) => mejorArreglo(todas.filter((__, k) => k !== i), p.config).puntos)) : Infinity;
        return accion('robar', { de: con < sin ? 'pozo' : 'mazo' });
      }
      const mejor = [...p.cortes].sort((a, b) => a.puntos - b.puntos)[0];
      return accion(mejor.puntos <= 5 ? 'cortar' : 'tirar', { carta: mejor.id });
    }
    case 'tateti': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'fin') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      if (p.turno !== yo) return;
      await espera(700);
      const libres = []; const mias = [];
      p.tablero.forEach((fila, f) => fila.forEach((v, c) => { if (!v) libres.push([f, c]); else if (v === 'yo') mias.push([f, c]); }));
      const [f, c] = libres[azar(libres.length)];
      return accion('poner', { fila: f, col: c, desde: p.moviendo ? mias[azar(mias.length)] : undefined });
    }
    case 'cajitas': {
      if (p.estado !== 'jugando' || p.turno !== yo) return;
      await espera(600);
      const lados = (f, c) => [p.h[f][c], p.h[f + 1][c], p.v[f][c], p.v[f][c + 1]].filter(Boolean).length;
      const libres = [];
      p.h.forEach((fila, f) => fila.forEach((x, c) => { if (!x) libres.push({ tipo: 'h', f, c, cajas: [[f - 1, c], [f, c]] }); }));
      p.v.forEach((fila, f) => fila.forEach((x, c) => { if (!x) libres.push({ tipo: 'v', f, c, cajas: [[f, c - 1], [f, c]] }); }));
      const valida = ([f, c]) => f >= 0 && c >= 0 && f < p.config.filas && c < p.config.columnas;
      const cierra = libres.find((l) => l.cajas.filter(valida).some(([f, c]) => lados(f, c) === 3));
      const segura = libres.filter((l) => l.cajas.filter(valida).every(([f, c]) => lados(f, c) < 2));
      const r = cierra || segura[azar(segura.length)] || libres[azar(libres.length)];
      return accion('raya', { tipo: r.tipo, f: r.f, c: r.c });
    }
    case 'mastermind': {
      if (p.estado !== 'jugando') return;
      const { largo, colores, repetidos } = p.config;
      const alAzar = () => {
        const libres = Array.from({ length: colores }, (_, i) => i);
        return Array.from({ length: largo }, () => (repetidos ? azar(colores) : libres.splice(azar(libres.length), 1)[0]));
      };
      if (p.fase === 'secreto') return p.secretoListo.yo ? undefined : accion('secreto', { codigo: alAzar() });
      if (p.terminado.yo) return;
      await espera(1500);
      // Un código que sea coherente con todas las respuestas anteriores.
      let codigo = alAzar();
      for (let i = 0; i < 5000; i++) {
        if (p.misIntentos.every((x) => { const r = evaluar(codigo, x.codigo); return r.negras === x.negras && r.blancas === x.blancas; })) break;
        codigo = alAzar();
      }
      return accion('intento', { codigo });
    }
    case 'escaleras':
      if (p.estado !== 'jugando' || p.turno !== yo) return;
      await espera(1600);
      return accion('tirar');
    case 'caballos': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'fin') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      if (p.turno !== yo) return;
      await espera(900);
      if (p.fase === 'eligiendo') return accion('elegir', { palo: ['oros', 'copas', 'espadas', 'bastos'].find((x) => !p.duenio[x]) });
      return accion('carta');
    }
    case 'backgammon': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'fin') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      if (p.turno !== yo) return;
      await espera(900);
      if (!p.dados.length) return accion('tirar');
      const m = p.legales[azar(p.legales.length)];
      return accion('mover', { desde: m.desde, hasta: m.hasta });
    }
    case 'sudoku': {
      if (p.estado !== 'jugando') return;
      if (!solucionSudoku || solucionSudoku.base !== p.inicial.flat().join('')) {
        const g = p.inicial.map((f) => [...f]);
        resolverSudoku(g);
        solucionSudoku = { base: p.inicial.flat().join(''), g };
      }
      await espera(2500);
      const vacias = [];
      p.grilla.forEach((fila, f) => fila.forEach((x, c) => { if (!x) vacias.push([f, c]); }));
      if (!vacias.length) return;
      const [f, c] = vacias[azar(vacias.length)];
      const bien = solucionSudoku.g[f][c];
      return accion('poner', { fila: f, col: c, numero: Math.random() < 0.08 ? (bien % 9) + 1 : bien });
    }
    case 'quoridor': {
      if (p.estado !== 'jugando' || p.turno !== yo) return;
      await espera(900);
      if (p.quedan.yo && p.posibles.length && Math.random() < 0.25) {
        const [tipo, f, c] = p.posibles[azar(p.posibles.length)].split(':');
        return accion('pared', { tipo, fila: Number(f), col: Number(c) });
      }
      // Cada ficha: el destino que más la acerca a la fila de arriba.
      let mejor = null;
      p.destinos.forEach((lista, i) => lista.forEach(([f, c]) => { if (!mejor || f < mejor.f || (f === mejor.f && Math.random() < 0.5)) mejor = { i, f, c }; }));
      if (!mejor) return;
      return accion('mover', { ficha: mejor.i, fila: mejor.f, col: mejor.c });
    }
    case 'dibujar': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'revelado') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      if (p.dibujoYo) {
        if (p.fase === 'eligiendo') { await espera(1200); return accion('elegir', { palabra: p.opciones[0] }); }
        if (p.fase === 'dibujando' && p.trazos.length < 6) {
          await espera(1500);
          const x = 100 + azar(800); const y = 100 + azar(800);
          return accion('trazo', { id: String(Date.now()), puntos: Array.from({ length: 12 }, (_, i) => [x + Math.cos(i / 2) * 120, y + Math.sin(i / 2) * 120]), color: '#1e88e5', grosor: 6 });
        }
        return;
      }
      if (p.fase === 'dibujando') {
        await espera(5000);
        return accion('adivinar', { texto: DIBUJOS[azar(DIBUJOS.length)] });
      }
      return;
    }
    case 'monopoly': {
      if (p.estado !== 'jugando') return;
      const enDeuda = p.deuda?.por === 'yo';
      if (enDeuda) {
        await espera(800);
        if (p.dinero.yo >= p.deuda.monto) return accion('pagarDeuda');
        const mias = p.casillas.map((c, i) => i).filter((i) => p.duenio[i] === 'yo');
        const conCasa = mias.find((i) => p.casas[i] > 0);
        if (conCasa !== undefined) return accion('vender', { casilla: conCasa });
        const hipotecable = mias.find((i) => !p.hipotecada[i]);
        if (hipotecable !== undefined) return accion('hipotecar', { casilla: hipotecable });
        return accion('quebrar');
      }
      if (p.turno !== yo) return;
      await espera(1100);
      if (p.fase === 'tirar') {
        if (p.preso.yo && p.dinero.yo > 300) return accion('fianza');
        return accion('tirar');
      }
      if (p.fase === 'decidir') {
        const c = p.casillas[p.oferta];
        return accion(p.dinero.yo >= c.precio + 100 ? 'comprar' : 'noComprar');
      }
      if (p.fase === 'acciones') {
        // Construye parejo si le sobra plata.
        for (const [i, c] of p.casillas.entries()) {
          if (p.duenio[i] !== 'yo' || c.tipo !== 'propiedad' || p.casas[i] >= 5) continue;
          const grupo = p.casillas.map((x, k) => (x.grupo === c.grupo ? k : -1)).filter((k) => k >= 0);
          if (!grupo.every((k) => p.duenio[k] === 'yo' && !p.hipotecada[k])) continue;
          if (p.casas[i] > Math.min(...grupo.map((k) => p.casas[k]))) continue;
          if (p.dinero.yo < p.grupos[c.grupo].casa + 250) continue;
          return accion('construir', { casilla: i });
        }
        return accion('terminar');
      }
      return;
    }
    case 'truco': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'resumen') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      const ops = p.opciones;
      if (!ops.length) return;
      await espera(900);
      const jer = p.miMano.map(jerarquia).sort((a, b) => b - a);
      const mejor = jer[0] ?? 0;
      const ganadas = p.bazas.filter((b) => b.ganador === 'yo').length;
      if (p.pendiente) {
        if (p.pendiente.tipo === 'envido') {
          if (p.miEnvido >= 31 && ops.includes('real') && Math.random() < 0.4) return accion('real');
          return accion(p.miEnvido >= 27 || (p.miEnvido >= 24 && Math.random() < 0.4) ? 'quiero' : 'noquiero');
        }
        if (ops.includes('envido') && p.miEnvido >= 28) return accion('envido');
        if (ops.includes('truco') && mejor >= 12 && Math.random() < 0.4) return accion('truco');
        return accion(mejor >= 10 || ganadas > 0 || Math.random() < 0.25 ? 'quiero' : 'noquiero');
      }
      if (ops.includes('envido') && p.miEnvido >= 28) return accion(p.miEnvido >= 31 && Math.random() < 0.4 ? 'real' : 'envido');
      if (ops.includes('truco') && (mejor >= 11 || ganadas > 0) && Math.random() < 0.5) return accion('truco');
      const baza = p.bazas[p.bazas.length - 1];
      const cartas = [...p.miMano].sort((a, b) => jerarquia(a) - jerarquia(b));
      let carta;
      if (baza && baza.rival && !baza.yo) carta = cartas.find((x) => jerarquia(x) > jerarquia(baza.rival)) || cartas[0];
      else carta = p.bazas.length === 0 ? cartas[Math.floor(cartas.length / 2)] : cartas[cartas.length - 1];
      return accion('jugar', { carta: carta.id });
    }
    case 'ajedrez': {
      if (p.estado !== 'jugando' || p.turno !== 'yo' || !p.legales.length) return;
      await espera(900);
      const VAL = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
      const puntaje = (m) => {
        const obj = p.tablero[m.a[0]][m.a[1]];
        return (obj ? VAL[obj[1]] * 10 : 0) + (m.promo === 'Q' ? 80 : m.promo ? -5 : 0) + Math.random() * 4;
      };
      const m = [...p.legales].sort((a, b) => puntaje(b) - puntaje(a))[0];
      return accion('mover', { de: m.de, a: m.a, promo: m.promo || undefined });
    }
    case 'reversi': {
      if (p.estado !== 'jugando' || p.turno !== 'yo' || !p.posibles.length) return;
      await espera(800);
      const L = p.config.lado - 1;
      const esquina = (x) => (x.f === 0 || x.f === L) && (x.c === 0 || x.c === L);
      const borde = (x) => x.f === 0 || x.f === L || x.c === 0 || x.c === L;
      const valor = (x) => x.n + (esquina(x) ? 50 : borde(x) ? 4 : 0) + Math.random() * 2;
      const x = [...p.posibles].sort((a, b) => valor(b) - valor(a))[0];
      return accion('poner', { fila: x.f, col: x.c });
    }
    case 'tron': {
      if (p.estado !== 'jugando' || p.fase !== 'jugando' || !p.motos.yo.viva) return;
      const { ancho, alto } = p;
      const ocupado = new Set([...p.rastros.yo, ...p.rastros.rival]);
      const libre = (x, y) => x >= 0 && y >= 0 && x < ancho && y < alto && !ocupado.has(y * ancho + x);
      const area = (x, y) => {
        const vistos = new Set([y * ancho + x]);
        const cola = [[x, y]];
        while (cola.length && vistos.size < 300) {
          const [cx, cy] = cola.shift();
          for (const [dx, dy] of Object.values(DIRS_TRON)) {
            const nx = cx + dx; const ny = cy + dy; const k = ny * ancho + nx;
            if (libre(nx, ny) && !vistos.has(k)) { vistos.add(k); cola.push([nx, ny]); }
          }
        }
        return vistos.size;
      };
      const moto = p.motos.yo;
      const OPU = { arriba: 'abajo', abajo: 'arriba', izquierda: 'derecha', derecha: 'izquierda' };
      let mejor = null;
      for (const [dir, [dx, dy]] of Object.entries(DIRS_TRON)) {
        if (dir === OPU[moto.dir]) continue;
        const nx = moto.x + dx; const ny = moto.y + dy;
        const v = libre(nx, ny) ? area(nx, ny) + (dir === moto.dir ? 1.5 : 0) + Math.random() : -1;
        if (!mejor || v > mejor.v) mejor = { dir, v };
      }
      if (mejor && mejor.dir !== moto.dir) return accion('girar', { dir: mejor.dir });
      return;
    }
    case 'botellas': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'fin') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      await espera(700);
      const b = p.botellas;
      // Si ve todo, lo resuelve; con colores escondidos va probando.
      if (b.every((x) => x.every((y) => y !== null))) {
        const clave = JSON.stringify(b);
        let plan = planesBotellas.get(yo);
        if (!plan || plan.esperado !== clave || !plan.movs.length) {
          const sol = resolverBotellas(b, 40000);
          plan = sol ? { movs: sol } : null;
        }
        if (plan?.movs.length) {
          const [de, a] = plan.movs.shift();
          const nb = b.map((x) => [...x]);
          for (let n = cuantoVuelca(nb, de, a); n > 0; n--) nb[a].push(nb[de].pop());
          planesBotellas.set(yo, { movs: plan.movs, esperado: JSON.stringify(nb) });
          return accion('volcar', { de, a });
        }
      }
      if (p.movidas > 250) return accion('rendirse');
      const tope = (x) => x[x.length - 1];
      const movs = [];
      b.forEach((x, i) => b.forEach((y, k) => {
        if (i === k || !x.length || y.length >= p.capacidad) return;
        if (y.length && tope(y) !== tope(x)) return;
        const uniforme = x.every((z) => z === x[0]);
        if (!y.length && uniforme) return;
        movs.push({ de: i, a: k, v: (y.length ? 3 : 0) + (uniforme ? 2 : 0) + Math.random() * 2 });
      }));
      if (!movs.length) return accion(p.puedeDeshacer ? 'deshacer' : 'rendirse');
      const m = movs.sort((x, y) => y.v - x.v)[0];
      return accion('volcar', { de: m.de, a: m.a });
    }
    case 'emojis': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'revelado') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      if (p.armoYo) {
        if (p.fase === 'eligiendo') { await espera(1200); return accion('elegir', { opcion: 0 }); }
        if (p.fase === 'armando') {
          const c = CANCIONES.find((x) => x.titulo === p.cancion?.titulo);
          await espera(700);
          if (c && p.pictos.length < c.pista.length) return accion('picto', { id: c.pista[p.pictos.length] });
          return p.pictos.length ? accion('listo') : accion('picto', { id: 'nota' });
        }
        return;
      }
      if (p.fase !== 'adivinando') return;
      if (p.intentos.length >= 6) return accion('pasar');
      await espera(4000);
      // La canción cuya pista se parece más a los dibujitos (y con la misma cantidad de palabras).
      const vistos = p.pictos.map((x) => x.id);
      const probadas = new Set(p.intentos.map((x) => x.texto));
      const parecido = (c) => {
        const resto = [...vistos];
        let n = 0;
        for (const id of c.pista) { const i = resto.indexOf(id); if (i >= 0) { n++; resto.splice(i, 1); } }
        return n + Math.random() * 0.5;
      };
      const candidatas = CANCIONES.filter((c) => !probadas.has(c.titulo) && c.titulo.split(/\s+/).length === p.palabras?.length);
      const c = (candidatas.length ? candidatas : CANCIONES).sort((a, b) => parecido(b) - parecido(a))[0];
      return accion('adivinar', { texto: c.titulo });
    }
    case 'simon': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'fin') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      const clave = `${yo}:${p.partida}`;
      if (p.fase === 'mostrando' && p.secuencia) { memoriaSimon.set(clave, p.secuencia); return; }
      if (p.fase !== 'repitiendo' || p.situacion.yo !== 'jugando') return;
      const sec = memoriaSimon.get(clave);
      if (!sec) return;
      await espera(380);
      const bien = sec[p.progreso.yo];
      const acierta = Math.random() > 0.012 * p.largo;
      return accion('tocar', { color: acierta ? bien : (bien + 1) % p.config.colores });
    }
    case 'colores': {
      if (p.estado !== 'jugando' || p.fase !== 'carta' || p.bloqueado) return;
      await espera(800 + azar(900));
      const c = p.carta;
      const bien = c.pide === 'tinta' ? c.tinta : c.palabra;
      return accion('responder', { color: Math.random() < 0.85 ? bien : (bien + 1) % p.config.colores });
    }
    case 'gato-raton': {
      if (p.estado !== 'jugando') return;
      if (p.fase === 'resumen') return p.listosSiguiente.includes('yo') ? undefined : accion('siguiente');
      if (p.turno !== yo) return;
      await espera(700);
      const igual = (a, b) => a[0] === b[0] && a[1] === b[1];
      const soyGato = p.miRol === 'gato';
      const desde = soyGato ? p.gato : p.raton;
      const opciones = vecinos(p.paredes, desde).filter(({ pos }) => !igual(pos, soyGato ? p.queso : p.gato));
      if (!opciones.length) return;
      // Gato: se acerca al ratón. Ratón: va al queso, pero evita quedar pegado al gato. Un poco de azar.
      const dist = soyGato ? distancias(p.paredes, p.raton, [p.queso]) : distancias(p.paredes, p.queso, [p.gato]);
      const delGato = distancias(p.paredes, p.gato, [p.queso]);
      const valor = ({ pos }) => dist[pos[0]][pos[1]] + (!soyGato && delGato[pos[0]][pos[1]] <= 1 ? 50 : 0) + Math.random() * 0.8;
      opciones.sort((a, b) => valor(a) - valor(b));
      return accion('mover', { dir: (Math.random() < 0.85 ? opciones[0] : opciones[azar(opciones.length)]).dir });
    }
  }
}
