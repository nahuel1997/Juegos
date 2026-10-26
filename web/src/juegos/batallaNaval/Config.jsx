import { Stepper, Interruptor } from '../../componentes/comunes.jsx';
import { TIPOS } from './flota.js';

export default function ConfigBatalla({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  const total = TIPOS.reduce((s, t) => s + (config.barcos[t.tipo] || 0), 0);
  return (
    <div className="config-grid">
      <section>
        <h3>Tablero</h3>
        <Stepper etiqueta="Filas" valor={config.filas} min={6} max={15} onChange={(filas) => set({ filas })} />
        <Stepper etiqueta="Columnas" valor={config.columnas} min={6} max={15} onChange={(columnas) => set({ columnas })} />
        <div className="mini-tablero" style={{ '--cols': config.columnas }}>
          {Array.from({ length: config.filas * config.columnas }, (_, i) => <i key={i} />)}
        </div>
      </section>
      <section>
        <h3>Barcos ({total})</h3>
        {TIPOS.map((t) => (
          <Stepper
            key={t.tipo}
            etiqueta={<><span className="mini-barco">{Array.from({ length: t.largo }, (_, i) => <i key={i} />)}</span> {t.nombre}</>}
            valor={config.barcos[t.tipo] || 0}
            min={0}
            max={4}
            onChange={(n) => set({ barcos: { ...config.barcos, [t.tipo]: n } })}
          />
        ))}
        <Interruptor valor={config.pegados} onChange={(pegados) => set({ pegados })}>
          Se pueden poner barcos pegados
        </Interruptor>
        <Interruptor valor={config.seguirAlTocar} onChange={(seguirAlTocar) => set({ seguirAlTocar })}>
          Si tocás un barco seguís tirando
        </Interruptor>
        <p className="ayuda">{config.seguirAlTocar ? 'Agua o hundido pasan el turno; tocado sigue.' : 'Después de cada tiro (agua, tocado o hundido) le toca al otro.'}</p>
      </section>
    </div>
  );
}
