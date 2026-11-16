/**
 * Static paths for a collection whose entries can leave redirects behind: one
 * page per entry, plus one per former id pointing at the entry that had it.
 */
export function pathsWithAliases(entries: { id: string; data: { aliases: string[] } }[]) {
  return entries.flatMap((entry) => [
    { params: { id: entry.id }, props: { id: entry.id, alias: false } },
    ...entry.data.aliases.map((alias) => ({ params: { id: alias }, props: { id: entry.id, alias: true } })),
  ]);
}

export interface AliasProps {
  /** The entry's current id. */
  id: string;
  /** Whether this page stands at a former id and should only redirect. */
  alias: boolean;
}
