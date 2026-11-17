import type { ReplicaImpl } from '../types';
import type { IkusiFrame, IkusiOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const impl: ReplicaImpl<IkusiFrame, IkusiOptions> = { present, blank, renderToString, mount };

export default impl as unknown as ReplicaImpl;
