import { fitText, type ProportionalFont } from '../../hardware';
import { destinationsOf, nameLadder, text, type Service } from '../../model';

/**
 * Where a train goes, written in a proportional typeface in `room` columns:
 * the longest form of the name that fits, else a shorter one, never a name
 * cut in half when a shorter form exists.
 */
export function destinationLine(service: Service, font: ProportionalFont, room: number): string {
  if (service.here?.activity === 'passes') return fitText(['SIN PARADA'], font, room);
  if (service.headsign !== undefined) return fitText([text(service.headsign)], font, room);
  // Several destinations of a train that divides share the line; each brings its own ladder of names.
  const ladders = destinationsOf(service).map((place) => nameLadder(place));
  const forms: string[] = [];
  const depth = Math.max(0, ...ladders.map((ladder) => ladder.length));
  for (let level = 0; level < depth; level++) forms.push(ladders.map((ladder) => ladder[Math.min(level, ladder.length - 1)]).join('/'));
  // When no form of all of them fits, the first destination on its own rather than a name cut in half.
  if (ladders.length > 1) forms.push(...(ladders[0] ?? []));
  return fitText(forms, font, room);
}
