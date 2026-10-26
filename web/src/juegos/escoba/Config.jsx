import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigEscoba({ config, cambiar }) {
  return (
    <div className="config-grid">
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Puntos para ganar" valor={config.puntosParaGanar} min={5} max={50} onChange={(puntosParaGanar) => cambiar({ ...config, puntosParaGanar })} />
        <p className="ayuda">Se juegan manos hasta que alguien llega a esos puntos.</p>
      </section>
      <section>
        <h3>Cómo se juega</h3>
        <ul className="lista-simple">
          <li>Valores: del 1 al 7 lo que dicen; sota 8, caballo 9, rey 10.</li>
          <li>Jugás una carta: si con cartas de la mesa suma 15, te las llevás.</li>
          <li>Si dejás la mesa vacía, ¡escoba! (1 punto).</li>
          <li>Al final de la mano: más cartas, más oros, más sietes y el siete de oros, 1 punto cada uno.</li>
        </ul>
      </section>
    </div>
  );
}
