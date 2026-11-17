import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {MELEE_STYLES,WEAPON_PROFILES,weaponProfile,normalizeMeleeStyle,
 classifyMeleeGesture,classifyAttackIntent,motionFeatures,motionSimilarity,createMeleeAction,actionProgress,contactDue,meleeHitInfo,projectileProfile}
 from "../src/player-combat.mjs";
import {attackTrailPoints,drawFirstPersonWeapon} from "../src/weapon-view.mjs";
import {validMotionPacket} from "../src/motion-core.mjs";
const ids=["sword","greatsword","axe","bow","staff"];
assert.deepEqual(Object.keys(WEAPON_PROFILES).sort(),ids.slice().sort());
assert.deepEqual(MELEE_STYLES,["sweep","overhead","thrust"]);
assert.equal(weaponProfile("wrong").name,WEAPON_PROFILES.sword.name);
assert.equal(normalizeMeleeStyle(null,"axe"),"overhead");
assert.equal(normalizeMeleeStyle("sweep","axe"),"sweep");
assert.equal(classifyMeleeGesture({acceleration:{x:9,y:1,z:2}}),"sweep");
assert.equal(classifyMeleeGesture({acceleration:{x:1,y:9,z:2}}),"overhead");
assert.equal(classifyMeleeGesture({acceleration:{x:0,y:1,z:9}}),"thrust");
assert.equal(classifyMeleeGesture({acceleration:{x:9,y:1,z:2}},"overhead"),"overhead");
assert.equal(classifyMeleeGesture({}, "auto"),"sweep");
const windowSamples=[
 {rotationRate:{alpha:28,beta:4,gamma:3},acceleration:{x:1,y:4,z:0}},
 {rotationRate:{alpha:53,beta:110,gamma:12},acceleration:{x:1,y:11,z:1}},
 {rotationRate:{alpha:31,beta:10,gamma:20},acceleration:{x:2,y:6,z:1}}
];
assert.equal(classifyMeleeGesture(windowSamples),"overhead","Detect peak vertical motion in the full swing");
assert.equal(classifyAttackIntent([{acceleration:{x:0,y:0,z:11}}],"auto").type,"throw");
assert.equal(classifyAttackIntent([{acceleration:{x:12,y:1,z:0}}],"auto").type,"melee");
assert.equal(classifyAttackIntent([{acceleration:{x:0,y:0,z:11}}],"melee").style,"thrust","Manual melee allows thrust");
assert.equal(classifyAttackIntent([{acceleration:{x:12,y:1,z:0}}],"throw").type,"throw","Manual throw overrides inferred style");
const samples=motionFeatures(windowSamples);
const templates={sweep:motionFeatures({acceleration:{x:11,y:1,z:0}}),overhead:samples,thrust:motionFeatures({acceleration:{x:0,y:1,z:11}})};
assert.ok(motionSimilarity(samples,templates.overhead)>.99);
assert.equal(classifyMeleeGesture(windowSamples,"auto",templates),"overhead","Calibrated styles must work");
assert.equal(createMeleeAction("bow","sweep",10).style,"thrust","A bow must shove, never slash like a sword");
const packet={type:"gesture",gesture:"melee",seq:1,strength:70,time:Date.now(),session:"mrpg-123456",style:"overhead"};
assert.ok(validMotionPacket(packet,packet.session));
assert.equal(validMotionPacket({...packet,style:"invalid"},packet.session),false);
assert.equal(validMotionPacket({...packet,gesture:"throw"},packet.session),false);
assert.ok(validMotionPacket({...packet,style:undefined},packet.session),"Old S21 controller remains compatible");

for(const weapon of ids){
 const profile=weaponProfile(weapon);
 assert.ok(profile.reach>=2.5&&profile.reach<=5.5);
 assert.ok(profile.seconds>=.4);
 assert.ok(["arrow","orb","rune","ember","aura"].includes(projectileProfile(weapon).kind));
 for(const style of MELEE_STYLES){
  const action=createMeleeAction(weapon,style,10);
  assert.ok(action.startAt<action.contactAt&&action.contactAt<action.endsAt);
  assert.equal(actionProgress(action,10),0);
  assert.ok(Math.abs(actionProgress(action,action.endsAt)-1)<1e-8,"Attack progress completes at 100%");
  assert.equal(contactDue(action,10,action.contactAt-.001),false);
  assert.equal(contactDue(action,10,action.contactAt),true);
  const front={x:0,z:-3},behind={x:0,z:3};
  assert.equal(meleeHitInfo(action,{x:0,z:0},front,0).canHit,
    3<=profile.reach*(style==="thrust"?1.08:1),"Front hit range varies with weapon");
  assert.equal(meleeHitInfo(action,{x:0,z:0},behind,0).canHit,false,"Cannot strike behind hero");
  const side={x:1.7,z:-2.5};
  const info=meleeHitInfo(action,{x:0,z:0},side,0);
  if(style==="sweep"&&weapon!=="bow")assert.equal(info.canHit,true,"Sweeps should cover flanks");
  if(style==="thrust")assert.equal(info.canHit,false,"Thrust should require narrow aim");
 }
}
// Sword sweep crosses left-to-right, overhead moves down and thrust shoots inward.
const sweep=attackTrailPoints(800,500,"sweep");
const overhead=attackTrailPoints(800,500,"overhead");
const thrust=attackTrailPoints(800,500,"thrust");
assert.ok(sweep[0].x-sweep.at(-1).x>480,"Trail must move right-to-left with the visible blade");
assert.ok(overhead.at(-1).y-overhead[0].y>260);
assert.ok(thrust.at(-1).x<thrust[0].x&&thrust.at(-1).y<thrust[0].y);

// Mock a standards-compliant canvas surface, verifying every visible pose.
let operations=[];
const canvas=new Proxy({},{
 get(target,key){
  if(key==="createRadialGradient"||key==="createLinearGradient")return()=>({addColorStop(){}});
  if(typeof key==="symbol")return undefined;
  return (...args)=>{operations.push(String(key));};
 },
 set(target,key,value){target[key]=value;return true;}
});
for(const weapon of ids){
 for(const style of MELEE_STYLES){
  const action=createMeleeAction(weapon,style,10);
  for(const progress of [0,.25,.55,.9,1]){
   operations=[];
   drawFirstPersonWeapon(canvas,890,410,weapon,action,null,10+action.duration*progress);
   assert.ok(operations.filter(x=>x==="stroke").length>4,weapon+" "+style+" must show the weapon itself");
   assert.ok(operations.includes("fill"),"Visible low-poly weapon facets");
  }
 }
 operations=[];
 const cast={weapon,startAt:10,duration:.5,endsAt:10.5};
 drawFirstPersonWeapon(canvas,420,900,weapon,null,cast,10.2);
 assert.ok(operations.includes("stroke"),"Ranged stance is visible on portrait mode");
}
const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const controller=fs.readFileSync(new URL("../controller.html",import.meta.url),"utf8");
assert.ok(arena.includes("createMeleeAction(equipped.weapon,style,clock)"));
assert.ok(arena.includes("if(!meleeAction.damageDone&&clock>=meleeAction.contactAt)"));
assert.ok(arena.includes("meleeHitInfo(meleeAction,camera,enemy,yaw)"),"Actual damage uses the same arc");
assert.ok(arena.includes("drawFirstPersonWeapon(weaponCtx,W,H,equipped.weapon"),"First person weapon must be rendered");
assert.ok(arena.includes('id="weaponCanvas"')&&arena.includes("renderPlayerProjectile(p)"));
assert.ok(arena.includes('swordHit(packet.style)'),"Live S21 attack style must be used");
assert.ok(arena.includes('swordHit("sweep")')&&arena.includes('swordHit("overhead")')&&arena.includes('swordHit("thrust")'));
assert.ok(!arena.includes("el('slashFx').classList"),"Old static slash effect must be replaced");
assert.ok(controller.includes('data-mode="auto"')&&controller.includes('id="cutStyle"'),"Automatic and manual combat modes");
assert.ok(controller.includes('id="cutStyle"')&&controller.includes("classifyMeleeGesture(e,cutStyle)"));
const script=arena.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const tmp=path.join(os.tmpdir(),"motion-player-combat-"+process.pid+".mjs");
try{
 fs.writeFileSync(tmp,script);
 const check=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});
 assert.equal(check.status,0,"Arena module syntax: "+check.stderr);
}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
console.log("PLAYER COMBAT PASS: 5 weapons × 3 attacks, timed collision, visible first-person render and S21 direction packets");
