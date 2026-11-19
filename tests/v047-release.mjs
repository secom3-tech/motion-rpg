import assert from "node:assert/strict";
import fs from "node:fs";
import {newGame} from "../src/engine.mjs";
import {poseFraming} from "../src/pose-core.mjs";
import {DODGE_SIDE_STEP_M,dodgeCameraPose,canReserveTimedDodge,shouldDodgeMeleeHit} from "../src/dodge-feedback.mjs";
import {SHOP_ITEMS,shopItem,buyShopItem} from "../src/shop.mjs";
import {RECIPES,normalizeRpgGear} from "../src/gear-game.mjs";
import {itemIllustration} from "../src/item-art.mjs";
import {GEAR} from "../src/avatar.mjs";
const pose=(shoulderSpan=.20,center=.5)=>{
 const p=Array(33).fill(null).map(()=>({x:.5,y:.5,visibility:1}));
 p[11]={x:center-shoulderSpan/2,y:.25,visibility:1};
 p[12]={x:center+shoulderSpan/2,y:.25,visibility:1};
 p[23]={x:center-.06,y:.62,visibility:1};p[24]={x:center+.06,y:.62,visibility:1};return p;
};
assert.equal(poseFraming(pose()).kind,"good");
assert.equal(poseFraming(pose(.08)).kind,"far");
assert.equal(poseFraming(pose(.48)).kind,"near");
assert.equal(poseFraming(pose(.2,.83)).kind,"center");
assert.equal(poseFraming(null).kind,"lost");
assert.ok(DODGE_SIDE_STEP_M>=.95);
assert.ok(dodgeCameraPose("left",.26).roll>0);
assert.ok(dodgeCameraPose("right",.26).roll<0);
assert.ok(dodgeCameraPose("duck",.26).crouch>.35);
assert.equal(dodgeCameraPose("duck",1.2).crouch,0);
assert.ok(canReserveTimedDodge({windup:.3,remaining:.3,promptSeconds:.90,cooldownRemaining:0}));
assert.equal(canReserveTimedDodge({windup:1.3,remaining:1.3,promptSeconds:.90,cooldownRemaining:0}),false);
assert.equal(canReserveTimedDodge({windup:.3,remaining:.3,promptSeconds:.90,cooldownRemaining:.4}),false);
assert.equal(shouldDodgeMeleeHit({protectedAttack:3,attackId:3,withinActiveWindow:false}),true);
assert.equal(shouldDodgeMeleeHit({protectedAttack:2,attackId:3,withinActiveWindow:false}),false);

assert.deepEqual(SHOP_ITEMS.map(i=>i.id),["bandage","potion","torch","map"]);
assert.equal(shopItem("potion").restore,60);
const character={...newGame(),gold:52};
const bought=buyShopItem(character,"bandage",2);
assert.equal(bought.gold,36);
assert.equal(bought.inventory.bandage,2);
assert.equal(character.gold,52,"Market must not mutate original save");
const potion=buyShopItem(bought,"potion");
assert.equal(potion.gold,14);
assert.equal(potion.inventory.potion,1);
assert.throws(()=>buyShopItem(potion,"potion"),/골드/);
assert.throws(()=>buyShopItem(character,"invalid"),/물품/);
assert.throws(()=>buyShopItem(character,"bandage",21),/수량/);
assert.equal(RECIPES.find(x=>x.id==="greatsword").price,1400);
assert.ok(RECIPES.find(x=>x.id==="hood").price>=40);
const total=Object.values(GEAR).flatMap(x=>x).map(x=>x.id);
for(const id of [...new Set([...total,...SHOP_ITEMS.map(x=>x.id)])]){
 const html=itemIllustration(id);
 assert.ok(html.startsWith("<svg"),"Every item needs artwork: "+id);
 assert.ok(!html.includes("undefined"),"Undefined visual data: "+id);
}
const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const hub=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
const pad=fs.readFileSync(new URL("../controller.html",import.meta.url),"utf8");
for(const marker of [
 'DODGE_SIDE_STEP_M',
 'dodgeCameraPose(lastDodgeKind,clock-dodgeVisualStart).crouch',
 'dodgeProtectedAttack=enemyAttackSeq',
 'enemyAttackSeq++;dodgeProtectedAttack=0',
 'const reserved=dodgeProtectedAttack===enemyAttackSeq',
 'poseGuideKind',
 'onFraming:frame=>',
 'id="poseGuide"',
 'font-size:clamp(24px,5.2vw,40px)',
 'function usePotion()',
 'function useBestRecovery()',
 'heroHp<=stats.maxHp*.30',
 'id="autoHealSetting"',
 'autoHealEnabled=false'
])assert.ok(arena.includes(marker),"Arena update missing: "+marker);
for(const marker of ['id="shopDialog"','function renderShop()','buyShopItem(sharedCharacter(),item.id)','id="shopGold"','id="shopList"','function openShop()','import {SHOP_ITEMS,buyShopItem}'])assert.ok(hub.includes(marker),"Shop UI incomplete: "+marker);
assert.ok(hub.includes("indoor.html?v=1.1&mode=dumbbell"),"Hub should link to the latest stable arena build");
assert.ok(pad.includes('data-mode="auto"'));
console.log("V0.47 PASS: camera pose placement, protected dodge, actual view animation, affordable shop, craft price tiers and item artwork");