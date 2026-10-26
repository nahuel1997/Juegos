# Juegos 1vs1

App de juegos online 1 contra 1. Primer juego: **batalla naval**.

- **api/**: Node 20 + Express 5 + Socket.IO (tiempo real). Login con cookie httpOnly (JWT), claves con bcrypt.
  Las partidas viven en memoria; el historial se guarda en `DATA_DIR/historial.json` (volumen Docker).
- **web/**: React 18 + Vite, servido por Nginx, que además proxea `/api` y `/socket.io` a la API.

## Reglas de la batalla naval

Tablero 10x10, flota de 5 barcos (5, 4, 3, 3, 2) que no se pueden tocar ni en diagonal.
Si acertás, seguís tirando; si es agua, pasa el turno. Gana quien hunde toda la flota rival.
Si alguien se desconecta, la partida queda esperando a que vuelva.

## Usuarios

Están en `usuarios.json` en la raíz (solo hashes), **fuera de git**. Para crearlo:

```bash
cp usuarios.example.json usuarios.json
cd api && npm run hash -- "la clave"
```

y pegar cada hash en su usuario. En Docker se monta como solo lectura en el contenedor de la API.

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
