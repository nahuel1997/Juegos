import { Stepper } from '../../componentes/comunes.jsx';
import { CATEGORIAS } from '../../../../api/src/juegos/adivinaDatos.js';

export default function ConfigAdivina({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  const alternar = (k) => {
    const lista = config.categorias.includes(k) ? config.categorias.filter((x) => x !== k) : [...config.categorias, k];
    if (lista.length) set({ categorias: lista });
  };
  return (
    <div className="config-grid">
      <section>
        <h3>¿De qué?</h3>
        <div className="chips">
          {Object.entries(CATEGORIAS).map(([k, c]) => (
            <button key={k} type="button" className={`chip boton ${config.categorias.includes(k) ? 'activa' : ''}`} onClick={() => alternar(k)} aria-pressed={config.categorias.includes(k)}>
              {c.nombre} <small>({c.items.length})</small>
            </button>
          ))}
        </div>
        <p className="ayuda">Países, comidas (por sus ingredientes), cosas de todos los días y clubes de fútbol con pistas bien obvias.</p>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Rondas" valor={config.rondas} min={3} max={20} onChange={(rondas) => set({ rondas })} />
        <Stepper etiqueta="Segundos entre pistas" valor={config.segundos} min={4} max={20} onChange={(segundos) => set({ segundos })} />
        <p className="ayuda">Hay 5 pistas, de la más difícil a la más fácil. Sacarla con la primera vale 5; con la última, 1. El primero suma 1 de yapa.</p>
      </section>
    </div>
  );
}
