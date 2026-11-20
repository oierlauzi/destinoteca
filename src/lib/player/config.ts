import type { Placement, SelectionPolicy } from '../model';
import { decode, defaults, encode, onlyAbout, type ParamSchema, type Values } from '../params';
import type { ReplicaDef } from '../replicas/types';
import { getSource, sourcesFor } from '../sources/registry';
import { sharesData, type DataKind, type SourceDef } from '../sources/types';

/**
 * Everything that decides what one replica shows, as it travels in the query
 * string of an embed or a permalink.
 *
 * There are four groups of settings, each with its own schema: the replica's
 * appearance (`options`), where the unit hangs (`placement`), and then either
 * a hand-typed frame (`raw` mode) or a data source and its own settings.
 */
export interface PlayerConfig {
  /** `raw`: the frame is typed by hand. Otherwise the id of a data source. */
  source: string;
  sourceConfig: Values;
  placement: Placement;
  options: Values;
  frame: Values;
}

export const RAW = 'raw';

/**
 * Where the unit hangs. The same for every replica that takes a board, save
 * for one default: a unit that serves one platform starts by holding its next
 * train, which is what someone waiting there looks for, and stepping through
 * the ones behind it is a setting to turn on. A board that serves the whole
 * station steps through from the start.
 */
export function placementSchemaFor(policy: SelectionPolicy): ParamSchema {
  return {
    fields: [
      { key: 'platforms', urlKey: 'via', type: 'text', label: 'player.placement.platforms', help: 'player.placement.platforms.help', default: '', maxLength: 12 },
      { key: 'cycle', type: 'boolean', label: 'player.placement.cycle', default: policy.platforms !== 'one' },
    ],
  };
}

/**
 * Whoever a source is being read for: one replica, or the displays of an
 * installation between them. A `ReplicaDef` is one.
 */
export interface DataReader {
  /** The kinds of data it can show. */
  reads: readonly DataKind[];
  /** Settings of a source that suit it better than the source's own defaults, by source id. */
  sourceDefaults?: Record<string, Values>;
}

/** Whether this source knows anything the reader can show. */
export const sourceFits = (reader: DataReader, source: SourceDef): boolean => sharesData(source.provides, reader.reads);

/**
 * A source's settings as this reader wants them: only those it can use (a
 * clock is asked the board's time, not which trains to announce), with the
 * defaults it prefers (a long-distance board starts the demo on long-distance
 * trains). Only defaults change, so a URL that states a value keeps it.
 */
export function sourceSchema(reader: DataReader, source: SourceDef): ParamSchema {
  const schema = onlyAbout(source.config, reader.reads);
  const overrides = reader.sourceDefaults?.[source.id];
  if (!overrides) return schema;
  return {
    ...schema,
    fields: schema.fields.map((field) =>
      field.type !== 'switch' && field.key in overrides ? ({ ...field, default: overrides[field.key] } as typeof field) : field,
    ),
  };
}

/** The size of a replica with these options. */
export const replicaSize = (def: ReplicaDef, options: Values): { width: number; height: number } => def.size?.(options) ?? def.viewBox;

function toPlacement(values: Values): Placement {
  const platforms = String(values.platforms ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  return { platforms, cycle: values.cycle !== false };
}

const fromPlacement = (placement: Placement): Values => ({ platforms: placement.platforms.join(','), cycle: placement.cycle });

/**
 * Which mode a query string asks for. Embeds made for the original replica
 * carry no `source`: those with a station were live, the rest hand-typed. A
 * source that has nothing this display can show (a train feed named in an
 * older link to a clock) gives way to the one it would have started on.
 */
function modeOf(def: ReplicaDef, query: URLSearchParams): string {
  // What it shows with nothing asked for: its own language where it has one,
  // else the first source that suits it.
  const start = (): string => (def.frame ? RAW : (sourcesFor(def.reads)[0]?.id ?? RAW));
  const asked = query.get('source');
  if (asked === RAW) return start();
  const source = asked ? getSource(asked) : undefined;
  if (source) return sourceFits(def, source) ? source.id : start();
  const mitren = getSource('mitren');
  if (mitren && sourceFits(def, mitren) && query.get('station')) return mitren.id;
  return start();
}

export function readConfig(def: ReplicaDef, query: URLSearchParams): PlayerConfig {
  const source = modeOf(def, query);
  const sourceDef = source === RAW ? undefined : getSource(source);
  // The appearance is read first: what kind of unit this is, and so what its
  // placement says with nothing asked for, follows from it.
  const options = decode(def.options, query);
  const placement = placementSchemaFor(def.selection(options));
  return {
    source,
    sourceConfig: sourceDef ? decode(sourceSchema(def, sourceDef), query) : {},
    placement: toPlacement(decode(placement, source === RAW ? new URLSearchParams() : query)),
    options,
    frame: def.frame ? decode(def.frame, source === RAW ? query : new URLSearchParams()) : {},
  };
}

/** The shortest query string that reproduces a configuration. */
export function writeConfig(def: ReplicaDef, config: PlayerConfig): URLSearchParams {
  const query = new URLSearchParams();
  const sourceDef = config.source === RAW ? undefined : getSource(config.source);
  if (config.source === RAW) {
    if (def.frame) encode(def.frame, config.frame, query);
  } else {
    query.set('source', config.source);
    if (sourceDef) encode(sourceSchema(def, sourceDef), config.sourceConfig, query);
    encode(placementSchemaFor(def.selection(config.options)), fromPlacement(config.placement), query);
  }
  encode(def.options, config.options, query);
  return query;
}

export function defaultConfig(def: ReplicaDef, source: string): PlayerConfig {
  const sourceDef = source === RAW ? undefined : getSource(source);
  const options = defaults(def.options);
  return {
    source,
    sourceConfig: sourceDef ? defaults(sourceSchema(def, sourceDef)) : {},
    placement: toPlacement(defaults(placementSchemaFor(def.selection(options)))),
    options,
    frame: def.frame ? defaults(def.frame) : {},
  };
}
