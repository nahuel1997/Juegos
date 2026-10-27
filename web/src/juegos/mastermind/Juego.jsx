import { useEffect, useState } from 'react';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

export const COLORES = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#4dd0e1', '#f06292'];
const NOMBRES = ['rojo', 'azul', 'verde', 'amarillo', 'violeta', 'naranja', 'celeste', 'rosa'];

const Ficha = ({ color, chica, onClick, vacia, sel }) => (
  <button
    type="button"
    className={`mm-ficha ${chica ? 'chica' : ''} ${vacia ? 'vacia' : ''} ${sel ? 'sel' : ''}`}
    style={color != null ? { '--c': COLORES[color] } : undefined}
    onClick={onClick}
    disabled={!onClick}
    aria-label={color != null ? NOMBRES[color] : 'vacío'}
  />
);

// Las clavijas de la respuesta: negras (justo) y blancas (color en otro lugar).
const Respuesta = ({ negras, blancas, largo }) => (
  <span className="mm-resp" style={{ '--n': Math.ceil(largo / 2) }}>
    {Array.from({ length: largo }, (_, i) => <i key={i} className={i < negras ? 'negra' : i < negras + blancas ? 'blanca' : ''} />)}
  </span>
);

// Armar un código: casilleros + paleta.
function Armador({ config, onListo, texto, deshabilitado }) {
  const [codigo, setCodigo] = useState(Array(config.largo).fill(null));
  const [lugar, setLugar] = useState(0);
  useEffect(() => { setCodigo(Array(config.largo).fill(null)); setLugar(0); }, [config.largo, texto]);
  const poner = (k) => {
    if (!config.repetidos && codigo.includes(k)) return;
    const n = [...codigo];
    n[lugar] = k;
    setCodigo(n);
    const sig = n.findIndex((x) => x === null);
    setLugar(sig >= 0 ? sig : lugar);
  };
  const completo = codigo.every((x) => x !== null);
  return (
    <div className="mm-armador">
      <div className="mm-fila">
        {codigo.map((x, i) => (
          <Ficha key={i} color={x} vacia={x === null} sel={lugar === i} onClick={() => { if (x !== null && lugar === i) { const n = [...codigo]; n[i] = null; setCodigo(n); } setLugar(i); }} />
        ))}
      </div>
      <div className="mm-paleta">
        {Array.from({ length: config.colores }, (_, k) => (
          <Ficha key={k} color={k} onClick={deshabilitado || (!config.repetidos && codigo.includes(k)) ? undefined : () => poner(k)} />
        ))}
      </div>
      <button className="btn" disabled={!completo || deshabilitado} onClick={() => { onListo(codigo); setCodigo(Array(config.largo).fill(null)); setLugar(0); }}>{texto}</button>
    </div>
  );
}

export default function JuegoMastermind({ partida, accion, ctx }) {
  const { config } = partida;
  const fin = partida.estado === 'terminada';

  const ultimo = partida.misIntentos[partida.misIntentos.length - 1];
  const fx = useEfecto(partida.misIntentos.length ? `i${partida.misIntentos.length}` : null, () => {
    if (ultimo.negras === config.largo) { efectoSonido.fanfarria(); return { tipo: 'bien' }; }
    efectoSonido.carta?.();
    return null;
  }, 2600);

  if (partida.fase === 'secreto') {
    return (
      <div className="mm">
        <div className="estado-cinta tu-turno">
          {partida.secretoListo.yo ? `Listo. Esperando que ${ctx.nombreRival} arme el suyo…` : `Armá el código secreto que va a tener que adivinar ${ctx.nombreRival}`}
          <small>{config.largo} colores{config.repetidos ? ', se pueden repetir' : ', sin repetir'}{partida.secretoListo.rival ? ` · ${ctx.nombreRival} ya armó el suyo` : ''}</small>
        </div>
        {partida.secretoListo.yo ? (
          <div className="tarjeta mm-centro"><p>Tu código:</p><div className="mm-fila">{partida.miSecreto.map((x, i) => <Ficha key={i} color={x} />)}</div></div>
        ) : (
          <div className="tarjeta mm-centro"><Armador config={config} texto="Guardar código secreto" onListo={(codigo) => accion('secreto', { codigo })} /></div>
        )}
      </div>
    );
  }

  return (
    <div className="mm">
      {fx?.tipo === 'bien' && <><Cartel key={fx.id} tipo="oro" texto="¡LO DESCUBRISTE!" sub={`En ${partida.misIntentos.length} intento${partida.misIntentos.length === 1 ? '' : 's'}`} /><Confeti key={`c${fx.id}`} cantidad={70} /></>}
      <div className="marcador">
        <span>Vos <b>{partida.misIntentos.length}</b>{partida.resuelto.yo ? ' ✓' : ''}</span>
        <span className="ronda">Intentos (de {config.intentos}) · gana el que usa menos</span>
        <span><b>{partida.intentosRival.length}</b>{partida.resuelto.rival ? ' ✓' : ''} {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${!partida.terminado.yo && !fin ? 'tu-turno' : ''}`}>
        {fin ? 'Partida terminada' : partida.terminado.yo ? (partida.resuelto.yo ? `¡Lo sacaste! Esperando a ${ctx.nombreRival}…` : `Se te acabaron los intentos. Esperando a ${ctx.nombreRival}…`) : `Adiviná el código de ${ctx.nombreRival}`}
        <small>Negra: color y lugar justos · Blanca: el color está, pero en otro lugar</small>
      </div>
      <div className="mm-zona">
        <div className="tarjeta mm-tablero">
          <h4>Tus intentos</h4>
          {partida.misIntentos.map((x, i) => (
            <div key={i} className={`mm-fila intento ${i === partida.misIntentos.length - 1 ? 'nuevo' : ''}`}>
              <span className="mm-num">{i + 1}</span>
              {x.codigo.map((k, t) => <Ficha key={t} color={k} chica />)}
              <Respuesta {...x} largo={config.largo} />
            </div>
          ))}
          {!partida.terminado.yo && !fin && <Armador config={config} texto="Probar" onListo={(codigo) => accion('intento', { codigo })} />}
          {partida.secretoRival && (
            <div className="mm-secreto"><span>El código de {ctx.nombreRival} era:</span><div className="mm-fila">{partida.secretoRival.map((x, i) => <Ficha key={i} color={x} chica />)}</div></div>
          )}
        </div>
        <div className="tarjeta mm-tablero rival">
          <h4>Cómo le va a {ctx.nombreRival}</h4>
          {partida.intentosRival.length === 0 && <p className="sub">Todavía no probó.</p>}
          {partida.intentosRival.map((x, i) => (
            <div key={i} className="mm-fila intento">
              <span className="mm-num">{i + 1}</span>
              {x.codigo ? x.codigo.map((k, t) => <Ficha key={t} color={k} chica />) : <span className="mm-oculto">? ? ?</span>}
              <Respuesta {...x} largo={config.largo} />
            </div>
          ))}
          <div className="mm-secreto"><span>Tu código:</span><div className="mm-fila">{partida.miSecreto?.map((x, i) => <Ficha key={i} color={x} chica />)}</div></div>
        </div>
      </div>
    </div>
  );
}

JuegoMastermind.textoFinal = (p) => {
  const t = (n, ok) => (ok ? `${n} intento${n === 1 ? '' : 's'}` : 'no lo sacó');
  return `Vos: ${t(p.misIntentos.length, p.resuelto.yo)} · rival: ${t(p.intentosRival.length, p.resuelto.rival)}.`;
};
JuegoMastermind.claveTurno = () => null;
