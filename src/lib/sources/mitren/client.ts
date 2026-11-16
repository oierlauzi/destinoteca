/**
 * A live board from ¿Dónde está mi tren? (mitren.app), over its WebSocket.
 *
 * https://github.com/jotaelediaz/dondeestamitren blends Renfe's GTFS timetable
 * with the GTFS-RT feeds server-side, so it already does the work a static
 * page cannot: naming the destination, which the real-time feeds never do.
 *
 * Its REST API sends no Access-Control-Allow-Origin header, so a page on
 * GitHub Pages cannot fetch() it. Its WebSocket can be used: browsers do not
 * apply CORS to the WebSocket handshake, and the server does not check Origin.
 *
 * Protocol, from app/routers/trains_api.py upstream. Plain JSON frames:
 *   wss://mitren.app/api/ws/trains/<nucleus>?listing=0
 *   <-  {"type":"subscribed","nucleus":…,"station_id":null,…}   on connect
 *   ->  {"type":"subscriptions","station_ids":["17000"],"train_ids":[…]}
 *   <-  {"type":"subscriptions",…}                              the accepted set
 *   <-  {"type":"arrivals_update","station_id":"17000","arrivals":[…]}
 *       at once, then again on every poll cycle of the server
 *   <-  {"type":"train_update","train_id":…,"data":{"stops":[…],…}}
 *   <-  {"type":"train_removed","train_id":…}     not running (yet, or any more)
 *   ->  {"type":"ping"}   <-  {"type":"pong","server_epoch":…}
 *   <-  {"type":"error","message":…}
 * listing=0 opts out of the nucleus-wide train positions, by far the heaviest
 * message and one a departure board has no use for.
 *
 * The server drops a client that sends nothing for 150 s, and is a small VPS
 * with a cap of 200 sockets overall and 20 per address. So: one socket per
 * session, one station, a ping well inside the idle window, and a patient
 * reconnect.
 */
import type { BoardSnapshot, Call, Place, Service } from '../../model';
import type { Needs, SourceEnv, SourceHandlers, SourceInstance } from '../types';
import { mapArrivals, mitrenExt, remainingStops, type MitrenArrivals, type MitrenTrain } from './map';
import { DEFAULT_NETWORK, findStation, networkForCode, stationPlace, TIME_ZONE, type Station } from './stations';

export const MITREN_WS = 'wss://mitren.app/api/ws/trains/';
export const PING_MS = 60000;
/**
 * Not a health check: the first board is pushed on subscribe, but an unknown
 * station code is ignored silently, so this is what tells the two apart.
 */
export const DATA_TIMEOUT_MS = 30000;
/**
 * How many trains the server lets one socket follow, unless it says otherwise
 * in its first `subscribed`.
 */
export const DEFAULT_MAX_TRAINS = 4;
/** The least time between two changes of the followed set, well inside the server's 30 a minute. */
export const SUBSCRIBE_GAP_MS = 3000;
/** How long the followed set is left alone after the server refuses a change. */
export const REFUSAL_HOLD_MS = 20000;

export const ATTRIBUTION = {
  name: '¿Dónde está mi tren? (mitren.app)',
  url: 'https://mitren.app/',
  license: 'Apache-2.0',
} as const;

/** The little of a WebSocket this needs, so that a test can stand in for one. */
export interface SocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number): void;
  addEventListener(type: 'open' | 'message' | 'close' | 'error', listener: (event: any) => void): void;
}

export type SocketFactory = new (url: string) => SocketLike;

export interface MitrenConfig {
  /** Renfe's station code, e.g. `17000`. */
  station: string;
  /** mitren.app's network slug. Looked up from the code when missing. */
  network?: string;
  /** Another server speaking the same protocol. */
  url?: string;
}

export interface MitrenDeps {
  /** Defaults to the global WebSocket, read when connecting. */
  WebSocket?: SocketFactory;
  /** For the reconnect jitter. */
  random?: () => number;
}

/** What became of a followed train: asked, answered with stops, not on its list, not running, or nothing left. */
export type TrainState = 'waiting' | 'stops' | 'nomatch' | 'removed' | 'empty';

const OPEN = 1;

export class MitrenSession implements SourceInstance {
  readonly station: string;
  readonly network: string;
  readonly url: string;
  private readonly here: Station | undefined;
  private readonly place: Place | undefined;

  private handlers: SourceHandlers | undefined;
  private socket: SocketLike | undefined;
  private pinger: ReturnType<typeof setInterval> | undefined;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private dataTimer: ReturnType<typeof setTimeout> | undefined;
  private gapTimer: ReturnType<typeof setTimeout> | undefined;
  private holdTimer: ReturnType<typeof setTimeout> | undefined;
  private attempts = 0;
  private stopped = true;

  // Calling points. The board names no stops, but each train's own channel
  // does, so the session follows the few trains on show (see focus()) and
  // lays their remaining calls onto the board's services.
  private maxTrains = DEFAULT_MAX_TRAINS;
  /** Service ids on show, soonest first, as last told by focus(). */
  private focused: string[] = [];
  private wantCalls = false;
  /** Train channels wanted, derived from `focused` and the current board. */
  private wanted: string[] = [];
  /** The set last sent, as a key. Null forces the next send. */
  private followed: string | null = '';
  private gapOpen = true;
  private holding = false;
  private sendSubscriptions: ((ids: string[]) => void) | undefined;
  private readonly callsByTrain = new Map<string, Call[]>();
  private readonly trainState = new Map<string, TrainState>();
  private lastIssue: string | undefined;
  /** The last mapped board, before calls are laid on. */
  private board: Service[] | undefined;

  constructor(
    config: MitrenConfig,
    private readonly env: SourceEnv,
    private readonly deps: MitrenDeps = {},
  ) {
    this.station = String(config.station ?? '').trim();
    // An old embed names a station and nothing else.
    this.network = String(config.network ?? '').trim() || networkForCode(this.station) || DEFAULT_NETWORK;
    this.url = config.url || `${MITREN_WS}${encodeURIComponent(this.network)}?listing=0`;
    this.here = this.station ? findStation(this.network, this.station) : undefined;
    this.place = this.here
      ? stationPlace(this.here)
      : this.station
        ? {
            id: `${this.network}/${this.station}`,
            codes: { adif: this.station },
            name: this.station,
            country: 'es',
            timeZone: TIME_ZONE,
          }
        : undefined;
  }

  start(handlers: SourceHandlers): void {
    this.stop();
    this.handlers = handlers;
    if (!this.station) {
      handlers.onStatus('idle', 'mitren.needStation');
      return;
    }
    this.stopped = false;
    this.attempts = 0;
    this.open();
  }

  stop(): void {
    this.stopped = true;
    this.sendSubscriptions = undefined;
    clearInterval(this.pinger);
    clearTimeout(this.retry);
    clearTimeout(this.dataTimer);
    clearTimeout(this.gapTimer);
    clearTimeout(this.holdTimer);
    this.gapOpen = true;
    this.holding = false;
    const socket = this.socket;
    this.socket = undefined;
    if (socket) {
      try {
        socket.close(1000);
      } catch {
        /* already closing */
      }
    }
  }

  /**
   * The services on show, soonest first. The first few (the server allows 4)
   * are followed for their calling points, and only if some display shows
   * calling points at all. An unchanged list costs nothing, so this can be
   * called on every tick.
   */
  focus(serviceIds: string[], needs: Needs): void {
    this.focused = [...serviceIds];
    this.wantCalls = needs.calls;
    this.refreshWanted();
  }

  /** For a debug view: what is followed and what came of it. */
  debugState(): { followed: string | null; states: Record<string, TrainState>; lastIssue?: string } {
    return { followed: this.followed, states: Object.fromEntries(this.trainState), lastIssue: this.lastIssue };
  }

  // Which train channels the focused services stand for. Redone on every
  // board, because a timetabled row only gets its channel once the train runs.
  private refreshWanted(): void {
    const wanted: string[] = [];
    if (this.wantCalls && this.board) {
      const byId = new Map(this.board.map((service) => [service.id, mitrenExt(service)?.technicalId]));
      for (const id of this.focused) {
        const train = byId.get(id);
        if (train && !wanted.includes(train)) wanted.push(train);
      }
    }
    this.wanted = wanted;
    this.syncSubscriptions();
  }

  private syncSubscriptions(): void {
    if (!this.sendSubscriptions) return;
    const ids = this.wanted.slice(0, this.maxTrains);
    // The same trains in another order are the same set to the server.
    const key = [...ids].sort().join(',');
    if (key === this.followed) return;
    // After a refusal the set is left alone for a while. Otherwise the gap
    // only spaces out changes to a set of trains: the first trains after the
    // station-only opening go at once. Both timers call back here.
    if (this.holding || (this.followed && !this.gapOpen)) return;
    this.followed = key;
    if (key) {
      this.gapOpen = false;
      clearTimeout(this.gapTimer);
      this.gapTimer = setTimeout(() => {
        this.gapOpen = true;
        this.syncSubscriptions();
      }, SUBSCRIBE_GAP_MS);
    }
    for (const id of [...this.callsByTrain.keys()]) if (!ids.includes(id)) this.callsByTrain.delete(id);
    for (const id of [...this.trainState.keys()]) if (!ids.includes(id)) this.trainState.delete(id);
    for (const id of ids) if (!this.trainState.has(id)) this.trainState.set(id, 'waiting');
    this.sendSubscriptions(ids);
  }

  private emit(): void {
    if (!this.board || !this.handlers) return;
    const services = this.board.map((service) => {
      const train = mitrenExt(service)?.technicalId;
      const calls = train ? this.callsByTrain.get(train) : undefined;
      return calls ? { ...service, callsAfter: calls } : service;
    });
    const snapshot: BoardSnapshot = {
      kind: 'board',
      generatedAt: this.env.clock.now(),
      services,
      attribution: { ...ATTRIBUTION },
    };
    if (this.place) snapshot.station = this.place;
    this.handlers.onSnapshot(snapshot);
  }

  private open(): void {
    const handlers = this.handlers;
    if (this.stopped || !handlers) return;
    handlers.onStatus('connecting');
    let reported = false; // a specific failure was surfaced; don't overwrite it
    let gotData = false;
    let busy = false; // the server turned us away for load, not for a fault
    this.followed = '';
    this.gapOpen = true;

    const Socket = this.deps.WebSocket ?? (globalThis as { WebSocket?: SocketFactory }).WebSocket;
    if (!Socket) {
      handlers.onStatus('error', 'mitren.error.unsupported');
      return;
    }
    let sock: SocketLike;
    try {
      sock = new Socket(this.url);
    } catch (err) {
      // Malformed URL, or a mixed-content block on an http:// page.
      handlers.onStatus('error', err instanceof Error ? err.message : String(err));
      this.schedule(false);
      return;
    }
    this.socket = sock;
    const send = (message: unknown): void => {
      if (sock.readyState === OPEN) sock.send(JSON.stringify(message));
    };

    sock.addEventListener('open', () => {
      // The server subscribes the socket to the network by itself and says
      // so; the station is asked for once that arrives (below), so an unknown
      // network surfaces as its own error rather than as a silent station.
      this.pinger = setInterval(() => send({ type: 'ping' }), PING_MS);
      this.dataTimer = setTimeout(() => {
        if (!gotData && !reported) handlers.onStatus('nodata', 'mitren.nodata');
      }, DATA_TIMEOUT_MS);
    });

    sock.addEventListener('message', (event: { data?: unknown }) => {
      if (sock !== this.socket || typeof event.data !== 'string') return;
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!msg || typeof msg !== 'object') return;

      switch (msg['type']) {
        case 'subscribed':
          if (msg['station_id'] == null && !this.sendSubscriptions) {
            this.attempts = 0;
            if (Number(msg['max_trains']) > 0) this.maxTrains = Number(msg['max_trains']);
            // `subscriptions` replaces the whole set, station and trains, and
            // pushes the board of a newly added station at once.
            this.sendSubscriptions = (ids) =>
              send({ type: 'subscriptions', station_ids: [this.station], train_ids: ids });
            this.followed = null; // force the first send
            this.syncSubscriptions();
          }
          return;
        case 'arrivals_update': {
          if (String(msg['station_id']) !== this.station) return;
          const services = mapArrivals(msg as MitrenArrivals, this.here, this.network);
          if (!services) return;
          this.board = services;
          gotData = true;
          reported = false;
          clearTimeout(this.dataTimer);
          handlers.onStatus('live');
          this.emit();
          // A row that has just gone live has a channel to follow now.
          this.refreshWanted();
          return;
        }
        case 'train_update': {
          const id = String(msg['train_id'] ?? '');
          if (!id || !this.wanted.includes(id)) return;
          const data = msg['data'] as MitrenTrain | undefined;
          const calls = remainingStops(data, this.station, this.network);
          if (calls) this.callsByTrain.set(id, calls);
          else this.callsByTrain.delete(id);
          this.trainState.set(id, !calls ? 'nomatch' : calls.length ? 'stops' : 'empty');
          if (!calls) {
            const list = data && Array.isArray(data.stops) ? data.stops : [];
            this.lastIssue = `train ${id}: ${list.length} stops, ids ${list
              .slice(0, 6)
              .map((stop) => stop && (stop.station_id ?? stop.stop_id))
              .join(',')}`;
          }
          this.emit();
          return;
        }
        case 'train_removed': {
          // Not running yet, or finished: its stops are not known live.
          const id = String(msg['train_id'] ?? '');
          if (this.trainState.has(id)) this.trainState.set(id, 'removed');
          if (this.callsByTrain.delete(id)) this.emit();
          return;
        }
        case 'error': {
          const text = String(msg['message'] ?? 'server error');
          // Following trains is a nicety. A refused change of subscriptions
          // (rate limit, malformed set) must not take the board down with it:
          // forget what was sent so that the next sync tries again.
          if (/subscription|rate limit/i.test(text)) {
            this.lastIssue = text;
            this.followed = null;
            this.holding = true;
            clearTimeout(this.holdTimer);
            this.holdTimer = setTimeout(() => {
              this.holding = false;
              this.syncSubscriptions();
            }, REFUSAL_HOLD_MS);
            return;
          }
          reported = true;
          busy = /busy|too many connections/i.test(text);
          handlers.onStatus('error', busy ? 'mitren.error.busy' : text);
          return;
        }
        case 'pong': {
          // The server's clock is the one the departure times were written
          // against. Where the viewer's device disagrees by more than a
          // moment, the display follows the server, or its countdown would be
          // off by the same amount. A wildly different value is more likely a
          // change in the protocol than a clock a day out, and is ignored.
          const raw = Number(msg['server_epoch']);
          const server = raw > 1e12 ? raw : raw * 1000;
          const skew = Math.abs(server - this.env.clock.now());
          if (Number.isFinite(server) && skew > 2000 && skew < 24 * 3600 * 1000) handlers.onTime?.(server);
          return;
        }
        default:
          return; // the `subscriptions` echo, anything newer than this code
      }
    });

    sock.addEventListener('close', (event: { code?: number }) => {
      if (sock !== this.socket) return;
      clearInterval(this.pinger);
      clearTimeout(this.dataTimer);
      clearTimeout(this.gapTimer);
      clearTimeout(this.holdTimer);
      this.holding = false;
      this.sendSubscriptions = undefined;
      this.socket = undefined;
      if (this.stopped) return;
      if (!reported) handlers.onStatus('error', 'mitren.error.lost');
      // 1013 is "try again later": the server is full. Don't add to it.
      this.schedule(busy || event.code === 1013);
    });

    sock.addEventListener('error', () => {
      /* 'close' always follows; report there */
    });
  }

  private schedule(longWait: boolean): void {
    if (this.stopped) return;
    const base = Math.min(60000, 2000 * 2 ** this.attempts++);
    const delay = longWait ? Math.max(base, 60000) : base;
    // Jitter, so that a server restart is not met by every tab at once.
    const random = this.deps.random ?? Math.random;
    this.retry = setTimeout(() => this.open(), delay * (0.75 + random() * 0.5));
  }
}
