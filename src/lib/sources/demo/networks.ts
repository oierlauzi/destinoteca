import { DEFAULT_TIME_ZONE, type Notice, type Org, type Place, type Product, type Service } from '../../model';

/**
 * What the simulation can stand in for, and what runs on each of them.
 *
 * Every display was built for one kind of traffic: an airport board
 * announces flights, a Metro Bilbao platform sign the next two trains to
 * Plentzia or to Basauri, a Cercanías sign a train to Guadalajara. So the
 * simulation is not one made-up board but one per network, and a replica
 * says which it starts on (`sourceDefaults`); the picker offers the rest,
 * because feeding a sign what it never carried is also a way of reading it.
 *
 * Only the table is here. One generator reads it (board.ts), so a new
 * network is an entry and no code.
 *
 * The boards are invented and the page says so. The places, lines and
 * airlines are real ones of each network, so that what a sign shows reads
 * like what it used to show.
 */

/** A place as this table writes it: the ladder of names a narrow sign walks down until one fits. */
export interface DemoPlace {
  name: string;
  /** The same name in progressively shorter forms, longest first. */
  names?: string[];
  /** The Basque name, for the signs that write it. */
  eu?: { name: string; names?: string[] };
  /** ISO 3166-1 alpha-2, lower case. Spain when not said. */
  country?: string;
}

/** How a vehicle is written: who runs it and what the service is called. */
export interface DemoBrand {
  operator?: Org;
  product?: Product;
}

/** One service of a network: where it goes, where it comes from, and what it runs as. */
export interface DemoRun extends DemoPlace {
  /** Where it comes from, on the networks whose runs state it. */
  from?: DemoPlace;
  /** A key of the network's `brands`; the network's own brand when not said. */
  brand?: string;
  /** As printed: «C-2», «L1», «E2». */
  line?: string;
  color?: string;
}

/**
 * One network's board. Every number is what the simulation needs to look
 * like that network and to exercise what its displays can show; nothing
 * here is a measurement of a real timetable.
 */
export interface DemoNetwork {
  /** The value of `red=` in a URL. A public contract: never renamed. */
  id: string;
  /** i18n key of the name in the picker. */
  label: string;
  mode: Service['mode'];
  /** The station the board belongs to. Its time zone is the one every clock and countdown reads. */
  station: Place;
  /** Services on a fresh board: enough to fill the widest display of the network, or two hung together. */
  count: number;
  /** A new board is drawn when fewer than this many are left. */
  refill: number;
  /**
   * The first service this many seconds ahead, then one every `headway`,
   * give or take `jitter`, which stays under `headway` so that the board
   * comes out in order.
   */
  timing: { lead: number; headway: number; jitter: number };
  /** Seconds between arriving here and leaving again. Zero for a flight, which only departs or only lands. */
  dwell: number;
  runs: DemoRun[];
  /** The network's own brand, for the runs that name none. */
  brand?: DemoBrand;
  /** Brands by key, where the runs differ: Renfe's long-distance marks, an airport's airlines. */
  brands?: Record<string, DemoBrand>;
  /** The train number, or the flight number: `from` plus up to `span`, padded to `pad` digits. */
  number?: { from: number; span: number; pad?: number };
  /** The platforms, or the gates. The first `confirmed` services have theirs; the rest are still a guess, as on a real board. */
  platforms: { names: string[]; confirmed?: number };
  /**
   * Where a service comes from: `stated` is the run's own `from`, `mirror`
   * where it is going (a flight board shows the same city coming and
   * going), and `{ away }` the run that many steps along the table, for a
   * network whose runs are both ends of a line.
   */
  origin?: 'stated' | 'mirror' | { away: number };
  /** Onward calls, taken from the runs `every` steps along the table. */
  calls?: { count: number; every: number };
  /** One service in `oneIn` starts here instead of passing through. */
  startsHere?: { oneIn: number };
  /** One service in `oneIn` runs late, by `min` to `min + span` minutes. */
  delays?: { oneIn: number; min: number; span: number };
  /** One service in `oneIn` is cancelled, never among the first `after`. */
  cancels?: { oneIn: number; after: number };
  /** One service in `oneIn` divides: the rear portion goes to the run `away` along the table, calling at the one `calling` along. */
  divides?: { oneIn: number; away: number; calling: number };
  /** One service in `oneIn` runs coupled under two numbers, and then as this product. */
  couples?: { oneIn: number; product?: Product; number: { from: number; span: number } };
  /** Cars per train, for the signs that count them. The dice picks one, so a repeated number is a commoner one. */
  cars?: number[];
  /** Check-in desks, as an airport writes them, under the kind its boards read. */
  counters?: { kind: string; names: string[] };
  /** The first services are already at the platform or the gate: boarding, or just landed. */
  atStop?: number;
  notices?: Notice[];
}

const station = (name: string): Place => ({ name, country: 'es', timeZone: DEFAULT_TIME_ZONE });

/** Platforms numbered from 1, as a board picks from them. */
const numbered = (count: number): string[] => Array.from({ length: count }, (_, i) => String(i + 1));

// --- Cercanías de Madrid ----------------------------------------------------------

const CERCANIAS: DemoNetwork = {
  id: 'commuter',
  label: 'demo.network.commuter',
  mode: 'rail',
  station: station('Estación de pruebas'),
  count: 24,
  refill: 3,
  timing: { lead: 120, headway: 240, jitter: 90 },
  dwell: 60,
  brand: {
    operator: { id: 'renfe', name: 'Renfe' },
    product: { id: 'cercanias', name: 'Cercanías', shortName: 'CERC', category: 'commuter' },
  },
  runs: [
    { name: 'Alcalá de Henares', names: ['Alcalá Henares'], line: 'C-2', color: '#00943d' },
    { name: 'Guadalajara', line: 'C-2', color: '#00943d' },
    { name: 'Chamartín', line: 'C-1', color: '#4fb0e5' },
    { name: 'Príncipe Pío', line: 'C-7', color: '#de0118' },
    { name: 'Colmenar Viejo', line: 'C-4', color: '#2c2a86' },
    { name: 'Tres Cantos', line: 'C-4', color: '#2c2a86' },
    { name: 'Aranjuez', line: 'C-3', color: '#9f2e86' },
    { name: 'Parla', line: 'C-4', color: '#2c2a86' },
    { name: 'Fuenlabrada', line: 'C-5', color: '#fecb00' },
    { name: 'Humanes', line: 'C-5', color: '#fecb00' },
    { name: 'Villalba', line: 'C-8', color: '#868584' },
    { name: 'El Escorial', line: 'C-8', color: '#868584' },
    { name: 'Atocha Cercanías', names: ['Atocha'], line: 'C-1', color: '#4fb0e5' },
    { name: 'Aeropuerto T4', line: 'C-1', color: '#4fb0e5' },
  ],
  number: { from: 10000, span: 89999 },
  platforms: { names: numbered(4), confirmed: 4 },
  // Through trains come from the other end of their line; one in a while starts here.
  origin: { away: 6 },
  calls: { count: 3, every: 3 },
  startsHere: { oneIn: 5 },
  delays: { oneIn: 7, min: 1, span: 9 },
  divides: { oneIn: 9, away: 7, calling: 4 },
};

// --- Larga y media distancia ------------------------------------------------------

const renfeBrand = (name: string, shortName = name, category: Product['category'] = 'high-speed'): DemoBrand => ({
  operator: { id: 'renfe', name },
  product: { id: name.toLowerCase(), name, shortName, category },
});

const LONG_DISTANCE: DemoNetwork = {
  id: 'long-distance',
  label: 'demo.network.long-distance',
  mode: 'rail',
  station: station('Estación de pruebas'),
  count: 20,
  refill: 8,
  timing: { lead: 240, headway: 420, jitter: 300 },
  dwell: 180,
  brands: {
    AVE: renfeBrand('AVE'),
    AVLO: renfeBrand('AVLO'),
    AVANT: renfeBrand('AVANT'),
    ALVIA: renfeBrand('ALVIA', 'ALVIA', 'long-distance'),
    EUROMED: renfeBrand('EUROMED', 'EUROMED', 'long-distance'),
    INTERCITY: renfeBrand('INTERCITY', 'INTCITY', 'long-distance'),
    MD: renfeBrand('MD', 'MD', 'regional'),
    IRYO: { operator: { id: 'iryo', name: 'IRYO' }, product: { id: 'iryo', name: 'IRYO', shortName: 'IRYO', category: 'high-speed' } },
    OUIGO: { operator: { id: 'ouigo', name: 'OUIGO' }, product: { id: 'ouigo', name: 'OUIGO', shortName: 'OUIGO', category: 'high-speed' } },
  },
  runs: [
    { name: 'Madrid Puerta de Atocha', names: ['Madrid Pta. Atocha'], brand: 'IRYO', from: { name: 'Barcelona Sants' } },
    { name: 'Figueres-Vilafant', brand: 'AVE', from: { name: 'Sevilla Santa Justa', names: ['Sevilla Sta. Justa'] } },
    { name: 'Sevilla Santa Justa', names: ['Sevilla Sta. Justa'], brand: 'AVLO', from: { name: 'Madrid Puerta de Atocha', names: ['Madrid Pta. Atocha'] } },
    { name: 'València Joaquín Sorolla', names: ['Valencia J.Sorolla'], brand: 'OUIGO', from: { name: 'Málaga María Zambrano', names: ['Malaga M. Zambrano'] } },
    { name: 'Bilbao Abando Indalecio Prieto', names: ['Bilbao Abando-I.P.', 'Bilbao'], brand: 'ALVIA', from: { name: 'Salamanca' } },
    { name: 'Málaga María Zambrano', names: ['Malaga M. Zambrano'], brand: 'AVE', from: { name: 'Barcelona Sants' } },
    { name: 'Castelló de la Plana', names: ['Castelló la Plana'], brand: 'EUROMED', from: { name: 'Alacant/Alicante Terminal', names: ['Alacant/Alicante T'] } },
    { name: 'Toledo', brand: 'AVANT', from: { name: 'Toledo' } },
    { name: 'Zaragoza Delicias', brand: 'MD', from: { name: 'Huesca' } },
    { name: 'A Coruña', brand: 'ALVIA', from: { name: 'Vigo Urzáiz', names: ['Vigo Urzaiz'] } },
    { name: 'León', brand: 'AVLO', from: { name: 'Valladolid Campo Grande', names: ['Valladolid C. Gr.'] } },
    { name: 'Alacant/Alicante Terminal', names: ['Alacant/Alicante T'], brand: 'INTERCITY', from: { name: 'Murcia del Carmen', names: ['Murcia'] } },
  ],
  number: { from: 1000, span: 9000, pad: 5 },
  // A long-distance platform is announced shortly before the train.
  platforms: { names: numbered(14), confirmed: 3 },
  origin: 'stated',
  delays: { oneIn: 5, min: 6, span: 25 },
  cancels: { oneIn: 11, after: 2 },
  // Now and then two trains run coupled under two numbers.
  couples: { oneIn: 6, product: { id: 'alvia', name: 'ALVIA', shortName: 'ALVIA', category: 'long-distance' }, number: { from: 30000, span: 9999 } },
  notices: [{ text: 'Acceso a la sala de embarque 30 minutos antes de la salida', severity: 'info' }],
};

// --- Aeropuerto -------------------------------------------------------------------

const airline = (id: string, name: string, code: string): DemoBrand => ({ operator: { id, name, shortName: code } });

/**
 * Flights of a Spanish airport: the airlines, with their IATA codes as the
 * boards write them, and the cities in the forms that fit a destination
 * column ten characters wide.
 */
const AIR: DemoNetwork = {
  id: 'air',
  label: 'demo.network.air',
  mode: 'air',
  station: station('Aeropuerto de pruebas'),
  count: 20,
  refill: 6,
  timing: { lead: 600, headway: 540, jitter: 360 },
  // A flight either departs or lands; it does not call here on its way.
  dwell: 0,
  brands: {
    IB: airline('iberia', 'Iberia', 'IB'),
    VY: airline('vueling', 'Vueling', 'VY'),
    FR: airline('ryanair', 'Ryanair', 'FR'),
    UX: airline('air-europa', 'Air Europa', 'UX'),
    EZY: airline('easyjet', 'easyJet', 'EZY'),
    TP: airline('tap', 'TAP Air Portugal', 'TP'),
    HV: airline('transavia', 'Transavia', 'HV'),
    LH: airline('lufthansa', 'Lufthansa', 'LH'),
    AF: airline('air-france', 'Air France', 'AF'),
    KL: airline('klm', 'KLM', 'KL'),
    BA: airline('british-airways', 'British Airways', 'BA'),
    NT: airline('binter', 'Binter Canarias', 'NT'),
    V7: airline('volotea', 'Volotea', 'V7'),
    W6: airline('wizz-air', 'Wizz Air', 'W6'),
  },
  runs: [
    { name: 'Palma de Mallorca', names: ['Palma Mallorca', 'P.Mallorca'], brand: 'UX' },
    { name: 'Roma Ciampino', names: ['Roma-Ciampino', 'Roma-Cia'], brand: 'FR' },
    { name: 'Fráncfort-Hahn', names: ['Frank Hahn'], brand: 'FR', country: 'de' },
    { name: 'Róterdam', brand: 'HV', country: 'nl' },
    { name: 'Asturias', brand: 'V7' },
    { name: 'Menorca', brand: 'IB' },
    { name: 'Madrid', brand: 'IB' },
    { name: 'Ibiza', brand: 'FR' },
    { name: 'Londres-Gatwick', names: ['Londres-GW'], brand: 'EZY', country: 'gb' },
    { name: 'Lisboa', brand: 'TP', country: 'pt' },
    { name: 'Bruselas', brand: 'VY', country: 'be' },
    { name: 'Barcelona', brand: 'VY' },
    { name: 'París-Orly', brand: 'VY', country: 'fr' },
    { name: 'Ámsterdam', brand: 'KL', country: 'nl' },
    { name: 'Milán-Bérgamo', names: ['Milan-BGY'], brand: 'FR', country: 'it' },
    { name: 'Dublín', brand: 'FR', country: 'ie' },
    { name: 'Múnich', brand: 'LH', country: 'de' },
    { name: 'Gran Canaria', names: ['G.Canaria'], brand: 'NT' },
    { name: 'Tenerife Norte', names: ['Tenerife N'], brand: 'NT' },
    { name: 'Londres-Heathrow', names: ['Londres-HR'], brand: 'BA', country: 'gb' },
    { name: 'París-Charles de Gaulle', names: ['Paris-CDG'], brand: 'AF', country: 'fr' },
    { name: 'Bucarest', brand: 'W6', country: 'ro' },
    { name: 'Sevilla', brand: 'IB' },
  ],
  number: { from: 1000, span: 8000 },
  // The gate is written with the area it is in: «A4», «C12».
  platforms: { names: ['A2', 'A4', 'A6', 'B3', 'B18', 'B21', 'C8', 'C12', 'C14', 'D2', 'D6', 'R54', 'R56'], confirmed: 5 },
  // A flight to a city is also the flight from it, which is what an arrivals board shows.
  origin: 'mirror',
  delays: { oneIn: 6, min: 10, span: 40 },
  cancels: { oneIn: 13, after: 2 },
  counters: { kind: 'check-in', names: ['1-4', '6-7', '12-14', '18-20', '35-36', '42-44', '56-57', '58-59'] },
  // The first flight is at its gate: boarding on the departures board, landed on the arrivals one.
  atStop: 1,
  notices: [{ text: 'Presenten su tarjeta de embarque en el control de seguridad', severity: 'info' }],
};

// --- Metro Bilbao -----------------------------------------------------------------

/**
 * Metro Bilbao: the two lines whose platforms carry Ikusi's signs, written
 * with the ends of their runs. The signs count the cars of the longer
 * trains in brackets, so some trains here have five.
 */
const METRO_BILBAO: DemoNetwork = {
  id: 'metro-bilbao',
  label: 'demo.network.metro-bilbao',
  mode: 'metro',
  station: station('Estación de pruebas'),
  count: 10,
  refill: 3,
  timing: { lead: 90, headway: 300, jitter: 120 },
  dwell: 30,
  brand: {
    operator: { id: 'metro-bilbao', name: 'Metro Bilbao' },
    product: { id: 'metro', name: 'Metro', shortName: 'METRO', category: 'commuter' },
  },
  // The two ends of each line, both ways. The order is what the dice walks
  // down, so the two runs to Etxebarri are kept apart and no two rows of a
  // sign read the same.
  runs: [
    { name: 'Etxebarri', line: 'L1', from: { name: 'Plentzia' } },
    { name: 'Plentzia', line: 'L1', from: { name: 'Etxebarri' } },
    { name: 'Kabiezes', line: 'L2', from: { name: 'Basauri' } },
    { name: 'Etxebarri', line: 'L1', from: { name: 'Bidezabal' } },
    { name: 'Bidezabal', line: 'L1', from: { name: 'Etxebarri' } },
    { name: 'Basauri', line: 'L2', from: { name: 'Kabiezes' } },
  ],
  platforms: { names: numbered(2) },
  origin: 'stated',
  delays: { oneIn: 9, min: 1, span: 3 },
  cars: [4, 4, 5],
  notices: [
    { text: { eu: 'Eskailera mekanikoa hondatua', es: 'Escalera mecánica averiada' }, severity: 'warning' },
    { text: 'Deustu / Ariz' },
  ],
};

// --- Euskotren --------------------------------------------------------------------

/**
 * Euskotren: the lines of Bizkaia and Gipuzkoa as their platform signs
 * wrote them, in Basque, from the end of the line they were going to.
 */
const EUSKOTREN: DemoNetwork = {
  id: 'euskotren',
  label: 'demo.network.euskotren',
  mode: 'rail',
  station: station('Estación de pruebas'),
  count: 9,
  refill: 3,
  timing: { lead: 300, headway: 1800, jitter: 420 },
  dwell: 60,
  brand: {
    operator: { id: 'euskotren', name: 'Euskotren' },
    product: { id: 'euskotren-trena', name: 'Euskotren Trena', shortName: 'ET', category: 'regional' },
  },
  runs: [
    { name: 'Bermeo', line: 'E2', from: { name: 'Bilbao-Atxuri', eu: { name: 'Bilbo-Atxuri' } } },
    { name: 'Gernika', line: 'E2', from: { name: 'Bilbao-Atxuri', eu: { name: 'Bilbo-Atxuri' } } },
    { name: 'Bilbao-Atxuri', eu: { name: 'Bilbo-Atxuri' }, line: 'E2', from: { name: 'Bermeo' } },
    { name: 'San Sebastián-Amara', names: ['Donostia-Amara'], eu: { name: 'Donostia-Amara', names: ['Donostia'] }, line: 'E1', from: { name: 'Bilbao-Atxuri', eu: { name: 'Bilbo-Atxuri' } } },
    { name: 'Durango', line: 'E1', from: { name: 'Bilbao-Atxuri', eu: { name: 'Bilbo-Atxuri' } } },
    { name: 'Ermua', line: 'E1', from: { name: 'San Sebastián-Amara', eu: { name: 'Donostia-Amara', names: ['Donostia'] } } },
    { name: 'Lezama', line: 'E3', from: { name: 'Bilbao-Atxuri', eu: { name: 'Bilbo-Atxuri' } } },
    { name: 'Hendaya', eu: { name: 'Hendaia' }, line: 'E5', country: 'fr', from: { name: 'San Sebastián-Amara', eu: { name: 'Donostia-Amara', names: ['Donostia'] } } },
    { name: 'Lasarte-Oria', line: 'E4', from: { name: 'San Sebastián-Amara', eu: { name: 'Donostia-Amara', names: ['Donostia'] } } },
  ],
  number: { from: 1000, span: 900 },
  platforms: { names: numbered(2) },
  origin: 'stated',
  delays: { oneIn: 6, min: 1, span: 6 },
};

/** Every network, in the order the picker offers them. */
export const NETWORKS: DemoNetwork[] = [CERCANIAS, LONG_DISTANCE, AIR, METRO_BILBAO, EUSKOTREN];

/** The one a display gets when it asks for nothing in particular. */
export const DEFAULT_NETWORK = CERCANIAS;

/** The network a `red=` value names, or the default: an old URL with a value since dropped still opens. */
export const networkOf = (id: unknown): DemoNetwork => NETWORKS.find((network) => network.id === id) ?? DEFAULT_NETWORK;
