import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {
 VILLAGE_SITES,createVillageExplorer,setVillageDestination,setVillageGroundDestination,
 advanceVillageExplorer,villageProjection,villageGroundFromScreen,villageSiteAtScreen,
 renderVillageWorld
} from "../src/village-world.mjs";
import {drawAvatar,DEFAULT_LOADOUT} from "../src/avatar.mjs";

assert.equal(VILLAGE_SITES.length,5,"Five interactive sites, including the forest gate");
assert.deepEqual(VILLAGE_SITES.map(s=>s.id),["guild","smith","ranger","trader","forest"]);
const state=createVillageExplorer(),w=880,h=600;
const guild=VILLAGE_SITES[0],projected=villageProjection(state,w,h,guild.x,guild.z,2.05);
assert.ok(projected.x>=0&&projected.x<=w&&projected.y>=0&&projected.y<=h);
assert.equal(villageSiteAtScreen(state,w,h,projected.x,projected.y)?.id,"guild");
const road=villageProjection(state,w,h,0,-7);
const ground=villageGroundFromScreen(state,w,h,road.x,road.y);
assert.ok(Math.abs(ground.x)<.2&&Math.abs(ground.z+7)<.2);
assert.equal(villageGroundFromScreen(state,w,h,200,50),null);
assert.equal(villageSiteAtScreen(state,w,h,-500,-500),null);
assert.equal(setVillageDestination(state,"not-registered"),false);
assert.equal(setVillageDestination(state,"guild"),true);
let visited=[];
for(let i=0;i<360;i++){
 const arrival=advanceVillageExplorer(state,.033);
 if(arrival)visited.push(arrival);
}
assert.deepEqual(visited,["guild"],"Arrive at the selected site exactly once");
assert.ok(Math.hypot(state.x-guild.approachX,state.z-guild.approachZ)<.7);
assert.equal(setVillageGroundDestination(state,100,-100),true);
assert.ok(state.goal.x<=10&&state.goal.z>=-25);
advanceVillageExplorer(state,.033,{x:0,y:-1});
assert.equal(state.goal,null,"Manual control cancels auto walk");
for(let i=0;i<1000;i++)advanceVillageExplorer(state,.033,{x:1,y:1});
assert.ok(state.x<=10.8&&state.z<=4,"Town movement bounded by roads");
for(let i=0;i<1000;i++)advanceVillageExplorer(state,.033,{x:-1,y:-1});
assert.ok(state.x>=-10.8&&state.z>=-25.3);

let draws=0,avatarDraws=0;
const ctx={
 canvas:{width:880,height:600},
 createLinearGradient(){return {addColorStop(){}}},
 createRadialGradient(){return {addColorStop(){}}},measureText(value){return {width:String(value).length*11}},
 save(){},restore(){},translate(){},rotate(){},clip(){},scale(){},
 fillRect(){draws++},strokeRect(){draws++},clearRect(){draws++},
 beginPath(){draws++},closePath(){},moveTo(){},lineTo(){},
 fill(){draws++},stroke(){draws++},ellipse(){draws++},
 arc(){draws++},roundRect(){draws++},fillText(){draws++},
 set fillStyle(v){},set strokeStyle(v){},set font(v){},
 set lineWidth(v){},set textAlign(v){},set textBaseline(v){},set globalAlpha(v){}
};
const scene=createVillageExplorer();
let labels=renderVillageWorld(ctx,scene,w,h,{drawHero(...args){
 avatarDraws++;drawAvatar(...args);},loadout:DEFAULT_LOADOUT});
assert.ok(draws>200,"Actual scenery, buildings, sky, ground and props must render");
assert.ok(avatarDraws===1,"Shared avatar appears once in playable village");
assert.ok(labels.some(label=>label.id==="guild"));
assert.ok(labels.some(label=>label.id==="forest"));
assert.ok(labels.every(label=>label.w>0&&label.h>0));
for(let i=0;i<300;i++)advanceVillageExplorer(scene,.033,{x:0,y:-1});
labels=renderVillageWorld(ctx,scene,360,640,{drawHero(){avatarDraws++},loadout:DEFAULT_LOADOUT});
assert.ok(labels.length>=2,"Small Fold screen retains tappable site labels");
assert.equal(villageSiteAtScreen(scene,360,640,NaN,NaN),null);
const html=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const id of ["villageStage","village3d","townMovePad","townMoveKnob","townEncounter","townHudLevel","townHudGold","townQuest","closeTownTalk"]){
 assert.ok(html.includes('id="'+id+'"'),"Missing player-facing village UI "+id);
}
assert.ok(html.includes('renderVillageWorld(ctx,villageState,w,h,{drawHero:drawAvatar,loadout})'));
assert.ok(html.includes("advanceVillageExplorer(villageState,dt,villageStick)"));
assert.ok(html.includes("gotoVillageSite(id)"));
assert.ok(html.includes('location.assign("./indoor.html?'),"Forest gate must enter existing connected 3D combat");
assert.ok(html.includes("syncCharacter()"),"Existing saved XP/gold and gear stay connected");
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const tmp=path.join(os.tmpdir(),"motion-village-"+process.pid+".mjs");
try{
 fs.writeFileSync(tmp,script);
 const parse=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});
 assert.equal(parse.status,0,parse.stderr);
}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp)}
console.log("VILLAGE WORLD PASS: 5 locations, tap labels, camera-follow movement, mobile renderer, save-linked HUD.");
