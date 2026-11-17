/**
 * Enemy distance attacks. Telegraph, release, visible projectile travel, and
 * real position-based impact. Player can move away from the locked launch
 * direction; attack does not magically home after release.
 */
export const RANGED_MONSTERS=Object.freeze({
 4:Object.freeze({kind:"rock",name:"거석 투척",min:4.5,max:16.5,speed:8.0,radius:.80,windup:2.20,damageFactor:1}),
 6:Object.freeze({kind:"wisp",name:"청염탄",min:4.0,max:13.5,speed:10.0,radius:.67,windup:1.55,damageFactor:.80})
});
export const isRangedStyle=style=>style==="rock"||style==="bolt";
export function rangedProfile(index){return RANGED_MONSTERS[index]||null;}
export function canStartRanged(enemy,player,index,angleToTarget,distance2d){
 const p=rangedProfile(index);
 if(!p||!enemy||!player||enemy.dead)return false;
 const distance=distance2d(enemy,player);
 if(distance<p.min||distance>p.max)return false;
 const target=angleToTarget(enemy,player);
 const angle=Math.abs(Math.atan2(Math.sin(target-enemy.facing),Math.cos(target-enemy.facing)));
 return angle<Math.PI*.43;
}
export function fireRangedProjectile(enemy,target,index,now){
 const p=rangedProfile(index);
 if(!p||!enemy||!target||![enemy.x,enemy.z,target.x,target.y,target.z,now].every(Number.isFinite))return null;
 const sy=index===4?2.7:2.0,initial={x:enemy.x,y:sy,z:enemy.z};
 const tx=target.x-initial.x,ty=target.y-initial.y,tz=target.z-initial.z,d=Math.hypot(tx,ty,tz)||1;
 return {kind:p.kind,owner:index,x:initial.x,y:initial.y,z:initial.z,
  vx:tx/d*p.speed,vy:ty/d*p.speed,vz:tz/d*p.speed,
  radius:p.radius,damageFactor:p.damageFactor,
  lifetime:Math.min(3.8,Math.max(1.2,(d+4)/p.speed)),age:0,spawnedAt:now,
  sampleTime:now,previous:{...initial},aim:{x:target.x,y:target.y,z:target.z}};
}
/**
 * Segment-to-point collision prevents tunnelling for low FPS.
 * Returns no automatic lock-on or instant damage.
 */
export function projectileStep(p,dt,player){
 if(!p||!player||![dt,player.x,player.y,player.z].every(Number.isFinite)||dt<0)throw Error("Invalid ranged projectile state");
 const step=Math.min(.08,dt),old={x:p.x,y:p.y,z:p.z};
 p.x+=p.vx*step;p.y+=p.vy*step;p.z+=p.vz*step;p.age+=step;
 const vx=p.x-old.x,vy=p.y-old.y,vz=p.z-old.z;
 const len2=vx*vx+vy*vy+vz*vz;
 const factor=len2?Math.max(0,Math.min(1,((player.x-old.x)*vx+(player.y-old.y)*vy+(player.z-old.z)*vz)/len2)):0;
 const x=old.x+factor*vx,y=old.y+factor*vy,z=old.z+factor*vz;
 const missDistance=Math.hypot(player.x-x,player.y-y,player.z-z);
 return {hit:missDistance<p.radius+.25,expired:p.age>=p.lifetime||p.y<.12,missDistance};
}
