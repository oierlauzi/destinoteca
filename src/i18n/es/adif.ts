export const adif: Record<string, string> = {
  'adif.label': 'Adif',
  'adif.description':
    'Llegadas y salidas en directo de las pantallas de Adif (info.adif.es): todos los operadores y todo tipo de trenes, con sus paradas, de las estaciones que Adif publica. Las estaciones grandes reenvían su tablero entero cada pocos segundos: unos cientos de kB cada vez.',
  'adif.field.station': 'Estación',
  'adif.searchPlaceholder': 'Nombre, municipio o código',
  'adif.field.traffic': 'Trenes',
  'adif.field.traffic.help': 'Qué trenes de la estación se tienen en cuenta, como en las pantallas de Adif.',
  'adif.traffic.CRL': 'Todos',
  'adif.traffic.C': 'Cercanías y Rodalies',
  'adif.traffic.RL': 'Larga y media distancia',
  'adif.traffic.L': 'Larga distancia',
  'adif.traffic.R': 'Media distancia y regionales',
  'adif.viewOnAdif': 'Ver en info.adif.es',
  'adif.needStation': 'elige una estación',
  'adif.nodata': 'Adif no publica pantallas para esta estación, o aún no ha enviado datos.',
  'adif.error.lost': 'Conexión perdida. Reintentando…',
  'adif.error.refused': 'Adif ha rechazado la conexión. Reintentando…',
  'adif.error.closed': 'Adif ha cerrado la conexión. Reintentando…',
  'adif.error.unsupported': 'Este navegador no admite WebSocket.',
  'adif.credit':
    '<strong>Datos de <a href="https://info.adif.es/" target="_blank" rel="noopener noreferrer">Adif</a></strong>, los mismos que muestran las pantallas de sus estaciones. La lista de estaciones procede del <a href="https://data.renfe.com/dataset/estaciones-listado-completo" target="_blank" rel="noopener noreferrer">listado de estaciones de Renfe</a> (CC BY 4.0).',
};
