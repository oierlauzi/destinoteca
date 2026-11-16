import {
  boardTime,
  confirmedPlatform,
  destinationsOf,
  fitNames,
  minutesUntil,
  nameLadder,
  platformDigits,
  text,
  type Service,
  type View,
} from '../../model';
import { flipDotCharset } from '../page-iberica-electromagneticos/flip-dot-lines';
import { CELLS, PLATFORM_CELLS, type BoardRow, type VestibuloFrame, type VestibuloOptions } from './def';

const fold = flipDotCharset.fold;

function row(service: Service, view: View, options: VestibuloOptions): BoardRow {
  const at = boardTime(service, { events: 'departures', sortBy: 'expected' });
  const minutes = at === undefined ? '' : String(minutesUntil(at, view.now));
  // The minutes are written over the end of the line, one blank cell after the name.
  const room = CELLS - PLATFORM_CELLS - (options.showMinutes && minutes ? minutes.length + 1 : 0);
  let destination: string;
  if (service.here?.activity === 'passes') destination = 'SIN PARADA'.slice(0, room);
  else if (service.headsign !== undefined) destination = fold(text(service.headsign)).slice(0, room).replace(/[\s-]+$/, '');
  else destination = fitNames(destinationsOf(service), room, '/', fold);
  // As on the platform signs, a platform appears once it is confirmed.
  const platform = platformDigits(confirmedPlatform(service.here?.platform)) ?? '';
  return { platform: platform.slice(-PLATFORM_CELLS), destination, minutes };
}

const blankRow: BoardRow = { platform: '', destination: '', minutes: '' };

function announcements(view: View, options: VestibuloOptions): string {
  const notices = view.notices.map((notice) => fold(text(notice.text))).filter(Boolean);
  return notices.length ? notices.join(' - ') : options.ledIdle;
}

/**
 * The LED row: notices first; otherwise where the first train calls. No
 * photograph shows what the real boards ran on it, so this is the replica's
 * own choice, worded like the platform signs.
 */
function ledText(view: View, options: VestibuloOptions): string {
  const notices = announcements(view, options);
  if (view.notices.length) return notices;
  const first = view.services[0];
  const stops = (first?.callsAfter ?? []).filter((call) => !call.status).map((call) => fold(nameLadder(call.place)[1] ?? call.place.name));
  if (first && stops.length) {
    const ladder = destinationsOf(first).map((place) => nameLadder(place).map(fold));
    const name = ladder.map((forms) => forms[forms.length - 1] ?? '').join('/');
    return `${name}: PARA EN ${stops.join(', ')}`;
  }
  return notices;
}

export function blank(view: View, options: VestibuloOptions, lines: number): VestibuloFrame {
  return { rows: Array.from({ length: lines }, () => blankRow), led: announcements(view, options) };
}

export function present(view: View, options: VestibuloOptions, lines: number): VestibuloFrame {
  const rows = view.services.slice(0, lines).map((service) => row(service, view, options));
  while (rows.length < lines) rows.push(blankRow);
  return { rows, led: ledText(view, options) };
}
