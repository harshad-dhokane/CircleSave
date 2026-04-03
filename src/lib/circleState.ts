import type { Circle } from '@/types';

type CircleMembershipSnapshot = Pick<Circle, 'currentMembers' | 'maxMembers'>;
type CircleStartSnapshot = Pick<Circle, 'status' | 'currentMembers' | 'maxMembers'>;

export function getCircleSpotsLeft(circle: CircleMembershipSnapshot) {
  return Math.max(circle.maxMembers - circle.currentMembers, 0);
}

export function isCircleFull(circle: CircleMembershipSnapshot) {
  return getCircleSpotsLeft(circle) === 0;
}

export function isCircleReadyToStart(circle: CircleStartSnapshot) {
  return circle.status === 'PENDING' && isCircleFull(circle);
}
