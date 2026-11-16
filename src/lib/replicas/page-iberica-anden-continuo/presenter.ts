import { fitText, measure, pageIbericaBold7 } from '../../hardware';
import { boardTime, clockTime, confirmedPlatform, destinationsOf, nameLadder, platformDigits, text, type View } from '../../model';
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

  let line: string;
  if (service.here?.activity === 'passes') line = fitText(['SIN PARADA'], font, room);
  else if (service.headsign !== undefined) line = fitText([text(service.headsign)], font, room);
  else {
    // Several destinations of a train that divides share the line; each brings its own ladder of names.
    const places = destinationsOf(service);
    const ladders = places.map((place) => nameLadder(place));
    const forms: string[] = [];
    const depth = Math.max(0, ...ladders.map((ladder) => ladder.length));
    for (let level = 0; level < depth; level++) forms.push(ladders.map((ladder) => ladder[Math.min(level, ladder.length - 1)]).join('/'));
    // When no form of all of them fits, the first destination on its own rather than a name cut in half.
    if (ladders.length > 1) forms.push(...(ladders[0] ?? []));
    line = fitText(forms, font, room);
  }
  return {
    text: line,
    time,
    platform: boltedPlatform(view) || platformDigits(confirmedPlatform(service.here?.platform)) || '',
    led: callingPoints(service) || announcements(view, options),
  };
}
