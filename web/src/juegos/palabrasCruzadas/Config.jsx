import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigPalabrasCruzadas({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>¿Quién decide si una palabra vale?</h3>
        <div className="opciones">
          <button type="button" className={`opcion ${config.revision === 'si' ? 'activa' : ''}`} onClick={() => set({ revision: 'si' })}>
            <b>La revisan los demás</b><small>Cada jugada se puede anular con “¡No vale!”</small>
          </button>
          <button type="button" className={`opcion ${config.revision === 'no' ? 'activa' : ''}`} onClick={() => set({ revision: 'no' })}>
            <b>Vale todo</b><small>Confianza total: no se revisa</small>
          </button>
        </div>
        {config.revision === 'si' && <Stepper etiqueta="Segundos para revisar" valor={config.segundosRevision} min={5} max={60} paso={5} onChange={(segundosRevision) => set({ segundosRevision })} />}
      </section>
      <section>
        <h3>Tiempo</h3>
        <div className="opciones">
          {[0, 60, 120, 180].map((s) => (
            <button key={s} type="button" className={`opcion ${config.segundosTurno === s ? 'activa' : ''}`} onClick={() => set({ segundosTurno: s })}>
              <b>{s ? `${s / 60} min por turno` : 'Sin límite'}</b>
            </button>
          ))}
        </div>
        <p className="ayuda">Tablero de 15 × 15, 7 fichas cada uno y 2 comodines en la bolsa. Usar las 7 fichas en una jugada suma 50.</p>
      </section>
    </div>
  );
}
