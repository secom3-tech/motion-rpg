/**
 * Sensor gesture gate for the dedicated wireless S21 controller.
 * Uses orientation + translational acceleration but never integrates position.
 * A cooldown and a low-motion re-arm gate reduce false duplicate attacks.
 */
export const SENSOR_MODES=Object.freeze(["throw","melee","auto"]);
export const SENSOR_AXES=Object.freeze(["alpha","beta","gamma"]);
const num=n=>Number.isFinite(n)?n:0;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function motionSample(event,selectedAxis=""){
 const r=event?.rotationRate||{},a=event?.acceleration||{};
 const rotations=Object.fromEntries(SENSOR_AXES.map(k=>[k,Math.abs(num(r[k]))]));
 const rotational=Math.hypot(...Object.values(rotations));
 const linear=Math.hypot(num(a.x),num(a.y),num(a.z));
 if(rotational>1800||linear>95)return {valid:false,score:0,rotations,linear};
 const rotation=SENSOR_AXES.includes(selectedAxis)?rotations[selectedAxis]:rotational;
 // A nil sample is not a valid positive detection; requires actual IMU motion.
 const valid=!!(event?.rotationRate||event?.acceleration)&&[rotation,linear].every(Number.isFinite);
 return {valid,score:clamp(rotation/4+linear*5,0,100),rotations,rotation,linear};
}
export function gestureThreshold(mode="throw",sensitivity=3){
 const level=clamp(Math.round(num(sensitivity)||3),1,5);
 return (mode==="melee"?38:50)+(3-level)*20;
}
/**
 * One physical action => one event. A throw can briefly settle while the arm
 * starts its recovery: require BOTH a long refractory period and continuous
 * low-motion neutral. Auto mode extends the refractory window after a throw.
 */
export function createGestureDetector({
 mode="throw",sensitivity=3,axis="",cooldownMs=700,quietMs=350,
 throwCooldownMs=1900,throwQuietMs=750
}={}){
 let last=-Infinity,nextReady=-Infinity,lowFrom=null,armed=true,previous=0,count=0,rearmQuiet=quietMs;
 let lastCooldownDuration=0;
 let current={mode:SENSOR_MODES.includes(mode)?mode:"throw",sensitivity,axis};
 function configure(next){
  current={...current,...next};
  if(!SENSOR_MODES.includes(current.mode))current.mode="throw";
  if(!SENSOR_AXES.includes(current.axis))current.axis="";
  armed=false;lowFrom=null;previous=0;nextReady=-Infinity;lastCooldownDuration=0;
  rearmQuiet=current.mode==="throw"?throwQuietMs:current.mode==="auto"?600:quietMs;
 }
 function reset(){last=-Infinity;nextReady=-Infinity;lowFrom=null;armed=true;previous=0;count=0;lastCooldownDuration=0;rearmQuiet=current.mode==="throw"?throwQuietMs:current.mode==="auto"?600:quietMs;}
 function protectThrow(startTime=last){
  if(!Number.isFinite(startTime))return;
  nextReady=Math.max(nextReady,startTime+throwCooldownMs);
  lastCooldownDuration=Math.max(lastCooldownDuration,throwCooldownMs);
  rearmQuiet=throwQuietMs;
  lowFrom=null;
  armed=false;
 }
 function feed(event,now=Date.now()){
  const data=motionSample(event,current.axis),threshold=gestureThreshold(current.mode,current.sensitivity);
  if(!data.valid)return {...data,gesture:null,armed,count,threshold,cooldownRemainingMs:Math.max(0,nextReady-now)};
  const score=data.score;
  if(score<=threshold*.28){
   if(lowFrom===null)lowFrom=now;
   if(now-lowFrom>=rearmQuiet)armed=true;
  }else lowFrom=null;
  let gesture=null;
  if(armed&&score>=threshold&&score>=previous*.92&&now>=nextReady){
   gesture={type:current.mode,strength:Math.round(score),time:now};
   armed=false;last=now;count++;
   lastCooldownDuration=current.mode==="throw"?throwCooldownMs:current.mode==="auto"?950:cooldownMs;
   nextReady=now+lastCooldownDuration;
   rearmQuiet=current.mode==="throw"?throwQuietMs:current.mode==="auto"?600:quietMs;
  }
  previous=score;
  return {...data,gesture,armed,count,threshold,cooldownRemainingMs:Math.max(0,nextReady-now)};
 }
 configure({mode,sensitivity,axis});
 reset();
 /**
  * Read-only timing for a separate visual countdown. Does not re-arm, consume
  * samples or change attack mechanics.
  */
 function status(now=Date.now()){
  const remainingMs=Math.max(0,nextReady-now);
  const quietRemainingMs=armed?0:lowFrom===null?rearmQuiet:Math.max(0,rearmQuiet-(now-lowFrom));
  return {
   cooldownRemainingMs:remainingMs,
   cooldownDurationMs:lastCooldownDuration,
   quietRemainingMs,
   armed,
   ready:armed&&remainingMs===0,
   waitingForNeutral:remainingMs===0&&!armed
  };
 }
 return {feed,reset,configure,protectThrow,status,get count(){return count},get mode(){return current.mode}};
}
export function dominantAxis(samples){
 const peak={alpha:0,beta:0,gamma:0};
 for(const s of samples||[]){
  for(const k of SENSOR_AXES)peak[k]=Math.max(peak[k],Math.abs(num(s?.rotations?.[k]??s?.[k])));
 }
 const axis=SENSOR_AXES.reduce((best,k)=>peak[k]>peak[best]?k:best,"alpha");
 return peak[axis]>=12?axis:null;
}
export function validMotionPacket(packet,expectedSession=null){
 if(!packet||typeof packet!=="object"||Array.isArray(packet))return false;
 if(packet.type!=="gesture"||!SENSOR_MODES.includes(packet.gesture))return false;
 if(!Number.isSafeInteger(packet.seq)||packet.seq<0||packet.seq>1000000000)return false;
 if(!Number.isInteger(packet.strength)||packet.strength<1||packet.strength>100)return false;
 if(!Number.isFinite(packet.time)||packet.time<=0)return false;
 if(expectedSession!==null&&packet.session!==expectedSession)return false;
 if(packet.skillHeld!==undefined&&typeof packet.skillHeld!=="boolean")return false;
 if(packet.style!==undefined){
  if(packet.gesture!=="melee"||!["sweep","overhead","thrust"].includes(packet.style))return false;
 }
 return true;
}
