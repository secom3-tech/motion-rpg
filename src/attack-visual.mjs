/**
 * Visual attack timing shared by WebGL rendering and collision checks.
 * Attack area uses the same range / half-angle at the moment of impact.
 * The arena stores windup, windupTotal, impactAt and impactUntil.
 */
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function attackArea(attack,style){
 if(!attack||!Number.isFinite(attack.range)||!Number.isFinite(attack.arc)||attack.range<=0||attack.arc<=0)throw Error("Invalid attack geometry");
 if(!["sweep","slam","charge"].includes(style))throw Error("Unknown attack style");
 return {range:style==="charge"?attack.range*1.05:attack.range,arc:style==="charge"?Math.min(attack.arc*.43,Math.PI*.16):style==="slam"?attack.arc*.58:attack.arc};
}
export function attackWindup(attack,style,kind){
 if(!attack||!Number.isFinite(attack.windup))throw Error("Attack timing required");
 const base=style==="rock"?2.3:style==="bolt"?1.6:kind===7?2.25:kind===4?2.15:kind===5?1.65:kind===3?1.60:1.75;
 return Math.max(base,attack.windup,style==="sweep"?1.72:1.65);
}
export function attackVisualState(enemy,now){
 if(!enemy||enemy.dead||!Number.isFinite(now))return {stage:"idle",charge:0,impact:0,progress:0};
 const remaining=Number.isFinite(enemy.windup)?enemy.windup:0;
 const duration=Number.isFinite(enemy.windupTotal)&&enemy.windupTotal>0?enemy.windupTotal:1;
 if(remaining>0){
  const progress=clamp(1-remaining/duration,0,1);
  return {stage:"windup",progress,charge:.28+.72*progress,impact:0,style:["sweep","slam","charge","rock","bolt"].includes(enemy.attackStyle)?enemy.attackStyle:"slam"};
 }
 const until=Number.isFinite(enemy.impactUntil)?enemy.impactUntil:0;
 if(until>now){
  const span=Number.isFinite(enemy.impactDuration)&&enemy.impactDuration>0?enemy.impactDuration:.48;
  const impact=clamp((until-now)/span,0,1);
  return {stage:"impact",progress:1,charge:0,impact,style:["sweep","slam","charge","rock","bolt"].includes(enemy.attackStyle)?enemy.attackStyle:"slam"};
 }
 return {stage:"idle",progress:0,charge:0,impact:0};
}
/** Samples the warning area on the ground. Angles follow the exact facing cone. */
export function warningFootprint(enemy,attack,style,radialSteps=3,angleSteps=9){
 const {range,arc}=attackArea(attack,style);
 if(!enemy||![enemy.x,enemy.z,enemy.facing].every(Number.isFinite))throw Error("Invalid enemy transform");
 if(!Number.isInteger(radialSteps)||radialSteps<1||radialSteps>8||!Number.isInteger(angleSteps)||angleSteps<3||angleSteps>32)throw Error("Invalid marker resolution");
 const edge=[],borders=[],fill=[];
 for(let i=0;i<=angleSteps;i++){
  const offset=-arc+2*arc*i/angleSteps,heading=enemy.facing+offset;
  edge.push({x:enemy.x+Math.sin(heading)*range,z:enemy.z+Math.cos(heading)*range,heading});
 }
 for(const sign of [-1,1]){
  const heading=enemy.facing+sign*arc;
  for(let i=1;i<=radialSteps;i++){
   const radius=range*i/radialSteps;
   borders.push({x:enemy.x+Math.sin(heading)*radius,z:enemy.z+Math.cos(heading)*radius,heading});
  }
 }
 for(let ring=1;ring<radialSteps;ring++){
  const radius=range*ring/radialSteps;
  for(let j=1;j<angleSteps;j+=2){
   const heading=enemy.facing-arc+2*arc*j/angleSteps;
   fill.push({x:enemy.x+Math.sin(heading)*radius,z:enemy.z+Math.cos(heading)*radius,heading});
  }
 }
 return {edge,borders,fill,range,arc};
}
