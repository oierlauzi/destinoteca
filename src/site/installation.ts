import { memberOptions } from '@/lib/installations/layout';
import { composeSvg } from '@/lib/installations/render';
import type { ReplicaMember, ResolvedInstallation } from '@/lib/installations/types';
import { select } from '@/lib/model';
import { getReplica } from '@/lib/replicas/registry';
import type { Frame, Presentation } from '@/lib/replicas/types';
import { buildDemoBoard, demoSnapshot, networkOf } from '@/lib/sources/demo/index';

/** The moment every still image of an installation shows: a weekday morning, with the second hand clear of the 12. */
const STILL_AT = Date.UTC(2026, 0, 14, 8, 45, 32);

const firstFrame = (presentation: Presentation): Frame => {
  const pages = (presentation as { pages?: { frame: Frame }[] }).pages;
  return Array.isArray(pages) ? (pages[0]?.frame ?? {}) : (presentation as Frame);
};

/** Which network the simulation stands in for on this installation: the one its first board asks for. */
export function demoNetwork(installation: ResolvedInstallation): string | undefined {
  for (const member of installation.members) {
    if (member.kind !== 'replica') continue;
    const network = getReplica(member.replica)?.sourceDefaults?.demo?.network;
    if (network !== undefined) return String(network);
  }
  return undefined;
}

/**
 * Each display of an installation as its own replica draws it, at one moment of
 * the simulation, by member id: boards of a series carry on from one another.
 */
export async function drawMembers(installation: ResolvedInstallation): Promise<Map<string, string>> {
  const network = networkOf(demoNetwork(installation));
  const snapshot = demoSnapshot(network, buildDemoBoard(network, 3, STILL_AT), STILL_AT);
  const drawn = new Map<string, string>();
  for (const member of installation.members.filter((m): m is ReplicaMember => m.kind === 'replica')) {
    const def = getReplica(member.replica);
    if (!def) continue;
    const impl = await def.load();
    const options = memberOptions(def, member.params);
    const view = select(snapshot, def.selection(options), { platforms: member.platforms, cycle: false, skip: member.skip }, STILL_AT);
    // A display that announces no trains (a clock) always has something to show.
    const shows = view.services.length > 0 || !def.reads.includes('services');
    const frame = firstFrame(shows ? impl.present(view, options) : impl.blank(view, options));
    drawn.set(member.id, impl.renderToString(frame, options));
  }
  return drawn;
}

/** An installation as one SVG file: the still image on cards, and what the page shows before its code arrives. */
export async function installationSvg(installation: ResolvedInstallation, title: string): Promise<string> {
  return composeSvg(installation, await drawMembers(installation), title);
}
