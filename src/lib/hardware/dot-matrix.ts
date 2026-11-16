import { hash01 } from './defects';
import { h, toDom, type VNode } from './svg';

/**
 * How one dot looks, lit and unlit. The matrix below knows nothing about
 * flaps, LEDs or lamps: a display with a different look brings its own skin,
 * and one that is nothing like a dot grid does not use this file at all.
 *
 * `L` is whatever the skin needs to know about the current appearance
 * (colours, mostly).
 */
export interface DotSkin<L> {
  /** The nodes of one dot filling the pitch x pitch square whose top-left corner is (x, y). */
  draw(x: number, y: number, pitch: number, on: boolean, look: L): VNode[];
  /** Brings the live elements of one dot, in the order `draw` returned them, to a state. */
  update(elements: SVGElement[], on: boolean, look: L): void;
  /** Whether a dot in this state is drawn at all. Lets an export leave out what cannot be seen. */
  visible(on: boolean, look: L): boolean;
}

/** A block of cols x rows dots, placed by its top-left corner. */
export interface DotModule {
  x: number;
  y: number;
}

export interface DotMatrixSpec<L> {
  modules: DotModule[];
  cols: number;
  rows: number;
  /** Distance between the centres of neighbouring dots. */
  pitch: number;
  skin: DotSkin<L>;
  /** Drawn behind each module: its carrier board, a window in the housing... */
  backing?(module: DotModule, width: number, height: number, index: number): VNode[];
}

/** For each module, one number per column, bit 0 being the top dot. */
export type DotState = number[][];

export interface MountedDotMatrix<L> {
  element: SVGElement;
  update(state: DotState, look: L): void;
}

const isOn = (state: DotState, module: number, col: number, row: number): boolean =>
  (((state[module]?.[col] ?? 0) >> row) & 1) === 1;

/** A grid of dots, drawn once and then updated dot by dot. */
export class DotMatrix<L> {
  constructor(readonly spec: DotMatrixSpec<L>) {}

  private backings(): VNode[] {
    const { modules, cols, rows, pitch, backing } = this.spec;
    if (!backing) return [];
    return modules.flatMap((module, index) => backing(module, cols * pitch, rows * pitch, index));
  }

  /** The whole matrix in one state, with nothing kept for later. Dots that cannot be seen are left out. */
  render(state: DotState, look: L): VNode {
    const { modules, cols, rows, pitch, skin } = this.spec;
    const nodes = this.backings();
    modules.forEach((module, m) => {
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const on = isOn(state, m, c, r);
          if (skin.visible(on, look)) nodes.push(...skin.draw(module.x + c * pitch, module.y + r * pitch, pitch, on, look));
        }
      }
    });
    return h('g', {}, nodes);
  }

  /** Live elements, and a function that touches only the dots that changed. */
  mount(doc: Document, state: DotState, look: L): MountedDotMatrix<L> {
    const { modules, cols, rows, pitch, skin } = this.spec;
    const dots: SVGElement[][] = [];
    const shown: boolean[] = [];
    const nodes = this.backings();
    modules.forEach((module, m) => {
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const on = isOn(state, m, c, r);
          const elements: SVGElement[] = [];
          for (const node of skin.draw(module.x + c * pitch, module.y + r * pitch, pitch, on, look)) {
            nodes.push({ ...node, ref: (element) => elements.push(element) });
          }
          dots.push(elements);
          shown.push(on);
        }
      }
    });
    const element = toDom(h('g', {}, nodes), doc);
    dots.forEach((elements, i) => skin.update(elements, shown[i]!, look));
    let current = look;
    return {
      element,
      update(next: DotState, nextLook: L): void {
        const repaint = nextLook !== current;
        current = nextLook;
        let i = 0;
        for (let m = 0; m < modules.length; m++) {
          for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++, i++) {
              const on = isOn(next, m, c, r);
              if (!repaint && on === shown[i]) continue;
              shown[i] = on;
              skin.update(dots[i]!, on, nextLook);
            }
          }
        }
      },
    };
  }
}

export interface StuckDots {
  /** Fraction of dots stuck showing. */
  on: number;
  /** Fraction of dots stuck dark. */
  off: number;
  seed: number;
}

/**
 * A state with some dots refusing to follow it, as on a worn mechanical
 * display. Which dots is a function of the seed alone.
 */
export function withStuckDots(state: DotState, cols: number, rows: number, stuck: StuckDots): DotState {
  if (stuck.on <= 0 && stuck.off <= 0) return state;
  return state.map((columns, m) => {
    const out: number[] = [];
    for (let c = 0; c < cols; c++) {
      let byte = columns[c] ?? 0;
      for (let r = 0; r < rows; r++) {
        const roll = hash01(stuck.seed, m, c, r);
        if (roll < stuck.on) byte |= 1 << r;
        else if (roll < stuck.on + stuck.off) byte &= ~(1 << r);
      }
      out.push(byte);
    }
    return out;
  });
}
