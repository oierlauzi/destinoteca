import type { ReplicaImpl } from '../types';
import type { EuskotrenFrame, EuskotrenOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const impl: ReplicaImpl<EuskotrenFrame, EuskotrenOptions> = { present, blank, renderToString, mount };

export default impl as unknown as ReplicaImpl;
