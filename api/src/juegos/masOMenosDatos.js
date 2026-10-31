// Datos de "Más o menos". Valores aproximados (redondeados), de fuentes conocidas; alcanzan para
// comparar. Cada categoría dice cómo se pregunta y cómo se lee la respuesta.
export const CATEGORIAS = {
  habitantes: {
    nombre: 'Habitantes',
    pregunta: '¿Tiene más o menos habitantes?',
    mas: 'Más', menos: 'Menos',
    unidad: (v) => (v >= 1000 ? `${(v / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} mil millones` : `${v.toLocaleString('es-AR')} millones`),
    items: [
      ['Argentina', 46], ['Brasil', 216], ['Chile', 19.6], ['Uruguay', 3.4], ['Paraguay', 6.9], ['Bolivia', 12.4], ['Perú', 34],
      ['Colombia', 52], ['Venezuela', 28], ['Ecuador', 18], ['México', 129], ['Estados Unidos', 335], ['Canadá', 40], ['España', 48],
      ['Italia', 59], ['Francia', 68], ['Alemania', 84], ['Japón', 124], ['China', 1410], ['India', 1430], ['Australia', 27],
      ['Nigeria', 224], ['Egipto', 113], ['Rusia', 144], ['Corea del Sur', 52], ['Portugal', 10.4], ['Cuba', 11], ['Noruega', 5.5],
      ['Nueva Zelanda', 5.2], ['Sudáfrica', 61], ['Marruecos', 37], ['Turquía', 85], ['Indonesia', 278], ['Irlanda', 5.3],
      ['Países Bajos', 17.9], ['Suiza', 8.9], ['Filipinas', 115], ['Pakistán', 240], ['Tailandia', 70], ['Reino Unido', 68],
    ],
  },
  alturas: {
    nombre: 'Alturas',
    pregunta: '¿Es más alto o más bajo?',
    mas: 'Más alto', menos: 'Más bajo',
    unidad: (v) => `${v.toLocaleString('es-AR')} m`,
    items: [
      ['El monte Everest', 8849], ['El Aconcagua', 6961], ['El Kilimanjaro', 5895], ['El Mont Blanc', 4806], ['El monte Fuji', 3776],
      ['El Ojos del Salado', 6893], ['El cerro Fitz Roy', 3405], ['El volcán Lanín', 3747], ['El cerro Champaquí', 2790],
      ['La Torre Eiffel', 330], ['El Burj Khalifa', 828], ['El Obelisco de Buenos Aires', 67.5], ['La torre del Big Ben', 96],
      ['La Estatua de la Libertad (con pedestal)', 93], ['El Cristo Redentor (con pedestal)', 38], ['La Torre de Pisa', 56],
      ['La Gran Pirámide de Guiza', 139], ['La torre CN de Toronto', 553], ['El Taipei 101', 508], ['Las Torres Petronas', 452],
      ['El Salto Ángel', 979], ['El Monumento a la Bandera de Rosario', 70], ['El Empire State (con antena)', 443],
    ],
  },
  velocidad: {
    nombre: 'Velocidad',
    pregunta: '¿Es más rápido o más lento?',
    mas: 'Más rápido', menos: 'Más lento',
    unidad: (v) => `${v.toLocaleString('es-AR')} km/h`,
    items: [
      ['El guepardo', 110], ['El halcón peregrino (en picada)', 390], ['El caballo', 88], ['El galgo', 72], ['El avestruz', 70],
      ['El león', 80], ['Usain Bolt (en su récord)', 44.7], ['El conejo', 56], ['El elefante', 40], ['La tortuga gigante', 0.3],
      ['El caracol', 0.05], ['El gato', 48], ['Un auto de Fórmula 1 (récord)', 372], ['Un avión de pasajeros', 900],
      ['El tren bala japonés', 320], ['Un ciclista del Tour de Francia (promedio)', 41], ['El canguro', 70], ['La jirafa', 60],
    ],
  },
  anios: {
    nombre: 'Años',
    pregunta: '¿Apareció antes o después?',
    mas: 'Después', menos: 'Antes',
    unidad: (v) => `en ${v}`,
    items: [
      ['El teléfono', 1876], ['La lamparita de Edison', 1879], ['El avión de los hermanos Wright', 1903], ['La televisión', 1927],
      ['La llegada a la Luna', 1969], ['La primera llamada por celular', 1973], ['La imprenta de Gutenberg', 1440],
      ['La radio de Marconi', 1895], ['El iPhone', 2007], ['YouTube', 2005], ['WhatsApp', 2009], ['Facebook', 2004], ['Google', 1998],
      ['La primera PlayStation', 1994], ['El primer Mundial de fútbol', 1930], ['La Coca-Cola', 1886], ['Instagram', 2010],
      ['TikTok', 2016], ['Netflix', 1997], ['Wikipedia', 2001], ['Mickey Mouse', 1928], ['La Torre Eiffel', 1889],
      ['La Revolución de Mayo', 1810], ['La Independencia argentina', 1816], ['El primer Mundial que ganó Argentina', 1978],
      ['El gol de Maradona a los ingleses', 1986], ['Messi campeón del mundo', 2022],
    ],
  },
  calorias: {
    nombre: 'Calorías',
    pregunta: '¿Tiene más o menos calorías? (cada 100 gramos)',
    mas: 'Más', menos: 'Menos',
    unidad: (v) => `${v} kcal cada 100 g`,
    items: [
      ['La manzana', 52], ['La banana', 89], ['La palta', 160], ['El pan blanco', 265], ['El arroz blanco cocido', 130],
      ['El dulce de leche', 315], ['El chocolate con leche', 535], ['La papa hervida', 87], ['El huevo', 155], ['La lechuga', 15],
      ['El maní', 567], ['El aceite de oliva', 884], ['El azúcar', 387], ['La miel', 304], ['El yogur entero', 61],
      ['El tomate', 18], ['La zanahoria', 41], ['La frutilla', 32], ['La naranja', 47], ['Las papas fritas', 312],
      ['El helado de crema', 207], ['La mayonesa', 680], ['La manteca', 717], ['Los fideos cocidos', 158], ['Las lentejas cocidas', 116],
    ],
  },
  distancias: {
    nombre: 'Distancias',
    pregunta: '¿Queda más lejos o más cerca de Buenos Aires? (en línea recta)',
    mas: 'Más lejos', menos: 'Más cerca',
    unidad: (v) => `${v.toLocaleString('es-AR')} km`,
    items: [
      ['Montevideo', 205], ['Córdoba', 650], ['Mendoza', 985], ['Ushuaia', 2380], ['Madrid', 10050], ['Nueva York', 8530],
      ['Santiago de Chile', 1140], ['Río de Janeiro', 1970], ['Mar del Plata', 385], ['Bariloche', 1330], ['Salta', 1290],
      ['Rosario', 280], ['Tokio', 18370], ['Sídney', 11800], ['Lima', 3150], ['Ciudad de México', 7390], ['París', 11050], ['La Plata', 55],
    ],
  },
};
