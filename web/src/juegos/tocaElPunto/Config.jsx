import { Stepper } from '../../componentes/comunes.jsx';

const TAMANIOS = { grande: 'Grandes (para el celular)', normal: 'Normales', chico: 'Chicos (para expertos)' };

export default function ConfigTocaElPunto({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Círculos</h3>
        <div className="opciones">
          {Object.entries(TAMANIOS).map(([k, txt]) => (
            <button key={k} type="button" className={`opcion ${config.tamanio === k ? 'activa' : ''}`} onClick={() => set({ tamanio: k })}>
              <b>{txt}</b>
            </button>
          ))}
        </div>
        <p className="ayuda">Todos reciben los mismos círculos en el mismo orden; se van achicando a medida que acertás.</p>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Segundos por ronda" valor={config.segundos} min={10} max={90} paso={5} onChange={(segundos) => set({ segundos })} />
        <Stepper etiqueta="Rondas" valor={config.rondas} min={1} max={5} onChange={(rondas) => set({ rondas })} />
        <p className="ayuda">El que más toca en la ronda suma 3, y todos suman 1 cada 10 toques.</p>
      </section>
    </div>
  );
}
