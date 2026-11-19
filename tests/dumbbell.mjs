import assert from "node:assert/strict";
import fs from "node:fs";
import {spawnSync} from "node:child_process";
import os from "node:os";
import path from "node:path";
import {gravityVector,averagedGravity,createCurlDetector} from "../src/dumbbell-reps.mjs";
const down=[0,0,-1],up=[0,1,0];
assert.deepEqual(gravityVector({accelerationIncludingGravity:{x:0,y:0,z:-9.8}}),down);
assert.equal(gravityVector({acceleration:{x:0,y:0,z:0}}),null);
assert.deepEqual(averagedGravity(Array(6).fill(up)),up);
assert.equal(averagedGravity([up,down]),null);
const detector=createCurlDetector();
assert.equal(detector.calibrateUp(up),false);
assert.ok(detector.calibrateDown(down));
assert.equal(detector.calibrateUp([0,.02,-.999]),false,"Similar calibration postures must be rejected");
assert.ok(detector.calibrateUp(up));
const point=t=>[0,Math.sin(t*Math.PI/2),-Math.cos(t*Math.PI/2)];
let result;
// Simulate an actual 25 Hz sensor stream: 2 s controlled repetitions.
function drive(start,keys){
 for(let t=0;t<=keys.at(-1)[0];t+=40){
  let angle=keys.at(-1)[1];
  for(let k=1;k<keys.length;k++)if(t<=keys[k][0]){
   const [t0,v0]=keys[k-1],[t1,v1]=keys[k],ratio=(t-t0)/(t1-t0);
   angle=v0+(v1-v0)*ratio;break;
  }
  result=detector.feed(point(angle),start+t);
 }
}
const full=[[0,0],[320,.30],[760,1],[960,1],[1530,.3],[1900,0],[2100,0]];
drive(0,full);
assert.equal(detector.reps,1,"Only a complete slow curl is an attack");
drive(2450,full);
assert.equal(detector.reps,2,"Second full curl should count without forced stillness");
detector.reset();
drive(0,[[0,0],[300,.35],[500,.55],[700,.3],[1050,0]]);
assert.equal(detector.reps,0,"Partial motion is not a rep");
const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../dumbbell.html",import.meta.url),"utf8");
const hub=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const m of ['dumbbellMode','gameMode===\'dumbbell\'','function autoExploreDumbbell','new URL(dumbbellMode?"./dumbbell.html"','autoExploreDumbbell(dt)'])assert.ok(arena.includes(m),"Dumbbell game mode marker missing: "+m);
for(const m of ['createCurlDetector','gravityVector','averagedGravity','createWirelessController','send("sensor-state"','"gesture",{gesture:"melee"'])assert.ok(html.includes(m),"Dumbbell controller marker missing: "+m);
for(const m of ['id="motionLive"','id="motionGauge"','sensorSamples++','angleBetween','keepScreenOn()','센서 수신 0회'])assert.ok(html.includes(m),"S21 armband live diagnostic missing: "+m);
for(const m of ['S21 암밴드 · 폴드6 연결','if(dumbbellMode&&!watchInputMode)el("motionPanel").hidden=false','S21 암밴드 · 자동 숲 탐색'])assert.ok(arena.includes(m),"Armband game setup missing: "+m);
assert.ok(hub.includes('S21 암밴드 숲 사냥'));
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(script,"Controller must have module script");
const tmp=path.join(os.tmpdir(),"motion-dumbbell-"+process.pid+".mjs");
try{fs.writeFileSync(tmp,script[1]);const check=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});assert.equal(check.status,0,check.stderr);}
finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
console.log("DUMBBELL PASS: two-point curl gating, full reps only, dedicated wireless UI, auto-exploration route");
