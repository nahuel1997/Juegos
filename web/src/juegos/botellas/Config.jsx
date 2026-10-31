import { Interruptor, Stepper } from '../../componentes/comunes.jsx';

export default function ConfigBotellas({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Mezcla</h3>
        <Stepper etiqueta="Colores" valor={config.colores} min={3} max={10} onChange={(colores) => set({ colores })} />
        <Stepper etiqueta="Botellas vacías" valor={config.vacias} min={1} max={3} onChange={(vacias) => set({ vacias })} />
        <Interruptor valor={config.escondidos} onChange={(escondidos) => set({ escondidos })}>Colores escondidos: solo se ve el de arriba hasta que lo destapás</Interruptor>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Al mejor de (rondas)" valor={config.rondas} min={1} max={9} paso={2} onChange={(rondas) => set({ rondas })} />
        <p className="ayuda">Los dos reciben la misma mezcla. No ves las botellas del otro, solo cuántas lleva listas.</p>
      </section>
    </div>
  );
}
