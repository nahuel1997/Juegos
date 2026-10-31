import { useState } from 'react';
import { pedir } from '../api.js';

// Dos formas de entrar: con tu usuario, o con el código de una sala que te pasaron (sin cuenta).
export default function Login({ onEntrar, codigoInicial = '' }) {
  const [modo, setModo] = useState(codigoInicial ? 'codigo' : 'usuario');
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [codigo, setCodigo] = useState(codigoInicial);
  const [nombre, setNombre] = useState(() => {
    try { return localStorage.getItem('nombre-invitado') || ''; } catch { return ''; }
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      if (modo === 'usuario') {
        const r = await pedir('/login', { metodo: 'POST', datos: { usuario, clave } });
        onEntrar(r.usuario);
      } else {
        try { localStorage.setItem('nombre-invitado', nombre.trim()); } catch { /* sin storage */ }
        const r = await pedir('/invitado', { metodo: 'POST', datos: { codigo, nombre } });
        onEntrar(r.usuario);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-fondo">
      <form className="login tarjeta" onSubmit={enviar}>
        <img src="/icono.svg" alt="" width="64" height="64" />
        <h1>Juegos 1vs1</h1>
        <div className="pestanas login-pestanas" role="tablist">
          <button type="button" role="tab" aria-selected={modo === 'usuario'} className={modo === 'usuario' ? 'activa' : ''} onClick={() => { setModo('usuario'); setError(''); }}>Tengo usuario</button>
          <button type="button" role="tab" aria-selected={modo === 'codigo'} className={modo === 'codigo' ? 'activa' : ''} onClick={() => { setModo('codigo'); setError(''); }}>Tengo un código</button>
        </div>
        {modo === 'usuario' ? (
          <>
            <p className="sub">Entrá para desafiar a tu rival</p>
            <label>
              Usuario
              <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" autoFocus required />
            </label>
            <label>
              Clave
              <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required />
            </label>
          </>
        ) : (
          <>
            <p className="sub">Te pasaron el código de una sala: entrá sin usuario.</p>
            <label>
              Código de la sala
              <input
                className="campo-codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck="false"
                inputMode="text"
                placeholder="ABC12"
                required
                autoFocus={!codigoInicial}
              />
            </label>
            <label>
              Tu nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value.slice(0, 20))} autoComplete="nickname" required autoFocus={!!codigoInicial} />
            </label>
          </>
        )}
        {error && <div className="error">{error}</div>}
        <button className="btn grande" disabled={enviando}>{enviando ? 'Entrando…' : modo === 'usuario' ? 'Entrar' : 'Entrar a la sala'}</button>
      </form>
    </div>
  );
}
