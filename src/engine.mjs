// Motion RPG: deterministic prototype rules. No GPS or AI dependencies.
export const EVENTS = Object.freeze([
  { id: "wolf", title: "늑대의 추격", task: "빠른 페이스로 거리를 벌려라", type: "fast", threshold: 7.0, reward: 8 },
  { id: "trail", title: "숨겨진 오솔길", task: "페이스를 낮춰 소리 없이 이동하라", type: "slow", threshold: 8.0, reward: 7 },
  { id: "cache", title: "숲속 보급 상자", task: "탐색 중 보급품을 발견했다", type: "find", threshold: 0, reward: 6 },
  { id: "fog", title: "안개 지대 통과", task: "안정적인 페이스를 유지하라", type: "steady", threshold: 0, reward: 9 },
]);
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

export function newGame() {
  return {
    elapsedMin: 0, distanceM: 0, energy: 100, xp: 0, gold: 0,
    level: 1, successes: 0, attempts: 0, lastEvent: null, history: []
  };
}

function eventPassed(event, pace) {
  if (event.type === "fast") return pace <= event.threshold;
  if (event.type === "slow") return pace >= event.threshold;
  if (event.type === "steady") return pace >= 6.0 && pace <= 9.0;
  return true;
}

// One simulated minute per step. Pace is minutes/km, never a prescription.
export function advanceGame(state, paceInput) {
  const pace = clamp(Number(paceInput), 4, 12);
  if (!Number.isFinite(Number(paceInput))) throw Error("Invalid pace");
  const next = { ...state };
  const event = EVENTS[state.attempts % EVENTS.length];
  const passed = eventPassed(event, pace);
  const gainedXp = passed ? 14 : 5;
  const gainedGold = passed ? event.reward : 0;
  next.elapsedMin += 1;
  next.distanceM = Math.round(next.distanceM + 1000 / pace);
  next.energy = clamp(next.energy + (pace >= 8 ? 3 : pace < 6 ? -5 : -2), 0, 100);
  next.xp += gainedXp;
  next.gold += gainedGold;
  next.level = 1 + Math.floor(next.xp / 100);
  next.attempts += 1;
  if (passed) next.successes += 1;
  next.lastEvent = {
    id: event.id, title: event.title, task: event.task, passed,
    gainedXp, gainedGold, pace
  };
  next.history = [...state.history, next.lastEvent].slice(-6);
  return next;
}
