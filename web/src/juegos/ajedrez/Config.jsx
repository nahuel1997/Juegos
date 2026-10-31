import { Stepper } from '../../componentes/comunes.jsx';

const MINUTOS = [0, 1, 3, 5, 10, 15, 30];

export default function ConfigAjedrez({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Reloj</h3>
        <div className="opciones-fila">
          {MINUTOS.map((m) => (
            <button key={m} type="button" className={`btn chico ${config.minutos === m ? '' : 'fantasma'}`} onClick={() => set({ minutos: m })}>{m ? `${m} min` : 'Sin reloj'}</button>
          ))}
        </div>
        {config.minutos > 0 && <Stepper etiqueta="Segundos que suma cada movida" valor={config.incremento} min={0} max={30} onChange={(incremento) => set({ incremento })} />}
        <p className="ayuda">Con reloj, si se te termina el tiempo perdés.</p>
      </section>
      <section>
        <h3>Partida</h3>
        <p className="ayuda">Las blancas se sortean. Vale todo: enroque, captura al paso y coronación. Se puede ofrecer tablas.</p>
      </section>
    </div>
  );
}
