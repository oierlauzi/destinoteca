/**
 * A live board from ADIF's own hub, the one behind the screens on
 * info.adif.es.
 *
 * The hub is ASP.NET SignalR. Its client library starts with an HTTP POST to
 * `/InfoStation/negotiate`, which a page on GitHub Pages cannot make: the hub
 * sends no Access-Control-Allow-Origin header. Browsers do not apply CORS to
 * the WebSocket handshake, though, and the hub accepts a WebSocket that skips
 * negotiation (what the library calls `skipNegotiation`), so this speaks the
 * protocol itself over a bare WebSocket. The connection id must then be left
 * out, not invented: one that did not come from negotiate is refused.
 *
 * info.adif.es sits behind a CDN that turns away whatever does not look like a
 * browser, and in 2026 ADIF stopped its pages from being framed by other
 * sites. Neither touches this: the request is the visitor's own browser's, and
 * nothing is framed. tools/capture-adif.mjs drives a real browser the same way
 * to record boards.
 *
 * Wire format, JSON records each ended by 0x1e:
 *   ->  {"protocol":"json","version":1}             handshake
 *   <-  {}                                          accepted ({"error":…} if not)
 *   ->  {"type":1,"invocationId":"0","target":"JoinInfo","arguments":["PRO-ECM-17000"]}
 *   ->  {"type":1,"invocationId":"1","target":"GetLastMessage","arguments":["PRO-ECM-17000"]}
 *   <-  {"type":3,"invocationId":"0","result":null}  done (or "error":…)
 *   <-  {"type":1,"target":"ReceiveMessage","arguments":["<the board, as a JSON string>"]}
 *       for GetLastMessage, and again whenever the board changes
 *   <-> {"type":6}                                   ping, both ways
 *   <-  {"type":7,"error":…}                        closed by the server
 *
 * `PRO-ECM-<code>` names a station's board, with ADIF's five-digit code. The
 * hub ignores a code it has no board for, without an error, so a deadline
 * tells "no such board" from "still on its way". GetLastMessage only fetches
 * the board as it stands, so that the display fills in at once; the hub
 * sometimes fails it for a station, which costs a moment and not the feed.
 */
import type { BoardSnapshot, Place } from '../../model';
import type { SourceEnv, SourceHandlers, SourceInstance } from '../types';
import { mapBoard, type AdifBoard } from './map';
import { findStation, normalCode, stationPlace, TIME_ZONE } from './stations';

export const ADIF_HUB = 'wss://info.adif.es/InfoStation';
export const GROUP_PREFIX = 'PRO-ECM-';
const RS = '\x1e';
/** SignalR's own keep-alive interval: the hub drops a client silent for twice as long. */
export const PING_MS = 15000;
/**
 * Not a health check: a busy station answers at once, but the hub says
 * nothing at all about a code it has no board for.
 */
export const DATA_TIMEOUT_MS = 30000;
/** How often, and how patiently, to ask again for a board the hub failed to produce. */
export const SNAPSHOT_RETRIES = 3;
export const SNAPSHOT_RETRY_MS = 5000;
/**
 * The hub pushes a station's whole board over and over: every 15 s at a small
 * station, every 2 or 3 s at Chamartín (about 470 kB each time, uncompressed,
 * most of them unchanged). One silent for this long is asked for again, so a
 * display is not left behind by a hub that stopped pushing.
 */
export const STALE_MS = 5 * 60000;

export const ATTRIBUTION = {
  name: 'Adif (info.adif.es)',
  url: 'https://info.adif.es/',
} as const;

/** The little of a WebSocket this needs, so that a test can stand in for one. */
export interface SocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number): void;
  addEventListener(type: 'open' | 'message' | 'close' | 'error', listener: (event: any) => void): void;
}

export type SocketFactory = new (url: string) => SocketLike;

export interface AdifConfig {
  /** ADIF's station code, `17000`, `03100` (the leading zero may be left out). */
  station: string;
  /** Which kinds of train to keep: any of `C`, `R`, `L`. All when empty. */
  traffic?: readonly string[];
  /** Another hub speaking the same protocol. */
  url?: string;
}

export interface AdifDeps {
  /** Defaults to the global WebSocket, read when connecting. */
  WebSocket?: SocketFactory;
  /** For the reconnect jitter. */
  random?: () => number;
}

const OPEN = 1;

/** Read a `trafico` setting (`CRL`, `C`, `RL`…) into the kinds it keeps. All three read as none: keep everything. */
export function readTraffic(value: unknown): string[] {
  const kinds = [...new Set(String(value ?? '').toUpperCase().replace(/[^CRL]/g, ''))];
  return kinds.length === 3 ? [] : kinds.sort((a, b) => 'CRL'.indexOf(a) - 'CRL'.indexOf(b));
}

export class AdifSession implements SourceInstance {
  readonly station: string;
  readonly group: string;
  readonly url: string;
  readonly traffic: readonly string[];
  private readonly place: Place | undefined;

  private handlers: SourceHandlers | undefined;
  private socket: SocketLike | undefined;
  private pinger: ReturnType<typeof setInterval> | undefined;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private dataTimer: ReturnType<typeof setTimeout> | undefined;
  private staleTimer: ReturnType<typeof setTimeout> | undefined;
  private attempts = 0;
  private stopped = true;
  private nextInvocation = 0;

  constructor(
    config: AdifConfig,
    private readonly env: SourceEnv,
    private readonly deps: AdifDeps = {},
  ) {
    this.station = normalCode(config.station);
    this.group = `${GROUP_PREFIX}${this.station}`;
    this.url = config.url || ADIF_HUB;
    this.traffic = [...(config.traffic ?? [])];
    const listed = this.station ? findStation(this.station) : undefined;
    this.place = listed
      ? stationPlace(listed)
      : this.station
        ? { id: `adif/${this.station}`, codes: { adif: this.station }, name: this.station, country: 'es', timeZone: TIME_ZONE }
        : undefined;
  }

  start(handlers: SourceHandlers): void {
    this.stop();
    this.handlers = handlers;
    if (!this.station) {
      handlers.onStatus('idle', 'adif.needStation');
      return;
    }
    this.stopped = false;
    this.attempts = 0;
    this.open();
  }

  stop(): void {
    this.stopped = true;
    clearInterval(this.pinger);
    clearTimeout(this.retry);
    clearTimeout(this.dataTimer);
    clearTimeout(this.staleTimer);
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

  private emit(board: AdifBoard): boolean {
    const mapped = mapBoard(board, this.traffic);
    if (!mapped || !this.handlers) return false;
    const snapshot: BoardSnapshot = {
      kind: 'board',
      generatedAt: this.env.clock.now(),
      services: mapped.services,
      attribution: { ...ATTRIBUTION },
    };
    const station = mapped.station ?? this.place;
    if (station) snapshot.station = station;
    if (mapped.notices.length) snapshot.notices = mapped.notices;
    this.handlers.onSnapshot(snapshot);
    return true;
  }

  private open(): void {
    const handlers = this.handlers;
    if (this.stopped || !handlers) return;
    handlers.onStatus('connecting');
    let reported = false; // a specific failure was surfaced; don't overwrite it
    let gotData = false;
    let handshaken = false;
    let buffer = '';
    /** The last board as it came, to tell a repeat from a change without reading it. */
    let lastRaw: unknown;
    /** What each invocation in flight asked for, and how many times it has been tried. */
    const calls = new Map<string, { target: string; tries: number }>();

    const Socket = this.deps.WebSocket ?? (globalThis as { WebSocket?: SocketFactory }).WebSocket;
    if (!Socket) {
      handlers.onStatus('error', 'adif.error.unsupported');
      return;
    }
    let sock: SocketLike;
    try {
      sock = new Socket(this.url);
    } catch (err) {
      // Malformed URL, or a mixed-content block on an http:// page.
      handlers.onStatus('error', err instanceof Error ? err.message : String(err));
      this.schedule();
      return;
    }
    this.socket = sock;
    const send = (message: unknown): void => {
      if (sock.readyState === OPEN && sock === this.socket) sock.send(JSON.stringify(message) + RS);
    };
    const invoke = (target: string, tries = 1, id = String(this.nextInvocation++)): void => {
      calls.set(id, { target, tries });
      send({ type: 1, invocationId: id, target, arguments: [this.group] });
    };
    // Asks for the board again when the hub has been quiet for too long.
    const watchStale = (): void => {
      clearTimeout(this.staleTimer);
      this.staleTimer = setTimeout(() => {
        invoke('GetLastMessage');
        watchStale();
      }, STALE_MS);
    };

    sock.addEventListener('open', () => {
      if (sock !== this.socket) return;
      sock.send(JSON.stringify({ protocol: 'json', version: 1 }) + RS);
    });

    sock.addEventListener('message', (event: { data?: unknown }) => {
      if (sock !== this.socket || typeof event.data !== 'string') return;
      buffer += event.data;
      // A frame may carry several records, or part of one.
      const records = buffer.split(RS);
      buffer = records.pop() ?? '';
      for (const record of records) {
        if (!record) continue;
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(record);
        } catch {
          continue;
        }
        if (!msg || typeof msg !== 'object') continue;

        if (!handshaken) {
          handshaken = true;
          if (msg['error']) {
            // The hub refused the protocol itself.
            reported = true;
            handlers.onStatus('error', String(msg['error']));
            sock.close(1000);
            return;
          }
          this.attempts = 0;
          this.pinger = setInterval(() => send({ type: 6 }), PING_MS);
          this.dataTimer = setTimeout(() => {
            if (!gotData && !reported) handlers.onStatus('nodata', 'adif.nodata');
          }, DATA_TIMEOUT_MS);
          invoke('JoinInfo');
          invoke('GetLastMessage');
          watchStale();
          continue;
        }

        switch (msg['type']) {
          case 1: {
            if (msg['target'] !== 'ReceiveMessage') continue;
            const args = msg['arguments'];
            const raw = Array.isArray(args) ? args[0] : undefined;
            // A busy station's board comes again every few seconds, mostly
            // unchanged: half a megabyte not worth reading twice.
            if (gotData && typeof raw === 'string' && raw === lastRaw) {
              watchStale();
              continue;
            }
            let board: AdifBoard;
            try {
              board = typeof raw === 'string' ? JSON.parse(raw) : (raw as AdifBoard);
            } catch {
              continue;
            }
            // A board for another group has nothing to do with this display.
            const code = normalCode(board?.station_settings?.code);
            if (code && code !== this.station) continue;
            if (!this.emit(board)) continue;
            lastRaw = raw;
            gotData = true;
            reported = false;
            clearTimeout(this.dataTimer);
            watchStale();
            handlers.onStatus('live');
            continue;
          }
          case 3: {
            const id = String(msg['invocationId'] ?? '');
            const call = calls.get(id);
            calls.delete(id);
            if (!msg['error'] || !call) continue;
            if (call.target === 'GetLastMessage') {
              // The board as it stands could not be had this time. The
              // subscription stands, and the next push will bring a board.
              if (call.tries < SNAPSHOT_RETRIES) {
                const retryAt = SNAPSHOT_RETRY_MS * call.tries;
                setTimeout(() => {
                  if (sock === this.socket && !gotData) invoke('GetLastMessage', call.tries + 1);
                }, retryAt);
              }
              continue;
            }
            reported = true;
            handlers.onStatus('error', String(msg['error']));
            continue;
          }
          case 7: {
            reported = true;
            handlers.onStatus('error', msg['error'] ? String(msg['error']) : 'adif.error.closed');
            continue;
          }
          default:
            continue; // pings, and anything newer than this code
        }
      }
    });

    sock.addEventListener('close', () => {
      if (sock !== this.socket) return;
      clearInterval(this.pinger);
      clearTimeout(this.dataTimer);
      clearTimeout(this.staleTimer);
      this.socket = undefined;
      if (this.stopped) return;
      // Closed before the handshake: the hub, or something in front of it,
      // turned the connection away.
      if (!reported) handlers.onStatus('error', handshaken ? 'adif.error.lost' : 'adif.error.refused');
      this.schedule();
    });

    sock.addEventListener('error', () => {
      /* 'close' always follows; report there */
    });
  }

  private schedule(): void {
    if (this.stopped) return;
    const delay = Math.min(60000, 2000 * 2 ** this.attempts++);
    // Jitter, so that a restart of the hub is not met by every tab at once.
    const random = this.deps.random ?? Math.random;
    this.retry = setTimeout(() => this.open(), delay * (0.75 + random() * 0.5));
  }
}
