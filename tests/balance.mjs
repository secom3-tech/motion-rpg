import assert from "node:assert/strict";
import { ACTIONS, EVENTS, ITEMS, RIDGE_EVENTS, REGIONS, TRAINING_DRILLS, UPGRADES, availableActions, availableRegions, newGame, beginEncounter, resolveEncounter, advanceGame, beginTraining, resolveTraining, purchaseUpgrade, selectRegion } from "../src/engine.mjs";

assert.equal(new Set(EVENTS.map(e => e.id)).size, EVENTS.length, "Event IDs must be unique");
assert.equal(new Set(Object.keys(ACTIONS)).size, Object.keys(ACTIONS).length, "Action IDs must be unique");
assert.equal(EVENTS.length, 12, "The first forest region should contain 12 events");
assert.ok(EVENTS.every(event => event.actions.length >= 2 && event.reward >= 6 && event.reward <= 10));
assert.deepEqual(Object.keys(ITEMS).sort(), ["bandage", "map", "torch"]);
assert.equal(TRAINING_DRILLS.length, 3, "Indoor training needs three rotating drills");
assert.equal(Object.keys(UPGRADES).length, 3, "Camp needs three starter upgrades");
assert.equal(RIDGE_EVENTS.length, 6, "The second region should contain six events");
assert.equal(Object.keys(REGIONS).length, 2, "Two regions should be configured");

// State-machine boundaries: no rewards before an encounter is resolved.
let state = newGame();
assert.equal(state.phase, "exploring");
state = beginEncounter(state, 7);
assert.equal(state.phase, "encounter");
assert.equal(state.elapsedMin, 1);
assert.equal(state.xp, 0);
assert.throws(() => beginEncounter(state, 7), /exploring/);
assert.throws(() => resolveEncounter(state, "missing"), /Unknown action/);
state = resolveEncounter(state, "push");
assert.equal(state.phase, "exploring");
assert.equal(state.attempts, 1);
assert.equal(state.lastEvent.action, "push");
assert.throws(() => resolveEncounter(state, "push"), /No active/);

// Consumables are hidden without stock, become valid when held, and are spent on use.
let fogRun = { ...newGame(), attempts: 3, regionAttempts: { forest: 3, ridge: 0 } };
fogRun = beginEncounter(fogRun, 8);
assert.ok(!availableActions(fogRun.currentEvent, fogRun.inventory).includes("torch"));
assert.throws(() => resolveEncounter(fogRun, "torch"), /Required item/);
fogRun = { ...newGame(), attempts: 3, regionAttempts: { forest: 3, ridge: 0 }, inventory: { torch: 1, map: 0, bandage: 0 } };
fogRun = beginEncounter(fogRun, 8);
assert.ok(availableActions(fogRun.currentEvent, fogRun.inventory).includes("torch"));
fogRun = resolveEncounter(fogRun, "torch");
assert.equal(fogRun.lastEvent.passed, true);
assert.equal(fogRun.inventory.torch, 0);

let lootRun = { ...newGame(), attempts: 2, regionAttempts: { forest: 2, ridge: 0 } };
lootRun = resolveEncounter(beginEncounter(lootRun, 8), "recover");
assert.equal(lootRun.lastEvent.gainedItem, "bandage");
assert.equal(lootRun.inventory.bandage, 1);

// Indoor play shares the same inventory and character rewards with outdoor play.
let trainingRun = { ...newGame(), inventory: { torch: 1, map: 0, bandage: 0 }, training: { ...newGame().training, attempts: 1 } };
trainingRun = beginTraining(trainingRun);
assert.equal(trainingRun.training.currentDrill.id, "darkroom");
assert.ok(availableActions(trainingRun.training.currentDrill, trainingRun.inventory).includes("torch"));
trainingRun = resolveTraining(trainingRun, "torch");
assert.equal(trainingRun.training.phase, "ready");
assert.equal(trainingRun.inventory.torch, 0);
assert.equal(trainingRun.training.lastDrill.passed, true);
assert.equal(trainingRun.xp, 10);
assert.throws(() => resolveTraining(trainingRun, "torch"), /No active/);

// Gold has a deterministic use and upgrades affect their advertised systems.
let campRun = { ...newGame(), gold: 120 };
campRun = purchaseUpgrade(campRun, "lantern");
campRun = purchaseUpgrade(campRun, "surveyMap");
campRun = purchaseUpgrade(campRun, "guards");
assert.equal(campRun.gold, 0);
assert.deepEqual(campRun.camp, { lantern: 1, surveyMap: 1, guards: 1 });
assert.throws(() => purchaseUpgrade(campRun, "lantern"), /maximum/);
let scoutRun = { ...campRun, attempts: 1, regionAttempts: { forest: 1, ridge: 0 } };
scoutRun = resolveEncounter(beginEncounter(scoutRun, 8), "search");
assert.equal(scoutRun.lastEvent.gainedGold, EVENTS[1].reward + 2);

// Region two cannot be selected early, then unlocks through level plus camp progression.
let regionRun = newGame();
assert.ok(!availableRegions(regionRun).includes("ridge"));
assert.throws(() => selectRegion(regionRun, "ridge"), /locked/);
regionRun = { ...regionRun, level: 2, camp: { ...regionRun.camp, lantern: 1 } };
regionRun = selectRegion(regionRun, "ridge");
assert.equal(regionRun.region, "ridge");
regionRun = resolveEncounter(beginEncounter(regionRun, 8), "steady");
assert.equal(regionRun.lastEvent.region, "ridge");
assert.ok(regionRun.lastEvent.gainedGold <= 13);

// Every event must be reachable once in a 12-minute cycle.
let coverageRun = newGame();
const encountered = new Set();
for (let step = 0; step < EVENTS.length; step++) {
  coverageRun = beginEncounter(coverageRun, 8);
  encountered.add(coverageRun.currentEvent.id);
  coverageRun = resolveEncounter(coverageRun, coverageRun.currentEvent.actions[0]);
}
assert.equal(encountered.size, EVENTS.length, "All configured events must be reachable");

let totalSuccess = 0;
const results = [];
for (let seed = 1; seed <= 1000; seed++) {
  let run = newGame();
  let value = seed;
  for (let step = 0; step < 20; step++) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const pace = 4 + (value / 4294967296) * 8;
    const actions = ["push", "steady", "search", "recover"];
    const action = actions[(value >>> 16) % actions.length];
    const prev = run;
    run = advanceGame(run, pace, action);
    assert.equal(run.elapsedMin, step + 1);
    assert.equal(run.attempts, step + 1);
    assert.equal(run.phase, "exploring");
    assert.ok(run.energy >= 0 && run.energy <= 100);
    assert.ok(run.xp >= prev.xp && run.gold >= prev.gold);
    assert.ok(run.distanceM >= prev.distanceM);
    assert.ok(run.lastEvent.gainedGold <= 13);
    assert.ok(Object.values(run.inventory).every(count => count >= 0));
    assert.ok(run.history.length <= 6);
  }
  totalSuccess += run.successes;
  results.push(run.xp);
}
const averageXp = results.reduce((a, b) => a + b, 0) / results.length;
const successRate = totalSuccess / (results.length * 20);
assert.ok(averageXp >= 100 && averageXp <= 280);
assert.ok(successRate > 0.15 && successRate < 0.8);
console.log("BALANCE SMOKE PASS | 1,000 mock runs, 20 minutes each");
console.log("Average XP:", averageXp.toFixed(1), "| success rate:", (successRate * 100).toFixed(1) + "%");
console.log("State transitions, reward caps, and bounded economy: PASS");
