import { MarqueeRun, scrolls, toDocument, toDom, type DotMatrix, type DotState, type DotTransition, type OctagonFlapLook, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { FONT, flipState, panelState, type FamilyOptions, type LedRow } from './parts';

/**
 * Drawing a sign of this family, as a file or live in a page. A sign brings
 * its housing (frame, legends, anything printed or stuck on), its flip-dot
 * matrix, and says which dots go on it and what goes on its LED row; this
 * does the rest: the sweep with which the flaps change, the marquee.
 *
 * The matrix may be character modules or one continuous grid, with any dot
 * skin: `L` is the look its skin takes.
 */
export interface SignSpec<F, L = OctagonFlapLook> {
  width: number;
  height: number;
  /** What the export is credited as, in its first line. */
  credit: string;
  flipDots: DotMatrix<L>;
  sweep(): DotTransition;
  led: LedRow;
  /** The dots of the flip-dot matrix for a frame, faults included. */
  dots(frame: F, options: FamilyOptions): DotState;
  /** How the flip-dot matrix looks with these options. */
  look(options: FamilyOptions): L;
  /** What the LED panel shows: one text per line, or the one text of a row. */
  ledText(frame: F): string | string[];
  /** What a screen reader says instead of the dots. */
  describe(frame: F, options: FamilyOptions): string;
  /**
   * The fixed part of the sign. Nodes whose content follows the frame (a
   * platform number) register themselves in `slots` through their ref, and
   * are refreshed by `fill`.
   */
  housing(frame: F, options: FamilyOptions, slots: Record<string, SVGElement>): VNode[];
  fill?(frame: F, slots: Record<string, SVGElement>, options: FamilyOptions): void;
}

function svg(spec: { width: number; height: number }, title: string, children: VNode[], slots: Record<string, SVGElement>): VNode {
  return {
    tag: 'svg',
    attrs: { viewBox: `0 0 ${spec.width} ${spec.height}`, 'font-family': FONT, role: 'img' },
    children: [{ tag: 'title', attrs: {}, children: [title], ref: (element) => (slots.title = element) }, ...children],
  };
}

/** The texts of the LED panel, one per line it has. */
function ledLines<F, L>(spec: SignSpec<F, L>, frame: F): string[] {
  const text = spec.ledText(frame);
  const lines = typeof text === 'string' ? [text] : text;
  return spec.led.lines.map((_, i) => lines[i] ?? '');
}

/** One frame as a standalone SVG file, with the LED text at its start and nothing moving. */
export function renderSign<F, L>(spec: SignSpec<F, L>, frame: F, options: FamilyOptions): string {
  const root = svg(spec, spec.describe(frame, options), [
    ...spec.housing(frame, options, {}),
    spec.led.matrix.render(panelState(spec.led, ledLines(spec, frame).map((line) => spec.led.strip(line)), []), spec.led.look(options)),
    spec.flipDots.render(spec.dots(frame, options), spec.look(options)),
  ], {});
  root.attrs.width = 1200;
  root.attrs.height = Math.round(((1200 * spec.height) / spec.width) * 100) / 100;
  return toDocument(root, `destinoteca · ${spec.credit} · https://oierlauzi.github.io/destinoteca/`);
}

/** The dots of character modules, with the faults of the Telenorma controller: for `SignSpec.dots`. */
export const characterDots = (cells: string[], options: FamilyOptions): DotState => flipState(cells, options);

export interface MountedSign<F> {
  setFrame(frame: F): void;
  setOptions(options: FamilyOptions): void;
  destroy(): void;
}

export function mountSign<F, L>(spec: SignSpec<F, L>, blankFrame: F, host: Element, initial: FamilyOptions, env: { ticker: Ticker }): MountedSign<F> {
  const doc = host.ownerDocument;
  let frame = blankFrame;
  let options = initial;
  let flipAppearance = spec.look(options);
  let ledAppearance = spec.led.look(options);
  let texts = ledLines(spec, frame);
  let strips = texts.map((line) => spec.led.strip(line));
  let shownOffsets = '';
  let now = 0;
  // Each line runs on its own, from its own beginning.
  const runs = spec.led.lines.map(() => new MarqueeRun());
  const sweep = spec.sweep();

  const flip = spec.flipDots.mount(doc, sweep.at(0), flipAppearance);
  const led = spec.led.matrix.mount(doc, panelState(spec.led, strips, []), ledAppearance);
  const slots: Record<string, SVGElement> = {};
  // The housing is built from the same tree as the export; the two dot
  // matrices are live and go in after it, LED row first.
  const root = toDom(svg(spec, spec.describe(frame, options), spec.housing(frame, options, slots), slots), doc);
  root.append(led.element, flip.element);
  root.setAttribute('width', '100%');
  root.style.display = 'block';
  host.replaceChildren(root);

  const drawLed = (force: boolean): void => {
    // A new announcement is read from its beginning; a redraw of the same one is not.
    const offsets = strips.map((strip, i) =>
      options.ledScroll && scrolls(strip, spec.led.cols) ? runs[i]!.offset(now, texts[i] ?? '', options.ledSpeed) : 0,
    );
    const key = offsets.join(',');
    if (!force && key === shownOffsets) return;
    shownOffsets = key;
    led.update(panelState(spec.led, strips, offsets), ledAppearance);
  };

  const draw = (): void => {
    // New content is swept in; without animation it simply appears.
    const target = spec.dots(frame, options);
    if (options.animate) sweep.retarget(target);
    else sweep.jump(target);
    flip.update(sweep.at(now), flipAppearance);
    spec.fill?.(frame, slots, options);
    if (slots.title) slots.title.textContent = spec.describe(frame, options);
    drawLed(true);
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    now = time;
    if (!sweep.settled) flip.update(sweep.at(now), flipAppearance);
    drawLed(false);
  });
  draw();

  return {
    setFrame(next: F): void {
      const nextTexts = ledLines(spec, next);
      if (nextTexts.join('\n') !== texts.join('\n')) {
        texts = nextTexts;
        strips = texts.map((line) => spec.led.strip(line));
      }
      frame = next;
      draw();
    },
    setOptions(next: FamilyOptions): void {
      // Looks are compared by identity further down, so only replace them when they change.
      // Looks are compared by identity when redrawing, so a new one is made only when it differs.
      const nextLook = spec.look(next);
      if (JSON.stringify(nextLook) !== JSON.stringify(flipAppearance)) flipAppearance = nextLook;
      const nextLed = spec.led.look(next);
      if (JSON.stringify(nextLed) !== JSON.stringify(ledAppearance)) ledAppearance = nextLed;
      options = next;
      draw();
    },
    destroy(): void {
      unsubscribe();
      root.remove();
    },
  };
}
