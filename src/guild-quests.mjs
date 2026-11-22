/**
 * Village guild quest progression shared by real armband hunts and GPS expeditions.
 * A claim is only evidence after its existing XP/material settlement has succeeded.
 * Prior runs are never replayed; every source session is applied at most once.
 */
import {QUESTS,isBossAvailable} from "./engine.mjs";
import {applyExperienceCurve} from "./progression.mjs";
const TAKE=128;
const integer=n=>Math.max(0,Math.floor(Number(n)||0));
const game=s=>s&&typeof s==="object"&&!Array.isArray(s);
const rawGuild=s=>s?.guildQuest&&typeof s.guildQuest==="object"?s.guildQuest:{};
const ledger=s=>Array.isArray(rawGuild(s).receipts)?rawGuild(s).receipts.filter(x=>typeof x==="string").slice(-TAKE):[];
const accepted=(s,r)=>rawGuild(s).accepted?.[r]===true;
const regionQuest=(s,r)=>s?.quests?.[r]||{attempts:0,successes:0,bossDefeated:false};
const validRegion=r=>Boolean(QUESTS[r]);
export function guildStatus(state,region="forest"){
 const r=validRegion(region)?region:"forest";
 const rules=QUESTS[r],q=regionQuest(state,r),a=accepted(state,r);
 return {region:r,accepted:a,attempts:integer(q.attempts),successes:integer(q.successes),
  goalAttempts:rules.goalAttempts,goalSuccesses:rules.goalSuccesses,
  huntRemainder:integer(rawGuild(state).huntRemainder)%3,
  bossReady:a&&!q.bossDefeated&&isBossAvailable(state,r),bossDefeated:q.bossDefeated===true};
}
export function acceptGuildContract(state,region="forest"){
 if(!game(state)||!validRegion(region))throw Error("Invalid guild region");
 const current=rawGuild(state);
 if(accepted(state,region))return state;
 return {...state,guildQuest:{...current,accepted:{...(current.accepted||{}),[region]:true},
  huntRemainder:integer(current.huntRemainder)%3,receipts:ledger(state)}};
}
function receiptState(state,region,receipt,attempts,successes,remainder){
 const q=regionQuest(state,region),g=rawGuild(state);
 return {...state,
  quests:{...state.quests,[region]:{...q,attempts:integer(q.attempts)+attempts,
   successes:integer(q.successes)+successes}},
  guildQuest:{...g,huntRemainder:remainder,receipts:[...ledger(state),receipt].slice(-TAKE)}};
}
const noResult=(state,reason)=>({state,awarded:false,attempts:0,successes:0,reason});
/** 3 accumulated, actually defeated monsters = one successful investigation. */
export function recordGuildHunt(state,claim,sessionId,region="forest"){
 if(!game(state)||!validRegion(region)||!accepted(state,region))return noResult(state,"길드 의뢰 미수령");
 if(regionQuest(state,region).bossDefeated)return noResult(state,"지역 의뢰 완료");
 const id=typeof sessionId==="string"&&sessionId.length>=8?sessionId:"";
 const receipt="hunt:"+id;
 if(!id||!claim?.awarded||!Number.isInteger(claim.kills)||claim.kills<1||
    !state.rpgGear?.combatClaims?.includes(id))return noResult(state,"정산되지 않은 사냥");
 if(ledger(state).includes(receipt))return noResult(state,"이미 반영한 사냥");
 const kills=Math.min(24,integer(claim.kills)),total=guildStatus(state,region).huntRemainder+kills;
 const attempts=Math.floor(total/3),remainder=total%3;
 return {state:receiptState(state,region,receipt,attempts,attempts,remainder),
  awarded:true,attempts,successes:attempts,huntRemainder:remainder,reason:attempts?("길드 조사 +"+attempts+"회"):"조사 단서 "+remainder+"/3"};
}
/** Each completed GPS challenge is an attempt, with success from its real result. */
export function recordGuildExpedition(state,session,sessionId,region="forest"){
 if(!game(state)||!validRegion(region)||!accepted(state,region))return noResult(state,"길드 의뢰 미수령");
 if(regionQuest(state,region).bossDefeated)return noResult(state,"지역 의뢰 완료");
 const id=typeof sessionId==="string"&&sessionId.length>=8?sessionId:"";
 const receipt="gps:"+id;
 if(!id||!state.rpgGear?.expeditionClaims?.includes(id)||
    !["gps","walk"].includes(session?.mode)||session.phase!=="complete"||
    session.elapsedSec<180||session.distanceM<200||!Array.isArray(session.events))
  return noResult(state,"정산되지 않은 GPS 기록");
 if(ledger(state).includes(receipt))return noResult(state,"이미 반영한 GPS 기록");
 // Only completed in-engine encounters are accepted; don't count a preview.
 const events=session.events.filter(e=>e&&typeof e.id==="string"&&typeof e.passed==="boolean").slice(0,30);
 const attempts=events.length,successes=events.filter(e=>e.passed).length;
 if(!attempts)return noResult(state,"완료한 돌발 임무 없음");
 return {state:receiptState(state,region,receipt,attempts,successes,guildStatus(state,region).huntRemainder),
  awarded:true,attempts,successes,reason:"GPS 조사 +"+attempts+"회 / 성공 +"+successes+"회"};
}
export function guildBossAvailable(state,region="forest"){return guildStatus(state,region).bossReady;}
/** A genuine boss mode kill, in an already claimed battle, unlocks the forge gate. */
export function recordGuildBossVictory(state,result){
 const region="forest",q=regionQuest(state,region),id=result?.sessionId,receipt="boss:"+id;
 if(!game(state)||!guildBossAvailable(state,region)||result?.guildBoss!==region||
    result?.bossVictory!==true||!Number.isInteger(result.kills)||result.kills<1||
    typeof id!=="string"||id.length<8||!state.rpgGear?.combatClaims?.includes(id)||
    ledger(state).includes(receipt))return noResult(state,"보스 도전 기록 확인 필요");
 const next={...state,quests:{...state.quests,[region]:{...q,bossDefeated:true}},
  guildQuest:{...rawGuild(state),receipts:[...ledger(state),receipt].slice(-TAKE)},
  xp:(Number(state.xp)||0)+40,gold:(Number(state.gold)||0)+30};
 Object.assign(next,applyExperienceCurve(state,next));
 return {state:next,awarded:true,attempts:0,successes:0,xp:40,gold:30,reason:"길드 보스 격파 · 추가 경험치 +40 · 골드 +30"};
}
