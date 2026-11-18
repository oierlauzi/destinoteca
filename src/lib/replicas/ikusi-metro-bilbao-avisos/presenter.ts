import { text, type Notice, type Text, type View } from '../../model';
import { CHARS, LINES, type AvisosFrame } from './def';

/** A text in one language only, or nothing if it has none in it. */
const only = (value: Text, lang: string): string => (typeof value === 'string' ? '' : (value[lang] ?? ''));

/** Each notice in every language it has, Basque first. */
const languages = (notice: Notice): string[] => {
  const eu = only(notice.text, 'eu');
  const es = text(notice.text, 'es');
  return eu && eu !== es ? [eu, es] : [es];
};

/** The running row: texts between asterisks, as photographed («** NORAKOA… **»). */
const run = (texts: string[]): string => (texts.length ? `** ${texts.join(' ** ')} **` : '');

export function blank(): AvisosFrame {
  return { lines: Array.from({ length: LINES }, () => '') };
}

/**
 * The first notice on the two upper rows, in Basque and in Spanish when it
 * fits them; whatever does not, and every other notice, runs on the third.
 */
export function present(view: View): AvisosFrame {
  const [first, ...others] = view.notices;
  if (!first) return blank();
  const texts = languages(first);
  const fits = texts.every((value) => value.length <= CHARS);
  const rest = others.flatMap(languages);
  if (fits) return { lines: [texts[0] ?? '', texts[1] ?? '', run(rest)] };
  return { lines: ['', '', run([...texts, ...rest])] };
}
