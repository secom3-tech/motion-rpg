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
// First full controlled up/down, with a stable top.
for(const [t,angle] of [[0,0],[200,.3],[450,.55],[760,1],[980,1],[1350,.7],[1600,.4],[1880,0],[2010,0]]){
 result=detector.feed(point(angle),t);
}
assert.equal(detector.reps,1,"Only a complete slow curl is an attack");
for(const [t,angle] of [[2250,.3],[2500,.6],[2750,1],[2900,.9],[3180,.6],[3500,.3],[3740,0],[3850,0]])result=detector.feed(point(angle),t);
assert.equal(detector.reps,2,"Second full curl should count without forced stillness");
detector.reset();
for(const [t,angle] of [[0,0],[250,.35],[450,.55],[650,.30],[900,0]])detector.feed(point(angle),t);
assert.equal(detector.reps,0,"Partial motion is not a rep");
const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../dumbbell.html",import.meta.url),"utf8");
const hub=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const m of ['dumbbellMode','mode=dumbbell','function autoExploreDumbbell','new URL("./dumbbell.html"','autoExploreDumbbell(dt)'])assert.ok(arena.includes(m),"Dumbbell game mode marker missing: "+m);
for(const m of ['createCurlDetector','gravityVector','averagedGravity','createWirelessController','type:"sensor-state"','"gesture",{gesture:"melee"'])assert.ok(html.includes(m),"Dumbbell controller marker missing: "+m);
assert.ok(hub.includes('아령 사냥 · 암밴드 테스트'));
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(script,"Controller must have module script");
const tmp=path.join(os.tmpdir(),"motion-dumbbell-"+process.pid+".mjs");
try{fs.writeFileSync(tmp,script[1]);const check=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});assert.equal(check.status,0,check.stderr);}
finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
console.log("DUMBBELL PASS: two-point curl gating, full reps only, dedicated wireless UI, auto-exploration route");
