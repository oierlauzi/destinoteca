import { cp437 } from '../../hardware';
import type { Values } from '../../params';
import type { Variant } from './geometry';
import { identitiesOf, plateFor, productOf, type Identity, type Logo } from './logos';

/**
 * The drum of the train column: the flaps printed for it, in the order they
 * fall.
 *
 * A Solari drum carries a fixed set of cards, printed when the board was
 * built or refitted, so what a board could say is as much a fact about it as
 * its shape. A board of 1985 has no card for a train that did not run until
 * 2021, and must not be able to turn onto one. The presets below are the
 * states of this board that a photograph shows; anything else is built by
 * hand.
 *
 * The cards were reprinted piecemeal, so one drum holds more than one
 * identity: in 2007 Trd and Regional Exprés were still on Grandes Líneas
 * while Altaria, Talgo and Intercity had moved to the wordmark of 2005.
 */

/** One card of the drum. `rotulado` letters the text; any other identity prints its plate. */
export interface DrumFlap {
  /** What the card says: a product when it is printed, any text when it is lettered. */
  text: string;
  identity: Identity;
}

/**
 * A card as it travels in a URL and as the flaps are keyed: the text alone
 * when it is lettered, and `TEXT@identity` when a plate is printed on it.
 */
export function flapKey(flap: DrumFlap): string {
  return flap.identity === 'rotulado' ? flap.text : `${flap.text}@${flap.identity}`;
}

export function parseFlap(key: string): DrumFlap {
  const at = key.lastIndexOf('@');
  if (at < 0) return { text: key, identity: 'rotulado' };
  const identity = key.slice(at + 1) as Identity;
  const text = key.slice(0, at);
  if (plateFor(text, identity)) return { text, identity };
  // The identity is one this board never printed, or one an older URL names
  // by a word since changed. The product's newest plate is the sensible
  // reading; failing that the card is lettered, so a URL still says something.
  const product = productOf(text);
  const newest = product ? identitiesOf(product).at(-1) : undefined;
  if (product && newest) return { text: product, identity: newest };
  return { text: key, identity: 'rotulado' };
}

/** The plate a card is printed with, or nothing when it is lettered. */
export function plateOf(key: string): Logo | undefined {
  const flap = parseFlap(key);
  return flap.identity === 'rotulado' ? undefined : plateFor(flap.text, flap.identity);
}

/** What a card says, which is the key without the identity it is printed in. */
export const textOf = (key: string): string => parseFlap(key).text;

const lettered = (...texts: string[]): string[] => texts;

/**
 * What the boards of the seventies and eighties say, read off the
 * photographs of the hand-typed form.
 */
const ROTULADO: Record<Variant, string[]> = {
  largo: lettered('TALGO', 'TALGO PENDULAR', 'TALGO EXTREMADURA', 'RAPIDO', 'RAP. ARAGON', 'EXPRESO', 'ELECTROTREN', 'INTERURBANO', 'TER', 'ESTRELLA'),
  cercanias: lettered('TRANVIA'),
};


/**
 * The order products are offered in, which is the order they fall on a drum
 * built from all of them.
 */
const PRODUCT_ORDER = [
  'TRD', 'REGIONAL EXPRES', 'GRANDES LINEAS', 'REGIONAL', 'ALTARIA', 'TALGO', 'INTERCITY', 'ARCO', 'ESTRELLA', 'TRENHOTEL',
  'ALVIA', 'AVANT', 'MEDIA DISTANCIA', 'CERCANIAS', 'EUROMED', 'AVE', 'AVLO', 'IRYO', 'OUIGO', 'TREN DE LOS 80',
];

export interface Preset {
  id: string;
  /** The cards it carries, for the variant that has a drum of plates. */
  flaps(variant: Variant): string[];
}

/**
 * The drums offered for loading, each a state of this board that can be given
 * whole. None is offered yet, and they are curated by hand rather than
 * derived: a drum rounded out with guesses, or standing in for its cards with
 * older drawings, would claim more than is known. The 2007 photograph proves
 * five cards and says nothing about the rest; the 1995 one shows an identity
 * whose artwork is not drawn here; and of today's, Renfe's AVE, avlo and AVE
 * Eur of 2026 are not published as vector.
 *
 * To offer one, add `{ id, flaps }` here with `solari.drum.<id>` and
 * `solari.drum.<id>.note` beside it in the strings. The form's load buttons
 * appear by themselves.
 */
export const PRESETS: Preset[] = [];

/**
 * The drum a board turns when none has been loaded or built by hand: the
 * lettered words of the seventies and eighties, which the photographs show
 * whole. Every plate that is drawn can be put on a drum by hand, which claims
 * nothing about what a board carried.
 */
export const DEFAULT_PRESET = 'rotulado';

/** The cards a drum carries: a loaded one's, or the default when it names none. */
export const flapsOfPreset = (id: string, variant: Variant): string[] =>
  (PRESETS.find((preset) => preset.id === id) ?? { flaps: (v: Variant) => ROTULADO[v] }).flaps(variant);

/** Every card that can be added to a drum by hand, in the order they are offered. */
export function offered(variant: Variant): string[] {
  if (variant !== 'largo') return ROTULADO[variant];
  const plates = PRODUCT_ORDER.flatMap((product) => identitiesOf(product).map((identity) => flapKey({ text: product, identity })));
  return [...plates, ...ROTULADO.largo];
}

/**
 * The drum a board is set to: the cards built by hand when there are any, and
 * otherwise the loaded drum's.
 */
export function drumOf(variant: Variant, options: Values): string[] {
  const own = options.flaps;
  if (Array.isArray(own) && own.length) return ['', ...own.map(String)];
  return ['', ...flapsOfPreset(String(options.drum ?? DEFAULT_PRESET), variant)];
}

/**
 * What a flap does with a train the drum has no card for.
 *
 * A drum that has no card for a train cannot announce it, so `blanco` leaves
 * the flap empty, which is what the machine would do. `rotulada` letters the
 * name instead: a liberty, but it keeps the board readable when it is fed
 * trains from long after the drum was printed, which is what most visitors
 * are doing. That is why it is the one offered first.
 */
export type Fallback = 'rotulada' | 'blanco';
export const FALLBACKS: Fallback[] = ['rotulada', 'blanco'];
export const DEFAULT_FALLBACK: Fallback = 'rotulada';
export const fallbackOf = (options: Values): Fallback => (options.fallback === 'blanco' ? 'blanco' : 'rotulada');

/**
 * The card a train flap turns to for what a row says: the first on the drum
 * that names the same product, and otherwise whatever the fallback says.
 */
export function cardFor(drum: string[], text: string, fallback: Fallback = DEFAULT_FALLBACK): string {
  const said = cp437.fold(text).trim().replace(/\s+/g, ' ');
  if (!said) return '';
  const product = productOf(said);
  for (const key of drum) {
    const flap = parseFlap(key);
    if (flap.text === said || (product && flap.text === product)) return key;
  }
  return fallback === 'blanco' ? '' : said;
}
