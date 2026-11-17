/**
 * Player weapon behaviour shared between touch control, S21 gesture packets,
 * combat collision, and the first-person weapon renderer.
 */
import {strikeInfo} from "./combat-spatial.mjs";

export const MELEE_STYLES=Object.freeze(["sweep","overhead","thrust"]);
export const WEAPON_PROFILES=Object.freeze({
 sword:Object.freeze({name:"초보자의 검",type:"blade",colour:"#dcf8f7",trail:"#a4f8ed",reach:4.7,damage:1,seconds:.49,contact:.56,preferred:"sweep",missile:"rune"}),
 greatsword:Object.freeze({name:"청명한 장검",type:"greatblade",colour:"#c5e8ff",trail:"#74c9ff",reach:5.5,damage:1.22,seconds:.72,contact:.62,preferred:"overhead",missile:"aura"}),
 axe:Object.freeze({name:"전투 도끼",type:"axe",colour:"#f5ca91",trail:"#f0a057",reach:4.25,damage:1.18,seconds:.67,contact:.67,preferred:"overhead",missile:"ember"}),
 bow:Object.freeze({name:"숲의 사냥활",type:"bow",colour:"#d6bd80",trail:"#91e3bb",reach:2.7,damage:.55,seconds:.42,contact:.52,preferred:"thrust",missile:"arrow"}),
 staff:Object.freeze({name:"고목 마법지팡이",type:"staff",colour:"#b9dbf4",trail:"#8ed5f5",reach:3.7,damage:.72,seconds:.52,contact:.61,preferred:"thrust",missile:"orb"})
});
export const weaponProfile=weapon=>WEAPON_PROFILES[weapon]||WEAPON_PROFILES.sword;
export function normalizeMeleeStyle(style,weapon="sword"){
 return MELEE_STYLES.includes(style)?style:weaponProfile(weapon).preferred;
}
/**
 * Without a gravity/world-axis calibration, device accelerometer axes are only
 * rough hints. An explicit style choice on the S21 overrides this heuristic.
 * This does NOT claim to accurately infer a world-space cut from any grip.
 */
/**
 * Use a short action window instead of the first event crossing threshold.
 * Values are device-local axes and require optional in-hand calibration for
 * reliable distinction between a horizontal and a vertical swing.
 */
export function motionFeatures(events){
 const list=Array.isArray(events)?events:events?[events]:[];
 const peak=[0,0,0,0,0,0],scale=[13,13,13,260,260,260];
 for(const event of list){
  const a=event?.acceleration||{},r=event?.rotationRate||{};
  for(const [idx,key] of ["x","y","z"].entries())peak[idx]=Math.max(peak[idx],Math.abs(Number.isFinite(a[key])?a[key]:0));
  for(const [idx,key] of ["alpha","beta","gamma"].entries())peak[idx+3]=Math.max(peak[idx+3],Math.abs(Number.isFinite(r[key])?r[key]:0));
 }
 return peak.map((value,i)=>Math.min(4,value/scale[i]));
}
export function motionSimilarity(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==6||b.length!==6)return 0;
 let dot=0,magA=0,magB=0;
 for(let i=0;i<6;i++){
  if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))return 0;
  dot+=a[i]*b[i];magA+=a[i]*a[i];magB+=b[i]*b[i];
 }
 return magA>0&&magB>0?dot/Math.sqrt(magA*magB):0;
}
export function classifyMeleeGesture(events,choice="auto",templates=null){
 if(MELEE_STYLES.includes(choice))return choice;
 const f=motionFeatures(events);
 const stored=templates&&typeof templates==="object"?templates:{};
 const candidates=MELEE_STYLES.map(style=>({style,template:stored[style]})).filter(x=>
  Array.isArray(x.template)&&x.template.length===6&&x.template.every(Number.isFinite));
 if(candidates.length>=2){
  const sorted=candidates.map(({style,template})=>({style,score:motionSimilarity(f,template)})).sort((a,b)=>b.score-a.score);
  if(sorted[0].score>=.66&&(sorted.length<2||sorted[0].score-sorted[1].score>=.025))return sorted[0].style;
 }
 const [x,y,z,alpha,beta,gamma]=f;
 if(z>Math.max(x,y)*1.38&&z>.25)return "thrust";
 if(y>x*1.20&&y>.20)return "overhead";
 if(x>y*1.20&&x>.20)return "sweep";
 if(beta>gamma*1.22&&beta>.18)return "overhead";
 if(gamma>beta*1.22&&gamma>.18)return "sweep";
 // When axes are ambiguous, never pretend direction was measured precisely.
 return "sweep";
}
export function classifyAttackIntent(events,mode="auto",templates=null,cutChoice="auto"){
 if(mode==="throw")return {type:"throw",style:null};
 const style=classifyMeleeGesture(events,cutChoice,templates);
 if(mode==="melee")return {type:"melee",style};
 // Auto intent must use the real sensor motion even when the user fixed a
 // MELEE-only cut style. Otherwise choosing "sweep" disables all throws.
 const rawStyle=classifyMeleeGesture(events,"auto",templates);
 return rawStyle==="thrust"?{type:"throw",style:null}:{type:"melee",style};
}
export function createMeleeAction(weapon,style,startAt){
 const profile=weaponProfile(weapon),kind=weapon==="bow"?"thrust":normalizeMeleeStyle(style,weapon);
 if(!Number.isFinite(startAt))throw Error("Missing attack start time");
 const duration=profile.seconds*(kind==="overhead"?1.14:kind==="thrust"?.93:1);
 return {weapon:WEAPON_PROFILES[weapon]?weapon:"sword",style:kind,startAt,duration,
  contactAt:startAt+duration*profile.contact,endsAt:startAt+duration,damageDone:false};
}
export function actionProgress(action,now){
 if(!action||!Number.isFinite(now))return 0;
 return Math.max(0,Math.min(1,(now-action.startAt)/action.duration));
}
export function contactDue(action,previousTime,now){
 return !!action&&!action.damageDone&&Number.isFinite(previousTime)&&Number.isFinite(now)
  &&previousTime<action.contactAt&&now>=action.contactAt;
}
export function meleeHitInfo(action,player,enemy,yaw){
 if(!action||!player||!enemy||!Number.isFinite(yaw))return {canHit:false,reason:"invalid"};
 const profile=weaponProfile(action.weapon);
 const angle=action.style==="sweep"?Math.PI*.40:action.style==="overhead"?Math.PI*.21:Math.PI*.125;
 const range=profile.reach*(action.style==="thrust"?1.08:1);
 const facing=Math.atan2(Math.sin(yaw),-Math.cos(yaw));
 const info=strikeInfo({x:player.x,z:player.z,facing},enemy,range,angle);
 return {...info,range,arc:angle};
}
export function projectileProfile(weapon){
 const profile=weaponProfile(weapon);
 return {kind:profile.missile,speed:profile.missile==="arrow"?29:profile.missile==="orb"?21:23,
  radius:profile.missile==="arrow"?.095:profile.missile==="aura"?.29:.19};
}
export function validMeleeStylePacket(packet){
 if(!packet||typeof packet!=="object")return false;
 return packet.style===undefined||MELEE_STYLES.includes(packet.style);
}
