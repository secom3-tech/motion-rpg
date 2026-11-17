/**
 * Display-only crafting metadata matching combatStats() formulas.
 * Never grant stats or items from this module.
 */
import {MATERIALS,RECIPES,normalizeRpgGear} from "./gear-game.mjs";
export const MATERIAL_SYMBOLS=Object.freeze({wood:"🪵",fang:"🦴",essence:"✧",ore:"⬡"});
export const GEAR_BONUSES=Object.freeze({
 sword:"근접 공격 +18%",
 axe:"근접 공격 +36% · 공격 준비 +0.16초",
 greatsword:"근접 공격 +52% · 공격 준비 +0.22초",
 bow:"원거리 공격 +10%",
 staff:"원거리 공격 +34%",
 hunterCap:"최대 기력 +4",bare:"추가 능력치 없음",hood:"최대 기력 +8",
 ironHelm:"최대 기력 +14 · 피해 감소 +6%p",
 circlet:"원거리 공격 +8%",
 hunter:"최대 기력 +10 · 피해 감소 +3%p",
 traveler:"추가 능력치 없음",leather:"최대 기력 +17 · 피해 감소 +7%p",
 forest:"최대 기력 +24 · 피해 감소 +11%p",
 iron:"최대 기력 +42 · 피해 감소 +22%p",
 satchel:"추가 능력치 없음",none:"추가 능력치 없음",
 shield:"피해 감소 +16%p",orb:"원거리 공격 +16%",
 lantern:"최대 기력 +5"
});
export function gearBenefits(id){return GEAR_BONUSES[id]||"능력치 정보 준비 중";}
export function craftingDeficits(state,id){
 const recipe=RECIPES.find(item=>item.id===id);
 if(!recipe)return ["알 수 없는 장비"];
 const p=normalizeRpgGear(state),problems=[];
 if((state.level||1)<recipe.minLevel)problems.push("Lv."+recipe.minLevel+" 필요 · 현재 Lv."+(state.level||1));
 if(recipe.boss&&!state.quests?.forest?.bossDefeated)problems.push("지역 보스 격파 필요");
 if((state.gold||0)<recipe.price)problems.push("골드 "+(recipe.price-(state.gold||0))+" G 부족");
 for(const [mat,n] of Object.entries(recipe.materials)){
  const count=p.materials[mat]||0;
  if(n>count)problems.push(MATERIAL_SYMBOLS[mat]+" "+MATERIALS[mat].name+" "+(n-count)+"개 부족");
 }
 return problems;
}
