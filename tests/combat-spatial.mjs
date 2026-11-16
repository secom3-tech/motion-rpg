import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {
  ATTACKS, distance2d, angleToTarget, angleDifference, turnToTarget,
  strikeInfo, spawnAroundPlayer
} from "../src/combat-spatial.mjs";

const zero={x:0,z:0},front={x:0,z:3},back={x:0,z:-3},side={x:3,z:0};
assert.equal(distance2d(zero,{x:3,z:4}),5);
assert.equal(angleToTarget(zero,front),0);
assert.ok(Math.abs(angleToTarget(zero,side)-Math.PI/2)<1e-8);
assert.ok(Math.abs(angleDifference(-Math.PI+.1,Math.PI-.1)+.2)<1e-8);
assert.ok(Math.abs(turnToTarget(0,Math.PI,0.3))<=0.30000001,"Monster should not spin instantly");

for(const monster of ATTACKS){
 const e={...zero,facing:0};
 assert.equal(strikeInfo(e,front,monster.range,monster.arc).canHit,true,"Front hit: "+monster.name);
 assert.equal(strikeInfo(e,back,monster.range,monster.arc).canHit,false,"Back attack must miss: "+monster.name);
 assert.equal(strikeInfo(e,side,monster.range,monster.arc).canHit,false,"90deg side attack must miss: "+monster.name);
 assert.equal(strikeInfo(e,{x:0,z:monster.range+1},monster.range,monster.arc).canHit,false,"Out of range must miss: "+monster.name);
 const turned={...e,facing:Math.PI};
 assert.equal(strikeInfo(turned,back,monster.range,monster.arc).canHit,true,"Turning should make rear target forward: "+monster.name);
 const half=Math.sin(monster.arc*.50)*monster.range;
 assert.equal(strikeInfo(e,{x:half,z:Math.cos(monster.arc*.50)*monster.range},monster.range+.2,monster.arc).canHit,true);
}
const wolf=ATTACKS[3],guard={x:0,z:0,facing:0};
assert.equal(strikeInfo(guard,{x:2.5,z:-2.5},wolf.range,wolf.arc).canHit,false,"Behind + near must still miss");

let seed=311351;
const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
const seen=new Set(),counts={center:0,corner:0};
const bbox={minX:-20,maxX:20,minZ:-29,maxZ:5};
for(let i=0;i<3000;i++){
 let player,heading;
 if(i%3===0){player={x:0,z:-12};heading=Math.PI;counts.center++}
 else if(i%3===1){player={x:-19.5,z:-28.5};heading=Math.PI;counts.corner++}
 else{player={x:(rng()-.5)*39,z:-28+rng()*32};heading=rng()*Math.PI*2}
 const p=spawnAroundPlayer(player,heading,rng,bbox);
 assert.ok(p.x>=bbox.minX&&p.x<=bbox.maxX,"Spawn x should be on map");
 assert.ok(p.z>=bbox.minZ&&p.z<=bbox.maxZ,"Spawn z should be on map");
 assert.ok(distance2d(player,p)>=9.99,"Enemy cannot materialize adjacent to hero");
 assert.ok(Number.isFinite(p.heading)&&Number.isFinite(p.distance));
 if(i%3===0)seen.add(Math.round(p.x)+":"+Math.round(p.z));
}
assert.ok(seen.size>20,"A standing player should see monsters appearing at many positions: "+seen.size);
assert.throws(()=>spawnAroundPlayer({x:NaN,z:0},0,rng),/Invalid/);
assert.throws(()=>spawnAroundPlayer({x:0,z:0},0,rng,{minX:0,maxX:0,minZ:-1,maxZ:1}),/Invalid/);

const html=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(script);
const filename=path.join(os.tmpdir(),"motion-spatial-"+process.pid+".mjs");
try{
 fs.writeFileSync(filename,script[1]);
 const check=spawnSync(process.execPath,["--check",filename],{encoding:"utf8"});
 assert.equal(check.status,0,"Arena JS invalid: "+check.stderr);
}finally{if(fs.existsSync(filename))fs.unlinkSync(filename)}
for(const expected of [
 "spawnAroundPlayer(camera", "strikeInfo(enemy,camera", "turnToTarget(enemy.facing",
 "function enemyPart(", "function applyEnemyHit(", "function flashHit(",
 'id="hitFx"', 'id="damageNumber"', 'id="attackCue"', ".hitShake", "enemy.facing"
])assert.ok(html.includes(expected),"Expected spatial/FX integration: "+expected);
assert.equal(html.includes("dist<threatRange"),false,"Old radial damage path should be removed");
console.log("COMBAT SPATIAL TEST PASS: back/flank misses and front hits for 5 enemies");
console.log("3,000 variable spawns across corners/bounds; distinct center positions:",seen.size);
console.log("Arena syntax and visual feedback elements PASS");
