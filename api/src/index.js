import { crearServidor } from './servidor.js';

const PORT = Number(process.env.PORT || 4400);
crearServidor().listen(PORT, () => console.log(`API de juegos en :${PORT}`));
