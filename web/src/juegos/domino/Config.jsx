import { Stepper, Interruptor } from '../../componentes/comunes.jsx';

export default function ConfigDomino({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Reparto</h3>
        <Stepper etiqueta="Fichas para cada uno" valor={config.fichasIniciales} min={5} max={10} onChange={(fichasIniciales) => set({ fichasIniciales })} />
        <Interruptor valor={config.conPozo} onChange={(conPozo) => set({ conPozo })}>Se roba del pozo si no tenés ficha</Interruptor>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Puntos para ganar" valor={config.puntosParaGanar} min={0} max={200} paso={25} onChange={(puntosParaGanar) => set({ puntosParaGanar })} />
        <p className="ayuda">
          {config.puntosParaGanar === 0 ? 'Se juega una sola mano.' : `Quien gana una mano se anota los puntos de las fichas del otro. Gana el primero en llegar a ${config.puntosParaGanar}.`} Si se tranca, gana la mano quien suma menos.
        </p>
      </section>
    </div>
  );
}
