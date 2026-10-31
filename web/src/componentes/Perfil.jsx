import { useRef, useState } from 'react';
import { pedir } from '../api.js';
import { Avatar } from './comunes.jsx';
import { SKINS, Muestra, useSkin } from '../skins.jsx';
import { JUEGOS } from '../juegos/index.js';
import { Icono } from '../iconos.jsx';

// Skin para todos los juegos y la lista de los que tienen una propia.
function Skins() {
  const [general, , elegir, skins] = useSkin('*');
  const propias = Object.entries(skins).filter(([k]) => k !== '*' && JUEGOS[k]);
  return (
    <section className="tarjeta perfil-skins">
      <h3>Skins de los juegos</h3>
      <p className="sub">Cambian mesas, tableros y cartas. Solo las ves vos. Cada juego tiene además su botón “Skin” para elegir una distinta.</p>
      <div className="skin-lista anchas">
        {SKINS.map((s) => (
          <button key={s.id} type="button" className={`skin-op ${general === s.id ? 'activa' : ''}`} onClick={() => elegir('*', s.id)} aria-pressed={general === s.id}>
            <Muestra skin={s.id} tam={36} />
            <span>{s.nombre}</span>
          </button>
        ))}
      </div>
      {propias.length > 0 && (
        <ul className="skins-propias">
          {propias.map(([juego, skin]) => (
            <li key={juego}>
              <Icono id={JUEGOS[juego].icono} tam={22} /> <span>{SKINS.find((s) => s.id === skin)?.nombre}</span>
              <button type="button" className="btn chico fantasma" onClick={() => elegir(juego, null)}>Usar la general</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const TEMAS = [
  { id: 'azul', nombre: 'Azul marino', muestra: ['#0b1e3a', '#ffb703'] },
  { id: 'rosa', nombre: 'Rosa con corazones', muestra: ['#ffd9ea', '#ff4f9a'] },
  { id: 'negro', nombre: 'Negro', muestra: ['#0a0a0a', '#e5e5e5'] },
];

// Recorta al centro en cuadrado y achica a 256 px (JPEG): la foto viaja liviana.
async function prepararFoto(archivo) {
  const img = await createImageBitmap(archivo);
  const lado = Math.min(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  canvas.getContext('2d').drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function Perfil({ usuario, onCambio, volver, avisar }) {
  const [datos, setDatos] = useState({ nombre: usuario.nombre, color: usuario.color, tema: usuario.tema });
  const [claves, setClaves] = useState({ actual: '', nueva: '', repetir: '' });
  const [ocupado, setOcupado] = useState(false);
  const archivo = useRef(null);

  async function hacer(fn, ok) {
    setOcupado(true);
    try {
      const r = await fn();
      if (r?.usuario) onCambio(r.usuario);
      if (ok) avisar(ok);
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setOcupado(false);
    }
  }

  async function subirFoto(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return avisar('Elegí una imagen', 'error');
    hacer(async () => pedir('/perfil/avatar', { metodo: 'PUT', datos: { imagen: await prepararFoto(f) } }), 'Foto actualizada');
  }

  return (
    <div className="perfil">
      <div className="batalla-cab">
        <h2>Tu perfil</h2>
        <button className="btn chico fantasma" onClick={volver}>← Volver</button>
      </div>

      <section className="tarjeta perfil-foto">
        <Avatar usuario={{ ...usuario, ...datos }} tam={96} />
        <div>
          <h3>Foto</h3>
          <div className="acciones">
            <button className="btn" disabled={ocupado} onClick={() => archivo.current.click()}>Subir foto</button>
            {usuario.avatar && (
              <button className="btn fantasma" disabled={ocupado} onClick={() => hacer(() => pedir('/perfil/avatar', { metodo: 'DELETE' }), 'Foto borrada')}>Sacar foto</button>
            )}
          </div>
          <input ref={archivo} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={subirFoto} />
          <p className="ayuda">JPG, PNG o WebP. Se recorta cuadrada.</p>
        </div>
      </section>

      <form
        className="tarjeta perfil-datos"
        onSubmit={(e) => { e.preventDefault(); hacer(() => pedir('/perfil', { metodo: 'PUT', datos }), 'Perfil guardado'); }}
      >
        <h3>Tus datos</h3>
        <label>
          Nombre que ven los demás
          <input value={datos.nombre} maxLength={20} required onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
        </label>
        <label className="fila-color">
          Tu color
          <input type="color" value={datos.color} onChange={(e) => setDatos({ ...datos, color: e.target.value })} />
        </label>
        <div>
          <span className="etq">Tema de la app (solo lo ves vos)</span>
          <div className="temas">
            {TEMAS.map((t) => (
              <button key={t.id} type="button" className={`tema-op ${datos.tema === t.id ? 'activa' : ''}`} onClick={() => setDatos({ ...datos, tema: t.id })}>
                <span className="muestra" style={{ background: `linear-gradient(135deg, ${t.muestra[0]} 55%, ${t.muestra[1]} 55%)` }} />
                {t.nombre}
              </button>
            ))}
          </div>
        </div>
        <button className="btn" disabled={ocupado}>Guardar</button>
      </form>

      <Skins />

      <form
        className="tarjeta perfil-clave"
        onSubmit={(e) => {
          e.preventDefault();
          if (claves.nueva !== claves.repetir) return avisar('Las claves nuevas no coinciden', 'error');
          hacer(async () => {
            await pedir('/perfil/clave', { metodo: 'PUT', datos: { actual: claves.actual, nueva: claves.nueva } });
            setClaves({ actual: '', nueva: '', repetir: '' });
          }, 'Clave cambiada');
        }}
      >
        <h3>Cambiar clave</h3>
        <label>Clave actual<input type="password" autoComplete="current-password" value={claves.actual} onChange={(e) => setClaves({ ...claves, actual: e.target.value })} required /></label>
        <label>Clave nueva<input type="password" autoComplete="new-password" minLength={6} value={claves.nueva} onChange={(e) => setClaves({ ...claves, nueva: e.target.value })} required /></label>
        <label>Repetir clave nueva<input type="password" autoComplete="new-password" minLength={6} value={claves.repetir} onChange={(e) => setClaves({ ...claves, repetir: e.target.value })} required /></label>
        <button className="btn" disabled={ocupado}>Cambiar clave</button>
        <p className="ayuda">Al cambiarla se cierran tus otras sesiones abiertas.</p>
      </form>
    </div>
  );
}
