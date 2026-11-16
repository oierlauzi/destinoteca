import { t } from '../../i18n';
import {
  bestTime, boardTime, clockTime, delayMinutes, destinationsOf, minutesUntil, nameLadder, portionsOf, text,
  type Service,
} from '../model';
import type { SessionState } from '../player/session';
import type { ReplicaDef } from '../replicas/types';
import { el } from './dom';

/**
 * The board behind a replica, in plain words: every service it could show,
 * with what the source knows about each, and a mark on the ones on show. It
 * makes visible what a small sign leaves out, and what a source did not say.
 */
export function renderDepartures(list: HTMLElement, state: SessionState, def: ReplicaDef, options: Record<string, unknown>): void {
  list.replaceChildren();
  const view = state.view;
  if (!view) return;
  if (state.eligible.length === 0) {
    list.append(el('li', { class: 'dep-empty', text: t('player.list.empty') }));
    return;
  }
  const policy = def.selection(options);
  const shown = new Set(view.services.map((service) => service.id));
  for (const service of state.eligible) list.append(row(service, shown.has(service.id), view.now, view.timeZone, policy));
}

function row(service: Service, onShow: boolean, now: number, timeZone: string, policy: ReturnType<ReplicaDef['selection']>): HTMLElement {
  const item = el('li', { class: onShow ? 'dep is-shown' : 'dep', attrs: { 'aria-current': onShow ? 'true' : undefined } });

  const line = service.line;
  item.append(
    line
      ? el('span', { class: 'dep-line', text: line.name, attrs: { style: lineStyle(line.color, line.textColor) } })
      : el('span', { class: 'dep-line is-none', attrs: { 'aria-hidden': 'true' } }),
  );

  const at = boardTime(service, policy);
  const event = service.here?.departure ?? service.here?.arrival;
  const live = event?.estimated !== undefined || event?.actual !== undefined;
  item.append(
    el('span', { class: 'dep-time' }, [
      at === undefined ? '' : clockTime(at, timeZone),
      at === undefined ? null : el('span', { class: live ? 'dep-rt is-live' : 'dep-rt', attrs: { title: t(live ? 'player.list.live' : 'player.list.timetable') } }),
    ]),
  );

  const body = el('span', { class: 'dep-body' });
  const names = destinationsOf(service).map((place) => place.name);
  const headline = service.headsign !== undefined ? text(service.headsign) : names.join(' / ');
  body.append(el('strong', { class: 'dep-dest', text: headline || '—' }));

  const facts: string[] = [];
  if (service.product) facts.push(text(service.product.name));
  if (service.number) facts.push(service.number);
  if (service.operator) facts.push(service.operator.name);
  if (service.origin) facts.push(t('player.list.from', { place: service.origin.name }));
  if (facts.length) body.append(el('small', { class: 'dep-facts', text: facts.join(' · ') }));

  const flags: string[] = [];
  const delay = delayMinutes(event);
  if (delay) flags.push(t(delay > 0 ? 'player.list.late' : 'player.list.early', { n: Math.abs(delay) }));
  if (service.status === 'cancelled') flags.push(t('player.list.cancelled'));
  if (service.here?.activity === 'passes') flags.push(t('player.list.passes'));
  if (service.here?.activity === 'terminus') flags.push(t('player.list.terminus'));
  if (service.presence === 'at-stop') flags.push(t('player.list.atPlatform'));
  if (service.presence === 'approaching') flags.push(t('player.list.approaching'));
  for (const remark of service.remarks ?? []) flags.push(text(remark));
  if (flags.length) body.append(el('small', { class: 'dep-flags', text: flags.join(' · ') }));

  for (const portion of portionsOf(service)) {
    const stops = (portion.callsAfter ?? []).filter((call) => !call.status).map((call) => nameLadder(call.place)[1] ?? call.place.name);
    if (stops.length === 0) continue;
    const prefix = (service.portions?.length ?? 0) > 1 && portion.destination ? `${portion.destination.name}: ` : '';
    body.append(el('small', { class: 'dep-stops', text: `${prefix}${t('player.list.callingAt')} ${stops.join(', ')}` }));
  }
  item.append(body);

  const platform = service.here?.platform;
  const unconfirmed = platform?.confirmed === false;
  const platformName = unconfirmed ? (platform?.candidates?.join('/') ?? platform?.name) : platform?.name;
  item.append(
    el('span', {
      class: unconfirmed ? 'dep-platform is-guess' : 'dep-platform',
      text: platformName ? `${t('player.list.platform')} ${platformName}` : '',
      attrs: { title: unconfirmed && platformName ? t('player.list.platformGuess') : undefined },
    }),
  );

  const best = bestTime(event);
  item.append(el('span', { class: 'dep-min', text: best === undefined ? '' : t('player.list.minutes', { n: minutesUntil(best, now) }) }));
  return item;
}

/** Line colours come from data feeds, so only plain hex colours are let through to a style attribute. */
function lineStyle(background: string | undefined, foreground: string | undefined): string | undefined {
  const hex = (value: string | undefined): string | undefined => {
    const clean = value?.trim().replace(/^#?/, '#');
    return clean && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean) ? clean : undefined;
  };
  const bg = hex(background);
  if (!bg) return undefined;
  return `background:${bg};color:${hex(foreground) ?? contrast(bg)}`;
}

function contrast(hex: string): string {
  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16));
  return (r! * 299 + g! * 587 + b! * 114) / 1000 > 150 ? '#000000' : '#ffffff';
}
