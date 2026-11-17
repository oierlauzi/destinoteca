import type { ReplicaImpl } from '../types';
import type { SinLedFrame, SinLedOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const impl: ReplicaImpl<SinLedFrame, SinLedOptions> = { present, blank, renderToString, mount };

export default impl as unknown as ReplicaImpl;
