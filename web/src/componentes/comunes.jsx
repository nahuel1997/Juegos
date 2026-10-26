// Piezas chicas que usan varias pantallas.

export function Avatar({ usuario, tam = 36 }) {
  if (!usuario) return null;
  return (
    <span className="avatar" style={{ '--c': usuario.color, width: tam, height: tam, fontSize: tam * 0.45 }}>
      {usuario.avatar ? <img src={usuario.avatar} alt="" /> : usuario.nombre?.[0]?.toUpperCase()}
    </span>
  );
}

export function Stepper({ valor, min, max, onChange, etiqueta, paso = 1 }) {
  return (
    <div className="stepper">
      {etiqueta && <span className="stepper-etq">{etiqueta}</span>}
      <div className="stepper-ctl">
        <button type="button" className="btn chico fantasma" disabled={valor <= min} onClick={() => onChange(Math.max(min, valor - paso))} aria-label="Menos">−</button>
        <b>{valor}</b>
        <button type="button" className="btn chico fantasma" disabled={valor >= max} onClick={() => onChange(Math.min(max, valor + paso))} aria-label="Más">+</button>
      </div>
    </div>
  );
}

export function Interruptor({ valor, onChange, children }) {
  return (
    <label className="interruptor">
      <input type="checkbox" checked={!!valor} onChange={(e) => onChange(e.target.checked)} />
      <span className="pista-int" />
      <span>{children}</span>
    </label>
  );
}
