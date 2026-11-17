/*
 * Motion RPG: audio-first running expedition engine.
 * Pure rules, shared between GPS and desk simulation.
 */
import {applyExperienceCurve} from "./progression.mjs";
export const SCENARIOS=Object.freeze([
 {id:"wolf",name:"회색 늑대의 추격",kind:"surge",line:"늑대 울음소리가 들린다. 무리가 길을 좁히고 있다.",win:"추격을 따돌렸다.",lose:"늑대를 피해 우회했다."},
 {id:"bandit",name:"도적의 기습",kind:"surge",line:"수풀에서 도적이 나타났다. 빈틈을 노려 자리를 벗어나자.",win:"포위망을 빠져나왔다.",lose:"도적을 피해 먼 길로 돌아갔다."},
 {id:"golem",name:"잠든 골렘",kind:"quiet",line:"거대한 골렘이 길을 막고 있다. 서두르지 말고 기척을 낮추자.",win:"골렘이 알아채지 못했다.",lose:"골렘이 깨어나 안전한 길로 물러났다."},
 {id:"archer",name:"수풀 속 궁수",kind:"surge",line:"화살이 바닥을 스쳤다. 틈이 생긴 사이 전진할 기회다.",win:"사격 범위를 벗어났다.",lose:"불리한 길목을 피해 후퇴했다."},
 {id:"fog",name:"속삭이는 안개",kind:"steady",line:"안개가 짙어졌다. 호흡을 고르며 일정한 리듬을 유지하자.",win:"고대 표식이 드러났다.",lose:"방향을 놓쳐 다시 길을 찾았다."},
 {id:"stream",name:"물소리의 길",kind:"steady",line:"개울 소리가 가까워진다. 흐름을 맞추며 길을 찾자.",win:"물의 수호자가 길을 열었다.",lose:"개울가에서 길을 돌아 나왔다."},
 {id:"ruins",name:"낡은 석문",kind:"steady",line:"폐허의 문양이 규칙적으로 빛난다. 리듬을 잃지 말자.",win:"석문이 열리고 보급품을 발견했다.",lose:"석문이 닫혔다. 다음 기회를 기다린다."},
 {id:"ranger",name:"순찰자의 시험",kind:"steady",line:"순찰자가 움직임을 관찰한다. 일정한 페이스를 유지하자.",win:"순찰자가 실력을 인정했다.",lose:"순찰자가 다음 기회를 약속했다."},
 {id:"owl",name:"야행성 올빼미",kind:"quiet",line:"올빼미가 날개를 펼쳤다. 천천히 기척을 감춰라.",win:"올빼미가 다시 잠들었다.",lose:"올빼미가 경보를 울렸다."},
 {id:"beast",name:"검은 숲의 짐승",kind:"surge",line:"큰 그림자가 뒤를 쫓는다. 안전한 길에서 약간 속도를 높여보자.",win:"짐승이 추격을 포기했다.",lose:"짐승과 거리를 두고 돌아갔다."},
 {id:"merchant",name:"길 잃은 상인",kind:"steady",line:"상인이 안전한 길을 부탁한다. 꾸준한 리듬으로 동행하자.",win:"상인이 동전 주머니를 건넸다.",lose:"상인과 길이 엇갈렸다."},
 {id:"stalker",name:"그림자 발자국",kind:"quiet",line:"누군가 흔적을 따라온다. 속도를 낮춰 존재를 숨기자.",win:"추적자를 따돌리고 통로를 찾았다.",lose:"추적자가 길목을 막아 우회했다."},
 {id:"bridge",name:"흔들리는 다리",kind:"steady",line:"오래된 다리의 끝이 보인다. 무리 없이 일정하게 이동하자.",win:"감시자가 통행을 허락했다.",lose:"다른 통로를 찾았다."},
 {id:"scarab",name:"보석 딱정벌레",kind:"quiet",line:"보석 딱정벌레가 나타났다. 조용히 흔적을 살펴보자.",win:"귀한 보석 조각을 발견했다.",lose:"딱정벌레가 사라졌다."},
 {id:"wisp",name:"길잡이 도깨비불",kind:"steady",line:"작은 불빛이 길을 안내한다. 안정된 발걸음으로 따라가자.",win:"빛이 숨겨진 숲길을 보여줬다.",lose:"빛이 안개 속으로 사라졌다."},
 {id:"hounds",name:"사냥개 무리",kind:"surge",line:"사냥개 무리가 냄새를 맡았다. 안전할 때만 리듬을 높여보자.",win:"짖는 소리가 사라졌다.",lose:"돌길을 이용해 추격을 벗어났다."},
 {id:"totem",name:"숲의 토템",kind:"steady",line:"토템이 맥박처럼 빛난다. 호흡하며 리듬을 맞춰라.",win:"토템이 마력을 나눠줬다.",lose:"토템의 빛이 약해졌다."},
 {id:"thorns",name:"가시 덤불의 틈",kind:"quiet",line:"덩굴이 길을 뒤덮었다. 가볍게 움직이며 길을 찾자.",win:"희귀한 약초를 발견했다.",lose:"넓은 길로 돌아갔다."}
]);
export const MODIFIERS=Object.freeze([
 {name:"황혼",flavor:"해가 지며 숲이 어두워진다."},
 {name:"소나기",flavor:"빗소리가 숲을 감싼다."},
 {name:"은빛 달",flavor:"달빛이 나뭇가지 사이로 흐른다."},
 {name:"고대 이끼",flavor:"오래된 나무가 빛난다."},
 {name:"산들바람",flavor:"바람이 소식을 전한다."},
 {name:"고요",flavor:"숲이 숨을 죽인 듯 조용하다."}
]);
export const STYLES=Object.freeze({
 vanguard:{label:"선봉",surge:0.08,steady:0,quiet:-0.04,description:"추격에 강하고 은신에 약함"},
 scout:{label:"정찰",surge:-0.02,steady:0.04,quiet:0.08,description:"은신과 탐색에 강함"},
 guardian:{label:"수호",surge:0,steady:0.07,quiet:0,description:"안정적인 이동과 피해 감소"}
});
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function rand(s){let x=s.seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.seed=x>>>0||987654321;return s.seed/4294967296}
const itemIds=["torch","map","bandage"];
function pickEncounter(s){
 const seen=new Set(s.events.slice(-4).map(e=>e.id));
 const pool=SCENARIOS.filter(e=>!seen.has(e.id));
 const e=pool[Math.floor(rand(s)*pool.length)];
 const m=MODIFIERS[Math.floor(rand(s)*MODIFIERS.length)];
 return {...e,modifier:m.name,flavor:m.flavor,durationSec:35+Math.floor(rand(s)*4)*5,qualitySec:0,requiredSec:0};
}
export function paceRequirement(type,base){
 if(type==="surge")return {label:"조금 빠르게 이동",hint:"평소보다 약 6% 빠르게. 전력질주는 불필요.",upper:base*.94};
 if(type==="quiet")return {label:"속도를 낮춰 은신",hint:"회복하듯 편하게 움직여.",lower:base*1.06};
 return {label:"안정적으로 이동",hint:"평소 편안한 페이스를 유지해.",lower:base*.88,upper:base*1.16};
}
export function paceQualifies(type,pace,base){
 if(!Number.isFinite(pace)||pace<=0||pace>16)return false;
 const r=paceRequirement(type,base);
 return (!r.upper||pace<=r.upper)&&(!r.lower||pace>=r.lower);
}
export function createAdventure({mode="demo",basePace=8.5,style="scout",durationMin=20,seed=17,level=1}={}){
 if(!["gps","demo","treadmill"].includes(mode)||!STYLES[style])throw Error("Invalid mode/style");
 if(!Number.isFinite(basePace)||basePace<5||basePace>15)throw Error("Invalid baseline pace");
 if(![12,20,30].includes(durationMin))throw Error("Invalid duration");
 return {version:1,mode,basePace,style,durationSec:durationMin*60,seed:(seed>>>0)||17,level:Math.max(1,Math.floor(level)),
 phase:"ready",elapsedSec:0,phaseSeconds:0,event:null,events:[],success:0,fail:0,xp:0,gold:0,loot:{torch:0,map:0,bandage:0},
 hp:100,distanceM:0,announcements:[],lastAnnouncement:"탐험 준비 완료",battleRank:Math.max(1,Math.floor((level-1)/4)+1),endReason:null};
}
function announce(s,head,detail){const item={at:Math.round(s.elapsedSec),head,detail};s.announcements.push(item);if(s.announcements.length>12)s.announcements.shift();s.lastAnnouncement=head+" "+detail;}
export function startAdventure(prev){if(prev.phase!=="ready")throw Error("Already started");const s=structuredClone(prev);s.phase="travel";s.phaseSeconds=45;announce(s,"경계의 숲에 도착했다","천천히 숲을 탐험하며 호흡을 정리하자.");return s}
function beginEncounter(s){
 s.phase="challenge";s.event=pickEncounter(s);s.phaseSeconds=s.event.durationSec;
 const req=paceRequirement(s.event.kind,s.basePace);
 announce(s,s.event.name,s.event.flavor+" "+s.event.line+" "+req.label+". "+req.hint);
}
function resolveEncounter(s){
 const e=s.event,ratio=e.requiredSec>0?e.qualitySec/e.requiredSec:0,bonus=STYLES[s.style][e.kind];
 const rating=ratio+bonus+(rand(s)-.5)*.22-(s.battleRank-1)*.025;
 const passed=ratio>=.58&&rating>=.72;
 const earnedXp=passed?14+Math.min(8,s.battleRank*2):5,earnedGold=passed?5+Math.min(8,s.battleRank*2):0;
 s.xp+=earnedXp;s.gold+=earnedGold;
 if(passed){s.success++;s.hp=clamp(s.hp+2,0,100)}else{s.fail++;s.hp=clamp(s.hp-(s.style==="guardian"?6:10),0,100)}
 let item=null;
 if(passed&&rand(s)<.22){item=itemIds[Math.floor(rand(s)*itemIds.length)];s.loot[item]+=1}
 const result={id:e.id,name:e.name,modifier:e.modifier,kind:e.kind,passed,ratio:Number(ratio.toFixed(2)),earnedXp,earnedGold,item,elapsedSec:s.elapsedSec};
 s.events.push(result);
 announce(s,passed?"임무 성공":"임무 실패",(passed?e.win:e.lose)+" 경험치 "+earnedXp+", 골드 "+earnedGold+"."+(item?" 전리품 발견.":"")+" 회복 구간에 진입한다.");
 s.event=null;s.phase="recovery";s.phaseSeconds=50;
 if(s.hp<=0){s.phase="complete";s.endReason="retreat";announce(s,"안전한 후퇴","게임 기력이 소진되어 원정을 마친다. 실제로 무리하지 않아도 된다.")}
}
function finish(s,reason="complete"){s.phase="complete";s.phaseSeconds=0;s.event=null;s.endReason=reason;announce(s,"원정 종료",Math.round(s.elapsedSec/60)+"분 탐험. 성공 "+s.success+"회, 실패 "+s.fail+"회. 모험 보상을 정산한다.");}
export function endAdventure(prev){const s=structuredClone(prev);if(s.phase==="ready"||s.phase==="complete")return s;finish(s,"stopped");return s;}
export function advanceAdventure(prev,dtSec,pace){
 if(prev.phase==="ready"||prev.phase==="complete")return structuredClone(prev);
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>120||!Number.isFinite(pace)||pace<=0)throw Error("Invalid movement");
 const s=structuredClone(prev);let left=Math.min(dtSec,s.durationSec-s.elapsedSec);
 while(left>0&&s.phase!=="complete"){
  const n=Math.min(left,s.phaseSeconds,s.durationSec-s.elapsedSec);
  if(n<=0){finish(s);break}
  s.elapsedSec+=n;s.distanceM+=n*1000/(pace*60);s.phaseSeconds-=n;left-=n;
  if(s.phase==="challenge"){s.event.requiredSec+=n;if(paceQualifies(s.event.kind,pace,s.basePace))s.event.qualitySec+=n}
  if(s.phaseSeconds<=0.00001){
   if(s.phase==="travel")beginEncounter(s);
   else if(s.phase==="challenge")resolveEncounter(s);
   else if(s.phase==="recovery"){s.phase="travel";s.phaseSeconds=55+Math.floor(rand(s)*5)*10;s.hp=clamp(s.hp+3,0,100);announce(s,"다음 탐험 구간","호흡을 정리하며 새로운 흔적을 살펴보자.");}
  }
  if(s.elapsedSec>=s.durationSec&&s.phase!=="complete")finish(s);
 }
 s.distanceM=Math.round(s.distanceM*10)/10;return s;
}
export function summarizeAdventure(s){return {elapsedSec:Math.round(s.elapsedSec),distanceM:Math.round(s.distanceM),success:s.success,fail:s.fail,xp:s.xp,gold:s.gold,loot:{...s.loot},reason:s.endReason,mode:s.mode};}
export function settleAdventure(shared,session,claimId){
 if(session.mode!=="gps"||session.phase!=="complete"||!claimId||session.elapsedSec<180||session.distanceM<200)return {state:shared,awarded:false};
 const claimed=Array.isArray(shared.runnerClaims)?shared.runnerClaims:[];
 if(claimed.includes(claimId))return {state:shared,awarded:false};
 const s={...shared,inventory:{...(shared.inventory||{})},runnerClaims:[...claimed,claimId].slice(-40)};
 s.xp=(Number(s.xp)||0)+session.xp;s.gold=(Number(s.gold)||0)+session.gold;
 Object.assign(s,applyExperienceCurve(shared,s));
 for(const id of itemIds)s.inventory[id]=(Number(s.inventory[id])||0)+session.loot[id];
 return {state:s,awarded:true};
}
