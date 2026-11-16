/**
 * Camera-pose interpretation: shoulders and hips 2D normalized landmarks.
 * Neutral calibration is explicit. No frames or landmarks are transmitted.
 * This returns candidate movement events; combat still enforces dodge cooldown.
 */
const v=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&(p.visibility===undefined||p.visibility>=.5);
const average=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
export function poseMeasurements(landmarks){
 if(!Array.isArray(landmarks)||landmarks.length<25)return null;
 const [ls,rs,lh,rh]=[landmarks[11],landmarks[12],landmarks[23],landmarks[24]];
 if(![ls,rs,lh,rh].every(v))return null;
 const shoulder=average(ls,rs),hip=average(lh,rh);
 const shoulderWidth=Math.hypot(ls.x-rs.x,ls.y-rs.y);
 const height=Math.hypot(shoulder.x-hip.x,shoulder.y-hip.y);
 if(shoulderWidth<.055||height<.09||shoulderWidth>.75||height>.8)return null;
 return {shoulderX:shoulder.x,hipX:hip.x,shoulderY:shoulder.y,hipY:hip.y,shoulderWidth,height};
}
export function classifyMovement(measured,neutral){
 if(!measured||!neutral)return "lost";
 const sx=measured.shoulderX-neutral.shoulderX;
 const hx=measured.hipX-neutral.hipX;
 const shoulderDown=measured.shoulderY-neutral.shoulderY;
 const hipDown=measured.hipY-neutral.hipY;
 const sw=neutral.shoulderWidth;
 // Both upper body and hip should move down; head bending alone must not count.
 const downward=hipDown>Math.max(.048,neutral.height*.28)&&shoulderDown>Math.max(.035,neutral.height*.16);
 if(downward)return "duck";
 // Detect side-step or intentional torso lean, not just head motion.
 const lateralThreshold=Math.max(.046,sw*.34);
 if(Math.abs(sx)>=lateralThreshold&&
   (Math.sign(sx)===Math.sign(hx)&&Math.abs(hx)>=Math.max(.012,sw*.095)
   ||Math.abs(sx)>=Math.max(.08,sw*.52))){
  return sx<0?"left":"right";
 }
 return "neutral";
}
const avg=(frames,key)=>frames.reduce((sum,m)=>sum+m[key],0)/frames.length;
export function createPoseTracker({calibrationFrames=14,stableFrames=2,resetFrames=3,cooldownMs=1000}={}){
 let samples=[],neutral=null,stable=0,current="neutral",neutralCount=0,armed=true,last=-Infinity,seen=0;
 function reset(){samples=[];neutral=null;stable=0;current="neutral";neutralCount=0;armed=true;last=-Infinity;seen=0;}
 function beginCalibration(){reset();}
 function feed(landmarks,now=Date.now()){
  const measure=poseMeasurements(landmarks);
  if(!measure){stable=0;seen=0;return {status:neutral?"lost":"calibrating",movement:"lost",event:null,calibrated:!!neutral,progress:samples.length/calibrationFrames};}
  seen++;
  if(!neutral){
   samples.push(measure);
   if(samples.length>=calibrationFrames){
    neutral=Object.fromEntries(Object.keys(measure).map(key=>[key,avg(samples,key)]));
   }
   return {status:neutral?"ready":"calibrating",movement:"neutral",event:null,calibrated:!!neutral,progress:Math.min(1,samples.length/calibrationFrames)};
  }
  const movement=classifyMovement(measure,neutral);
  if(movement===current)stable++;else{current=movement;stable=1;}
  if(movement==="neutral"){
   neutralCount++;
   if(neutralCount>=resetFrames)armed=true;
   return {status:"ready",movement,event:null,calibrated:true,armed};
  }
  neutralCount=0;
  let event=null;
  if(movement!=="lost"&&armed&&stable>=stableFrames&&now-last>=cooldownMs){
   event={type:"dodge",direction:movement,time:now};
   armed=false;last=now;
  }
  return {status:"ready",movement,event,calibrated:true,armed};
 }
 return {feed,reset,beginCalibration,get calibrated(){return !!neutral},get neutral(){return neutral}};
}
