import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {newGame} from "../src/engine.mjs";
import {GEAR,DEFAULT_LOADOUT} from "../src/avatar.mjs";
import {MATERIALS,RECIPES,STARTER_OWNED,normalizeRpgGear,withRpgGear,
 gearRequirement,craftGear,equipGear,combatStats,claimIndoorBattle,addExpeditionMaterials} from "../src/gear-game.mjs";

const all=new Set(Object.values(GEAR).flatMap(items=>items.map(i=>i.id)));
assert.equal(STARTER_OWNED.length,4);
for(const i of RECIPES){
 assert.ok(all.has(i.id),"Recipe must match avatar item: "+i.id);
 assert.ok(GEAR[i.slot].some(item=>item.id===i.id));
 assert.ok(i.price>=0&&Object.keys(MATERIALS).every(k=>i.materials[k]>=0));
}
assert.equal(new Set(RECIPES.map(x=>x.id)).size,RECIPES.length);
const starter=newGame();
const init=normalizeRpgGear(starter);
assert.deepEqual(init.equipped,DEFAULT_LOADOUT);
assert.equal(combatStats(starter).maxHp,114,"Hunter equipment should give +14 HP");
assert.equal(gearRequirement(starter,"greatsword").ok,false);
assert.throws(()=>equipGear(starter,"greatsword"),/Craft/);
assert.throws(()=>craftGear(starter,"greatsword"),/required|필요/);
assert.throws(()=>craftGear(starter,"invalid"),/알 수 없는/);
assert.equal(claimIndoorBattle(starter,{kills:0,updatedAt:12}).awarded,false);
assert.equal(claimIndoorBattle(starter,{kills:2,updatedAt:0}).awarded,false);
const marathon=claimIndoorBattle(newGame(),{sessionId:"long-battle-1234",kills:300,updatedAt:Date.now()});
assert.equal(marathon.awarded,true,"long battle payout may not disappear");
assert.equal(marathon.kills,24,"claim capped number of enemies");
assert.equal(marathon.state.rpgGear.materials.fang,24);


const r={sessionId:"battle-123456",kills:8,score:640,updatedAt:Date.now()};
const first=claimIndoorBattle(starter,r);
assert.equal(first.awarded,true);
assert.equal(first.xp,16);
assert.equal(first.gold,18);
assert.equal(first.state.xp,16);
assert.equal(first.state.gold,18);
assert.equal(first.state.rpgGear.materials.wood,4);
assert.equal(first.state.rpgGear.materials.fang,8);
assert.equal(first.state.rpgGear.materials.essence,2);
assert.equal(first.state.rpgGear.materials.ore,2);
const again=claimIndoorBattle(first.state,r);
assert.equal(again.awarded,false);
assert.deepEqual(again.state,first.state,"Do not duplicate fight payout");
let s=first.state;
let prepared=claimIndoorBattle(s,{sessionId:"battle-2-abc",kills:8,score:640,updatedAt:Date.now()});
s=prepared.state;
assert.equal(s.gold,36);
assert.equal(gearRequirement(s,"hood").ok,true);
const crafted=craftGear(s,"hood");
assert.equal(crafted.gold,21);
assert.equal(crafted.rpgGear.materials.wood,s.rpgGear.materials.wood-3);
assert.ok(crafted.rpgGear.owned.includes("hood"));
assert.equal(crafted.rpgGear.equipped.head,"hood");
assert.equal(combatStats(crafted).maxHp,118);
assert.equal(gearRequirement(crafted,"hood").ok,false);
assert.throws(()=>craftGear(crafted,"hood"),/이미 보유/);
let swapped=equipGear(crafted,DEFAULT_LOADOUT.head);
assert.equal(swapped.rpgGear.equipped.head,DEFAULT_LOADOUT.head);
swapped=equipGear(swapped,"hood");
assert.equal(swapped.rpgGear.equipped.head,"hood");

const poor=newGame();poor.gold=100;poor.level=10;
assert.equal(gearRequirement(poor,"hood").ok,false,"Must require materials, not just gold");
let rich=newGame();rich.gold=1000;rich.level=5;
rich.rpgGear={owned:[...STARTER_OWNED],materials:{wood:200,fang:200,essence:200,ore:200}};
assert.equal(gearRequirement(rich,"greatsword").ok,false,"Boss gate not bypassed by money");
rich.quests.forest.bossDefeated=true;
assert.equal(gearRequirement(rich,"greatsword").ok,true);
const before=combatStats(rich);
rich=craftGear(rich,"greatsword");
assert.ok(combatStats(rich).slash>before.slash);
assert.ok(combatStats(rich).attackDelay>before.attackDelay);
rich=craftGear(rich,"iron");
assert.ok(combatStats(rich).defence>before.defence);

let invalid={...starter,rpgGear:{owned:["hacked","hood"],equipped:{weapon:"greatsword",head:"hacked"},
 materials:{wood:-100,fang:Infinity,ore:9999999}}};
let fix=normalizeRpgGear(invalid);
assert.equal(fix.equipped.weapon,"bow","Unowned weapon may not be equipped");
assert.equal(fix.equipped.head,"hunterCap","Unknown head item may not be equipped");
assert.equal(fix.materials.wood,0);
assert.equal(fix.materials.fang,0);
assert.equal(fix.materials.ore,9999);

const gps={mode:"gps",phase:"complete",elapsedSec:1200,distanceM:2500,success:7};
let exp=addExpeditionMaterials(starter,gps,"run-001");
assert.equal(exp.awarded,true);
assert.equal(exp.state.rpgGear.materials.wood,7);
assert.equal(exp.state.rpgGear.materials.essence,1);
assert.equal(addExpeditionMaterials(exp.state,gps,"run-001").awarded,false);
assert.equal(addExpeditionMaterials(starter,{...gps,mode:"demo"},"demo-run").awarded,false);
assert.equal(addExpeditionMaterials(starter,{...gps,mode:"treadmill"},"treadmill-run").awarded,false);
assert.equal(addExpeditionMaterials(starter,{...gps,distanceM:0},"idle-run").awarded,false);

let totalGold=0,totalXp=0,totalFangs=0;
for(let i=0;i<1000;i++){
 const kills=i%30+1;
 const state=claimIndoorBattle(newGame(),{sessionId:"unique-round-"+i,kills,score:kills*80,updatedAt:Date.now()});
 assert.equal(state.awarded,true);
 const g=state.state.rpgGear;
 assert.ok(g.materials.fang<=24);
 assert.ok(state.gold<=38);
 assert.ok(state.xp<=24);
 totalGold+=state.gold;totalXp+=state.xp;totalFangs+=g.materials.fang;
}
assert.ok(totalGold>10000&&totalXp>5000);
assert.ok(totalFangs>10000);

const indoor=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const script=indoor.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(script,"Arena should use module imports for combat stats");
const tmp=path.join(os.tmpdir(),"motion-arena-check-"+process.pid+".mjs");
try{
 fs.writeFileSync(tmp,script[1]);
 const check=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});
 assert.equal(check.status,0,"Arena script syntax error: "+check.stderr);
}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
for(const id of ["heroHp","playerHud","dodgeInfo","gearHud","dodge"]){
 assert.ok(indoor.includes('id="'+id+'"'),"Missing combat HUD "+id);
}
assert.ok(indoor.includes("attackTimer"),"Enemy must retaliate");
assert.ok(indoor.includes("sessionId,updatedAt"),"Reward must have unique session ID");
console.log("GEAR/COMBAT TEST PASS: crafting, boss gate, payouts and 1000 sessions");
console.log("Gold "+totalGold+" XP "+totalXp+" Fang "+totalFangs+" | Arena script syntax valid");
