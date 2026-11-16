import {
  eligible,
  StationClock,
  windowOf,
  DEFAULT_TIME_ZONE,
  type BoardSnapshot,
  type Placement,
  type Service,
  type View,
} from '../model';
import type { Values } from '../params';
import type { Frame, MountedReplica, ReplicaDef, ReplicaImpl } from '../replicas/types';
import type { Needs, SourceDef, SourceInstance, SourceModule, SourceStatus } from '../sources/types';
import type { Ticker } from './ticker';

export interface HubListener {
  onSnapshot?(snapshot: BoardSnapshot | undefined): void;
  onStatus?(status: SourceStatus, detail?: string): void;
}

/** A live source is let go this long after the page is hidden, and picked up again when it is back. */
const HIDDEN_GRACE_MS = 30_000;

/**
 * One data source and everyone looking at it. A snapshot covers a whole
 * station, so a platform sign and the concourse board of the same station
 * share one hub, one connection and one clock, and each takes its own view.
 */
export class SourceHub {
  status: SourceStatus = 'idle';
  detail: string | undefined;
  snapshot: BoardSnapshot | undefined;
  def: SourceDef | undefined;
  module: SourceModule | undefined;

  private instance: SourceInstance | undefined;
  private generation = 0;
  private running = false;
  private hiddenTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly listeners = new Set<HubListener>();
  private readonly focus = new Map<object, { ids: string[]; needs: Needs }>();

  constructor(readonly clock: StationClock = new StationClock()) {}

  subscribe(listener: HubListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Switches to a source, or to none. Whatever the previous one said is forgotten, its time included. */
  async setSource(def: SourceDef | undefined, config: Values = {}): Promise<void> {
    const generation = ++this.generation;
    this.halt();
    this.clock.release();
    this.def = def;
    this.module = undefined;
    this.instance = undefined;
    this.setSnapshot(undefined);
    if (!def) {
      this.setStatus('idle');
      return;
    }
    this.setStatus('connecting');
    let module: SourceModule;
    try {
      module = await def.load();
    } catch {
      // The usual cause is a page left open across a new release of the site:
      // the code it would fetch has been replaced. The message says so.
      if (generation === this.generation) this.setStatus('error', 'player.error.load');
      return;
    }
    if (generation !== this.generation) return;
    this.module = module;
    this.instance = module.create(config, { clock: this.clock });
    this.run();
  }

  /** What a view currently shows, so that the source can concentrate on it. */
  setFocus(owner: object, ids: string[], needs: Needs): void {
    const previous = this.focus.get(owner);
    if (previous && previous.ids.join('|') === ids.join('|')) return;
    this.focus.set(owner, { ids, needs });
    this.pushFocus();
  }

  clearFocus(owner: object): void {
    if (this.focus.delete(owner)) this.pushFocus();
  }

  /**
   * Tells the hub whether anyone can see the page. A live source costs its
   * provider a connection, so it is dropped while nobody is looking.
   */
  setVisible(visible: boolean): void {
    clearTimeout(this.hiddenTimer);
    this.hiddenTimer = undefined;
    if (visible) {
      if (!this.running && this.instance) this.run();
      return;
    }
    if (this.def?.kind !== 'live') return;
    this.hiddenTimer = setTimeout(() => {
      this.halt();
      this.setStatus('idle');
    }, HIDDEN_GRACE_MS);
  }

  destroy(): void {
    this.generation++;
    clearTimeout(this.hiddenTimer);
    this.halt();
    this.listeners.clear();
    this.focus.clear();
  }

  private run(): void {
    const instance = this.instance;
    if (!instance) return;
    const generation = this.generation;
    const current = (): boolean => generation === this.generation && instance === this.instance;
    this.running = true;
    instance.start({
      onSnapshot: (snapshot) => current() && this.setSnapshot(snapshot),
      onStatus: (status, detail) => current() && this.setStatus(status, detail),
      onTime: (now, frozen) => current() && this.clock.anchor(now, frozen),
    });
    this.pushFocus();
  }

  private halt(): void {
    if (this.running) this.instance?.stop();
    this.running = false;
  }

  private pushFocus(): void {
    if (!this.running || !this.instance?.focus) return;
    const ids: string[] = [];
    const needs: Needs = { services: 0, calls: false };
    for (const entry of this.focus.values()) {
      for (const id of entry.ids) if (!ids.includes(id)) ids.push(id);
      needs.services += entry.needs.services;
      needs.calls ||= entry.needs.calls;
    }
    this.instance.focus(ids, needs);
  }

  private setSnapshot(snapshot: BoardSnapshot | undefined): void {
    this.snapshot = snapshot;
    for (const listener of [...this.listeners]) listener.onSnapshot?.(snapshot);
  }

  private setStatus(status: SourceStatus, detail?: string): void {
    this.status = status;
    this.detail = detail;
    for (const listener of [...this.listeners]) listener.onStatus?.(status, detail);
  }
}

/** What one replica is showing, for anything that wants to show it another way (a list, a debug pane). */
export interface SessionState {
  frame: Frame;
  /** Undefined while a frame typed by hand is on show. */
  view: View | undefined;
  /** Every service the replica could show, in order; `view.services` is the part on show. */
  eligible: Service[];
}

export interface SessionSettings {
  options: Values;
  placement: Placement;
  /** A frame typed by hand. When set, the data source is ignored. */
  raw?: Frame;
}

/** How often the view is recomputed. Minutes tick over at most once a second. */
const REFRESH_MS = 500;
/** How many services beyond the ones on show a source is asked to prepare. */
const LOOKAHEAD = 3;

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * One replica on a page: its drawing, and the path from the hub's snapshot to
 * the frame it shows. It executes the replica's selection policy, steps
 * through services and pages, and hands the replica nothing but frames.
 */
export class ReplicaSession {
  state: SessionState;

  private readonly mounted: MountedReplica;
  private settings: SessionSettings;
  private readonly listeners = new Set<(state: SessionState) => void>();
  private readonly unsubscribe: (() => void)[] = [];
  private tick = 0;
  private refreshedAt = -Infinity;
  private dirty = true;
  private rotationStart: number | undefined;
  private pagesKey = '';
  private pagesStart = 0;

  constructor(
    readonly def: ReplicaDef,
    private readonly impl: ReplicaImpl,
    host: Element,
    readonly hub: SourceHub,
    ticker: Ticker,
    settings: SessionSettings,
  ) {
    this.settings = settings;
    this.mounted = impl.mount(host, settings.options, { ticker });
    this.state = { frame: {}, view: undefined, eligible: [] };
    this.unsubscribe.push(
      hub.subscribe({
        onSnapshot: () => {
          this.dirty = true;
        },
      }),
      ticker.subscribe((now) => {
        this.tick = now;
        if (this.dirty || now - this.refreshedAt >= REFRESH_MS) this.refresh();
      }),
    );
    this.refresh();
  }

  update(settings: SessionSettings): void {
    if (!same(settings.options, this.settings.options)) this.mounted.setOptions(settings.options);
    this.settings = settings;
    this.refresh();
  }

  onChange(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** The frame on show as a standalone SVG file. Whatever moves is caught at rest. */
  toSVG(): string {
    return this.impl.renderToString(this.state.frame, this.settings.options);
  }

  destroy(): void {
    for (const stop of this.unsubscribe) stop();
    this.hub.clearFocus(this);
    this.listeners.clear();
    this.mounted.destroy();
  }

  private refresh(): void {
    this.dirty = false;
    this.refreshedAt = this.tick;
    const next = this.settings.raw ? this.rawState(this.settings.raw) : this.boardState();
    const changed = !same(next.frame, this.state.frame);
    const listChanged = changed || !same(next.eligible, this.state.eligible) || !same(next.view?.services, this.state.view?.services);
    this.state = next;
    if (changed) this.mounted.setFrame(next.frame);
    if (listChanged) for (const listener of [...this.listeners]) listener(next);
  }

  private rawState(frame: Frame): SessionState {
    this.hub.clearFocus(this);
    return { frame, view: undefined, eligible: [] };
  }

  private boardState(): SessionState {
    const { options, placement } = this.settings;
    const policy = this.def.selection(options);
    const snapshot = this.hub.snapshot;
    const now = this.hub.clock.now();
    const all = snapshot ? eligible(snapshot, policy, placement, now) : [];

    // Stepping through services runs on its own clock, so that the countdown
    // ticking over does not drag the rotation along with it.
    const steps = placement.cycle && policy.window.mode !== 'top' && all.length > policy.window.size;
    if (!steps) this.rotationStart = undefined;
    else this.rotationStart ??= this.tick;
    const step = steps ? Math.floor((this.tick - this.rotationStart!) / policy.window.dwellMs) : 0;

    const { services, page } = windowOf(all, policy, placement, step);
    const view: View = {
      now,
      timeZone: snapshot?.station?.timeZone ?? DEFAULT_TIME_ZONE,
      station: snapshot?.station,
      services,
      total: all.length,
      page,
      notices: snapshot?.notices ?? [],
      placement,
    };

    // The source prepares what is on show and what comes next.
    const first = services[0] ? all.indexOf(services[0]) : 0;
    const ahead = [...all.slice(first), ...all.slice(0, first)].slice(0, policy.window.size + LOOKAHEAD);
    this.hub.setFocus(this, ahead.map((service) => service.id), this.def.needs);

    const presentation = services.length ? this.impl.present(view, options) : this.impl.blank(view, options);
    return { frame: this.pick(presentation), view, eligible: all };
  }

  /** A presentation of several pages shows them in turn, each for as long as it asks. */
  private pick(presentation: Frame | { pages: { frame: Frame; holdMs: number }[] }): Frame {
    const pages = (presentation as { pages?: { frame: Frame; holdMs: number }[] }).pages;
    if (!Array.isArray(pages)) return presentation as Frame;
    if (pages.length === 0) return {};
    const key = JSON.stringify(pages);
    if (key !== this.pagesKey) {
      this.pagesKey = key;
      this.pagesStart = this.tick;
    }
    const total = pages.reduce((sum, page) => sum + Math.max(1, page.holdMs), 0);
    let at = (this.tick - this.pagesStart) % total;
    for (const page of pages) {
      at -= Math.max(1, page.holdMs);
      if (at < 0) return page.frame;
    }
    return pages[0]!.frame;
  }
}
