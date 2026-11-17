import type { Values } from '../../params';
import type { Frame, ReplicaImpl } from '../types';
import { fromFlat, toFlat, type CercaniasOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const options = (values: Values) => values as CercaniasOptions;

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
