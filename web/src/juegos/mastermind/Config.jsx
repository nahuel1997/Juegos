import { Interruptor, Stepper } from '../../componentes/comunes.jsx';
import { COLORES } from './Juego.jsx';

export default function ConfigMastermind({ config, cambiar }) {
  const set = (cambios) => {
    const nuevo = { ...config, ...cambios };
    if (!nuevo.repetidos && nuevo.largo > nuevo.colores) nuevo.largo = nuevo.colores;
    cambiar(nuevo);
  };
  return (
    <div className="config-grid">
      <section>
        <h3>Código</h3>
        <Stepper etiqueta="Largo del código" valor={config.largo} min={3} max={6} onChange={(largo) => set({ largo })} />
        <Stepper etiqueta="Colores" valor={config.colores} min={4} max={8} onChange={(colores) => set({ colores })} />
        <div className="mm-fila">{COLORES.slice(0, config.colores).map((c) => <span key={c} className="mm-ficha chica" style={{ '--c': c }} />)}</div>
        <Interruptor valor={config.repetidos} onChange={(repetidos) => set({ repetidos })}>Se pueden repetir colores</Interruptor>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Intentos máximos" valor={config.intentos} min={5} max={15} onChange={(intentos) => set({ intentos })} />
        <Interruptor valor={config.azar} onChange={(azar) => set({ azar })}>Códigos al azar (no los arman ustedes)</Interruptor>
        <p className="ayuda">Los dos adivinan a la vez. Gana el que descubre el código en menos intentos.</p>
      </section>
    </div>
  );
}
