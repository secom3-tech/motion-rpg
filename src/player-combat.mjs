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
export function classifyMeleeGesture(event,choice="auto"){
 if(MELEE_STYLES.includes(choice))return choice;
 const acceleration=event?.acceleration||{},rotation=event?.rotationRate||{};
 const x=Math.abs(Number.isFinite(acceleration.x)?acceleration.x:0);
 const y=Math.abs(Number.isFinite(acceleration.y)?acceleration.y:0);
 const z=Math.abs(Number.isFinite(acceleration.z)?acceleration.z:0);
 const beta=Math.abs(Number.isFinite(rotation.beta)?rotation.beta:0);
 const gamma=Math.abs(Number.isFinite(rotation.gamma)?rotation.gamma:0);
 if(z>Math.max(x,y)*1.55&&z>3.5)return "thrust";
 if(x>y*1.35&&x>2)return "sweep";
 if(y>x*1.35&&y>2)return "overhead";
 if(gamma>beta*1.7&&gamma>32)return "sweep";
 if(beta>gamma*1.7&&beta>32)return "overhead";
 return "sweep";
}
export function createMeleeAction(weapon,style,startAt){
 const profile=weaponProfile(weapon),kind=normalizeMeleeStyle(style,weapon);
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
