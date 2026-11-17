/**
 * Motion RPG remote control packets - sent over an existing single-controller
 * WebRTC data channel. Inputs are normalized, time-limited, bounded, and
 * consumed only while the arena is live. These are gameplay controls, not IMU.
 */
export const AXIS_DEADZONE=.14;
export const INPUT_TIMEOUT_MS=450;
const n=v=>typeof v==="number"&&Number.isFinite(v)?v:0;
const bound=(v,a,b)=>Math.min(b,Math.max(a,v));
export function axis(v){
 const x=bound(n(v),-1,1);
 if(Math.abs(x)<AXIS_DEADZONE)return 0;
 return Math.sign(x)*((Math.abs(x)-AXIS_DEADZONE)/(1-AXIS_DEADZONE));
}
export function movementVector(x,y){
 let dx=axis(x),dy=axis(y),len=Math.hypot(dx,dy);
 if(len>1){dx/=len;dy/=len}
 return {x:dx,y:dy};
}
export function validRemotePacket(packet,room){
 if(!packet||typeof packet!=="object"||packet.session!==room)return false;
 if(!["move","look","target","control-stop","weapon-switch","skill"].includes(packet.type))return false;
 if(!Number.isSafeInteger(packet.seq)||packet.seq<0||packet.seq>1e9)return false;
 if(!Number.isFinite(packet.time)||packet.time<=0)return false;
 if(packet.type==="move")return Number.isFinite(packet.x)&&Number.isFinite(packet.y)
   &&Math.abs(packet.x)<=1.01&&Math.abs(packet.y)<=1.01;
 if(packet.type==="look")return Number.isFinite(packet.dx)&&Number.isFinite(packet.dy)
   &&Math.abs(packet.dx)<=1&&Math.abs(packet.dy)<=1;
 if(packet.type==="target")return packet.action==="toggle"||packet.action==="next";
 if(packet.type==="weapon-switch")return ["melee","ranged","auto"].includes(packet.mode);
 return true;
}
export function createRemoteInput(){
 let moving={x:0,y:0},lastMove=-Infinity,lastSeq=-1,lastTarget=-Infinity,lastSkill=-Infinity,lastSwitch=-Infinity;
 function ingest(packet,session,now=Date.now()){
  if(!validRemotePacket(packet,session)||packet.seq<=lastSeq)return {accepted:false,reason:"invalid-or-replay"};
  // A stale/replayed network packet should not move the player later.
  if(Math.abs(now-packet.time)>30000)return {accepted:false,reason:"stale"};
  lastSeq=packet.seq;
  if(packet.type==="control-stop"){moving={x:0,y:0};lastMove=-Infinity;return {accepted:true,type:"stop"};}
  if(packet.type==="move"){moving=movementVector(packet.x,packet.y);lastMove=now;return {accepted:true,type:"move"};}
  if(packet.type==="look")return {accepted:true,type:"look",dx:packet.dx,dy:packet.dy};
  if(packet.type==="weapon-switch"){
   if(now-lastSwitch<120)return {accepted:false,reason:"switch-cooldown"};
   lastSwitch=now;return {accepted:true,type:"weapon-switch",mode:packet.mode};
  }
  if(packet.type==="skill"){
   if(now-lastSkill<500)return {accepted:false,reason:"skill-cooldown"};
   lastSkill=now;return {accepted:true,type:"skill"};
  }
  if(packet.type==="target"){
   if(now-lastTarget<300)return {accepted:false,reason:"target-cooldown"};
   lastTarget=now;return {accepted:true,type:"target",action:packet.action};
  }
  return {accepted:false,reason:"unknown"};
 }
 function current(now=Date.now()){
  return now-lastMove<=INPUT_TIMEOUT_MS?{...moving}:{x:0,y:0};
 }
 function reset(){moving={x:0,y:0};lastMove=-Infinity;lastSeq=-1;lastTarget=-Infinity;lastSkill=-Infinity;lastSwitch=-Infinity;}
 return {ingest,current,reset};
}
/** In single-target arena, lock-on keeps the visible living enemy in front.
 * When the enemy dies the camera stops auto-turning until new spawn.
 */
export function lockOnYaw(camera,enemy){
 if(!camera||!enemy||enemy.dead)return null;
 const dx=enemy.x-camera.x,dz=enemy.z-camera.z;
 return Math.atan2(dx,-dz);
}
export function rotateToward(current,target,maxStep){
 if(!Number.isFinite(current)||!Number.isFinite(target)||!Number.isFinite(maxStep))return current;
 const difference=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+Math.sign(difference)*Math.min(Math.abs(difference),Math.max(0,maxStep));
}
