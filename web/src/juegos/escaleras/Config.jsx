import { Interruptor } from '../../componentes/comunes.jsx';

const CANTIDADES = { pocas: 'Pocas', normal: 'Normal', muchas: 'Muchas' };

export default function ConfigEscaleras({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Tablero</h3>
        <div className="opciones">
          {[49, 64, 100].map((n) => (
            <button key={n} type="button" className={`opcion ${config.casillas === n ? 'activa' : ''}`} onClick={() => set({ casillas: n })}>
              <b>{n} casillas</b><small>{Math.sqrt(n)} × {Math.sqrt(n)}</small>
            </button>
          ))}
        </div>
        <h3>Escaleras y serpientes</h3>
        <div className="opciones">
          {Object.entries(CANTIDADES).map(([k, t]) => (
            <button key={k} type="button" className={`opcion ${config.cantidad === k ? 'activa' : ''}`} onClick={() => set({ cantidad: k })}><b>{t}</b></button>
          ))}
        </div>
        <p className="ayuda">Salen en lugares distintos en cada partida.</p>
      </section>
      <section>
        <h3>Reglas</h3>
        <Interruptor valor={config.exacto} onChange={(exacto) => set({ exacto })}>Llegar justo (si te pasás, rebotás)</Interruptor>
        <Interruptor valor={config.seisRepite} onChange={(seisRepite) => set({ seisRepite })}>Con un 6 se vuelve a tirar</Interruptor>
      </section>
    </div>
  );
}
