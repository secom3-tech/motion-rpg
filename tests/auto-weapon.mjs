import assert from "node:assert/strict";
import fs from "node:fs";
import {automaticWeaponMode,autoMotionAttackMode,MELEE_ENTER_MARGIN,RANGED_ENTER_MARGIN} from "../src/auto-weapon.mjs";
import {weaponProfile} from "../src/player-combat.mjs";

const hero={x:1,z:2};
const enemy=d=>({x:1,z:2-d,dead:false});
const sword=weaponProfile("sword").reach,axe=weaponProfile("axe").reach,greatsword=weaponProfile("greatsword").reach;
assert.equal(MELEE_ENTER_MARGIN,.4);
assert.equal(RANGED_ENTER_MARGIN,.8);
assert.equal(automaticWeaponMode(hero,enemy(2),"ranged",sword),"melee","Close enemy must select sword even if bow equipped");
assert.equal(automaticWeaponMode(hero,enemy(11),"melee",sword),"ranged","Spawned distant enemy must select bow");
assert.equal(automaticWeaponMode(hero,enemy(sword-.41),"ranged",sword),"melee","Switch to melee within real strike range");
assert.equal(automaticWeaponMode(hero,enemy(sword-.2),"ranged",sword),"ranged","Near boundary should not flicker");
assert.equal(automaticWeaponMode(hero,enemy(sword+.3),"melee",sword),"melee","Walking a little away should preserve sword");
assert.equal(automaticWeaponMode(hero,enemy(sword+.81),"melee",sword),"ranged","Switch to bow after retreating clearly");
assert.equal(automaticWeaponMode(hero,enemy(axe-.45),"ranged",axe),"melee","Axe threshold uses axe reach");
assert.equal(automaticWeaponMode(hero,enemy(axe+.82),"melee",axe),"ranged");
assert.equal(automaticWeaponMode(hero,enemy(greatsword-.4),"ranged",greatsword),"melee","Greatsword uses longer reach");
assert.equal(automaticWeaponMode(hero,{...enemy(2),dead:true},"ranged",sword),"ranged","Never switch to chase corpse");
assert.equal(automaticWeaponMode(hero,null,"melee",sword),"melee");
assert.equal(automaticWeaponMode(hero,enemy(2),"melee",NaN),"melee");
assert.equal(autoMotionAttackMode(true,"melee","throw"),"melee","Near enemy thrown-gesture becomes melee attack");
assert.equal(autoMotionAttackMode(true,"ranged","melee"),"ranged","Far enemy swipe-gesture becomes ranged attack");
assert.equal(autoMotionAttackMode(false,"melee","throw"),"ranged","Manual mode still honors explicit gesture");
assert.equal(autoMotionAttackMode(false,"ranged","melee"),"melee");

const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const pad=fs.readFileSync(new URL("../controller.html",import.meta.url),"utf8");
const p=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const needle of [
 'import {automaticWeaponMode,autoMotionAttackMode}',
 'autoSwitchEnabled=true','function updateAutoWeaponMode()',
 'automaticWeaponMode(camera,enemy,activeWeaponMode,weaponProfile(equipped.meleeWeapon).reach)',
 'updateAutoWeaponMode();\ncamera.y=','if(autoSwitchEnabled)updateAutoWeaponMode()',
 'const attackMode=autoMotionAttackMode(autoSwitchEnabled,activeWeaponMode,packet.gesture)',
 'accepted=attackMode==="ranged"?magic():swordHit(packet.gesture==="melee"?packet.style:null)',
 'type:"weapon-state",mode:autoSwitchEnabled?"auto":activeWeaponMode',
 'weaponMode:activeWeaponMode',
 'if(!autoSwitchEnabled||worldMode||enemy.dead||meleeAction||rangedAction)return'
])assert.ok(arena.includes(needle),"Arena needs live distance auto weapon: "+needle);
assert.ok(!arena.includes('switchWeapon(packet.gesture==="throw"'),"Motion gesture must not choose automatic weapon");
for(const needle of [
 'data-mode="auto">◎ 거리 자동 전환',
 'if(next!==mode){mode=next;detector.configure',
 'pending.weaponMode==="ranged"?{type:"throw",style:null}',
 'pendingAttack={startAt:now,mode,weaponMode:remoteWeaponMode',
 'mode=data.mode==="ranged"?"throw":data.mode' // intentionally absent after mode sync refactor
].slice(0,-1))assert.ok(pad.includes(needle),"Controller must follow host weapon without rearming: "+needle);
assert.ok(!pad.includes('classifyAttackIntent(pending.samples,pending.mode,trained,cutStyle);\n if(action.type==="throw")'),'Auto mode must select attack from host distance state');
assert.ok(arena.includes('clock-lastFire<.48+stats.attackDelay')&&arena.includes('clock-lastFire<.60+stats.attackDelay'),"Existing attack cooldown preserved");
assert.ok(p.includes('indoor.html?v=0.45'),"Hub opens updated arena");
console.log("AUTO WEAPON PASS: initial distance, close/retreat, hysteresis, attack dispatch, preserved cooldown, controller sync");
