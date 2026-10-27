import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigQuoridor({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Tablero</h3>
        <Stepper etiqueta="Casillas por lado" valor={config.lado} min={5} max={11} paso={2} onChange={(lado) => set({ lado })} />
        <Stepper etiqueta="Paredes por jugador" valor={config.paredes} min={0} max={20} onChange={(paredes) => set({ paredes })} />
      </section>
      <section>
        <h3>Fichas</h3>
        <div className="opciones">
          <button type="button" className={`opcion ${config.fichas === 1 ? 'activa' : ''}`} onClick={() => set({ fichas: 1 })}><b>Una ficha</b><small>El clásico: gana el primero en cruzar</small></button>
          <button type="button" className={`opcion ${config.fichas === 3 ? 'activa' : ''}`} onClick={() => set({ fichas: 3 })}><b>Tres tapitas</b><small>Hay que cruzar las tres</small></button>
        </div>
        <p className="ayuda">En tu turno: movés una ficha una casilla (si hay otra al lado la saltás) o ponés una pared de dos casillas.</p>
      </section>
    </div>
  );
}
