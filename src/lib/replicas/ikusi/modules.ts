import { IKUSI_COLS, IKUSI_ROWS, h, lcdSize, type LcdModule, type VNode } from '../../hardware';

/*
 * The liquid-crystal character modules of Ikusi's indicators, shared by the
 * platform signs of Atocha Cercanías and the departure boards of Aena's
 * airports. Each row of characters is a rail with modules clipped onto it,
 * one per character: a block of dark plastic one character's pitch wide
 * with its glass set in it, and a ledge with a groove along it above and
 * below the glass. Each end of a row is made up with two blank modules of
 * the same width, with no glass.
 *
 * In the units installations are laid out in. Only the proportions come
 * from photographs, measured in units of one character's pitch; the pitch,
 * 6.9, sets the scale and is not a measurement. No module has been
 * measured.
 */

/** From one character to the next. */
export const CELL = 6.9;

/** The dots: 7 × 11 on each glass, nearly touching. */
export const DOTS = { pitch: 0.74, dot: 0.7, pad: 0.2 };
export const GLASS = lcdSize({ cols: IKUSI_COLS, rows: IKUSI_ROWS }, DOTS);
/**
 * The dots of the railway signs' glasses, 7 × 9 in a glass as large as the
 * airports' 7 × 11: further apart, and taller, down than across.
 */
export const DOTS_7X9 = { ...DOTS, pitchY: 0.92, dotY: 0.74 };

/**
 * A module's height; its width is the pitch, less the seam between two
 * modules. Above and below the glass it has a ledge with a groove along it.
 */
export const MODULE = { height: 12, seam: 0.16 };
/** The rail, showing above and below the modules. */
export const LIP = 0.6;
/** Blank modules at each end of a row. */
export const FILLERS = 2;
/** Where the glass sits in its module. */
export const INSET = { x: (CELL - GLASS.width) / 2, y: (MODULE.height - GLASS.height) / 2 };

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RowLayout {
  /** The rail, which fills the row's opening in the sheet. */
  rail: Box;
  /** The modules on it, by their left edge: blank ones at the ends. */
  modules: { x: number; blank: boolean }[];
  moduleY: number;
  /** The glasses of the character modules. */
  glasses: LcdModule[];
}

/**
 * A row of `chars` characters whose first module starts at `firstChar` and
 * whose glasses' tops are at `glassY`, with `fillers` blank modules at each
 * end.
 */
export function rowLayout(firstChar: number, glassY: number, chars: number, fillers = FILLERS): RowLayout {
  const first = firstChar - fillers * CELL;
  const total = chars + 2 * fillers;
  const moduleY = glassY - INSET.y;
  return {
    rail: { x: first, y: moduleY - LIP, width: total * CELL, height: MODULE.height + 2 * LIP },
    modules: Array.from({ length: total }, (_, i) => ({ x: first + i * CELL, blank: i < fillers || i >= fillers + chars })),
    moduleY,
    glasses: Array.from({ length: chars }, (_, i) => ({ x: firstChar + INSET.x + i * CELL, y: glassY })),
  };
}

/** The rail the modules are clipped onto, and its lips. */
const RAIL = '#2a2e33';
const RAIL_LIGHT = '#474c53';
const RAIL_SHADOW = '#0f1113';
/** The modules' dark plastic, and the light along their top edge. */
const PLASTIC = '#1c1f23';
const PLASTIC_LIGHT = '#2e3238';
const GROOVE = '#0c0d0f';

/** A row: the rail across its opening, the modules on it, blank ones at the ends, and a recess round each glass. */
export function railRow(row: RowLayout): VNode[] {
  const { rail, moduleY } = row;
  const width = CELL - MODULE.seam;
  const nodes: VNode[] = [
    h('rect', { ...rail, fill: RAIL, stroke: '#070808', 'stroke-width': 0.3 }),
    h('rect', { x: rail.x, y: rail.y, width: rail.width, height: 0.25, fill: RAIL_LIGHT }),
    h('rect', { x: rail.x, y: rail.y + rail.height - 0.3, width: rail.width, height: 0.3, fill: RAIL_SHADOW }),
  ];
  for (const module of row.modules) {
    const x = module.x + MODULE.seam / 2;
    nodes.push(
      h('rect', { x, y: moduleY, width, height: MODULE.height, rx: 0.25, fill: PLASTIC }),
      h('rect', { x: x + 0.2, y: moduleY, width: width - 0.4, height: 0.22, fill: PLASTIC_LIGHT }),
    );
    // The grooves along the ledges above and below the glass: a dark line, lit along its lower edge.
    for (const y of [moduleY + INSET.y / 2, moduleY + MODULE.height - INSET.y / 2]) {
      nodes.push(
        h('rect', { x, y: y - 0.16, width, height: 0.32, fill: GROOVE }),
        h('rect', { x, y: y + 0.16, width, height: 0.14, fill: PLASTIC_LIGHT }),
      );
    }
  }
  for (const glass of row.glasses) {
    nodes.push(h('rect', { x: glass.x - 0.2, y: glass.y - 0.2, width: GLASS.width + 0.4, height: GLASS.height + 0.4, fill: '#0b0c0e' }));
  }
  return nodes;
}
