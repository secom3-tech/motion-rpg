/**
 * Camera-following, interactive 2.5D village stage for the mobile RPG hub.
 * Not photorealistic 3D: perspective ground, depth-sorted characters, landmarks
 * and a player avatar who walks on the same coordinates as the NPCs.
 */
export const VILLAGE_SITES=Object.freeze([
 Object.freeze({id:"guild",kind:"guild",name:"길드",icon:"📜",x:-5.65,z:-12.3,approachX:-3.4,approachZ:-10.4}),
 Object.freeze({id:"smith",kind:"smith",name:"대장간",icon:"⚒",x:6.2,z:-10.8,approachX:4.2,approachZ:-9.0}),
 Object.freeze({id:"ranger",kind:"ranger",name:"숲 안내인",icon:"🌲",x:5.0,z:-18.2,approachX:3.0,approachZ:-16.3}),
 Object.freeze({id:"trader",kind:"trader",name:"시장",icon:"◈",x:-7.7,z:-4.8,approachX:-5.6,approachZ:-3.7}),
 Object.freeze({id:"forest",kind:"forest",name:"숲 입구",icon:"⚔",x:0,z:-26.1,approachX:0,approachZ:-23.0})
]);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function createVillageExplorer(){
 return {x:.1,z:-1.8,cameraX:.1,cameraZ:-1.8,vx:0,vz:0,move:.0,
  goal:null,arrived:null,walkTime:0,time:0,lookTarget:null};
}
export function setVillageDestination(state,id){
 const site=VILLAGE_SITES.find(s=>s.id===id);
 if(!site)return false;
 state.goal={x:site.approachX,z:site.approachZ,id};
 state.arrived=null;state.lookTarget=id;
 return true;
}
export function setVillageGroundDestination(state,x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 state.goal={x:clamp(x,-10,10),z:clamp(z,-25,3),id:null};
 state.arrived=null;state.lookTarget=null;return true;
}
export function advanceVillageExplorer(state,seconds,stick={x:0,y:0}){
 const dt=clamp(Number(seconds)||0,0,.055);
 state.time+=dt;
 let dx=clamp(Number(stick.x)||0,-1,1),dz=clamp(Number(stick.y)||0,-1,1);
 const manual=Math.hypot(dx,dz)>.14;
 if(manual){state.goal=null;state.lookTarget=null;}
 else if(state.goal){
  const gx=state.goal.x-state.x,gz=state.goal.z-state.z,d=Math.hypot(gx,gz);
  if(d<.54){
   const hit=state.goal.id;state.goal=null;
   if(hit&&state.arrived!==hit){state.arrived=hit;state.move=0;return hit;}
  }else{dx=gx/d;dz=gz/d;}
 }
 const length=Math.hypot(dx,dz);
 if(length>.001){
  const scale=1/Math.max(1,length),speed=3.15;
  state.vx+=(dx*scale*speed-state.vx)*Math.min(1,dt*11);
  state.vz+=(dz*scale*speed-state.vz)*Math.min(1,dt*11);
 }else{
  state.vx*=Math.exp(-dt*14);state.vz*=Math.exp(-dt*14);
 }
 const bx=state.x,bz=state.z;
 state.x=clamp(state.x+state.vx*dt,-10.8,10.8);
 state.z=clamp(state.z+state.vz*dt,-25.3,4.0);
 const traveled=Math.hypot(state.x-bx,state.z-bz);
 state.move=dt?traveled/dt:0;
 if(state.move>.12)state.walkTime+=dt*state.move;
 const cameraBlend=1-Math.exp(-dt*3.6);
 state.cameraX+=(state.x-state.cameraX)*cameraBlend;
 state.cameraZ+=(state.z-state.cameraZ)*cameraBlend;
 return null;
}
export function villageProjection(state,width,height,x,z,elevation=0){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return null;
 const focal=clamp(width*1.03,385,870),horizon=height*(width<520?.495:.38);
 const depth=state.cameraZ+6.8-z+5.9;
 if(depth<2.6)return null;
 const scale=focal/depth;
 return {x:width*.5+(x-state.cameraX)*scale,
  y:horizon+(4.12-elevation)*scale,
  scale,depth};
}
export function villageGroundFromScreen(state,width,height,x,y){
 if(![width,height,x,y].every(Number.isFinite)||width<=0||height<=0)return null;
 const horizon=height*(width<520?.495:.38);
 const focal=clamp(width*1.03,385,870);
 if(y<=horizon+18)return null;
 const depth=focal*4.12/(y-horizon);
 const worldZ=state.cameraZ+12.7-depth;
 const worldX=state.cameraX+(x-width/2)/focal*depth;
 return {x:clamp(worldX,-10.8,10.8),z:clamp(worldZ,-25.3,4)};
}
export function villageSiteAtScreen(state,width,height,x,y){
 let found=null,closest=Infinity;
 for(const site of VILLAGE_SITES){
  const p=villageProjection(state,width,height,site.x,site.z,2.05);
  if(!p)continue;
  const threshold=clamp(53*p.scale/26,36,82);
  const dist=Math.hypot(x-p.x,y-p.y);
  if(dist<threshold&&dist<closest){found=site;closest=dist;}
 }
 return found;
}
function polygon(ctx,points,fill,stroke=null,width=1){
 if(!points.length)return;
 ctx.beginPath();for(let i=0;i<points.length;i++)i?ctx.lineTo(points[i][0],points[i][1]):ctx.moveTo(points[i][0],points[i][1]);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function ellipse(ctx,x,y,rx,ry,color){
 ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);
 ctx.fillStyle=color;ctx.fill();
}
function house(ctx,p,walls="#938168",roof="#483d34",label=""){
 const x=p.x,y=p.y,s=p.scale,ww=s*3.05,hh=s*3.25,shift=s*.72;
 if(x+ww*1.5<0||x-ww*1.5>ctx.canvas.width*2)return;
 ellipse(ctx,x,y,ww*1.3,s*.28,"#17342677");
 polygon(ctx,[[x-ww,y-hh],[x+ww,y-hh],[x+ww,y],[x-ww,y]],walls,"#504e38a1",1.5);
 polygon(ctx,[[x+ww,y-hh],[x+ww+shift,y-hh-shift],[x+ww+shift,y-shift],[x+ww,y]],"#5b5140");
 polygon(ctx,[[x-ww-s*.22,y-hh],[x,y-hh-s*2],[x+ww+s*.24,y-hh]],roof,"#b6a07783",2);
 polygon(ctx,[[x,y-hh-s*2],[x+shift,y-hh-s*2-shift*.60],[x+ww+shift+s*.3,y-hh-shift],[x+ww+s*.24,y-hh]],"#665345");
 ctx.fillStyle="#392c25";ctx.fillRect(x-ww*.12,y-hh*.48,ww*.42,hh*.47);
 ctx.fillStyle="#a2c7b0";ctx.fillRect(x-ww*.88,y-hh*.70,ww*.33,hh*.29);
 ctx.fillStyle="#e7c486";ctx.fillRect(x-ww*.81,y-hh*.65,ww*.17,hh*.18);
 ctx.strokeStyle="#5d523c";ctx.lineWidth=Math.max(1,s*.08);
 ctx.beginPath();ctx.moveTo(x-ww*.72,y-hh*.7);ctx.lineTo(x-ww*.72,y-hh*.41);ctx.moveTo(x-ww*.88,y-hh*.58);ctx.lineTo(x-ww*.55,y-hh*.58);ctx.stroke();
 if(label==="guild"){
  polygon(ctx,[[x-ww*.20,y-hh*.96],[x+ww*.35,y-hh*.96],[x+ww*.28,y-hh*.70],[x-ww*.23,y-hh*.70]],"#bda36b","#4c3928",2);
  ctx.fillStyle="#39342c";ctx.font="900 "+clamp(s*.48,9,26)+"px system-ui";ctx.fillText("✦",x-ww*.04,y-hh*.78);
 }else if(label==="smith"){
  ctx.fillStyle="#67685b";ctx.fillRect(x+ww*.42,y-hh*1.73,ww*.28,hh*.8);
  ellipse(ctx,x+ww*.58,y-hh*1.95,ww*.68,ww*.45,"#bfc6b04c");
  ellipse(ctx,x+ww*.24,y-hh*.29,ww*.24,hh*.21,"#f7ad487d");
 }
}
function tree(ctx,p,green=0){
 const x=p.x,y=p.y,s=p.scale,tall=s*(3.2+green*.3);
 if(y<-200||x<-160||x>1800)return;
 ellipse(ctx,x,y,s*1.1,s*.27,"#0c2a2075");
 polygon(ctx,[[x-s*.18,y],[x+s*.21,y],[x+s*.15,y-tall],[x-s*.09,y-tall]],"#574831");
 for(let i=0;i<3;i++){
  const top=y-tall*(.70+i*.25),wide=s*(1.23-i*.16);
  polygon(ctx,[[x,top-s*.7],[x-wide,top+s*.7],[x+wide,top+s*.7]],i===0?"#2d6448":i===1?"#377658":"#438267");
  polygon(ctx,[[x,top-s*.7],[x+wide,top+s*.7],[x+s*.29,top+s*.32]],"#1b473f88");
 }
}
function lantern(ctx,p,time=0){
 const {x,y,scale:s}=p;
 ctx.strokeStyle="#54452e";ctx.lineWidth=clamp(s*.12,1,7);
 ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-s*3.3);ctx.lineTo(x+s*.65,y-s*3.3);ctx.lineTo(x+s*.65,y-s*2.75);ctx.stroke();
 const glow=ctx.createRadialGradient(x+s*.65,y-s*2.8,1,x+s*.65,y-s*2.8,s*1.75);
 glow.addColorStop(0,"#ffc77295");glow.addColorStop(1,"#fec47400");
 ctx.fillStyle=glow;ctx.fillRect(x-s*1.2,y-s*4.8,s*3.9,s*3.8);
 ctx.fillStyle="#e6bc74";ctx.fillRect(x+s*.38,y-s*3,s*.55,s*.75);
 polygon(ctx,[[x+s*.27,y-s*3],[x+s*1.03,y-s*3],[x+s*.65,y-s*3.3]],"#4a4234");
}
function resident(ctx,p,coat="#496d58",time=0){
 const {x,y,scale:s}=p,ss=s*.92;
 ellipse(ctx,x,y,ss*.43,ss*.15,"#0a211d66");
 ctx.fillStyle=coat;ctx.fillRect(x-ss*.22,y-ss*1.95,ss*.45,ss*1.42);
 ctx.fillStyle="#dcb99a";ctx.beginPath();ctx.arc(x,y-ss*2.34,ss*.28,0,Math.PI*2);ctx.fill();
 polygon(ctx,[[x-ss*.42,y-ss*2.5],[x+ss*.42,y-ss*2.5],[x+ss*.26,y-ss*2.83],[x-ss*.24,y-ss*2.83]],"#423f32");
 ctx.strokeStyle="#3a3933";ctx.lineWidth=clamp(ss*.17,1,10);
 const step=Math.sin(time*2)*ss*.10;
 ctx.beginPath();ctx.moveTo(x-ss*.15,y-ss*.58);ctx.lineTo(x-ss*.18+step,y);
 ctx.moveTo(x+ss*.15,y-ss*.58);ctx.lineTo(x+ss*.18-step,y);ctx.stroke();
}
function traderStall(ctx,p){
 const {x,y,scale:s}=p;
 ellipse(ctx,x,y,s*2.6,s*.34,"#234b336a");
 polygon(ctx,[[x-s*2.6,y-s*2.1],[x+s*2.1,y-s*2.1],[x+s*2.35,y-s*1.76],[x-s*2.3,y-s*1.76]],"#a47c53");
 ctx.strokeStyle="#68543d";ctx.lineWidth=Math.max(1.5,s*.10);
 for(const dir of [-1,1]){const pos=x+dir*s*2.25;ctx.beginPath();ctx.moveTo(pos,y);ctx.lineTo(pos,y-s*2.80);ctx.stroke();}
 polygon(ctx,[[x-s*2.8,y-s*2.73],[x-s*2.1,y-s*3.66],[x+s*2.15,y-s*3.66],[x+s*2.8,y-s*2.73]],"#7b6145");
 for(let i=0;i<5;i++){
  polygon(ctx,[[x-s*2.8+i*s*1.1,y-s*2.73],[x-s*1.8+i*s*1.1,y-s*2.73],[x-s*2.1+i*s*1.1,y-s*3.66],[x-s*2.9+i*s*1.1,y-s*3.66]],i%2?"#c6b681":"#a95e4f");
 }
 for(let i=0;i<9;i++){
  ellipse(ctx,x-s*1.9+i*s*.47,y-s*2.0-(i%3)*s*.12,s*.26,s*.19,i%2?"#d6b86c":"#8ca464");
 }
}
function villageGate(ctx,p,time){
 const {x,y,scale:s}=p;
 const width=s*2.6,height=s*6;
 ellipse(ctx,x,y,s*3,s*.38,"#142a2677");
 for(const side of [-1,1]){
  polygon(ctx,[[x+side*s*1.95,y],[x+side*s*1.25,y],[x+side*s*1.25,y-height],[x+side*s*1.95,y-height]],"#716a56","#4f4a3a");
  polygon(ctx,[[x+side*s*1.7,y-height],[x+side*s*1.35,y-height-s*.5],[x+side*s*1.9,y-height-s*1.1]],"#7f8265");
 }
 polygon(ctx,[[x-s*2.4,y-height-s*.14],[x+s*2.4,y-height-s*.14],[x+s*2.5,y-height+s*.62],[x-s*2.5,y-height+s*.62]],"#6b6e5a","#434b3d",1.5);
 polygon(ctx,[[x-s*.77,y-height-s*.08],[x+s*.77,y-height-s*.08],[x+s*.72,y-height+s*.49],[x-s*.72,y-height+s*.49]],"#d9c788");
 for(const side of [-1,1]){
  polygon(ctx,[[x+side*s*2.35,y-height+s*.4],[x+side*s*2.35,y-height+s*2.5],[x+side*s*2.55,y-height+s*2.15]],side>0?"#a7734c":"#527963");
 }
}
function villageMap(ctx,state,w){
 if(w<470)return;
 const cx=w-74,cy=75,r=52;
 ctx.save();ctx.globalAlpha=.87;
 ellipse(ctx,cx,cy,r+3,r+3,"#0c302ddf");
 ctx.strokeStyle="#e3d6a0b5";ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
 ctx.save();ctx.beginPath();ctx.arc(cx,cy,r-2,0,Math.PI*2);ctx.clip();
 ctx.fillStyle="#396548";ctx.fillRect(cx-r,cy-r,r*2,r*2);
 for(let j=0;j<14;j++){const x=cx-r+j*r/6,y=cy-r+(j*37%14)*r/7;
  ellipse(ctx,x,y,10,7,j%3?"#254e3e":"#557756");
 }
 ctx.strokeStyle="#b9ae87";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(cx,cy+r);ctx.lineTo(cx,cy-r);ctx.stroke();
 for(const site of VILLAGE_SITES){
  const x=cx+(site.x-state.x)*2.45,y=cy+(site.z-state.z)*2.45;
  if(Math.hypot(x-cx,y-cy)<r-4)ellipse(ctx,x,y,3.3,3.3,site.id==="forest"?"#e7bd70":"#eadfa0");
 }
 ellipse(ctx,cx,cy,4.5,4.5,"#ffefc8");
 ctx.restore();ctx.restore();
}
export function renderVillageWorld(ctx,state,width,height,{drawHero=null,loadout=null}={}){
 if(!ctx||!state||width<=0||height<=0)return [];
 const w=width,h=height,t=state.time,project=(x,z,e=0)=>villageProjection(state,w,h,x,z,e);
 const sky=ctx.createLinearGradient(0,0,0,h);
 sky.addColorStop(0,"#547f98");sky.addColorStop(.34,"#b1c6ad");sky.addColorStop(.65,"#c9c398");sky.addColorStop(1,"#416e4e");
 ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 // Atmospheric sun, distant ridge, ruined tower and mixed forest silhouettes.
 const sunX=w*.78-state.cameraX*4,sunY=h*.17;
 const sun=ctx.createRadialGradient(sunX,sunY,2,sunX,sunY,w*.29);
 sun.addColorStop(0,"#f6f0c770");sun.addColorStop(1,"#d6dfb000");
 ctx.fillStyle=sun;ctx.fillRect(0,0,w,h*.68);
 for(let layer=0;layer<4;layer++){
  const baseline=h*(.37+layer*.037);
  ctx.beginPath();ctx.moveTo(-20,baseline);
  for(let i=0;i<=28;i++){
   const x=i*w/26,y=baseline-16+(Math.sin(i*.74+layer*.8+state.cameraX*.03)+Math.cos(i*.38+layer*2))* (25-layer*3);
   ctx.lineTo(x,y);
  }
  ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();
  ctx.fillStyle=["#7a967e","#648875","#48735f","#315e4d"][layer];ctx.fill();
 }
 const ground=ctx.createLinearGradient(0,h*.4,0,h);
 ground.addColorStop(0,"#648e68");ground.addColorStop(.4,"#4e8057");ground.addColorStop(1,"#28573e");
 ctx.fillStyle=ground;ctx.fillRect(0,h*.42,w,h*.58);
 // Perspective forest road and roughly laid stone steps follow the same world coordinates as the hero.
 const pathL=[],pathR=[];
 for(let z=-39;z<=11;z+=1){
  const offset=Math.sin(z*.12)*.60;
  const l=project(-1.55+offset,z),r=project(1.70+offset,z);
  if(l&&r){pathL.push([l.x,l.y]);pathR.push([r.x,r.y]);}
 }
 polygon(ctx,[...pathL,...pathR.reverse()],"#998e68");
 const mainL=[],mainR=[];
 for(let z=-39;z<=11;z+=1){
  const off=Math.sin(z*.12)*.60,p1=project(-.99+off,z),p2=project(1.15+off,z);
  if(p1&&p2){mainL.push([p1.x,p1.y]);mainR.push([p2.x,p2.y]);}
 }
 polygon(ctx,[...mainL,...mainR.reverse()],"#b7aa80");
 for(let z=-31;z<=8;z+=1.4){
  for(let col=-2;col<3;col++){
   const x=col*.55+Math.sin(z*.8+col)*.15;
   const p=project(x+Math.sin(z*.12)*.60,z);
   if(!p||p.y<0||p.y>h+30)continue;
   ellipse(ctx,p.x,p.y,p.scale*.33,p.scale*.11,(Math.floor(z*3+col*3)%3)?"#c8bb90":"#90896d");
  }
 }
 // Scatter deterministic foliage: no per-frame randomness or flickering.
 const objects=[];
 for(let i=0;i<78;i++){
  const x=(((i*739+41)%211)/211-.5)*28;
  const z=-35+((i*503+13)%290)/290*43;
  if(Math.abs(x)<3.5)continue;
  objects.push({x,z,type:"tree",variant:i%5});
 }
 for(let i=0;i<56;i++){
  const x=(((i*347+15)%181)/181-.5)*23,z=-30+((i*197+43)%161)/161*37;
  if(Math.abs(x)<2.1)continue;
  objects.push({x,z,type:"grass",variant:i%4});
 }
 for(const site of VILLAGE_SITES)objects.push({...site,type:site.id});
 for(const [i,coords] of [[0,[-3.0,-5.1]],[1,[3.9,-7.8]],[2,[5.1,-16.0]],[3,[-7.1,-4.4]]]){
  objects.push({type:"npc",x:coords[0],z:coords[1],variant:i});
 }
 for(const [x,z] of [[-3.2,-4.3],[3.3,-4.8],[-2.8,-12.1],[2.6,-12.4]]){
  objects.push({type:"lantern",x,z});
 }
 objects.push({type:"hero",x:state.x,z:state.z});
 objects.sort((a,b)=>a.z-b.z);
 let heroDrawn=false;
 for(const item of objects){
  const p=project(item.x,item.z);
  if(!p||p.y<-180||p.y>h+260||p.x<-280||p.x>w+280)continue;
  if(item.type==="tree"){tree(ctx,p,item.variant);continue;}
  if(item.type==="grass"){
   const s=p.scale;
   ellipse(ctx,p.x,p.y,s*.36,s*.09,item.variant===0?"#d9ca81":item.variant===1?"#7dbb76":"#326347");
   if(item.variant===0)ellipse(ctx,p.x,p.y-s*.15,s*.09,s*.10,"#f2d78e");
   continue;
  }
  if(item.type==="lantern"){lantern(ctx,p,t);continue;}
  if(item.type==="guild"){house(ctx,p,"#a39370","#5c4a3d","guild");continue;}
  if(item.type==="smith"){house(ctx,p,"#99806c","#614333","smith");continue;}
  if(item.type==="ranger"){
   house(ctx,p,"#6c866b","#3e5f4d");
   tree(ctx,project(item.x+2.1,item.z+.5),1);continue;
  }
  if(item.type==="trader"){traderStall(ctx,p);continue;}
  if(item.type==="forest"){villageGate(ctx,p,t);continue;}
  if(item.type==="npc"){
   resident(ctx,p,["#56765f","#9e7047","#466b56","#a57e52"][item.variant],t+item.variant);
   continue;
  }
  if(item.type==="hero"){
   ellipse(ctx,p.x,p.y,p.scale*.78,p.scale*.21,"#05271e7d");
   if(drawHero)drawHero(ctx,p.x,p.y+2*Math.sin(state.walkTime*8)*(state.move>.10?1:0),
     clamp(p.scale/68,.35,1.05),loadout,Math.sin(state.walkTime*10)*2);
   else resident(ctx,p,"#476e58",t);
   heroDrawn=true;
  }
 }
 if(!heroDrawn){
  const p=project(state.x,state.z);if(p&&drawHero)drawHero(ctx,p.x,p.y,clamp(p.scale/68,.35,1),loadout);
 }
 // Place labels in 2D after rendering the whole village so they stay legible.
 const labels=[];
 for(const site of VILLAGE_SITES){
  const p=project(site.x,site.z,2.05);
  if(!p||p.x<-75||p.x>w+75||p.y<22||p.y>h-16)continue;
  const focused=state.lookTarget===site.id;
  const size=clamp(10+p.scale*.085,11,17);
  ctx.font="900 "+size+"px system-ui";
  const label=site.icon+" "+site.name;
  const measured=ctx.measureText(label).width+24,bw=Math.min(w-14,measured);
  const cx=clamp(p.x,bw/2+6,w-bw/2-6),cy=clamp(p.y,24,h-36);
  const bh=size+19;
  ctx.fillStyle=focused?"#d8bd80ed":"#102f2cd9";
  ctx.strokeStyle=focused?"#fff1b0":"#bcdca989";
  ctx.lineWidth=1.4;ctx.beginPath();ctx.roundRect(cx-bw/2,cy-bh/2,bw,bh,8);ctx.fill();ctx.stroke();
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=focused?"#2c291b":"#f4f2d7";
  ctx.fillText(label,cx,cy);
  labels.push({id:site.id,x:cx,y:cy,w:bw,h:bh});
 }
 ctx.textAlign="start";ctx.textBaseline="alphabetic";
 villageMap(ctx,state,w);
 return labels;
}
