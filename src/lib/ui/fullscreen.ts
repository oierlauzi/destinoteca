/**
 * Full screen for one element, with a CSS stand-in where the Fullscreen API
 * is missing or refused (iPhones, some embeds). Clicking the element or
 * pressing Escape leaves it.
 */
interface Legacy {
  webkitRequestFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitFullscreenElement?: Element | null;
}

const FAKE = 'is-fake-fullscreen';

export function setupFullscreen(target: HTMLElement, onChange: (active: boolean) => void): { toggle(): void } {
  const doc = target.ownerDocument as Document & Legacy;
  const native = (): boolean => (doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null) === target;
  const active = (): boolean => native() || target.classList.contains(FAKE);
  const report = (): void => onChange(active());

  const leave = (): void => {
    if (native()) void (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
    target.classList.remove(FAKE);
    report();
  };
  const enter = (): void => {
    const el = target as HTMLElement & Legacy;
    const fake = (): void => {
      target.classList.add(FAKE);
      report();
    };
    try {
      if (el.requestFullscreen) el.requestFullscreen().catch(fake);
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else fake();
    } catch {
      fake();
    }
  };

  doc.addEventListener('fullscreenchange', report);
  doc.addEventListener('webkitfullscreenchange', report);
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && target.classList.contains(FAKE)) leave();
  });
  target.addEventListener('click', () => {
    if (active()) leave();
  });
  return { toggle: () => (active() ? leave() : enter()) };
}
