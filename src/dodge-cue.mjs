/**
 * Actionable prompt for melee enemy telegraphs.
 * A dodge is active for 1.05 seconds. Prompt within that interval only;
 * a projectile must instead be avoided during flight, not at release.
 */
export const DODGE_PROMPT_WINDOW_SEC=0.90;
export function dodgePrompt(style,remainingSec,cooldownSec=0){
 if(!Number.isFinite(remainingSec)||remainingSec<=0||remainingSec>DODGE_PROMPT_WINDOW_SEC)return null;
 if(style==="rock"||style==="bolt")return null;
 const ready=Number.isFinite(cooldownSec)&&cooldownSec<=0;
 return {
  ready,
  text:ready?"지금 회피!":"회피 재사용 대기 중",
  hint:"좌우로 움직이거나 숙여! · 타격 직전에 회피"
 };
}
