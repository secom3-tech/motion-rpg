import assert from "node:assert/strict";
import { ACTIONS, EVENTS, ITEMS, RIDGE_EVENTS, REGIONS, QUESTS, TRAINING_DRILLS, UPGRADES, availableActions, availableRegions, completeArcadeGame, newGame, adjustTreadmillSpeed, advanceTreadmill, beginEncounter, beginBossEncounter, isBossAvailable, pauseOutdoorSession, recordIndoorSignal, recordOutdoorSegment, recordOutdoorSignal, resolveEncounter, resumeOutdoorSession, advanceGame, beginTraining, resolveTraining, purchaseUpgrade, selectRegion, setTrainingGoal, setTreadmillGoal, setTreadmillSpeed, startOutdoorSession, startTrainingSession, startTreadmill, stopOutdoorSession, stopTreadmill } from "../src/engine.mjs";

assert.equal(new Set(EVENTS.map(e => e.id)).size, EVENTS.length, "Event IDs must be unique");
assert.equal(new Set(Object.keys(ACTIONS)).size, Object.keys(ACTIONS).length, "Action IDs must be unique");
assert.equal(EVENTS.length, 12, "The first forest region should contain 12 events");
assert.ok(EVENTS.every(event => event.actions.length >= 2 && event.reward >= 6 && event.reward <= 10));
assert.deepEqual(Object.keys(ITEMS).sort(), ["bandage", "map", "torch"]);
assert.equal(TRAINING_DRILLS.length, 3, "Indoor training needs three rotating drills");
assert.equal(Object.keys(UPGRADES).length, 3, "Camp needs three starter upgrades");
assert.equal(RIDGE_EVENTS.length, 6, "The second region should contain six events");
assert.equal(Object.keys(REGIONS).length, 2, "Two regions should be configured");
assert.equal(Object.keys(QUESTS).length, 2, "Each region needs a quest");

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
let historyRun = newGame();
for (let i = 0; i < 7; i += 1) historyRun = advanceGame(historyRun, 8);
assert.equal(historyRun.history.length, 6);
assert.equal(historyRun.history.at(-1).id, historyRun.lastEvent.id);
assert.ok(historyRun.history.every(entry => typeof entry.inputSource === "string" && typeof entry.gainedXp === "number"));

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
let trainingRun = newGame();
trainingRun = beginTraining(trainingRun);
assert.equal(trainingRun.training.currentDrill.id, "slime-archer");
assert.ok(availableActions(trainingRun.training.currentDrill, trainingRun.inventory).includes("throw"));
trainingRun = resolveTraining(trainingRun, "throw");
assert.equal(trainingRun.training.phase, "ready");
assert.equal(trainingRun.training.lastDrill.passed, true);
assert.equal(trainingRun.xp, 10);
assert.throws(() => resolveTraining(trainingRun, "throw"), /No active/);

// Mock sensor inputs take the same route as future GPS/camera inputs.
let sensorRun = recordOutdoorSignal(newGame(), 125, 60);
sensorRun = beginEncounter(sensorRun, 4);
assert.equal(sensorRun.currentEvent.pace, 8);
assert.equal(sensorRun.currentEvent.inputSource, "gps");
assert.throws(() => recordOutdoorSignal(newGame(), 0, 60), /Invalid/);
let gpsRun = startOutdoorSession(newGame());
gpsRun = recordOutdoorSegment(gpsRun, 125, 60);
assert.equal(gpsRun.outdoorSession.distanceM, 125);
assert.equal(gpsRun.outdoorInput.pace, 8);
gpsRun = pauseOutdoorSession(gpsRun);
assert.equal(gpsRun.outdoorSession.paused, true);
assert.throws(() => recordOutdoorSegment(gpsRun, 10, 10), /paused/);
gpsRun = resumeOutdoorSession(gpsRun);
gpsRun = recordOutdoorSegment(gpsRun, 125, 60);
assert.equal(gpsRun.phase, "encounter");
assert.equal(gpsRun.currentEvent.inputSource, "gps");
assert.equal(gpsRun.outdoorSession.nextEncounterM, 500);
gpsRun = resolveEncounter(gpsRun, "push");
gpsRun = stopOutdoorSession(gpsRun);
assert.equal(gpsRun.outdoorSession.lastSummary.distanceM, 250);
assert.equal(gpsRun.outdoorSession.lastSummary.encounters, 1);
assert.throws(() => recordOutdoorSegment(newGame(), 10, 10), /not active/);
let smoothGpsRun = startOutdoorSession(newGame());
smoothGpsRun = recordOutdoorSegment(smoothGpsRun, 100, 36);
smoothGpsRun = recordOutdoorSegment(smoothGpsRun, 100, 60);
smoothGpsRun = recordOutdoorSegment(smoothGpsRun, 100, 48);
assert.equal(smoothGpsRun.outdoorInput.pace, 8, "GPS pace should use the median of recent segments");
let motionRun = recordIndoorSignal(newGame(), 8);
motionRun = resolveTraining(beginTraining(motionRun), "throw");
assert.equal(motionRun.training.lastDrill.inputBonus, 2);
assert.equal(motionRun.training.lastDrill.gainedXp, 12);
assert.throws(() => recordIndoorSignal(newGame(), -1), /Invalid/);
let indoorSessionRun = setTrainingGoal(newGame(), 1);
indoorSessionRun = resolveTraining(startTrainingSession(indoorSessionRun), "throw");
assert.equal(indoorSessionRun.training.session.active, false);
assert.equal(indoorSessionRun.training.session.lastSummary.goal, 1);
assert.equal(indoorSessionRun.training.session.lastSummary.gainedXp, 4);
let arcadeRun = completeArcadeGame(newGame(), "throw", 8);
assert.equal(arcadeRun.arcade.bestScores.throw, 8);
assert.equal(arcadeRun.arcade.lastResult.gainedGold, 2);
assert.throws(() => completeArcadeGame(newGame(), "missing", 1), /Unknown/);

let treadmillRun = startTreadmill(newGame(), 8);
treadmillRun = advanceTreadmill(treadmillRun, 60);
assert.equal(treadmillRun.treadmill.distanceM, 133);
assert.equal(treadmillRun.outdoorInput.pace, 7.5);
assert.equal(treadmillRun.outdoorInput.source, "treadmill");
assert.throws(() => startTreadmill(treadmillRun, 8), /already active/);
let secondBySecondRun = startTreadmill(newGame(), 8);
for (let second = 0; second < 60; second += 1) secondBySecondRun = advanceTreadmill(secondBySecondRun, 1);
assert.equal(secondBySecondRun.treadmill.distanceM, 133);
assert.equal(secondBySecondRun.treadmill.elapsedSec, 60);
let autoEncounterRun = startTreadmill(newGame(), 8);
autoEncounterRun = advanceTreadmill(autoEncounterRun, 120);
assert.equal(autoEncounterRun.phase, "encounter");
assert.equal(autoEncounterRun.currentEvent.inputSource, "treadmill");
assert.equal(autoEncounterRun.treadmill.nextEncounterM, 500);
autoEncounterRun = resolveEncounter(autoEncounterRun, "push");
autoEncounterRun = advanceTreadmill(autoEncounterRun, 1);
assert.equal(autoEncounterRun.phase, "exploring");
autoEncounterRun = advanceTreadmill(autoEncounterRun, 104);
assert.equal(autoEncounterRun.phase, "encounter");
treadmillRun = adjustTreadmillSpeed(treadmillRun, 1);
assert.equal(treadmillRun.treadmill.speedKmh, 9);
treadmillRun = advanceTreadmill(treadmillRun, 60);
assert.equal(treadmillRun.phase, "encounter");
assert.equal(treadmillRun.currentEvent.inputSource, "treadmill");
assert.equal(treadmillRun.currentEvent.pace, 6.7);
treadmillRun = stopTreadmill({ ...treadmillRun, phase: "exploring" });
assert.equal(treadmillRun.treadmill.active, false);

let goalRun = setTreadmillGoal(newGame(), 500);
goalRun = setTreadmillSpeed(goalRun, 10);
goalRun = startTreadmill(goalRun, 10);
goalRun = advanceTreadmill(goalRun, 180);
goalRun = stopTreadmill({ ...goalRun, phase: "exploring" });
assert.equal(goalRun.treadmill.session.lastSummary.completed, true);
assert.equal(goalRun.treadmill.session.lastSummary.distanceM, 500);
assert.equal(goalRun.treadmill.session.lastSummary.gainedXp, 6);
assert.equal(goalRun.gold, 1);
assert.throws(() => setTreadmillGoal(startTreadmill(newGame(), 8), 500), /Stop/);
assert.equal(startTreadmill(setTreadmillSpeed(newGame(), 12)).treadmill.speedKmh, 12);
assert.throws(() => setTreadmillSpeed(newGame(), 7), /Invalid/);

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

// Bosses appear only after the regional objective and only clear on success.
let bossRun = { ...newGame(), quests: { forest: { attempts: 6, successes: 3, bossDefeated: false }, ridge: { attempts: 0, successes: 0, bossDefeated: false } } };
assert.ok(isBossAvailable(bossRun));
bossRun = beginBossEncounter(bossRun, 7);
assert.equal(bossRun.currentEvent.boss, true);
bossRun = resolveEncounter(bossRun, "push");
assert.equal(bossRun.lastEvent.boss, true);
assert.equal(bossRun.quests.forest.bossDefeated, true);
assert.ok(!isBossAvailable(bossRun));

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
