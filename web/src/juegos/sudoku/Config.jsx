import { Stepper } from '../../componentes/comunes.jsx';

const DIFICULTAD = { facil: ['Fácil', '40 números de entrada'], medio: ['Medio', '32 números'], dificil: ['Difícil', '26 números'] };

export default function ConfigSudoku({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Dificultad</h3>
        <div className="opciones">
          {Object.entries(DIFICULTAD).map(([k, [t, s]]) => (
            <button key={k} type="button" className={`opcion ${config.dificultad === k ? 'activa' : ''}`} onClick={() => set({ dificultad: k })}><b>{t}</b><small>{s}</small></button>
          ))}
        </div>
      </section>
      <section>
        <h3>Errores</h3>
        <Stepper etiqueta="Errores permitidos (0 = sin límite)" valor={config.errores} min={0} max={10} onChange={(errores) => set({ errores })} />
        <p className="ayuda">Los dos resuelven el mismo sudoku a la vez. Un número mal no queda y suma un error. Gana el primero que lo completa.</p>
      </section>
    </div>
  );
}
