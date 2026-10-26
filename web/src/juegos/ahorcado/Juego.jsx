import { useEffect, useState } from 'react';

const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

// El muñeco tiene 6 partes; si se permiten más errores, se reparten.
function Horca({ errores, max }) {
  const partes = Math.min(6, Math.ceil((errores * 6) / max));
  return (
    <svg className="horca" viewBox="0 0 120 140" aria-label={`${errores} de ${max} errores`}>
      <g className="estructura">
        <line x1="10" y1="132" x2="80" y2="132" />
        <line x1="30" y1="132" x2="30" y2="10" />
        <line x1="30" y1="10" x2="80" y2="10" />
        <line x1="80" y1="10" x2="80" y2="26" />
      </g>
      <g className="muneco">
        {partes > 0 && <circle cx="80" cy="38" r="12" />}
        {partes > 1 && <line x1="80" y1="50" x2="80" y2="88" />}
        {partes > 2 && <line x1="80" y1="60" x2="64" y2="76" />}
        {partes > 3 && <line x1="80" y1="60" x2="96" y2="76" />}
        {partes > 4 && <line x1="80" y1="88" x2="66" y2="110" />}
        {partes > 5 && <line x1="80" y1="88" x2="94" y2="110" />}
      </g>
    </svg>
  );
}

function ElegirPalabra({ accion }) {
  const [palabra, setPalabra] = useState('');
  const [pista, setPista] = useState('');
  const [ver, setVer] = useState(false);
  return (
    <form className="tarjeta elegir" onSubmit={(e) => { e.preventDefault(); accion('palabra', { palabra, pista }); }}>
      <h3>Elegí la palabra secreta</h3>
      <label>
        Palabra
        <div className="con-boton">
          <input type={ver ? 'text' : 'password'} value={palabra} onChange={(e) => setPalabra(e.target.value)} maxLength={30} autoComplete="off" autoFocus required />
          <button type="button" className="btn chico fantasma" onClick={() => setVer((v) => !v)}>{ver ? 'Ocultar' : 'Ver'}</button>
        </div>
      </label>
      <label>
        Pista (opcional)
        <input value={pista} onChange={(e) => setPista(e.target.value)} maxLength={80} placeholder="Ej: se toma con bombilla" />
      </label>
      <button className="btn">Listo</button>
      <p className="ayuda">Solo letras y espacios. Los acentos no cuentan.</p>
    </form>
  );
}

export default function JuegoAhorcado({ partida, accion, ctx }) {
  const { ronda, puntos, config } = partida;
  const adivino = ronda.adivinoYo;
  const [intento, setIntento] = useState('');
  const puedoTirar = adivino && ronda.fase === 'adivinando' && partida.estado === 'jugando';

  // Teclado físico para el que adivina.
  useEffect(() => {
    if (!puedoTirar) return;
    const tecla = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      const l = e.key.toUpperCase();
      if (LETRAS.includes(l) && !ronda.letras.includes(l)) accion('letra', { letra: l });
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [puedoTirar, ronda.letras, accion]);

  const palabraCompleta = ronda.palabra ? [...ronda.palabra] : null;

  return (
    <div className="ahorcado">
      <div className="marcador">
        <span>Vos <b>{puntos.yo}</b></span>
        <span className="ronda">Ronda {ronda.numero} de {ronda.total}</span>
        <span><b>{puntos.rival}</b> {ctx.nombreRival}</span>
      </div>

      {ronda.fase === 'eligiendo' && (
        adivino
          ? <div className="estado-cinta espera">{ctx.nombreRival} está eligiendo la palabra…</div>
          : <ElegirPalabra accion={accion} />
      )}

      {ronda.fase !== 'eligiendo' && (
        <>
          <div className={`estado-cinta ${puedoTirar ? 'tu-turno' : ''}`}>
            {ronda.fase === 'resuelta'
              ? ronda.resultado === 'adivino'
                ? `${adivino ? '¡Adivinaste!' : `${ctx.nombreRival} la adivinó`}`
                : `${adivino ? 'Te ahorcaron' : `¡${ctx.nombreRival} se ahorcó!`}`
              : adivino ? 'Adiviná la palabra' : `${ctx.nombreRival} está adivinando tu palabra…`}
            {ronda.pista && <small>Pista: {ronda.pista}</small>}
          </div>
          <div className="ahorcado-grid">
            <div className="horca-wrap">
              <Horca errores={ronda.errores} max={config.errores} />
              <small>{ronda.errores} / {config.errores} errores</small>
            </div>
            <div className="palabra-wrap">
              <div className="palabra">
                {(ronda.mostrada || []).map((ch, i) =>
                  ch === ' ' ? <span key={i} className="espacio" /> : (
                    <span key={i} className={`letra-slot ${ch !== '_' ? 'ok' : palabraCompleta ? 'falta' : ''}`}>
                      {ch !== '_' ? ch : palabraCompleta ? palabraCompleta[i] : ''}
                    </span>
                  ),
                )}
              </div>
              <div className="teclado">
                {LETRAS.map((l) => {
                  const usada = ronda.letras.includes(l);
                  const bien = usada && (ronda.mostrada || []).includes(l);
                  return (
                    <button key={l} type="button" className={`tecla ${usada ? (bien ? 'bien' : 'mal') : ''}`} disabled={!puedoTirar || usada} onClick={() => accion('letra', { letra: l })}>
                      {l}
                    </button>
                  );
                })}
              </div>
              {puedoTirar && (
                <form className="arriesgar" onSubmit={(e) => { e.preventDefault(); accion('arriesgar', { palabra: intento }); setIntento(''); }}>
                  <input value={intento} onChange={(e) => setIntento(e.target.value)} placeholder="Arriesgar la palabra entera (si le errás, suma un error)" maxLength={30} />
                  <button className="btn chico" disabled={!intento.trim()}>Arriesgar</button>
                </form>
              )}
              {ronda.fase === 'resuelta' && partida.estado === 'jugando' && (
                <button className="btn" onClick={() => accion('siguiente')}>Siguiente ronda →</button>
              )}
            </div>
          </div>
        </>
      )}

      {partida.historial.length > 0 && (
        <ul className="historial compacto">
          {partida.historial.map((h) => (
            <li key={h.numero} className={(h.resultado === 'adivino') === h.adivinoYo ? 'gane' : 'perdi'}>
              <span>Ronda {h.numero}: <b>{h.palabra}</b></span>
              <small>{h.adivinoYo ? 'adivinabas vos' : `adivinaba ${ctx.nombreRival}`} · {h.resultado === 'adivino' ? 'adivinada' : 'ahorcado'} · {h.errores} errores</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

JuegoAhorcado.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;

// Te toca si tenés que elegir la palabra o si estás adivinando.
JuegoAhorcado.claveTurno = (p) => {
  const r = p.ronda;
  if (p.estado !== 'jugando') return null;
  if (r.fase === 'eligiendo' && !r.adivinoYo) return `a-${r.numero}-elegir`;
  if (r.fase === 'adivinando' && r.adivinoYo) return `a-${r.numero}-adivinar`;
  return null;
};
