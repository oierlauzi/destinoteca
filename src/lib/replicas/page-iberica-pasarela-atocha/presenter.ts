import { boardTime, confirmedPlatform, minutesUntil, platformDigits, type View } from '../../model';
import { thinFont } from '../page-iberica-electromagneticos/atocha';
import { destinationLine } from '../page-iberica-electromagneticos/destination';
import { announcements } from '../page-iberica-anden-electromagnetico/presenter';
import { LINE_COUNT, type PasarelaFrame, type PasarelaLine, type PasarelaOptions } from './def';
import { DESTINATION_LEFT, MINUTES_RIGHT } from './geometry';
import { minutesStrip } from './render';

/** At least this many blank columns between the name and the minutes. */
const GAP = 3;
const EMPTY: PasarelaLine = { platform: '', text: '', minutes: '' };

export function blank(view: View, options: PasarelaOptions): PasarelaFrame {
  return { lines: Array.from({ length: LINE_COUNT }, () => EMPTY), led: announcements(view, options) };
}

/** Each train on a line of its own; a train that is due loses its minutes. */
export function present(view: View, options: PasarelaOptions): PasarelaFrame {
  const lines = view.services.slice(0, LINE_COUNT).map((service): PasarelaLine => {
    const at = boardTime(service, { events: 'departures', sortBy: 'expected' });
    const left = at === undefined ? 0 : minutesUntil(at, view.now);
    const minutes = left > 0 ? String(left) : '';
    const room = MINUTES_RIGHT + 1 - DESTINATION_LEFT - (options.showMinutes && minutes ? minutesStrip(minutes).length + GAP : 0);
    return {
      platform: platformDigits(confirmedPlatform(service.here?.platform)) ?? '',
      text: destinationLine(service, thinFont, room),
      minutes,
    };
  });
  while (lines.length < LINE_COUNT) lines.push(EMPTY);
  return { lines, led: announcements(view, options) };
}
