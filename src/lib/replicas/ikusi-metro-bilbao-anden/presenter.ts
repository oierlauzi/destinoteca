import { boardTime, destinationsOf, fitNames, minutesUntil, portionsOf, text, type Service, type View } from '../../model';
import { fold } from '../ikusi-metro-bilbao/parts';
import { BRACKET_END, ROW_COUNT, type BilbaoFrame, type BilbaoOptions, type BilbaoRow } from './def';

const timeOf = (view: View): Pick<BilbaoFrame, 'clock' | 'zone'> => (view.now ? { clock: view.now, zone: view.timeZone } : {});

const empty = (): BilbaoRow => ({ destination: '', bracket: '', minutes: '' });

/**
 * The number in brackets. Photographs show «(5)» before the minutes of some
 * trains and nothing before others; that it is the number of cars, five on
 * the longer trains, is a guess. Here it is written when a train is known
 * to have five cars or more.
 */
export function bracketOf(service: Service): string {
  const cars = portionsOf(service).reduce((sum, portion) => sum + (portion.formation?.cars?.length ?? 0), 0);
  return cars >= 5 ? String(cars) : '';
}

/**
 * A row for one train: where it goes, by the longest name that leaves room
 * for the bracket, and the minutes left, two digits. A train at the
 * platform leaves the minutes blank, as photographed.
 */
export function rowOf(service: Service, view: View, _options: BilbaoOptions): BilbaoRow {
  const f = fold;
  const bracket = bracketOf(service);
  const at = boardTime(service, { events: 'departures', sortBy: 'expected' });
  const minutes = at === undefined ? undefined : minutesUntil(at, view.now);
  const room = bracket ? BRACKET_END - bracket.length - 3 : BRACKET_END;
  const destination = service.headsign !== undefined ? f(text(service.headsign, 'eu')).slice(0, room).trimEnd() : fitNames(destinationsOf(service), room, '/', f, 'eu');
  return { destination, bracket, minutes: minutes === undefined || minutes <= 0 ? '' : String(Math.min(minutes, 99)).padStart(2, '0') };
}

export function blank(view: View): BilbaoFrame {
  return { rows: Array.from({ length: ROW_COUNT }, empty), ...timeOf(view) };
}

export function present(view: View, options: BilbaoOptions): BilbaoFrame {
  const rows = view.services.slice(0, ROW_COUNT).map((service) => rowOf(service, view, options));
  while (rows.length < ROW_COUNT) rows.push(empty());
  return { rows, ...timeOf(view) };
}
