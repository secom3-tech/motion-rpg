/**
 * Illustrated first-person weapons drawn above the WebGL world, below controls.
 * The blade/head physically travels through the relevant cut path; this is
 * not the former static CSS semicircle. No fonts, textures or network needed.
 */
import {actionProgress,weaponProfile} from "./player-combat.mjs";
const smooth=t=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v)};
const drawPolygon=(ctx,points,fill,stroke=null)=>{
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2.5;ctx.stroke();}
};
const stroke=(ctx,pts,colour,width)=>{
 ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.stroke();
};
function roundGlow(ctx,x,y,r,color){
 ctx.save();const g=ctx.createRadialGradient(x,y,0,x,y,r);
 g.addColorStop(0,color);g.addColorStop(1,"rgba(0,0,0,0)");
 ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);ctx.restore();
}
function sword(ctx,heavy=false){
 const metal=heavy?"#a3d5e8":"#cedae0",edge=heavy?"#d7f7ff":"#f6ffff";
 const length=heavy?320:263,width=heavy?29:17;
 // Handle, carved grip, pommel, angled guard.
 stroke(ctx,[[0,26],[-35,-53]],"#392f2c",19);
 stroke(ctx,[[-2,18],[-34,-57]],"#bb9a6b",7);
 for(let t=0;t<4;t++){const y=15-t*16;stroke(ctx,[[-13-t*6,y],[-4-t*6,y-8]],"#694d3b",3);}
 drawPolygon(ctx,[[-12,-65],[-87,-102],[-103,-88],[-34,-48]],heavy?"#d8b781":"#b2ae8b","#403f42");
 drawPolygon(ctx,[[-29,-69],[-29-width,-106],[-width*.95-length*.49,-90-length*.58],[-147,-length],
   [-128,-length+13],[-40,-95]],metal,heavy?"#376e91":"#5a878d");
 drawPolygon(ctx,[[-31,-88],[-39,-120],[-136,-length+15],[-147,-length],
   [-131,-length-11],[-14,-102]],edge);
 stroke(ctx,[[-31,-90],[-134,-length+5]],heavy?"#90dfff":"#a5c9cf",3);
 roundGlow(ctx,-133,-length,heavy?46:24,heavy?"rgba(83,177,255,.25)":"rgba(191,252,239,.15)");
}
function axe(ctx){
 stroke(ctx,[[0,32],[-92,-280]],"#67452c",20);
 stroke(ctx,[[-11,7],[-92,-263]],"#b58b55",7);
 drawPolygon(ctx,[[-69,-252],[-121,-308],[-186,-289],[-208,-231],[-159,-211],[-98,-217]],"#c0cfd0","#4e7280");
 drawPolygon(ctx,[[-126,-298],[-179,-283],[-194,-239],[-152,-218],[-139,-259]],"#edf5eb");
 drawPolygon(ctx,[[-90,-256],[-114,-255],[-120,-218],[-96,-214]],"#7f8f95");
 stroke(ctx,[[-169,-224],[-196,-236]],"#fff2da",4);
}
function bow(ctx,charge=0){
 // Forest bow: asymmetrical limbs, glowing arrowhead and taut string.
 ctx.save();ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(-36,25);
 ctx.quadraticCurveTo(-142,-48,-105,-155);
 ctx.quadraticCurveTo(-148,-255,-53,-336);
 ctx.strokeStyle="#4c3727";ctx.lineWidth=22;ctx.stroke();
 ctx.beginPath();ctx.moveTo(-36,25);
 ctx.quadraticCurveTo(-129,-51,-91,-155);
 ctx.quadraticCurveTo(-132,-261,-53,-336);
 ctx.strokeStyle="#b39156";ctx.lineWidth=8;ctx.stroke();
 ctx.beginPath();ctx.moveTo(-36,25);
 ctx.lineTo(-45-charge*70,-154);
 ctx.lineTo(-53,-336);
 ctx.strokeStyle="#f4e7b9";ctx.lineWidth=2.5;ctx.stroke();
 ctx.beginPath();ctx.moveTo(-95-charge*65,-145);ctx.lineTo(75,-170);
 ctx.strokeStyle="#d3c39a";ctx.lineWidth=5;ctx.stroke();
 drawPolygon(ctx,[[75,-170],[57,-179],[58,-161]],"#d7edd5");
 drawPolygon(ctx,[[-75-charge*55,-148],[-99-charge*55,-162],[-99-charge*55,-134]],"#a4d0a0");
 ctx.restore();
}
function staff(ctx){
 stroke(ctx,[[3,31],[-102,-288]],"#4d332e",22);
 stroke(ctx,[[-5,10],[-104,-282]],"#96754b",7);
 stroke(ctx,[[-84,-252],[-135,-315],[-105,-353]],"#77634b",11);
 stroke(ctx,[[-93,-250],[-50,-324],[-107,-353]],"#75614c",10);
 drawPolygon(ctx,[[-109,-354],[-77,-319],[-111,-286],[-138,-317]],"#9fe9f6","#e0fcff");
 drawPolygon(ctx,[[-109,-351],[-90,-322],[-111,-299]],"#4c9dcc");
 roundGlow(ctx,-110,-319,78,"rgba(77,195,241,.4)");
 for(let i=0;i<3;i++){const x=-140+i*22,y=-362-i*10;roundGlow(ctx,x,y,14,"rgba(190,241,246,.28)");}
}
function weaponSprite(ctx,weapon,castCharge){
 if(weapon==="axe")axe(ctx);
 else if(weapon==="bow")bow(ctx,castCharge);
 else if(weapon==="staff")staff(ctx);
 else sword(ctx,weapon==="greatsword");
}
/** Screen-space curve for each real motion. Handles portrait and landscape. */
export function attackTrailPoints(width,height,style,steps=32){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error("Viewport required");
 const pts=[];
 for(let i=0;i<=steps;i++){
  const t=i/steps;let x,y;
  if(style==="overhead"){
   x=width*(.51+.11*Math.sin(t*Math.PI));
   y=height*(.20+.60*t);
  }else if(style==="thrust"){
   x=width*(.77-.30*t);
   y=height*(.73-.26*t);
  }else{
   // The visible blade moves right-to-left; its bright trail follows that path.
   x=width*(.86-.65*t);
   y=height*(.53-.15*Math.sin(t*Math.PI)+.04*t);
  }
  pts.push({x,y});
 }
 return pts;
}
function renderTrail(ctx,width,height,weapon,style,progress){
 const profile=weaponProfile(weapon);
 // Only show an energetic arc around the actual contact interval.
 const t=(progress-.13)/.75;
 if(t<=0||t>1.07)return;
 const pts=attackTrailPoints(width,height,style);
 const from=Math.max(0,Math.floor((t-.30)*32)),to=Math.min(32,Math.ceil(Math.min(1,t)*32));
 if(to<=from)return;
 ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
 const alpha=smooth(Math.min(1,(1.07-t)/.22));
 ctx.globalAlpha=Math.max(0,alpha);
 const grad=ctx.createLinearGradient(pts[from].x,pts[from].y,pts[to].x,pts[to].y);
 grad.addColorStop(0,"rgba(255,255,255,0)");
 grad.addColorStop(.55,profile.trail);grad.addColorStop(1,profile.colour);
 ctx.beginPath();ctx.moveTo(pts[from].x,pts[from].y);
 for(let k=from+1;k<=to;k++)ctx.lineTo(pts[k].x,pts[k].y);
 ctx.strokeStyle=profile.trail;ctx.lineWidth=weapon==="greatsword"?24:weapon==="axe"?18:11;
 ctx.globalAlpha*=.30;ctx.shadowColor=profile.trail;ctx.shadowBlur=30;ctx.stroke();
 ctx.globalAlpha=Math.max(0,alpha);ctx.strokeStyle=grad;ctx.lineWidth=weapon==="greatsword"?10:weapon==="axe"?8:5;
 ctx.shadowBlur=16;ctx.stroke();ctx.restore();
}
export function drawFirstPersonWeapon(ctx,width,height,weapon,melee=null,ranged=null,time=0){
 if(!ctx||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
 const profile=weaponProfile(weapon);
 const p=melee?actionProgress(melee,time):0;
 const rp=ranged?actionProgress(ranged,time):0;
 ctx.save();ctx.clearRect(0,0,width,height);
 const scale=Math.max(.36,Math.min(1.25,Math.min(width/760,height/560)));
 const bob=Math.sin(time*2.0)*4;
 let x=width*.87,y=height*.99+bob,rot=.08,size=scale;
 if(melee&&p<1){
  const q=smooth(p);
  if(melee.style==="sweep"){
   x+=width*(.08-.54*q);y-=height*(.03+.09*Math.sin(q*Math.PI));
   rot=1.05-2.2*q;
  }else if(melee.style==="overhead"){
   x-=width*(.07+.20*Math.sin(q*Math.PI));y-=height*(.42-.42*q);
   rot=-.7+1.12*q;
  }else{
   x-=width*.24*q;y-=height*(.07+.15*Math.sin(q*Math.PI));
   size*=1.05-.46*q;rot=.15;
  }
 }else if(ranged&&rp<1){
  const pull=Math.sin(Math.PI*Math.min(1,rp/.65));
  x-=width*.04*pull;y-=height*.045*pull;
  rot=-.07*pull;
 }
 ctx.translate(x,y);ctx.rotate(rot);ctx.scale(size,size);
 // Dark hand and forearm in front of the weapon handle.
 weaponSprite(ctx,weapon,ranged?Math.max(0,Math.sin(Math.PI*rp)):.04);
 drawPolygon(ctx,[[-8,25],[27,39],[61,101],[21,132],[-19,72]],"#54644b","#233d37");
 drawPolygon(ctx,[[-8,25],[24,35],[43,68],[16,83],[-19,54]],"#a9886b","#614b43");
 ctx.restore();
 if(melee&&p<1)renderTrail(ctx,width,height,weapon,melee.style,p);
 if(ranged&&rp<1&&weapon==="staff"){
  roundGlow(ctx,width*.55,height*.48,Math.max(20,width*.11),"rgba(106,218,252,.25)");
 }
}
