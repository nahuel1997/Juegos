import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigCaballos({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Carrera</h3>
        <Stepper etiqueta="Largo de la pista (cartas)" valor={config.largo} min={4} max={10} onChange={(largo) => set({ largo })} />
        <Stepper etiqueta="Al mejor de (carreras)" valor={config.carreras} min={1} max={9} paso={2} onChange={(carreras) => set({ carreras })} />
      </section>
      <section>
        <h3>Cómo se juega</h3>
        <ul className="lista-simple">
          <li>Corren los cuatro caballos del mazo español. Antes de largar, cada uno elige dos (por turnos).</li>
          <li>Por turno se da vuelta una carta: avanza el caballo de ese palo.</li>
          <li>Cuando los cuatro pasan una carta de la pista, se da vuelta y el caballo de su palo retrocede.</li>
          <li>El dueño del caballo que llega primero se lleva la carrera.</li>
        </ul>
      </section>
    </div>
  );
}
