// Motion RPG: deterministic prototype rules. No GPS or AI dependencies.
// A minute always has two phases: encounter -> result. Game choices never
// prescribe real-world movement; pace here is only a mock input.
export const EVENTS = Object.freeze([
  { id: "wolf", title: "늑대의 추격", task: "기회를 보고 빠르게 거리를 벌려라", kind: "chase", reward: 8, actions: ["push", "steady"] },
  { id: "hoofprints", title: "낯선 발자국", task: "남겨진 흔적을 따라갈지 판단하라", kind: "scout", reward: 7, actions: ["search", "steady"] },
  { id: "cache", title: "숲속 보급 상자", task: "보급품을 챙겨 다음 구간을 준비하라", kind: "supply", reward: 6, actions: ["recover", "search"] },
  { id: "fog", title: "안개 지대 통과", task: "무리하지 말고 안정적으로 이동하라", kind: "fog", reward: 9, actions: ["steady", "recover"] },
  { id: "river", title: "얕은 개울", task: "흐름을 읽고 안전한 길을 찾는다", kind: "scout", reward: 8, actions: ["search", "steady"] },
  { id: "raven", title: "까마귀의 경고", task: "급한 기척에 휘말리지 말고 판단하라", kind: "fog", reward: 7, actions: ["steady", "recover"] },
  { id: "campfire", title: "꺼진 야영지", task: "남은 흔적에서 쓸 만한 것을 찾아라", kind: "supply", reward: 8, actions: ["search", "recover"] },
  { id: "boar", title: "멧돼지의 돌진", task: "짧은 위기를 넘기고 길을 확보하라", kind: "chase", reward: 10, actions: ["push", "steady"] },
  { id: "fireflies", title: "반딧불 길잡이", task: "흩어진 빛을 놓치지 말고 방향을 잡아라", kind: "scout", reward: 9, actions: ["search", "steady"] },
  { id: "windfall", title: "바람에 쓰러진 나무", task: "잠시 호흡을 고르고 다음 길을 준비하라", kind: "supply", reward: 7, actions: ["recover", "search"] },
  { id: "shadow", title: "그림자 너머", task: "보이지 않는 길에서도 안정적으로 이동하라", kind: "fog", reward: 10, actions: ["steady", "recover"] },
  { id: "messenger", title: "숲의 전령", task: "짧은 신호를 놓치지 말고 응답하라", kind: "chase", reward: 9, actions: ["push", "steady"] },
]);

export const ACTIONS = Object.freeze({
  push: { label: "돌파", description: "빠르게 기회를 잡는다" },
  steady: { label: "안정 이동", description: "현재 흐름을 유지한다" },
  search: { label: "탐색", description: "주변의 단서를 찾는다" },
  recover: { label: "회복", description: "다음 구간을 준비한다" },
});

const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const isValidPace = pace => Number.isFinite(Number(pace));

export function newGame() {
  return {
    elapsedMin: 0, distanceM: 0, energy: 100, xp: 0, gold: 0,
    level: 1, successes: 0, attempts: 0, phase: "exploring",
    currentEvent: null, lastEvent: null, history: []
  };
}

function energyChange(action, pace) {
  const paceEffect = pace >= 8 ? 3 : pace < 6 ? -5 : -2;
  const actionEffect = action === "recover" ? 4 : action === "push" ? -2 : 0;
  return paceEffect + actionEffect;
}

function eventPassed(event, action, pace) {
  if (!event.actions.includes(action)) return false;
  if (event.kind === "chase") return action === "push" && pace <= 7.5 || action === "steady" && pace <= 6.5;
  if (event.kind === "scout") return action === "search" && pace >= 7 || action === "steady" && pace >= 8;
  if (event.kind === "supply") return action === "recover" || action === "search" && pace >= 7;
  if (event.kind === "fog") return action === "steady" && pace >= 6 && pace <= 9 || action === "recover" && pace >= 7;
  return false;
}

// Begins one simulated minute. Calling it outside exploration is an invalid transition.
export function beginEncounter(state, paceInput) {
  if (state.phase !== "exploring") throw Error("Can only begin an encounter while exploring");
  if (!isValidPace(paceInput)) throw Error("Invalid pace");
  const pace = clamp(Number(paceInput), 4, 12);
  const event = EVENTS[state.attempts % EVENTS.length];
  const next = { ...state };
  next.elapsedMin += 1;
  next.distanceM = Math.round(next.distanceM + 1000 / pace);
  next.phase = "encounter";
  next.currentEvent = { ...event, pace };
  return next;
}

// Resolves the active event and returns to exploration for the next minute.
export function resolveEncounter(state, action) {
  if (state.phase !== "encounter" || !state.currentEvent) throw Error("No active encounter to resolve");
  if (!ACTIONS[action]) throw Error("Unknown action");
  const event = state.currentEvent;
  const passed = eventPassed(event, action, event.pace);
  const gainedXp = passed ? 14 : 5;
  const gainedGold = passed ? event.reward : 0;
  const next = { ...state };
  next.energy = clamp(next.energy + energyChange(action, event.pace), 0, 100);
  next.xp += gainedXp;
  next.gold += gainedGold;
  next.level = 1 + Math.floor(next.xp / 100);
  next.attempts += 1;
  next.successes += passed ? 1 : 0;
  next.phase = "exploring";
  next.currentEvent = null;
  next.lastEvent = { id: event.id, title: event.title, task: event.task, action, passed, gainedXp, gainedGold, pace: event.pace };
  next.history = [...state.history, next.lastEvent].slice(-6);
  return next;
}

// Compatibility helper for simulations: starts the event and chooses an available action.
export function advanceGame(state, paceInput, action = "steady") {
  return resolveEncounter(beginEncounter(state, paceInput), action);
}
