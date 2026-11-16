// Motion RPG: deterministic prototype rules. No GPS or AI dependencies.
// A minute always has two phases: encounter -> result. Game choices never
// prescribe real-world movement; pace here is only a mock input.
export const EVENTS = Object.freeze([
  { id: "wolf", title: "늑대의 추격", task: "기회를 보고 빠르게 거리를 벌려라", kind: "chase", reward: 8, actions: ["push", "steady", "bandage"] },
  { id: "hoofprints", title: "낯선 발자국", task: "남겨진 흔적을 따라갈지 판단하라", kind: "scout", reward: 7, actions: ["search", "steady", "map"] },
  { id: "cache", title: "숲속 보급 상자", task: "보급품을 챙겨 다음 구간을 준비하라", kind: "supply", reward: 6, loot: "bandage", actions: ["recover", "search"] },
  { id: "fog", title: "안개 지대 통과", task: "무리하지 말고 안정적으로 이동하라", kind: "fog", reward: 9, actions: ["steady", "recover", "torch"] },
  { id: "river", title: "얕은 개울", task: "흐름을 읽고 안전한 길을 찾는다", kind: "scout", reward: 8, actions: ["search", "steady", "map"] },
  { id: "raven", title: "까마귀의 경고", task: "급한 기척에 휘말리지 말고 판단하라", kind: "fog", reward: 7, actions: ["steady", "recover", "torch"] },
  { id: "campfire", title: "꺼진 야영지", task: "남은 흔적에서 쓸 만한 것을 찾아라", kind: "supply", reward: 8, loot: "torch", actions: ["search", "recover"] },
  { id: "boar", title: "멧돼지의 돌진", task: "짧은 위기를 넘기고 길을 확보하라", kind: "chase", reward: 10, actions: ["push", "steady", "bandage"] },
  { id: "fireflies", title: "반딧불 길잡이", task: "흩어진 빛을 놓치지 말고 방향을 잡아라", kind: "scout", reward: 9, actions: ["search", "steady", "map"] },
  { id: "windfall", title: "바람에 쓰러진 나무", task: "잠시 호흡을 고르고 다음 길을 준비하라", kind: "supply", reward: 7, loot: "map", actions: ["recover", "search"] },
  { id: "shadow", title: "그림자 너머", task: "보이지 않는 길에서도 안정적으로 이동하라", kind: "fog", reward: 10, actions: ["steady", "recover", "torch"] },
  { id: "messenger", title: "숲의 전령", task: "짧은 신호를 놓치지 말고 응답하라", kind: "chase", reward: 9, actions: ["push", "steady", "bandage"] },
]);

export const RIDGE_EVENTS = Object.freeze([
  { id: "ridge-echo", title: "메아리 절벽", task: "되돌아오는 신호 속에서 길을 가늠하라", kind: "fog", reward: 11, actions: ["steady", "recover", "torch"] },
  { id: "ridge-marker", title: "부서진 이정표", task: "바람에 지워진 표시를 다시 읽어라", kind: "scout", reward: 10, actions: ["search", "steady", "map"] },
  { id: "ridge-supply", title: "산등성이 보급품", task: "높은 곳에 남은 보급을 챙겨라", kind: "supply", reward: 11, loot: "torch", actions: ["recover", "search"] },
  { id: "ridge-hunter", title: "능선의 사냥꾼", task: "짧은 틈을 보고 안전한 거리를 확보하라", kind: "chase", reward: 13, actions: ["push", "steady", "bandage"] },
  { id: "ridge-lights", title: "달빛 표식", task: "희미한 빛을 따라 다음 고개를 넘는다", kind: "scout", reward: 12, actions: ["search", "steady", "map"] },
  { id: "ridge-mist", title: "구름 바다", task: "시야가 흔들려도 흐름을 유지하라", kind: "fog", reward: 13, actions: ["steady", "recover", "torch"] },
]);

export const REGIONS = Object.freeze({
  forest: { label: "경계의 숲", description: "첫 탐험 지역", events: EVENTS },
  ridge: { label: "달빛 능선", description: "레벨 2와 작은 랜턴이 필요한 고지대", events: RIDGE_EVENTS },
});

export const QUESTS = Object.freeze({
  forest: {
    goalAttempts: 6, goalSuccesses: 3,
    boss: { id: "forest-warden", title: "숲의 수문장", task: "숲의 길을 지킬 자격을 증명하라", kind: "chase", reward: 20, actions: ["push", "steady", "bandage"] },
  },
  ridge: {
    goalAttempts: 5, goalSuccesses: 3,
    boss: { id: "ridge-watcher", title: "능선의 감시자", task: "고지대의 마지막 관문을 넘어라", kind: "fog", reward: 28, actions: ["steady", "recover", "torch"] },
  },
});

export const ACTIONS = Object.freeze({
  push: { label: "돌파", description: "빠르게 기회를 잡는다" },
  steady: { label: "안정 이동", description: "현재 흐름을 유지한다" },
  search: { label: "탐색", description: "주변의 단서를 찾는다" },
  recover: { label: "회복", description: "다음 구간을 준비한다" },
  torch: { label: "횃불 사용", description: "안개 속 길을 밝힌다", item: "torch" },
  map: { label: "지도 조각 사용", description: "표시된 길을 따른다", item: "map" },
  bandage: { label: "붕대 정비", description: "위기를 넘길 준비를 한다", item: "bandage" },
  form: { label: "기본 동작", description: "훈련의 흐름을 유지한다" },
  focus: { label: "집중 유지", description: "한 가지 신호에 집중한다" },
});

export const ITEMS = Object.freeze({
  torch: { label: "횃불", description: "안개 사건에서 사용할 수 있다" },
  map: { label: "지도 조각", description: "탐색 사건에서 사용할 수 있다" },
  bandage: { label: "붕대", description: "추격 사건에서 사용할 수 있다" },
});

export const TRAINING_DRILLS = Object.freeze([
  { id: "guard", title: "방어 리듬", task: "한 동작의 리듬을 끝까지 유지한다", kind: "form", reward: 2, actions: ["form", "focus"] },
  { id: "darkroom", title: "어두운 훈련장", task: "흐트러지지 않고 단서를 포착한다", kind: "focus", reward: 3, actions: ["focus", "form", "torch"] },
  { id: "recovery", title: "회복 루틴", task: "다음 도전을 위한 흐름을 정리한다", kind: "recovery", reward: 2, actions: ["recover", "form"] },
]);

export const UPGRADES = Object.freeze({
  lantern: { label: "작은 랜턴", cost: 30, maxLevel: 1, description: "횃불을 사용할 때 소모하지 않는다" },
  surveyMap: { label: "탐험 지도", cost: 40, maxLevel: 1, description: "탐색 사건 성공 시 +2 G" },
  guards: { label: "훈련 보호대", cost: 50, maxLevel: 1, description: "실내 훈련 실패 시 +6 XP" },
});

const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const isValidPace = pace => Number.isFinite(Number(pace));

export function newGame() {
  return {
    elapsedMin: 0, distanceM: 0, energy: 100, xp: 0, gold: 0,
    level: 1, successes: 0, attempts: 0, phase: "exploring",
    inventory: { torch: 0, map: 0, bandage: 0 },
    currentEvent: null, lastEvent: null, history: [],
    training: { phase: "ready", attempts: 0, successes: 0, currentDrill: null, lastDrill: null },
    camp: { lantern: 0, surveyMap: 0, guards: 0 },
    region: "forest", regionAttempts: { forest: 0, ridge: 0 }, unlockedRegions: ["forest"],
    quests: { forest: { attempts: 0, successes: 0, bossDefeated: false }, ridge: { attempts: 0, successes: 0, bossDefeated: false } },
    outdoorInput: null,
    treadmill: { active: false, speedKmh: 8, distanceM: 0, distanceExactM: 0, elapsedSec: 0, nextEncounterM: 250, session: { active: false, goalM: 1000, startDistanceM: 0, startElapsedSec: 0, startAttempts: 0, lastSummary: null } }
  };
}

function energyChange(action, pace) {
  const paceEffect = pace >= 8 ? 3 : pace < 6 ? -5 : -2;
  const actionEffect = action === "recover" || action === "bandage" ? 4 : action === "push" ? -2 : 0;
  return paceEffect + actionEffect;
}

function eventPassed(event, action, pace) {
  if (!event.actions.includes(action)) return false;
  if (action === "torch" && (event.kind === "fog" || event.kind === "focus")) return true;
  if (action === "map" && event.kind === "scout") return true;
  if (action === "bandage" && event.kind === "chase") return true;
  if (event.kind === "chase") return action === "push" && pace <= 7.5 || action === "steady" && pace <= 6.5;
  if (event.kind === "scout") return action === "search" && pace >= 7 || action === "steady" && pace >= 8;
  if (event.kind === "supply") return action === "recover" || action === "search" && pace >= 7;
  if (event.kind === "fog") return action === "steady" && pace >= 6 && pace <= 9 || action === "recover" && pace >= 7;
  return false;
}

export function availableActions(event, inventory) {
  return event.actions.filter(action => !ACTIONS[action].item || inventory[ACTIONS[action].item] > 0);
}

export function isRegionAvailable(state, regionId) {
  if (!REGIONS[regionId]) return false;
  if (regionId === "forest") return true;
  if (regionId === "ridge") return state.level >= 2 && state.camp.lantern >= 1;
  return false;
}

export function availableRegions(state) {
  return Object.keys(REGIONS).filter(id => isRegionAvailable(state, id));
}

export function selectRegion(state, regionId) {
  if (state.phase !== "exploring" || state.training.phase !== "ready") throw Error("Finish the active challenge first");
  if (!isRegionAvailable(state, regionId)) throw Error("Region is locked");
  const next = { ...state, unlockedRegions: [...new Set([...state.unlockedRegions, regionId])] };
  next.region = regionId;
  return next;
}

// Adapter boundary for a future GPS source. Inputs are mock data for now.
export function recordOutdoorSignal(state, distanceM, durationSec) {
  const distance = Number(distanceM);
  const duration = Number(durationSec);
  if (!Number.isFinite(distance) || !Number.isFinite(duration) || distance < 20 || duration < 10) throw Error("Invalid outdoor signal");
  const pace = clamp((duration / 60) / (distance / 1000), 4, 12);
  return { ...state, outdoorInput: { source: "gps", distanceM: Math.round(distance), durationSec: Math.round(duration), pace: Number(pace.toFixed(1)) } };
}

// Treadmill adapter: a future timer or BLE FTMS feed can call advanceTreadmill.
export function startTreadmill(state, speedKmh = state.treadmill.speedKmh) {
  if (state.treadmill.active) throw Error("Treadmill is already active");
  const speed = Number(speedKmh);
  if (!Number.isFinite(speed) || speed < 3 || speed > 14) throw Error("Invalid treadmill speed");
  const previousSession = state.treadmill.session ?? {};
  const session = { goalM: 1000, ...previousSession, active: true, startDistanceM: state.treadmill.distanceM, startElapsedSec: state.treadmill.elapsedSec, startAttempts: state.attempts, lastSummary: null };
  return { ...state, treadmill: { ...state.treadmill, active: true, speedKmh: Number(speed.toFixed(1)), session } };
}

export function setTreadmillGoal(state, goalM) {
  if (state.treadmill.active) throw Error("Stop the treadmill before changing the goal");
  const goal = Number(goalM);
  if (![500, 1000, 2000].includes(goal)) throw Error("Invalid treadmill goal");
  const session = { goalM: 1000, ...(state.treadmill.session ?? {}), goalM: goal };
  return { ...state, treadmill: { ...state.treadmill, session } };
}

export function setTreadmillSpeed(state, speedKmh) {
  if (state.treadmill.active) throw Error("Stop the treadmill before changing the speed preset");
  const speed = Number(speedKmh);
  if (![6, 8, 10, 12].includes(speed)) throw Error("Invalid treadmill speed preset");
  return { ...state, treadmill: { ...state.treadmill, speedKmh: speed } };
}

export function adjustTreadmillSpeed(state, deltaKmh) {
  if (!state.treadmill.active) throw Error("Treadmill is not active");
  const delta = Number(deltaKmh);
  if (!Number.isFinite(delta)) throw Error("Invalid treadmill adjustment");
  const speedKmh = clamp(state.treadmill.speedKmh + delta, 3, 14);
  return { ...state, treadmill: { ...state.treadmill, speedKmh: Number(speedKmh.toFixed(1)) } };
}

export function advanceTreadmill(state, durationSec = 60) {
  if (!state.treadmill.active) throw Error("Treadmill is not active");
  const duration = Number(durationSec);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 3600) throw Error("Invalid treadmill duration");
  const distanceM = state.treadmill.speedKmh * 1000 * duration / 3600;
  const previousDistance = Number.isFinite(state.treadmill.distanceExactM) ? state.treadmill.distanceExactM : state.treadmill.distanceM;
  const distanceExactM = previousDistance + distanceM;
  const roundedDistance = Math.round(distanceExactM);
  const scheduledDistance = Number.isFinite(state.treadmill.nextEncounterM) ? state.treadmill.nextEncounterM : 250;
  const crossedEncounterMarker = roundedDistance >= scheduledDistance;
  const nextEncounterM = crossedEncounterMarker ? (Math.floor(roundedDistance / 250) + 1) * 250 : scheduledDistance;
  const treadmill = { ...state.treadmill, distanceM: roundedDistance, distanceExactM, elapsedSec: state.treadmill.elapsedSec + Math.round(duration), nextEncounterM };
  const pace = Number((60 / treadmill.speedKmh).toFixed(1));
  const next = { ...state, treadmill, outdoorInput: { source: "treadmill", distanceM: Math.round(distanceM), durationSec: Math.round(duration), pace } };
  return crossedEncounterMarker && next.phase === "exploring" && next.training.phase === "ready" ? beginEncounter(next, pace) : next;
}

export function stopTreadmill(state) {
  if (!state.treadmill.active) throw Error("Treadmill is not active");
  const session = { goalM: 1000, startDistanceM: state.treadmill.distanceM, startElapsedSec: state.treadmill.elapsedSec, startAttempts: state.attempts, ...(state.treadmill.session ?? {}) };
  const distanceM = Math.max(0, state.treadmill.distanceM - session.startDistanceM);
  const elapsedSec = Math.max(0, state.treadmill.elapsedSec - session.startElapsedSec);
  const encounters = Math.max(0, state.attempts - session.startAttempts);
  const completed = distanceM >= session.goalM;
  const gainedXp = completed ? 4 + Math.round(session.goalM / 500) * 2 : 0;
  const gainedGold = completed ? Math.round(session.goalM / 500) : 0;
  const lastSummary = { distanceM, elapsedSec, encounters, goalM: session.goalM, completed, gainedXp, gainedGold };
  const next = { ...state, treadmill: { ...state.treadmill, active: false, session: { ...session, active: false, lastSummary } } };
  next.xp += gainedXp;
  next.gold += gainedGold;
  next.level = 1 + Math.floor(next.xp / 100);
  return next;
}

export function isBossAvailable(state, regionId = state.region) {
  const quest = state.quests[regionId];
  const rules = QUESTS[regionId];
  return !!quest && !quest.bossDefeated && quest.attempts >= rules.goalAttempts && quest.successes >= rules.goalSuccesses;
}

export function beginBossEncounter(state, paceInput) {
  if (state.phase !== "exploring" || state.training.phase !== "ready") throw Error("Finish the active challenge first");
  if (!isBossAvailable(state)) throw Error("Boss challenge is locked");
  const inputPace = state.outdoorInput?.pace ?? paceInput;
  if (!isValidPace(inputPace)) throw Error("Invalid pace");
  const pace = clamp(Number(inputPace), 4, 12);
  const next = { ...state };
  next.phase = "encounter";
  next.currentEvent = { ...QUESTS[state.region].boss, pace, region: state.region, boss: true, inputSource: state.outdoorInput?.source ?? "manual" };
  return next;
}

// Begins one simulated minute. Calling it outside exploration is an invalid transition.
export function beginEncounter(state, paceInput) {
  if (state.phase !== "exploring") throw Error("Can only begin an encounter while exploring");
  const inputPace = state.outdoorInput?.pace ?? paceInput;
  if (!isValidPace(inputPace)) throw Error("Invalid pace");
  const pace = clamp(Number(inputPace), 4, 12);
  const region = REGIONS[state.region];
  const event = region.events[state.regionAttempts[state.region] % region.events.length];
  const next = { ...state };
  next.elapsedMin += 1;
  next.distanceM = Math.round(next.distanceM + 1000 / pace);
  next.phase = "encounter";
  next.currentEvent = { ...event, pace, region: state.region, inputSource: state.outdoorInput?.source ?? "manual" };
  return next;
}

// Resolves the active event and returns to exploration for the next minute.
export function resolveEncounter(state, action) {
  if (state.phase !== "encounter" || !state.currentEvent) throw Error("No active encounter to resolve");
  if (!ACTIONS[action]) throw Error("Unknown action");
  const event = state.currentEvent;
  if (!availableActions(event, state.inventory).includes(action)) throw Error("Required item is not available");
  const passed = eventPassed(event, action, event.pace);
  const gainedXp = passed ? 14 : 5;
  const gainedGold = passed ? event.reward + (event.kind === "scout" ? state.camp.surveyMap * 2 : 0) : 0;
  const next = { ...state };
  next.energy = clamp(next.energy + energyChange(action, event.pace), 0, 100);
  next.xp += gainedXp;
  next.gold += gainedGold;
  next.inventory = { ...state.inventory };
  const usedItem = ACTIONS[action].item;
  if (usedItem && !(usedItem === "torch" && state.camp.lantern > 0)) next.inventory[usedItem] -= 1;
  const gainedItem = passed ? event.loot ?? null : null;
  if (gainedItem) next.inventory[gainedItem] += 1;
  next.level = 1 + Math.floor(next.xp / 100);
  next.attempts += 1;
  next.regionAttempts = { ...state.regionAttempts, [event.region]: state.regionAttempts[event.region] + (event.boss ? 0 : 1) };
  next.unlockedRegions = [...new Set([...state.unlockedRegions, ...availableRegions(next)])];
  next.quests = { ...state.quests, [event.region]: { ...state.quests[event.region] } };
  if (event.boss) {
    if (passed) next.quests[event.region].bossDefeated = true;
  } else {
    next.quests[event.region].attempts += 1;
    next.quests[event.region].successes += passed ? 1 : 0;
  }
  next.successes += passed ? 1 : 0;
  next.phase = "exploring";
  next.currentEvent = null;
  next.lastEvent = { id: event.id, title: event.title, task: event.task, region: event.region, boss: !!event.boss, action, passed, gainedXp, gainedGold, gainedItem, pace: event.pace, inputSource: event.inputSource };
  next.history = [...state.history, next.lastEvent].slice(-6);
  return next;
}

// Compatibility helper for simulations: starts the event and chooses an available action.
export function advanceGame(state, paceInput, action = "steady") {
  const encounter = beginEncounter(state, paceInput);
  const selectedAction = availableActions(encounter.currentEvent, encounter.inventory).includes(action)
    ? action
    : availableActions(encounter.currentEvent, encounter.inventory)[0];
  return resolveEncounter(encounter, selectedAction);
}

export function purchaseUpgrade(state, upgradeId) {
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade) throw Error("Unknown upgrade");
  if (state.phase !== "exploring" || state.training.phase !== "ready") throw Error("Finish the active challenge first");
  if (state.camp[upgradeId] >= upgrade.maxLevel) throw Error("Upgrade is already at maximum level");
  if (state.gold < upgrade.cost) throw Error("Not enough gold");
  const next = { ...state, camp: { ...state.camp } };
  next.gold -= upgrade.cost;
  next.camp[upgradeId] += 1;
  return next;
}

function trainingPassed(drill, action, energy) {
  if (action === "torch" && drill.kind === "focus") return true;
  if (drill.kind === "form") return action === "form" || action === "focus" && energy >= 25;
  if (drill.kind === "focus") return action === "focus" && energy >= 20 || action === "form" && energy >= 55;
  if (drill.kind === "recovery") return action === "recover" || action === "form" && energy >= 35;
  return false;
}

// Indoor simulator. It shares XP, gold, energy, and the outdoor inventory.
export function beginTraining(state) {
  if (state.phase !== "exploring") throw Error("Finish the outdoor encounter first");
  if (state.training.phase !== "ready") throw Error("Training is already active");
  const drill = TRAINING_DRILLS[state.training.attempts % TRAINING_DRILLS.length];
  const next = { ...state, training: { ...state.training } };
  next.training.phase = "challenge";
  next.training.currentDrill = { ...drill };
  return next;
}

// Adapter boundary for a future camera or wearable motion counter.
export function recordIndoorSignal(state, motionCount) {
  const count = Number(motionCount);
  if (!Number.isFinite(count) || count < 0 || count > 100) throw Error("Invalid indoor signal");
  return { ...state, training: { ...state.training, inputCount: Math.round(count) } };
}

export function resolveTraining(state, action) {
  if (state.training.phase !== "challenge" || !state.training.currentDrill) throw Error("No active training to resolve");
  if (!ACTIONS[action]) throw Error("Unknown action");
  const drill = state.training.currentDrill;
  if (!availableActions(drill, state.inventory).includes(action)) throw Error("Required item is not available");
  const passed = trainingPassed(drill, action, state.energy);
  const inputBonus = passed && (state.training.inputCount ?? 0) >= 8 ? 2 : 0;
  const gainedXp = passed ? 10 + inputBonus : state.camp.guards > 0 ? 6 : 3;
  const gainedGold = passed ? drill.reward : 0;
  const usedItem = ACTIONS[action].item;
  const next = { ...state, inventory: { ...state.inventory }, training: { ...state.training } };
  if (usedItem && !(usedItem === "torch" && state.camp.lantern > 0)) next.inventory[usedItem] -= 1;
  next.energy = clamp(next.energy + (action === "recover" ? 5 : action === "form" ? -1 : action === "focus" ? -2 : 0), 0, 100);
  next.xp += gainedXp;
  next.gold += gainedGold;
  next.level = 1 + Math.floor(next.xp / 100);
  next.training.attempts += 1;
  next.training.successes += passed ? 1 : 0;
  next.training.phase = "ready";
  next.training.currentDrill = null;
  next.training.lastDrill = { id: drill.id, title: drill.title, task: drill.task, action, passed, gainedXp, gainedGold, inputBonus };
  return next;
}
