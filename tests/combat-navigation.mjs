import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {relativeTarget,radarTarget,projectEnemyHead,enemyEdgePointer,
 monsterHeadHeight,compassDirection,RADAR_RANGE} from "../src/combat-navigation.mjs";
import {FOREST_MONSTERS,forestZoneAt} from "../src/forest-encounters.mjs";

const hero={x:0,y:1.7,z:0},yaw=0;
const front={x:0,z:-12},right={x:12,z:0},left={x:-12,z:0},back={x:0,z:12};
assert.equal(relativeTarget(hero,yaw,front).forward,12);
assert.equal(relativeTarget(hero,yaw,front).right,0);
assert.equal(compassDirection(relativeTarget(hero,yaw,front).angle),"정면");
assert.equal(compassDirection(relativeTarget(hero,yaw,right).angle),"오른쪽");
assert.equal(compassDirection(relativeTarget(hero,yaw,left).angle),"왼쪽");
assert.equal(compassDirection(relativeTarget(hero,yaw,back).angle),"뒤");
assert.equal(relativeTarget(hero,Math.PI/2,right).forward,12);
assert.equal(radarTarget(hero,yaw,front).x,0);
assert.equal(radarTarget(hero,yaw,front).y,-.5);
assert.equal(radarTarget(hero,yaw,back).y,.5);
assert.equal(radarTarget(hero,yaw,right).x,.5);
assert.equal(radarTarget(hero,yaw,left).x,-.5);
assert.equal(radarTarget(hero,yaw,{x:0,z:-50}).offRange,true);
assert.ok(Math.abs(radarTarget(hero,yaw,{x:0,z:-50}).y)<=1);
const onScreen=projectEnemyHead(hero,yaw,0,front,900,380,2.9);
assert.equal(onScreen.inView,true);
assert.equal(onScreen.x,450);
assert.ok(onScreen.y>=65&&onScreen.y<190);
for(const target of [right,left,back]){
 const out=projectEnemyHead(hero,yaw,0,target,900,380,2.9);
 assert.equal(out.inView,false);
 const arrow=enemyEdgePointer(hero,yaw,target,900,380);
 assert.ok(arrow.x>=45&&arrow.x<=855);
 assert.ok(arrow.y>=68&&arrow.y<=293);
}
assert.ok(Math.abs(enemyEdgePointer(hero,yaw,right,900,380).degrees-90)<.00001);
assert.ok(Math.abs(enemyEdgePointer(hero,yaw,left,900,380).degrees+90)<.00001);
assert.ok(Math.abs(enemyEdgePointer(hero,yaw,back,900,380).degrees-180)<.00001);
assert.equal(relativeTarget({},yaw,front),null);
assert.equal(projectEnemyHead(hero,yaw,0,front,-1,300,2.9),null);
assert.equal(radarTarget(hero,yaw,front,0),null);
assert.equal(enemyEdgePointer(hero,yaw,front,-1,0),null);
for(let kind=0;kind<FOREST_MONSTERS.length;kind++){
 assert.ok(monsterHeadHeight(kind)>=2.2&&monsterHeadHeight(kind)<=4.2);
}
for(let i=0;i<500;i++){
 const angle=(i/500)*Math.PI*2,point={x:Math.cos(angle)*21,z:Math.sin(angle)*21};
 const arrow=enemyEdgePointer(hero,0,point,360,800);
 assert.ok(arrow.x>=45&&arrow.x<=315&&arrow.y>=68&&arrow.y<=713);
 const radar=radarTarget(hero,0,point,RADAR_RANGE);
 assert.ok(Math.hypot(radar.x,radar.y)<=1.00001);
}
// Integration regression against the actual browser source.
const html=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
for(const id of ["radarBox","radarCanvas","enemyTag","enemyTagName","enemyTagHp",
 "enemyArrow","enemyArrowIcon","enemyArrowText","spawnNotice"]){
 assert.ok(html.includes('id="'+id+'"'),"Missing marker "+id);
}
assert.ok(html.includes("updateEnemyNavigation()"),"Render must update targets");
assert.ok(html.includes("enemySpawnClock=clock"),"Spawn notification must reset each monster");
assert.ok(html.includes("projectEnemyHead(camera,yaw,pitch,enemy,W,H"),"Monster name must follow projected 3D head");
assert.ok(html.includes("radarTarget(camera,yaw,enemy)"),"Radar must track real enemy position");
assert.ok(html.includes("const radarCtx=el(\"radarCanvas\").getContext(\"2d\")"),"Minimap needs a 2D context");
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const tmp=path.join(os.tmpdir(),"motion-navigation-"+process.pid+".mjs");
try{
 fs.writeFileSync(tmp,script);
 const check=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});
 assert.equal(check.status,0,check.stderr);
}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
// Run extracted HUD drawing code against a minimal canvas/DOM stand-in.
const begin=script.indexOf('const radarCtx=el("radarCanvas").getContext("2d");');
const end=script.indexOf("function render(){",begin);
assert.ok(begin>0&&end>begin,"Navigation render boundaries present");
const fragment=script.slice(begin,end);
let draws=0;
const ctx=new Proxy({},{
 get(target,key){if(key in target)return target[key];return (...args)=>{draws++;}},
 set(target,key,value){target[key]=value;return true}
});
const nodes=new Map();
const el=id=>{
 if(!nodes.has(id))nodes.set(id,{hidden:false,style:{},textContent:"",
  getContext(){return ctx}});
 return nodes.get(id);
};
const enemy={x:0,z:-12,kind:0,name:"이끼 슬라임",hp:100,max:100,dead:false};
const camera={x:0,y:1.7,z:0};
const display=new Function("el","camera","yaw","pitch","W","H","enemy","clock","active",
 "worldMode","enemySpawnClock","lastRadarClock","FOREST_MONSTERS","forestZoneAt",
 "radarTarget","relativeTarget","projectEnemyHead","enemyEdgePointer",
 "monsterHeadHeight","RADAR_RANGE",fragment+
 "\nreturn {drawCombatRadar,updateEnemyNavigation};")
 (el,camera,0,0,900,380,enemy,5,true,false,4,-99,
  FOREST_MONSTERS,forestZoneAt,radarTarget,relativeTarget,projectEnemyHead,enemyEdgePointer,
  monsterHeadHeight,RADAR_RANGE);
display.updateEnemyNavigation();
assert.ok(draws>100,"Radar should render terrain and the enemy");
assert.equal(el("enemyTag").hidden,false,"Head tag for visible enemy");
assert.equal(el("enemyArrow").hidden,true,"No offscreen marker on visible enemy");
enemy.x=12;enemy.z=0;display.updateEnemyNavigation();
assert.equal(el("enemyTag").hidden,true,"Head tag hidden for off-screen enemy");
assert.equal(el("enemyArrow").hidden,false,"Off-screen enemy must show arrow");
enemy.dead=true;display.updateEnemyNavigation();
assert.equal(el("enemyTag").hidden,true);
assert.equal(el("enemyArrow").hidden,true);
assert.equal(el("spawnNotice").hidden,true);
console.log("NAVIGATION PASS: view projection, offscreen pointers, rotating minimap and visible monster labels");
