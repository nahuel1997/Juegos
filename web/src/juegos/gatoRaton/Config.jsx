import { Stepper } from '../../componentes/comunes.jsx';

const CAMINOS = {
  pocos: 'Casi un solo camino: pocas vueltas',
  varios: 'Varios caminos y algunas vueltas',
  muchos: 'Muchas vueltas: más fácil escaparse',
};
const VENTAJAS = {
  igual: ['Igual de rápidos', 'Le cuesta más al gato'],
  poca: ['Gato un poco más rápido', 'Lo más parejo'],
  mucha: ['Gato mucho más rápido', 'Para ratones expertos'],
};

export default function ConfigGatoRaton({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Laberinto</h3>
        <Stepper etiqueta="Cuadrados por lado" valor={config.lado} min={7} max={19} onChange={(lado) => set({ lado })} />
        <div className="mini-tablero gr-mini" style={{ '--cols': config.lado }}>
          {Array.from({ length: config.lado * config.lado }, (_, i) => <i key={i} />)}
        </div>
        <p className="ayuda">{config.lado} × {config.lado}. El laberinto sale al azar en cada ronda, con madrigueras en tres esquinas.</p>
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
        <p className="ayuda">Una moneda al aire decide quién arranca de gato. En cada ronda se cambian los papeles.</p>
        <Stepper etiqueta="Quesos para comer" valor={config.quesos} min={1} max={6} onChange={(quesos) => set({ quesos })} />
        <Stepper etiqueta="Segundos por ronda" valor={config.tiempo} min={20} max={180} paso={10} onChange={(tiempo) => set({ tiempo })} />
        <p className="ayuda">Si el ratón no se come todos los quesos a tiempo, gana el gato.</p>
        <div className="opciones">
          {Object.entries(VENTAJAS).map(([k, [titulo, txt]]) => (
            <button key={k} type="button" className={`opcion ${config.ventaja === k ? 'activa' : ''}`} onClick={() => set({ ventaja: k })}>
              <b>{titulo}</b>
              <small>{txt}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
