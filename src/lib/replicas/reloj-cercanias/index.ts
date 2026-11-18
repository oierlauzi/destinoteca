import type { View } from '../../model';
import type { ReplicaImpl } from '../types';
import type { RelojCercaniasFrame, RelojCercaniasOptions } from './def';
import { mount, renderToString } from './render';

/**
 * Whatever the board says, a clock shows the station's time. A view at the
 * epoch is the page drawn before any clock runs: it rests at 10:10.
 */
const timeOf = (view: View): RelojCercaniasFrame => (view.now ? { time: view.now, zone: view.timeZone } : {});

const impl: ReplicaImpl<RelojCercaniasFrame, RelojCercaniasOptions> = { present: timeOf, blank: timeOf, renderToString, mount };

export default impl as unknown as ReplicaImpl;
