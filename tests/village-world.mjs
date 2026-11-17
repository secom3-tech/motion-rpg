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
labels=renderVillageWorld(ctx,scene,360,640,{drawHero(){avatarDraws++},loadout:DEFAULT_LOADOUT});
assert.ok(labels.length>=3,"Small Fold screen retains tappable site labels");
for(let i=0;i<300;i++)advanceVillageExplorer(scene,.033,{x:0,y:-1});
labels=renderVillageWorld(ctx,scene,360,640,{drawHero(){avatarDraws++},loadout:DEFAULT_LOADOUT});
assert.ok(labels.some(label=>label.id==="forest"),"Forest gate stays selectable after long walks");
assert.equal(villageSiteAtScreen(scene,360,640,NaN,NaN),null);
// Legacy walking simulation still has deterministic tests, but the player hub
// intentionally no longer mounts it: choosing a building is now a direct touch.
const html=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const id of ["villageStage","townEncounter","townHudLevel","townHudGold","townQuest","closeTownTalk","townProgress"]){
 assert.ok(html.includes('id="'+id+'"'),"Missing v0.40 village interface "+id);
}
for(const place of ["guild","trader"])assert.ok(html.includes('data-town="'+place+'"'));
for(const mode of ["indoor","run","character"])assert.ok(html.includes('data-go="'+mode+'"'));
assert.ok(html.includes('class="village-art"')&&html.includes('class="bodySilhouette"'),"Village artwork and gear silhouette are present");
assert.ok(!html.includes('id="village3d"')&&!html.includes('id="townMovePad"'),"Walking UI removed from player hub");
assert.ok(!html.includes('advanceVillageExplorer(villageState'),"Legacy walking simulation cannot run on home screen");
assert.ok(html.includes('location.assign("./indoor.html?'),"Forest destination must enter existing 3D combat");
// A collapsed journal must sit above (not on top of) the mobile village grid.
const mobileHub=html.slice(html.lastIndexOf("/* v0.43.2 mobile hub:"),html.indexOf("</style></head>"));
assert.ok(mobileHub.includes("top:154px;bottom:auto"),"Phone journal must be anchored outside the facility grid");
assert.ok(mobileHub.includes("grid-template-rows:repeat(3,59px)"),"Mobile facility buttons occupy a bounded grid");
for(const area of [".spot-guild{grid-column:1;grid-row:1}",".spot-smith{grid-column:2;grid-row:1}",".spot-trader{grid-column:1;grid-row:2}",".spot-ranger{grid-column:2;grid-row:2}",".spot-forest{grid-column:1 / -1;grid-row:3}"])
 assert.ok(mobileHub.includes(area),"Every mobile hotspot must have a unique explicit grid cell: "+area);
assert.ok(mobileHub.includes(".villageJournal[open]"),"Expanded journal has its own overlay layout");
assert.ok(html.includes('id="startWalk"')&&html.includes('speak(last.head+". "+last.detail)'),"Walk exploration shares event voice announcements");
assert.ok(html.includes("syncCharacter()"),"Existing saved XP, gold and gear remain connected");
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const tmp=path.join(os.tmpdir(),"motion-village-"+process.pid+".mjs");
try{
 fs.writeFileSync(tmp,script);
 const parse=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});
 assert.equal(parse.status,0,parse.stderr);
}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp)}
console.log("VILLAGE HUB PASS: legacy movement module stable; v0.40 static hub, direct touch, save-linked HUD.");
