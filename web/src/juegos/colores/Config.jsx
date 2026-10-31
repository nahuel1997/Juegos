import { Interruptor, Stepper } from '../../componentes/comunes.jsx';

export default function ConfigColores({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Cartas</h3>
        <Stepper etiqueta="Cantidad de cartas" valor={config.cartas} min={5} max={40} paso={5} onChange={(cartas) => set({ cartas })} />
        <div className="opciones-fila">
          {[4, 6].map((n) => (
            <button key={n} type="button" className={`btn chico ${config.colores === n ? '' : 'fantasma'}`} onClick={() => set({ colores: n })}>{n} colores</button>
          ))}
        </div>
      </section>
      <section>
        <h3>Dificultad</h3>
        <Interruptor valor={config.mezcla} onChange={(mezcla) => set({ mezcla })}>Mezcla: a veces pide lo que DICE en vez del color de la tinta</Interruptor>
        <p className="ayuda">El primero que acierta se lleva la carta. Si le errás, quedás afuera de esa carta.</p>
      </section>
    </div>
  );
}
