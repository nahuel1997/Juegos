import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigMonopoly({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Plata</h3>
        <Stepper etiqueta="Plata inicial" valor={config.dinero} min={500} max={5000} paso={250} onChange={(dinero) => set({ dinero })} />
        <Stepper etiqueta="Cobro en la Salida" valor={config.salario} min={0} max={500} paso={50} onChange={(salario) => set({ salario })} />
      </section>
      <section>
        <h3>Duración</h3>
        <Stepper etiqueta="Turnos por jugador (0 = hasta la quiebra)" valor={config.turnos} min={0} max={200} paso={10} onChange={(turnos) => set({ turnos })} />
        <p className="ayuda">Con límite de turnos gana el de más patrimonio (plata + propiedades + casas). Sin límite, se juega hasta que uno se funde.</p>
        <p className="ayuda">Calles y lugares de Lanús: Derqui, La Fortaleza, Gimnasio Moonrock, Cafetería Santa Emilia, Hospital Británico, el Velódromo, las canchas de Fútbol 5 y más.</p>
      </section>
    </div>
  );
}
