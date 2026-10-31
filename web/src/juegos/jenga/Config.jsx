import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigJenga({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Torre</h3>
        <Stepper etiqueta="Pisos" valor={config.pisos} min={9} max={18} onChange={(pisos) => set({ pisos })} />
        <div className="jg-mini" aria-hidden="true">
          {Array.from({ length: config.pisos }, (_, i) => <i key={i} className={i % 2 ? 'b' : 'a'} />)}
        </div>
        <p className="ayuda">Cada piso tiene 3 bloques. Los que sacás van arriba de todo, así que la torre crece y se pone cada vez más inestable.</p>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Rondas" valor={config.rondas} min={1} max={7} onChange={(rondas) => set({ rondas })} />
        <Stepper etiqueta="Segundos por turno" valor={config.segundosTurno} min={10} max={60} paso={5} onChange={(segundosTurno) => set({ segundosTurno })} />
        <p className="ayuda">El que tira la torre pierde la ronda (los demás suman 1). Si se te termina el tiempo, cuenta como un mal pulso.</p>
      </section>
    </div>
  );
}
