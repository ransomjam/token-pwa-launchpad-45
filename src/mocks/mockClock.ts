// Simple mock clock helpers for countdown simulations
let driftMs = 0;

export function mockNow(): number {
  return Date.now() + driftMs;
}

export function addMinutes(mins: number) {
  driftMs += mins * 60_000;
}

export function resetClock() {
  driftMs = 0;
}