import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const API = process.env.API_URL || 'http://localhost:4400';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // La simulación de la vista previa usa la lógica de los juegos del server; el registro de palabras
    // jugadas (que escribe en disco) se reemplaza por uno de mentira en el navegador.
    alias: [{ find: /^\.\/palabrasJugadas\.js$/, replacement: fileURLToPath(new URL('./src/demo/palabrasJugadas.js', import.meta.url)) }],
  },
  server: {
    port: 5180,
    fs: { allow: ['..'] },
    proxy: {
      '/api': API,
      '/socket.io': { target: API, ws: true },
    },
  },
});
