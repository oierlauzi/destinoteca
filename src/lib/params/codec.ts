import { settingsOf, type ParamSchema, type SettingField, type Values } from './schema';

type Field = SettingField;

const urlKey = (field: Field): string => field.urlKey ?? field.key;

export function defaults(schema: ParamSchema): Values {
  const out: Values = {};
  for (const field of settingsOf(schema)) out[field.key] = field.default;
  return out;
}

function clamp(value: number, field: { min?: number; max?: number }): number {
  let out = value;
  if (field.min !== undefined) out = Math.max(field.min, out);
  if (field.max !== undefined) out = Math.min(field.max, out);
  return out;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Reads one field from its query-string form. Anything unusable falls back to the default. */
function parse(field: Field, raw: string): unknown {
  switch (field.type) {
    case 'text':
      return field.maxLength !== undefined ? Array.from(raw).slice(0, field.maxLength).join('') : raw;
    case 'lookup':
      return raw;
    case 'number':
    case 'range': {
      const value = Number(raw);
      return raw.trim() !== '' && Number.isFinite(value) ? clamp(value, field) : field.default;
    }
    case 'boolean':
      return raw !== '0' && raw !== 'false';
    case 'color': {
      const hex = raw.replace(/^#/, '');
      return /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? `#${hex.toLowerCase()}` : field.default;
    }
    case 'select':
      return field.choices.some((choice) => choice.value === raw) ? raw : field.default;
    case 'json':
      try {
        return JSON.parse(fromBase64Url(raw));
      } catch {
        return field.default;
      }
  }
}

function format(field: Field, value: unknown): string {
  switch (field.type) {
    case 'boolean':
      return value ? '1' : '0';
    case 'color':
      return String(value).replace(/^#/, '');
    case 'json':
      return toBase64Url(JSON.stringify(value));
    default:
      return String(value ?? '');
  }
}

/** Values for a schema out of a query string: defaults, overridden by whatever the URL states. */
export function decode(schema: ParamSchema, query: URLSearchParams): Values {
  const out = defaults(schema);
  for (const field of settingsOf(schema)) {
    const raw = query.get(urlKey(field));
    if (raw !== null) out[field.key] = parse(field, raw);
  }
  return out;
}

function same(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Writes values into a query string. Defaults are left out, so that URLs stay
 * short and keep following the defaults if those are ever corrected.
 */
export function encode(schema: ParamSchema, values: Values, into = new URLSearchParams()): URLSearchParams {
  for (const field of settingsOf(schema)) {
    const value = values[field.key];
    if (value === undefined || same(value, field.default)) into.delete(urlKey(field));
    else into.set(urlKey(field), format(field, value));
  }
  return into;
}

/** Brings arbitrary values back within what the schema allows. */
export function sanitize(schema: ParamSchema, values: Values): Values {
  const out = defaults(schema);
  for (const field of settingsOf(schema)) {
    const value = values[field.key];
    if (value === undefined) continue;
    out[field.key] = field.type === 'json' ? value : parse(field, format(field, value));
  }
  return out;
}

/** The query-string names a schema uses, to keep schemas that share a URL from colliding. */
export function urlKeys(schema: ParamSchema): string[] {
  return settingsOf(schema).map(urlKey);
}
