/*
 * Entries that were taken out of the archive and moved to «Por documentar»
 * (src/texts/es/pendientes.md) because too little was known about them. Their
 * addresses may be linked from elsewhere, so each id keeps a page that sends
 * the visitor to its section there. An id here must not be reused by an entry
 * or an alias; if the equipment comes back as an entry, give it this id again
 * and remove the line.
 */
export const MOVED_TO_BACKLOG: Readonly<Record<string, string>> = {
  /** The section's anchor on the «Por documentar» page. */
  'page-iberica-vestibulo-atocha': 'panel-del-vestíbulo-de-atocha-cercanías',
};
