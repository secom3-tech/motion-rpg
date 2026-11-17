/** Goods bought with earned adventure gold. No real-money transactions. */
export const SHOP_ITEMS=Object.freeze([
 Object.freeze({id:"bandage",name:"응급 붕대",price:8,restore:30,description:"전투 중 기력 30 회복 · 재사용 25초"}),
 Object.freeze({id:"potion",name:"숲의 회복약",price:22,restore:60,description:"전투 중 기력 60 회복 · 재사용 25초"}),
 Object.freeze({id:"torch",name:"튼튼한 횃불",price:10,restore:0,description:"야외 원정에서 사용하는 탐험 용품"}),
 Object.freeze({id:"map",name:"낡은 지도",price:12,restore:0,description:"탐색 도중 유용한 소모품"})
]);
export function shopItem(id){return SHOP_ITEMS.find(i=>i.id===id)||null;}
export function buyShopItem(state,id,count=1){
 const item=shopItem(id);
 if(!item)throw Error("판매하지 않는 물품");
 if(!Number.isSafeInteger(count)||count<1||count>20)throw Error("구매 수량은 1~20개");
 if(!state||typeof state!=="object")throw Error("캐릭터 데이터 오류");
 const money=Number.isSafeInteger(state.gold)&&state.gold>=0?state.gold:0;
 const cost=item.price*count;
 if(money<cost)throw Error("골드 "+(cost-money)+" G 부족");
 const owned=Number.isSafeInteger(state.inventory?.[id])&&state.inventory[id]>=0?state.inventory[id]:0;
 if(owned+count>999)throw Error("가방 최대 보유량 초과");
 return {...state,gold:money-cost,inventory:{...(state.inventory||{}),[id]:owned+count}};
}
