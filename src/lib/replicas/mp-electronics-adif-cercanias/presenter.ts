import { cp437 } from '../../hardware';
import { boardTime, clockTime, confirmedPlatform, destinationsOf, fitNames, minutesUntil, platformDigits, type Service, type View } from '../../model';
import type { CercaniasFrame, CercaniasRow } from './def';
import { CELLS, ROWS } from './geometry';

const fold = cp437.fold;
/** Up to this many minutes away, a train shows the minutes; further off, its time. */
const MINUTES_UP_TO = 30;

const blankRow: CercaniasRow = { platform: '', destination: '', time: '' };

/** "3 min", "12 m." (two digits leave no room for "min"), or the time of day. */
export function timeText(service: Service, view: View): string {
  const at = boardTime(service, { events: 'departures', sortBy: 'expected' });
  if (at === undefined) return '';
  const minutes = minutesUntil(at, view.now);
  if (minutes <= 9) return `${minutes} min`;
  if (minutes <= MINUTES_UP_TO) return `${minutes} m.`;
  return clockTime(at, view.timeZone);
}

export function blank(): CercaniasFrame {
  return { rows: Array.from({ length: ROWS }, () => blankRow) };
}

export function present(view: View): CercaniasFrame {
  const rows = view.services.slice(0, ROWS).map(
    (service): CercaniasRow => ({
      platform: platformDigits(confirmedPlatform(service.here?.platform)) ?? '',
      destination: fitNames(destinationsOf(service), CELLS.destination, '/', fold),
      time: timeText(service, view),
    }),
  );
  while (rows.length < ROWS) rows.push(blankRow);
  return { rows };
}
