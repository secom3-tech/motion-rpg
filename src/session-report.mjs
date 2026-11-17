/**
 * Shared end-of-session summaries. Game points and real movement measures
 * deliberately remain separate; calories and heart rate are never invented.
 */
const nonNeg=v=>Math.max(0,Number.isFinite(Number(v))?Number(v):0);
export function formatClock(seconds){
 const s=Math.round(nonNeg(seconds));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
}
export function formatPace(distanceM,seconds){
 if(!distanceM||!seconds)return "측정 중";
 const secPerKm=seconds*1000/distanceM;
 if(!Number.isFinite(secPerKm))return "측정 중";
 return Math.floor(secPerKm/60)+"′"+String(Math.round(secPerKm%60)).padStart(2,"0")+"″/km";
}
export function summarizeHuntResult(result={},payout=null){
 const kills=Math.floor(nonNeg(result.kills)),score=Math.floor(nonNeg(result.score));
 const elapsed=nonNeg(result.elapsedSec);
 const materials=payout?.materials||{};
 const materialNames={wood:"목재",fang:"수렵 전리품",essence:"정령 조각",ore:"광석"};
 const materialText=Object.entries(materials).filter(([,n])=>n>0).map(([k,n])=>materialNames[k]+" +"+n);
 return {
  kind:"hunt",
  label:"FOREST HUNT / 사냥 기록",
  title:"사냥을 마치고 마을로 돌아갑니다",
  description:"이번 사냥의 전투 기록과 획득 보상이야. 보상은 자동 지급돼.",
  metrics:[{value:String(kills),label:"처치한 몬스터"},{value:formatClock(elapsed),label:"전투 플레이 시간"},{value:String(score),label:"전투 점수 (평가용)"}],
  rewards:payout?.awarded?
   "자동 지급 · 경험치 +"+payout.xp+" · 골드 +"+payout.gold+
   " · 붕대 +"+(payout.bandages||0)+(materialText.length?" · "+materialText.join(" / "):""):
   (kills>0?"이번 사냥 보상은 이미 정산되었거나 재수령할 수 없어.":"처치 기록이 없어 보상 지급 없음"),
  activity:"훈련 기록 · S21 모션 공격 "+Math.floor(nonNeg(result.motionActions))+"회, 회피 입력 "+Math.floor(nonNeg(result.dodges))+
   "회, 실제 회피 성공 "+Math.floor(nonNeg(result.dodgeSuccess))+
   "회. 시간과 모션 횟수는 게임 기록이며 칼로리 측정값이 아니야.",
  entries:(Array.isArray(result.log)?result.log:[]).slice(-8).map(x=>formatClock(x.at)+" · "+String(x.name||"몬스터")+" 처치")
 };
}
export function summarizeExpeditionResult(session={},reward={}){
 const walk=session.mode==="walk",run=session.mode==="gps",treadmill=session.mode==="treadmill";
 const timed=nonNeg(session.elapsedSec),distance=nonNeg(session.distanceM);
 const claimed=Boolean(reward.awarded);
 const xp=nonNeg(reward.xp),gold=nonNeg(reward.gold);
 const loot=session.loot||{},materials=reward.materials||{};
 const mat={wood:"목재",fang:"수렵 전리품",essence:"정령 조각",ore:"광석"};
 const item={torch:"횃불",map:"지도 조각",bandage:"붕대"};
 const itemRewards=[...Object.entries(loot).filter(([,n])=>n>0).map(([k,n])=>(item[k]||k)+" +"+n),
  ...Object.entries(materials).filter(([,n])=>n>0).map(([k,n])=>(mat[k]||k)+" +"+n)];
 return {
  kind:"expedition",
  label:walk?"WALK / 산책 탐색 기록":run?"OUTDOOR / 달리기 원정 기록":"INDOOR / 러닝머신 기록",
  title:walk?"산책 탐색 완료":run?"달리기 원정 완료":"러닝머신 원정 완료",
  description:"움직인 기록과 게임 속 탐험 결과를 확인해.",
  metrics:[{value:formatClock(timed),label:"유효 이동 시간"},{value:Math.round(distance)+" m",label:treadmill?"입력 속도 기반 거리":"GPS 이동 거리"},{value:String(nonNeg(session.success))+" / "+String(nonNeg(session.fail)),label:"임무 성공 / 실패"}],
  rewards:claimed?"자동 지급 · 경험치 +"+xp+" · 골드 +"+gold+(itemRewards.length?" · "+itemRewards.join(" / "):""):
   treadmill?"연습 기록 · 속도 수동 입력으로 정식 보상 제외":"보상 조건 미충족 · GPS 유효 이동 3분·200m 이상 필요",
  activity:treadmill?"속도 수동 입력으로 계산한 거리·시간이야. 실제 운동 효과나 칼로리를 측정한 것은 아니야.":
   "GPS 유효 이동 기록 · 평균 페이스 "+formatPace(distance,timed)+
   ". 움직임 기록을 기반으로 했으며 심박수·칼로리 소모량은 측정하지 않았어.",
  entries:(Array.isArray(session.events)?session.events:[]).slice(-8).map(x=>formatClock(x.elapsedSec)+" · "+x.name+" · "+(x.passed?"성공":"실패"))
 };
}
