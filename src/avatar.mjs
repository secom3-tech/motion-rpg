/**
 * Motion RPG visual equipment prototype.
 * A shared canvas low-poly figure for the village and equipment screen.
 * Preview inventory is intentionally separate from earned game equipment.
 */
export const GEAR = Object.freeze({
  head: Object.freeze([
    {id:"bare",name:"기본 머리"},
    {id:"hunterCap",name:"사냥꾼 가죽모자"},
    {id:"hood",name:"숲지기 후드"},
    {id:"ironHelm",name:"강철 투구"},
    {id:"circlet",name:"별빛 머리띠"}
  ]),
  armor: Object.freeze([
    {id:"traveler",name:"여행자의 옷"},
    {id:"hunter",name:"숲 사냥꾼의 방랑복"},
    {id:"leather",name:"정찰 가죽갑옷"},
    {id:"iron",name:"기사의 판금갑옷"},
    {id:"forest",name:"숲의 수호갑옷"}
  ]),
  weapon: Object.freeze([
    {id:"sword",name:"초보자의 검"},
    {id:"bow",name:"숲의 사냥활"},
    {id:"greatsword",name:"청명한 장검"},
    {id:"staff",name:"고목 마법지팡이"},
    {id:"axe",name:"전투 도끼"}
  ]),
  offhand: Object.freeze([
    {id:"none",name:"보조장비 없음"},
    {id:"satchel",name:"가죽 여행 가방"},
    {id:"shield",name:"목제 방패"},
    {id:"orb",name:"푸른 마력구"},
    {id:"lantern",name:"탐험 랜턴"}
  ])
});
export const DEFAULT_LOADOUT=Object.freeze({head:"hunterCap",armor:"hunter",weapon:"bow",offhand:"satchel"});
export const SAMPLE_SETS=Object.freeze({
  beginner: Object.freeze({head:"bare",armor:"traveler",weapon:"sword",offhand:"none"}),
  hunter: Object.freeze({...DEFAULT_LOADOUT}),
  scout: Object.freeze({head:"hood",armor:"leather",weapon:"sword",offhand:"lantern"}),
  knight: Object.freeze({head:"ironHelm",armor:"iron",weapon:"greatsword",offhand:"shield"}),
  mage: Object.freeze({head:"circlet",armor:"forest",weapon:"staff",offhand:"orb"})
});
export function sanitizeLoadout(candidate){
 const source=candidate&&typeof candidate==="object"?candidate:{};
 const out={};
 for(const [slot,items] of Object.entries(GEAR)){
   out[slot]=items.some(item=>item.id===source[slot])?source[slot]:DEFAULT_LOADOUT[slot];
 }
 return out;
}
export function describeLoadout(loadout){
 const l=sanitizeLoadout(loadout);
 return Object.entries(GEAR).map(([slot,items])=>items.find(item=>item.id===l[slot]).name).join(" · ");
}
export function drawAvatar(ctx,footX,footY,scale=1,equipment=DEFAULT_LOADOUT,bob=0){
 if(!ctx||typeof ctx.save!=="function"||!Number.isFinite(footX)||!Number.isFinite(footY)||!Number.isFinite(scale)||scale<=0)return;
 const l=sanitizeLoadout(equipment),iron=l.armor==="iron",forest=l.armor==="forest",leather=l.armor==="leather",hunter=l.armor==="hunter";
 const outfit=iron?"#b1c2c5":forest?"#4f9b78":hunter?"#64755b":leather?"#95704c":"#557f75";
 const outfitSide=iron?"#687c8f":forest?"#225a47":hunter?"#4b4235":leather?"#654b36":"#30585c";
 const accent=iron?"#e8d09c":forest?"#d5e79b":hunter?"#c5a878":leather?"#dba76d":"#add0ab";
 const cape=iron?"#7b4342":forest?"#1b5546":hunter?"#6d6045":leather?"#4a443a":"#345964";
 const poly=(coords,color,stroke)=>{ctx.beginPath();for(let i=0;i<coords.length;i++){const p=coords[i];if(i===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);}ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.6;ctx.stroke();}};
 const line=(coords,color,width)=>{ctx.beginPath();coords.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 const oval=(x,y,rx,ry,color)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
 const glow=(x,y,r,rgb)=>{const g=ctx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,rgb);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);};
 ctx.save();ctx.translate(footX,footY);ctx.scale(scale,scale);
 oval(0,0,58,12,"#04161382");
 ctx.translate(0,bob);
 // Back cloak has actual volume rather than a flat rectangular costume.
 if(hunter){
   // Uneven shoulder cape and compact travel pack instead of formal knight's cloak.
   poly([[-41,-161],[31,-159],[46,-82],[30,-56],[-4,-72],[-45,-82],[-49,-116]],cape,"#1e3930");
   poly([[-30,-155],[-10,-158],[2,-75],[-22,-86]],"rgba(213,202,155,.16)");
   poly([[24,-152],[42,-150],[52,-90],[29,-93]],"#6d5136","#312b29");
 }else{
   poly([[-38,-166],[34,-166],[52,-48],[40,-9],[11,-25],[-14,-14],[-48,-34],[-48,-101]],cape,"#092a2b");
   poly([[-24,-162],[15,-161],[26,-44],[-2,-26],[-27,-49]],"rgba(200,242,182,.13)");
   poly([[-39,-156],[-51,-97],[-45,-32],[-30,-46]],"rgba(0,0,0,.20)");
 }
 // Legs and articulated plated boots.
 poly([[-29,-90],[-1,-91],[-8,-35],[-31,-34]],"#334f51");
 poly([[5,-91],[33,-88],[28,-35],[4,-35]],iron?"#63798b":"#365451");
 poly([[-30,-38],[-10,-39],[-10,-4],[-43,-4],[-45,-14]],iron?"#7e939e":"#4c473a","#1c383a");
 poly([[6,-39],[28,-39],[41,-7],[8,-3]],iron?"#8498a5":"#4b4638","#1c383a");
 poly([[-41,-16],[-12,-14],[-12,-9],[-45,-9]],accent);
 poly([[11,-13],[39,-13],[41,-9],[9,-9]],accent);
 // Body shape, shoulder thickness and torso facets.
 poly([[-42,-156],[35,-156],[46,-108],[35,-82],[-35,-82],[-49,-113]],outfitSide,"#123c3c");
 poly([[-29,-157],[28,-155],[37,-111],[28,-85],[-26,-85],[-39,-115]],outfit,"#274f48");
 poly([[-29,-157],[0,-149],[0,-88],[-26,-87],[-37,-114]],"rgba(255,255,255,.11)");
 poly([[0,-148],[28,-155],[36,-110],[28,-85],[0,-86]],"rgba(0,0,0,.13)");
 if(iron||forest){poly([[-35,-143],[-13,-152],[23,-149],[37,-140],[30,-117],[-31,-117]],iron?"#c0d1d3":"#65a97c");poly([[-33,-140],[0,-145],[0,-121],[-32,-122]],"rgba(255,255,255,.22)");}
 if(leather||hunter){line([[-26,-145],[22,-93]],"#443526",12);line([[-25,-145],[22,-95]],"#d0aa70",5);}
 if(hunter){
   // Practical split vest, hoodless scarf and utility pouch.
   poly([[-26,-148],[-12,-151],[-4,-97],[-31,-97]],"#826f50","#3c4031");
   poly([[7,-150],[27,-149],[31,-99],[14,-96]],"#516d52");
   poly([[-24,-157],[9,-161],[17,-153],[-20,-147]],"#9c9171");
   poly([[21,-107],[44,-106],[42,-82],[18,-83]],"#7e5c3f","#382e28");
   line([[23,-103],[40,-102]],"#c1a77c",2);
 }
 // Metal insignia and gear belt.
 poly([[-37,-94],[33,-94],[34,-82],[-36,-82]],"#423c35");
 poly([[-7,-96],[9,-96],[10,-81],[-8,-81]],accent,"#5a5138");
 poly([[-2,-93],[3,-93],[3,-85],[-2,-85]],"#3b4238");
 if(forest){poly([[-5,-136],[2,-145],[8,-133],[0,-119]],"#e8dd97");}
 if(iron){poly([[-9,-136],[0,-144],[10,-134],[0,-121]],"#eadca9");}
 // Upper arms and thick gloves.
 poly([[-44,-152],[-57,-146],[-70,-113],[-54,-104],[-37,-132]],outfitSide,"#294e4b");
 poly([[35,-149],[49,-150],[60,-116],[48,-105],[31,-135]],outfitSide,"#294e4b");
 poly([[-60,-122],[-69,-107],[-58,-93],[-45,-102]],"#9f765a");
 poly([[50,-116],[61,-107],[55,-92],[45,-98]],"#9f765a");
 poly([[-68,-116],[-55,-124],[-47,-111],[-58,-103]],iron?"#acbec5":outfit,"#2a4849");
 poly([[44,-126],[58,-123],[63,-108],[49,-111]],iron?"#adbec3":outfit,"#2a4849");
 poly([[-60,-107],[-47,-106],[-49,-92],[-61,-91]],"#483d36");
 poly([[49,-109],[61,-108],[61,-91],[49,-92]],"#493c32");
 if(iron){poly([[-52,-150],[-32,-163],[-19,-152],[-30,-132],[-49,-130]],"#afbdc8","#56677a");poly([[28,-154],[46,-161],[58,-148],[51,-129],[34,-131]],"#b2c4cb","#56677a");}
 // Neck and angular face.
 poly([[-13,-171],[13,-171],[12,-155],[-13,-155]],"#b68963");
 poly([[-27,-210],[-20,-227],[12,-232],[26,-214],[22,-180],[8,-165],[-11,-168],[-25,-184]],"#e2b18b","#724f4e");
 poly([[-24,-207],[-13,-226],[2,-227],[-1,-171],[-12,-171],[-26,-188]],"#f0c09a");
 poly([[4,-228],[23,-215],[20,-182],[8,-167],[1,-172]],"#c99373");
 oval(-9,-197,2.3,2.6,"#263b38");oval(12,-197,2.3,2.6,"#263b38");
 line([[0,-182],[7,-182]],"#915c51",1.7);
 // Dark sculpted hair.
 if(l.head==="bare"){poly([[-26,-202],[-28,-221],[-17,-237],[3,-242],[24,-235],[29,-218],[23,-211],[14,-226],[-2,-219],[-17,-224]],"#3b3531");poly([[-28,-217],[-25,-199],[-21,-198],[-18,-222]],"#2d2f2b");}
 if(l.head==="hunterCap"){
   // Soft wide-brimmed leather hat: clearly a woodland hunter, not an armoured soldier.
   poly([[-29,-221],[-20,-236],[8,-240],[25,-231],[30,-220],[20,-215],[-24,-215]],"#493f32");
   poly([[-42,-215],[-13,-223],[29,-219],[43,-211],[23,-207],[-30,-208]],"#756647","#362e29");
   poly([[-18,-229],[9,-234],[24,-226],[16,-219],[-19,-221]],"#89764f");
   line([[-20,-220],[20,-217]],"#bb9e6a",3);
   poly([[18,-235],[36,-248],[24,-229]],"#a7b689");
 }
 if(l.head==="hood"){
   poly([[-31,-209],[-29,-234],[-14,-253],[15,-253],[34,-232],[33,-201],[22,-216],[18,-233],[-18,-229],[-22,-204]],"#1c5945","#15372f");
   poly([[-29,-224],[-19,-241],[16,-244],[26,-224],[18,-229],[-18,-231]],"#80ad74");
   poly([[-30,-206],[-22,-211],[-19,-175],[-33,-161],[-43,-172]],"#235b46");
 }
 if(l.head==="ironHelm"){
   poly([[-29,-201],[-31,-222],[-17,-238],[14,-241],[30,-225],[30,-203],[21,-203],[19,-224],[-18,-223],[-20,-199]],"#879da9","#526572");
   poly([[-23,-226],[0,-240],[26,-229],[19,-221],[-18,-219]],"#c8d6d6");
   poly([[-4,-225],[5,-226],[5,-177],[-4,-179]],"#a4b8bf");
   poly([[-31,-206],[-17,-210],[-21,-191],[-30,-194]],"#718998");
   poly([[20,-211],[31,-209],[28,-194],[18,-192]],"#718998");
 }
 if(l.head==="circlet"){
   poly([[-26,-219],[-12,-226],[1,-221],[17,-225],[25,-215],[17,-212],[0,-215],[-18,-213]],"#e7c37b");
   glow(0,-224,19,"rgba(153,218,255,.40)");poly([[0,-235],[8,-224],[0,-213],[-7,-224]],"#8fdcf5","#d8f4ff");
   poly([[-26,-221],[-25,-231],[-16,-238],[6,-238],[20,-230],[26,-222],[16,-229],[-12,-228]],"#3b3436");
 }
 // Offhand to the viewer right.
 if(l.offhand==="shield"){
   poly([[42,-129],[88,-142],[92,-90],[66,-61],[43,-82]],"#443b2e","#cba65f");
   poly([[49,-124],[82,-132],[84,-94],[66,-71],[50,-89]],"#728b83","#d2bd88");
   poly([[59,-118],[68,-126],[77,-118],[75,-98],[66,-89],[58,-100]],"#b5bd9d");
   poly([[63,-113],[68,-121],[73,-112],[68,-100]],"#f9d89e");
 }
 if(l.offhand==="orb"){
   glow(71,-114,37,"rgba(91,204,251,.45)");oval(70,-115,17,17,"#3e9dc0");oval(66,-121,9,9,"#b0f3ff");
   line([[55,-132],[71,-147],[88,-132]],"#91e9ff",2);
 }
 if(l.offhand==="lantern"){
   line([[56,-99],[57,-132]],"#c5a771",5);
   poly([[42,-124],[70,-124],[73,-87],[39,-87]],"#684a36","#c6a568");
   poly([[47,-118],[66,-118],[67,-95],[45,-95]],"#f9ca6c");
   glow(56,-106,26,"rgba(251,190,76,.40)");
   line([[45,-125],[45,-139],[67,-139],[67,-125]],"#cead72",3);
 }
 if(l.offhand==="satchel"){
   line([[36,-151],[46,-101]],"#9c815a",7);
   poly([[48,-112],[85,-114],[89,-69],[46,-69]],"#614931","#302b24");
   poly([[47,-117],[85,-119],[83,-99],[48,-98]],"#a08054","#42362a");
   poly([[65,-111],[70,-111],[70,-103],[65,-103]],"#d2b178");
   line([[49,-77],[83,-77]],"#a98a59",2);
 }
 // Main weapon on the viewer left, never behind the armor.
 if(l.weapon==="sword"||l.weapon==="greatsword"){
   const large=l.weapon==="greatsword";
   const top=large?-258:-225;
   poly([[-63,-108],[-68,-108],[-72,top+14],[-68,top],[-62,top+13]],large?"#a7e5f1":"#d0dcdf","#6a99a7");
   poly([[-68,top],[-62,top+13],[-66,-113]],large?"#def9ff":"#ecf6f1");
   line([[-80,-112],[-52,-112]],large?"#77cef2":"#d5b976",7);
   line([[-66,-108],[-65,-84]],"#5a382a",8);
   oval(-65,-82,7,6,large?"#93eafa":"#c1a474");
   if(large){glow(-66,-180,20,"rgba(82,195,239,.16)");poly([[-72,-188],[-67,-212],[-63,-188],[-67,-175]],"#8eddf5");}
 }
 if(l.weapon==="bow"){
   // Hunter bow held in the left hand, curved wooden limbs and visible taut string.
   line([[-76,-92],[-111,-167],[-85,-243]],"#704d31",11);
   line([[-76,-92],[-111,-167],[-85,-243]],"#b88c50",4);
   line([[-76,-92],[-85,-243]],"#e7dcaf",1.9);
   line([[-106,-177],[-62,-160]],"#d0a676",2.5);
   poly([[-61,-162],[-71,-167],[-71,-157]],"#d7dfc6");
   poly([[-107,-165],[-99,-170],[-99,-162]],"#544e34");
 }
 if(l.weapon==="staff"){
   line([[-66,-91],[-76,-234]],"#59482d",12);
   line([[-72,-103],[-80,-225]],"#95744b",5);
   poly([[-80,-229],[-90,-246],[-76,-266],[-62,-247],[-66,-232]],"#7a6747");
   glow(-77,-248,30,"rgba(120,211,248,.37)");poly([[-78,-266],[-65,-250],[-78,-232],[-91,-250]],"#65b9d7","#e6f5fa");
 }
 if(l.weapon==="axe"){
   line([[-65,-90],[-70,-238]],"#77553b",11);
   poly([[-70,-231],[-91,-244],[-115,-234],[-111,-202],[-83,-211],[-69,-218]],"#a0b6bb","#39596a");
   poly([[-96,-234],[-110,-231],[-105,-209],[-85,-215]],"#d9e5e5");
 }
 // Final line details to keep low-poly figure readable at smaller sizes.
 line([[-32,-85],[28,-85]],"rgba(252,242,192,.32)",2);
 ctx.restore();
}
