import { crearServidor } from './servidor.js';

const PORT = Number(process.env.PORT || 4400);
const servidor = crearServidor();
servidor.listen(PORT, () => console.log(`API de juegos en :${PORT}`));

// Al apagar (docker stop, deploy, Ctrl+C) se guardan las salas antes de salir.
for (const senal of ['SIGTERM', 'SIGINT']) {
  process.on(senal, () => {
    servidor.salas.guardarYa();
    process.exit(0);
  });
}
