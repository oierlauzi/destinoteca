import type { Placement } from '../model';
import { decode, defaults, encode, type ParamSchema, type Values } from '../params';
import type { ReplicaDef } from '../replicas/types';
import { getSource } from '../sources/registry';

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

/** Where the unit hangs. The same for every replica that takes a board. */
export const placementSchema: ParamSchema = {
  fields: [
    { key: 'platforms', urlKey: 'via', type: 'text', label: 'player.placement.platforms', help: 'player.placement.platforms.help', default: '', maxLength: 12 },
    { key: 'cycle', type: 'boolean', label: 'player.placement.cycle', default: true },
  ],
};

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
 * carry no `source`: those with a station were live, the rest hand-typed.
 */
function modeOf(def: ReplicaDef, query: URLSearchParams): string {
  const asked = query.get('source');
  if (asked && (asked === RAW || getSource(asked))) return asked === RAW && !def.frame ? 'demo' : asked;
  if (def.accepts === 'board' && query.get('station')) return 'mitren';
  return def.frame ? RAW : 'demo';
}

export function readConfig(def: ReplicaDef, query: URLSearchParams): PlayerConfig {
  const source = modeOf(def, query);
  const sourceDef = source === RAW ? undefined : getSource(source);
  return {
    source,
    sourceConfig: sourceDef ? decode(sourceDef.config, query) : {},
    placement: toPlacement(decode(placementSchema, source === RAW ? new URLSearchParams() : query)),
    options: decode(def.options, query),
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
    if (sourceDef) encode(sourceDef.config, config.sourceConfig, query);
    encode(placementSchema, fromPlacement(config.placement), query);
  }
  encode(def.options, config.options, query);
  return query;
}

export function defaultConfig(def: ReplicaDef, source: string): PlayerConfig {
  const sourceDef = source === RAW ? undefined : getSource(source);
  return {
    source,
    sourceConfig: sourceDef ? defaults(sourceDef.config) : {},
    placement: { platforms: [], cycle: true },
    options: defaults(def.options),
    frame: def.frame ? defaults(def.frame) : {},
  };
}
