import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {motionSample,gestureThreshold,createGestureDetector,dominantAxis,validMotionPacket}
 from "../src/motion-core.mjs";
import {poseMeasurements,classifyMovement,createPoseTracker} from "../src/pose-core.mjs";
import {VISION_SOURCES,loadPoseModel} from "../src/pose-camera.mjs";
import {cleanRoom,randomRoom} from "../src/peer-bridge.mjs";
import {dodgeMatches} from "../src/combat-spatial.mjs";

// 1. Device motion - limit duplicates, reject fake/invalid messages.
const event=(r,a=0)=>({rotationRate:{alpha:r,beta:0,gamma:0},acceleration:{x:a,y:0,z:0}});
assert.ok(motionSample(event(220)).valid);
assert.ok(!motionSample(event(6000)).valid,"Rejected impossible angular velocity");
assert.equal(gestureThreshold("throw",3),50);
assert.equal(gestureThreshold("melee",3),38);
assert.equal(dominantAxis([{alpha:12,beta:5,gamma:30}]),"gamma");
assert.equal(dominantAxis([{alpha:5,beta:4,gamma:3}]),null);
const detection=createGestureDetector({mode:"throw",sensitivity:3});
let result=detection.feed(event(300),1000);
assert.equal(result.gesture?.type,"throw","Strong movement emits one throw");
assert.equal(detection.status(1000).cooldownRemainingMs,1900,"Throw cooldown reports 1.9 s");
assert.equal(detection.status(1000).cooldownDurationMs,1900,"UI has the matching progress bar duration");
assert.equal(detection.status(1900).cooldownRemainingMs,1000);
assert.equal(detection.status(2900).ready,false,"Cooldown alone does not bypass neutral re-arm");
assert.equal(detection.feed(event(300),1200).gesture,null,"No double trigger for held motion");
detection.feed(event(0),2000);
detection.feed(event(0),2370);
assert.equal(detection.feed(event(300),2500).gesture,null,"Throw return stroke within cooldown must not trigger");
detection.feed(event(0),2600);
detection.feed(event(0),3410);
assert.equal(detection.feed(event(300),3500).gesture?.type,"throw","Second deliberate throw after cooldown and full neutral");
assert.equal(detection.status(3500).ready,false);
assert.equal(detection.status(3600).cooldownRemainingMs,1800);
assert.equal(detection.count,2);
detection.configure({mode:"melee",axis:"alpha",sensitivity:3});
assert.equal(detection.feed(event(300),3600).gesture,null,"Changing mode must not immediately trigger");
detection.feed(event(0),4000);
detection.feed(event(0),4380);
assert.equal(detection.feed(event(300),4500).gesture?.type,"melee");
assert.equal(detection.status(4500).cooldownDurationMs,700,"Melee uses the real 700ms gate");
assert.equal(detection.status(4900).cooldownRemainingMs,300);
assert.equal(detection.status(5200).cooldownRemainingMs,0);
const auto=createGestureDetector({mode:"auto",sensitivity:3});
assert.equal(auto.feed(event(300),1000).gesture?.type,"auto");
auto.protectThrow(1000);
assert.equal(auto.status(1000).cooldownDurationMs,1900,"Auto-mode throw extends the gate");
auto.feed(event(0),2000);
auto.feed(event(0),2780);
assert.equal(auto.feed(event(300),2810).gesture,null,"Auto throw remains refractory for 1.9 seconds");
auto.feed(event(0),2900);
auto.feed(event(0),3700);
assert.equal(auto.feed(event(300),3750).gesture?.type,"auto","Auto can attack again after deliberate reset");
let packet={type:"gesture",gesture:"melee",strength:76,time:Date.now(),seq:1,session:"mrpg-abcdefghj"};
assert.ok(validMotionPacket(packet,packet.session));
assert.equal(validMotionPacket({...packet,gesture:"destroy"},packet.session),false);
assert.equal(validMotionPacket({...packet,strength:500},packet.session),false);
assert.equal(validMotionPacket({...packet,session:"other"},packet.session),false);
assert.equal(validMotionPacket({...packet,seq:1.5},packet.session),false);

// 2. Camera landmark interpretation / strict neutral posture calibration.
const landmark=(dx=0,hipDx=0,downS=0,downH=0)=>{
 const arr=Array.from({length:33},()=>({x:0,y:0,visibility:0}));
 arr[11]={x:.4+dx,y:.3+downS,visibility:.99};
 arr[12]={x:.6+dx,y:.3+downS,visibility:.99};
 arr[23]={x:.44+hipDx,y:.56+downH,visibility:.99};
 arr[24]={x:.56+hipDx,y:.56+downH,visibility:.99};
 return arr;
};
const neutral=poseMeasurements(landmark());
assert.ok(neutral);
assert.equal(poseMeasurements(landmark().slice(0,5)),null);
assert.equal(classifyMovement(poseMeasurements(landmark()),neutral),"neutral");
assert.equal(classifyMovement(poseMeasurements(landmark(-.10,-.04)),neutral),"left");
assert.equal(classifyMovement(poseMeasurements(landmark(.10,.04)),neutral),"right");
assert.equal(classifyMovement(poseMeasurements(landmark(0,0,.10,.10)),neutral),"duck");
assert.equal(classifyMovement(poseMeasurements(landmark(0,0,.10,0)),neutral),"neutral","Head-only vertical movement must not count");
const tracker=createPoseTracker();
for(let i=0;i<14;i++)tracker.feed(landmark(),i*140);
assert.ok(tracker.calibrated);
assert.equal(tracker.feed(landmark(-.10,-.04),2400).event,null);
assert.equal(tracker.feed(landmark(-.10,-.04),2550).event?.direction,"left");
assert.equal(tracker.feed(landmark(-.10,-.04),2700).event,null,"No repeated dodge while still leaning");
for(let i=0;i<3;i++)tracker.feed(landmark(),3200+i*150);
assert.equal(tracker.feed(landmark(0,0,.10,.10),4400).event,null);
assert.equal(tracker.feed(landmark(0,0,.10,.10),4550).event?.direction,"duck");
tracker.beginCalibration();
assert.equal(tracker.calibrated,false);

// 3. Telegraph direction: camera must perform the correct movement.
assert.ok(dodgeMatches("sweep","duck"));
assert.equal(dodgeMatches("sweep","left"),false);
assert.ok(dodgeMatches("slam","left"));
assert.ok(dodgeMatches("slam","right"));
assert.equal(dodgeMatches("slam","duck"),false);
assert.ok(dodgeMatches("sweep","button"),"Touch fallback avoids all telegraphs");
assert.equal(dodgeMatches("unknown","duck"),false);

// 4. Room security and input contract.
const room=randomRoom(new Uint8Array([1,2,3,4,5,6,7,8,9,10]));
assert.ok(/^mrpg-[0-9]{6}$/.test(room));
assert.equal(cleanRoom(room.toUpperCase()),room);
assert.equal(cleanRoom(room.slice(5)),room);
assert.equal(cleanRoom("bad code"),null);
assert.equal(cleanRoom("mrpg-short"),null);
assert.equal(cleanRoom("482613"),"mrpg-482613");
assert.equal(cleanRoom("  482 613  "),"mrpg-482613");
assert.equal(cleanRoom("mrpg-fhuzfw8yk2"),"mrpg-fhuzfw8yk2");


const fallbackAttempts=[];
const fakeModel={detectForVideo(){return {landmarks:[]}},close(){}};
const fakeSdk={default:{
 FilesetResolver:{forVisionTasks:async wasm=>({wasm})},
 PoseLandmarker:{createFromOptions:async resolver=>{assert.ok(resolver.wasm.includes("/wasm"));return fakeModel}}
}};
const loaded=await loadPoseModel({
 importer:async url=>{
  fallbackAttempts.push(url);
  if(fallbackAttempts.length===1)throw Error("Primary CDN unavailable");
  return fakeSdk;
 },
 report:()=>{}
});
assert.equal(loaded.model,fakeModel,"Camera should recover by trying a different package endpoint");
assert.equal(fallbackAttempts.length,2);
assert.ok(VISION_SOURCES.length>=3);
await assert.rejects(loadPoseModel({importer:async()=>{throw Error("Offline")}}),/모든 자세 인식 모듈/);

// 5. Browser integration smoke.
const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const controller=fs.readFileSync(new URL("../controller.html",import.meta.url),"utf8");
// Users watch the game, not the handheld sensor controller.
for(const needle of ['id="motionCooldown"','id="motionCooldownState"','id="motionCooldownTime"',
 'id="motionCooldownFill"','function renderMotionCooldown()','sensorReport.cooldownRemainingMs',
 'sensorReport.ready','sensorReport.sensorReceiving','packet.type==="sensor-state"',
 '공격 대기','공격 가능','팔을 잠시 멈춰']){
 assert.ok(arena.includes(needle),"Fold6 HUD must display real S21 readiness: "+needle);
}
assert.ok(!controller.includes('id="attackCooldown"'),"Do not keep cooldown display on S21");
for(const needle of ['function publishSensorState(','type:"sensor-state"','cooldownRemainingMs:',
 'cooldownDurationMs:','sensorReceiving:sensorEvents>0','startCooldownTicker();',
 'stopCooldownTicker();']){
 assert.ok(controller.includes(needle),"S21 must send readiness telemetry: "+needle);
}
assert.ok(bridge.includes('"sensor-state"'),"WebRTC host must route sensor readiness packets");

const camera=fs.readFileSync(new URL("../src/pose-camera.mjs",import.meta.url),"utf8");
const bridge=fs.readFileSync(new URL("../src/peer-bridge.mjs",import.meta.url),"utf8");
for(const [name,html] of [["arena",arena],["controller",controller]]){
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/);
 assert.ok(script,name+" requires an ES module");
 const tmp=path.join(os.tmpdir(),"motion-"+name+"-syntax-"+process.pid+".mjs");
 try{
  fs.writeFileSync(tmp,script[1]);
  const check=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});
  assert.equal(check.status,0,name+" module parse failed: "+check.stderr);
 }finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
 const markup=html.split(/<script\b/)[0];
 const ids=[...markup.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,"Duplicate IDs in "+name);
}
for(const id of ["motionPanel","motionOpen","motionRoom","hostStart","hostStop","cameraStart","cameraStop","posePreview","poseStatus","remoteStatus"]){
 assert.ok(arena.includes('id="'+id+'"'),"Arena motion UI missing: "+id);
}
for(const id of ["roomCode","connect","disconnect","diagnostic","start","calibrate","sensitivity"]){
 assert.ok(controller.includes('id="'+id+'"'),"Controller missing: "+id);
}
assert.ok(arena.includes("createWirelessHost")&&arena.includes("validMotionPacket"),"Arena connects to motion bridge");
assert.ok(arena.includes("createPoseCamera")&&arena.includes("dodge(event.direction)"),"Camera dodge connected to actual game");
assert.ok(controller.includes("createWirelessController")&&controller.includes("wireless.send(packet)"),"Controller sends gestures");
assert.ok(camera.includes("getUserMedia")&&camera.includes("detectForVideo"),"Camera pose inference required");

assert.ok(arena.includes('if(!el("motionPanel").hidden||document.hidden)return;'),"Arena must pause enemy activity during settings");
assert.ok(arena.includes('id="retryCombat"')&&arena.includes('el("retryCombat").onclick'),"Arena should recover from 0 HP without disconnecting");
assert.ok(arena.includes('type:"gesture-ack"'),"Wireless events need explicit accepted/rejected feedback to S21");
assert.ok(arena.includes('room.replace(/^mrpg-/,"")'),"Game should show only six digits, not internal peer prefix");
assert.ok(controller.includes('data-mode="auto"')&&controller.includes('id="trainingStatus"'),"S21 auto mode and calibration UI missing");
assert.ok(controller.includes("detector.protectThrow(pending.startAt)"),"Auto thrown event must extend cooldown");
assert.ok(controller.includes("classifyAttackIntent(pending.samples,pending.mode"),"Controller must classify complete motion stroke");
assert.ok(controller.includes('id="sensorDetail"')&&controller.includes('id="lastSignal"'),"S21 must explain sensor activity and last action");
assert.ok(camera.includes("VISION_SOURCES")&&camera.includes("loadPoseModel"),"Camera must offer fallback import endpoints");

assert.ok(bridge.includes("0")&&bridge.includes("peerjs@1.5.5"),"Pinned PeerJS dependency required");
console.log("MOTION v0.30 TEST PASS: sensor gating, pose dodge, room validation and integrated controls");
