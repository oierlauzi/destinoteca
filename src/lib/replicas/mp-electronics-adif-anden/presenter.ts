import { mpElectronicsAdif as font } from '../../hardware';
import { clockTime, confirmedPlatform, destinationsOf, fitNames, nameLadder, platformDigits, text, type View } from '../../model';
import { trainText } from '../mp-electronics-adif/presenter';
import { boltedPlatform } from '../page-iberica-anden-electromagnetico/presenter';
import type { AndenFrame } from './def';

const fold = font.fold;

/** The running line: where the train stops, or the station's notices. */
function line(view: View): string {
  const service = view.services[0];
  const stops = (service?.callsAfter ?? [])
    .filter((call) => !call.status)
    .map((call) => {
      const ladder = nameLadder(call.place);
      return ladder[1] ?? ladder[0] ?? '';
    })
    .filter(Boolean);
  if (stops.length) return `CON PARADA EN ${stops.join(', ')}`;
  return view.notices.map((notice) => text(notice.text)).filter(Boolean).join(' - ');
}

const timeOf = (view: View): Pick<AndenFrame, 'clock' | 'zone'> => (view.now ? { clock: view.now, zone: view.timeZone } : {});

export function blank(view: View): AndenFrame {
  return { time: '', train: '', destination: '', line: line(view), platform: boltedPlatform(view), ...timeOf(view) };
}

export function present(view: View): AndenFrame {
  const service = view.services[0];
  if (!service) return blank(view);
  const departure = service.here?.departure ?? service.here?.arrival;
  const at = departure?.scheduled ?? departure?.estimated;
  return {
    time: at === undefined ? '' : clockTime(at, view.timeZone),
    train: trainText(service),
    destination: fitNames(destinationsOf(service), 18, '/', fold),
    line: line(view),
    platform: boltedPlatform(view) || platformDigits(confirmedPlatform(service.here?.platform)) || '',
    ...timeOf(view),
  };
}
