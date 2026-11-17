import assert from "node:assert/strict";
import fs from "node:fs";
import {rangedProfile,isRangedStyle,canStartRanged,fireRangedProjectile,projectileStep} from "../src/enemy-ranged.mjs";
import {ATTACKS,angleToTarget,distance2d} from "../src/combat-spatial.mjs";
import {attackVisualState,attackWindup} from "../src/attack-visual.mjs";
import {monsterMovementProfile,createMonsterMind,monsterMotionStep} from "../src/monster-ai.mjs";

assert.equal(rangedProfile(4).kind,"rock");
assert.equal(rangedProfile(6).kind,"wisp");
assert.equal(rangedProfile(3),null);
assert.ok(isRangedStyle("rock"));
assert.ok(isRangedStyle("bolt"));
assert.equal(isRangedStyle("slam"),false);
assert.ok(monsterMovementProfile(4).aggro>=18);
assert.ok(monsterMovementProfile(4).walk>1);
const enemy={x:0,z:0,kind:4,facing:0,dead:false,speed:1.05};
let hero={x:0,y:1.7,z:11};
assert.ok(canStartRanged(enemy,hero,4,angleToTarget,distance2d));
assert.equal(canStartRanged({...enemy,facing:Math.PI},hero,4,angleToTarget,distance2d),false);
assert.equal(canStartRanged(enemy,{x:0,z:30},4,angleToTarget,distance2d),false);
assert.equal(canStartRanged(enemy,{x:0,z:2},4,angleToTarget,distance2d),false);
assert.equal(canStartRanged(enemy,hero,3,angleToTarget,distance2d),false);
assert.ok(attackWindup(ATTACKS[4],"rock",4)>=2.2);
const pose=attackVisualState({windup:1,windupTotal:2.2,impactUntil:0,attackStyle:"rock",dead:false},5);
assert.equal(pose.stage,"windup");assert.equal(pose.style,"rock");
assert.equal(attackVisualState({windup:1,windupTotal:1.6,impactUntil:0,attackStyle:"bolt",dead:false},5).style,"bolt");

let stone=fireRangedProjectile(enemy,hero,4,10),start={x:stone.x,z:stone.z};
assert.equal(stone.kind,"rock");
assert.equal(stone.aim.z,11);
assert.equal(stone.y,2.7);
assert.ok(stone.lifetime>1);
let hit=false;
for(let i=0;i<80;i++){
 const res=projectileStep(stone,.05,hero);
 if(res.hit){hit=true;break;}
 if(res.expired)break;
}
assert.equal(hit,true,"Stationary player should be struck after visible rock travel");
assert.ok(stone.age>.2,"No instantaneous hit");
stone=fireRangedProjectile(enemy,hero,4,10);
let missed=true;
for(let i=0;i<100;i++){
 const player=i>6?{x:4,y:1.7,z:11}:hero;
 const state=projectileStep(stone,.05,player);
 if(state.hit){missed=false;break;}
 if(state.expired)break;
}
assert.equal(missed,true,"Moving sideways while stone is in flight avoids impact");
assert.equal(stone.aim.x,0,"Stone must not steer after player moves");
const wisp={...enemy,kind:6,facing:0},bolt=fireRangedProjectile(wisp,hero,6,10);
assert.equal(bolt.kind,"wisp");
assert.equal(bolt.aim.z,11);
assert.ok(bolt.radius<rangedProfile(4).radius);
const mind=createMonsterMind(4,0,0,.2);
const m=monsterMotionStep(enemy,hero,mind,.05,1);
assert.equal(m.aggro,true);
assert.ok(Math.hypot(m.x,m.z)>0,"Awakened golem moves rather than freezes at a distance");

const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const ui=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const v of [
 "fireRangedProjectile(enemy,camera,enemy.kind,clock)",
 "projectileStep(shot,dt,camera)",
 "renderEnemyProjectile(shot)",
 "isRangedStyle(enemy.attackStyle)",
 "if(result.hit)",
 "enemyShots.push(shot)"
])assert.ok(arena.includes(v),"Missing real arena projectile integration "+v);
assert.ok(ui.includes('id="startDemo"')&&ui.includes('class="devOnly" hidden'),"Mock controls remain internal and hidden");
assert.ok(ui.includes('location.assign("./indoor.html?'),"Village must launch hunting directly");
assert.ok(!ui.includes('data-view="indoor"'),"Remove redundant test battle navigation");
assert.ok(ui.includes('data-go="village"'),"Outdoor screen must have town return");
console.log("RANGED HUNT PASS: golem/wisp ranged attacks, launch telegraph, travel collision, sideways evasion and streamlined hub.");
