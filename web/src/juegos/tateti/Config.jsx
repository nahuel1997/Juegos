import { Interruptor, Stepper } from '../../componentes/comunes.jsx';

export default function ConfigTateti({ config, cambiar }) {
  const set = (cambios) => {
    const nuevo = { ...config, ...cambios };
    if (nuevo.enLinea > nuevo.lado) nuevo.enLinea = nuevo.lado;
    cambiar(nuevo);
  };
  return (
    <div className="config-grid">
      <section>
        <h3>Tablero</h3>
        <Stepper etiqueta="Casillas por lado" valor={config.lado} min={3} max={5} onChange={(lado) => set({ lado })} />
        <Stepper etiqueta="En línea para ganar" valor={config.enLinea} min={3} max={config.lado} onChange={(enLinea) => set({ enLinea })} />
        <Interruptor valor={config.movimiento} onChange={(movimiento) => set({ movimiento })}>Con movimiento: solo {config.enLinea} fichas cada uno y después se mueven</Interruptor>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Al mejor de" valor={config.partidas} min={1} max={9} paso={2} onChange={(partidas) => set({ partidas })} />
        <p className="ayuda">Arranca uno y en la siguiente el otro. El que arranca es la cruz.</p>
      </section>
    </div>
  );
}
