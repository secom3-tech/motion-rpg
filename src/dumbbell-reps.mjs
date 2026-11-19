/**
 * Gravity-based forearm curl prototype (single arm only).
 * Calibrate down and up positions while the phone is fixed to the forearm.
 * One completed up->down cycle emits one rep. The user chooses their own pace;
 * a short anti-noise threshold only prevents accidental jiggles/double counts.
 * Not a weight, technique, or exertion measurement.
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
 let down=null,up=null,smoothed=null,phase="down",startAt=0,topAt=0,lastRepAt=-Infinity,reps=0,progress=0,peak=0;
 function calibrateDown(v){
  if(!v||v.length!==3||!v.every(Number.isFinite))return false;
  down=v.slice();up=null;smoothed=null;phase="down";reps=0;progress=0;peak=0;return true;
 }
 function calibrateUp(v){
  if(!down||!v||v.length!==3||!v.every(Number.isFinite))return false;
  const difference=norm(v.map((n,i)=>n-down[i]));
  if(difference<.38)return false; // roughly 22 degrees change, device-dependent
  up=v.slice();smoothed=null;phase="down";startAt=0;topAt=0;lastRepAt=-Infinity;reps=0;progress=0;peak=0;
  return true;
 }
 function feed(v,now){
  if(!down||!up||!v||!v.every(Number.isFinite)||!Number.isFinite(now))return {calibrated:!!(down&&up),rep:false,phase,progress,reps};
  smoothed=smoothed?smoothed.map((n,i)=>n*.55+v[i]*.45):v.slice();
  const delta=up.map((n,i)=>n-down[i]);
  progress=clamp(dot(smoothed.map((n,i)=>n-down[i]),delta)/Math.max(.001,dot(delta,delta)),0,1);
  let rep=false,rejection=null;
  if(phase==="down"){
   if(progress>.32){phase="lifting";startAt=now;peak=progress;}
  }else if(phase==="lifting"){
   peak=Math.max(peak,progress);
   // The calibrated top is a reference, not an exact pose/tempo to imitate.
   if(progress>=.67){phase="lowering";topAt=now;}
   else if(progress<.18){
    if(peak>=.43)rejection="팔을 조금 더 올려줘";
    phase="down";startAt=0;peak=0;
   }else if(now-startAt>60000){
    rejection="동작이 중단됐어 · 다시 들면 돼";phase="down";startAt=0;peak=0;
   }
  }else if(phase==="lowering"){
   if(progress<=.27){
    // Reject only implausibly short sensor jitter, not a personal workout pace.
    if(now-startAt<180)rejection="움직임이 너무 짧아 흔들림으로 감지";
    else if(now-lastRepAt<250)rejection="중복 동작 감지";
    else {reps++;rep=true;lastRepAt=now;}
    phase="down";startAt=0;topAt=0;peak=0;
   }else if(now-startAt>60000){
    rejection="아래 자세로 돌아오지 않았어";phase="down";startAt=0;topAt=0;peak=0;
   }
  }
  return {calibrated:true,rep,rejection,phase,progress,reps};
 }
 function reset(){smoothed=null;phase="down";startAt=0;topAt=0;progress=0;peak=0;lastRepAt=-Infinity;reps=0;}
 return {calibrateDown,calibrateUp,feed,reset,get calibrated(){return !!(down&&up)},get phase(){return phase},get progress(){return progress},get reps(){return reps}};
}
