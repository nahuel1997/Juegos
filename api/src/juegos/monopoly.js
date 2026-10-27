// Monopoly Lanús 1vs1: el clásico de comprar propiedades, pero con calles y lugares de Lanús.
// Se tiran dos dados; con dobles se vuelve a tirar (tres dobles seguidos: a la Comisaría). Si caés en
// algo sin dueño lo podés comprar; si es del otro, le pagás alquiler (el doble si tiene todo el color).
// Con un color completo se construyen casas (parejo) y después hotel. Se puede hipotecar para pagar.
// Pierde el que no puede pagar (quiebra); con límite de turnos, gana el de más patrimonio.
import { ErrorJuego, entero } from './comun.js';
import { CASILLAS, GRUPOS, COMISARIA, ESTACIONES, SUERTE, CLUB } from './monopolyDatos.js';

export const CONFIG_DEFECTO = { dinero: 1500, turnos: 0, salario: 200 };

export function validarConfig(c = {}) {
  return {
    dinero: entero(c.dinero ?? CONFIG_DEFECTO.dinero, 500, 5000, 'La plata inicial'),
    turnos: entero(c.turnos ?? CONFIG_DEFECTO.turnos, 0, 200, 'El límite de turnos'),
    salario: entero(c.salario ?? CONFIG_DEFECTO.salario, 0, 500, 'Lo que se cobra en la Salida'),
  };
}

const FIANZA = 50;
const comprables = (c) => c.tipo === 'propiedad' || c.tipo === 'estacion' || c.tipo === 'servicio';
const delGrupo = (g) => CASILLAS.map((c, i) => (c.grupo === g ? i : -1)).filter((i) => i >= 0);
const hipotecaDe = (i) => CASILLAS[i].precio / 2;
const levantarDe = (i) => Math.ceil(hipotecaDe(i) * 1.1);

function mezclados(n, rand) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

export class PartidaMonopoly {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'monopoly';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.dinero = Object.fromEntries(jugadores.map((j) => [j, config.dinero]));
    this.pos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.preso = Object.fromEntries(jugadores.map((j) => [j, 0])); // 0 = libre; 1..3 = turnos tratando de salir
    this.libres = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.turnosJugados = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.duenio = CASILLAS.map(() => null);
    this.casas = CASILLAS.map(() => 0);
    this.hipotecada = CASILLAS.map(() => false);
    this.mazos = { suerte: mezclados(SUERTE.length, rand), club: mezclados(CLUB.length, rand) };
    this.turno = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.fase = 'tirar'; // tirar | decidir | acciones | deuda
    this.dobles = 0;
    this.otraTirada = false;
    this.dados = null;
    this.deuda = null;
    this.tarjeta = null;
    this.log = [];
    this.n = 0;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #anotar(por, texto, extra = {}) {
    this.log.push({ por, texto, n: ++this.n, ...extra });
    if (this.log.length > 40) this.log.shift();
  }

  // ===== Plata =====

  #cobrar(j, monto, texto) {
    this.dinero[j] += monto;
    if (texto) this.#anotar(j, texto);
  }

  // Paga al banco (a = null) o al rival. Si no le alcanza queda en deuda: tiene que vender o hipotecar.
  #pagar(j, monto, a, texto) {
    if (texto) this.#anotar(j, texto);
    if (this.dinero[j] >= monto) {
      this.dinero[j] -= monto;
      if (a) this.dinero[a] += monto;
      return true;
    }
    if (this.dinero[j] + this.liquidable(j) < monto) {
      // Ni vendiendo todo llega: quiebra. Lo que tenía en efectivo va para el acreedor.
      if (a) this.dinero[a] += this.dinero[j];
      this.dinero[j] = 0;
      this.#quiebra(j);
      return false;
    }
    this.deuda = { por: j, monto, a, volver: this.fase };
    this.fase = 'deuda';
    return false;
  }

  liquidable(j) {
    let total = 0;
    CASILLAS.forEach((c, i) => {
      if (this.duenio[i] !== j) return;
      if (this.casas[i]) total += (this.casas[i] * GRUPOS[c.grupo].casa) / 2;
      if (!this.hipotecada[i]) total += hipotecaDe(i);
    });
    return total;
  }

  patrimonio(j) {
    let total = this.dinero[j];
    CASILLAS.forEach((c, i) => {
      if (this.duenio[i] !== j) return;
      total += this.hipotecada[i] ? c.precio / 2 : c.precio;
      if (this.casas[i]) total += this.casas[i] * GRUPOS[c.grupo].casa;
    });
    return total;
  }

  #quiebra(j) {
    this.#anotar(j, 'Quiebra');
    this.estado = 'terminada';
    this.ganador = this.rival(j);
    this.motivoFin = 'quiebra';
    this.fase = 'fin';
    this.turno = null;
  }

  // ===== Alquileres =====

  tieneGrupo(j, g) {
    return delGrupo(g).every((i) => this.duenio[i] === j);
  }

  alquiler(i, sumaDados) {
    const c = CASILLAS[i];
    const d = this.duenio[i];
    if (!d || this.hipotecada[i]) return 0;
    if (c.tipo === 'estacion') return 25 * 2 ** (ESTACIONES.filter((e) => this.duenio[e] === d).length - 1);
    if (c.tipo === 'servicio') {
      const ambos = CASILLAS.every((x, k) => x.tipo !== 'servicio' || this.duenio[k] === d);
      return sumaDados * (ambos ? 10 : 4);
    }
    if (this.casas[i]) return c.alquiler[this.casas[i]];
    return c.alquiler[0] * (this.tieneGrupo(d, c.grupo) ? 2 : 1);
  }

  // ===== Movimiento =====

  #moverA(j, destino, { cobra = true } = {}) {
    if (cobra && destino < this.pos[j] && this.config.salario) this.#cobrar(j, this.config.salario, `Pasó por la Salida: +$${this.config.salario}`);
    this.pos[j] = destino;
  }

  #aComisaria(j, texto) {
    this.pos[j] = COMISARIA;
    this.preso[j] = 1;
    this.otraTirada = false;
    this.dobles = 0;
    this.#anotar(j, texto || 'A la Comisaría');
  }

  // Resuelve la casilla donde cayó.
  #caer(j) {
    const i = this.pos[j];
    const c = CASILLAS[i];
    if (comprables(c)) {
      if (!this.duenio[i]) {
        this.fase = 'decidir';
        return;
      }
      if (this.duenio[i] !== j) {
        const monto = this.alquiler(i, this.dados[0] + this.dados[1]);
        if (monto) this.#pagar(j, monto, this.duenio[i], `Alquiler de ${c.nombre}: $${monto}`);
        else this.#anotar(j, `${c.nombre} está hipotecada: no paga`);
      }
    } else if (c.tipo === 'impuesto') {
      this.#pagar(j, c.monto, null, `${c.nombre}: $${c.monto}`);
    } else if (c.tipo === 'suerte' || c.tipo === 'club') {
      return this.#tarjeta(j, c.tipo);
    } else if (c.tipo === 'irComisaria') {
      this.#aComisaria(j, 'Cayó en "Andá a la Comisaría"');
    }
    this.#seguir();
  }

  #tarjeta(j, mazo) {
    const lista = mazo === 'suerte' ? SUERTE : CLUB;
    const k = this.mazos[mazo].shift();
    this.mazos[mazo].push(k);
    const t = lista[k];
    this.tarjeta = { mazo, texto: t.texto, por: j, n: this.n + 1 };
    this.#anotar(j, `${mazo === 'suerte' ? 'Suerte' : 'Club de barrio'}: ${t.texto}`, { tarjeta: mazo });
    const rival = this.rival(j);
    switch (t.efecto) {
      case 'cobrar': this.#cobrar(j, t.monto); break;
      case 'pagar': this.#pagar(j, t.monto, null); break;
      case 'delRival': this.#pagar(rival, t.monto, j); break;
      case 'alRival': this.#pagar(j, t.monto, rival); break;
      case 'libre': this.libres[j]++; break;
      case 'comisaria': this.#aComisaria(j); break;
      case 'reparaciones': {
        let total = 0;
        CASILLAS.forEach((_, i) => { if (this.duenio[i] === j) total += this.casas[i] === 5 ? t.hotel : this.casas[i] * t.casa; });
        if (total) this.#pagar(j, total, null);
        break;
      }
      case 'ir': this.#moverA(j, t.casilla); return this.#caer(j);
      case 'atras': this.#moverA(j, t.casilla, { cobra: false }); return this.#caer(j);
      case 'retroceder': this.#moverA(j, (this.pos[j] + 40 - t.n) % 40, { cobra: false }); return this.#caer(j);
      case 'estacion': {
        const prox = ESTACIONES.find((e) => e > this.pos[j]) ?? ESTACIONES[0];
        this.#moverA(j, prox);
        return this.#caer(j);
      }
      default: break;
    }
    this.#seguir();
  }

  // Después de resolver una caída: si debe algo o tiene que decidir, se queda ahí; si no, sigue.
  #seguir() {
    if (this.estado !== 'jugando' || this.fase === 'deuda' || this.fase === 'decidir') return;
    this.fase = this.otraTirada ? 'tirar' : 'acciones';
  }

  #tirarDados() {
    const rand = this.rand ?? Math.random;
    this.dados = [1 + Math.floor(rand() * 6), 1 + Math.floor(rand() * 6)];
    return this.dados;
  }

  // ===== Acciones =====

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');

    // Vender y hipotecar se puede en tu turno o cuando tenés que pagar una deuda.
    const enDeuda = this.fase === 'deuda' && this.deuda?.por === j;
    if (['construir', 'vender', 'hipotecar', 'deshipotecar'].includes(tipo)) {
      if (this.turno !== j && !enDeuda) throw new ErrorJuego('Esperá a tu turno');
      return this.#administrar(j, tipo, entero(datos.casilla, 0, 39, 'La casilla'));
    }
    if (tipo === 'pagarDeuda') {
      if (!enDeuda) throw new ErrorJuego('No tenés deudas');
      if (this.dinero[j] < this.deuda.monto) throw new ErrorJuego('Todavía no te alcanza: vendé o hipotecá algo');
      const { monto, a, volver } = this.deuda;
      this.dinero[j] -= monto;
      if (a) this.dinero[a] += monto;
      this.deuda = null;
      this.#anotar(j, `Pagó la deuda de $${monto}`);
      // Si era la fianza del tercer intento, ahora sí se mueve lo que sacó.
      if (volver === 'moverDespues') {
        this.fase = 'tirar';
        this.#moverA(j, (this.pos[j] + this.dados[0] + this.dados[1]) % 40);
        return this.#caer(j);
      }
      this.fase = volver;
      this.#seguir();
      return;
    }
    if (tipo === 'quebrar') {
      if (!enDeuda) throw new ErrorJuego('Solo si no podés pagar');
      if (this.deuda.a) this.dinero[this.deuda.a] += this.dinero[j];
      this.dinero[j] = 0;
      return this.#quiebra(j);
    }

    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    if (this.fase === 'deuda') throw new ErrorJuego('Primero pagá lo que debés');

    if (tipo === 'fianza' || tipo === 'usarLibre') {
      if (!this.preso[j] || this.fase !== 'tirar') throw new ErrorJuego('No estás en la Comisaría');
      if (tipo === 'usarLibre') {
        if (!this.libres[j]) throw new ErrorJuego('No tenés la tarjeta para salir');
        this.libres[j]--;
        this.#anotar(j, 'Usó la tarjeta y salió de la Comisaría');
      } else {
        if (this.dinero[j] < FIANZA) throw new ErrorJuego('No te alcanza para la fianza');
        this.dinero[j] -= FIANZA;
        this.#anotar(j, `Pagó la fianza: $${FIANZA}`);
      }
      this.preso[j] = 0;
      return;
    }

    if (tipo === 'tirar') {
      if (this.fase !== 'tirar') throw new ErrorJuego('Ya tiraste');
      this.tarjeta = null;
      const [a, b] = this.#tirarDados();
      const dobles = a === b;
      if (this.preso[j]) {
        if (dobles) {
          this.preso[j] = 0;
          this.#anotar(j, `Sacó dobles (${a} y ${b}) y salió de la Comisaría`, { dados: [a, b] });
        } else if (this.preso[j] >= 3) {
          this.preso[j] = 0;
          this.#anotar(j, `Tercer intento (${a} y ${b}): paga la fianza y sale`, { dados: [a, b] });
          this.otraTirada = false;
          if (!this.#pagar(j, FIANZA, null)) {
            if (this.fase === 'deuda') this.deuda.volver = 'moverDespues';
            return;
          }
        } else {
          this.preso[j]++;
          this.#anotar(j, `Sigue en la Comisaría (${a} y ${b})`, { dados: [a, b] });
          this.otraTirada = false;
          this.fase = 'acciones';
          return;
        }
        // Al salir de la Comisaría se mueve lo que sacó, sin volver a tirar.
        this.otraTirada = false;
      } else {
        this.dobles = dobles ? this.dobles + 1 : 0;
        if (this.dobles === 3) {
          this.#anotar(j, `Tercer doble seguido (${a} y ${b})`, { dados: [a, b] });
          this.#aComisaria(j, 'Tres dobles seguidos: a la Comisaría');
          this.fase = 'acciones';
          return;
        }
        this.otraTirada = dobles;
        this.#anotar(j, `Tiró ${a} y ${b}${dobles ? ' (¡dobles!)' : ''}`, { dados: [a, b] });
      }
      this.#moverA(j, (this.pos[j] + a + b) % 40);
      return this.#caer(j);
    }

    if (tipo === 'comprar' || tipo === 'noComprar') {
      if (this.fase !== 'decidir') throw new ErrorJuego('No hay nada para comprar');
      const i = this.pos[j];
      const c = CASILLAS[i];
      if (tipo === 'comprar') {
        if (this.dinero[j] < c.precio) throw new ErrorJuego('No te alcanza la plata');
        this.dinero[j] -= c.precio;
        this.duenio[i] = j;
        this.#anotar(j, `Compró ${c.nombre} por $${c.precio}`, { compra: i });
      } else {
        this.#anotar(j, `No compró ${c.nombre}`);
      }
      this.fase = 'acciones';
      this.#seguir();
      return;
    }

    if (tipo === 'terminar') {
      if (this.fase !== 'acciones') throw new ErrorJuego(this.fase === 'decidir' ? 'Decidí si comprás' : 'Primero tirá los dados');
      this.turnosJugados[j]++;
      this.dobles = 0;
      this.otraTirada = false;
      this.tarjeta = null;
      if (this.config.turnos && this.jugadores.every((x) => this.turnosJugados[x] >= this.config.turnos)) return this.#porPatrimonio();
      this.turno = rival;
      this.fase = 'tirar';
      return;
    }
    throw new ErrorJuego('Acción desconocida');
  }

  #administrar(j, tipo, i) {
    const c = CASILLAS[i];
    if (this.duenio[i] !== j) throw new ErrorJuego('Esa propiedad no es tuya');
    const grupo = c.grupo ? delGrupo(c.grupo) : [i];
    if (tipo === 'construir' || tipo === 'vender') {
      if (c.tipo !== 'propiedad') throw new ErrorJuego('Ahí no se construye');
      const costo = GRUPOS[c.grupo].casa;
      if (tipo === 'construir') {
        if (this.fase === 'deuda') throw new ErrorJuego('Primero pagá lo que debés');
        if (!this.tieneGrupo(j, c.grupo)) throw new ErrorJuego('Necesitás todo el color para construir');
        if (grupo.some((k) => this.hipotecada[k])) throw new ErrorJuego('Hay una propiedad del color hipotecada');
        if (this.casas[i] >= 5) throw new ErrorJuego('Ya tiene hotel');
        if (this.casas[i] > Math.min(...grupo.map((k) => this.casas[k]))) throw new ErrorJuego('Hay que construir parejo: primero en las otras del color');
        if (this.dinero[j] < costo) throw new ErrorJuego('No te alcanza la plata');
        this.dinero[j] -= costo;
        this.casas[i]++;
        this.#anotar(j, `${this.casas[i] === 5 ? 'Hotel' : 'Casa'} en ${c.nombre} ($${costo})`, { obra: i });
      } else {
        if (!this.casas[i]) throw new ErrorJuego('No hay casas para vender');
        if (this.casas[i] < Math.max(...grupo.map((k) => this.casas[k]))) throw new ErrorJuego('Hay que vender parejo: primero en las otras del color');
        this.casas[i]--;
        this.dinero[j] += costo / 2;
        this.#anotar(j, `Vendió una casa de ${c.nombre} (+$${costo / 2})`);
      }
      return;
    }
    if (tipo === 'hipotecar') {
      if (this.hipotecada[i]) throw new ErrorJuego('Ya está hipotecada');
      if (grupo.some((k) => this.casas[k])) throw new ErrorJuego('Primero vendé las casas del color');
      this.hipotecada[i] = true;
      this.dinero[j] += hipotecaDe(i);
      this.#anotar(j, `Hipotecó ${c.nombre} (+$${hipotecaDe(i)})`);
      return;
    }
    if (!this.hipotecada[i]) throw new ErrorJuego('No está hipotecada');
    if (this.fase === 'deuda') throw new ErrorJuego('Primero pagá lo que debés');
    if (this.dinero[j] < levantarDe(i)) throw new ErrorJuego('No te alcanza la plata');
    this.dinero[j] -= levantarDe(i);
    this.hipotecada[i] = false;
    this.#anotar(j, `Levantó la hipoteca de ${c.nombre} ($${levantarDe(i)})`);
  }

  #porPatrimonio() {
    const [a, b] = this.jugadores;
    const pa = this.patrimonio(a);
    const pb = this.patrimonio(b);
    this.estado = 'terminada';
    this.ganador = pa === pb ? null : pa > pb ? a : b;
    this.motivoFin = 'turnos';
    this.fase = 'fin';
    this.turno = null;
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { patrimonio: Object.fromEntries(this.jugadores.map((x) => [x, this.patrimonio(x)])) };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const quien = (x) => (x == null ? null : x === j ? 'yo' : 'rival');
    const porJugador = (o) => ({ yo: o[j], rival: o[rival] });
    const i = this.pos[this.turno] ?? 0;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      casillas: CASILLAS,
      grupos: GRUPOS,
      turno: this.turno,
      fase: this.fase,
      dados: this.dados,
      otraTirada: this.otraTirada,
      dinero: porJugador(this.dinero),
      pos: porJugador(this.pos),
      preso: porJugador(this.preso),
      libres: porJugador(this.libres),
      patrimonio: { yo: this.patrimonio(j), rival: this.patrimonio(rival) },
      turnosJugados: porJugador(this.turnosJugados),
      duenio: this.duenio.map(quien),
      casas: this.casas,
      hipotecada: this.hipotecada,
      alquileres: CASILLAS.map((c, k) => (comprables(c) && this.duenio[k] ? this.alquiler(k, 7) : null)),
      // Lo que se puede comprar ahora (si el que tiene el turno está decidiendo).
      oferta: this.fase === 'decidir' ? i : null,
      deuda: this.deuda && { ...this.deuda, por: quien(this.deuda.por), a: quien(this.deuda.a) },
      liquidable: this.liquidable(j),
      tarjeta: this.tarjeta && { ...this.tarjeta, por: quien(this.tarjeta.por) },
      log: this.log.map((l) => ({ ...l, por: quien(l.por) })),
    };
  }
}
