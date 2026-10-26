// Uso: npm run hash -- <clave>  → imprime el hash para pegar en usuarios.json (raíz del repo)
import bcrypt from 'bcryptjs';

const clave = process.argv[2];
if (!clave) {
  console.error('Uso: npm run hash -- <clave>');
  process.exit(1);
}
console.log(bcrypt.hashSync(clave, 10));
