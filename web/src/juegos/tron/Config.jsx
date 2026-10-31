import { Stepper } from '../../componentes/comunes.jsx';

const TAMANIOS = { chico: 'Chico', mediano: 'Mediano', grande: 'Grande' };
const VELOCIDADES = { lenta: 'Lenta', normal: 'Normal', rapida: 'Rápida' };

export default function ConfigTron({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Pista</h3>
        <div className="opciones-fila">
          {Object.entries(TAMANIOS).map(([id, t]) => (
            <button key={id} type="button" className={`btn chico ${config.tamanio === id ? '' : 'fantasma'}`} onClick={() => set({ tamanio: id })}>{t}</button>
          ))}
        </div>
        <h3>Velocidad</h3>
        <div className="opciones-fila">
          {Object.entries(VELOCIDADES).map(([id, t]) => (
            <button key={id} type="button" className={`btn chico ${config.velocidad === id ? '' : 'fantasma'}`} onClick={() => set({ velocidad: id })}>{t}</button>
          ))}
        </div>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Al mejor de (rondas)" valor={config.rondas} min={1} max={9} paso={2} onChange={(rondas) => set({ rondas })} />
        <p className="ayuda">En la PC: flechas o WASD. En el celular: deslizá el dedo sobre la pista o usá los botones.</p>
      </section>
    </div>
  );
}
