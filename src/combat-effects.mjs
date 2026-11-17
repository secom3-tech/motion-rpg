/**
 * First-person combat feedback without a drawn weapon in the player's hand.
 * The 3D world still owns monsters, projectiles and collision. This lightweight
 * overlay only renders recognized attack paths, arrow releases, and skills.
 */
import {attackTrailPoints} from "./weapon-view.mjs";
import {actionProgress} from "./player-combat.mjs";
const clamp=x=>Math.max(0,Math.min(1,x));
function curve(ctx,points,from,to,color,width,glow=0){
 ctx.beginPath();
 for(let i=from;i<=to;i++){const q=points[i];if(i===from)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);}
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.lineJoin="round";
 ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.stroke();ctx.shadowBlur=0;
}
function burst(ctx,x,y,r,a,color){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=color;ctx.globalAlpha=a;ctx.lineWidth=3;
 ctx.shadowColor=color;ctx.shadowBlur=22;ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;
}
function meleeTrail(ctx,w,h,action,time){
 const p=clamp(actionProgress(action,time));
 if(p<=0)return;
 const points=attackTrailPoints(w,h,action.style,45);
 const end=Math.min(points.length-1,Math.floor(p*(points.length-1))),from=Math.max(0,end-18);
 const skill=action.special==="blade";
 ctx.save();
 ctx.globalAlpha=clamp((1-p)*2.8)*(skill?1:.86);
 curve(ctx,points,from,end,skill?"#fff3bc":"#c4f6f0",skill?20:10,skill?35:18);
 curve(ctx,points,from,end,skill?"#ffe2a0":"#ffffff",skill?7:4,15);
 if(skill){
  ctx.globalAlpha=clamp((1-p)*1.4);
  ctx.beginPath();ctx.ellipse(w*.51,h*.48,w*.24*p+w*.06,h*.13*p+h*.02,-.26,.25,2.75);
  ctx.lineWidth=9;ctx.strokeStyle="#97faff";ctx.shadowColor="#d8f7b0";ctx.shadowBlur=25;ctx.stroke();
 }
 ctx.restore();
}
function arrowRelease(ctx,w,h,action,time){
 const p=clamp((time-action.startAt)/action.duration),released=p>=.5;
 if(!released)return;
 const skill=action.special==="pierce",t=clamp((p-.5)*3.2),opacity=Math.max(0,1-t);
 ctx.save();ctx.globalAlpha=opacity;
 const centerX=w*.52,centerY=h*.49,extent=w*(skill?.4:.16)*Math.max(.2,t);
 ctx.strokeStyle=skill?"#8bffff":"#dcf2d0";ctx.lineWidth=skill?13:4;ctx.lineCap="round";ctx.shadowColor=skill?"#90e8ff":"#c8f6b5";ctx.shadowBlur=skill?48:20;
 ctx.beginPath();ctx.moveTo(centerX-extent*.8,centerY+extent*.3);ctx.lineTo(centerX+extent,centerY-extent*.35);ctx.stroke();
 ctx.shadowBlur=0;
 // Arrowhead + translucent wings are not sword-slash geometry.
 ctx.fillStyle=skill?"#eaffff":"#faf8cd";ctx.beginPath();
 ctx.moveTo(centerX+extent+12,centerY-extent*.35);ctx.lineTo(centerX+extent-25,centerY-extent*.35-12);
 ctx.lineTo(centerX+extent-25,centerY-extent*.35+12);ctx.closePath();ctx.fill();
 if(skill){burst(ctx,centerX,centerY,h*(.08+t*.30),opacity,"#81efff");burst(ctx,centerX,centerY,h*(.03+t*.22),opacity*.6,"#e6faff");}
 ctx.restore();
}
export function drawCombatEffects(ctx,width,height,weapon,melee=null,ranged=null,time=0){
 if(!ctx||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
 ctx.clearRect(0,0,width,height);
 if(melee)meleeTrail(ctx,width,height,melee,time);
 if(ranged)arrowRelease(ctx,width,height,ranged,time);
}
