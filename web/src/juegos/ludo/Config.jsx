import { Interruptor } from '../../componentes/comunes.jsx';

export default function ConfigLudo({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Salir de la casa</h3>
        <div className="opciones">
          <button type="button" className={`opcion ${config.salida === 'seis' ? 'activa' : ''}`} onClick={() => set({ salida: 'seis' })}>
            <b>Con 6</b><small>La clásica: solo un 6 saca una ficha.</small>
          </button>
          <button type="button" className={`opcion ${config.salida === 'unoOSeis' ? 'activa' : ''}`} onClick={() => set({ salida: 'unoOSeis' })}>
            <b>Con 1 o 6</b><small>Más rápida: también sale con 1.</small>
          </button>
        </div>
      </section>
      <section>
        <h3>Reglas</h3>
        <Interruptor valor={config.seisRepite} onChange={(seisRepite) => set({ seisRepite })}>Con 6 volvés a tirar</Interruptor>
        <Interruptor valor={config.comerRepite} onChange={(comerRepite) => set({ comerRepite })}>Si comés, volvés a tirar</Interruptor>
        <Interruptor valor={config.exacto} onChange={(exacto) => set({ exacto })}>Para entrar a la meta hace falta el número justo</Interruptor>
        <p className="ayuda">Las casillas con estrella y las de salida son seguras: ahí no te pueden comer.</p>
      </section>
    </div>
  );
}
