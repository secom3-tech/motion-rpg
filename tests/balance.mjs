import assert from "node:assert/strict";
import { EVENTS, newGame, advanceGame } from "../src/engine.mjs";

assert.equal(new Set(EVENTS.map(e => e.id)).size, EVENTS.length, "Event IDs must be unique");
let totalSuccess = 0;
const results = [];
for (let seed = 1; seed <= 1000; seed++) {
  let state = newGame();
  let value = seed;
  for (let step = 0; step < 20; step++) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const pace = 4 + (value / 4294967296) * 8;
    const prev = state;
    state = advanceGame(state, pace);
    assert.equal(state.elapsedMin, step + 1);
    assert.equal(state.attempts, step + 1);
    assert.ok(state.energy >= 0 && state.energy <= 100);
    assert.ok(state.xp >= prev.xp && state.gold >= prev.gold);
    assert.ok(state.distanceM >= prev.distanceM);
    assert.ok(state.lastEvent.gainedGold <= 9);
    assert.ok(state.history.length <= 6);
  }
  totalSuccess += state.successes;
  results.push(state.xp);
}
const averageXp = results.reduce((a, b) => a + b, 0) / results.length;
const successRate = totalSuccess / (results.length * 20);
assert.ok(averageXp >= 100 && averageXp <= 280);
assert.ok(successRate > 0.2 && successRate < 0.95);
console.log("BALANCE SMOKE PASS | 1,000 mock runs, 20 minutes each");
console.log("Average XP:", averageXp.toFixed(1), "| success rate:", (successRate * 100).toFixed(1) + "%");
console.log("NOTE: Mechanical smoke checks only; real gameplay balance unverified.");
