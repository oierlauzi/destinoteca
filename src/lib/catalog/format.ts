const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** A date known to the year, the month or the day (`1997`, `1997-03`, `1997-03-15`), in Spanish. */
export function formatPartialDate(date: string): string {
  const [year, month, day] = date.split('-');
  const name = month ? MONTHS[Number(month) - 1] : undefined;
  if (!name) return year ?? date;
  return day ? `${Number(day)} de ${name} de ${year}` : `${name} de ${year}`;
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

/**
 * The little Markdown that short frontmatter texts (captions, notes) may use:
 * `*emphasis*` and `` `code` ``. Everything else is escaped, so the result is
 * safe to insert as HTML.
 */
export function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*([^*\s][^*]*?)\*/g, '<em>$1</em>');
}
