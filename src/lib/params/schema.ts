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
  /**
   * Keys of settings that choosing another value puts back to their defaults:
   * the station of a live source means nothing once another operator's feed
   * is picked. Only the form does this, so a URL that states both is read as
   * it is written.
   */
  resets?: string[];
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

/**
 * A checkbox in the form that is not a setting itself: it turns a few other
 * settings on and off together ("dead pixels": the two stuck-dot amounts).
 * It has no value and no place in a URL, so settings saved before the switch
 * existed mean exactly what they did.
 *
 * It reads as on when any setting it controls differs from its default.
 * Turning it off puts them back to their defaults and disables their
 * controls; turning it on restores what they last were, or `on` the first
 * time.
 */
export interface SwitchField {
  type: 'switch';
  /** Only identifies the control within the form. */
  key: string;
  label: string;
  help?: string;
  group?: string;
  hidden?: boolean;
  /** Keys of the settings it drives. */
  controls: string[];
  /** Their values when first switched on. */
  on: Values;
}

/** A field that holds a value. */
export type SettingField = TextField | NumberField | BooleanField | ColorField | SelectField | LookupField | JsonField;

export type Field = SettingField | SwitchField;

export interface ParamSchema {
  fields: Field[];
  /**
   * `layout: 'row'` draws a group as one row of a table, its fields side by
   * side under headings shared with the neighbouring row groups: for things
   * that repeat, such as the lines of a board.
   */
  groups?: { id: string; label: string; layout?: 'row' }[];
}

export type Values = Record<string, unknown>;

/** The fields of a schema that hold values, leaving out form-only controls. */
export function settingsOf(schema: ParamSchema): SettingField[] {
  return schema.fields.filter((field): field is SettingField => field.type !== 'switch');
}

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
