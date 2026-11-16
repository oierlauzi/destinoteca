import type { ReplicaImpl } from '../types';
import type { ContinuoFrame, ContinuoOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const impl: ReplicaImpl<ContinuoFrame, ContinuoOptions> = { present, blank, renderToString, mount };

export default impl as unknown as ReplicaImpl;
