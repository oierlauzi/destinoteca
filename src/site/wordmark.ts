import { t } from '@/i18n';
import { cellGrid, DotMatrix, encodeCells, glyphState, octagonFlap, telenorma5x7, telenormaCp437, toCells, toString } from '@/lib/hardware';

/**
 * The site's name, spelled in flip-dots with the font of the first sign in
 * the catalog: its dots (lit in `currentColor`) and the box they fill.
 */
export function wordmark(): { width: number; height: number; dots: string } {
  const name = t('site.name');
  // Capitals: the font's are evenly built, and it is how a sign would spell it.
  const text = name.toUpperCase();
  const cells = Array.from(name).length;
  const pitch = 2;
  const gap = 2;
  const matrix = new DotMatrix({
    modules: cellGrid({ lines: 1, cells, cols: 5, rows: 7, pitch, cellGap: gap }),
    cols: 5,
    rows: 7,
    pitch,
    skin: octagonFlap(),
  });
  const dots = toString(matrix.render(glyphState(encodeCells(toCells(text, cells), telenormaCp437), telenorma5x7), { lit: 'currentColor', unlit: null }));
  return { width: cells * 5 * pitch + (cells - 1) * gap, height: 7 * pitch, dots };
}
