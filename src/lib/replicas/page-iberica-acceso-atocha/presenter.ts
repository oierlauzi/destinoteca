import { measure } from '../../hardware';
import { boardTime, clockTime, confirmedPlatform, platformDigits, type View } from '../../model';
import { COLS, LEFT, thinFont } from '../page-iberica-electromagneticos/atocha';
import { destinationLine } from '../page-iberica-electromagneticos/destination';
import { announcements, boltedPlatform, callingPoints } from '../page-iberica-anden-electromagnetico/presenter';
import type { AccesoFrame, AccesoOptions } from './def';

/** At least this many blank columns between the name and the time. */
const GAP = 3;

export function blank(view: View, options: AccesoOptions): AccesoFrame {
  return { text: '', time: '', platform: boltedPlatform(view), led: announcements(view, options) };
}

export function present(view: View, options: AccesoOptions): AccesoFrame {
  const service = view.services[0];
  if (!service) return blank(view, options);
  // The time the train is timetabled to leave, in the station's zone.
  const departure = service.here?.departure ?? service.here?.arrival;
  const at = departure?.scheduled ?? boardTime(service, { events: 'departures', sortBy: 'expected' });
  const time = at === undefined ? '' : clockTime(at, view.timeZone);
  const room = COLS - 2 - LEFT - (options.showMinutes && time ? measure(time, thinFont) + GAP : 0);
  return {
    text: destinationLine(service, thinFont, room),
    time,
    platform: boltedPlatform(view) || platformDigits(confirmedPlatform(service.here?.platform)) || '',
    led: callingPoints(service) || announcements(view, options),
  };
}
