import assert from "node:assert/strict";
import fs from "node:fs";
import {newGame} from "../src/engine.mjs";
import {createAdventure,startAdventure,advanceAdventure,endAdventure,settleAdventure,summarizeAdventure,expeditionReward} from "../src/expedition.mjs";
import {addExpeditionMaterials} from "../src/gear-game.mjs";
import {acceptGuildContract,recordGuildExpedition} from "../src/guild-quests.mjs";

const walk=(state,seconds,metres=0)=>advanceAdventure(state,seconds,15,metres);
let stand=startAdventure(createAdventure({mode:"walk",seed:7,durationMin:12}));
for(let n=0;n<48;n++)stand=walk(stand,10,0);
assert.equal(stand.elapsedSec,480,"Stationary but valid-GPS time continues");
assert.equal(stand.distanceM,0,"Never infer walking metres from time");
assert.ok(stand.events.length>0,"2–3min scent exploration completes without walking far");
assert.ok(stand.events.every(e=>e.passed&&e.goalDurationSec>=120&&e.goalDurationSec<=150));
assert.ok(stand.announcements.some(a=>a.head==="흔적 조사 중"||a.head==="조사 중간 보고"));
assert.equal(stand.success,stand.events.length,"Dog walks must never secretly require pace and random rolls");
assert.equal(settleAdventure(newGame(),endAdventure(stand),"dog-static-001").awarded,false,
 "Completely stationary idle session may not claim movement rewards");

let outing=startAdventure(createAdventure({mode:"walk",seed:19,durationMin:12}));
for(let n=0;n<24;n++)outing=walk(outing,10,n===8?3.4:n===15?3.2:0);
assert.equal(outing.elapsedSec,240);
assert.ok(outing.distanceM>3&&outing.distanceM<12,"Short real GPS movement counted, not invented metres");
assert.ok(outing.events.length>=1&&outing.events[0].passed,
 "2–3min investigation succeeds during a stop-and-sniff walk");
const completed=endAdventure(outing);
const before=acceptGuildContract(newGame());
const claim=settleAdventure(before,completed,"walk-short-0001");
assert.equal(claim.awarded,true,"Walk settlement must not need 200 metres");
assert.equal(claim.state.xp,expeditionReward(completed).xp);
assert.equal(settleAdventure(claim.state,completed,"walk-short-0001").awarded,false);
const gear=addExpeditionMaterials(claim.state,completed,"walk-short-0001");
assert.equal(gear.awarded,true,"Walk material rewards share low threshold");
assert.equal(addExpeditionMaterials(gear.state,completed,"walk-short-0001").awarded,false);
const guild=recordGuildExpedition(gear.state,completed,"walk-short-0001");
assert.equal(guild.awarded,true,"Real walk encounter advances accepted guild quest");
assert.equal(guild.attempts,completed.events.length);
assert.equal(recordGuildExpedition(guild.state,completed,"walk-short-0001").awarded,false);
const tooShort=endAdventure(walk(startAdventure(createAdventure({mode:"walk",durationMin:12})),170,5));
assert.equal(settleAdventure(newGame(),tooShort,"walk-short-0002").awarded,false,"Keep 3min minimum");
const shortNoGPS=endAdventure(walk(startAdventure(createAdventure({mode:"walk",durationMin:12})),240,0));
assert.equal(settleAdventure(newGame(),shortNoGPS,"walk-short-0003").awarded,false,"Require at least one actual GPS movement segment");
const fake={...completed,distanceM:3,elapsedSec:240,mode:"gps"};
assert.equal(settleAdventure(newGame(),fake,"run-three-metre").awarded,false,"Running still needs 200m");
assert.equal(expeditionReward(completed).mode,"walk");
assert.equal(summarizeAdventure(completed).distanceM,Math.round(completed.distanceM));

const hub=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
const report=fs.readFileSync(new URL("../src/session-report.mjs",import.meta.url),"utf8");
for(const marker of ["walkHeartbeat()","walkPendingDistanceM+=d", 'stepGame(elapsed,15,metres)', 'setGpsStatus("exploring"', 'mode==="walk"?"강아지 산책 · 느긋한 탐색"', 'expedition.mjs?v=1.4'])
 assert.ok(hub.includes(marker),"Missing live stationary walk loop "+marker);
assert.ok(report.includes("GPS 탐색 시간")&&report.includes("실제 이동 3m"),"Walk report must give truthful reward rules");
console.log("DOG WALK PASS: stationary GPS progression, timed clues, 3m movement payout, GPS run unchanged, once-only guild/loot rewards");
