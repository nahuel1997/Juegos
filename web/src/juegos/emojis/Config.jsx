import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigEmojis({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Canciones que arma cada uno" valor={config.turnos} min={1} max={6} onChange={(turnos) => set({ turnos })} />
        <Stepper etiqueta="Segundos para adivinar" valor={config.tiempo} min={30} max={180} paso={15} onChange={(tiempo) => set({ tiempo })} />
      </section>
      <section>
        <h3>Cómo se arma</h3>
        <p className="ayuda">Elegís una canción entre tres y la contás solo con dibujitos (hasta 10). Mientras el otro adivina, podés sumar 2 de ayuda.</p>
      </section>
    </div>
  );
}
