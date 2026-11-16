/**
 * Loading code on demand from a site that gets redeployed.
 *
 * A static host keeps serving a visitor the page they already have for a
 * while (GitHub Pages: ten minutes), but a deploy replaces the code files
 * that page would fetch later, under new names. The fetch then fails through
 * no fault of the visitor's. Reloading gets the current page, whose files do
 * exist, so that is what happens, once: if loading fails again straight after
 * a reload, something else is wrong and the error is passed on.
 */
// One flag per thing loaded: another piece loading fine after the reload says
// nothing about this one, and must not re-arm it.
const flag = (what: string): string => `destinoteca-reloaded:${what}`;

interface Env {
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  reload?: () => void;
}

function browserEnv(): Env {
  try {
    return { storage: globalThis.sessionStorage, reload: () => globalThis.location.reload() };
  } catch {
    // No session storage (blocked, or not a browser): no way to tell a second
    // failure from a first, so never reload.
    return {};
  }
}

/**
 * Runs a dynamic import. On failure, reloads the page once and never
 * resolves (the page is going away); on a failure right after such a reload,
 * rejects.
 */
export async function loadFresh<T>(what: string, load: () => Promise<T>, env: Env = browserEnv()): Promise<T> {
  try {
    const loaded = await load();
    try {
      env.storage?.removeItem(flag(what));
    } catch {
      // Storage that cannot be written to only costs the automatic recovery.
    }
    return loaded;
  } catch (error) {
    let alreadyTried = true;
    try {
      alreadyTried = !env.storage || !env.reload || env.storage.getItem(flag(what)) !== null;
      if (!alreadyTried) env.storage!.setItem(flag(what), '1');
    } catch {
      alreadyTried = true;
    }
    if (alreadyTried) throw error;
    env.reload!();
    return new Promise<T>(() => {});
  }
}
