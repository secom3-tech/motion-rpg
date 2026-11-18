import assert from "node:assert/strict";
import fs from "node:fs";
import {createGestureDetector} from "../src/motion-core.mjs";
import {monsterMovementProfile} from "../src/monster-ai.mjs";
import {dodgePrompt,DODGE_PROMPT_WINDOW_SEC} from "../src/dodge-cue.mjs";
import {automaticWeaponMode} from "../src/auto-weapon.mjs";
import {weaponProfile} from "../src/player-combat.mjs";

const event=v=>({rotationRate:{alpha:v,beta:0,gamma:0},acceleration:{x:0,y:0,z:0}});
const auto=createGestureDetector({mode:"auto",sensitivity:3});
assert.equal(auto.feed(event(300),1000).gesture?.type,"auto");
assert.equal(auto.status(1000).cooldownDurationMs,700,"Auto melee must regain the pre-auto 700ms cadence");
auto.feed(event(0),1350);auto.feed(event(0),1710);
assert.equal(auto.feed(event(300),1760).gesture?.type,"auto","Auto melee should rearm after rest, not 950ms gate");
auto.protectThrow(1760);
assert.equal(auto.status(1760).cooldownRemainingMs,1900,"Ranged throw anti-duplicate protection remains 1.9s");
assert.equal(auto.feed(event(300),2300).gesture,null,"No spam after real throwing motion");
assert.ok(monsterMovementProfile(6).space<=4.2,"Wisp should approach to near-melee range instead of orbiting at 7m");
assert.equal(automaticWeaponMode({x:0,z:0},{x:0,z:-4.0,dead:false},"ranged",weaponProfile("sword").reach),"melee");
assert.equal(DODGE_PROMPT_WINDOW_SEC,.9);
assert.equal(dodgePrompt("sweep",.7).text,"지금 회피!");
assert.equal(dodgePrompt("slam",.7).text,"지금 회피!");
assert.match(dodgePrompt("slam",.7).hint,/좌우/);
assert.match(dodgePrompt("slam",.7).hint,/숙여/);
assert.equal(dodgePrompt("bolt",.7),null);

const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
const pad=fs.readFileSync(new URL("../controller.html",import.meta.url),"utf8");
const hub=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const marker of [
 'return shouldDodgeMeleeHit({protectedAttack:dodgeProtectedAttack,attackId:enemyAttackSeq,',
 'if(clock<=dodgeUntil&&["button","left","right","duck"].includes(lastDodgeKind))',
 'showDodgeResult("✓ 회피 성공!",1.7)',
 'showDodgeResult("✓ 발사체 회피 성공!",1.7)',
 'dodgeMessageUntil=clock+duration',
 'clock<dodgeMessageUntil?dodgeMessage:',
 'poseFeedbackUntil=performance.now()+1500',
 'function updateQueuedSkill()',
 'queuedSkillUntil=clock+1.2',
 'skill:accepted&&skillRequested&&!queued,queued',
 'updatePlayerActions();updateAutoWeaponMode();updateQueuedSkill();updateEnemy(dt);',
 'clock-lastFire<.48+stats.attackDelay','clock-lastFire<.60+stats.attackDelay',
 'dodgeCooldown=clock+2.2',
 'skillCooldownUntil=clock+24'
])assert.ok(arena.includes(marker),"Arena feedback or stable cooldown missing: "+marker);
for(const marker of [
 'id="moveCharge"','id="moveChargeFill"','id="moveChargeText"',
 'grid-template-columns:minmax(0,1.65fr) minmax(0,.8fr)',
 'moveChargeTimer=setTimeout(()=>',
 'padSkillArmed=true;syncSkillSources()',
 'if(pending.skillHeld){',
 'moveChargeConsumed=true;syncSkillSources()',
 'pending.mode==="auto"?',
 'data.queued?"폴드6 스킬 예약 확인'
])assert.ok(pad.includes(marker),"S21 charged joystick skill missing: "+marker);
assert.ok(hub.includes("indoor.html?v=0.48"),"Hub must open new arena");
console.log("V0.46 PASS: actual dodge success feedback, 1s center-hold skill, wisp melee distance, 700ms auto melee and safe ranged protection");
