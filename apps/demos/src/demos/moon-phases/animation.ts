import { normalizeAngle } from "./logic";

export function degreesPerSecondFromSpeed(
  speed: number,
  synodicMonthDays: number
): number {
  return (360 / synodicMonthDays) * speed;
}

export function nextAngleDeg(params: {
  angleDeg: number;
  deltaSeconds: number;
  speed: number;
  synodicMonthDays: number;
}): number {
  const { angleDeg, deltaSeconds, speed, synodicMonthDays } = params;
  const degreesPerSecond = degreesPerSecondFromSpeed(speed, synodicMonthDays);
  return normalizeAngle(angleDeg + degreesPerSecond * deltaSeconds);
}
