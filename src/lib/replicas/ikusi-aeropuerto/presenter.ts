import { ikusiLcd } from '../../hardware';
import { bestTime, clockTime, confirmedPlatform, delayMinutes, destinationsOf, fitNames, platformDigits, portionsOf, text, type EventTime, type Place, type Service, type View } from '../../model';
import { columnSpans, layoutOf, type BoardRow, type Mode } from './columns';
import type { AirportFrame, AirportOptions } from './def';
import { MAX_ROWS, shapeOf } from './geometry';

const fold = ikusiLcd.fold;
/** From this many minutes late, a flight is marked as delayed. */
const SHOW_DELAY = 5;
/** Allocations that are the check-in desks. */
const COUNTER_KINDS = new Set(['check-in', 'checkin', 'counter', 'mostrador']);

const blankRow = (): BoardRow => ({ time: '', place: '', flight: '', counter: '', second: '', gate: '', remarks: '' });

const eventOf = (service: Service, mode: Mode): EventTime | undefined =>
  mode === 'arrivals' ? (service.here?.arrival ?? service.here?.departure) : (service.here?.departure ?? service.here?.arrival);

function originsOf(service: Service): Place[] {
  const origins = portionsOf(service)
    .map((portion) => portion.origin ?? service.origin ?? portion.callsBefore?.[0]?.place ?? service.callsBefore?.[0]?.place)
    .filter((place): place is Place => place !== undefined);
  return origins.filter((place, i) => origins.findIndex((other) => other.name === place.name) === i);
}

/**
 * The airline and the number: «IB 3910». A number of more than four digits
 * loses its leading zeros, and one that still does not fit goes straight
 * after the airline.
 */
export function flightOf(service: Service): string {
  // An airline's code, or for a train the product («AVE»).
  const code = service.operator?.shortName;
  const airline = fold((code && code.length <= 3 ? code : undefined) ?? service.product?.shortName ?? code ?? text(service.product?.name))
    .replace(/\s+/g, '')
    .slice(0, 3);
  let number = (service.number ?? '').trim();
  if (number.length > 4) number = number.replace(/^0+(?=\d)/, '');
  if (!airline) return number;
  return number.length > 4 ? `${airline}${number}` : `${airline} ${number}`.trim();
}

/** What the remarks say, in Spanish. */
function remarks(service: Service, event: EventTime | undefined, mode: Mode): string {
  if (service.status === 'cancelled') return 'CANCELADO';
  if (mode === 'arrivals' && (service.presence === 'at-stop' || event?.actual !== undefined)) return 'LLEGADA';
  if (mode === 'departures' && service.presence === 'at-stop') return 'EMBARQUE';
  const late = delayMinutes(event);
  if ((late !== undefined && late >= SHOW_DELAY) || service.status === 'delayed') return 'RETRASADO';
  return '';
}

function row(service: Service, view: View, options: AirportOptions, placeWidth: number): BoardRow {
  const mode: Mode = options.mode === 'arrivals' ? 'arrivals' : 'departures';
  const event = eventOf(service, mode);
  const scheduled = event?.scheduled ?? bestTime(event);
  const places = mode === 'arrivals' ? originsOf(service) : destinationsOf(service);
  const place = mode === 'departures' && service.headsign !== undefined ? fold(text(service.headsign)).slice(0, placeWidth).trimEnd() : fitNames(places, placeWidth, '/', fold);
  const expected = bestTime(event);
  return {
    time: scheduled === undefined ? '' : clockTime(scheduled, view.timeZone),
    place,
    flight: flightOf(service),
    counter: service.here?.allocations?.find((allocation) => COUNTER_KINDS.has(allocation.kind))?.name ?? '',
    // The boarding time is not known from a timetable; an arrival's expected time is.
    second: mode === 'arrivals' && expected !== undefined ? clockTime(expected, view.timeZone) : '',
    gate: platformDigits(confirmedPlatform(service.here?.platform)) ?? '',
    remarks: remarks(service, event, mode),
  };
}

const clockOf = (view: View): string => (view.now ? clockTime(view.now, view.timeZone) : '');

export function blank(view: View): AirportFrame {
  return { rows: Array.from({ length: MAX_ROWS }, blankRow), clock: clockOf(view) };
}

export function present(view: View, options: AirportOptions): AirportFrame {
  const { rows: count, cells } = shapeOf(options);
  const mode: Mode = options.mode === 'arrivals' ? 'arrivals' : 'departures';
  const placeWidth = columnSpans(layoutOf(options.layout)[mode], cells).find((span) => span.key === 'place')?.width ?? 10;
  const rows = view.services.slice(0, count).map((service) => row(service, view, options, placeWidth));
  while (rows.length < MAX_ROWS) rows.push(blankRow());
  return { rows, clock: clockOf(view) };
}
