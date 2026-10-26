import { Interruptor } from '../../componentes/comunes.jsx';

export default function ConfigGenerala({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Reglas</h3>
        <Interruptor valor={config.servidaGana} onChange={(servidaGana) => set({ servidaGana })}>
          Generala servida gana la partida
        </Interruptor>
        <Interruptor valor={config.dobleGenerala} onChange={(dobleGenerala) => set({ dobleGenerala })}>
          Se juega con doble generala (100)
        </Interruptor>
        <Interruptor valor={config.bonoServido} onChange={(bonoServido) => set({ bonoServido })}>
          Escalera, full o póker servidos suman 5 más
        </Interruptor>
      </section>
      <section>
        <h3>Puntajes</h3>
        <ul className="lista-simple">
          <li>1 al 6: la suma de esos dados</li>
          <li>Escalera (1-5, 2-6 o 3-6+1): 20</li>
          <li>Full (3 + 2 iguales): 30</li>
          <li>Póker (4 iguales): 40</li>
          <li>Generala (5 iguales): 50</li>
          {config.dobleGenerala && <li>Doble generala: 100 (si ya anotaste la generala)</li>}
        </ul>
        <p className="ayuda">Hasta 3 tiros por turno. Tocá un dado para guardarlo. Si no te sirve nada, tachá una categoría (0).</p>
      </section>
    </div>
  );
}
