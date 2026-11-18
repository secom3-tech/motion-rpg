import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runFrameSafely} from "../src/frame-loop.mjs";

let steps=[];
runFrameSafely(()=>steps.push("scheduled"),()=>steps.push("updated"),()=>steps.push("rendered"),()=>steps.push("error"));
assert.deepEqual(steps,["scheduled","updated","rendered"],"normal frame ordering");
steps=[];
runFrameSafely(()=>steps.push("scheduled"),()=>{steps.push("update");throw Error("update failed")},
 ()=>steps.push("render"),(phase,error)=>steps.push(phase+":"+error.message));
assert.deepEqual(steps,["scheduled","update","update:update failed"],"an update exception must keep the next frame scheduled");
steps=[];
runFrameSafely(()=>steps.push("scheduled"),()=>steps.push("update"),
 ()=>{steps.push("render");throw Error("render failed")},
 (phase,error)=>steps.push(phase+":"+error.message));
assert.deepEqual(steps,["scheduled","update","render","render:render failed"],"a render exception must keep the next frame scheduled");
const html=readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
assert.match(html,/runFrameSafely\(\(\)=>requestAnimationFrame\(loop\)/);
assert.match(html,/renderAttackFxSafely\("warning",enemyVisual\)/);
assert.match(html,/motion-rpg-last-frame-error-v1/);
const renderBody=html.match(/function render\(\)\{([\s\S]*?)\n\}/)?.[1];
assert.ok(renderBody&&!renderBody.includes("requestAnimationFrame(loop)"),"next frame must not depend on render completing");
console.log("Frame recovery + diagnostics regression tests passed");
