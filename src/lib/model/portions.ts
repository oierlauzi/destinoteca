import type { Place, Portion, Service } from './types';

/** A portion with the fields it shares with the rest of the train filled in. */
export interface ResolvedPortion extends Portion {
  /** Index within the service, 0 for a train that does not divide. */
  index: number;
}

/**
 * The parts of a train, always at least one. A train that does not divide is
 * its own single portion, so that a presenter can loop without special cases.
 */
export function portionsOf(service: Service): ResolvedPortion[] {
  const shared: Portion = {
    number: service.number,
    product: service.product,
    operator: service.operator,
    origin: service.origin,
    destination: service.destination,
    via: service.via,
    headsign: service.headsign,
    callsBefore: service.callsBefore,
    callsAfter: service.callsAfter,
    formation: service.formation,
    status: service.status,
  };
  const portions = service.portions?.length ? service.portions : [{}];
  return portions.map((portion, index) => {
    const resolved: ResolvedPortion = { ...shared, index };
    for (const [key, value] of Object.entries(portion)) {
      if (value !== undefined) (resolved as unknown as Record<string, unknown>)[key] = value;
    }
    return resolved;
  });
}

function samePlace(a: Place, b: Place): boolean {
  if (a.id && b.id) return a.id === b.id;
  return a.name === b.name;
}

/** The distinct places a train ends up in: one, or several if it divides. */
export function destinationsOf(service: Service): Place[] {
  const out: Place[] = [];
  for (const portion of portionsOf(service)) {
    if (portion.status === 'cancelled' && service.status !== 'cancelled') continue;
    const place = portion.destination;
    if (place && !out.some((seen) => samePlace(seen, place))) out.push(place);
  }
  return out;
}

/**
 * Folds services that a source lists separately but marks as coupled into one
 * service with portions. Timetable-based feeds describe a dividing train as
 * two trips with the same time and platform; a board describes one train.
 * The first of each group lends the shared fields.
 */
export function groupCoupled(services: Service[]): Service[] {
  const out: Service[] = [];
  const groups = new Map<string, Service>();
  for (const service of services) {
    if (!service.coupling) {
      out.push(service);
      continue;
    }
    const asPortion = (s: Service): Portion[] =>
      s.portions?.length
        ? s.portions
        : [
            {
              id: s.id,
              number: s.number,
              product: s.product,
              operator: s.operator,
              origin: s.origin,
              destination: s.destination,
              via: s.via,
              headsign: s.headsign,
              callsBefore: s.callsBefore,
              callsAfter: s.callsAfter,
              formation: s.formation,
              status: s.status,
            },
          ];
    const head = groups.get(service.coupling);
    if (!head) {
      const merged: Service = { ...service, portions: asPortion(service) };
      groups.set(service.coupling, merged);
      out.push(merged);
    } else {
      head.portions = [...(head.portions ?? []), ...asPortion(service)];
      // The train as a whole is only cancelled if every part is.
      if (head.status === 'cancelled' && service.status !== 'cancelled') head.status = service.status;
    }
  }
  // A group of one was not coupled to anything after all.
  for (const merged of groups.values()) {
    if (merged.portions?.length === 1) delete merged.portions;
  }
  return out;
}

/**
 * One row per portion, each a service of its own sharing the time and the
 * platform. For boards that list every destination on its own line.
 */
export function expandPortions(service: Service): Service[] {
  if (!service.portions || service.portions.length < 2) return [service];
  return portionsOf(service).map((portion) => {
    const { index, dividesAt: _d, joinsAt: _j, position: _p, sector, id, ...fields } = portion;
    return {
      ...service,
      ...fields,
      id: `${service.id}#${id ?? index}`,
      portions: undefined,
      here: service.here ? { ...service.here, sector: sector ?? service.here.sector } : undefined,
    };
  });
}
