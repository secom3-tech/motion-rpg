import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {xpRequiredForNextLevel,nextLevelState,applyExperienceCurve,experienceProgress,LEVEL_CURVE_VERSION} from "../src/progression.mjs";
import {createMonsterMind,monsterMotionStep,monsterMovementProfile,canAcquireTarget,retainTarget} from "../src/monster-ai.mjs";
import {availableVillageRumours,villageRumour,villageObjective} from "../src/town-life.mjs";

assert.equal(xpRequiredForNextLevel(1),90);
assert.ok(xpRequiredForNextLevel(2)>xpRequiredForNextLevel(1));
assert.ok(xpRequiredForNextLevel(4)>xpRequiredForNextLevel(3));
assert.ok(xpRequiredForNextLevel(9)>xpRequiredForNextLevel(8));
let state={xp:0,level:1,levelProgress:{version:LEVEL_CURVE_VERSION,nextXp:90}};
let threshold=90,previousRequirement=0;
for(let level=2;level<=12;level++){
 const prior=state;
 state=applyExperienceCurve(prior,{...prior,xp:threshold});
 assert.equal(state.level,level);
 assert.ok(state.levelProgress.nextXp>state.xp);
 const delta=xpRequiredForNextLevel(level);
 assert.ok(delta>previousRequirement,"XP step should rise each level");
 previousRequirement=delta;
 threshold+=delta;
 assert.equal(state.levelProgress.nextXp,threshold);
}
const legacy={xp:195,level:2,gold:43};
const converted=applyExperienceCurve(legacy,{...legacy,xp:210});
assert.ok(converted.level>=legacy.level,"Old player cannot lose levels");
assert.equal(converted.gold,43);
assert.ok(converted.levelProgress.nextXp>converted.xp);
assert.ok(nextLevelState({xp:95,level:1}).nextXp<=104,"Save conversion keeps nearly completed legacy XP bar");
const bar=experienceProgress(state);
assert.ok(bar.ratio>=0&&bar.ratio<=1);
assert.ok(bar.remaining>0);

const player={x:0,z:0},far={x:0,z:-22};
for(let kind=0;kind<8;kind++){
 const enemy={kind,x:far.x,z:far.z,speed:kind===3?2.7:1.8,dead:false};
 const mind=createMonsterMind(kind,enemy.x,enemy.z,.7);
 for(let frame=0;frame<110;frame++){
  const old={x:enemy.x,z:enemy.z};
  const out=monsterMotionStep(enemy,player,mind,.033,frame*.033);
  assert.ok(Number.isFinite(out.x)&&Number.isFinite(out.z));
  assert.ok(out.x>=-21&&out.x<=21&&out.z>=-30&&out.z<=6);
  assert.ok(Math.hypot(out.x-old.x,out.z-old.z)<.22,"Movement must be bounded per frame");
  enemy.x=out.x;enemy.z=out.z;
 }
 assert.equal(mind.aggro,false,"Distant enemy should patrol rather than chase player");
 const close={x:enemy.x+1,z:enemy.z+1};
 const chase=monsterMotionStep(enemy,close,mind,.033,5);
 assert.equal(chase.aggro,true,"Nearby players trigger hunting behaviour");
 assert.ok(monsterMovementProfile(kind).aggro>=8);
}
assert.ok(monsterMovementProfile(3).strafe>monsterMovementProfile(4).strafe,"Wolf should flank more than golem");
assert.ok(monsterMovementProfile(6).strafe>monsterMovementProfile(0).strafe,"Wisp should orbit");
assert.equal(canAcquireTarget(player,0,{x:0,z:-9,dead:false}),true);
assert.equal(canAcquireTarget(player,0,{x:0,z:-18,dead:false}),false);
assert.equal(canAcquireTarget(player,0,{x:0,z:9,dead:false}),false);
assert.equal(canAcquireTarget(player,0,{x:10,z:0,dead:false}),false);
assert.equal(canAcquireTarget(player,Math.PI/2,{x:10,z:0,dead:false}),true);
assert.equal(retainTarget(player,{x:0,z:-19,dead:false}),false);
assert.equal(retainTarget(player,{x:0,z:-17,dead:false}),true);
assert.equal(retainTarget(player,{x:0,z:-3,dead:true}),false);
assert.equal(availableVillageRumours({level:1}).length,5);
assert.ok(availableVillageRumours({rpgGear:{totalKills:4}}).length>5);
const a=villageRumour({level:1},"2026-11-17",0);
assert.deepEqual(a,villageRumour({level:1},"2026-11-17",0));
assert.notDeepEqual(a,villageRumour({level:1},"2026-11-17",1));
assert.ok(villageObjective({quests:{forest:{attempts:2}}}).progress>0);
assert.equal(villageObjective({quests:{forest:{bossDefeated:true}}}).progress,1);

const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const town=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const check of ["monsterMotionStep(enemy,camera,enemyMind,dt,clock)",
 "canAcquireTarget(camera,yaw,enemy)","retainTarget(camera,enemy)",
 "enemyMind.aggro=true","enemy.moveSpeed","createMonsterMind(enemy.kind,enemy.x,enemy.z,rand())"]){
 assert.ok(arena.includes(check),"Arena AI integration missing: "+check);
}
assert.ok(arena.includes("let targetLocked=false"),"Lock-on cannot auto-snap every enemy at any distance");
for(const id of ["homeNextXp","homeXpProgress","rumourWho","rumourLine","rumourNext","homeObjective","homeObjectiveDesc"]){
 assert.ok(town.includes('id="'+id+'"'),"Village missing "+id);
}
assert.ok(town.includes("experienceProgress(s)"),"Village must show real level curve");
assert.ok(town.includes("villageRumour(state,today,rumorOffset)"),"Village rumors should evolve");
assert.ok(town.includes("function drawVillage()"),"Village atmosphere render exists");
const files=[["../indoor.html",arena],["../preview.html",town]];
for(const [name,html] of files){
 const code=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(code);
 const tmp=path.join(os.tmpdir(),"motion-next-phase-"+(name.includes("indoor")?"in":"town")+"-"+process.pid+".mjs");
 try{
  fs.writeFileSync(tmp,code);
  const check=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});
  assert.equal(check.status,0,check.stderr);
 }finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp)}
}
console.log("NEXT PHASE PASS: rising XP level thresholds, legacy saves, enemy patrol/strafe/lock, village rumours and UI");
