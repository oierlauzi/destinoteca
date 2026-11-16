import type { ReplicaImpl } from '../types';
import type { AndenFrame, AndenOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const impl: ReplicaImpl<AndenFrame, AndenOptions> = { present, blank, renderToString, mount };

export default impl as unknown as ReplicaImpl;
