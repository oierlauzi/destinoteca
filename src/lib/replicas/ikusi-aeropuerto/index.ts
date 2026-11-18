import type { View } from '../../model';
import type { Values } from '../../params';
import type { Frame, ReplicaImpl } from '../types';
import { fromFlat, toFlat, type AirportOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const options = (values: Values) => values as AirportOptions;

const impl: ReplicaImpl = {
  present: (view: View, values: Values) => toFlat(present(view, options(values))),
  blank: (view: View) => toFlat(blank(view)),
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
