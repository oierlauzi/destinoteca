/*
 * What the rows of Ikusi's airport boards are divided into. A row is one
 * run of identical character modules; the columns are only where the
 * controller writes each thing and where the header prints its legend, so
 * they change from one airport to another while the hardware stays the
 * same. Between two columns one module is left blank.
 *
 * The departure layouts are as photographed. Arrivals have been
 * photographed only on the Canary Islands, in German; the other arrival
 * layouts follow their departures, with the estimated time in place of
 * boarding, and are not known.
 */

export type Mode = 'departures' | 'arrivals';

/** What a row holds: hora, destino o procedencia, vuelo, mostrador, embarque o estimada, puerta, observaciones. */
export interface BoardRow {
  time: string;
  place: string;
  flight: string;
  counter: string;
  /** Boarding time when departing, the expected time when arriving. */
  second: string;
  gate: string;
  remarks: string;
}

export type ColumnKey = 'time' | 'place' | 'flight' | 'counter' | 'boarding' | 'expected' | 'gate' | 'remarks';

/** The field of a row each column shows. */
export const FIELD_OF: Record<ColumnKey, keyof BoardRow> = {
  time: 'time',
  place: 'place',
  flight: 'flight',
  counter: 'counter',
  boarding: 'second',
  expected: 'second',
  gate: 'gate',
  remarks: 'remarks',
};

export interface Column {
  key: ColumnKey;
  /** In characters. The remarks take what is left of the row. */
  width: number;
}

export interface Layout {
  departures: Column[];
  arrivals: Column[];
  /**
   * How the flight is written: the airline in three characters, a blank and
   * the number right-aligned in four («UX  4004»), or the number straight
   * after the airline («SK 3341», «REU8301»).
   */
  flight: 'spaced' | 'compact';
}

export const LAYOUT_IDS = ['valencia', 'bilbao', 'canarias', 'barajas'] as const;
export type LayoutId = (typeof LAYOUT_IDS)[number];

const col = (key: ColumnKey, width: number): Column => ({ key, width });
const REMARKS = col('remarks', 0);

export const LAYOUTS: Record<LayoutId, Layout> = {
  /** Valencia: the flight first, and boarding before the counter. */
  valencia: {
    departures: [col('flight', 8), col('place', 10), col('time', 5), col('boarding', 5), col('counter', 5), col('gate', 3), REMARKS],
    arrivals: [col('flight', 8), col('place', 10), col('time', 5), col('expected', 5), REMARKS],
    flight: 'spaced',
  },
  /** Bilbao, and the boards with a clock of Asturias. */
  bilbao: {
    departures: [col('time', 5), col('place', 10), col('flight', 8), col('counter', 5), col('boarding', 5), col('gate', 3), REMARKS],
    arrivals: [col('time', 5), col('place', 10), col('flight', 8), col('expected', 5), REMARKS],
    flight: 'spaced',
  },
  /** The Canary Islands, Barcelona and the board with rounded corners: a gate of two characters. */
  canarias: {
    departures: [col('time', 5), col('place', 10), col('flight', 8), col('counter', 5), col('boarding', 5), col('gate', 2), REMARKS],
    arrivals: [col('time', 5), col('place', 10), col('flight', 8), col('expected', 5), REMARKS],
    flight: 'spaced',
  },
  /** Madrid-Barajas T2: the flight in seven characters and the counters as a range of three-digit desks («406-411»). */
  barajas: {
    departures: [col('time', 5), col('place', 10), col('flight', 7), col('counter', 7), col('boarding', 5), col('gate', 3), REMARKS],
    arrivals: [col('time', 5), col('place', 10), col('flight', 7), col('expected', 5), REMARKS],
    flight: 'compact',
  },
};

export const layoutOf = (id: unknown): Layout => LAYOUTS[(LAYOUT_IDS as readonly unknown[]).includes(id) ? (id as LayoutId) : 'valencia'];

/** Where each column starts, in characters from the start of the row, and how wide it is on a row of `cells`. */
export function columnSpans(columns: Column[], cells: number): { key: ColumnKey; start: number; width: number }[] {
  let at = 0;
  return columns.map((column) => {
    const start = at;
    const width = column.key === 'remarks' ? Math.max(0, cells - start) : column.width;
    at += width + 1;
    return { key: column.key, start, width };
  });
}

/** Splits «UX 4004», «IB3910» or «REU8301» into the airline and the number. */
export function splitFlight(flight: string): { airline: string; number: string } | undefined {
  const text = flight.trim();
  const spaced = /^(\S{1,3})\s+(\S{1,4})$/.exec(text);
  if (spaced) return { airline: spaced[1]!, number: spaced[2]! };
  const joined = /^([A-Z0-9]{2}[A-Z]?)(\d{1,4}[A-Z]?)$/.exec(text);
  if (joined) return { airline: joined[1]!, number: joined[2]! };
  return undefined;
}

/** The flight as the layout writes it, in `width` characters. */
export function flightText(flight: string, style: Layout['flight'], width: number): string {
  const parts = splitFlight(flight.toUpperCase());
  if (!parts) return flight.trim().slice(0, width);
  const text = parts.airline.padEnd(3) + (style === 'spaced' ? ' ' : '') + parts.number.padStart(4);
  return text.slice(0, width);
}

/** One row as the characters of its modules, `cells` of them. */
export function composeRow(row: BoardRow, layout: Layout, mode: Mode, cells: number): string[] {
  const out: string[] = Array.from({ length: cells }, () => ' ');
  for (const span of columnSpans(layout[mode], cells)) {
    const field = FIELD_OF[span.key];
    const value = span.key === 'flight' ? flightText(row.flight, layout.flight, span.width) : row[field];
    Array.from(value).slice(0, span.width).forEach((char, i) => {
      if (span.start + i < cells) out[span.start + i] = char;
    });
  }
  return out;
}

// --- Legends ----------------------------------------------------------------------

/**
 * The language printed above English and Spanish, if any: the co-official
 * languages of Valencia, Catalonia and the Basque Country, or German on the
 * Canary Islands.
 */
export const REGIONAL = ['', 'va', 'ca', 'eu', 'de'] as const;
export type Regional = (typeof REGIONAL)[number];

export interface Legend {
  regional: Record<Exclude<Regional, ''>, string>;
  en: string;
  es: string;
}

/**
 * The titles. «Abfluge» is printed without its umlaut. The Valencian,
 * Catalan and Basque words for arrivals have not been photographed.
 */
export const TITLES: Record<Mode, Legend> = {
  departures: { regional: { va: 'Eixides', ca: 'Sortides', eu: 'Irteerak', de: 'Abfluge' }, en: 'Departures', es: 'Salidas' },
  arrivals: { regional: { va: 'Arribades', ca: 'Arribades', eu: 'Iritsierak', de: 'Ankunft' }, en: 'Arrivals', es: 'Llegadas' },
};

/**
 * The legend over a column. As photographed, but for the arrivals of
 * Valencia, Catalonia and the Basque Country, which have not been: there
 * they are the usual words. The boards with a clock print «Area/Gate» and
 * «Zona/Puerta».
 */
export function columnLegend(key: ColumnKey, mode: Mode, areaGate: boolean): Legend {
  switch (key) {
    case 'time':
      return { regional: { va: 'Hora', ca: 'Hora', eu: 'Ordua', de: 'Stunde' }, en: 'Time', es: 'Hora' };
    case 'place':
      return mode === 'departures'
        ? { regional: { va: 'Desti', ca: 'Destinació', eu: 'Norabidea', de: 'Nach' }, en: 'Destination', es: 'Destino' }
        : { regional: { va: 'Procedència', ca: 'Procedència', eu: 'Jatorria', de: 'Von' }, en: 'From', es: 'Procedencia' };
    case 'flight':
      return { regional: { va: 'Vol', ca: 'Vol', eu: 'Hegaldia', de: 'Flug' }, en: 'Flight', es: 'Vuelo' };
    case 'counter':
      return { regional: { va: 'Mostrador', ca: 'Mostrador', eu: 'Mahaia', de: 'Schalter' }, en: 'Counter', es: 'Mostrador' };
    case 'boarding':
      return { regional: { va: 'Embarque', ca: 'Embarcam.', eu: 'Hegazkineratze', de: 'Abflug' }, en: 'Boarding', es: 'Embarque' };
    case 'expected':
      return { regional: { va: 'Prevista', ca: 'Prevista', eu: 'Aurreikusia', de: 'Erwartet' }, en: 'Expected', es: 'Estimada' };
    case 'gate':
      return areaGate
        ? { regional: { va: 'Porta', ca: 'Porta', eu: 'Atea', de: 'Tor' }, en: 'Area/Gate', es: 'Zona/Puerta' }
        : { regional: { va: 'Porta', ca: 'Porta', eu: 'Atea', de: 'Tor' }, en: 'Gate', es: 'Puerta' };
    case 'remarks':
      return { regional: { va: 'Observacions', ca: 'Observacions', eu: 'Oharrak', de: 'Bemerkung' }, en: 'Remarks', es: 'Observaciones' };
  }
}

/** The lines of a legend from the top: the regional one, English, Spanish. */
export function legendLines(legend: Legend, regional: Regional): { text: string; lang: 'regional' | 'en' | 'es' }[] {
  return [...(regional ? [{ text: legend.regional[regional], lang: 'regional' as const }] : []), { text: legend.en, lang: 'en' }, { text: legend.es, lang: 'es' }];
}

// --- Remarks ----------------------------------------------------------------------

export type Remark = 'cancelled' | 'delayed' | 'boarding' | 'landed';
export type RemarkLang = 'es' | 'en' | Exclude<Regional, ''>;

/**
 * What the remarks say, in each language the boards write them in. The
 * remarks of a board go round its languages: Spanish, English and the one
 * printed over them, if any. Photographed: CANCELADO, RETRASADO, EMBARQUE,
 * LLEGADA, CANCELLED, BOARDING and, in the Canary Islands, VERSPATET
 * (without its umlaut). The rest are the usual words, shortened to fit,
 * and may not be what the boards wrote.
 */
export const REMARK_WORDS: Record<RemarkLang, Record<Remark, string>> = {
  es: { cancelled: 'CANCELADO', delayed: 'RETRASADO', boarding: 'EMBARQUE', landed: 'LLEGADA' },
  en: { cancelled: 'CANCELLED', delayed: 'DELAYED', boarding: 'BOARDING', landed: 'LANDED' },
  va: { cancelled: 'CANCELLAT', delayed: 'RETARDAT', boarding: 'EMBARCANT', landed: 'ATERRAT' },
  ca: { cancelled: 'CANCELLAT', delayed: 'RETARDAT', boarding: 'EMBARCANT', landed: 'ATERRAT' },
  eu: { cancelled: 'EZEZTATU', delayed: 'ATZERATUTA', boarding: 'ONTZIRATU', landed: 'LURRERATUTA' },
  de: { cancelled: 'ANNULLIERT', delayed: 'VERSPATET', boarding: 'EINSTIEG', landed: 'GELANDET' },
};

/** The languages a board's remarks go round, in order. */
export const remarkLanguages = (regional: Regional): RemarkLang[] => (regional ? ['es', 'en', regional] : ['es', 'en']);
