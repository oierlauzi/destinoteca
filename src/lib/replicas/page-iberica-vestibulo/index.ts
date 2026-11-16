import type { View } from '../../model';
import type { Values } from '../../params';
import type { Frame, ReplicaImpl } from '../types';
import { fromFlat, toFlat, type VestibuloOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

/**
 * The code of a concourse board of `lines` lines. Frames cross the
 * replica's boundary flat (via1, dest1, min1...), as a form and a URL hold
 * them; inside, they are rows.
 */
export function implementation(lines: number, nextArrival = true): ReplicaImpl {
  const shape = { lines, nextArrival };
  const options = (values: Values) => values as VestibuloOptions;
  return {
    present: (view: View, values: Values) => toFlat(present(view, options(values), lines)),
    blank: (view: View, values: Values) => toFlat(blank(view, options(values), lines)),
    renderToString: (frame: Frame, values: Values) => renderToString(shape, fromFlat(lines, frame), options(values)),
    mount(host, values, env) {
      const mounted = mount(shape, host, options(values), env);
      return {
        setFrame: (frame: Frame) => mounted.setFrame(fromFlat(lines, frame)),
        setOptions: (next: Values) => mounted.setOptions(options(next)),
        destroy: () => mounted.destroy(),
      };
    },
  };
}
