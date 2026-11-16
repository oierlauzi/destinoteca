import { cp437 } from './cp437';
import { telenormaCp437 } from './telenorma-cp437';
import type { Charset } from './types';

const CHARSETS: Record<string, Charset> = { [cp437.id]: cp437, [telenormaCp437.id]: telenormaCp437 };

/** A code page by id, for settings that name one (which glyphs a text field can offer). */
export function getCharset(id: string): Charset | undefined {
  return CHARSETS[id];
}
