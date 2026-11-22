import assert from "node:assert/strict";
import fs from "node:fs";
import {newGame} from "../src/engine.mjs";
import {createAdventure,startAdventure,advanceAdventure,endAdventure,settleAdventure,expeditionReward} from "../src/expedition.mjs";
import {addExpeditionMaterials,combatStats} from "../src/gear-game.mjs";
import {GEAR_BONUSES,craftingDeficits,MATERIAL_SYMBOLS,gearBenefits} from "../src/gear-details.mjs";
import {drawCombatEffects} from "../src/combat-effects.mjs";
const original=newGame();
assert.equal(gearBenefits("sword"),"근접 공격 +18%");
assert.equal(gearBenefits("bow"),"원거리 공격 +10%");
assert.equal(gearBenefits("hunter"),"최대 기력 +10 · 피해 감소 +3%p");
assert.ok(craftingDeficits(original,"leather").some(x=>x.includes("골드")));
assert.ok(craftingDeficits(original,"leather").some(x=>x.includes("목재")));
assert.ok(MATERIAL_SYMBOLS.wood&&MATERIAL_SYMBOLS.fang);
assert.equal(Object.keys(GEAR_BONUSES).length>=16,true);
let walking=startAdventure(createAdventure({mode:"walk",durationMin:12,seed:22,basePace:15}));
for(let i=0;i<72;i++)walking=advanceAdventure(walking,10,18,i%6===0?4:0);
assert.equal(walking.phase,"complete");
assert.ok(walking.events.length>0);
assert.ok(walking.events.every(x=>x.kind!=="surge"),"No sprinting while walking a dog");
assert.ok(walking.distanceM>=3&&walking.distanceM<60,"Only verified movement contributes to dog-walk distance");
const walkReward=expeditionReward(walking);
assert.ok(walkReward.xp>=0);
const award=settleAdventure(newGame(),walking,"walk-2026-01");
assert.equal(award.awarded,true);
assert.equal(award.xp,walkReward.xp);
assert.equal(settleAdventure(award.state,walking,"walk-2026-01").awarded,false);
const gathered=addExpeditionMaterials(award.state,walking,"walk-material-01");
assert.equal(gathered.awarded,true);
assert.equal(gathered.materials.fang,0,"Walking collects supplies, not combat trophies");
let run=startAdventure(createAdventure({mode:"gps",durationMin:12,seed:22}));
for(let i=0;i<72;i++)run=advanceAdventure(run,10,8.5);
const runReward=expeditionReward(run);
assert.ok(runReward.xp>run.xp,"Real outdoor jogging has higher rewards than legacy expedition");
assert.equal(settleAdventure(newGame(),run,"run-2026-01").xp,runReward.xp);
assert.equal(settleAdventure(newGame(),{...walking,mode:"treadmill"},"manual").awarded,false);
const ctx=new Proxy({},{
 get(_,name){
  if(name==="createLinearGradient"||name==="createRadialGradient")return()=>({addColorStop(){}});
  return ()=>{};
 },
 set(o,key,value){o[key]=value;return true;}
});
drawCombatEffects(ctx,960,540,"sword",{startAt:1,endsAt:1.5,duration:.5,style:"sweep",special:"blade"},null,1.3);
drawCombatEffects(ctx,960,540,"bow",null,{startAt:2,duration:.5,special:"pierce"},2.35);
const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const hub=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const needle of ['id="startWalk"','id="figureArt-rangedWeapon"','class="bodySilhouette"','craftingDeficits(','id="craftFilters"','id="craftHidden"'])
 assert.ok(hub.includes(needle),"Missing V0.42 UI "+needle);
for(const needle of ['id="bandage"','function useBandage()','drawCombatEffects(weaponCtx,W,H','special="blade"','special="pierce"'])
 assert.ok(arena.includes(needle),"Missing V0.42 combat "+needle);
assert.ok(!arena.includes("drawFirstPersonWeapon(weaponCtx,W,H"),"No held weapon rendering");
console.log("V0.42 PASS: dog walking, rewards, item silhouettes, crafting deficits, bandages and distinct skills");
