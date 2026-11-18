import type { Values } from '../../params';
import type { Frame, ReplicaImpl } from '../types';
import { fromFlat, toFlat, type AvisosOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

/** Frames cross the replica's boundary flat (l1, l2, l3), as a form and a URL hold them. */
const options = (values: Values) => values as AvisosOptions;

const impl: ReplicaImpl = {
  present: (view) => toFlat(present(view)),
  blank: () => toFlat(blank()),
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
