import { Stepper } from '../../componentes/comunes.jsx';
import { Icono } from '../../iconos.jsx';

export default function ConfigAhorcado({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Rondas" valor={config.rondas} min={1} max={12} onChange={(rondas) => set({ rondas })} />
        <Stepper etiqueta="Errores permitidos" valor={config.errores} min={4} max={10} onChange={(errores) => set({ errores })} />
      </section>
      <section>
        <h3>¿Quién pone la palabra?</h3>
        <div className="opciones">
          <button type="button" className={`opcion ${config.modo === 'rival' ? 'activa' : ''}`} onClick={() => set({ modo: 'rival' })}>
            <b className="con-iconos"><Icono id="lapiz" /> La elige el rival</b>
            <small>Se turnan: uno escribe la palabra (con pista opcional) y el otro adivina.</small>
          </button>
          <button type="button" className={`opcion ${config.modo === 'azar' ? 'activa' : ''}`} onClick={() => set({ modo: 'azar' })}>
            <b className="con-iconos"><Icono id="dado" /> Al azar</b>
            <small>La palabra sale de una lista; cada ronda adivina uno.</small>
          </button>
        </div>
        <p className="ayuda">Adivinar suma 1 punto. Si te ahorcan, el punto es para quien eligió la palabra.</p>
      </section>
    </div>
  );
}
