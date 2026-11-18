import { ikusi7x9 } from '../../hardware';
import { boardTime, clockTime, confirmedPlatform, destinationsOf, fitNames, platformDigits, text, type View } from '../../model';
import type { EuskotrenFrame } from './def';
import { TEXT } from './geometry';

const fold = ikusi7x9.fold;

/** The platform's number is printed: a sign bolted to one platform always reads it. */
export function printedPlatform(view: View): string {
  const [only, ...others] = view.placement.platforms;
  if (only === undefined || others.length > 0) return '';
  return platformDigits(only) ?? only;
}

export function blank(view: View): EuskotrenFrame {
  return { time: '', text: '', platform: printedPlatform(view) };
}

/**
 * The next train: its time, and where it goes by its Basque name, as
 * photographed («DONOSTIA», «HENDAIA»), the longest that fits.
 */
export function present(view: View): EuskotrenFrame {
  const service = view.services[0];
  if (!service) return blank(view);
  const at = boardTime(service, { events: 'departures', sortBy: 'scheduled' });
  const line =
    service.headsign !== undefined ? fold(text(service.headsign, 'eu')).slice(0, TEXT).trimEnd() : fitNames(destinationsOf(service), TEXT, '/', fold, 'eu');
  return {
    time: at === undefined ? '' : clockTime(at, view.timeZone),
    text: line,
    platform: printedPlatform(view) || platformDigits(confirmedPlatform(service.here?.platform)) || '',
  };
}
