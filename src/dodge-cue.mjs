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
 const duck=style==="sweep";
 return {
  ready,
  text:ready?(duck?"지금 숙여!":"지금 좌우로 피해!"):"회피 재사용 대기 중",
  hint:duck?"가로 공격 · 몸을 낮춰 회피":"내려찍기·돌진 · 몸을 좌우로 이동"
 };
}
