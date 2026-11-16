import type { ReplicaImpl } from '../types';
import type { AndenAtochaFrame, AndenAtochaOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const impl: ReplicaImpl<AndenAtochaFrame, AndenAtochaOptions> = { present, blank, renderToString, mount };

export default impl as unknown as ReplicaImpl;
