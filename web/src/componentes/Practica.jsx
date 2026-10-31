import { useCallback, useEffect, useRef, useState } from 'react';
import { JUEGOS } from '../juegos/index.js';
import { Icono } from '../iconos.jsx';

// Cada cuánto el bot mira si le toca (en los de tiempo real tiene que reaccionar rápido).
const INTERVALO = { tron: 50, colores: 120, simon: 120 };
const CTX_BOT = { yo: 'vos', rival: 'bot', nombreRival: 'el bot', rivalOnline: true };

// Práctica contra el bot, sin otra persona: corre la misma lógica del server en el navegador.
export default function Practica({ id, nombre, usuario, volver }) {
  const def = JUEGOS[id];
  const [motor, setMotor] = useState(null);
  const [config, setConfig] = useState(null);
  const [vista, setVista] = useState(null);
  const [error, setError] = useState('');
  const partidaRef = useRef(null);
  const botOcupado = useRef(false);
  const vueltaRef = useRef(0);
  const ctx = { ...CTX_BOT, colorYo: usuario?.color || '#ff4f9a', colorRival: '#4fc3f7' };

  useEffect(() => {
    let vivo = true;
    import('../demo/motores.js').then((m) => {
      if (!vivo) return;
      const mot = m.MOTORES[id];
      setMotor({ ...mot, jugadaBot: m.jugadaBot });
      setConfig({ ...mot.mod.CONFIG_DEFECTO });
    }).catch(() => setError('No se pudo cargar el juego'));
    return () => { vivo = false; };
  }, [id]);

  const mostrar = useCallback(() => {
    const p = partidaRef.current;
    if (p) setVista(JSON.parse(JSON.stringify(p.vistaPara('vos'))));
  }, []);

  const avisar = (texto) => {
    setError(texto);
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => setError(''), 2500);
  };

  const terminar = () => {
    const p = partidaRef.current;
    if (p) { clearTimeout(p.timer); p.estado = p.estado === 'jugando' ? 'terminada' : p.estado; }
    partidaRef.current = null;
  };

  const empezar = () => {
    terminar();
    try {
      const cfg = motor.mod.validarConfig(config);
      const p = new motor.Clase(['vos', 'bot'], cfg);
      p.notificar = mostrar;
      partidaRef.current = p;
      vueltaRef.current++;
      mostrar();
    } catch (e) {
      avisar(e.message || 'Configuración inválida');
    }
  };

  // El bot juega solo, con sus tiempos de "pensar".
  useEffect(() => {
    if (!vista || !motor) return undefined;
    const vuelta = vueltaRef.current;
    const t = setInterval(async () => {
      const p = partidaRef.current;
      if (!p || botOcupado.current || p.estado !== 'jugando' || vueltaRef.current !== vuelta) return;
      botOcupado.current = true;
      try {
        const jug = await motor.jugadaBot(id, JSON.parse(JSON.stringify(p.vistaPara('bot'))), 'bot', {
          rival: 'vos',
          espera: (ms) => new Promise((ok) => setTimeout(ok, ms)),
        });
        if (jug && partidaRef.current === p && p.estado === 'jugando') {
          try { p.accion('bot', jug.tipo, jug.datos ?? {}); } catch { /* jugada vieja del bot */ }
          mostrar();
        }
      } finally {
        botOcupado.current = false;
      }
    }, INTERVALO[id] ?? 300);
    return () => clearInterval(t);
  }, [vista !== null, motor, id, mostrar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => terminar(), []);

  const accion = useCallback((tipo, datos) => {
    const p = partidaRef.current;
    if (!p) return;
    try {
      p.accion('vos', tipo, datos ?? {});
    } catch (e) {
      avisar(e.message || 'No se pudo');
    }
    mostrar();
  }, [mostrar]);

  if (!def) return null;
  const terminada = vista && vista.estado === 'terminada';
  const gane = terminada && vista.ganador === 'vos';
  const empate = terminada && !vista.ganador;

  return (
    <div className={`practica sala-${id}`}>
      <div className="practica-cab">
        <h2><Icono id={def.icono} tam={30} /> {nombre} <span className="vs">· práctica contra el bot</span></h2>
        <div className="acciones">
          {vista && <button className="btn chico fantasma" onClick={() => { terminar(); setVista(null); }}>Cambiar reglas</button>}
          <button className="btn chico fantasma" onClick={() => { terminar(); volver(); }}>Volver</button>
        </div>
      </div>
      <p className="practica-error" aria-live="polite">{error}</p>

      {!vista && (
        <div className="tarjeta config">
          <div className="config-cab">
            <h2>Reglas de la práctica</h2>
            {motor && <button className="btn chico fantasma" onClick={() => setConfig({ ...motor.mod.CONFIG_DEFECTO })}>Reglas por defecto</button>}
          </div>
          <p className="sub">Jugás contra el bot de la app. No cuenta para tus estadísticas.</p>
          {config ? <def.Config config={config} cambiar={setConfig} /> : <div className="cargando">Cargando…</div>}
          <div className="listos">
            <button className="btn grande" disabled={!motor} onClick={empezar}>¡A jugar!</button>
          </div>
        </div>
      )}

      {vista && (
        <>
          {terminada && (
            <div className="tarjeta final practica-fin">
              <h2>{empate ? '¡Empate!' : gane ? '¡Le ganaste al bot!' : 'Ganó el bot'}</h2>
              <p>{def.Juego.textoFinal?.(vista, gane)}</p>
              <div className="acciones centro">
                <button className="btn" onClick={empezar}>Otra</button>
                <button className="btn fantasma" onClick={() => { terminar(); setVista(null); }}>Cambiar reglas</button>
              </div>
            </div>
          )}
          <def.Juego key={vueltaRef.current} partida={vista} accion={accion} ctx={ctx} />
        </>
      )}
    </div>
  );
}
