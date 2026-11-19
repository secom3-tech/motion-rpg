/** Hunt guidance uses settled kills only. Does not alter economy or reveal story. */
const LIMITS=[3,8,15,24];
export function huntPlan(state){
 const kills=Math.max(0,Math.min(99999,Math.floor(Number(state?.rpgGear?.totalKills)||0)));
 const next=LIMITS.find(n=>n>kills);
 const goal=next||24+12*(Math.floor((kills-24)/12)+1);
 const previous=LIMITS.filter(n=>n<=kills).at(-1)||0;
 const start=next?previous:goal-12;
 const stages=[["첫 숲 사냥","몬스터를 처치하고 마을에서 결과를 확인해."],
  ["숲의 길목 조사","숲을 살피며 제작 재료를 확보해."],
  ["숲의 흔적 확인","몬스터의 행동을 익히고 안전하게 복귀해."],
  ["경계의 사냥꾼","사냥 결과로 장비를 제작하고 다음 탐험을 준비해."]];
 const i=LIMITS.indexOf(goal),[title,detail]=i<0?["이어지는 사냥","힘들면 언제든 마을로 돌아가."]:stages[i];
 return {title,detail,progress:kills+" / "+goal+"마리",ratio:Math.max(0,Math.min(1,(kills-start)/(goal-start))),goal,kills};
}
