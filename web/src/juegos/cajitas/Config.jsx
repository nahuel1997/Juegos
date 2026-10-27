import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigCajitas({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Tablero</h3>
        <Stepper etiqueta="Filas de cajitas" valor={config.filas} min={2} max={9} onChange={(filas) => set({ filas })} />
        <Stepper etiqueta="Columnas de cajitas" valor={config.columnas} min={2} max={9} onChange={(columnas) => set({ columnas })} />
        <p className="ayuda">{config.filas * config.columnas} cajitas en total.</p>
      </section>
      <section>
        <h3>Cómo se juega</h3>
        <ul className="lista-simple">
          <li>Por turno trazás una rayita entre dos puntos vecinos.</li>
          <li>El que cierra el cuarto lado de una cajita se la queda y vuelve a jugar.</li>
          <li>Ojo con dejar el tercer lado: se la regalás al otro.</li>
        </ul>
      </section>
    </div>
  );
}
