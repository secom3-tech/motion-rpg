/**
 * Shared escalating XP curve for indoor combat, 3D hunting, and GPS play.
 * Existing saves lack levelProgress: migrate from CURRENT level/current XP so
 * older characters never lose levels just because requirements increased.
 */
const positive=n=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
export const LEVEL_CURVE_VERSION=2;
export function xpRequiredForNextLevel(level){
 const l=Math.max(1,Math.floor(level)||1),stage=l-1;
 return Math.min(250000,90+45*stage+12*stage*stage);
}
export function nextLevelState(state){
 const level=Math.max(1,positive(state?.level)),xp=positive(state?.xp);
 const stored=state?.levelProgress;
 if(stored?.version===LEVEL_CURVE_VERSION&&Number.isSafeInteger(stored.nextXp)&&stored.nextXp>xp)
  return {level,nextXp:stored.nextXp};
 // Preserve progress within the old 100-XP level, too. A player who was
 // 95% of the way to the next legacy level should not start from zero.
 const oldFraction=Math.max(0,Math.min(.99,(xp-(level-1)*100)/100));
 return {level,nextXp:xp+Math.max(1,Math.ceil(xpRequiredForNextLevel(level)*(1-oldFraction)))};
}
export function applyExperienceCurve(previous,updated){
 if(!updated||typeof updated!=="object")throw Error("Updated character required");
 const currentXp=positive(updated.xp),base=nextLevelState(previous);
 let {level,nextXp}=base;
 let safety=0;
 while(currentXp>=nextXp&&safety++<500){
  level++;nextXp+=xpRequiredForNextLevel(level);
 }
 return {...updated,xp:currentXp,level,levelProgress:{version:LEVEL_CURVE_VERSION,nextXp}};
}
export function experienceProgress(state){
 const {level,nextXp}=nextLevelState(state),xp=positive(state?.xp);
 const needed=xpRequiredForNextLevel(level);
 const startXp=Math.max(0,nextXp-needed);
 return {level,xp,required:needed,remaining:Math.max(0,nextXp-xp),nextXp,
  ratio:Math.min(1,Math.max(0,(xp-startXp)/Math.max(1,nextXp-startXp)))};
}
