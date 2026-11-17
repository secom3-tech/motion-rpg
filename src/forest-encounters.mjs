/**
 * One connected border-forest with several landmarks, not disconnected arenas.
 * Zone names also influence monster encounters as the player explores.
 */
export const FOREST_ZONES=Object.freeze({
 trail:Object.freeze({id:"trail",name:"사냥꾼의 숲길",color:[.27,.43,.29],description:"마을로 이어지는 오래된 길"}),
 ruins:Object.freeze({id:"ruins",name:"잊힌 돌 유적",color:[.35,.43,.39],description:"고대 수호자들의 흔적"}),
 marsh:Object.freeze({id:"marsh",name:"발광 버섯 습지",color:[.15,.35,.35],description:"푸른 포자와 물안개"}),
 grove:Object.freeze({id:"grove",name:"붉은 수풀 공터",color:[.31,.37,.25],description:"짐승들이 모여드는 숲의 공터"})
});
export function forestZoneAt(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return FOREST_ZONES.trail;
 if(x< -7&&z< -4)return FOREST_ZONES.ruins;
 if(x>7&&z< -3)return FOREST_ZONES.marsh;
 if(z> -4||Math.abs(x)>8)return FOREST_ZONES.grove;
 return FOREST_ZONES.trail;
}
export const FOREST_MONSTERS=Object.freeze([
 Object.freeze({name:"이끼 슬라임",icon:"🌿",hp:100,speed:1.30,kind:"slime",area:"trail"}),
 Object.freeze({name:"달빛 슬라임",icon:"🌙",hp:112,speed:1.37,kind:"slime",area:"grove"}),
 Object.freeze({name:"불꽃 슬라임",icon:"🔥",hp:120,speed:1.44,kind:"slime",area:"ruins"}),
 Object.freeze({name:"그림자 늑대",icon:"🐺",hp:140,speed:2.55,kind:"wolf",area:"grove"}),
 Object.freeze({name:"유적 골렘",icon:"🪨",hp:240,speed:1.05,kind:"golem",area:"ruins"}),
 Object.freeze({name:"가시 멧돼지",icon:"🐗",hp:175,speed:2.18,kind:"boar",area:"grove"}),
 Object.freeze({name:"푸른 도깨비불",icon:"🔮",hp:112,speed:1.62,kind:"wisp",area:"marsh"}),
 Object.freeze({name:"고목 파수꾼",icon:"🌳",hp:275,speed:.92,kind:"treant",area:"ruins"})
]);
const ZONE_WEIGHTS=Object.freeze({
 trail:[4,3,3,1,1,1,1,0],
 ruins:[1,1,2,1,5,1,1,3],
 marsh:[1,3,1,2,1,1,5,1],
 grove:[2,2,1,5,1,4,1,1]
});
/** Unlike kills % N, the next creature depends on where the player is. */
export function chooseForestMonster(zoneId,random=Math.random,previous=-1){
 const weights=ZONE_WEIGHTS[zoneId]||ZONE_WEIGHTS.trail;
 const effective=weights.map((w,i)=>i===previous?Math.max(0,w-2):w);
 const total=effective.reduce((a,b)=>a+b,0);
 const draw=Math.max(0,Math.min(.999999999,Number(random())||0))*total;
 let acc=0;
 for(let i=0;i<effective.length;i++){acc+=effective[i];if(draw<acc)return i}
 return 0;
}
export function monsterBehaviour(index){
 const m=FOREST_MONSTERS[index]||FOREST_MONSTERS[0];
 if(m.kind==="wolf"||m.kind==="boar")return {stopDistance:2.8,orbitSpeed:0,preferred:"charge"};
 if(m.kind==="wisp")return {stopDistance:4.9,orbitSpeed:.85,preferred:"sweep"};
 if(m.kind==="golem"||m.kind==="treant")return {stopDistance:4.2,orbitSpeed:0,preferred:"slam"};
 return {stopDistance:2.8,orbitSpeed:.15,preferred:"sweep"};
}
