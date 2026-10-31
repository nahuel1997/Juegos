import { Stepper } from '../../componentes/comunes.jsx';
import { CATEGORIAS } from '../../../../api/src/juegos/masOMenosDatos.js';

export default function ConfigMasOMenos({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  const alternar = (k) => {
    const lista = config.categorias.includes(k) ? config.categorias.filter((x) => x !== k) : [...config.categorias, k];
    if (lista.length) set({ categorias: lista });
  };
  return (
    <div className="config-grid">
      <section>
        <h3>Categorías</h3>
        <div className="chips">
          {Object.entries(CATEGORIAS).map(([k, c]) => (
            <button key={k} type="button" className={`chip boton ${config.categorias.includes(k) ? 'activa' : ''}`} onClick={() => alternar(k)} aria-pressed={config.categorias.includes(k)}>
              {c.nombre}
            </button>
          ))}
        </div>
        <p className="ayuda">Habitantes de países, alturas de montañas y edificios, velocidades de animales, años de inventos, calorías y distancias desde Buenos Aires. Los números son aproximados.</p>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Preguntas" valor={config.preguntas} min={3} max={30} onChange={(preguntas) => set({ preguntas })} />
        <Stepper etiqueta="Segundos para responder" valor={config.segundos} min={4} max={30} onChange={(segundos) => set({ segundos })} />
      </section>
    </div>
  );
}
