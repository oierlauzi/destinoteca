import type { Values } from '../../params';
import type { Frame, ReplicaImpl } from '../types';
import type { AndenFrame, AndenOptions } from './def';
import type { Kind } from './geometry';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const options = (values: Values) => values as AndenOptions;
const frameOf = (values: Frame): AndenFrame => ({
  time: String(values.time ?? ''),
  train: String(values.train ?? ''),
  destination: String(values.destination ?? ''),
  line: String(values.line ?? ''),
  platform: String(values.platform ?? ''),
  clock: typeof values.clock === 'number' ? values.clock : undefined,
  zone: typeof values.zone === 'string' ? values.zone : undefined,
});
const flat = (frame: AndenFrame): Frame => Object.fromEntries(Object.entries(frame).filter(([, value]) => value !== undefined)) as Frame;

/** The code of one of the three models. */
export function implementation(kind: Kind): ReplicaImpl {
  return {
    present: (view) => flat(present(view)),
    blank: (view) => flat(blank(view)),
    renderToString: (frame, values) => renderToString(kind, frameOf(frame), options(values)),
    mount(host, values, env) {
      const mounted = mount(kind, host, options(values), env);
      return {
        setFrame: (frame: Frame) => mounted.setFrame(frameOf(frame)),
        setOptions: (next: Values) => mounted.setOptions(options(next)),
        destroy: () => mounted.destroy(),
      };
    },
  };
}
