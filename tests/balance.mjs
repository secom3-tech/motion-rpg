import assert from "node:assert/strict";
import { ACTIONS, EVENTS, newGame, beginEncounter, resolveEncounter, advanceGame } from "../src/engine.mjs";

assert.equal(new Set(EVENTS.map(e => e.id)).size, EVENTS.length, "Event IDs must be unique");
assert.equal(new Set(Object.keys(ACTIONS)).size, Object.keys(ACTIONS).length, "Action IDs must be unique");

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
    assert.ok(run.lastEvent.gainedGold <= 9);
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
