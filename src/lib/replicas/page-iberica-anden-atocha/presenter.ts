import { boardTime, confirmedPlatform, minutesUntil, platformDigits, type View } from '../../model';
import { COLS, LEFT, thinFont } from '../page-iberica-electromagneticos/atocha';
import { destinationLine } from '../page-iberica-electromagneticos/destination';
import { announcements, boltedPlatform, callingPoints } from '../page-iberica-anden-electromagnetico/presenter';
import type { AndenAtochaFrame, AndenAtochaOptions } from './def';
import { minutesStrip } from './render';

/** At least this many blank columns between the name and the minutes. */
const GAP = 3;
const STOPS = 'PARA EN: ';

export function blank(view: View, options: AndenAtochaOptions): AndenAtochaFrame {
  return { text: '', minutes: '', platform: boltedPlatform(view), label: '', led: announcements(view, options) };
}

/**
 * "PARA EN:" over the stops while the train is on its way. Once it is due,
 * the minutes go and the panel reads "ESTE TREN:", as photographed with a
 * train at the platform.
 */
export function present(view: View, options: AndenAtochaOptions): AndenAtochaFrame {
  const service = view.services[0];
  if (!service) return blank(view, options);
  const at = boardTime(service, { events: 'departures', sortBy: 'expected' });
  const due = at !== undefined && minutesUntil(at, view.now) === 0;
  const minutes = at === undefined || due ? '' : String(minutesUntil(at, view.now));
  const room = COLS - 2 - LEFT - (options.showMinutes && minutes ? minutesStrip(minutes).length + GAP : 0);
  const calls = callingPoints(service);
  return {
    text: destinationLine(service, thinFont, room),
    minutes,
    platform: boltedPlatform(view) || platformDigits(confirmedPlatform(service.here?.platform)) || '',
    label: calls ? (due ? 'ESTE TREN:' : 'PARA EN:') : '',
    led: calls ? (calls.startsWith(STOPS) ? calls.slice(STOPS.length) : calls) : announcements(view, options),
  };
}
