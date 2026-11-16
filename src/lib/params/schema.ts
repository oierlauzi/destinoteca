/**
 * Declarative description of a set of settings.
 *
 * Sources, replicas and placements each describe their settings with one of
 * these, and three things are derived from it: the form the visitor fills in,
 * the query string of an embed or permalink, and validation of whatever comes
 * back from that query string. So adding a replica or a source needs no UI
 * code of its own.
 *
 * This is plain data. Labels are i18n keys, resolved by whoever draws the form.
 */

interface FieldBase {
  /** Property name in the values object. */
  key: string;
  /** Query-string name. Defaults to `key`. Part of the public embed contract: never rename. */
  urlKey?: string;
  /** i18n key. */
  label: string;
  /** i18n key of a longer explanation. */
  help?: string;
  /** Id of one of the schema's groups. */
  group?: string;
  /** Kept in the URL but not offered in the form (set by another field, or legacy). */
  hidden?: boolean;
}

export interface TextField extends FieldBase {
  type: 'text';
  default: string;
  maxLength?: number;
  placeholder?: string;
  /** Id of a charset (hardware/fonts/charsets.ts) whose untypeable glyphs to offer in a picker. */
  glyphs?: string;
}

export interface NumberField extends FieldBase {
  type: 'number' | 'range';
  default: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Offer a button that rolls a new whole number: for seeds. */
  shuffle?: boolean;
}

export interface BooleanField extends FieldBase {
  type: 'boolean';
  default: boolean;
}

export interface Choice {
  value: string;
  /** i18n key, or literal text when `literal` is set on the field. */
  label: string;
}

export interface ColorField extends FieldBase {
  type: 'color';
  /** `#rrggbb`. Travels in the URL without the hash. */
  default: string;
  /** Period-correct choices. Any other colour is still accepted from a URL. */
  choices?: Choice[];
}

export interface SelectField extends FieldBase {
  type: 'select';
  default: string;
  choices: Choice[];
  literal?: boolean;
}

/** A value picked by searching, such as a station. The owner supplies the search. */
export interface LookupField extends FieldBase {
  type: 'lookup';
  default: string;
  /** Name of the lookup the owning source or replica provides. */
  lookup: string;
  placeholder?: string;
}

/** Structured data too big for one key per field (a list of services). Base64url JSON in the URL. */
export interface JsonField extends FieldBase {
  type: 'json';
  default: unknown;
  /** Which editor draws it. */
  editor: string;
}

export type Field = TextField | NumberField | BooleanField | ColorField | SelectField | LookupField | JsonField;

export interface ParamSchema {
  fields: Field[];
  groups?: { id: string; label: string }[];
}

export type Values = Record<string, unknown>;

/** One result of a lookup search. */
export interface LookupItem {
  value: string;
  label: string;
  detail?: string;
  url?: string;
  /** Other settings to set along with this one (a station brings its network). */
  set?: Values;
}

/** Search behind a `lookup` field. */
export interface Lookup {
  search(query: string, limit?: number, values?: Values): LookupItem[];
  resolve(value: string, values?: Values): LookupItem | undefined;
  /** Whether a typed value with no match may still be used. */
  accepts?(value: string): boolean;
}
