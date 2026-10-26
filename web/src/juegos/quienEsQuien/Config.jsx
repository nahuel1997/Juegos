import { Stepper, Interruptor } from '../../componentes/comunes.jsx';
import { Gato, Perro } from './dibujos.jsx';

const MUESTRA_GATO = { nombre: 'muestra-g', color: 'naranja', patron: 'atigrado', tamano: 'gordito', ojos: 'verde', accesorio: 'mono' };
const MUESTRA_PERRO = { nombre: 'muestra-p', raza: 'pitbull', color: 'caramelo', patron: 'bicolor', tamano: 'grande', orejas: 'caidas', nariz: 'rosa', accesorio: 'collar' };

export default function ConfigQuien({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Versión</h3>
        <div className="quien-temas">
          <button type="button" className={`opcion ${config.tema === 'gatitos' ? 'activa' : ''}`} onClick={() => set({ tema: 'gatitos' })}>
            <span className="quien-muestra"><Gato p={MUESTRA_GATO} /></span>
            <b>Gatitos</b>
            <small>Flaquitos, gorditos, atigrados, con manchas…</small>
          </button>
          <button type="button" className={`opcion ${config.tema === 'perritos' ? 'activa' : ''}`} onClick={() => set({ tema: 'perritos' })}>
            <span className="quien-muestra"><Perro p={MUESTRA_PERRO} /></span>
            <b>Perritos</b>
            <small>Pitbulls, caniches, salchichas y más razas.</small>
          </button>
        </div>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Personajes" valor={config.cantidad} min={12} max={24} paso={4} onChange={(cantidad) => set({ cantidad })} />
        <Interruptor valor={config.errarPierde} onChange={(errarPierde) => set({ errarPierde })}>Si arriesgás y le errás, perdés</Interruptor>
        <p className="ayuda">En tu turno hacés una pregunta (la responde la app) o arriesgás quién es. Bajá las cartas que vas descartando.</p>
      </section>
    </div>
  );
}
