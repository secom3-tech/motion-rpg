/**
 * Gravity-based forearm curl prototype (single arm only).
 * Calibrate down and up positions while the phone is fixed to the forearm.
 * One slow, complete up->down cycle emits one rep; no rep for bouncing,
 * one-way motions, or holding at the top. Not a weight/technique measurement.
 */
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const norm=a=>Math.hypot(...a);
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function gravityVector(event){
 const g=event?.accelerationIncludingGravity;
 if(!g||![g.x,g.y,g.z].every(Number.isFinite))return null;
 const v=[g.x,g.y,g.z],length=norm(v);
 if(length<5||length>16)return null;
 return v.map(n=>n/length);
}
export function averagedGravity(list){
 const samples=(list||[]).filter(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite));
 if(samples.length<5)return null;
 const v=[0,1,2].map(i=>samples.reduce((sum,s)=>sum+s[i],0)/samples.length);
 if(norm(v)<.75)return null;
 const mean=v.map(n=>n/norm(v));
 // Refuse calibration if the phone was moving too much during the hold.
 if(samples.reduce((sum,s)=>sum+norm(s.map((n,i)=>n-mean))**2,0)/samples.length>.075)return null;
 return mean;
}
export function createCurlDetector(){
 let down=null,up=null,smoothed=null,phase="down",startAt=0,topAt=0,lastRepAt=-Infinity,reps=0,progress=0;
 function calibrateDown(v){
  if(!v||v.length!==3||!v.every(Number.isFinite))return false;
  down=v.slice();up=null;smoothed=null;phase="down";reps=0;progress=0;return true;
 }
 function calibrateUp(v){
  if(!down||!v||v.length!==3||!v.every(Number.isFinite))return false;
  const difference=norm(v.map((n,i)=>n-down[i]));
  if(difference<.38)return false; // roughly 22 degrees change, device-dependent
  up=v.slice();smoothed=null;phase="down";startAt=0;topAt=0;lastRepAt=-Infinity;reps=0;progress=0;
  return true;
 }
 function feed(v,now){
  if(!down||!up||!v||!v.every(Number.isFinite)||!Number.isFinite(now))return {calibrated:!!(down&&up),rep:false,phase,progress,reps};
  smoothed=smoothed?smoothed.map((n,i)=>n*.65+v[i]*.35):v.slice();
  const delta=up.map((n,i)=>n-down[i]);
  progress=clamp(dot(smoothed.map((n,i)=>n-down[i]),delta)/Math.max(.001,dot(delta,delta)),0,1);
  let rep=false;
  if(phase==="down"){
   if(progress>.30){phase="lifting";startAt=now;}
  }else if(phase==="lifting"){
   if(progress>=.76&&now-startAt>=270){phase="lowering";topAt=now;}
   else if(progress<.16){phase="down";startAt=0;}
   else if(now-startAt>12000){phase="down";startAt=0;}
  }else if(phase==="lowering"){
   if(progress<=.23){
    // Slow controlled recovery, not an impulsive or partial stroke.
    if(now-topAt>=320&&now-startAt>=900&&now-startAt<=12000&&now-lastRepAt>=900){
     reps++;rep=true;lastRepAt=now;
    }
    phase="down";startAt=0;topAt=0;
   }else if(now-startAt>12000){phase="down";startAt=0;}
  }
  return {calibrated:true,rep,phase,progress,reps};
 }
 function reset(){smoothed=null;phase="down";startAt=0;topAt=0;progress=0;lastRepAt=-Infinity;reps=0;}
 return {calibrateDown,calibrateUp,feed,reset,get calibrated(){return !!(down&&up)},get phase(){return phase},get progress(){return progress},get reps(){return reps}};
}
