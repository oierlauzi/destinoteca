import { hash01 } from './defects';
import { h, num, type VNode } from './svg';

/**
 * Liquid-crystal character modules of the kind Ikusi built its boards from:
 * one small glass per character, each with its own matrix of square dots.
 *
 * Every glass glows faintly in the colour of its backlight, with or without
 * a character, and the character's dots are lit over that glow. Modules age
 * apart from one another, so neighbours differ in shade, and some have
 * patches where the layers of the glass have come apart and nothing shows
 * well.
 */

export interface LcdFont {
  cols: number;
  rows: number;
  /** One number per column, bit 0 the top dot. */
  glyph(char: string): number[];
}

export interface LcdLook {
  /** Distance between the centres of two dots. */
  pitch: number;
  /** Side of a dot. */
  dot: number;
  /** Glass around the dots, on every side. */
  pad: number;
  /** A lit dot. */
  lit: string;
  /** What a lit dot turns towards as the module ages. */
  litAged: string;
  /** The glow of a glass, the brightest of them. */
  blank: string;
  /** The glow of a glass, the dullest. */
  blankDull: string;
  /** 0 to 1: how far the modules have drifted apart in shade. */
  uneven: number;
  /** 0 to 1: the share of modules with a patch where the glass has come apart. */
  delamination: number;
  seed: number;
}

export interface LcdModule {
  x: number;
  y: number;
}

/** Size of one module's glass. */
export function lcdSize(font: Pick<LcdFont, 'cols' | 'rows'>, look: Pick<LcdLook, 'pitch' | 'dot' | 'pad'>): { width: number; height: number } {
  const span = (n: number) => (n - 1) * look.pitch + look.dot + 2 * look.pad;
  return { width: span(font.cols), height: span(font.rows) };
}

// --- Colour -------------------------------------------------------------------------

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function hex([r, g, b]: [number, number, number]): string {
  const part = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

function mix(a: string, b: string, t: number): [number, number, number] {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t];
}

const scale = ([r, g, b]: [number, number, number], k: number): [number, number, number] => [r * k, g * k, b * k];

/** The colours of the module at index `i`: each its own, fixed by the seed. */
export function lcdShades(i: number, look: LcdLook): { lit: string; blank: string } {
  const age = hash01(look.seed, i, 0, 0x1c0) * look.uneven;
  const dim = 1 - hash01(look.seed, i, 1, 0x1c0) * look.uneven * 0.5;
  const blank = hash01(look.seed, i, 2, 0x1c0);
  return {
    lit: hex(scale(mix(look.lit, look.litAged, age), dim)),
    // Even when new, the glasses do not all glow alike; ageing spreads them further.
    blank: hex(scale(mix(look.blank, look.blankDull, Math.min(1, blank * (0.3 + look.uneven))), 1 - blank * look.uneven * 0.25)),
  };
}

// --- Shapes -------------------------------------------------------------------------

/** The lit dots of a character, as one path, from the module's corner. */
export function lcdGlyphPath(char: string, at: LcdModule, font: LcdFont, look: Pick<LcdLook, 'pitch' | 'dot' | 'pad'>): string {
  const columns = font.glyph(char);
  let d = '';
  columns.forEach((bits, col) => {
    for (let row = 0; row < font.rows; row++) {
      if (!(bits & (1 << row))) continue;
      d += `M${num(at.x + look.pad + col * look.pitch)} ${num(at.y + look.pad + row * look.pitch)}h${num(look.dot)}v${num(look.dot)}h${num(-look.dot)}z`;
    }
  });
  return d;
}

/**
 * A patch where the glass has come apart: an uneven blot growing in from an
 * edge or a corner, kept within the glass. None for most modules.
 */
export function lcdBlot(i: number, at: LcdModule, size: { width: number; height: number }, look: LcdLook): string | undefined {
  if (hash01(look.seed, i, 0, 0xde1) >= look.delamination) return undefined;
  const r = (k: number) => hash01(look.seed, i, k, 0xde1);
  // Where it starts: one of the four corners or the middle of an edge.
  const anchors: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
  const [ax, ay] = anchors[Math.floor(r(1) * anchors.length)]!;
  const cx = at.x + ax * size.width;
  const cy = at.y + ay * size.height;
  const radius = (0.25 + r(2) * 0.45) * size.width;
  const points: string[] = [];
  const steps = 14;
  for (let k = 0; k < steps; k++) {
    const angle = (k / steps) * Math.PI * 2;
    const reach = radius * (0.6 + 0.4 * r(10 + k)) * (k % 2 ? 1 : 0.85);
    const x = Math.min(at.x + size.width, Math.max(at.x, cx + Math.cos(angle) * reach));
    const y = Math.min(at.y + size.height, Math.max(at.y, cy + Math.sin(angle) * reach * 1.2));
    points.push(`${num(x)} ${num(y)}`);
  }
  return `M${points.join('L')}z`;
}

// --- Drawing ------------------------------------------------------------------------

export interface LcdRefs {
  glyph: SVGElement[];
}

/**
 * The modules, each showing one character of `chars` (a blank past its end).
 * `first` numbers them, so that the modules of several lines on one display
 * each keep their own shade.
 */
export function lcdModules(modules: LcdModule[], chars: string[], font: LcdFont, look: LcdLook, first = 0, refs?: LcdRefs): VNode[] {
  const size = lcdSize(font, look);
  const nodes: VNode[] = [];
  modules.forEach((at, k) => {
    const i = first + k;
    const char = chars[k] ?? ' ';
    const shades = lcdShades(i, look);
    nodes.push(
      h('rect', { x: at.x, y: at.y, width: size.width, height: size.height, fill: shades.blank }),
      h('path', { d: lcdGlyphPath(char, at, font, look), fill: shades.lit }, [], refs ? (element) => (refs.glyph[k] = element) : undefined),
    );
    const blot = lcdBlot(i, at, size, look);
    if (blot) {
      nodes.push(h('path', { d: blot, fill: '#56543c', 'fill-opacity': 0.8, stroke: '#8d8a62', 'stroke-opacity': 0.45, 'stroke-width': look.pitch * 0.08, 'stroke-linejoin': 'round' }));
    }
  });
  return nodes;
}

/** Brings modules drawn with `refs` up to date with new characters. */
export function updateLcd(refs: LcdRefs, modules: LcdModule[], chars: string[], font: LcdFont, look: Pick<LcdLook, 'pitch' | 'dot' | 'pad'>): void {
  modules.forEach((at, k) => {
    const char = chars[k] ?? ' ';
    refs.glyph[k]?.setAttribute('d', lcdGlyphPath(char, at, font, look));
  });
}
