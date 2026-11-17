/**
 * Motion RPG - persistent equipment, crafting and challenge rewards.
 * Pure deterministic data transitions, no physical movement proof.
 * Never read the cosmetic try-on storage key here.
 */
import {GEAR,DEFAULT_LOADOUT,sanitizeLoadout} from "./avatar.mjs";
import {completeArcadeGame} from "./engine.mjs";
import {applyExperienceCurve} from "./progression.mjs";

export const MATERIALS=Object.freeze({
 wood:{name:"튼튼한 목재",source:"숲 탐험 · 몬스터"},
 fang:{name:"수렵 전리품",source:"실내 몬스터"},
 essence:{name:"정령 조각",source:"어려운 전투 · 원정"},
 ore:{name:"단단한 광석",source:"전투 중 희귀 획득"}
});
export const STARTER_OWNED=Object.freeze(["hunterCap","hunter","sword","bow","satchel"]);
const I=(slot,id,price,wood,fang,essence,ore,minLevel=1,boss=false,description="")=>Object.freeze({
 id,slot,price,materials:{wood,fang,essence,ore},minLevel,boss,description
});
export const RECIPES=Object.freeze([
 I("head","bare",4,1,0,0,0,1,false,"바람이 통하는 가벼운 모험 머리"),
 I("armor","traveler",8,2,0,0,0,1,false,"가볍고 유연한 여행 복장"),
 I("weapon","sword",12,1,2,0,0,1,false,"정확한 근거리 검격에 유리"),
 I("offhand","none",0,0,0,0,0,1,false,"보조 장비를 내려놓는다"),
 I("head","hood",15,3,1,0,0,1,false,"숲속에 익숙한 정찰병의 후드"),
 I("armor","leather",25,4,3,0,0,1,false,"방어력을 높이는 정찰용 가죽"),
 I("offhand","lantern",18,3,2,0,0,1,false,"어두운 숲에서 빛을 밝히는 랜턴"),
 I("weapon","axe",30,4,4,0,0,2,false,"한 번에 강한 근거리 공격"),
 I("weapon","staff",45,3,2,3,0,2,false,"마법탄의 위력을 높이는 지팡이"),
 I("offhand","orb",48,2,1,4,0,2,false,"마법 피해를 높이는 정령구"),
 I("head","circlet",35,2,1,3,0,2,false,"마법을 보조하는 나뭇잎 장식"),
 I("armor","forest",55,5,2,3,0,2,false,"안정된 생존을 돕는 숲의 갑옷"),
 I("offhand","shield",60,4,5,0,2,3,true,"보스 승리의 증표를 요구하는 목제 방패"),
 I("head","ironHelm",85,3,4,1,3,3,true,"강한 적을 상대하기 위한 투구"),
 I("armor","iron",125,5,7,2,5,3,true,"무겁지만 높은 방어력을 제공"),
 I("weapon","greatsword",140,4,9,3,5,3,true,"묵직한 한 방에 집중하는 장검")
]);
const ALL_IDS=new Set(Object.values(GEAR).flatMap(items=>items.map(item=>item.id)));
const VALID_SLOTS=Object.freeze(Object.fromEntries(Object.entries(GEAR).map(([slot,items])=>[slot,new Set(items.map(item=>item.id))])));
const int=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const clamp=(n,low,high)=>Math.min(high,Math.max(low,n));
export const recipeFor=id=>RECIPES.find(item=>item.id===id)||null;
function validGame(state){return state&&typeof state==="object"&&!Array.isArray(state);}
/** Old saves held only equipped.weapon; keep that item without granting locked gear. */
export const RANGED_WEAPONS=Object.freeze(["bow","staff"]);
export const MELEE_WEAPONS=Object.freeze(["sword","greatsword","axe"]);
export const weaponSlotFor=id=>RANGED_WEAPONS.includes(id)?"rangedWeapon":MELEE_WEAPONS.includes(id)?"meleeWeapon":null;
export function normalizeRpgGear(state){
 const raw=state?.rpgGear&&typeof state.rpgGear==="object"?state.rpgGear:{};
 const owned=[...new Set([...STARTER_OWNED,...(Array.isArray(raw.owned)?raw.owned:[]).filter(id=>ALL_IDS.has(id))])];
 const oldWeapon=raw.equipped?.weapon;
 const oldSlot=weaponSlotFor(oldWeapon);
 const equipped={};
 for(const slot of ["head","armor","offhand"]){
  const chosen=raw.equipped?.[slot];
  equipped[slot]=VALID_SLOTS[slot].has(chosen)&&owned.includes(chosen)?chosen:DEFAULT_LOADOUT[slot];
 }
 const melee=raw.equipped?.meleeWeapon||(oldSlot==="meleeWeapon"?oldWeapon:"sword");
 const ranged=raw.equipped?.rangedWeapon||(oldSlot==="rangedWeapon"?oldWeapon:"bow");
 equipped.meleeWeapon=MELEE_WEAPONS.includes(melee)&&owned.includes(melee)?melee:"sword";
 equipped.rangedWeapon=RANGED_WEAPONS.includes(ranged)&&owned.includes(ranged)?ranged:"bow";
 const activeWeapon=["melee","ranged"].includes(raw.activeWeapon)?raw.activeWeapon:
   (oldSlot==="rangedWeapon"?"ranged":"melee");
 equipped.weapon=activeWeapon==="ranged"?equipped.rangedWeapon:equipped.meleeWeapon;
 const materials={};for(const key of Object.keys(MATERIALS))materials[key]=clamp(int(raw.materials?.[key]),0,9999);
 const combatClaims=Array.isArray(raw.combatClaims)?raw.combatClaims.filter(s=>typeof s==="string").slice(-100):[];
 const expeditionClaims=Array.isArray(raw.expeditionClaims)?raw.expeditionClaims.filter(s=>typeof s==="string").slice(-100):[];
 return {version:2,owned,equipped,activeWeapon,materials,combatClaims,expeditionClaims,totalKills:clamp(int(raw.totalKills),0,99999)};
}
export function chooseActiveWeapon(state,mode){
 if(!["melee","ranged"].includes(mode))throw Error("Invalid weapon mode");
 const p=normalizeRpgGear(state);
 p.activeWeapon=mode;p.equipped.weapon=mode==="melee"?p.equipped.meleeWeapon:p.equipped.rangedWeapon;
 return {...state,rpgGear:p};
}
export function withRpgGear(state){
 if(!validGame(state))throw Error("Invalid shared character save");
 return {...state,rpgGear:normalizeRpgGear(state)};
}
export function gearRequirement(state,id){
 const recipe=recipeFor(id);
 if(!recipe)return {ok:false,reason:"알 수 없는 장비"};
 const p=normalizeRpgGear(state);
 if(p.owned.includes(id))return {ok:false,reason:"이미 보유한 장비"};
 if(int(state.level||1)<recipe.minLevel)return {ok:false,reason:"레벨 "+recipe.minLevel+" 필요"};
 if(recipe.boss&&!state.quests?.forest?.bossDefeated)return {ok:false,reason:"숲의 수문장 격파 필요"};
 if(int(state.gold)<recipe.price)return {ok:false,reason:"골드 "+recipe.price+" 필요"};
 const missing=Object.keys(MATERIALS).filter(key=>p.materials[key]<recipe.materials[key]);
 if(missing.length)return {ok:false,reason:MATERIALS[missing[0]].name+" "+recipe.materials[missing[0]]+"개 필요"};
 return {ok:true,reason:"제작 가능"};
}
export function craftGear(state,id){
 const recipe=recipeFor(id),ready=gearRequirement(state,id);
 if(!ready.ok)throw Error(ready.reason);
 const next=withRpgGear(state);
 next.gold=int(state.gold)-recipe.price;
 for(const material of Object.keys(MATERIALS))next.rpgGear.materials[material]-=recipe.materials[material];
 next.rpgGear.owned.push(id);
 const equipSlot=recipe.slot==="weapon"?weaponSlotFor(id):recipe.slot;
 next.rpgGear.equipped[equipSlot]=id;
 if(recipe.slot==="weapon"&&next.rpgGear.activeWeapon===(equipSlot==="meleeWeapon"?"melee":"ranged"))next.rpgGear.equipped.weapon=id;
 return next;
}
export function equipGear(state,id){
 const p=normalizeRpgGear(state);
 if(!p.owned.includes(id))throw Error("Craft the equipment before equipping");
 const slot=Object.keys(VALID_SLOTS).find(key=>VALID_SLOTS[key].has(id));
 if(!slot)throw Error("Unknown equipment");
 const equipSlot=slot==="weapon"?weaponSlotFor(id):slot;
 const equipped={...p.equipped,[equipSlot]:id};
 if(slot==="weapon"&&p.activeWeapon===(equipSlot==="meleeWeapon"?"melee":"ranged"))equipped.weapon=id;
 return {...state,rpgGear:{...p,equipped}};
}
export function combatStats(state){
 const p=normalizeRpgGear(state),{meleeWeapon,rangedWeapon,armor,head,offhand}=p.equipped;
 let slash=1,magic=1,hp=100,defence=0,attackDelay=0;
 if(meleeWeapon==="sword")slash=1.18;
 if(meleeWeapon==="axe"){slash=1.36;attackDelay=.16;}
 if(meleeWeapon==="greatsword"){slash=1.52;attackDelay=.22;}
 if(rangedWeapon==="bow")magic=1.10;
 if(rangedWeapon==="staff")magic=1.34;
 if(armor==="hunter"){hp+=10;defence+=.03;}
 else if(armor==="leather"){hp+=17;defence+=.07;}
 else if(armor==="forest"){hp+=24;defence+=.11;}
 else if(armor==="iron"){hp+=42;defence+=.22;}
 if(head==="hunterCap")hp+=4;
 if(head==="hood")hp+=8;
 if(head==="ironHelm"){hp+=14;defence+=.06;}
 if(head==="circlet")magic+=.08;
 if(offhand==="shield")defence+=.16;
 if(offhand==="orb")magic+=.16;
 if(offhand==="lantern")hp+=5;
 return {slash:Number(slash.toFixed(2)),magic:Number(magic.toFixed(2)),hp,maxHp:hp,
  defence:clamp(Number(defence.toFixed(2)),0,.5),attackDelay,weapon:p.equipped.weapon,meleeWeapon,rangedWeapon,activeWeapon:p.activeWeapon};
}
function rewardMaterials(kills){
 const count=clamp(int(kills),0,24);
 return {wood:Math.ceil(count/2),fang:count,essence:Math.floor(count/3),ore:Math.floor(count/4)};
}
/**
 * Claim the 3D combat result once per session. Existing XP/gold rules remain
 * those of completeArcadeGame. Materials are independent from cosmetics.
 */
export function claimIndoorBattle(state,result){
 if(!validGame(state)||!result||!Number.isInteger(result.kills)||result.kills<1||result.kills>10000)
   return {state,awarded:false,reason:"No valid battle result"};
 if(!Number.isFinite(result.updatedAt)||result.updatedAt<=0)return {state,awarded:false,reason:"No result timestamp"};
 const id=typeof result.sessionId==="string"&&result.sessionId.length>=8&&result.sessionId.length<=100?
   result.sessionId:"legacy-"+result.updatedAt+"-"+result.kills;
 const p=normalizeRpgGear(state);
 if(p.combatClaims.includes(id))return {state,awarded:false,reason:"Already settled"};
 // An arena can produce a result for a limited number of defeated enemies.
 const kills=clamp(result.kills,1,24);
 const capped=completeArcadeGame(state,"throw",Math.min(30,kills));
 // The old arcade pays at most 2 G for 8+ kills. Add bounded hunt rewards
 // so crafting is achievable through actual victories, not an idle clicker.
 const extraXp=Math.min(16,kills),extraGold=Math.min(36,kills*2);
 const earned={...capped,xp:capped.xp+extraXp,gold:capped.gold+extraGold};
 const next=withRpgGear(applyExperienceCurve(capped,earned));
 const materials=rewardMaterials(kills);
 for(const [key,n] of Object.entries(materials))next.rpgGear.materials[key]+=n;
 next.rpgGear.totalKills+=kills;
 next.rpgGear.combatClaims=[...p.combatClaims,id].slice(-100);
 return {state:next,awarded:true,kills,materials,xp:next.arcade.lastResult.gainedXp+extraXp,gold:next.arcade.lastResult.gainedGold+extraGold};
}
/** GPS expedition must already have passed settleAdventure's claim checks. */
export function addExpeditionMaterials(state,session,claimId){
 if(!validGame(state)||session?.mode!=="gps"||session.phase!=="complete"||!claimId||session.elapsedSec<180||session.distanceM<200)
   return {state,awarded:false};
 const p=normalizeRpgGear(state);
 if(p.expeditionClaims.includes(claimId))return {state,awarded:false};
 const successes=clamp(int(session.success),0,20);
 const bonus={wood:Math.min(8,successes),fang:Math.floor(successes/3),essence:Math.floor(successes/4),ore:0};
 const next=withRpgGear(state);
 for(const [key,n] of Object.entries(bonus))next.rpgGear.materials[key]+=n;
 next.rpgGear.expeditionClaims=[...p.expeditionClaims,claimId].slice(-100);
 return {state:next,awarded:true,materials:bonus};
}
