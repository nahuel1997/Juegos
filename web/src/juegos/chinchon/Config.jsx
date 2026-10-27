import { Interruptor, Stepper } from '../../componentes/comunes.jsx';

export default function ConfigChinchon({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Pierde el que pasa" valor={config.limite} min={50} max={200} paso={10} onChange={(limite) => set({ limite })} />
        <Interruptor valor={config.comodines} onChange={(comodines) => set({ comodines })}>Con dos comodines (valen 25 sueltos)</Interruptor>
        <Interruptor valor={config.ochosYNueves} onChange={(ochosYNueves) => set({ ochosYNueves })}>Con ochos y nueves (48 cartas)</Interruptor>
        <p className="ayuda">Sin ochos ni nueves, en las escaleras el 7 sigue con la sota (10).</p>
      </section>
      <section>
        <h3>Cómo se juega</h3>
        <ul className="lista-simple">
          <li>Robás del mazo o la de arriba del pozo, y tirás una.</li>
          <li>Combinaciones: escalera (3 o más seguidas del mismo palo) o pierna (3 o 4 iguales).</li>
          <li>La app te acomoda la mano sola y te marca con qué carta podés cortar.</li>
          <li>Cortás si lo suelto suma 5 o menos. Todo ligado: menos diez.</li>
          <li>Siete seguidas del mismo palo sin comodín: ¡chinchón! y ganás la partida.</li>
        </ul>
      </section>
    </div>
  );
}
