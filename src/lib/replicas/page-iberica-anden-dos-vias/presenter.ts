import { confirmedPlatform, samePlatform, type Service, type View } from '../../model';
import { blank as blankHalf, present as presentHalf } from '../page-iberica-anden-electromagnetico/presenter';
import type { DosViasFrame, DosViasHalf, DosViasOptions } from './def';

const platformOf = (service: Service): string | undefined => confirmedPlatform(service.here?.platform);

/**
 * The platform each half serves: those of its placement, in order, or, on a
 * sign bolted to none, the platforms of the next trains, one each.
 */
export function halfPlatforms(view: View): [string | undefined, string | undefined] {
  const [first, second] = view.placement.platforms;
  if (first !== undefined) return [first, second];
  const seen: string[] = [];
  for (const service of view.services) {
    const platform = platformOf(service);
    if (platform !== undefined && !seen.some((other) => samePlatform(other, platform))) seen.push(platform);
    if (seen.length === 2) break;
  }
  return [seen[0], seen[1]];
}

/** One half: the single sign's view, narrowed to its platform. */
function half(view: View, platform: string | undefined, options: DosViasOptions): DosViasHalf {
  const services = platform === undefined ? [] : view.services.filter((service) => samePlatform(platformOf(service), platform));
  const narrowed: View = { ...view, services: services.slice(0, 1), total: services.length, placement: { ...view.placement, platforms: platform === undefined ? [] : [platform] } };
  const frame = services.length ? presentHalf(narrowed, options) : blankHalf(narrowed, options);
  return { platform: frame.platform, text: frame.text, minutes: frame.minutes, led: frame.led };
}

export function present(view: View, options: DosViasOptions): DosViasFrame {
  const [top, bottom] = halfPlatforms(view);
  return { halves: [half(view, top, options), half(view, bottom, options)] };
}

/** With nothing to announce both halves go dark, but keep their platforms. */
export function blank(view: View, options: DosViasOptions): DosViasFrame {
  const [top, bottom] = halfPlatforms(view);
  return { halves: [half({ ...view, services: [] }, top, options), half({ ...view, services: [] }, bottom, options)] };
}
