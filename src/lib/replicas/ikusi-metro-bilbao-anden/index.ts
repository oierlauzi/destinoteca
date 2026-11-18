import type { View } from '../../model';
import type { Values } from '../../params';
import type { Frame, ReplicaImpl } from '../types';
import { fromFlat, toFlat, type BilbaoOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

/** Frames cross the replica's boundary flat (dest1, par1, min1...), as a form and a URL hold them; inside, they are rows. */
const options = (values: Values) => values as BilbaoOptions;

const impl: ReplicaImpl = {
  present: (view: View, values: Values) => toFlat(present(view, options(values))) as Frame,
  blank: (view: View) => toFlat(blank(view)) as Frame,
  renderToString: (frame: Frame, values: Values) => renderToString(fromFlat(frame), options(values)),
  mount(host, values, env) {
    const mounted = mount(host, options(values), env);
    return {
      setFrame: (frame: Frame) => mounted.setFrame(fromFlat(frame)),
      setOptions: (next: Values) => mounted.setOptions(options(next)),
      destroy: () => mounted.destroy(),
    };
  },
};

export default impl;
