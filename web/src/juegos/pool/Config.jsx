import { Interruptor } from '../../componentes/comunes.jsx';

export default function ConfigPool({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Reglas</h3>
        <Interruptor valor={config.faltaPrimerToque} onChange={(faltaPrimerToque) => set({ faltaPrimerToque })}>Es falta tocar primero una bola del otro</Interruptor>
        <Interruptor valor={config.ayudaPunteria} onChange={(ayudaPunteria) => set({ ayudaPunteria })}>Línea de ayuda para apuntar</Interruptor>
      </section>
      <section>
        <h3>Bola 8</h3>
        <ul className="lista-simple">
          <li>La primera que metés define si sos lisas (1-7) o rayadas (9-15).</li>
          <li>Si metés una tuya, seguís tirando.</li>
          <li>Meter la blanca o no tocar ninguna es falta: pasa el turno.</li>
          <li>La 8 va al final. Si entra antes (o con falta), perdés.</li>
        </ul>
      </section>
    </div>
  );
}
