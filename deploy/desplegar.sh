#!/bin/sh
# Despliegue en el servidor de demos (correr en /opt/apps/juegos después de copiar el código):
#   git archive HEAD | ssh root@187.77.244.107 'tar -x -m -C /opt/apps/juegos && sh /opt/apps/juegos/deploy/desplegar.sh'
# Mientras dura, marca "operación en curso" en el panel de apps para que su vigilancia no tome
# los contenedores detenidos como una caída y los reinicie en paralelo.
# Ojo: las partidas en curso viven en memoria y se pierden al recrear la API (el historial no).
set -e
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "Falta .env (ver .env.example)"; exit 1; }
[ -f usuarios.json ] || { echo "Falta usuarios.json (ver usuarios.example.json)"; exit 1; }

marcar() {
  docker exec -w /app panel-apps node -e "
    const db = require('./server/db');
    if ('$1' === 'si') db.prepare('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)').run('op:juegos', JSON.stringify({ desde: Date.now(), accion: 'deploy' }));
    else db.prepare('DELETE FROM ajustes WHERE clave = ?').run('op:juegos');
  " 2>/dev/null || echo "(panel no disponible: sigo sin marcar)"
}

marcar si
trap 'marcar no' EXIT

docker compose build
docker compose up -d
# Si quedó algún contenedor a medio recrear ("<id>_juegos-..."), se saca y se vuelve a levantar.
for c in $(docker ps -a --filter name=_juegos- --format '{{.Names}}'); do docker rm -f "$c" >/dev/null; done
docker compose up -d
docker compose ps --format '{{.Name}} {{.Status}}'

ok=no
for i in $(seq 1 30); do curl -sf http://127.0.0.1:4400/api/salud >/dev/null && { ok=si; break; }; sleep 2; done
if [ "$ok" != si ]; then
  echo "La API no responde después del deploy. Últimos logs:"
  docker compose logs --tail 40 api
  exit 1
fi
echo "API OK"
