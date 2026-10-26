import { Stepper } from '../../componentes/comunes.jsx';
import { Icono } from '../../iconos.jsx';

export default function ConfigPpt({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Al mejor de" valor={config.mejorDe} min={1} max={15} paso={2} onChange={(mejorDe) => set({ mejorDe })} />
        <p className="ayuda">Gana el primero en llegar a {Math.ceil(config.mejorDe / 2)}. Los empates no cuentan.</p>
      </section>
      <section>
        <h3>Variante</h3>
        <div className="opciones">
          <button type="button" className={`opcion ${config.variante === 'clasica' ? 'activa' : ''}`} onClick={() => set({ variante: 'clasica' })}>
            <b className="con-iconos"><Icono id="piedra" /><Icono id="papel" /><Icono id="tijera" /> Clásica</b>
            <small>Piedra le gana a tijera, tijera a papel, papel a piedra.</small>
          </button>
          <button type="button" className={`opcion ${config.variante === 'spock' ? 'activa' : ''}`} onClick={() => set({ variante: 'spock' })}>
            <b className="con-iconos"><Icono id="piedra" /><Icono id="papel" /><Icono id="tijera" /><Icono id="lagarto" /><Icono id="spock" /> Con lagarto y Spock</b>
            <small>Tijera corta papel, papel tapa piedra, piedra aplasta lagarto, lagarto envenena a Spock, Spock rompe tijera, tijera decapita lagarto, lagarto come papel, papel refuta a Spock, Spock vaporiza piedra y piedra aplasta tijera.</small>
          </button>
        </div>
      </section>
    </div>
  );
}
