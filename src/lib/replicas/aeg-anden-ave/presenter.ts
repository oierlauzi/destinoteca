import { aegLcdLarge, aegLcdSmall, layoutLine, type ProportionalFont } from '../../hardware';
import { boardTime, clockTime, destinationsOf, nameLadder, text, type Service, type View } from '../../model';
import type { AegFrame } from './def';
import { PANEL } from './geometry';

/** The word before the destination on the top line, as two of the photographs show it. */
export const LEAD = 'DESTINO ';

export function blank(view?: View): AegFrame {
  return { time: '', text: '', product: '', calls: '', extra: '', clock: stationTime(view) };
}

/** The clock beside the display reads station time, like every clock of a station. */
function stationTime(view?: View): string {
  return view ? clockTime(view.now, view.timeZone) : '';
}

/** Whether a text fits in the cells left from `from`, once laid out over them. */
export function fitsFrom(value: string, font: ProportionalFont, from: number): boolean {
  const cells = PANEL.cells - from;
  if (cells <= 0) return false;
  const wanted = Array.from(font.fold(value)).filter((char) => char !== ' ' && font.glyph(char)).length;
  return layoutLine(value, font, { ...PANEL, cells }).length >= wanted;
}

/** The cell a field starting at cell 0 leaves free, never before `least`. */
export function after(value: string, font: ProportionalFont, least: number): number {
  const placed = layoutLine(value, font, PANEL);
  const used = placed.reduce((max, p) => Math.max(max, p.cell), -1);
  return Math.max(least, used + 1);
}

/** The destinations of a train that divides, each ladder stepping down together. */
function destinationForms(service: Service): string[] {
  const places = destinationsOf(service);
  if (places.length === 0) return [];
  const ladders = places.map((place) => nameLadder(place));
  const depth = Math.max(...ladders.map((ladder) => ladder.length));
  return Array.from({ length: depth }, (_, i) => ladders.map((ladder) => ladder[Math.min(i, ladder.length - 1)] ?? '').join('/'));
}

/** Where the train calls after this station, by their everyday short names. */
export function callNames(service: Service): string[] {
  return (service.callsAfter ?? [])
    .filter((call) => !call.status)
    .map((call) => {
      const ladder = nameLadder(call.place);
      return aegLcdSmall.fold(ladder[1] ?? ladder[0] ?? '').trim();
    })
    .filter(Boolean);
}

/** The longest of several forms that fits from `from`; the shortest if none does. */
function pick(forms: string[], font: ProportionalFont, from: number): string {
  const usable = forms.filter(Boolean);
  return usable.find((form) => fitsFrom(form, font, from)) ?? usable[usable.length - 1] ?? '';
}

export function present(view: View): AegFrame {
  const service = view.services[0];
  if (!service) return blank(view);

  const at = boardTime(service, { events: 'departures', sortBy: 'scheduled' });
  const time = at === undefined ? '' : clockTime(at, view.timeZone);

  const textAt = after(time, aegLcdLarge, 1);
  const headsign = service.headsign !== undefined ? [aegLcdLarge.fold(text(service.headsign))] : undefined;
  const forms = (headsign ?? destinationForms(service)).map((form) => LEAD + form);
  const where = pick(forms, aegLcdLarge, textAt);

  const product = aegLcdSmall.fold(service.product?.shortName ?? text(service.product?.name)).trim();
  const callsAt = after(product, aegLcdSmall, 1);
  const names = service.here?.activity === 'passes' ? [] : callNames(service);
  const calls = pick(
    Array.from({ length: names.length }, (_, i) => names.slice(0, names.length - i).join(', ')),
    aegLcdSmall,
    callsAt,
  );

  return { time, text: where, product, calls, extra: '', clock: stationTime(view) };
}
