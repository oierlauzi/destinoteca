import type { View } from '../../model';
import { present as presentWithLed } from '../page-iberica-anden-electromagnetico/presenter';
import type { SinLedFrame, SinLedOptions } from './def';

/** A sign with nothing to announce goes dark. */
export function blank(): SinLedFrame {
  return { text: '', minutes: '' };
}

/** The same line as the sign with the LED row, which has the same 16 characters, less what went on that row. */
export function present(view: View, options: SinLedOptions): SinLedFrame {
  const { text, minutes } = presentWithLed(view, options);
  return { text, minutes };
}
