import { mpElectronicsAdif as font } from '../../hardware';
import {
  bestTime,
  clockTime,
  confirmedPlatform,
  delayMinutes,
  destinationsOf,
  fitNames,
  platformDigits,
  portionsOf,
  text,
  type EventTime,
  type Place,
  type Service,
  type View,
} from '../../model';
import type { AdifFrame, AdifOptions, AdifRow } from './def';
import { CELLS, ROWS } from './geometry';
import { idleText, remarkWords, type Mode } from './labels';

const fold = font.fold;
/** Below this many minutes late, the board says nothing. */
const SHOW_DELAY = 3;

const blankRow: AdifRow = { time: '', place: '', train: '', platform: '', remarks: '' };

const eventOf = (service: Service, mode: Mode): EventTime | undefined =>
  mode === 'arrivals' ? (service.here?.arrival ?? service.here?.departure) : (service.here?.departure ?? service.here?.arrival);

/** Where an arriving train comes from: its origin, or the first call it made. */
function originsOf(service: Service): Place[] {
  const origins = portionsOf(service)
    .map((portion) => portion.origin ?? service.origin ?? portion.callsBefore?.[0]?.place ?? service.callsBefore?.[0]?.place)
    .filter((place): place is Place => place !== undefined);
  return origins.filter((place, i) => origins.findIndex((other) => other.name === place.name) === i);
}

const pad = (number: string): string => (/^\d+$/.test(number) && number.length < 5 ? number.padStart(5, '0') : number);

/**
 * "IRYO 06110": the product and the train number, or both numbers of two
 * trains running coupled ("03073/34073"). The renderer puts the product on
 * the left of the field and the numbers on the right.
 */
export function trainText(service: Service): string {
  const portions = portionsOf(service);
  const numbers = portions.map((portion) => portion.number ?? '').filter(Boolean);
  if (numbers.length < 2) numbers.splice(0, numbers.length, ...[service.number, ...(service.aliases ?? []).map((alias) => alias.number)].filter((n): n is string => !!n));
  const unique = [...new Set(numbers.map(pad))];
  const product = fold(service.product?.shortName ?? text(service.product?.name)).trim();
  const number = unique.join('/');
  // A long number leaves room for only the start of the product, as photographed ("A 03073/34073").
  const room = CELLS.train - number.length - 1;
  return [product.slice(0, Math.max(0, room)).trim(), number].filter(Boolean).join(' ');
}

function remarks(service: Service, event: EventTime | undefined, view: View, options: AdifOptions): string {
  const words = remarkWords(options.regional);
  if (service.status === 'cancelled') return words.cancelled;
  const late = delayMinutes(event);
  const at = bestTime(event);
  if (late !== undefined && late >= SHOW_DELAY && at !== undefined) return `${words.estimated} ${clockTime(at, view.timeZone)}`;
  if (service.status === 'delayed') return words.delayed;
  return '';
}

function row(service: Service, view: View, options: AdifOptions): AdifRow {
  const mode = options.mode;
  const event = eventOf(service, mode);
  const scheduled = event?.scheduled ?? bestTime(event);
  const places = mode === 'arrivals' ? originsOf(service) : destinationsOf(service);
  const place =
    mode === 'departures' && service.headsign !== undefined
      ? fold(text(service.headsign)).slice(0, CELLS.place)
      : fitNames(places, CELLS.place, '/', fold);
  return {
    time: scheduled === undefined ? '' : clockTime(scheduled, view.timeZone),
    place,
    train: trainText(service),
    platform: platformDigits(confirmedPlatform(service.here?.platform)) ?? '-',
    remarks: remarks(service, event, view, options),
  };
}

function wideText(view: View, options: AdifOptions): string {
  const notices = view.notices.map((notice) => text(notice.text)).filter(Boolean);
  if (notices.length) return notices.join(' - ');
  return options.wideIdle || idleText(options.mode);
}

const boards = (options: AdifOptions): number => Math.max(1, options.across) * Math.max(1, options.down);

export function blank(view: View, options: AdifOptions): AdifFrame {
  return { rows: Array.from({ length: ROWS * boards(options) }, () => blankRow), wide: wideText(view, options) };
}

export function present(view: View, options: AdifOptions): AdifFrame {
  const size = ROWS * boards(options);
  const rows = view.services.slice(0, size).map((service) => row(service, view, options));
  while (rows.length < size) rows.push(blankRow);
  return { rows, wide: wideText(view, options) };
}
