import type { ReplicaImpl } from '../types';
import type { AegFrame, AegOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const impl: ReplicaImpl<AegFrame, AegOptions> = { present, blank, renderToString, mount };

export default impl as unknown as ReplicaImpl;
