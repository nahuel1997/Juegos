import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigNim({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Palitos</h3>
        <div className="opciones">
          <button type="button" className={`opcion ${config.armado === 'clasico' ? 'activa' : ''}`} onClick={() => set({ armado: 'clasico' })}>
            <b>Pirámide clásica</b><small>1, 3, 5 y 7 palitos</small>
          </button>
          <button type="button" className={`opcion ${config.armado === 'azar' ? 'activa' : ''}`} onClick={() => set({ armado: 'azar' })}>
            <b>Al azar</b><small>Pilas distintas en cada ronda</small>
          </button>
        </div>
        <Stepper etiqueta="Pilas" valor={config.pilas} min={2} max={6} onChange={(pilas) => set({ pilas })} />
        {config.armado === 'azar' && <Stepper etiqueta="Máximo por pila" valor={config.maximo} min={3} max={12} onChange={(maximo) => set({ maximo })} />}
      </section>
      <section>
        <h3>Reglas</h3>
        <div className="opciones">
          <button type="button" className={`opcion ${config.ultimo === 'pierde' ? 'activa' : ''}`} onClick={() => set({ ultimo: 'pierde' })}>
            <b>El último pierde</b><small>El clásico de bar</small>
          </button>
          <button type="button" className={`opcion ${config.ultimo === 'gana' ? 'activa' : ''}`} onClick={() => set({ ultimo: 'gana' })}>
            <b>El último gana</b><small>El que se lleva el último palito</small>
          </button>
        </div>
        <Stepper etiqueta="Máximo por jugada (0 = sin límite)" valor={config.limite} min={0} max={5} onChange={(limite) => set({ limite })} />
        <Stepper etiqueta="Rondas" valor={config.rondas} min={1} max={9} onChange={(rondas) => set({ rondas })} />
      </section>
    </div>
  );
}
