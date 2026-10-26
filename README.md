# Juegos 1vs1

App de juegos online 1 contra 1: **batalla naval**, **ahorcado**, **tuti fruti**, **generala** y **escoba del 15**.
Cada desafío abre una **sala de configuración** donde los dos ajustan las reglas en vivo y arrancan cuando están listos.
Suena un aviso cuando te toca (se silencia con 🔔). Tiene **chat en vivo** y **perfil** (nombre, color, tema azul/rosa/negro, foto y clave).

- **api/**: Node 20 + Express 5 + Socket.IO (tiempo real). Login con cookie httpOnly (JWT), claves con bcrypt.
  Las partidas viven en memoria; el historial se guarda en `DATA_DIR/historial.json` (volumen Docker).
- **web/**: React 18 + Vite, servido por Nginx, que además proxea `/api` y `/socket.io` a la API.

## Juegos

- **Batalla naval**: filas y columnas (6 a 15), cantidad de cada barco y si pueden ir pegados (por defecto sí). Cada tiro pasa el turno (opcional: tocado = seguís).
- **Ahorcado**: rondas alternadas; la palabra la elige el rival (con pista) o sale al azar. Errores permitidos configurables.
- **Tuti fruti**: columnas propias, letras excluidas, letra al azar sin repetir, cuenta para prepararse antes de cada letra (5 s, configurable), ¡basta! con cuenta regresiva y puntos manuales.
- **Generala**: 5 dados, 3 tiros, escalera/full/póker/generala/doble; servida opcional gana.
- **Escoba del 15**: mazo español, escobas, más cartas/oros/sietes y siete de oros (suma en el momento en que se levanta); cada uno ve cuántas cartas, oros y sietes lleva; animación especial del 7 de oros; se juega hasta N puntos.

Las salas y partidas en curso se guardan en `DATA_DIR/salas.json` en cada jugada: si alguien se desconecta o se reinicia el servidor (o hay un deploy), al volver siguen donde estaban. El historial, el chat y los perfiles (con las fotos) también viven en `DATA_DIR` (volumen Docker).

## Usuarios

Están en `usuarios.json` en la raíz (solo hashes), **fuera de git**. Para crearlo:

```bash
cp usuarios.example.json usuarios.json
cd api && npm run hash -- "la clave"
```

y pegar cada hash en su usuario. Opcional: `"tema": "rosa"` le da a ese usuario la estética rosa con corazones. En Docker se monta como solo lectura en el contenedor de la API.

## Desarrollo local

```bash
cd api && npm install && npm run dev      # API en :4400
cd web && npm install && npm run dev      # front en http://localhost:5180
cd api && npm test                        # lógica + partida online completa
```

`node api/src/scripts/bot-rival.mjs <usuario> <clave>` conecta un rival automático para probar solo.

## Docker

```bash
cp .env.example .env    # poner un JWT_SECRET largo
# + usuarios.json (ver "Usuarios")
docker compose up -d --build
```

Deploy en el servidor de demos (https://187.77.244.107:8449, registrada en el panel de apps):

```bash
git archive HEAD | ssh root@187.77.244.107 'tar -x -m -C /opt/apps/juegos && sh /opt/apps/juegos/deploy/desplegar.sh'
```

El contenedor web escucha en `127.0.0.1:4400` (configurable con `WEB_BIND`/`WEB_PORT`).
Adelante va el Nginx del host con HTTPS; el bloque necesita soporte de WebSocket:

```nginx
location / {
  proxy_pass http://127.0.0.1:4400;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_read_timeout 3600s;
}
```

## Sumar un juego nuevo

1. Clase de partida en `api/src/juegos/` (con `vistaPara`, `abandonar`, etc.).
2. Entrada en `JUEGOS` de `api/src/salas.js`.
3. Componente en `web/src/componentes/` y que `App.jsx` lo elija según `partida.juego`.
