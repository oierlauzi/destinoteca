import { getReplica } from '../replicas/registry';
import type { ReplicaDef } from '../replicas/types';
import { getSource } from '../sources/registry';
import type { SourceStatus } from '../sources/types';
import { RAW, readConfig, type PlayerConfig } from './config';
import { loadFresh } from './fresh';
import { ReplicaSession, SourceHub, type SessionState } from './session';
import { FrameTicker, type Ticker } from './ticker';

let sharedTicker: Ticker | undefined;

/** One animation clock for every replica on the page. */
export function pageTicker(): Ticker {
  return (sharedTicker ??= new FrameTicker());
}

export interface ReplicaEvents {
  /** The replica's code has arrived and it is drawing. */
  'replica-ready': CustomEvent<void>;
  'replica-status': CustomEvent<{ status: SourceStatus; detail?: string }>;
  'replica-state': CustomEvent<SessionState>;
}

const sameSource = (a: PlayerConfig | undefined, b: PlayerConfig): boolean =>
  a !== undefined && a.source === b.source && JSON.stringify(a.sourceConfig) === JSON.stringify(b.sourceConfig);

/**
 * `<destinoteca-replica replica="…" query="…">`: one replica, configured by a
 * query string exactly like an embed URL.
 *
 * The element is the whole public surface for a page: set `query` (or call
 * `configure`) and listen to its events. It owns a hub of its own unless one
 * is handed to it before it connects, which is how several replicas share a
 * station.
 */
export class ReplicaElement extends HTMLElement {
  static readonly observedAttributes = ['replica', 'query'];

  hub: SourceHub | undefined;
  session: ReplicaSession | undefined;
  def: ReplicaDef | undefined;
  config: PlayerConfig | undefined;

  private ownsHub = false;
  private generation = 0;
  private stopHub: (() => void) | undefined;
  private readonly onVisibility = (): void => this.hub?.setVisible(!this.ownerDocument.hidden);

  connectedCallback(): void {
    void this.boot();
    this.ownerDocument.addEventListener('visibilitychange', this.onVisibility);
  }

  disconnectedCallback(): void {
    this.ownerDocument.removeEventListener('visibilitychange', this.onVisibility);
    this.teardown();
  }

  attributeChangedCallback(name: string, before: string | null, after: string | null): void {
    if (before === after || !this.isConnected) return;
    if (name === 'replica') void this.boot();
    else if (this.def) this.configure(readConfig(this.def, new URLSearchParams(after ?? '')));
  }

  /** Applies a configuration. The data source is only restarted if it, or its settings, changed. */
  configure(config: PlayerConfig): void {
    const previous = this.config;
    this.config = config;
    if (!this.session || !this.hub) return;
    this.session.update({
      options: config.options,
      placement: config.placement,
      raw: config.source === RAW ? config.frame : undefined,
    });
    if (!sameSource(previous, config)) {
      void this.hub.setSource(config.source === RAW ? undefined : getSource(config.source), config.sourceConfig);
    }
  }

  /** The frame on show as an SVG file. */
  toSVG(): string | undefined {
    return this.session?.toSVG();
  }

  private async boot(): Promise<void> {
    const generation = ++this.generation;
    this.teardown();
    const def = getReplica(this.getAttribute('replica') ?? '');
    if (!def) return;
    const impl = await loadFresh(`replica:${def.id}`, () => def.load());
    if (generation !== this.generation || !this.isConnected) return;
    this.def = def;
    this.ownsHub = !this.hub;
    this.hub ??= new SourceHub();
    const config = this.config ?? readConfig(def, new URLSearchParams(this.getAttribute('query') ?? ''));
    this.config = undefined;
    this.session = new ReplicaSession(def, impl, this, this.hub, pageTicker(), {
      options: config.options,
      placement: config.placement,
      raw: config.source === RAW ? config.frame : undefined,
    });
    this.session.onChange((state) => this.dispatchEvent(new CustomEvent('replica-state', { detail: state })));
    this.stopHub = this.hub.subscribe({
      onStatus: (status, detail) => this.dispatchEvent(new CustomEvent('replica-status', { detail: { status, detail } })),
    });
    this.configure(config);
    this.dispatchEvent(new CustomEvent('replica-ready'));
  }

  private teardown(): void {
    this.stopHub?.();
    this.stopHub = undefined;
    this.session?.destroy();
    this.session = undefined;
    if (this.ownsHub) {
      this.hub?.destroy();
      this.hub = undefined;
    }
  }
}

export const REPLICA_TAG = 'destinoteca-replica';

/** Registers the element. Safe to call from several scripts. */
export function defineReplicaElement(): void {
  if (!customElements.get(REPLICA_TAG)) customElements.define(REPLICA_TAG, ReplicaElement);
}
