/**
 * Exercise-only combat rules. Pure logic so proximity, mode selection and
 * camera clearance can be tested without a browser, WebGL or a real watch.
 * Classic S21 free-combat auto weapon logic stays in auto-weapon.mjs.
 */
export const EXERCISE_REAPPROACH_DISTANCE = 12;
const LIMITS = Object.freeze({minX:-22,maxX:22,minZ:-31,maxZ:7});
const CLEARANCES = Object.freeze([3.12,3.15,3.32,3.85,4.65,5.00,3.50,5.10]);

export function exerciseCameraClearance(monsterKind) {
 return CLEARANCES[Number.isInteger(monsterKind)&&monsterKind>=0&&monsterKind<CLEARANCES.length?monsterKind:0];
}
export function exerciseAttackMode(distance,meleeReach){
 if(!Number.isFinite(distance)||!Number.isFinite(meleeReach)||meleeReach<=0)return "melee";
 return distance<=meleeReach+1e-7?"melee":"ranged";
}
/**
 * One uninterrupted approach per enemy. Once the character has reached an
 * engagement point, enemy steps, circles and sidesteps do not retrigger chase.
 * Only an enemy fully outside re-acquisition range causes another approach.
 */
export function exerciseApproachState(engaged,distance,stopDistance,resetDistance=EXERCISE_REAPPROACH_DISTANCE){
 if(!Number.isFinite(distance)||!Number.isFinite(stopDistance)||stopDistance<=0){
  return {engaged:Boolean(engaged),move:false};
 }
 if(distance<=stopDistance)return {engaged:true,move:false};
 if(engaged&&distance<=Math.max(stopDistance+1,resetDistance))
  return {engaged:true,move:false};
 return {engaged:false,move:true};
}
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
/**
 * Resolves overlap of the camera with the *visual* monster footprint.
 * Map-edge projection tries several angles instead of pinning the camera
 * into an enemy when a direct outward push would leave the arena.
 */
export function separateExerciseCamera(player,enemy,minimumDistance,bounds=LIMITS){
 if(!player||!enemy||![player.x,player.z,enemy.x,enemy.z,minimumDistance].every(Number.isFinite)||
     minimumDistance<=0)return {x:player?.x,z:player?.z,moved:false};
 const dx=player.x-enemy.x,dz=player.z-enemy.z,dist=Math.hypot(dx,dz);
 if(dist>=minimumDistance-.001)return {x:player.x,z:player.z,moved:false};
 const base=Math.atan2(dz,dx);
 let best=null;
 for(let i=0;i<48;i++){
  const offset=i===0?0:Math.ceil(i/2)*(i%2===1?1:-1)*Math.PI/24;
  const angle=(dist>.0001?base:Math.PI/2)+offset;
  const nx=clamp(enemy.x+Math.cos(angle)*minimumDistance,bounds.minX,bounds.maxX);
  const nz=clamp(enemy.z+Math.sin(angle)*minimumDistance,bounds.minZ,bounds.maxZ);
  const attained=Math.hypot(nx-enemy.x,nz-enemy.z);
  if(attained<minimumDistance-.01)continue;
  const shift=Math.hypot(nx-player.x,nz-player.z);
  if(!best||shift<best.shift)best={x:nx,z:nz,shift};
 }
 if(best)return {x:best.x,z:best.z,moved:true};
 // Defensive fallback: choose the farthest allowed map corner.
 const options=[[bounds.minX,bounds.minZ],[bounds.minX,bounds.maxZ],
   [bounds.maxX,bounds.minZ],[bounds.maxX,bounds.maxZ]];
 const far=options.sort((a,b)=>Math.hypot(b[0]-enemy.x,b[1]-enemy.z)-
  Math.hypot(a[0]-enemy.x,a[1]-enemy.z))[0];
 return {x:far[0],z:far[1],moved:true};
}
