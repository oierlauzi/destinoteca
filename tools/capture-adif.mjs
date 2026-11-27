#!/usr/bin/env node
/**
 * Record what ADIF's hub at info.adif.es sends for some stations, the way the
 * site itself receives it: from a real browser, on a page of the site's own
 * origin, over the hub's WebSocket with no negotiation.
 *
 * info.adif.es sits behind a CDN that turns away clients that do not look
 * like a browser, so this drives Chromium through Playwright instead of
 * opening a socket from Node. The page it runs in is the site's address with
 * an empty document served in its place, so the hub sees the Origin it will
 * see in production.
 *
 * Usage:
 *   node tools/capture-adif.mjs <out-dir> <station-code>...
 *
 * Writes <out-dir>/<code>.json for each station that answers: the board as
 * the hub sent it (the argument of its first ReceiveMessage), untouched.
 * Codes are ADIF's five-digit ones (`17000`, `03100`). A station the hub has
 * no board for is silently ignored by it, so it is reported here after a
 * timeout rather than as an error.
 *
 * Playwright is not a dependency of the site. Run this where it is installed
 * (`npm i -D playwright` in a scratch directory, or a global install), with
 * NODE_PATH pointing at it if needed. Used to refresh tests/fixtures/adif/
 * and the names in tools/build_adif_stations.py.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ORIGIN_PAGE = 'https://oierlauzi.github.io/destinoteca/';
const HUB = 'wss://info.adif.es/InfoStation';
const TIMEOUT_MS = 30000;

const [outDir, ...codes] = process.argv.slice(2);
if (!outDir || codes.length === 0) {
  console.error('usage: node tools/capture-adif.mjs <out-dir> <station-code>...');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.route(`${ORIGIN_PAGE}**`, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>capture</title>' }));
  await page.goto(ORIGIN_PAGE);
  for (const raw of codes) {
    const code = raw.trim().padStart(5, '0');
    const result = await page.evaluate(
      ({ hub, code, timeout }) =>
        new Promise((resolve) => {
          const RS = '\x1e';
          const ws = new WebSocket(hub);
          let buffer = '';
          const started = Date.now();
          const timer = setTimeout(() => {
            ws.close();
            resolve({ error: `no board after ${timeout} ms` });
          }, timeout);
          const call = (id, target) =>
            ws.send(JSON.stringify({ type: 1, invocationId: id, target, arguments: [`PRO-ECM-${code}`] }) + RS);
          ws.onopen = () => ws.send(JSON.stringify({ protocol: 'json', version: 1 }) + RS);
          ws.onmessage = (event) => {
            buffer += event.data;
            const records = buffer.split(RS);
            buffer = records.pop();
            for (const record of records) {
              if (!record) continue;
              const message = JSON.parse(record);
              if (message.error) {
                clearTimeout(timer);
                ws.close();
                resolve({ error: String(message.error) });
                return;
              }
              if (message.type === undefined) {
                call('0', 'JoinInfo');
                call('1', 'GetLastMessage');
              } else if (message.type === 1 && message.target === 'ReceiveMessage') {
                clearTimeout(timer);
                ws.close();
                resolve({ board: message.arguments[0], ms: Date.now() - started });
                return;
              }
            }
          };
          ws.onclose = (event) => {
            clearTimeout(timer);
            resolve({ error: `closed (${event.code})` });
          };
        }),
      { hub: HUB, code, timeout: TIMEOUT_MS },
    );
    if (result.board) {
      writeFileSync(join(outDir, `${code}.json`), result.board);
      console.log(`${code}: ${result.board.length} characters in ${result.ms} ms`);
    } else {
      console.log(`${code}: ${result.error}`);
    }
  }
} finally {
  await browser.close();
}
