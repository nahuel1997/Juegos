import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigRuletaEmojis({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Rondas" valor={config.rondas} min={3} max={20} onChange={(rondas) => set({ rondas })} />
        <Stepper etiqueta="Segundos para adivinar" valor={config.segundos} min={15} max={90} paso={5} onChange={(segundos) => set({ segundos })} />
      </section>
      <section>
        <h3>Puntos</h3>
        <p className="ayuda">El primero que la escribe suma 3, el segundo 2 y los demás que la saquen, 1. A mitad de tiempo aparece la primera letra. No hace falta escribir las tildes.</p>
      </section>
    </div>
  );
}
