/** Motion RPG dodge presentation and per-attack timing. Pure game rules. */
export const DODGE_SIDE_STEP_M=1.04;
export const DODGE_VIEW_SEC=.88;
/** Lean and crouch ease quickly in, then restore the horizon. */
export function dodgeCameraPose(kind,elapsed){
 if(!["left","right","duck"].includes(kind)||!Number.isFinite(elapsed)||elapsed<0||elapsed>=DODGE_VIEW_SEC)
  return {roll:0,crouch:0};
 const t=elapsed/DODGE_VIEW_SEC;
 const strength=t<.16?Math.sin(t/.16*Math.PI/2):Math.pow(Math.max(0,(1-t)/.84),.75);
 return {roll:kind==="left"?.078*strength:kind==="right"?-.078*strength:0,
  crouch:kind==="duck"?.72*strength:0};
}
/** During the 'Dodge NOW' telegraph window a valid dodge avoids that attack. */
export function canReserveTimedDodge({windup,remaining,promptSeconds,cooldownRemaining=0,ranged=false}){
 return !ranged&&windup>0&&remaining>0&&remaining<=promptSeconds+.08&&cooldownRemaining<=0;
}
export function shouldDodgeMeleeHit({protectedAttack,attackId,withinActiveWindow}){
 return protectedAttack===attackId&&attackId>0||Boolean(withinActiveWindow);
}
