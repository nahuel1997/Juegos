export async function pedir(ruta, { metodo = 'GET', datos } = {}) {
  const r = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: datos ? { 'content-type': 'application/json' } : undefined,
    body: datos ? JSON.stringify(datos) : undefined,
    credentials: 'same-origin',
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(json.error || 'Error de conexión'), { status: r.status });
  return json;
}
