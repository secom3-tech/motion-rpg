/**
 * Sensor gesture gate for the dedicated wireless S21 controller.
 * Uses orientation + translational acceleration but never integrates position.
 * A cooldown and a low-motion re-arm gate reduce false duplicate attacks.
 */
export const SENSOR_MODES=Object.freeze(["throw","melee"]);
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
export function createGestureDetector({
 mode="throw",sensitivity=3,axis="",cooldownMs=700,quietMs=350
}={}){
 let last=-Infinity,lowFrom=null,armed=true,previous=0,count=0;
 let current={mode:SENSOR_MODES.includes(mode)?mode:"throw",sensitivity,axis};
 function configure(next){
  current={...current,...next};
  if(!SENSOR_MODES.includes(current.mode))current.mode="throw";
  if(!SENSOR_AXES.includes(current.axis))current.axis="";
  armed=false;lowFrom=null;previous=0; // require neutral after changing config
 }
 function reset(){last=-Infinity;lowFrom=null;armed=true;previous=0;count=0;}
 function feed(event,now=Date.now()){
  const data=motionSample(event,current.axis),threshold=gestureThreshold(current.mode,current.sensitivity);
  if(!data.valid)return {...data,gesture:null,armed,count,threshold};
  const score=data.score;
  if(score<=threshold*.34){
   if(lowFrom===null)lowFrom=now;
   if(now-lowFrom>=quietMs)armed=true;
  }else lowFrom=null;
  let gesture=null;
  if(armed&&score>=threshold&&score>=previous*.92&&now-last>=cooldownMs){
   gesture={type:current.mode,strength:Math.round(score),time:now};
   armed=false;last=now;count++;
  }
  previous=score;
  return {...data,gesture,armed,count,threshold};
 }
 return {feed,reset,configure,get count(){return count},get mode(){return current.mode}};
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
 if(packet.style!==undefined){
  if(packet.gesture!=="melee"||!["sweep","overhead","thrust"].includes(packet.style))return false;
 }
 return true;
}
