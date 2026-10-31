import { Component, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { JUEGOS } from '../juegos/index.js';
import { silenciar } from '../sonido.js';

const ANCHO = 820; // ancho al que se dibuja el juego antes de achicarlo
const ALTO_MAX = 440; // alto máximo de la simulación en la ventana
const PASO_MS = { pool: 3200, 'piedra-papel-tijera': 1300, penales: 1300, sudoku: 450, cajitas: 600, tateti: 800, escaleras: 1600, monopoly: 1300, caballos: 900, memotest: 1100, 'tuti-fruti': 1800, tron: 90, 'gato-raton': 120, 'toca-el-punto': 250, jenga: 900, nim: 1200, 'palabras-cruzadas': 1500, 'mas-o-menos': 700, 'conta-objetos': 700, 'ruleta-emojis': 900, adivina: 800, simon: 300, colores: 400, botellas: 700, truco: 1300, emojis: 900 };
const CTX = {
  yo: 'vos', rival: 'rival', nombreRival: 'Rival', rivalOnline: true, colorYo: '#ff4f9a', colorRival: '#4fc3f7',
  jugadores: [{ id: 'vos', nombre: 'Vos', color: '#ff4f9a' }, { id: 'rival', nombre: 'Rival', color: '#4fc3f7' }],
  nombreDe: (id) => (id === 'vos' ? 'Vos' : 'Rival'),
  colorDe: (id) => (id === 'vos' ? '#ff4f9a' : '#4fc3f7'),
};
const otro = (j) => (j === 'vos' ? 'rival' : 'vos');

// Si la pantalla del juego falla con algún estado de la simulación, se esconde (no rompe la página).
class Protegido extends Component {
  constructor(props) { super(props); this.state = { roto: false }; }
  static getDerivedStateFromError() { return { roto: true }; }
  render() { return this.state.roto ? null : this.props.children; }
}

// Una partida de verdad (con la lógica del server) entre dos bots, dibujada con la pantalla del juego,
// achicada y sin sonido. Al terminar, arranca otra.
export default function Simulacion({ id }) {
  const [vista, setVista] = useState(null);
  const [error, setError] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  const [pausa, setPausa] = useState(false);
  const pausaRef = useRef(false);
  pausaRef.current = pausa;
  const caja = useRef(null);
  const adentro = useRef(null);
  const [escala, setEscala] = useState(0.6);
  const [alto, setAlto] = useState(300);
  const [corrido, setCorrido] = useState(0);
  const altoMax = useRef(0);

  useEffect(() => {
    let vivo = true;
    let timer = null;
    let partida = null;
    silenciar(true);
    (async () => {
      try {
        const { MOTORES, jugadaBot } = await import('../demo/motores.js');
        const motor = MOTORES[id];
        if (!motor) { setError(true); return; }
        const mostrar = () => { if (vivo && partida) setVista(JSON.parse(JSON.stringify(partida.vistaPara('vos')))); };
        const nueva = () => {
          clearTimeout(partida?.timer);
          const config = motor.mod.validarConfig({ ...motor.mod.CONFIG_DEFECTO, ...motor.demo });
          partida = new motor.Clase(['vos', 'rival'], config);
          partida.notificar = mostrar;
          altoMax.current = 0;
          mostrar();
        };
        const paso = async () => {
          if (!vivo) return;
          if (!pausaRef.current) {
            if (partida.estado === 'terminada') {
              nueva();
            } else {
              // Juega el que tiene el turno (y si es "a la vez", los dos).
              const orden = partida.turno === 'rival' ? ['rival', 'vos'] : ['vos', 'rival'];
              for (const j of orden) {
                if (partida.estado === 'terminada') break;
                try {
                  const jug = await jugadaBot(id, JSON.parse(JSON.stringify(partida.vistaPara(j))), j, { rival: otro(j) });
                  if (jug) partida.accion(j, jug.tipo, jug.datos ?? {});
                } catch { /* una jugada inválida del bot no corta la simulación */ }
              }
              mostrar();
            }
          }
          const fin = partida.estado === 'terminada';
          timer = setTimeout(paso, fin ? 3500 : PASO_MS[id] ?? 1000);
        };
        nueva();
        timer = setTimeout(paso, 900);
      } catch {
        if (vivo) setError(true);
      }
    })();
    return () => {
      vivo = false;
      clearTimeout(timer);
      clearTimeout(partida?.timer);
      silenciar(false);
    };
  }, [id, vuelta]);

  // El juego se dibuja a ANCHO px y se achica al ancho de la caja.
  useLayoutEffect(() => {
    const medir = () => {
      if (!caja.current || !adentro.current) return;
      // Entra entero (ancho y alto); la altura solo crece durante una partida, así no "respira".
      altoMax.current = Math.max(altoMax.current, adentro.current.scrollHeight);
      const ancho = caja.current.clientWidth;
      const k = Math.min(1, ancho / ANCHO, ALTO_MAX / altoMax.current);
      setEscala(k);
      setCorrido(Math.max(0, (ancho - ANCHO * k) / 2));
      setAlto(altoMax.current * k);
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (caja.current) ro.observe(caja.current);
    if (adentro.current) ro.observe(adentro.current);
    return () => ro.disconnect();
  }, [vista]);

  // Que no se pueda tocar ni enfocar nada de la simulación.
  useEffect(() => { adentro.current?.setAttribute('inert', ''); }, [vista]);

  const Juego = JUEGOS[id]?.Juego;
  if (error || !Juego) return null;
  return (
    <div className="vp-demo">
      <div className="vp-demo-barra">
        <span className="vp-vivo"><i /> Simulación: dos bots jugando</span>
        <span className="acciones">
          <button type="button" className="btn chico fantasma" onClick={() => setPausa(!pausa)}>{pausa ? 'Seguir' : 'Pausar'}</button>
          <button type="button" className="btn chico fantasma" onClick={() => { setPausa(false); setVuelta(vuelta + 1); }}>Otra partida</button>
        </span>
      </div>
      <div className="vp-demo-caja" ref={caja} style={{ height: alto }}>
        <div className="vp-demo-juego" ref={adentro} style={{ width: ANCHO, transform: `translateX(${corrido}px) scale(${escala})` }}>
          {vista ? <Protegido key={vuelta}><Juego partida={vista} accion={() => {}} ctx={CTX} /></Protegido> : <div className="cargando">Armando la partida…</div>}
        </div>
      </div>
    </div>
  );
}
