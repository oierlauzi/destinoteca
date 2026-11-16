import { telenormaCp437 } from '../../hardware';
import {
  boardTime,
  confirmedPlatform,
  destinationsOf,
  fitNames,
  minutesUntil,
  nameLadder,
  platformDigits,
  portionsOf,
  text,
  type Call,
  type Service,
  type View,
} from '../../model';
import { CELLS, type AndenFrame, type AndenOptions } from './def';

const fold = telenormaCp437.fold;

/** A sign bolted to one platform always reads that number; one serving several has none to read. */
export function boltedPlatform(view: View): string {
  const [only, ...others] = view.placement.platforms;
  if (only === undefined || others.length > 0) return '';
  return platformDigits(only) ?? only;
}

function stops(calls: Call[] | undefined): string[] {
  return (calls ?? [])
    .filter((call) => !call.status)
    .map((call) => {
      // The second rung is the everyday short name ("Atocha" for "Atocha Cercanías").
      const ladder = nameLadder(call.place);
      return fold(ladder[1] ?? ladder[0] ?? '');
    })
    .filter(Boolean);
}

const POSITION: Record<string, string> = { front: 'CABEZA', middle: 'CENTRO', rear: 'COLA' };

/**
 * The LED row: where the train calls after this station. A train that divides
 * lists the calls of each part, named by its place in the train when known.
 * That last layout is this replica's own; no photograph shows what the real
 * sign did with such a train.
 */
export function callingPoints(service: Service): string {
  const portions = portionsOf(service).filter((portion) => portion.status !== 'cancelled' || service.status === 'cancelled');
  if (portions.length < 2) {
    const names = stops(portions[0]?.callsAfter);
    return names.length ? `PARA EN: ${names.join(', ')}` : '';
  }
  return portions
    .map((portion) => {
      const names = stops(portion.callsAfter);
      if (names.length === 0) return '';
      const ladder = portion.destination ? nameLadder(portion.destination).map(fold) : [];
      const label = [portion.position ? POSITION[portion.position] : '', ladder[ladder.length - 1] ?? '']
        .filter(Boolean)
        .join(' ');
      return `${label}: ${names.join(', ')}`;
    })
    .filter(Boolean)
    .join(' / ');
}

export function announcements(view: View, options: AndenOptions): string {
  const notices = view.notices.map((notice) => fold(text(notice.text))).filter(Boolean);
  return notices.length ? notices.join(' - ') : options.ledIdle;
}

/** A sign with nothing to announce goes dark, but still says which platform it is. */
export function blank(view: View, options: AndenOptions): AndenFrame {
  return { text: '', minutes: '', platform: boltedPlatform(view), led: announcements(view, options) };
}

export function present(view: View, options: AndenOptions): AndenFrame {
  const service = view.services[0];
  if (!service) return blank(view, options);

  const at = boardTime(service, { events: 'departures', sortBy: 'expected' });
  const minutes = at === undefined ? '' : String(minutesUntil(at, view.now));
  // The minutes are written over the end of the same line, so the name must
  // stop short of them, with one blank cell in between to keep both legible.
  const room = options.showMinutes && minutes ? Math.max(1, CELLS - minutes.length - 1) : CELLS;

  let line: string;
  if (service.here?.activity === 'passes') {
    line = 'SIN PARADA'.slice(0, room);
  } else if (service.headsign !== undefined) {
    line = fold(text(service.headsign)).slice(0, room).replace(/[\s-]+$/, '');
  } else {
    line = fitNames(destinationsOf(service), room, '/', fold);
  }

  return {
    text: line,
    minutes,
    // Like the real thing: the platform appears once it is confirmed, not before.
    platform: boltedPlatform(view) || platformDigits(confirmedPlatform(service.here?.platform)) || '',
    led: callingPoints(service) || announcements(view, options),
  };
}
