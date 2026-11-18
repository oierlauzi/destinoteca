import { ikusi7x9, telenormaCp437 } from '../../hardware';
import { boardTime, clockTime, confirmedPlatform, destinationsOf, fitNames, nameLadder, platformDigits, text, type Service, type View } from '../../model';
import type { IkusiFrame } from './def';
import { LINE } from './geometry';

const fold = ikusi7x9.fold;

/** The vía is printed: a sign bolted to one platform always reads its number. */
function printedPlatform(view: View): string {
  const [only, ...others] = view.placement.platforms;
  if (only === undefined || others.length > 0) return '';
  return platformDigits(only) ?? only;
}

export function blank(view: View): IkusiFrame {
  return { time: '', text: '', platform: printedPlatform(view), led: '' };
}

/**
 * The LED row: «PARADA EN» and where the train calls after this station, by
 * their everyday short names («ATOCHA» for «Atocha Cercanías»). How the real
 * sign separated the names is not known; here they go with commas.
 */
export function calls(service: Service): string {
  const names = (service.callsAfter ?? [])
    .filter((call) => !call.status)
    .map((call) => {
      const ladder = nameLadder(call.place);
      return telenormaCp437.fold(ladder[1] ?? ladder[0] ?? '');
    })
    .filter(Boolean);
  return names.length ? `PARADA EN ${names.join(', ')}` : '';
}

export function present(view: View): IkusiFrame {
  const service = view.services[0];
  if (!service) return blank(view);
  const at = boardTime(service, { events: 'departures', sortBy: 'scheduled' });
  let line: string;
  if (service.here?.activity === 'passes') line = 'SIN PARADA';
  else if (service.headsign !== undefined) line = fold(text(service.headsign)).slice(0, LINE).trimEnd();
  else line = fitNames(destinationsOf(service), LINE, '/', fold);
  return {
    time: at === undefined ? '' : clockTime(at, view.timeZone),
    text: line,
    platform: printedPlatform(view) || platformDigits(confirmedPlatform(service.here?.platform)) || '',
    led: service.here?.activity === 'passes' ? '' : calls(service),
  };
}
