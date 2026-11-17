/**
 * Automatic weapon selection based on actual hero-to-enemy distance.
 * Hysteresis stops the equipment flickering when both characters move.
 * The outgoing weapon, not the detected arm direction, selects the attack.
 */
export const MELEE_ENTER_MARGIN=0.40;
export const RANGED_ENTER_MARGIN=0.80;
export function automaticWeaponMode(player,enemy,current="melee",reach=4.7){
 if(!player||!enemy||enemy.dead)return current;
 const d=Math.hypot(enemy.x-player.x,enemy.z-player.z);
 if(!Number.isFinite(d)||!Number.isFinite(reach)||reach<=0)return current;
 const near=Math.max(3.0,reach-MELEE_ENTER_MARGIN);
 const far=near+1.2;
 if(d<=near)return "melee";
 if(d>=far)return "ranged";
 return ["melee","ranged"].includes(current)?current:"ranged";
}
export function autoMotionAttackMode(autoEnabled,activeMode,packetGesture){
 if(autoEnabled)return activeMode==="ranged"?"ranged":"melee";
 return packetGesture==="throw"?"ranged":"melee";
}
