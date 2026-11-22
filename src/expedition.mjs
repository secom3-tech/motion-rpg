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
 const pool=SCENARIOS.filter(e=>!seen.has(e.id)&&(s.mode!=="walk"||e.kind!=="surge"));
 const e=pool[Math.floor(rand(s)*pool.length)];
 const m=MODIFIERS[Math.floor(rand(s)*MODIFIERS.length)];
 return {...e,modifier:m.name,flavor:m.flavor,durationSec:35+Math.floor(rand(s)*4)*5,
  qualitySec:0,requiredSec:0,distanceM:0,goodDistanceM:0,tooFastSec:0,tooSlowSec:0,
  goalDistanceM:0,goalDurationSec:0,stationarySec:0,stationaryAnnounced:false,
  countdownAnnounced:false,halfAnnounced:false,nearAnnounced:false,finalAnnounced:false};
}
export function paceRequirement(type,base){
 if(type==="surge")return {label:"조금 빠르게 이동",hint:"평소보다 약 6% 빠르게. 전력질주는 불필요.",upper:base*.94};
 if(type==="quiet")return {label:"속도를 낮춰 은신",hint:"회복하듯 편하게 움직여.",lower:base*1.06};
 return {label:"안정적으로 이동",hint:"평소 편안한 페이스를 유지해.",lower:base*.80,upper:base*1.22};
}
export function paceQualifies(type,pace,base){
 if(!Number.isFinite(pace)||pace<=0||pace>16)return false;
 const r=paceRequirement(type,base);
 return (!r.upper||pace<=r.upper)&&(!r.lower||pace>=r.lower);
}
export function createAdventure({mode="demo",basePace=8.5,style="scout",durationMin=20,seed=17,level=1}={}){
 if(!["gps","walk","demo","treadmill"].includes(mode)||!STYLES[style])throw Error("Invalid mode/style");
 if(!Number.isFinite(basePace)||basePace<5||basePace>15)throw Error("Invalid baseline pace");
 if(![0,12,20,30,45,60].includes(durationMin))throw Error("Invalid duration");
 return {version:3,mode,basePace,style,freeRoam:durationMin===0,durationSec:durationMin===0?120*60:durationMin*60,seed:(seed>>>0)||17,level:Math.max(1,Math.floor(level)),
 phase:"ready",elapsedSec:0,phaseSeconds:0,event:null,events:[],speechSeq:0,success:0,fail:0,xp:0,gold:0,loot:{torch:0,map:0,bandage:0},
 hp:100,distanceM:0,announcements:[],lastAnnouncement:"탐험 준비 완료",battleRank:Math.max(1,Math.floor((level-1)/4)+1),endReason:null};
}
function announce(s,head,detail){const item={id:++s.speechSeq,at:Math.round(s.elapsedSec),head,detail};s.announcements.push(item);if(s.announcements.length>12)s.announcements.shift();s.lastAnnouncement=head+" "+detail;}
export function startAdventure(prev){if(prev.phase!=="ready")throw Error("Already started");const s=structuredClone(prev);s.phase="travel";s.phaseSeconds=45;announce(s,s.mode==="walk"?"산책 탐색 시작":"경계의 숲에 도착했다",s.mode==="walk"?"천천히 걸으며 숲의 흔적을 발견해. 강아지가 멈추면 함께 쉬어도 괜찮아.":"천천히 숲을 탐험하며 호흡을 정리하자.");return s}
/** Outdoor missions have measurable GPS distance and pace goals, never a hidden button choice. */
export function eventGoalDistance(basePace,durationSec){
 return Math.round(clamp(durationSec*1000/(basePace*60),55,125)/10)*10;
}
export function eventPaceAdvice(kind,basePace){
 if(kind==="surge")return "안전한 구간에서 평소보다 조금 빠르게 이동해.";
 if(kind==="quiet")return "평소보다 천천히 움직여. 멈출 필요는 없어.";
 return "현재 편안한 페이스를 유지해.";
}
function beginEncounter(s){
 s.event=pickEncounter(s);
 const e=s.event;
 e.goalDistanceM=s.mode==="walk"?0:eventGoalDistance(s.basePace,e.durationSec);
 e.goalDurationSec=s.mode==="walk"?120+Math.floor(rand(s)*3)*15:0; // 2~2.5m: scent investigation, not distance running.
 e.basePace=s.basePace; // Fix target at encounter start before further GPS pace calibration.
 s.phase="briefing";s.phaseSeconds=7;
 const task=s.mode==="walk"?"목표 "+Math.round(e.goalDurationSec/60*10)/10+"분 주변 탐색. 강아지가 멈춰도 조사는 계속돼.":
  "목표 "+e.goalDistanceM+"미터. "+eventPaceAdvice(e.kind,e.basePace);
 announce(s,e.name+" 발견",(s.mode==="walk"?
   e.modifier+" 기운이 감도는 숲에서 흔적을 발견했어. 급하게 이동할 필요는 없어.":e.line)+
   " "+task+" 임무 시작을 준비해.");
}
function enterChallenge(s){
 s.phase="challenge";s.phaseSeconds=s.mode==="walk"?s.event.goalDurationSec:Math.max(80,s.event.durationSec*2.35);
 announce(s,"임무 시작",s.mode==="walk"?
  "주변 흔적을 "+s.event.goalDurationSec+"초 동안 조사해. 천천히 걸어도, 멈춰 있어도 괜찮아.":
  "이제 이동해! 목표 "+s.event.goalDistanceM+"미터.");
}
function eventFailureReason(e,passed,completed,walk=false){
 if(walk)return passed?"주변 탐색 "+e.goalDurationSec+"초를 완료했어.":"GPS 탐색 시간이 부족했어.";
 if(passed)return "목표 거리와 페이스 조건을 달성했어.";
 if(!completed)return "목표 거리 "+e.goalDistanceM+"미터에 도달하지 못했어.";
 if(e.tooFastSec>e.tooSlowSec*1.3)return "너무 빠른 페이스로 이동한 구간이 많았어.";
 if(e.tooSlowSec>e.tooFastSec*1.3)return "목표보다 느린 구간이 많았어.";
 return "목표 페이스를 유지한 구간이 부족했어.";
}
function resolveEncounter(s){
 const e=s.event,completed=s.mode==="walk"?e.requiredSec>=e.goalDurationSec-.001:e.distanceM>=e.goalDistanceM-.001;
 const ratio=e.requiredSec>0?e.qualitySec/e.requiredSec:0;
 // GPS outcomes are explained by measured performance, not a hidden random roll.
 // Other modes retain their legacy random encounter resolution for compatibility.
 const bonus=STYLES[s.style][e.kind];
 const rating=ratio+bonus+(rand(s)-.5)*.22-(s.battleRank-1)*.025;
 const passed=completed&&(s.mode==="walk"||s.mode==="gps"?ratio>=.60:ratio>=.58&&rating>=.72);
 const earnedXp=passed?14+Math.min(8,s.battleRank*2):5,earnedGold=passed?5+Math.min(8,s.battleRank*2):0;
 s.xp+=earnedXp;s.gold+=earnedGold;
 if(passed){s.success++;s.hp=clamp(s.hp+2,0,100)}else{s.fail++;s.hp=clamp(s.hp-(s.style==="guardian"?6:10),0,100)}
 let item=null;
 if(passed&&rand(s)<.22){item=itemIds[Math.floor(rand(s)*itemIds.length)];s.loot[item]+=1}
 const reason=eventFailureReason(e,passed,completed,s.mode==="walk");
 const result={id:e.id,name:e.name,modifier:e.modifier,kind:e.kind,passed,ratio:Number(ratio.toFixed(2)),
  goalDistanceM:e.goalDistanceM,goalDurationSec:e.goalDurationSec,distanceM:Math.round(e.distanceM),reason,earnedXp,earnedGold,item,elapsedSec:s.elapsedSec};
 s.events.push(result);
 announce(s,passed?"임무 성공":"임무 실패",(passed?e.win:e.lose)+" "+reason+" 경험치 "+earnedXp+", 골드 "+earnedGold+"."+(item?" 전리품 발견.":"")+" 이제 회복 구간이야.");
 s.event=null;s.phase="recovery";s.phaseSeconds=50;
 if(s.hp<=0){s.phase="complete";s.endReason="retreat";announce(s,"안전한 후퇴","게임 기력이 소진되어 원정을 마친다. 실제로 무리하지 않아도 된다.")}
}
function finish(s,reason="complete"){s.phase="complete";s.phaseSeconds=0;s.event=null;s.endReason=reason;announce(s,"원정 종료",Math.round(s.elapsedSec/60)+"분 탐험. 성공 "+s.success+"회, 실패 "+s.fail+"회. 모험 보상을 정산한다.");}
export function endAdventure(prev){const s=structuredClone(prev);if(s.phase==="ready"||s.phase==="complete")return s;finish(s,"stopped");return s;}
/**
 * movementM is a GPS-confirmed metre delta for walk mode only. Never derive
 * walk distance from the clock or a synthetic walking speed.
 */
export function advanceAdventure(prev,dtSec,pace,movementM=0){
 if(prev.phase==="ready"||prev.phase==="complete")return structuredClone(prev);
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>120||!Number.isFinite(pace)||pace<=0||
    (prev.mode==="walk"&&(!Number.isFinite(movementM)||movementM<0)))throw Error("Invalid movement");
 const s=structuredClone(prev);let left=Math.min(dtSec,s.durationSec-s.elapsedSec);
 const confirmedWalkRate=s.mode==="walk"?movementM/dtSec:0;
 while(left>1e-8&&s.phase!=="complete"){
  let n=Math.min(left,s.phaseSeconds,s.durationSec-s.elapsedSec);
  if(s.phase==="briefing"&&!s.event.countdownAnnounced)
   n=Math.min(n,Math.max(0,s.phaseSeconds-3));
  if(s.phase==="challenge"&&s.event&&s.mode!=="walk"){
   const e=s.event,metresPerSec=1000/(pace*60);
   n=Math.min(n,Math.max(0,(e.goalDistanceM-e.distanceM)/metresPerSec));
  }
  if(n<=1e-8){
   if(s.phase==="briefing"&&!s.event.countdownAnnounced){
    s.event.countdownAnnounced=true;
    announce(s,"시작 카운트다운","3, 2, 1. 곧 출발!");
    continue;
   }
   if(s.phase==="challenge"&&s.event){resolveEncounter(s);continue;}
   finish(s);break;
  }
  s.elapsedSec+=n;
  const travelled=s.mode==="walk"?n*confirmedWalkRate:n*1000/(pace*60);
  s.distanceM+=travelled;
  s.phaseSeconds-=n;left-=n;
  if(s.phase==="challenge"){
   const e=s.event;
   e.distanceM+=travelled;e.requiredSec+=n;
   if(s.mode==="walk"){
    // A GPS fix, not walking speed, authorises the elapsed exploratory time.
    e.qualitySec+=n;e.goodDistanceM+=travelled;
    if(travelled<.4){
     e.stationarySec+=n;
     if(e.stationarySec>=25&&!e.stationaryAnnounced){
      e.stationaryAnnounced=true;
      announce(s,"흔적 조사 중","잠시 멈춰 주변을 살펴보는 중이야. 이동을 재촉할 필요는 없어.");
     }
    }else e.stationarySec=0;
    const remaining=Math.max(0,Math.ceil(e.goalDurationSec-e.requiredSec));
    if(e.requiredSec/e.goalDurationSec>=.5&&!e.halfAnnounced){
     e.halfAnnounced=true;announce(s,"조사 중간 보고","절반 완료. 남은 탐색 시간 약 "+remaining+"초. 강아지의 속도에 맞춰도 돼.");
    }
    if(e.requiredSec/e.goalDurationSec>=.82&&!e.nearAnnounced){
     e.nearAnnounced=true;announce(s,"조사 마무리","약 "+remaining+"초 남았어. 주변을 살펴봐.");
    }
    if(remaining<=5&&!e.finalAnnounced){
     e.finalAnnounced=true;announce(s,"조사 종료 카운트다운","5, 4, 3, 2, 1. 조사 완료!");
    }
   }else{
    const qualified=paceQualifies(e.kind,pace,e.basePace);
    if(qualified){e.qualitySec+=n;e.goodDistanceM+=travelled;}
    else{
     const req=paceRequirement(e.kind,e.basePace);
     if(req.upper&&pace<req.upper)e.tooFastSec+=n;
     else if(req.lower&&pace>req.lower)e.tooSlowSec+=n;
     else e.tooSlowSec+=n;
    }
    const ratio=e.distanceM/e.goalDistanceM;
    const paceState=qualified?"페이스 좋아. 그대로 유지해.":
       e.tooSlowSec>=e.tooFastSec?"조금 느려졌어. 편한 범위에서 페이스를 조절해.":
       "조금 빨라졌어. 안전하게 속도를 조절해.";
    if(ratio>=.5&&!e.halfAnnounced){e.halfAnnounced=true;announce(s,"중간 상황","목표의 절반을 지났어. "+paceState);}
    if(ratio>=.77&&!e.nearAnnounced){
     e.nearAnnounced=true;announce(s,"목표 접근","약 "+Math.max(0,Math.round(e.goalDistanceM-e.distanceM))+"미터 남았어. "+paceState);
    }
    if(ratio>=.91&&!e.finalAnnounced){e.finalAnnounced=true;announce(s,"종료 카운트다운","거의 도착했어. 5, 4, 3, 2, 1.");}
   }
  }
  if(s.phase==="briefing"&&!s.event.countdownAnnounced&&s.phaseSeconds<=3+1e-8){
   s.event.countdownAnnounced=true;
   announce(s,"시작 카운트다운","3, 2, 1. 곧 출발!");
  }
  if(s.phase==="challenge"&&((s.mode!=="walk"&&s.event.distanceM>=s.event.goalDistanceM-.001)||s.phaseSeconds<=1e-8)){
   if(!s.event.finalAnnounced){
    s.event.finalAnnounced=true;
    announce(s,"종료 카운트다운",s.mode==="walk"?"3, 2, 1. 주변 탐색을 마쳤어.":"목표 구간 종료. 3, 2, 1.");
   }
   resolveEncounter(s);
  }else if(s.phaseSeconds<=1e-8){
   if(s.phase==="travel")beginEncounter(s);
   else if(s.phase==="briefing")enterChallenge(s);
   else if(s.phase==="recovery"){
    s.phase="travel";s.phaseSeconds=55+Math.floor(rand(s)*5)*10;s.hp=clamp(s.hp+3,0,100);
    announce(s,"다음 탐험 구간","호흡을 정리하며 새로운 흔적을 살펴보자.");
   }
  }
  if(s.elapsedSec>=s.durationSec-1e-8&&s.phase!=="complete")finish(s);
 }
 s.distanceM=Math.round(s.distanceM*10)/10;return s;
}

/** Verified GPS-based session payout. Walk mode values discovery, never requires running. */
export function expeditionReward(session){
 const distance=Math.max(0,Number(session?.distanceM)||0);
 const elapsed=Math.max(1,Number(session?.elapsedSec)||1);
 const xp=Math.max(0,Number(session?.xp)||0),gold=Math.max(0,Number(session?.gold)||0);
 if(session?.mode==="walk")return {
  xp:Math.min(180,Math.round(xp*.72)+Math.min(18,Math.floor(distance/350)*2)),
  gold:Math.min(80,Math.round(gold*.55)),mode:"walk"
 };
 // Moderate or faster real movement earns the higher outdoor-running reward;
 // an extremely slow route does not get the running multiplier automatically.
 const movingEnough=distance/elapsed>=1.25;
 return {
  xp:Math.min(360,Math.round(xp*(movingEnough?1.65:1.0))+Math.min(26,Math.floor(distance/300)*2)),
  gold:Math.min(175,Math.round(gold*(movingEnough?1.5:1.0))+Math.min(18,Math.floor(distance/450)*2)),
  mode:"gps"
 };
}
export function summarizeAdventure(s){return {elapsedSec:Math.round(s.elapsedSec),distanceM:Math.round(s.distanceM),success:s.success,fail:s.fail,xp:s.xp,gold:s.gold,loot:{...s.loot},reason:s.endReason,mode:s.mode};}
export function settleAdventure(shared,session,claimId){
 if(!["gps","walk"].includes(session.mode)||session.phase!=="complete"||!claimId||
   session.elapsedSec<180||session.distanceM<(session.mode==="walk"?3:200))return {state:shared,awarded:false};
 const claimed=Array.isArray(shared.runnerClaims)?shared.runnerClaims:[];
 if(claimed.includes(claimId))return {state:shared,awarded:false};
 const s={...shared,inventory:{...(shared.inventory||{})},runnerClaims:[...claimed,claimId].slice(-40)};
 const reward=expeditionReward(session);
 s.xp=(Number(s.xp)||0)+reward.xp;s.gold=(Number(s.gold)||0)+reward.gold;
 Object.assign(s,applyExperienceCurve(shared,s));
 for(const id of itemIds)s.inventory[id]=(Number(s.inventory[id])||0)+session.loot[id];
 return {state:s,awarded:true,xp:reward.xp,gold:reward.gold};
}
