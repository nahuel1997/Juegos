import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigPenales({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Serie</h3>
        <Stepper etiqueta="Penales para cada uno" valor={config.tiros} min={1} max={10} onChange={(tiros) => set({ tiros })} />
        <p className="ayuda">Si empatan, muerte súbita: un penal cada uno hasta que alguien falle.</p>
      </section>
      <section>
        <h3>Arco</h3>
        <div className="opciones">
          {[6, 9].map((z) => (
            <button key={z} type="button" className={`opcion ${config.zonas === z ? 'activa' : ''}`} onClick={() => set({ zonas: z })}>
              <b>{z} zonas</b>
              <small>{z === 6 ? '3 columnas × 2 alturas (más goles)' : '3 columnas × 3 alturas (más difícil para el arquero)'}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
