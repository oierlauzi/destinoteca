/**
 * The printed legends of ADIF's boards: Spanish, then the region's own
 * language where there is one, then English in small capitals.
 *
 * Spanish, Catalan and English are as photographed (Barcelona Sants, Madrid,
 * Alicante). The Valencian title "Eixides" and the Basque and Galician
 * legends have not been photographed: they are the usual words, and may not
 * be what the boards print.
 */
export const REGIONAL = ['', 'ca', 'va', 'eu', 'gl'] as const;
export type Regional = (typeof REGIONAL)[number];
export type Mode = 'departures' | 'arrivals';

export interface Legend {
  es: string;
  regional: Record<Exclude<Regional, ''>, string>;
  en: string;
}

const same = (word: string): Legend['regional'] => ({ ca: word, va: word, eu: word, gl: word });

export const TITLES: Record<Mode, Legend> = {
  departures: { es: 'Salidas', regional: { ca: 'Sortides', va: 'Eixides', eu: 'Irteerak', gl: 'Saídas' }, en: 'DEPARTURES' },
  arrivals: { es: 'Llegadas', regional: { ca: 'Arribades', va: 'Arribades', eu: 'Iritsierak', gl: 'Chegadas' }, en: 'ARRIVALS' },
};

export type Column = 'time' | 'place' | 'train' | 'platform' | 'remarks';

export function columnLegend(column: Column, mode: Mode, remarksEn: string): Legend {
  switch (column) {
    case 'time':
      return { es: 'Hora', regional: { ...same('Hora'), eu: 'Ordua' }, en: 'TIME' };
    case 'place':
      return mode === 'departures'
        ? { es: 'Destino', regional: { ca: 'Destinació', va: 'Destinació', eu: 'Helmuga', gl: 'Destino' }, en: 'DESTINATION' }
        : { es: 'Procedencia', regional: { ca: 'Procedència', va: 'Procedència', eu: 'Jatorria', gl: 'Procedencia' }, en: 'COMING FROM' };
    case 'train':
      return { es: 'Tren', regional: { ...same('Tren'), eu: 'Trena' }, en: 'TRAIN' };
    case 'platform':
      return { es: 'Vía', regional: { ca: 'Via', va: 'Via', eu: 'Bidea', gl: 'Vía' }, en: 'PLATFORM' };
    case 'remarks':
      return { es: 'Observaciones', regional: { ca: 'Observacions', va: 'Observacions', eu: 'Oharrak', gl: 'Observacións' }, en: remarksEn };
  }
}

/** What the remarks say, in Spanish or, on Catalan and Valencian boards, in Catalan (as at Barcelona Sants). */
export interface RemarkWords {
  estimated: string;
  delayed: string;
  cancelled: string;
}

export function remarkWords(regional: Regional): RemarkWords {
  if (regional === 'ca' || regional === 'va') return { estimated: 'ESTIMAT', delayed: 'DEMORAT', cancelled: 'SUPRIMIT' };
  return { estimated: 'ESTIMADO', delayed: 'DEMORADO', cancelled: 'CANCELADO' };
}

/** What the wide row shows with nothing to announce, as photographed: "SALIDAS/DEPARTURES". */
export const idleText = (mode: Mode): string => `${TITLES[mode].es.toUpperCase()}/${TITLES[mode].en}`;
