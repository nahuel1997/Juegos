import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigMemo({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Cartas</h3>
        <Stepper etiqueta="Pares" valor={config.pares} min={4} max={24} onChange={(pares) => set({ pares })} />
        <p className="ayuda">{config.pares * 2} cartas en la mesa.</p>
      </section>
      <section>
        <h3>Ritmo</h3>
        <Stepper etiqueta="Segundos para mirar si no son pareja" valor={config.segundosMirar} min={1} max={5} onChange={(segundosMirar) => set({ segundosMirar })} />
        <p className="ayuda">Si encontrás un par, te lo quedás y seguís jugando.</p>
      </section>
    </div>
  );
}
