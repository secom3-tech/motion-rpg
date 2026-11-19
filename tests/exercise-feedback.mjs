import assert from "node:assert/strict";
import fs from "node:fs";
import {createCurlDetector} from "../src/dumbbell-reps.mjs";
const det=createCurlDetector();const a=[0,0,-1],b=[0,1,0];
assert.ok(det.calibrateDown(a));assert.ok(det.calibrateUp(b));
const pos=t=>[0,Math.sin(Math.PI*t/2),-Math.cos(Math.PI*t/2)];
function go(start,stops){
 let last;for(let i=0;i<stops.length-1;i++){
 const [t0,v0]=stops[i],[t1,v1]=stops[i+1];
 for(let t=t0;t<t1;t+=25){last=det.feed(pos(v0+(v1-v0)*(t-t0)/(t1-t0)),start+t);}
 }
 const [t,v]=stops.at(-1);last=det.feed(pos(v),start+t);return last;
}
let done=go(0,[[0,0],[220,1],[450,0],[600,0]]);
assert.equal(det.reps,1,"Fast but complete controlled curl must count");
done=go(2000,[[0,0],[1400,1],[3200,1],[5700,0],[5800,0]]);
assert.equal(det.reps,2,"Heavy slow curl with a long hold must count");
det.reset();
done=go(0,[[0,0],[250,.48],[530,0],[700,0]]);
assert.equal(det.reps,0,"Partial curl not counted");
const game=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const phone=fs.readFileSync(new URL("../dumbbell.html",import.meta.url),"utf8");
for(const marker of ['id="exerciseNotice"','id="dodgePoseGraphic"','DODGE_POSTURES.duck','DODGE_POSTURES.side','curl-reject','function acceptCurl()','function drainCurlQueue()','if(now-lastMotionAt<620&&!dumbbellMode)','cooldownMs:dumbbellMode?500:1100'])assert.ok(game.includes(marker),marker);
for(const marker of ['report?.rejection','curl-reject','data.queued','cooldownRemainingMs:0','v=1.1'])assert.ok(phone.includes(marker),marker);
assert.ok(game.includes("적이 사거리 밖으로 이동함"),"Melee swings that miss need a large reason");
assert.ok(game.includes("발사는 됐지만 빗나감"),"Ranged misses need a large reason");
console.log("EXERCISE FEEDBACK PASS: varied cadence, rejection diagnostics, attack queue and illustrated dodge");
