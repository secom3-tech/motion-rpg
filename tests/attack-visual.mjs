import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {ATTACKS,strikeInfo} from "../src/combat-spatial.mjs";
import {attackArea,attackWindup,attackVisualState,warningFootprint} from "../src/attack-visual.mjs";

for(let kind=0;kind<ATTACKS.length;kind++){
 const attack=ATTACKS[kind],entity={x:2.5,z:-7.1,facing:Math.PI*.37,kind,dead:false};
 for(const style of (kind===5?["slam","sweep","charge"]:["slam","sweep"])){
  const area=attackArea(attack,style);
  assert.equal(area.range,style==="charge"?attack.range*1.05:attack.range);
  assert.ok(area.arc>0&&area.arc<=attack.arc);
  const time=attackWindup(attack,style,kind);
  assert.ok(time>=1.60&&time<3,"Visually readable windup on all enemies");
  const footprint=warningFootprint(entity,attack,style);
  assert.equal(footprint.edge.length,10);
  assert.equal(footprint.borders.length,6);
  assert.ok(footprint.fill.length>0);
  assert.ok(footprint.edge.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)));
  for(const point of footprint.edge){
   const info=strikeInfo(entity,point,area.range+.001,area.arc+.0001);
   assert.equal(info.canHit,true,"Painted edge must match collision: "+attack.name+" "+style);
  }
  const front={x:entity.x+Math.sin(entity.facing)*area.range*.85,
    z:entity.z+Math.cos(entity.facing)*area.range*.85};
  assert.ok(strikeInfo(entity,front,area.range,area.arc).canHit);
  const outside={x:entity.x+Math.sin(entity.facing+area.arc+.10)*area.range*.85,
    z:entity.z+Math.cos(entity.facing+area.arc+.10)*area.range*.85};
  assert.ok(!strikeInfo(entity,outside,area.range,area.arc).canHit);
  const behind={x:entity.x-Math.sin(entity.facing)*2,
    z:entity.z-Math.cos(entity.facing)*2};
  assert.ok(!strikeInfo(entity,behind,area.range,area.arc).canHit);
  assert.deepEqual(attackVisualState({...entity,windup:0,windupTotal:time,impactUntil:0},100).stage,"idle");
  const start=attackVisualState({...entity,attackStyle:style,windup:time,windupTotal:time,impactUntil:0},100);
  assert.equal(start.stage,"windup");assert.equal(start.progress,0);
  const mid=attackVisualState({...entity,attackStyle:style,windup:time*.5,windupTotal:time,impactUntil:0},100);
  assert.equal(mid.stage,"windup");assert.equal(mid.progress,.5);
  const release=attackVisualState({...entity,attackStyle:style,windup:0,windupTotal:time,impactUntil:100.54,impactDuration:.54},100);
  assert.equal(release.stage,"impact");assert.equal(release.impact,1);
  const tail=attackVisualState({...entity,attackStyle:style,windup:0,windupTotal:time,impactUntil:100.54,impactDuration:.54},100.4);
  assert.ok(tail.impact>0&&tail.impact<1);
  const done=attackVisualState({...entity,attackStyle:style,windup:0,windupTotal:time,impactUntil:100.54,impactDuration:.54},100.54);
  assert.equal(done.stage,"idle");
 }
}
assert.throws(()=>attackArea(ATTACKS[0],"unknown"),/Unknown attack style/);
assert.throws(()=>warningFootprint({x:NaN,z:0,facing:0},ATTACKS[0],"sweep"),/Invalid enemy/);
assert.equal(attackVisualState({dead:true,windup:1},1).stage,"idle");
const html=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(script,"Arena should be an ESM module");
const file=path.join(os.tmpdir(),"motion-attack-visual-"+process.pid+".mjs");
try{
 fs.writeFileSync(file,script[1]);
 const check=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
 assert.equal(check.status,0,"Arena JS syntax: "+check.stderr);
}finally{if(fs.existsSync(file))fs.unlinkSync(file);}
for(const str of [
 'renderAttackFxSafely("warning",enemyVisual)','renderAttackFxSafely("impact",enemyVisual)',
 "showEnemyStrike()","attackArea(attack,enemy.attackStyle)",
 "enemy.windupTotal=attackWindup","enemy.impactUntil=clock+enemy.impactDuration",
 "function renderBeast(ex,ey,ez,visual)",'id="attackBanner"','id="attackBannerMeter"'
])assert.ok(html.includes(str),"Missing visible attack integration: "+str);
assert.ok(html.includes("if(enemy.windup<=0&&clock>=enemy.impactUntil)"),"Facing may not turn during impact");
assert.ok(html.includes("if(dist<minDist)"),"Player should not be able to walk through monster body");
assert.ok(html.includes("enemy.impactUntil=0;bankProgress()"),"Defeat should not leave an attack effect frozen");
assert.ok(html.includes("if(!el(\"motionPanel\").hidden||document.hidden)return;"),"Attack timer must pause while setting up motion");
console.log("ATTACK VISUAL TEST PASS: eight monsters, charge/sweep/slam, matching cones and timed animations");
