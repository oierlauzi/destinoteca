import { t } from '../../i18n';
import type { Values } from '../params';
import { defaultConfig, placementSchema, RAW, readConfig, replicaSize, sourceSchema, writeConfig, type PlayerConfig } from '../player/config';
import { defineReplicaElement, REPLICA_TAG, type ReplicaElement } from '../player/element';
import type { SessionState } from '../player/session';
import { getReplica } from '../replicas/registry';
import type { ReplicaDef } from '../replicas/types';
import { EXAMPLE_ROWS } from '../sources/manual/def';
import { getSource, sourcesFor } from '../sources/registry';
import type { SourceStatus } from '../sources/types';
import { renderDepartures } from './departures';
import { copyText, download, el, svgToPng, uid } from './dom';
import { renderForm, type FormContext } from './form';
import { setupFullscreen } from './fullscreen';
import { drumEditor } from './drum-editor';
import { servicesEditor } from './services-editor';

/**
 * The controls around a replica on a catalog page: where its data comes from,
 * how it looks, and the ways of taking it elsewhere (embed code, SVG, link).
 *
 * Nothing here knows any particular replica or source. Tabs come from the
 * source registry, forms from schemas, and everything the visitor sets is one
 * PlayerConfig, which is also exactly what an embed URL carries.
 */
const editors: FormContext['editors'] = { services: servicesEditor, drum: drumEditor };

function initialConfig(def: ReplicaDef, root: HTMLElement): PlayerConfig {
  // A link carrying settings wins; then whatever the catalog entry asks for; then the simulation.
  let query = new URLSearchParams(location.search);
  if (![...query.keys()].length) {
    query = new URLSearchParams();
    try {
      for (const [key, value] of Object.entries(JSON.parse(root.dataset.params || '{}') as Values)) query.set(key, String(value));
    } catch {
      // A malformed preset is the same as none.
    }
    // With nothing asked for, the data it starts on: the simulation for a
    // board, the device's clock for a sign that only tells the time.
    const first = sourcesFor(def.reads)[0];
    if (![...query.keys()].length && first) query.set('source', first.id);
  }
  const config = readConfig(def, query);
  // Which dots and cells fail is drawn afresh for each visit, unless the link says which.
  // The seed then travels in the embed code and the permalink like any other setting.
  for (const field of def.options.fields) {
    if (field.type === 'number' && field.shuffle && !query.has(field.urlKey ?? field.key)) {
      config.options[field.key] = Math.floor(Math.random() * 1e9);
    }
  }
  return config;
}

export function mountPlayground(root: HTMLElement): void {
  const def = getReplica(root.dataset.replica ?? '');
  const replica = root.querySelector<ReplicaElement>(REPLICA_TAG);
  const ui = root.querySelector<HTMLElement>('.playground-ui');
  const stage = root.querySelector<HTMLElement>('.stage');
  if (!def || !replica || !ui || !stage) return;

  let config = initialConfig(def, root);
  {
    const size = replicaSize(def, config.options);
    stage.style.setProperty('--ratio', String(size.width / size.height));
  }
  // What was set under each tab is kept while the visitor tries another.
  const remembered = new Map<string, Values>([[config.source, config.sourceConfig]]);
  // The demo draws a board per station: the one last picked on a live source.
  const rememberedStation = (): string => String(remembered.get('mitren')?.station ?? remembered.get('adif')?.station ?? '');
  let touched = false;

  const embedUrl = (): string => {
    const url = new URL(root.dataset.embed ?? '', location.href);
    url.search = writeConfig(def, config).toString();
    return url.toString();
  };
  const embedCode = (): string => {
    const { width, height } = replicaSize(def, config.options);
    const title = root.dataset.title ?? '';
    return `<iframe src="${embedUrl().replace(/&/g, '&amp;')}" title="${title.replace(/"/g, '&quot;')}" width="1200" height="${Math.round((1200 * height) / width)}" style="border:0;max-width:100%;height:auto;aspect-ratio:${width}/${height}" allow="fullscreen" loading="lazy"></iframe>`;
  };

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
      on: {
        click: () => {
          const svg = replica.toSVG();
          if (svg) download(`${def.id}.svg`, svg, 'image/svg+xml');
        },
      },
    }),
    el('button', {
      class: 'button', text: t('player.downloadPng'), attrs: { type: 'button' },
      on: {
        click: async () => {
          const svg = replica.toSVG();
          if (svg) download(`${def.id}.png`, await svgToPng(svg), 'image/png');
        },
      },
    }),
    embedButton,
    fullscreenButton,
    el('button', {
      class: 'button', text: t('player.link'), attrs: { type: 'button' },
      on: {
        click: async () => {
          const url = new URL(location.href);
          url.search = writeConfig(def, config).toString();
          flash(await copyText(url.toString()));
        },
      },
    }),
    copied,
  ]);

  // --- Applying a configuration ---------------------------------------------
  const apply = (next: PlayerConfig, fromVisitor = true): void => {
    config = next;
    remembered.set(config.source, config.sourceConfig);
    replica.configure(config);
    // A display whose shape follows its settings (boards hung together) resizes its stage.
    const size = replicaSize(def, config.options);
    stage.style.setProperty('--ratio', String(size.width / size.height));
    embedText.value = embedCode();
    if (fromVisitor) touched = true;
    // The address bar follows the settings once the visitor has changed one,
    // so that the page can be bookmarked or sent as it stands.
    if (touched) history.replaceState(null, '', `${location.pathname}?${writeConfig(def, config)}${location.hash}`);
  };

  // --- Data: tabs, one per source, plus hand-typed text -----------------------
  // One tab per source that knows something this display can show, and one
  // for a frame typed by hand where that is how the sign was driven.
  const tabIds = [...sourcesFor(def.reads).map((source) => source.id), ...(def.frame ? [RAW] : [])];
  // A display that announces no trains has no list of them either.
  const listsServices = def.reads.includes('services');
  const tablist = el('div', { class: 'tabs', attrs: { role: 'tablist', 'aria-label': t('player.tabs') } });
  const panel = el('div', { class: 'tabpanel', attrs: { role: 'tabpanel', id: uid('panel'), tabindex: 0 } });
  const statusText = el('span');
  const status = el('p', { class: 'status', attrs: { role: 'status', 'data-state': 'idle' } }, [el('span', { class: 'status-dot', attrs: { 'aria-hidden': 'true' } }), statusText]);
  const list = el('ol', { class: 'departures', attrs: { 'aria-label': t('player.list.label') } });
  const tabs = new Map<string, HTMLButtonElement>();

  const showStatus = (state: SourceStatus, detail?: string): void => {
    status.dataset.state = state;
    statusText.textContent = detail ? `${t(`player.status.${state}`)}: ${t(detail)}` : t(`player.status.${state}`);
  };
  const drawList = (state: SessionState | undefined): void => {
    if (state && listsServices) renderDepartures(list, state, def, config.options);
  };

  let drawing = 0;
  const drawPanel = async (): Promise<void> => {
    const turn = ++drawing;
    for (const [id, tab] of tabs) {
      tab.setAttribute('aria-selected', String(id === config.source));
      tab.tabIndex = id === config.source ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', tabs.get(config.source)?.id ?? '');

    if (config.source === RAW) {
      const form = renderForm(def.frame!, config.frame, (frame) => apply({ ...config, frame }));
      panel.replaceChildren(el('p', { class: 'muted', text: t('player.raw.description') }), form.element);
      return;
    }
    const source = getSource(config.source);
    if (!source) return;
    panel.replaceChildren(el('p', { class: 'muted', text: t('player.loading') }));
    // The source's code brings the searches its settings need (stations, for one).
    const module = await source.load().catch(() => undefined);
    if (turn !== drawing) return;

    const sourceForm = renderForm(sourceSchema(def, source), config.sourceConfig, (sourceConfig) => apply({ ...config, sourceConfig }), { lookups: module?.lookups, editors });
    const policy = def.selection(config.options);
    const placement = {
      fields: placementSchema.fields.filter((field) => {
        if (field.key === 'platforms') return policy.platforms === 'one';
        return policy.window.mode !== 'top';
      }),
    };
    const placementForm = renderForm(
      placement,
      { platforms: config.placement.platforms.join(','), cycle: config.placement.cycle },
      (values) => apply({ ...config, placement: readConfig(def, new URLSearchParams({ source: config.source, via: String(values.platforms ?? ''), cycle: values.cycle === false ? '0' : '1' })).placement }),
    );
    const credit = el('p', { class: 'credit muted' });
    // Our own dictionary text, with links: the one place markup is set, and never from data.
    if (source.credit) credit.innerHTML = t(source.credit);
    const parts = [
      status,
      source.description ? el('p', { class: 'muted', text: t(source.description) }) : null,
      sourceForm.element,
      placement.fields.length ? el('fieldset', {}, [el('legend', { text: t('player.placement') }), placementForm.element]) : null,
      listsServices ? el('h3', { class: 'list-title', text: t('player.list.label') }) : null,
      listsServices ? list : null,
      listsServices ? el('p', { class: 'muted list-key', text: t('player.list.key') }) : null,
      source.credit ? credit : null,
    ];
    panel.replaceChildren(...parts.filter((part): part is HTMLElement => part !== null));
    drawList(replica.session?.state);
  };

  const select = (id: string): void => {
    if (id === config.source) return;
    const next = defaultConfig(def, id);
    let sourceConfig = remembered.get(id) ?? next.sourceConfig;
    // An empty manual board teaches nothing: start from a few trains to edit,
    // where the display has somewhere to show them.
    if (id === 'manual' && listsServices && !remembered.has(id)) sourceConfig = { ...sourceConfig, services: EXAMPLE_ROWS };
    // The demo draws a board per station, so it follows the station picked for the live source.
    if (id === 'demo') sourceConfig = { ...sourceConfig, station: rememberedStation() };
    showStatus('idle');
    list.replaceChildren();
    apply({ ...config, source: id, sourceConfig });
    void drawPanel();
  };

  for (const id of tabIds) {
    const source = getSource(id);
    const tab = el('button', {
      text: id === RAW ? t('player.tab.raw') : t(source?.label ?? id),
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

  // --- Appearance ---------------------------------------------------------------
  const optionsForm = renderForm(def.options, config.options, (options) => apply({ ...config, options }), { editors });
  const appearance = el('details', { class: 'appearance' }, [el('summary', { text: t('player.appearance') }), optionsForm.element]);

  // --- Data -----------------------------------------------------------------------
  // Folded away like the appearance, so that what the page says about the sign
  // is not buried under settings. The replica runs all the same.
  const data = el('details', { class: 'appearance data' }, [el('summary', { text: t('player.tabs') }), ...(tabIds.length > 1 ? [tablist] : []), panel]);

  // Appearance first, straight under the sign it changes; then where the data comes from.
  ui.replaceChildren(toolbar, embedBox, appearance, ...(tabIds.length ? [data] : []));

  replica.addEventListener('replica-status', (event) => {
    const { status: state, detail } = (event as CustomEvent<{ status: SourceStatus; detail?: string }>).detail;
    showStatus(state, detail);
  });
  replica.addEventListener('replica-state', (event) => drawList((event as CustomEvent<SessionState>).detail));
  // Minutes in the list run down even when the replica has nothing new to draw.
  setInterval(() => drawList(replica.session?.state), 5000);

  apply(config, false);
  void drawPanel();
}

/** Brings every playground on the page to life. */
export function mountPlaygrounds(): void {
  defineReplicaElement();
  document.querySelectorAll<HTMLElement>('.playground').forEach(mountPlayground);
}
