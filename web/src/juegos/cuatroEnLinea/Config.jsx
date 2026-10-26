import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigCuatro({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Tablero</h3>
        <Stepper etiqueta="Filas" valor={config.filas} min={4} max={10} onChange={(filas) => set({ filas })} />
        <Stepper etiqueta="Columnas" valor={config.columnas} min={4} max={12} onChange={(columnas) => set({ columnas })} />
        <div className="mini-tablero cuatro-mini" style={{ '--cols': config.columnas }}>
          {Array.from({ length: config.filas * config.columnas }, (_, i) => <i key={i} />)}
        </div>
      </section>
      <section>
        <h3>Para ganar</h3>
        <Stepper etiqueta="Fichas en línea" valor={config.enLinea} min={3} max={6} onChange={(enLinea) => set({ enLinea })} />
        <p className="ayuda">Vale en horizontal, vertical o diagonal. Si se llena el tablero sin línea, es empate.</p>
      </section>
    </div>
  );
}
