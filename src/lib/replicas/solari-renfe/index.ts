import type { Values } from '../../params';
import type { Frame, ReplicaImpl } from '../types';
import { fromFlat, toFlat, type SolariOptions } from './def';
import type { Variant } from './geometry';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const options = (values: Values) => values as SolariOptions;

/** The code of one of the two variants. */
export function implementation(variant: Variant): ReplicaImpl {
  return {
    present: (view) => toFlat(present(variant, view)),
    blank: () => toFlat(blank(variant)),
    renderToString: (frame: Frame, values: Values) => renderToString(variant, fromFlat(variant, frame), options(values)),
    mount(host, values, env) {
      const mounted = mount(variant, host, options(values), env);
      return {
        setFrame: (frame: Frame) => mounted.setFrame(fromFlat(variant, frame)),
        setOptions: (next: Values) => mounted.setOptions(options(next)),
        destroy: () => mounted.destroy(),
      };
    },
  };
}
