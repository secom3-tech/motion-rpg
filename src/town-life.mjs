/**
 * Small village rumour system. One hint at a time; no quest future spoilers
 * are shown in menus. The player discovers details in the actual game.
 * Active rumours rotate daily; additional conversations cycle the local pool.
 */
const common=Object.freeze([
 Object.freeze({who:"술집 주인",line:"해가 낮아질 때는 숲 소리가 달라지지. 그럴 땐 서두르지 않는 게 좋아."}),
 Object.freeze({who:"초보 사냥꾼",line:"수풀에서 작은 발자국을 발견했어. 오늘은 길에서 너무 멀리 벗어나지 않으려고."}),
 Object.freeze({who:"떠돌이 상인",line:"숲에서 얻은 물건도 손질하면 쓸 만한 재료가 된다더군."}),
 Object.freeze({who:"숲길 안내인",line:"같은 길을 걸어도 매번 같은 것을 만나는 건 아니야. 주변 소리를 들어 봐."}),
 Object.freeze({who:"마을 경비병",line:"길목의 나무에 새로운 흠집이 생겼어. 무리하게 쫓아갈 필요는 없겠지."})
]);
const explored=Object.freeze([
 Object.freeze({who:"약초꾼",line:"이따금 보이는 희미한 빛은 눈을 속여. 가까이 갈 땐 발밑도 봐야 해."}),
 Object.freeze({who:"길드 정찰병",line:"길 끝에서 돌아온 사람의 장화에는 서로 다른 색의 흙이 묻어 있었어."}),
 Object.freeze({who:"대장장이",line:"재료가 모였다고 곧장 쓰지 말고, 다음 사냥에 필요한 장비부터 생각해 봐."}),
 Object.freeze({who:"여행자",line:"숲 바깥으로 이어진 길에 관한 얘기는 제각각이야. 확인한 사람은 많지 않지."})
]);
const seasoned=Object.freeze([
 Object.freeze({who:"노련한 사냥꾼",line:"어떤 녀석은 힘으로, 어떤 녀석은 기다림으로 이겨야 해. 발걸음부터 다르더군."}),
 Object.freeze({who:"수리공",line:"멀리 나가는 날이라면 돌아올 길도 기억해 둬. 가방을 비워 두는 것도 방법이야."})
]);
function hashSeed(value){
 let h=2166136261>>>0;
 for(const c of String(value)){h=Math.imul(h^c.charCodeAt(0),16777619)>>>0}
 return h;
}
export function availableVillageRumours(state){
 const pool=[...common];
 const kills=Math.max(0,Number(state?.rpgGear?.totalKills)||0);
 const attempts=Math.max(0,Number(state?.attempts)||0);
 if(kills>=2||attempts>=2)pool.push(...explored);
 if(kills>=12||Number(state?.level)>=3)pool.push(...seasoned);
 return pool;
}
export function villageRumour(state,day="2026-11-17",offset=0){
 const pool=availableVillageRumours(state);
 const seed=hashSeed(String(day)+"-motion-rpg");
 const index=(seed+(Math.max(0,Math.floor(offset)||0)))%pool.length;
 return pool[index];
}
export function villageObjective(state){
 const quests=state?.quests||{};
 const zone=state?.region==="ridge"?"ridge":"forest";
 const q=quests[zone]||{};
 if(q.bossDefeated)return {title:"원정 기록 확인",detail:"길드에 들러 다음 출발 준비를 하자.",progress:1};
 const count=Math.min(6,Math.max(0,Number(q.attempts)||0));
 return {title:"길드 조사",detail:"숲길에서 단서를 모아 의뢰를 이어가자.",progress:count/6};
}
