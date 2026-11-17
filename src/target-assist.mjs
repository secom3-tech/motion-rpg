/**
 * Accessible single-target assistance for the motion controller.
 * Pure, deterministic and independent from attack cooldown or rewards.
 * The camera follows only an actually live nearby monster and pauses when
 * the player actively adjusts the view.
 */
const finite=Number.isFinite;
export const AUTO_LOCK_RANGE=12.5;
export const AUTO_LOCK_RETAIN_RANGE=18;
export const AUTO_LOCK_MANUAL_PAUSE=2.4;
/**
 * Faraway monsters must be at least roughly in the player's field of view.
 * A monster that has already rushed within 5.2 m can be picked up behind
 * the hero so one-handed players need not manually chase circling enemies.
 */
export function canAutoAcquire(player,yaw,monster){
 if(!player||!monster||monster.dead||![player.x,player.z,monster.x,monster.z,yaw].every(finite))return false;
 const dx=monster.x-player.x,dz=monster.z-player.z,dist=Math.hypot(dx,dz);
 if(dist<.5||dist>AUTO_LOCK_RANGE)return false;
 if(dist<=5.2)return true;
 const direction=Math.atan2(dx,-dz);
 const difference=Math.atan2(Math.sin(direction-yaw),Math.cos(direction-yaw));
 return Math.abs(difference)<=Math.PI*.69;
}
/** Cinematic damping, not a snap. Avoid micro-jitter under ~1.4 degrees. */
export function followTargetYaw(yaw,target,dt,maxSpeed=1.65){
 if(![yaw,target,dt,maxSpeed].every(finite)||dt<=0||maxSpeed<=0)return yaw;
 const difference=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));
 if(Math.abs(difference)<.024)return yaw;
 const step=Math.min(maxSpeed*Math.min(dt,.05),Math.abs(difference)*.19);
 return yaw+Math.sign(difference)*Math.min(step,Math.abs(difference));
}
/** Narrow, range-limited assistance. Never turn a hit 90 degrees or reach further. */
export function assistedAimYaw(player,yaw,monster,maxError=.17,maxDistance=14){
 if(!player||!monster||monster.dead||![player.x,player.z,monster.x,monster.z,yaw].every(finite))return yaw;
 const dx=monster.x-player.x,dz=monster.z-player.z,dist=Math.hypot(dx,dz);
 if(dist>.0&&dist<=maxDistance){
  const direction=Math.atan2(dx,-dz);
  const d=Math.atan2(Math.sin(direction-yaw),Math.cos(direction-yaw));
  if(Math.abs(d)<=maxError)return yaw+d;
 }
 return yaw;
}
