import { Stepper } from '../../componentes/comunes.jsx';

const CAMINOS = {
  pocos: 'Casi un solo camino: pocas vueltas',
  varios: 'Varios caminos para llegar al queso',
  muchos: 'Muchas vueltas: más fácil escaparse',
};

export default function ConfigGatoRaton({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Laberinto</h3>
        <Stepper etiqueta="Cuadrados por lado" valor={config.lado} min={6} max={21} onChange={(lado) => set({ lado })} />
        <div className="mini-tablero gr-mini" style={{ '--cols': config.lado }}>
          {Array.from({ length: config.lado * config.lado }, (_, i) => <i key={i} />)}
        </div>
        <p className="ayuda">{config.lado} × {config.lado}. El laberinto sale al azar en cada ronda.</p>
        <div className="opciones">
          {Object.entries(CAMINOS).map(([k, txt]) => (
            <button key={k} type="button" className={`opcion ${config.caminos === k ? 'activa' : ''}`} onClick={() => set({ caminos: k })}>
              <b>{k[0].toUpperCase() + k.slice(1)} caminos</b>
              <small>{txt}</small>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Rondas" valor={config.rondas} min={1} max={10} onChange={(rondas) => set({ rondas })} />
        <p className="ayuda">Una moneda al aire decide quién arranca de gato. En cada ronda se cambian los papeles. Gana el que gana más rondas.</p>
        <Stepper etiqueta="Movimientos del ratón" valor={config.limite} min={10} max={200} paso={5} onChange={(limite) => set({ limite })} />
        <p className="ayuda">Si el ratón no llega al queso en esa cantidad de movimientos, gana el gato. Se mueven de a un cuadrado, una vez cada uno; el gato no puede pisar el queso.</p>
      </section>
    </div>
  );
}
