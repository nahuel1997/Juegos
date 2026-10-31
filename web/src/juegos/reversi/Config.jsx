import { Interruptor } from '../../componentes/comunes.jsx';

export default function ConfigReversi({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Tablero</h3>
        <div className="opciones-fila">
          {[6, 8, 10].map((l) => (
            <button key={l} type="button" className={`btn chico ${config.lado === l ? '' : 'fantasma'}`} onClick={() => set({ lado: l })}>{l}x{l}</button>
          ))}
        </div>
      </section>
      <section>
        <h3>Ayuda</h3>
        <Interruptor valor={config.ayudas} onChange={(ayudas) => set({ ayudas })}>Marcar dónde se puede poner</Interruptor>
      </section>
    </div>
  );
}
