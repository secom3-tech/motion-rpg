/**
 * Pure 2D combat positioning for the forest arena (X/Z world coordinates).
 * Angle 0 faces +Z; a positive yaw faces +X.
 * Keep calculations independent from visual rendering and input controls.
 */
const TAU=Math.PI*2;
const finite=n=>typeof n==="number"&&Number.isFinite(n);
export function distance2d(a,b){
 if(!a||!b||![a.x,a.z,b.x,b.z].every(finite))return Infinity;
 return Math.hypot(b.x-a.x,b.z-a.z);
}
export function angleToTarget(source,target){
 if(!source||!target||![source.x,source.z,target.x,target.z].every(finite))return 0;
 return Math.atan2(target.x-source.x,target.z-source.z);
}
export function angleDifference(current,target){
 return Math.atan2(Math.sin(target-current),Math.cos(target-current));
}
export function turnToTarget(current,target,maxRadians){
 if(![current,target,maxRadians].every(finite)||maxRadians<0)return finite(current)?current:0;
 const d=angleDifference(current,target);
 const next=current+Math.max(-maxRadians,Math.min(maxRadians,d));
 return angleDifference(0,next);
}
export function strikeInfo(enemy,player,range,halfAngleRadians){
 const distance=distance2d(enemy,player);
 if(!finite(distance)||!finite(enemy?.facing)||!finite(range)||!finite(halfAngleRadians)||range<=0) {
  return {canHit:false,distance,angle:Math.PI,reason:"invalid"};
 }
 const angle=Math.abs(angleDifference(enemy.facing,angleToTarget(enemy,player)));
 const near=distance<=range&&distance>=0;
 const inArc=angle<=halfAngleRadians;
 return {canHit:near&&inArc,distance,angle,reason:near?(inArc?"front":"outside-arc"):"out-of-range"};
}
export const ATTACKS=Object.freeze([
 Object.freeze({name:"이끼 슬라임",range:3.2,arc:58*Math.PI/180,windup:1.05,damage:13,turnSpeed:1.55}),
 Object.freeze({name:"달빛 슬라임",range:3.2,arc:58*Math.PI/180,windup:.94,damage:17,turnSpeed:1.8}),
 Object.freeze({name:"불꽃 슬라임",range:3.5,arc:58*Math.PI/180,windup:.88,damage:21,turnSpeed:1.7}),
 Object.freeze({name:"그림자 늑대",range:4.15,arc:50*Math.PI/180,windup:.78,damage:18,turnSpeed:2.05}),
 Object.freeze({name:"유적 골렘",range:4.75,arc:70*Math.PI/180,windup:1.4,damage:28,turnSpeed:.84}),
 Object.freeze({name:"가시 멧돼지",range:5.15,arc:42*Math.PI/180,windup:1.30,damage:20,turnSpeed:1.63}),
 Object.freeze({name:"푸른 도깨비불",range:6.8,arc:74*Math.PI/180,windup:1.18,damage:15,turnSpeed:2.14}),
 Object.freeze({name:"고목 파수꾼",range:5.45,arc:76*Math.PI/180,windup:1.7,damage:29,turnSpeed:.66})
]);
const insideBounds=(p,b)=>p.x>=b.minX&&p.x<=b.maxX&&p.z>=b.minZ&&p.z<=b.maxZ;
/** Pick from a front-facing 150deg sector; widen gracefully near map edges.
 * Min range prevents materializing on top of the hero.
 * Caller should pass deterministic/seeded random for unit tests.
 */
export function spawnAroundPlayer(player,heading,random=Math.random,bounds={minX:-20,maxX:20,minZ:-29,maxZ:5}){
 if(!player||![player.x,player.z,heading].every(finite))throw Error("Invalid player location");
 if(!bounds||![bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ].every(finite)||bounds.minX>=bounds.maxX||bounds.minZ>=bounds.maxZ)
  throw Error("Invalid world bounds");
 const samples=[];
 for(let i=0;i<64;i++){
  // First 24 attempts try ahead and sides. Later allow hidden forest ambush
  // near the edge of the map, never an immediate zero-distance hit.
  const spread=i<24?1.25:i<44?Math.PI*.8:Math.PI;
  const angle=heading+(random()*2-1)*spread;
  const radius=11+random()*7;
  const point={x:player.x+Math.sin(angle)*radius,z:player.z+Math.cos(angle)*radius};
  if(insideBounds(point,bounds)&&distance2d(player,point)>=10){
   return {x:point.x,z:point.z,heading:angle,distance:distance2d(player,point),ambush:i>=24};
  }
  samples.push(point);
 }
 // Fallback for pathological map-edge/corner positioning: select the farthest
 // legal arena landmark. Never spawn inside the player's melee range.
 const b=bounds;
 const landmarks=[
  {x:b.minX+2,z:b.minZ+2},{x:b.maxX-2,z:b.minZ+2},
  {x:b.maxX-2,z:b.maxZ-2},{x:b.minX+2,z:b.maxZ-2},
  {x:(b.minX+b.maxX)/2,z:b.minZ+2},{x:(b.minX+b.maxX)/2,z:b.maxZ-2},
  {x:b.minX+2,z:(b.minZ+b.maxZ)/2},{x:b.maxX-2,z:(b.minZ+b.maxZ)/2}
 ];
 landmarks.sort((a,c)=>Math.abs(distance2d(player,a)-15)-Math.abs(distance2d(player,c)-15));
 const p=landmarks.find(p=>distance2d(player,p)>=10)||landmarks[landmarks.length-1];
 return {x:p.x,z:p.z,heading:angleToTarget(player,p),distance:distance2d(player,p),ambush:true};
}

/** Valid physical response for each telegraphed strike.
 * Touch fallback remains universal while camera gestures have to match.
 */
export function dodgeMatches(attackStyle,direction){
 if(direction==="button")return true;
 if(attackStyle==="sweep")return direction==="duck";
 if(attackStyle==="slam")return direction==="left"||direction==="right";
 return false;
}
