import { Stepper } from '../../componentes/comunes.jsx';

const DIFICULTADES = {
  facil: ['Fácil', '5 segundos para mirar, pocos dibujitos'],
  normal: ['Normal', '3,5 segundos y bastante mezcla'],
  dificil: ['Difícil', '2 segundos y un montón de cosas'],
};

export default function ConfigContaObjetos({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Dificultad</h3>
        <div className="opciones">
          {Object.entries(DIFICULTADES).map(([k, [titulo, txt]]) => (
            <button key={k} type="button" className={`opcion ${config.dificultad === k ? 'activa' : ''}`} onClick={() => set({ dificultad: k })}>
              <b>{titulo}</b><small>{txt}</small>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Preguntas" valor={config.preguntas} min={3} max={20} onChange={(preguntas) => set({ preguntas })} />
        <p className="ayuda">Exacto vale 3 (y 1 más para el primero que la clava). Errarle por uno vale 1.</p>
      </section>
    </div>
  );
}
