/**
 * The ids of every replica, without loading any of them. Catalog entries are
 * validated against this list. Ids end up in embed URLs on other people's
 * pages, so one is never renamed or reused.
 */
export const REPLICA_IDS = ['page-iberica-anden-electromagnetico'] as const;

export type ReplicaId = (typeof REPLICA_IDS)[number];

export function isReplicaId(id: string): id is ReplicaId {
  return (REPLICA_IDS as readonly string[]).includes(id);
}
