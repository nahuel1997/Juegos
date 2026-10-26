import { useState } from 'react';
import { pedir } from '../api.js';

export default function Login({ onEntrar }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const r = await pedir('/login', { metodo: 'POST', datos: { usuario, clave } });
      onEntrar(r.usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-fondo">
      <form className="login tarjeta" onSubmit={entrar}>
        <img src="/icono.svg" alt="" width="64" height="64" />
        <h1>Juegos 1vs1</h1>
        <p className="sub">Entrá para desafiar a tu rival</p>
        <label>
          Usuario
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" autoFocus required />
        </label>
        <label>
          Clave
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn grande" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  );
}
