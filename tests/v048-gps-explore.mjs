import assert from "node:assert/strict";
import fs from "node:fs";
import {gpsSilenceIsProlonged,gpsAccuracyWarningDue,gpsStatusShouldSpeak,GPS_SILENCE_WARNING_MS,GPS_WEAK_DISPLAY_MS} from "../src/gps-stability.mjs";
import {spawnAroundPlayer,distance2d} from "../src/combat-spatial.mjs";
import {RADAR_RANGE,radarTarget,enemyEdgePointer} from "../src/combat-navigation.mjs";
assert.equal(GPS_SILENCE_WARNING_MS,120000);
assert.equal(GPS_WEAK_DISPLAY_MS,12000);
assert.equal(gpsSilenceIsProlonged(10000,28000),false,"18 second dog sniff must not be treated as GPS loss");
assert.equal(gpsSilenceIsProlonged(10000,95000),false,"85 second dog sniff is still quiet");
assert.equal(gpsSilenceIsProlonged(10000,130001),true,"More than two minutes with no accurate fix merits warning");
assert.equal(gpsAccuracyWarningDue(10000,19000),false);
assert.equal(gpsAccuracyWarningDue(10000,22001),true);
assert.equal(gpsStatusShouldSpeak("waiting","connected",{firstFix:true}),true);
assert.equal(gpsStatusShouldSpeak("connected","recording"),false);
assert.equal(gpsStatusShouldSpeak("recording","weak"),false);
assert.equal(gpsStatusShouldSpeak("weak","recording"),false);
assert.equal(gpsStatusShouldSpeak("lost","connected"),false);
assert.equal(gpsStatusShouldSpeak("recording","lost"),true);
assert.equal(gpsStatusShouldSpeak("lost","lost"),false);
assert.equal(gpsStatusShouldSpeak("waiting","denied"),true);

let seed=1717;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const bounds={minX:-20,maxX:20,minZ:-29,maxZ:5};
const playerPositions=[{x:0,z:-12},{x:-19.3,z:-28.9},{x:19.3,z:4.8},{x:11,z:-27}];
const distinct=new Set();
for(let i=0;i<1200;i++){
 const player=playerPositions[i%playerPositions.length],pos=spawnAroundPlayer(player,rng()*6.28,rng,bounds,{exploration:true});
 const d=distance2d(player,pos);
 assert.ok(d>=18.9,"Exploration monster spawned too close: "+d);
 assert.ok(pos.x>=bounds.minX&&pos.x<=bounds.maxX&&pos.z>=bounds.minZ&&pos.z<=bounds.maxZ);
 const nav=radarTarget(player,0,pos,RADAR_RANGE);
 assert.ok(nav&&Number.isFinite(nav.angle));
 const pointer=enemyEdgePointer({...player,y:1.7},0,pos,640,360);
 assert.ok(pointer&&Number.isFinite(pointer.x));
 if(i%4===0)distinct.add(Math.round(pos.x)+":"+Math.round(pos.z));
}
assert.ok(distinct.size>30,"Exploration should lead to diverse locations, not same closest spawn");
const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const hub=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const phrase of [
 'id="attackReadySignal"','large.className=phase','phase==="ready"?"공격!"',
 'phase==="neutral"?"동작 마무리"','phase==="cooldown"?"공격 대기"',
 'if(phase==="ready"&&previousAttackReadyPhase!=="ready")beep',
 'enemy.respawn=3.0','spawnAroundPlayer(camera,playerHeading,rand,undefined,{exploration:true})',
 '방향 표시를 따라 숲길을 탐색'
])assert.ok(arena.includes(phrase),"Need large clear action signal and exploration: "+phrase);
for(const phrase of [
 'gpsSilenceIsProlonged(gpsLastGoodAt,Date.now())','gpsAccuracyWarningDue(gpsWeakSince,nowMs)',
 'gpsStatusShouldSpeak(prev,state,{firstFix:!gpsHasFix})',
 'setGpsStatus("recording",p.accuracy,false)','setGpsStatus("connected",p.accuracy,false)',
 'if(!gpsHasFix)speak("GPS 연결 완료.',
 'gpsWeakSince=0;gpsLastGoodAt=Date.now()'
])assert.ok(hub.includes(phrase),"GPS resume must be quiet: "+phrase);
assert.ok(hub.includes("indoor.html?v=1.0&mode=dumbbell"),"Hub links must use the current stable build");
console.log("V0.48 PASS: 2m GPS silence tolerance, no voice chatter, distance exploration, large S21 attack readiness");
