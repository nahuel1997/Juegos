import { Interruptor, Stepper } from '../../componentes/comunes.jsx';

export default function ConfigUno({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Puntos para ganar" valor={config.meta} min={50} max={500} paso={50} onChange={(meta) => set({ meta })} />
        <p className="ayuda">El que se queda sin cartas suma lo que tiene el otro en la mano: números lo que dicen, Salta, Reversa y +2 valen 20, comodines 50.</p>
        <Interruptor valor={config.castigoUno} onChange={(castigoUno) => set({ castigoUno })}>Castigo por no decir UNO (robás 2)</Interruptor>
      </section>
      <section>
        <h3>Cómo se juega</h3>
        <ul className="lista-simple">
          <li>Tirá una carta del mismo color o del mismo número o símbolo.</li>
          <li>Si no tenés, robá una: si va, la podés tirar; si no, pasás.</li>
          <li>Salta, Reversa, +2 y +4: el otro pierde el turno y volvés a jugar.</li>
          <li>Los comodines van sobre cualquier carta y elegís el color.</li>
          <li>Con dos cartas, tocá ¡UNO! antes de tirar la anteúltima.</li>
        </ul>
      </section>
    </div>
  );
}
