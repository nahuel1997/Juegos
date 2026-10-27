import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigDibujar({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Veces que dibuja cada uno" valor={config.turnos} min={1} max={6} onChange={(turnos) => set({ turnos })} />
        <Stepper etiqueta="Segundos por dibujo" valor={config.tiempo} min={30} max={180} paso={10} onChange={(tiempo) => set({ tiempo })} />
      </section>
      <section>
        <h3>Cómo se juega</h3>
        <ul className="lista-simple">
          <li>El que dibuja elige una palabra entre tres y la dibuja (sin letras, eh).</li>
          <li>El otro escribe lo que cree que es; si está cerca, le avisa “¡casi!”.</li>
          <li>Cuanto más rápido lo adivina, más puntos: el que adivina y la mitad para el que dibujó.</li>
        </ul>
      </section>
    </div>
  );
}
