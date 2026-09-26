import * as THREE from 'three';
import type { PlayerRole } from '../multiplayer/NetworkState';

export const Phase6RouteId = {
  shared: 'route_shared',
  host: 'route_player_A',
  guest: 'route_player_B',
  hostRejoin: 'route_player_A_rejoin',
  guestRejoin: 'route_player_B_rejoin',
  final: 'route_reunited_gate'
} as const;

export type Phase6RouteId = typeof Phase6RouteId[keyof typeof Phase6RouteId];

const curve = (points: [number, number, number][]) => new THREE.CatmullRomCurve3(
  points.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'catmullrom', 0.5
);

// The first point is the Phase 5 tower threshold. All branches share their
// junction point, so changing routeId never teleports a lantern.
export const PHASE6_ROUTES: Record<Phase6RouteId, THREE.CatmullRomCurve3> = {
  [Phase6RouteId.shared]: curve([
    [90, -0.25, -23.2], [91, -0.25, -30], [101, -0.2, -35],
    [113, -0.1, -40], [123, 0, -47], [136, 0, -54]
  ]),
  // Route A (Host): Curves toward the locked Inner Gate approach
  [Phase6RouteId.host]: curve([
    [136, 0, -54], [146, 0, -58], [158, 0, -67], [168, 0, -78]
  ]),
  // Route B (Guest): Curves deep into the serene, secluded Moon Alcove
  [Phase6RouteId.guest]: curve([
    [136, 0, -54], [132, 0, -68], [128, 0, -82], [132, 0, -94]
  ]),
  // Host rejoin: From gate discovery threshold toward rendezvous
  [Phase6RouteId.hostRejoin]: curve([
    [168, 0, -78], [163, 0, -80], [158, 0, -82]
  ]),
  // Guest rejoin: Out of Moon Alcove toward rendezvous
  [Phase6RouteId.guestRejoin]: curve([
    [132, 0, -94], [142, 0, -90], [152, 0, -85], [158, 0, -82]
  ]),
  // Final route: Reunited walk from rendezvous to Inner Gate
  [Phase6RouteId.final]: curve([
    [158, 0, -82], [163, 0, -82.3], [168, 0, -82.7], [173, 0, -83]
  ])
};

export const ELDER_PROGRESS = 0.58;
export const SEPARATION_PROGRESS = 0.96;
export const INNER_GATE_POSITION = new THREE.Vector3(176, 0, -83);

export function splitRoute(role: PlayerRole): Phase6RouteId {
  return role === 'host' ? Phase6RouteId.host : Phase6RouteId.guest;
}

export function rejoinRoute(role: PlayerRole): Phase6RouteId {
  return role === 'host' ? Phase6RouteId.hostRejoin : Phase6RouteId.guestRejoin;
}

export function pointOnRoute(routeId: Phase6RouteId, progressT: number): THREE.Vector3 {
  return PHASE6_ROUTES[routeId].getPointAt(THREE.MathUtils.clamp(progressT, 0, 1));
}
