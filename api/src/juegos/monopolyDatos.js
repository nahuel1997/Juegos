// Monopoly Lanús: el tablero y las tarjetas. Para cambiar nombres, precios o tarjetas, se toca solo acá.
// Grupos de color: cada uno con su precio de casa. Alquileres: [sin casas, 1, 2, 3, 4 casas, hotel].

export const GRUPOS = {
  marron: { nombre: 'Marrón', color: '#8d5524', casa: 50 },
  celeste: { nombre: 'Celeste', color: '#4fc3f7', casa: 50 },
  rosa: { nombre: 'Rosa', color: '#e91e8c', casa: 100 },
  naranja: { nombre: 'Naranja', color: '#ff9800', casa: 100 },
  rojo: { nombre: 'Rojo', color: '#e53935', casa: 150 },
  amarillo: { nombre: 'Amarillo', color: '#fdd835', casa: 150 },
  verde: { nombre: 'Verde', color: '#43a047', casa: 200 },
  azul: { nombre: 'Granate', color: '#7b1e3a', casa: 200 }, // el de la cancha: granate, como el Granate
};

const calle = (nombre, grupo, precio, alquiler, extra = {}) => ({ tipo: 'propiedad', nombre, grupo, precio, alquiler, ...extra });
const estacion = (nombre) => ({ tipo: 'estacion', nombre, precio: 200 });
const servicio = (nombre, icono) => ({ tipo: 'servicio', nombre, precio: 150, icono });

export const CASILLAS = [
  { tipo: 'salida', nombre: 'Salida', detalle: 'Cobrás $200 cada vez que pasás' },
  calle('Calle Derqui', 'marron', 60, [2, 10, 30, 90, 160, 250]),
  { tipo: 'club', nombre: 'Club de barrio' },
  calle('Calle Arias', 'marron', 60, [4, 20, 60, 180, 320, 450]),
  { tipo: 'impuesto', nombre: 'ABL municipal', monto: 200 },
  estacion('Estación Lanús'),
  calle('Calle Sitio de Montevideo', 'celeste', 100, [6, 30, 90, 270, 400, 550]),
  { tipo: 'suerte', nombre: 'Suerte' },
  calle('Calle Anatole France', 'celeste', 100, [6, 30, 90, 270, 400, 550]),
  calle('Calle Pringles', 'celeste', 120, [8, 40, 100, 300, 450, 600]),
  { tipo: 'comisaria', nombre: 'Comisaría', detalle: 'De visita (o detenido)' },
  calle('Cafetería Santa Emilia', 'rosa', 140, [10, 50, 150, 450, 625, 750], { icono: 'cafe' }),
  servicio('Edesur (luz)', 'luz'),
  calle('Calle Margarita Weild', 'rosa', 140, [10, 50, 150, 450, 625, 750]),
  calle('Calle Del Valle Iberlucea', 'rosa', 160, [12, 60, 180, 500, 700, 900]),
  estacion('Estación Remedios de Escalada'),
  calle('Canchas de Fútbol 5', 'naranja', 180, [14, 70, 200, 550, 750, 950], { icono: 'futbol' }),
  { tipo: 'club', nombre: 'Club de barrio' },
  calle('Plaza Grigera', 'naranja', 180, [14, 70, 200, 550, 750, 950], { icono: 'plaza' }),
  calle('Calle Basavilbaso', 'naranja', 200, [16, 80, 220, 600, 800, 1000]),
  { tipo: 'libre', nombre: 'Estacionamiento libre', detalle: 'Acá no pasa nada' },
  calle('Gimnasio Moonrock', 'rojo', 220, [18, 90, 250, 700, 875, 1050], { icono: 'pesa' }),
  { tipo: 'suerte', nombre: 'Suerte' },
  calle('Calle Carlos Tejedor', 'rojo', 220, [18, 90, 250, 700, 875, 1050]),
  calle('Calle Ituzaingó', 'rojo', 240, [20, 100, 300, 750, 925, 1100]),
  estacion('Estación Gerli'),
  calle('Hospital Británico', 'amarillo', 260, [22, 110, 330, 800, 975, 1150], { icono: 'hospital' }),
  calle('Av. Remedios de Escalada', 'amarillo', 260, [22, 110, 330, 800, 975, 1150]),
  servicio('AySA (agua)', 'agua'),
  calle('Calle Salta', 'amarillo', 280, [24, 120, 360, 850, 1025, 1200]),
  { tipo: 'irComisaria', nombre: 'Andá a la Comisaría' },
  calle('Av. Rosales', 'verde', 300, [26, 130, 390, 900, 1100, 1275]),
  calle('Av. Hipólito Yrigoyen', 'verde', 300, [26, 130, 390, 900, 1100, 1275]),
  { tipo: 'club', nombre: 'Club de barrio' },
  calle('Av. 9 de Julio', 'verde', 320, [28, 150, 450, 1000, 1200, 1400]),
  estacion('Estación Villa Diamante'),
  { tipo: 'suerte', nombre: 'Suerte' },
  calle('Velódromo', 'azul', 350, [35, 175, 500, 1100, 1300, 1500], { icono: 'bici' }),
  { tipo: 'impuesto', nombre: 'Ganancias', monto: 100 },
  calle('La Fortaleza (cancha de Lanús)', 'azul', 400, [50, 200, 600, 1400, 1700, 2000], { icono: 'estadio' }),
];

export const COMISARIA = 10;
export const ESTACIONES = CASILLAS.map((c, i) => (c.tipo === 'estacion' ? i : -1)).filter((i) => i >= 0);

// Efectos: cobrar, pagar, ir (a una casilla; cobra la Salida si pasa), atras (va para atrás sin cobrar),
// retroceder n, comisaria, libre (tarjeta para salir), reparaciones (por casa / por hotel),
// delRival (el rival te paga), alRival (le pagás al rival), estacion (a la más cercana).
export const SUERTE = [
  { texto: 'Te encontraste $50 en la vereda de la calle Derqui.', efecto: 'cobrar', monto: 50 },
  { texto: 'Ganaste el prode del barrio.', efecto: 'cobrar', monto: 150 },
  { texto: 'Multa por estacionar en doble fila en la previa de la cancha.', efecto: 'pagar', monto: 50 },
  { texto: '¡Hay partido! Avanzá hasta La Fortaleza.', efecto: 'ir', casilla: 39 },
  { texto: 'Avanzá hasta la Salida.', efecto: 'ir', casilla: 0 },
  { texto: 'Te invitaron a entrenar al Gimnasio Moonrock.', efecto: 'ir', casilla: 21 },
  { texto: 'Café con medialunas: andá a la Cafetería Santa Emilia.', efecto: 'ir', casilla: 11 },
  { texto: 'Te olvidaste el termo: retrocedé 3 casillas.', efecto: 'retroceder', n: 3 },
  { texto: 'Te agarraron cruzando en rojo en Hipólito Yrigoyen: andá a la Comisaría.', efecto: 'comisaria' },
  { texto: 'Salís libre de la Comisaría (guardala para cuando la necesites).', efecto: 'libre' },
  { texto: 'Arreglos en tus propiedades: $25 por casa y $100 por hotel.', efecto: 'reparaciones', casa: 25, hotel: 100 },
  { texto: 'Te tomás el tren: andá a la estación más cercana.', efecto: 'estacion' },
  { texto: 'Ganaste el torneo de Fútbol 5.', efecto: 'cobrar', monto: 100 },
  { texto: 'Pinchaste la bici en el Velódromo.', efecto: 'pagar', monto: 30 },
  { texto: 'Le invitás un choripán al rival en la cancha.', efecto: 'alRival', monto: 50 },
  { texto: 'El rival te paga la entrada al Velódromo.', efecto: 'delRival', monto: 50 },
];

export const CLUB = [
  { texto: 'Reintegro de la tarjeta.', efecto: 'cobrar', monto: 100 },
  { texto: '¡Feliz cumpleaños! El rival te regala $50.', efecto: 'delRival', monto: 50 },
  { texto: 'Cuota del club atrasada.', efecto: 'pagar', monto: 100 },
  { texto: 'Consulta en el Hospital Británico.', efecto: 'pagar', monto: 50 },
  { texto: 'Vendiste tortas fritas en la feria.', efecto: 'cobrar', monto: 50 },
  { texto: 'Ganaste la rifa del club.', efecto: 'cobrar', monto: 200 },
  { texto: 'Herencia de la tía de Remedios de Escalada.', efecto: 'cobrar', monto: 100 },
  { texto: 'Arreglo de veredas: $40 por casa y $115 por hotel.', efecto: 'reparaciones', casa: 40, hotel: 115 },
  { texto: 'Avanzá hasta la Salida.', efecto: 'ir', casilla: 0 },
  { texto: 'Salís libre de la Comisaría (guardala para cuando la necesites).', efecto: 'libre' },
  { texto: 'Se armó lío en la feria: andá a la Comisaría.', efecto: 'comisaria' },
  { texto: 'Te equivocaste de colectivo: volvé a la calle Derqui.', efecto: 'atras', casilla: 1 },
  { texto: 'Premio a la vereda más linda del barrio.', efecto: 'cobrar', monto: 20 },
  { texto: 'Llegó la boleta de Edesur.', efecto: 'pagar', monto: 50 },
  { texto: 'Clases de natación en el club.', efecto: 'pagar', monto: 40 },
  { texto: 'Te devolvieron la plata que le prestaste al rival.', efecto: 'delRival', monto: 30 },
];
