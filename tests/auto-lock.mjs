import assert from "node:assert/strict";
import fs from "node:fs";
import {canAutoAcquire,followTargetYaw,assistedAimYaw,AUTO_LOCK_MANUAL_PAUSE,AUTO_LOCK_RANGE} from "../src/target-assist.mjs";
import {monsterMovementProfile,createMonsterMind,monsterMotionStep,retainTarget} from "../src/monster-ai.mjs";
import {createMeleeAction,meleeHitInfo} from "../src/player-combat.mjs";

const player={x:0,z:0},front={x:0,z:-8,dead:false},behind={x:0,z:8,dead:false};
assert.equal(canAutoAcquire(player,0,front),true,"Near visible monster gets automatic lock");
assert.equal(canAutoAcquire(player,0,behind),false,"Distant enemy behind should not snap the camera");
assert.equal(canAutoAcquire(player,0,{...behind,z:4}),true,"Monster circling within 5.2m remains discoverable");
assert.equal(canAutoAcquire(player,0,{...front,z:-14}),false,"Far monster must not lock");
assert.equal(canAutoAcquire(player,0,{...front,dead:true}),false,"Dead monster must never lock");
assert.equal(AUTO_LOCK_RANGE,12.5);
assert.ok(AUTO_LOCK_MANUAL_PAUSE>=2,"Manual look must retain control for at least two seconds");
assert.equal(retainTarget(player,front),true);
assert.equal(retainTarget(player,{...front,dead:true}),false);
const tracked=followTargetYaw(0,Math.PI/2,.016);
assert.ok(tracked>0&&tracked<.028,"One frame must turn gently, not snap");
assert.equal(followTargetYaw(0,.015,.016),0,"Small camera jitter should be ignored");
assert.equal(followTargetYaw(0,Math.PI/2,0),0,"Paused rendering must not rotate");
let yaw=0;for(let i=0;i<150;i++)yaw=followTargetYaw(yaw,Math.PI/2,.016);
assert.ok(yaw>1.2&&yaw<Math.PI/2,"Smooth camera eventually faces the moving monster");

const within={x:.53,z:-4.45,dead:false};
const rawYaw=0,corrected=assistedAimYaw(player,rawYaw,within,.17,4.7);
assert.ok(corrected>0&&corrected<.17,"Tiny facing error may be corrected");
assert.equal(assistedAimYaw(player,0,{x:3,z:-3,dead:false},.17,4.7),0,"No wide-angle auto-hit");
assert.equal(assistedAimYaw(player,0,{x:1,z:-10,dead:false},.17,4.7),0,"Sword must never gain extra reach");
assert.equal(assistedAimYaw(player,0,{x:0,z:-4,dead:true}),0);
const sword=createMeleeAction("sword","thrust",10);
const grazing={x:.65,z:-4.5,dead:false};
const normal=meleeHitInfo(sword,player,grazing,rawYaw);
const better=meleeHitInfo(sword,player,grazing,assistedAimYaw(player,rawYaw,grazing,.17,5.1));
assert.ok(better.canHit||normal.canHit,"Bounded assist helps a small aim error but never invents range");

const profile=monsterMovementProfile(3);
assert.ok(profile.space>=4,"Melee enemy keeps a readable gap");
assert.ok(profile.strafe<.8,"Wolf should not rapidly orbit point blank");
assert.ok(monsterMovementProfile(6).strafe<1,"Wisp still circles, but at a manageable pace");
const mon={x:2,z:0,speed:2.5,kind:3};
const mind=createMonsterMind(3,2,0,.3);mind.aggro=true;mind.retreatUntil=10;
const before=Math.hypot(mon.x-player.x,mon.z-player.z);
const moved=monsterMotionStep(mon,player,mind,.05,9);
const after=Math.hypot(moved.x-player.x,moved.z-player.z);
assert.ok(after>before,"Enemy should step back after finishing attack");

const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const pad=fs.readFileSync(new URL("../controller.html",import.meta.url),"utf8");
const motion=fs.readFileSync(new URL("../src/motion-core.mjs",import.meta.url),"utf8");
for(const marker of ["canAutoAcquire(camera,yaw,enemy)","followTargetYaw(yaw,direction,dt)",
 "assistedAimYaw(camera,yaw,enemy,.17,maxReach)","id=\"autoLockSetting\"",
 "AUTO_LOCK_MANUAL_PAUSE","setAutoLock(!autoLockEnabled)","pauseAutoAim()","enemyMind.retreatUntil",
 "clock-lastFire<.48+stats.attackDelay","clock-lastFire<.60+stats.attackDelay"])
 assert.ok(arena.includes(marker),"Missing v0.44 arena behavior: "+marker);
assert.ok(pad.includes("자동 락온 끄기")&&pad.includes("data.autoEnabled"),
 "S21 must expose the automatic target mode and reflect host state");
assert.ok(motion.includes("throwCooldownMs")&&motion.includes("rearmQuiet"),
 "Previously tuned gesture rearm/cooldown must be left intact");
console.log("V0.44 PASS: smooth automatic targeting, narrow range-limited aim assist, manual override, calmer monster orbit and unchanged attack cooldown.");
