import { t } from '../../i18n';
import { memberConfig } from '../installations/layout';
import { composeSvg } from '../installations/render';
import type { ReplicaMember, ResolvedInstallation } from '../installations/types';
import { decode, defaults, encode, type Values } from '../params';
import { sourceSchema } from '../player/config';
import { defineReplicaElement, REPLICA_TAG, type ReplicaElement } from '../player/element';
import { SourceHub } from '../player/session';
import { getReplica } from '../replicas/registry';
import type { ReplicaDef } from '../replicas/types';
import { EXAMPLE_ROWS } from '../sources/manual/def';
import { getSource, sources } from '../sources/registry';
import type { SourceStatus } from '../sources/types';
import { copyText, download, el, svgToPng, uid } from './dom';
import { renderForm, type FormContext } from './form';
import { setupFullscreen } from './fullscreen';
import { servicesEditor } from './services-editor';

/**
 * An installation on its page or in an embed: one data source for the whole
 * station, shared by every display hung there, each showing it as its own
 * replica would. Each display links to its entry of the archive.
 *
 * The settings that travel in the address are only the source's: how each
 * display looks is fixed by the installation, as it was on the wall.
 */
interface Mounted {
  hub: SourceHub;
  elements: Map<string, ReplicaElement>;
  setSource(source: string, config: Values): void;
  toSVG(): string;
}

const editors: FormContext['editors'] = { services: servicesEditor };

/** The display whose settings the source follows: the first board. */
function leadOf(installation: ResolvedInstallation): ReplicaDef | undefined {
  for (const member of installation.members) {
    const def = member.kind === 'replica' ? getReplica(member.replica) : undefined;
    if (def?.accepts === 'board') return def;
  }
  return undefined;
}

/** Brings the displays of an installation to life on one shared hub. */
function mountDisplays(root: HTMLElement, installation: ResolvedInstallation, title: string): Mounted {
  defineReplicaElement();
  const hub = new SourceHub();
  const elements = new Map<string, ReplicaElement>();
  const members = installation.members.filter((member): member is ReplicaMember => member.kind === 'replica');
  let source = 'demo';
  let sourceConfig: Values = {};

  for (const member of members) {
    const def = getReplica(member.replica);
    const slot = root.querySelector<HTMLElement>(`[data-member="${member.id}"]`);
    if (!def || !slot) continue;
    const element = document.createElement(REPLICA_TAG) as ReplicaElement;
    element.setAttribute('replica', def.id);
    // Handed the hub before it connects, the display leaves the source to us.
    element.hub = hub;
    element.configure(memberConfig(def, member, source, sourceConfig));
    // The still picture stays until the display's code arrives.
    element.innerHTML = slot.innerHTML;
    slot.replaceChildren(element);
    elements.set(member.id, element);
  }
  document.addEventListener('visibilitychange', () => hub.setVisible(!document.hidden));

  return {
    hub,
    elements,
    setSource(next: string, config: Values): void {
      source = next;
      sourceConfig = config;
      for (const member of members) {
        const def = getReplica(member.replica);
        const element = elements.get(member.id);
        if (def && element) element.configure(memberConfig(def, member, source, sourceConfig));
      }
      void hub.setSource(getSource(source), sourceConfig);
    },
    toSVG(): string {
      const drawn = new Map<string, string>();
      for (const [id, element] of elements) {
        const svg = element.toSVG();
        if (svg) drawn.set(id, svg);
      }
      return composeSvg(installation, drawn, title);
    },
  };
}

function readSource(lead: ReplicaDef | undefined, query: URLSearchParams): { source: string; config: Values } {
  const asked = query.get('source');
  const id = asked && getSource(asked) ? asked : 'demo';
  const def = getSource(id)!;
  return { source: id, config: lead ? decode(sourceSchema(lead, def), query) : decode(def.config, query) };
}

function writeSource(lead: ReplicaDef | undefined, source: string, config: Values): URLSearchParams {
  const query = new URLSearchParams({ source });
  const def = getSource(source);
  if (def) encode(lead ? sourceSchema(lead, def) : def.config, config, query);
  return query;
}

/** An installation alone, as in an embed: its source from the address. */
export function mountInstallationEmbed(root: HTMLElement): void {
  const installation = JSON.parse(root.dataset.installation ?? '{}') as ResolvedInstallation;
  const mounted = mountDisplays(root, installation, root.dataset.title ?? '');
  const { source, config } = readSource(leadOf(installation), new URLSearchParams(location.search));
  mounted.setSource(source, config);
}

/** An installation with its controls: where the data comes from, and the ways of taking it elsewhere. */
export function mountInstallation(root: HTMLElement): void {
  const installation = JSON.parse(root.dataset.installation ?? '{}') as ResolvedInstallation;
  const stage = root.querySelector<HTMLElement>('.stage');
  const ui = root.querySelector<HTMLElement>('.playground-ui');
  if (!stage || !ui) return;
  const title = root.dataset.title ?? '';
  const lead = leadOf(installation);
  const mounted = mountDisplays(root, installation, title);
  const query = new URLSearchParams(location.search);
  let { source, config } = readSource(lead, query);
  const remembered = new Map<string, Values>([[source, config]]);
  let touched = false;

  const schemaOf = (id: string) => {
    const def = getSource(id)!;
    return lead ? sourceSchema(lead, def) : def.config;
  };
  const embedUrl = (): string => {
    const url = new URL(root.dataset.embed ?? '', location.href);
    url.search = writeSource(lead, source, config).toString();
    return url.toString();
  };
  const embedCode = (): string =>
    `<iframe src="${embedUrl().replace(/&/g, '&amp;')}" title="${title.replace(/"/g, '&quot;')}" width="1200" height="${Math.round((1200 * installation.height) / installation.width)}" style="border:0;max-width:100%;height:auto;aspect-ratio:${installation.width}/${installation.height}" allow="fullscreen" loading="lazy"></iframe>`;

  // --- Toolbar ---------------------------------------------------------------
  const embedText = el('textarea', { attrs: { readonly: true, rows: 4, 'aria-label': t('player.embed.label') } });
  const copied = el('span', { class: 'copied', attrs: { role: 'status' } });
  const flash = (ok: boolean): void => {
    copied.textContent = t(ok ? 'player.copied' : 'player.selected');
    setTimeout(() => (copied.textContent = ''), 2500);
  };
  const embedBox = el('div', { class: 'embed-box', attrs: { hidden: true } }, [
    el('p', { class: 'muted', text: t('player.embed.help') }),
    embedText,
    el('button', { class: 'button', text: t('player.copy'), attrs: { type: 'button' }, on: { click: async () => flash(await copyText(embedText.value, embedText)) } }),
  ]);
  const embedButton = el('button', {
    class: 'button', text: t('player.embed.show'), attrs: { type: 'button', 'aria-expanded': 'false' },
    on: {
      click: () => {
        embedBox.hidden = !embedBox.hidden;
        embedButton.setAttribute('aria-expanded', String(!embedBox.hidden));
        embedButton.textContent = t(embedBox.hidden ? 'player.embed.show' : 'player.embed.hide');
      },
    },
  });
  const fullscreenButton = el('button', { class: 'button', text: t('player.fullscreen.enter'), attrs: { type: 'button' } });
  const fullscreen = setupFullscreen(stage, (active) => {
    fullscreenButton.textContent = t(active ? 'player.fullscreen.exit' : 'player.fullscreen.enter');
  });
  fullscreenButton.addEventListener('click', () => fullscreen.toggle());
  const toolbar = el('div', { class: 'toolbar' }, [
    el('button', {
      class: 'button', text: t('player.download'), attrs: { type: 'button' },
      on: { click: () => download(`${root.dataset.id ?? 'composicion'}.svg`, mounted.toSVG(), 'image/svg+xml') },
    }),
    el('button', {
      class: 'button', text: t('player.downloadPng'), attrs: { type: 'button' },
      on: { click: async () => download(`${root.dataset.id ?? 'composicion'}.png`, await svgToPng(mounted.toSVG()), 'image/png') },
    }),
    embedButton,
    fullscreenButton,
    el('button', {
      class: 'button', text: t('player.link'), attrs: { type: 'button' },
      on: {
        click: async () => {
          const url = new URL(location.href);
          url.search = writeSource(lead, source, config).toString();
          flash(await copyText(url.toString()));
        },
      },
    }),
    copied,
  ]);

  const apply = (fromVisitor = true): void => {
    remembered.set(source, config);
    mounted.setSource(source, config);
    embedText.value = embedCode();
    if (fromVisitor) touched = true;
    if (touched) history.replaceState(null, '', `${location.pathname}?${writeSource(lead, source, config)}${location.hash}`);
  };

  // --- Data: one tab per source ------------------------------------------------
  const tabIds = sources.map((s) => s.id);
  const tablist = el('div', { class: 'tabs', attrs: { role: 'tablist', 'aria-label': t('player.tabs') } });
  const panel = el('div', { class: 'tabpanel', attrs: { role: 'tabpanel', id: uid('panel'), tabindex: 0 } });
  const statusText = el('span');
  const status = el('p', { class: 'status', attrs: { role: 'status', 'data-state': 'idle' } }, [el('span', { class: 'status-dot', attrs: { 'aria-hidden': 'true' } }), statusText]);
  const tabs = new Map<string, HTMLButtonElement>();
  mounted.hub.subscribe({
    onStatus: (state: SourceStatus, detail?: string) => {
      status.dataset.state = state;
      statusText.textContent = detail ? `${t(`player.status.${state}`)}: ${t(detail)}` : t(`player.status.${state}`);
    },
  });

  let drawing = 0;
  const drawPanel = async (): Promise<void> => {
    const turn = ++drawing;
    for (const [id, tab] of tabs) {
      tab.setAttribute('aria-selected', String(id === source));
      tab.tabIndex = id === source ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', tabs.get(source)?.id ?? '');
    const def = getSource(source);
    if (!def) return;
    panel.replaceChildren(el('p', { class: 'muted', text: t('player.loading') }));
    const module = await def.load().catch(() => undefined);
    if (turn !== drawing) return;
    const form = renderForm(schemaOf(source), config, (next) => {
      config = next;
      apply();
    }, { lookups: module?.lookups, editors });
    const credit = el('p', { class: 'credit muted' });
    // Our own dictionary text, with links: the one place markup is set, and never from data.
    if (def.id === 'mitren') credit.innerHTML = t('mitren.credit');
    const parts = [status, def.description ? el('p', { class: 'muted', text: t(def.description) }) : null, form.element, def.id === 'mitren' ? credit : null];
    panel.replaceChildren(...parts.filter((part): part is HTMLElement => part !== null));
  };

  const select = (id: string): void => {
    if (id === source) return;
    let next = remembered.get(id) ?? defaults(schemaOf(id));
    if (id === 'manual' && !remembered.has(id)) next = { ...next, services: EXAMPLE_ROWS };
    if (id === 'demo') next = { ...next, station: remembered.get('mitren')?.station ?? next.station ?? '' };
    source = id;
    config = next;
    apply();
    void drawPanel();
  };

  for (const id of tabIds) {
    const def = getSource(id);
    const tab = el('button', {
      text: t(def?.label ?? id),
      attrs: { type: 'button', role: 'tab', id: uid('tab'), 'aria-controls': panel.id },
      on: {
        click: () => select(id),
        keydown: (event) => {
          const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
          if (!step) return;
          const next = tabIds[(tabIds.indexOf(id) + step + tabIds.length) % tabIds.length]!;
          select(next);
          tabs.get(next)?.focus();
        },
      },
    });
    tabs.set(id, tab);
    tablist.append(tab);
  }

  // Folded away, as on a replica's page, so that the entry is not buried under settings.
  const data = el('details', { class: 'appearance data' }, [el('summary', { text: t('player.tabs') }), tablist, panel]);
  ui.replaceChildren(toolbar, embedBox, data);
  apply(false);
  void drawPanel();
}

/** Brings every installation on the page to life. */
export function mountInstallations(): void {
  document.querySelectorAll<HTMLElement>('.installation-player').forEach(mountInstallation);
}
