import { Interruptor } from '../../componentes/comunes.jsx';

export default function ConfigDamas({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Tablero</h3>
        <div className="opciones">
          {[8, 10].map((n) => (
            <button key={n} type="button" className={`opcion ${config.tamano === n ? 'activa' : ''}`} onClick={() => set({ tamano: n })}>
              <b>{n}×{n}</b>
              <small>{n === 8 ? '12 piezas cada uno (el clásico)' : '20 piezas cada uno (damas internacionales)'}</small>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>Reglas</h3>
        <Interruptor valor={config.comerObligatorio} onChange={(comerObligatorio) => set({ comerObligatorio })}>Comer es obligatorio</Interruptor>
        <Interruptor valor={config.damaVuela} onChange={(damaVuela) => set({ damaVuela })}>La dama vuela (se mueve varias casillas)</Interruptor>
        <Interruptor valor={config.peonComeAtras} onChange={(peonComeAtras) => set({ peonComeAtras })}>Los peones también comen para atrás</Interruptor>
        <p className="ayuda">Si comés y podés seguir comiendo con la misma pieza, seguís. Gana quien deja al otro sin piezas o sin movimientos.</p>
      </section>
    </div>
  );
}
