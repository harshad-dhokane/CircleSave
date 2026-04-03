export function getCirclePath(circleId: string) {
  return `/circles/${encodeURIComponent(circleId)}`;
}
