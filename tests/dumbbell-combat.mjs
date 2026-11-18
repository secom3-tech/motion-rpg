import assert from "node:assert/strict";
import fs from "node:fs";
import {exerciseAttackMode,exerciseApproachState,exerciseCameraClearance,
 separateExerciseCamera,EXERCISE_REAPPROACH_DISTANCE} from "../src/dumbbell-combat.mjs";
const get=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
assert.equal(exerciseAttackMode(4.69,4.7),"melee");
assert.equal(exerciseAttackMode(4.7,4.7),"melee","Exact melee reach stays close range");
assert.equal(exerciseAttackMode(4.71,4.7),"ranged","Outside weapon reach uses bow");
assert.equal(exerciseAttackMode(7,5.5),"ranged","Greatsword reach is distinct");
assert.equal(exerciseAttackMode(4.2,4.25),"melee","Axe reach is distinct");
assert.equal(EXERCISE_REAPPROACH_DISTANCE,12);
let engagement=exerciseApproachState(false,18,4.2);
assert.deepEqual(engagement,{engaged:false,move:true});
engagement=exerciseApproachState(false,4.19,4.2);
assert.deepEqual(engagement,{engaged:true,move:false});
for(const distance of [3,4.3,5.5,9.5,11.99]){
 engagement=exerciseApproachState(engagement.engaged,distance,4.2);
 assert.equal(engagement.move,false,"No continuous chasing after engagement at "+distance);
}
engagement=exerciseApproachState(true,12.1,4.2);
assert.deepEqual(engagement,{engaged:false,move:true},"Reapproach only when target is lost");
assert.deepEqual(exerciseApproachState(false,4.2,4.2),{engaged:true,move:false});
for(let kind=0;kind<8;kind++)assert.ok(exerciseCameraClearance(kind)>=3.1);
assert.ok(exerciseCameraClearance(5)>exerciseCameraClearance(0),"Boar body gets extra clearance");
assert.ok(exerciseCameraClearance(7)>4.7,"Tall treant requires camera stand-off, allowing ranged exercise");
for(const [player,monster] of [
 [{x:0,z:0},{x:.4,z:0}],
 [{x:-22,z:-31},{x:-21.7,z:-30.8}],
 [{x:22,z:7},{x:21.9,z:6.7}],
 [{x:-22,z:5},{x:-22,z:5}],
]){
 const out=separateExerciseCamera(player,monster,5.0);
 assert.ok(out.moved);
 assert.ok(Math.hypot(out.x-monster.x,out.z-monster.z)>=4.989,
  "Camera cannot remain inside monster, even on map edge");
 assert.ok(out.x>=-22&&out.x<=22&&out.z>=-31&&out.z<=7);
}
assert.deepEqual(separateExerciseCamera({x:10,z:1},{x:0,z:0},5),
 {x:10,z:1,moved:false},"No jumping when safely separated");
const arena=get("indoor.html");
for(const marker of [
 'function autoExploreDumbbell(dt)',
 'exerciseApproachState(exerciseEngaged,dist,spacing)',
 'exerciseEngaged=false;',
 'exerciseAttackMode(distance2d(camera,enemy),weaponProfile(equipped.meleeWeapon).reach)',
 'exerciseCameraClearance(enemy.kind)',
 'separateExerciseCamera(camera,enemy,exerciseCameraClearance(enemy.kind))',
 'if(dumbbellMode)return;',
 'if(dumbbellMode&&remote.type==="weapon-switch")',
 'const accepted=activeWeaponMode==="ranged"?magic():swordHit("overhead")',
 'accepted=attackMode==="ranged"?magic():swordHit(packet.gesture==="melee"?packet.style:null)',
 'watchInputMode?"워치4 아령 컬 · 거리 자동 검/활"',
 'if(dumbbellMode&&!enemy.dead&&d<=13)',
])assert.ok(arena.includes(marker),"Distance exercise integration missing: "+marker);
assert.ok(arena.includes('if(dumbbellMode){activeWeaponMode="melee";autoSwitchEnabled=true;'));
assert.ok(arena.includes('el("weaponToggle").hidden=true;'));
console.log("EXERCISE COMBAT PASS: mode by reach, stationary engagement, reset per enemy, camera collision");
