import { measure, pageIbericaBold7 } from '../../hardware';
import { boardTime, clockTime, confirmedPlatform, platformDigits, type View } from '../../model';
import { destinationLine } from '../page-iberica-electromagneticos/destination';
import { announcements, boltedPlatform, callingPoints } from '../page-iberica-anden-electromagnetico/presenter';
import type { ContinuoFrame, ContinuoOptions } from './def';
import { COLS } from './geometry';

const font = pageIbericaBold7;
/** A blank column before the text, as in the photographs. */
export const LEFT = 1;
/** At least this many blank columns between the name and the time. */
const GAP = 3;

export function blank(view: View, options: ContinuoOptions): ContinuoFrame {
  return { text: '', time: '', platform: boltedPlatform(view), led: announcements(view, options) };
}

export function present(view: View, options: ContinuoOptions): ContinuoFrame {
  const service = view.services[0];
  if (!service) return blank(view, options);
  // The time the train is timetabled to leave, in the station's zone: "CHAMARTIN 10:12".
  const departure = service.here?.departure ?? service.here?.arrival;
  const at = departure?.scheduled ?? boardTime(service, { events: 'departures', sortBy: 'expected' });
  const time = at === undefined ? '' : clockTime(at, view.timeZone);
  const room = COLS - LEFT - (options.showMinutes && time ? measure(time, font) + GAP : 0);

  const line = destinationLine(service, font, room);
  return {
    text: line,
    time,
    platform: boltedPlatform(view) || platformDigits(confirmedPlatform(service.here?.platform)) || '',
    led: callingPoints(service) || announcements(view, options),
  };
}
