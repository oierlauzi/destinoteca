import type { Place, Platform, Text } from './types';

/** Reads a Text in the wanted language, falling back to Spanish, then to whatever there is. */
export function text(value: Text | undefined, lang = 'es'): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value['es'] ?? Object.values(value)[0] ?? '';
}

/** Lower case without accents, for matching names typed by people. */
export function foldForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** A place's names, longest first, without repeats. */
export function nameLadder(place: Place, lang?: string): string[] {
  const local = lang ? place.localized?.[lang] : undefined;
  const forms = [local?.name ?? place.name, ...(local?.names ?? place.names ?? [])];
  const seen = new Set<string>();
  return forms.filter((form) => {
    if (!form || seen.has(form)) return false;
    seen.add(form);
    return true;
  });
}

export type Fold = (value: string) => string;

const identity: Fold = (value) => value;

/** A cut can leave a hyphen or a space dangling at the end; neither says anything. */
function trimCut(value: string): string {
  return value.replace(/[\s\-/]+$/, '');
}

/**
 * A place name for a display `width` characters wide: the longest of its own
 * forms that fits, and only if none does, the shortest one cut short.
 * `fold` is the display's own idea of legal text (upper case, no accents...),
 * applied before measuring.
 */
export function fitName(place: Place, width: number, fold: Fold = identity, lang?: string): string {
  const ladder = nameLadder(place, lang).map(fold);
  if (ladder.length === 0 || width <= 0) return '';
  const fitting = ladder.find((form) => form.length <= width);
  if (fitting !== undefined) return fitting;
  return trimCut((ladder[ladder.length - 1] ?? '').slice(0, width));
}

/**
 * Several names in one field, as for a train that divides: "VIGO/CORUÑA".
 * Every name steps down its own ladder until the whole fits; if even the
 * shortest forms do not, they share the width evenly.
 */
export function fitNames(
  places: Place[],
  width: number,
  separator = '/',
  fold: Fold = identity,
  lang?: string,
): string {
  if (places.length === 0) return '';
  if (places.length === 1) return fitName(places[0]!, width, fold, lang);
  const ladders = places.map((place) => nameLadder(place, lang).map(fold));
  const level = ladders.map(() => 0);
  const current = () => ladders.map((ladder, i) => ladder[level[i]!] ?? '');
  const total = () => current().join(separator).length;
  // Shorten the longest name that still can be shortened, one step at a time.
  while (total() > width) {
    let pick = -1;
    current().forEach((form, i) => {
      if (level[i]! < ladders[i]!.length - 1 && (pick < 0 || form.length > current()[pick]!.length)) pick = i;
    });
    if (pick < 0) break;
    level[pick]!++;
  }
  if (total() <= width) return current().join(separator);
  const room = width - separator.length * (places.length - 1);
  const each = Math.max(1, Math.floor(room / places.length));
  return current()
    .map((form) => trimCut(form.slice(0, each)))
    .join(separator)
    .slice(0, width);
}

/** A platform may arrive as "4", "04" or "PLATF.(4)"; a sign shows the number. */
export function platformDigits(name: string | undefined | null): string | undefined {
  if (name == null) return undefined;
  const match = String(name).match(/\d+/);
  return match ? String(Number(match[0])) : undefined;
}

/** The platform a real sign would show: only once it is confirmed. */
export function confirmedPlatform(platform: Platform | undefined): string | undefined {
  if (!platform?.name || platform.confirmed === false) return undefined;
  return platform.name;
}

/** Loose comparison of platform names, by number when both have one. */
export function samePlatform(a: string | undefined, b: string | undefined): boolean {
  if (a === undefined || b === undefined) return false;
  const da = platformDigits(a);
  const db = platformDigits(b);
  if (da !== undefined && db !== undefined) return da === db;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
