import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigBackgammon({ config, cambiar }) {
  return (
    <div className="config-grid">
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Puntos para ganar" valor={config.puntos} min={1} max={11} paso={2} onChange={(puntos) => cambiar({ ...config, puntos })} />
        <p className="ayuda">Ganar una mano vale 1 punto; gammon (el otro no sacó ninguna) 2; backgammon (además tiene fichas en la barra o en tu casa) 3.</p>
      </section>
      <section>
        <h3>Cómo se juega</h3>
        <ul className="lista-simple">
          <li>Llevá tus 15 fichas a tu casa y sacalas. Con dobles movés cuatro veces.</li>
          <li>Una ficha sola se puede comer: va a la barra y tiene que volver a entrar.</li>
          <li>No podés caer donde el otro tiene dos o más.</li>
          <li>Hay que usar los dos dados si se puede (si entra uno solo, el más alto).</li>
        </ul>
      </section>
    </div>
  );
}
