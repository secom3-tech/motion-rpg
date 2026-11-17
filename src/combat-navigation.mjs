/**
 * Visual enemy guidance in the forest arena. Bearing, radar position and
 * perspective projection use the exact yaw convention of indoor.html:
 * yaw 0 looks toward -Z; positive yaw turns toward +X.
 * No world coordinates are ever sent to the other phone.
 */
const finite=v=>typeof v==="number"&&Number.isFinite(v);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const FOV=Math.PI/3.2;
export const RADAR_RANGE=24;

export function relativeTarget(player,yaw,target){
 if(!player||!target||![player.x,player.z,yaw,target.x,target.z].every(finite))return null;
 const dx=target.x-player.x,dz=target.z-player.z;
 const right=dx*Math.cos(yaw)+dz*Math.sin(yaw);
 const forward=dx*Math.sin(yaw)-dz*Math.cos(yaw);
 return {right,forward,distance:Math.hypot(dx,dz),
  angle:Math.atan2(right,forward)};
}
export function radarTarget(player,yaw,target,range=RADAR_RANGE){
 const v=relativeTarget(player,yaw,target);
 if(!v||!finite(range)||range<=0)return null;
 const scale=Math.min(1,range/Math.max(v.distance,.00001));
 return {x:v.right*scale/range,y:-v.forward*scale/range,
  offRange:v.distance>range,distance:v.distance,angle:v.angle};
}
/** Returns actual pixel position of a visible target (otherwise off-screen).
 * Vertical world coordinate here is absolute terrain+model head height.
 */
export function projectEnemyHead(player,yaw,pitch,target,width,height,headY){
 const rel=relativeTarget(player,yaw,target);
 if(!rel||![player.y,pitch,width,height,headY].every(finite)||width<=0||height<=0)return null;
 const vertical=headY-player.y;
 const ahead=rel.forward*Math.cos(pitch)+vertical*Math.sin(pitch);
 const up=vertical*Math.cos(pitch)-rel.forward*Math.sin(pitch);
 if(ahead<=.12)return {...rel,inView:false,behind:true,x:null,y:null};
 const focal=1/Math.tan(FOV/2),aspect=width/height;
 const x=width/2+(rel.right*focal/ahead/aspect)*width/2;
 const y=height/2-(up*focal/ahead)*height/2;
 const inView=x>=65&&x<=width-65&&y>=65&&y<=height-105;
 return {...rel,x,y,inView,behind:false};
}
/** An off-screen compass pointer around the centre of the screen.
 * Zero angle always points up; pi points down.
 */
export function enemyEdgePointer(player,yaw,target,width,height){
 const rel=relativeTarget(player,yaw,target);
 if(!rel||!finite(width)||!finite(height)||width<=0||height<=0)return null;
 const x=width/2+Math.sin(rel.angle)*Math.min(width*.34,235);
 const y=height*.49-Math.cos(rel.angle)*Math.min(height*.30,155);
 return {...rel,x:clamp(x,45,width-45),y:clamp(y,68,Math.max(68,height-135)),
  degrees:rel.angle*180/Math.PI};
}
export function monsterHeadHeight(kind){
 return kind===4||kind===7?4.05:kind===6?3.30:kind===3?2.8:kind===5?2.35:2.9;
}
export function compassDirection(angle){
 if(!finite(angle))return "방향 미확인";
 const sector=Math.round(angle/(Math.PI/4));
 return ["정면","오른쪽 앞","오른쪽","오른쪽 뒤","뒤","왼쪽 뒤","왼쪽","왼쪽 앞"][(sector%8+8)%8];
}
