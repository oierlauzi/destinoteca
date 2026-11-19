import { describe, expect, it } from 'vitest';
import type { Service, View } from '../src/lib/model';
import { defaults, type ParamSchema } from '../src/lib/params';
import { readConfig, replicaSize, writeConfig } from '../src/lib/player/config';
import { fromFlat, solariCercanias, solariLargo, toFlat } from '../src/lib/replicas/solari-renfe/def';
import { layout } from '../src/lib/replicas/solari-renfe/geometry';
import { identitiesOf, PLATE, plateFor, RECONSTRUCTED, SEEN } from '../src/lib/replicas/solari-renfe/logos';
import { cardFor, DEFAULT_PRESET, drumOf, flapKey, offered, parseFlap, plateOf, PRESETS, textOf } from '../src/lib/replicas/solari-renfe/drum';
import { present } from '../src/lib/replicas/solari-renfe/presenter';
import { renderToString } from '../src/lib/replicas/solari-renfe/render';
import { styleOf, wordLines } from '../src/lib/replicas/solari-renfe/words';

const NOW = Date.UTC(2026, 10, 16, 13, 0, 0);
const view = (services: Service[]): View => ({ now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: [], cycle: true } });

describe('Solari split-flap boards', () => {
  it('lay out the columns of each variant', () => {
    expect(layout('largo', 8).fields.map((field) => field.legend)).toEqual(['tren', 'destino', 'por', 'salida', 'vía', '']);
    expect(layout('cercanias', 9).fields.map((field) => field.legend)).toEqual(['tren', 'procedencia', 'llegada', 'destino', 'salida', 'vía', '']);
    // One board of eight rows: boards hung together are installations.
    expect(solariLargo.options.fields.some((field) => ['rows', 'across', 'down'].includes(field.key))).toBe(false);
    expect(solariLargo.selection({}).window.size).toBe(8);
    expect(solariCercanias.selection({}).window.size).toBe(8);
  });

  it('can leave out its frame and title, which belong to the installation', () => {
    const whole = replicaSize(solariLargo, {});
    const bare = replicaSize(solariLargo, { surround: false });
    expect(bare.width).toBeLessThan(whole.width);
    expect(bare.height).toBeLessThan(whole.height);
    const frame = fromFlat('largo', defaults(solariLargo.frame as ParamSchema));
    const options = { surround: false, drum: 'rotulado', flaps: [], animate: true, speed: 14 };
    expect(renderToString('largo', frame, options)).not.toContain('solari&amp;c. udine');
    expect(renderToString('largo', frame, { ...options, surround: true })).toContain('solari&amp;c. udine');
    expect(solariLargo.options.fields.find((field) => field.key === 'surround')?.hidden).toBe(true);
  });

  it('write the train, the place in twelve flaps cut at a whole word, the time as 14.05 and the platform', () => {
    const train: Service = {
      id: 't',
      product: { name: 'Talgo', shortName: 'TALGO' },
      destination: { name: 'Zaragoza Delicias' },
      via: [{ name: 'Guadalajara' }],
      here: { departure: { scheduled: NOW + 5 * 60000 }, platform: { name: '7', confirmed: true } },
    };
    const row = present('largo', view([train])).rows[0];
    expect(row).toEqual({ t: 'TALGO', d: 'ZARAGOZA', p: 'GUADALAJARA', h: '14.05', v: '7', l: '' });
  });

  it('leave origin and arrival empty for a train that starts here, destination and departure for one that ends here', () => {
    const starts: Service = { id: 'a', destination: { name: 'Atocha' }, here: { activity: 'origin', departure: { scheduled: NOW } } };
    const ends: Service = { id: 'b', origin: { name: 'Cercedilla' }, here: { activity: 'terminus', arrival: { scheduled: NOW } } };
    const [first, second] = present('cercanias', view([starts, ends])).rows;
    expect(first).toMatchObject({ o: '', a: '', d: 'ATOCHA', s: '14.00' });
    expect(second).toMatchObject({ o: 'CERCEDILLA', a: '14.00', d: '', s: '' });
  });

  it('show the dot of a time only with one, and the lamps asked for', () => {
    const frame = fromFlat('largo', defaults(solariLargo.frame as ParamSchema));
    const svg = renderToString('largo', frame, { surround: true, drum: 'rotulado', flaps: [], animate: true, speed: 14 });
    // The dot is printed on the hour flap, so only flaps showing an hour have one.
    expect(svg.match(/r="0.6" fill="#f1eee2"/g)).toHaveLength(6);
    expect(svg.match(/fill="#ff5b38"/g)).toHaveLength(1);
  });

  it('carry a hand-typed board in the URL', () => {
    // Links from when boards could be stacked still open, on one board.
    const config = readConfig(solariCercanias, new URLSearchParams('t1=TRANVIA&o1=AVILA&a1=15.52&ancho=2&alto=2'));
    expect(config.frame).toMatchObject({ t1: 'TRANVIA', o1: 'AVILA', a1: '15.52' });
    expect(config.options).not.toHaveProperty('across');
    expect(replicaSize(solariCercanias, config.options)).toEqual(replicaSize(solariCercanias, {}));
    expect(readConfig(solariCercanias, writeConfig(solariCercanias, config))).toEqual(config);
    const frame = fromFlat('cercanias', config.frame);
    expect(fromFlat('cercanias', toFlat(frame))).toEqual(frame);
  });
});

describe('where Cercanías trains come from', () => {
  it('comes with the simulated trains, with their arrival', async () => {
    const { buildBoard } = await import('../src/lib/sources/demo/index');
    const services = buildBoard(4, NOW);
    const through = services.filter((service) => service.here?.activity === 'calls');
    expect(through.length).toBeGreaterThan(0);
    for (const service of through) {
      expect(service.origin?.name).toBeTruthy();
      expect(service.here?.arrival?.scheduled).toBeLessThan(service.here!.departure!.scheduled!);
    }
    const rows = present('cercanias', view(through)).rows;
    expect(rows[0]!.o).not.toBe('');
    expect(rows[0]!.a).toMatch(/^\d\d\.\d\d$/);
  });

  it('can be typed by hand, with the arrival time', async () => {
    const { buildSnapshot } = await import('../src/lib/sources/manual');
    const snapshot = buildSnapshot({ services: [{ dest: 'Atocha', origin: 'Ávila', arr: '15:52', time: '15:53' }] }, NOW, NOW, true);
    const rows = present('cercanias', view(snapshot.services)).rows;
    expect(rows[0]).toMatchObject({ o: 'AVILA', a: '15.52', d: 'ATOCHA', s: '15.53' });
  });

  it("is the first stop of a live train's list, unless the train starts here", async () => {
    const { firstStop } = await import('../src/lib/sources/mitren/map');
    const data = { stops: [{ station_id: '10000', name: 'Atocha Cercanías' }, { station_id: '17000', name: 'Chamartín' }] };
    expect(firstStop(data, '17000', '10')?.name).toBe('Atocha Cercanías');
    expect(firstStop(data, '10000', '10')).toBeUndefined();
    expect(solariCercanias.needs.calls).toBe(true);
  });
});

describe('Solari train words', () => {
  const width = layout('largo', 8).fields[0]!.width;

  it('sets the photographed words as seen, anything else on one line', () => {
    expect(['TALGO', 'ELECTROTREN', 'RAPIDO', 'RAP. ARAGON'].map(styleOf)).toEqual(['tall', 'tall', 'tall', 'tall']);
    expect(styleOf('INTERURBANO')).toBe('wide');
    expect(styleOf('TALGO PENDULAR')).toBe('left');
    expect(styleOf('TALGO EXTREMADURA')).toBe('block');
    expect(styleOf('TREN HOTEL')).toBe('wide');
    expect(wordLines('TREN HOTEL', width)).toHaveLength(1);
  });

  it('fills the flap top to bottom with a tall word', () => {
    const [line] = wordLines('TALGO', width);
    expect(line!.size).toBe(12);
    expect(line!.width).toBeLessThanOrEqual(width);
  });

  it('clamps other text to the tighter of the flap height and width', () => {
    const [short] = wordLines('TER', width);
    const [long] = wordLines('INTERURBANO', width);
    expect(short!.size).toBe(12);
    expect(long!.size).toBeLessThan(12);
    expect(long!.width).toBeCloseTo(width - 1.2, 5);
  });

  it('stands every word against the left, in the train and "por" columns', () => {
    expect(wordLines('TALGO', width).map((l) => [l.anchor, l.x])).toEqual([['start', 0.6]]);
    expect(wordLines('AVILA', layout('largo', 8).fields[2]!.width).map((l) => [l.anchor, l.x])).toEqual([['start', 0.6]]);
  });

  it('puts two-line words against the left, TALGO centred over EXTREMADURA', () => {
    const pendular = wordLines('TALGO PENDULAR', width);
    expect(pendular.map((l) => [l.text, l.anchor, l.x])).toEqual([['TALGO', 'start', 0.6], ['PENDULAR', 'start', 0.6]]);
    const [talgo, extremadura] = wordLines('TALGO EXTREMADURA', width);
    expect(talgo!.anchor).toBe('middle');
    expect(talgo!.x).toBeCloseTo(0.6 + extremadura!.width / 2, 5);
    expect(extremadura!.x).toBe(talgo!.x);
    expect(talgo!.baseline).toBeLessThan(5);
    expect(extremadura!.baseline).toBeLessThanOrEqual(10);
  });
});

describe('Solari printed plates', () => {
  const frame = (train: string) => fromFlat('largo', { ...defaults(solariLargo.frame as ParamSchema), t1: train, t2: '', t3: '', t4: '', t5: '', t6: '', t7: '', t8: '' });
  const options = { surround: false, drum: 'hoy', flaps: [], animate: false, speed: 14 };
  const draw = (train: string, over: Record<string, unknown> = {}) => renderToString('largo', frame(train), { ...options, ...over });

  it('is offered on the board the photographs show plates on, and starts lettered', () => {
    expect(solariLargo.options.fields.find((entry) => entry.key === 'drum')).toMatchObject({ type: 'select', urlKey: 'tambor', default: DEFAULT_PRESET });
    expect(solariLargo.options.fields.find((entry) => entry.key === 'flaps')).toMatchObject({ type: 'json', urlKey: 'paletas', editor: 'drum' });
    expect(DEFAULT_PRESET).toBe('rotulado');
    // The Cercanías board is photographed with lettered flaps only.
    expect(solariCercanias.options.fields.some((entry) => entry.key === 'drum')).toBe(false);
  });

  it('prints the plate of a product on a pale flap, and letters the word without it', () => {
    expect(draw('TALGO', { drum: 'rotulado' })).toContain('>TALGO<');
    const printed = draw('TALGO');
    expect(printed).not.toContain('>TALGO<');
    expect(printed).toContain('>Talgo<');
    expect(printed).toContain(PLATE.slice(1));
  });

  it('letters anything the drum has no card for', () => {
    expect(draw('RAP. ARAGON')).toContain('>RAP. ARAGON<');
    expect(plateOf(cardFor(drumOf('largo', options), 'RAP. ARAGON'))).toBeUndefined();
  });

  it('reads the short forms a board writes, and the names a product was renamed to', () => {
    const drum = drumOf('largo', options);
    expect(cardFor(drum, 'INTCITY')).toBe(cardFor(drum, 'INTERCITY'));
    expect(cardFor(drum, 'CERC')).toBe(cardFor(drum, 'CERCANIAS'));
    expect(cardFor(drum, 'MD')).toBe(cardFor(drum, 'MEDIA DISTANCIA'));
    // ADIF's own boards print Euromed as «AVE Eur»; the card is the one it carried as renfe Euromed.
    expect(cardFor(drum, 'AVE EUR')).toBe(cardFor(drum, 'EUROMED'));
  });

  it('gives Regional its own R, and leaves Regional Exprés on the Grandes Líneas strokes', () => {
    // The 1995 photograph shows the R; the 2007 one shows Regional Exprés still on the strokes.
    const regional = draw('REGIONAL', { flaps: [flapKey({ text: 'REGIONAL', identity: 'regionales' })] });
    expect(regional).toContain('#ff6720');
    expect(regional).not.toContain('#0033a0');
    const expres = draw('REGIONAL EXPRES');
    expect(expres).toContain('#0033a0');
    expect(expres).not.toContain('#ff6720');
  });

  it('keeps a product that was reprinted in both of its identities', () => {
    expect(identitiesOf('REGIONAL')).toEqual(['regionales', 'renfe']);
    expect(plateFor('REGIONAL', 'regionales')).not.toBe(plateFor('REGIONAL', 'renfe'));
    expect(plateFor('TRD', 'renfe')).toBeUndefined();
  });

  it('keeps what a photograph of this board shows apart from what was drawn to match', () => {
    expect(SEEN.every((key) => identitiesOf(key).length > 0)).toBe(true);
    expect(RECONSTRUCTED).not.toContain('TALGO');
    expect(RECONSTRUCTED).toContain('AVE');
  });
});

describe('Solari drums', () => {
  const options = (over: Record<string, unknown> = {}) => ({ surround: false, drum: DEFAULT_PRESET, flaps: [], animate: false, speed: 14, ...over });

  it('starts every drum on a blank card', () => {
    for (const preset of PRESETS) expect(drumOf('largo', options({ drum: preset.id }))[0]).toBe('');
  });

  it('carries only what the 2007 photograph shows, so it cannot turn onto a later train', () => {
    const drum = drumOf('largo', options({ drum: '2007' }));
    expect(drum.slice(1).map(textOf).sort()).toEqual(['ALTARIA', 'INTERCITY', 'REGIONAL EXPRES', 'TALGO', 'TRD']);
    // Avlo did not run until long after this board was photographed.
    expect(drum.some((card) => textOf(card) === 'AVLO')).toBe(false);
    expect(drum).toContain(flapKey({ text: 'TRD', identity: 'grandes-lineas' }));
    expect(drum).toContain(flapKey({ text: 'TALGO', identity: 'renfe' }));
  });

  it('letters a train the drum has no card for rather than inventing one', () => {
    const drum = drumOf('largo', options({ drum: '2007' }));
    expect(cardFor(drum, 'AVLO')).toBe('AVLO');
    expect(plateOf(cardFor(drum, 'AVLO'))).toBeUndefined();
  });

  it('turns the lettered words of the seventies by default', () => {
    const drum = drumOf('largo', options());
    expect(drum).toContain('TALGO PENDULAR');
    expect(drum.every((card) => plateOf(card) === undefined)).toBe(true);
  });

  it('takes a drum built by hand over the preset', () => {
    const own = [flapKey({ text: 'AVE', identity: 'propia' })];
    expect(drumOf('largo', options({ drum: '2007', flaps: own })).slice(1)).toEqual(own);
  });

  it('keeps the drum of the tick box this setting began as', () => {
    // ?logos=1 printed every plate there was; its URLs keep that drum.
    const legacy = drumOf('largo', options({ logos: true }));
    expect(legacy.some((card) => textOf(card) === 'AVLO')).toBe(true);
    expect(drumOf('largo', options({ logos: true, drum: '2007' })).slice(1).map(textOf).sort()).toEqual(['ALTARIA', 'INTERCITY', 'REGIONAL EXPRES', 'TALGO', 'TRD']);
  });

  it('letters a card whose identity this board never printed', () => {
    expect(parseFlap('TRD@renfe')).toEqual({ text: 'TRD@renfe', identity: 'rotulado' });
    expect(parseFlap('TRD@grandes-lineas')).toEqual({ text: 'TRD', identity: 'grandes-lineas' });
  });

  it('offers every card that can be added by hand, each identity of each product', () => {
    const all = offered('largo');
    expect(all).toContain(flapKey({ text: 'REGIONAL', identity: 'regionales' }));
    expect(all).toContain(flapKey({ text: 'REGIONAL', identity: 'renfe' }));
    expect(all).toContain('TALGO PENDULAR');
    expect(new Set(all).size).toBe(all.length);
  });
});
