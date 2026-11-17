/**
 * Deterministic-ish movement decisions for one forest monster.
 * Uses real world coordinates; never modifies the attack warning while
 * windup/impact is active, so visible hitboxes remain honest.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hypot=Math.hypot;
const kind=(enemy)=>Number.isInteger(enemy.kind)?enemy.kind:0;
const configs=[
 {name:"slime",aggro:9.0,space:3.25,strafe:.12,walk:.96,hop:true},
 {name:"slime",aggro:9.0,space:3.40,strafe:.20,walk:.94,hop:true},
 {name:"slime",aggro:9.5,space:3.55,strafe:.22,walk:1.02,hop:true},
 {name:"wolf",aggro:13,space:4.05,strafe:.56,walk:1.03},
 {name:"golem",aggro:18.5,space:8.0,strafe:.18,walk:1.08},
 {name:"boar",aggro:12,space:4.15,strafe:.33,walk:1.08},
 {name:"wisp",aggro:16,space:7.2,strafe:.68,walk:1.11},
 {name:"treant",aggro:10.5,space:4.45,strafe:.20,walk:.66}
];
export function monsterMovementProfile(index){return configs[index]||configs[0]}
export function createMonsterMind(index,x=0,z=0,seed=.5){
 const p=monsterMovementProfile(index);
 return {aggro:false,originX:x,originZ:z,seed:clamp(Number(seed)||0,0,1),
  vx:0,vz:0,moveSpeed:0,phase:0,nextPhase:0,side:seed>.5?1:-1,
  restUntil:0,retreatUntil:0,lostTime:0,style:p.name};
}
export function monsterMotionStep(enemy,player,mind,dt,clock){
 if(!enemy||!player||!mind||![enemy.x,enemy.z,player.x,player.z,dt,clock].every(Number.isFinite))
  throw Error("Invalid monster movement state");
 if(dt<=0)return {x:enemy.x,z:enemy.z,moveSpeed:0,aggro:mind.aggro};
 const frame=clamp(dt,0,.07),profile=monsterMovementProfile(kind(enemy));
 const dx=player.x-enemy.x,dz=player.z-enemy.z,dist=Math.max(.001,hypot(dx,dz));
 if(dist<=profile.aggro)mind.aggro=true;
 if(mind.aggro){
  mind.lostTime=dist>21?mind.lostTime+frame:0;
  if(mind.lostTime>3.5){mind.aggro=false;mind.lostTime=0;}
 }
 if(clock>=mind.nextPhase){
  mind.phase++;mind.side*=-1;
  mind.nextPhase=clock+1.3+((mind.seed+.27*mind.phase)%1)*1.75;
  mind.restUntil=profile.hop&&mind.phase%3===0?clock+.35:clock;
 }
 const speed=Math.max(0,Number(enemy.speed)||0)*profile.walk;
 let forwardX=0,forwardZ=0,lateralX=0,lateralZ=0;
 if(mind.aggro){
  const toward=dist>profile.space+.55?1:dist<profile.space-.75?-1:0;
  forwardX=dx/dist*toward;forwardZ=dz/dist*toward;
  const side=mind.side,sideScale=profile.strafe*(dist<11?1:.3);
  // Facing the player does not require walking directly at the player.
  lateralX=-dz/dist*side*sideScale;
  lateralZ=dx/dist*side*sideScale;
  // After attacking, create breathing room for a physical swing; do not orbit behind the player.
  if(clock<(mind.retreatUntil||0)&&dist<profile.space+1.8){
   forwardX=-dx/dist*.72;forwardZ=-dz/dist*.72;
   lateralX*=.35;lateralZ*=.35;
  }
  if(profile.name==="wolf"&&dist<5&&mind.phase%4===2){forwardX*=.25;forwardZ*=.25}
  if(profile.name==="boar"&&dist>6){lateralX*=1.15;lateralZ*=1.15}
  if(profile.name==="golem"||profile.name==="treant"){
   if(mind.phase%5===1){forwardX*=.65;forwardZ*=.65;lateralX*=.45;lateralZ*=.45;}
  }
 }else{
  // Unaware enemies patrol a limited area instead of tracking the player at
  // unlimited distance. This makes finding and approaching them meaningful.
  const drift=clock*.71+mind.seed*5+mind.phase*.35;
  const tx=mind.originX+Math.cos(drift)*2.05,tz=mind.originZ+Math.sin(drift*.77)*1.95;
  const pd=hypot(tx-enemy.x,tz-enemy.z);
  if(pd>.35){forwardX=(tx-enemy.x)/pd*.50;forwardZ=(tz-enemy.z)/pd*.50}
  if(profile.name==="golem"||profile.name==="treant"){forwardX*=.35;forwardZ*=.35}
 }
 let magnitude=hypot(forwardX+lateralX,forwardZ+lateralZ);
 const scale=magnitude>1?1/magnitude:1;
 let velocityX=(forwardX+lateralX)*scale*speed,velocityZ=(forwardZ+lateralZ)*scale*speed;
 if(clock<mind.restUntil){velocityX*=.08;velocityZ*=.08;}
 if(profile.hop){
  const hop=Math.sin((clock+mind.seed)*10);
  velocityX*=hop>-.2?1.20:.08;velocityZ*=hop>-.2?1.20:.08;
 }
 const blend=1-Math.exp(-frame*(profile.name==="wolf"||profile.name==="boar"?8:5));
 mind.vx+=(velocityX-mind.vx)*blend;
 mind.vz+=(velocityZ-mind.vz)*blend;
 const x=clamp(enemy.x+mind.vx*frame,-21,21),z=clamp(enemy.z+mind.vz*frame,-30,6);
 mind.moveSpeed=hypot(x-enemy.x,z-enemy.z)/frame;
 return {x,z,moveSpeed:mind.moveSpeed,aggro:mind.aggro};
}
export function canAcquireTarget(player,yaw,enemy,maxRange=13,maxAngle=Math.PI*.38){
 if(!player||!enemy||enemy.dead)return false;
 const dx=enemy.x-player.x,dz=enemy.z-player.z;
 if(!Number.isFinite(dx)||!Number.isFinite(dz)||!Number.isFinite(yaw))return false;
 const dist=hypot(dx,dz);
 if(dist>maxRange||dist<.1)return false;
 const targetYaw=Math.atan2(dx,-dz);
 const angular=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw));
 return Math.abs(angular)<=maxAngle;
}
export function retainTarget(player,enemy,maxRange=18){
 if(!player||!enemy||enemy.dead)return false;
 return hypot(enemy.x-player.x,enemy.z-player.z)<=maxRange;
}
