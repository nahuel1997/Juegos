import { useEffect, useState } from 'react';
import { Stepper } from '../../componentes/comunes.jsx';

const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const SUGERIDAS = ['Comida', 'Marca', 'Profesión', 'Película o serie', 'Deporte', 'Cantante o banda', 'Parte del cuerpo', 'Ropa', 'Cosa de la casa', 'Famoso/a', 'Instrumento', 'Verbo'];

export default function ConfigTuti({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  // Las columnas se editan en borrador y se mandan al salir del campo (así no se manda cada tecla).
  const [columnas, setColumnas] = useState(config.columnas);
  useEffect(() => setColumnas(config.columnas), [config.columnas]);
  const aplicar = (lista) => {
    const limpias = lista.map((c) => c.trim()).filter(Boolean);
    if (JSON.stringify(limpias) !== JSON.stringify(config.columnas)) set({ columnas: limpias });
  };

  return (
    <div className="config-grid">
      <section>
        <h3>Columnas ({columnas.length})</h3>
        <ul className="columnas-edit">
          {columnas.map((c, i) => (
            <li key={i}>
              <input
                value={c}
                maxLength={24}
                onChange={(e) => setColumnas(columnas.map((x, k) => (k === i ? e.target.value : x)))}
                onBlur={() => aplicar(columnas)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              />
              <button type="button" className="btn chico fantasma" disabled={columnas.length <= 1} onClick={() => aplicar(columnas.filter((_, k) => k !== i))} aria-label={`Sacar ${c}`}>✕</button>
            </li>
          ))}
        </ul>
        <div className="acciones">
          <button type="button" className="btn chico fantasma" disabled={columnas.length >= 12} onClick={() => setColumnas([...columnas, ''])}>+ Columna</button>
        </div>
        <div className="sugeridas">
          {SUGERIDAS.filter((s) => !columnas.some((c) => c.toLowerCase() === s.toLowerCase())).map((s) => (
            <button key={s} type="button" className="chip boton" disabled={columnas.length >= 12} onClick={() => aplicar([...columnas, s])}>+ {s}</button>
          ))}
        </div>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Rondas" valor={config.rondas} min={1} max={20} onChange={(rondas) => set({ rondas })} />
        <Stepper etiqueta="Segundos después del ¡basta!" valor={config.segundosBasta} min={0} max={60} paso={5} onChange={(segundosBasta) => set({ segundosBasta })} />
        <h3>Letras que no salen</h3>
        <div className="letras-toggle">
          {LETRAS.map((l) => {
            const fuera = config.excluidas.includes(l);
            return (
              <button key={l} type="button" className={`tecla ${fuera ? 'mal' : 'bien'}`} onClick={() => set({ excluidas: fuera ? config.excluidas.filter((x) => x !== l) : [...config.excluidas, l] })}>
                {l}
              </button>
            );
          })}
        </div>
        <p className="ayuda">Los puntos los ponen ustedes al cerrar cada ronda (sugerencia: 10 si es única, 5 si repiten, 20 si el otro no puso nada).</p>
      </section>
    </div>
  );
}
