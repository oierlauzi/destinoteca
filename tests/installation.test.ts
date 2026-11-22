import { describe, expect, it } from 'vitest';
import { memberOptions, resolveInstallation } from '../src/lib/installations/layout';
import { composeSvg, nestSvg } from '../src/lib/installations/render';
import type { InstallationInput, EntryInput } from '../src/lib/installations/types';
import { getReplica } from '../src/lib/replicas/registry';

const ENTRIES: EntryInput[] = [
  {
    id: 'tablero',
    name: 'Tablero',
    replica: { id: 'mp-electronics-adif', params: { color: '#5df08f' } },
    variants: [{ id: 'av', name: 'Alta velocidad', replicaPreset: { servicio: 'Alta velocidad', color: '#ff3b30' } }],
  },
  { id: 'reloj', name: 'Reloj', replica: { id: 'festina-adif' }, variants: [{ id: 'cuadrado', name: 'Cuadrado', replicaPreset: { caja: 'square' } }] },
  { id: 'paletas', name: 'Paletas', replica: { id: 'solari-renfe-largo-recorrido' }, variants: [] },
  { id: 'sin-replica', name: 'Sin réplica', variants: [] },
];
const entry = (id: string) => ENTRIES.find((e) => e.id === id);

const wall: InstallationInput = {
  size: { width: 800, height: 300 },
  elements: [
    { id: 'llegadas-1', model: 'tablero', variant: 'av', params: { modo: 'arrivals' }, serie: 'llegadas', at: { x: 0, y: 0, width: 300 } },
    { id: 'llegadas-2', model: 'tablero', variant: 'av', params: { modo: 'arrivals' }, serie: 'llegadas', at: { x: 0, y: 140, width: 300 } },
    { id: 'placa', at: { x: 310, y: 0, width: 170, height: 50 }, panel: { fill: '#00703c', lines: [{ text: 'TRENES', size: 9 }], logo: { kind: 'adif', height: 4 } } },
    { id: 'reloj', model: 'reloj', variant: 'cuadrado', at: { x: 320, y: 60, width: 150 } },
    { id: 'salidas-1', model: 'tablero', serie: 'salidas', at: { x: 490, y: 0, width: 300 } },
  ],
};

describe('installations', () => {
  const resolved = resolveInstallation(wall, entry);
  const member = (id: string) => resolved.members.find((m) => m.id === id)!;

  it("take each display's settings from its entry, then its variant, then the installation", () => {
    const board = member('llegadas-1');
    expect(board.kind).toBe('replica');
    if (board.kind !== 'replica') return;
    expect(board.params).toEqual({ color: '#ff3b30', servicio: 'Alta velocidad', modo: 'arrivals' });
    expect(board.entry).toBe('tablero');
    expect(board.variant).toBe('Alta velocidad');
    expect(memberOptions(getReplica('mp-electronics-adif')!, board.params)).toMatchObject({ mode: 'arrivals', service: 'Alta velocidad' });
  });

  it("give each display the height of its replica's shape", () => {
    expect(member('llegadas-1').height).toBeCloseTo((300 * 203) / 466, 1);
    expect(member('reloj').height).toBe(150);
    expect(member('placa').height).toBe(50);
  });

  it('let the boards of a series carry on from one another, each series on its own', () => {
    const skip = (id: string) => {
      const m = member(id);
      return m.kind === 'replica' ? m.skip : undefined;
    };
    expect([skip('llegadas-1'), skip('llegadas-2'), skip('salidas-1'), skip('reloj')]).toEqual([0, 7, 0, 0]);
  });

  it('refuse an element the archive cannot draw', () => {
    expect(() => resolveInstallation({ ...wall, elements: [{ id: 'x', model: 'sin-replica', at: { x: 0, y: 0, width: 10 } }] }, entry)).toThrow(/replica/);
    expect(() => resolveInstallation({ ...wall, elements: [{ id: 'x', model: 'reloj', variant: 'azul', at: { x: 0, y: 0, width: 10 } }] }, entry)).toThrow(/variant/);
    // A unit the archive cannot name belongs to an installation that is not drawn, so it never gets here.
    expect(() => resolveInstallation({ ...wall, elements: [{ id: 'x', at: { x: 0, y: 0, width: 10, height: 5 } }] }, entry)).toThrow(/archive entry/);
  });

  it('nest each display in one SVG file, with ids of its own', () => {
    const board = '<?xml version="1.0"?>\n<svg viewBox="0 0 10 5" width="1200" height="600"><defs><pattern id="lit"/></defs><rect fill="url(#lit)"/></svg>';
    const nested = nestSvg(board, 'm1', { x: 5, y: 6, width: 100, height: 50 });
    expect(nested).toBe('<svg viewBox="0 0 10 5" x="5" y="6" width="100" height="50"><defs><pattern id="m1-lit"/></defs><rect fill="url(#m1-lit)"/></svg>');
    const drawn = new Map(['llegadas-1', 'llegadas-2', 'salidas-1'].map((id) => [id, board]));
    const svg = composeSvg(resolved, drawn, 'Prueba');
    expect(svg.match(/<svg /g)).toHaveLength(4);
    expect(svg).toContain('id="m0-lit"');
    expect(svg).toContain('id="m2-lit"');
    expect(svg).toContain('TRENES');
    expect(svg).toContain('viewBox="0 0 800 300"');
  });

  it('draw the Solari boards without their frame when the installation has its own', async () => {
    const paletas = resolveInstallation({ size: { width: 300, height: 120 }, elements: [{ id: 'p', model: 'paletas', params: { marco: false }, at: { x: 0, y: 0, width: 285 } }] }, entry);
    expect(paletas.members[0]!.height).toBeCloseTo(115.1, 1);
  });
});
