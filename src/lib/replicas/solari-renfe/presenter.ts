import { cp437 } from '../../hardware';
import {
  clockTime,
  confirmedPlatform,
  destinationsOf,
  fitName,
  fitNames,
  nameLadder,
  platformDigits,
  text,
  type EventTime,
  type Place,
  type Service,
  type View,
} from '../../model';
import type { Values } from '../../params';
import { rowsOf, type SolariFrame, type SolariRow } from './def';
import type { Variant } from './geometry';

const fold = cp437.fold;

/**
 * A place in twelve flaps: the longest form that fits, and when even the
 * shortest does not, the end of its last whole word rather than half of one.
 */
function placeText(places: Place[]): string {
  const fitted = fitNames(places, 12, '/', fold);
  if (places.length !== 1) return fitted;
  const forms = nameLadder(places[0]!).map(fold);
  if (forms.includes(fitted)) return fitted;
  // Cut from the shortest form: keep it if the cut falls between two words.
  const source = forms[forms.length - 1] ?? '';
  if (/[\s\-/]/.test(source[fitted.length] ?? ' ')) return fitted.trim();
  const end = Math.max(fitted.lastIndexOf(' '), fitted.lastIndexOf('-'), fitted.lastIndexOf('/'));
  return end > 0 ? fitted.slice(0, end).trim() : fitted;
}

/** "14.05": the way the boards write a time. */
const timeOf = (event: EventTime | undefined, view: View): string => {
  const at = event?.scheduled ?? event?.estimated;
  return at === undefined ? '' : clockTime(at, view.timeZone).replace(':', '.');
};

const train = (service: Service): string => fold(service.product?.shortName ?? text(service.product?.name)).trim();
const platform = (service: Service): string => platformDigits(confirmedPlatform(service.here?.platform)) ?? '';
const origin = (service: Service): Place | undefined => service.origin ?? service.callsBefore?.[0]?.place;

function longDistance(service: Service, view: View): SolariRow {
  const via = service.via?.[0];
  return {
    t: train(service),
    d: placeText(destinationsOf(service)),
    p: via ? fitName(via, 18, fold) : '',
    h: timeOf(service.here?.departure, view),
    v: platform(service),
    l: '',
  };
}

/** A train that starts here has no origin or arrival; one that ends here, no destination or departure. */
function commuter(service: Service, view: View): SolariRow {
  const starts = service.here?.activity === 'origin';
  const ends = service.here?.activity === 'terminus';
  const from = origin(service);
  return {
    t: train(service),
    o: !starts && from ? placeText([from]) : '',
    a: starts ? '' : timeOf(service.here?.arrival, view),
    d: ends ? '' : placeText(destinationsOf(service)),
    s: ends ? '' : timeOf(service.here?.departure, view),
    v: platform(service),
    l: '',
  };
}

export function blank(variant: Variant, options: Values): SolariFrame {
  return { rows: Array.from({ length: rowsOf(options, variant) }, () => ({})) };
}

export function present(variant: Variant, view: View, options: Values): SolariFrame {
  const rows = view.services.slice(0, rowsOf(options, variant)).map((service) => (variant === 'largo' ? longDistance(service, view) : commuter(service, view)));
  while (rows.length < rowsOf(options, variant)) rows.push({});
  return { rows };
}
