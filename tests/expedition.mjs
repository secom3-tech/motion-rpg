import assert from "node:assert/strict";
import {
 SCENARIOS,MODIFIERS,STYLES,createAdventure,startAdventure,advanceAdventure,endAdventure,
 paceQualifies,paceRequirement,summarizeAdventure,settleAdventure
} from "../src/expedition.mjs";
import {newGame} from "../src/engine.mjs";

assert.equal(SCENARIOS.length,18,"Enough authored adventures for varied runs");
assert.equal(new Set(SCENARIOS.map(x=>x.id)).size,SCENARIOS.length);
assert.ok(SCENARIOS.every(x=>["quiet","surge","steady"].includes(x.kind)));
assert.ok(MODIFIERS.length>=5);
assert.ok(Object.keys(STYLES).length>=3);
assert.throws(()=>createAdventure({basePace:0}),/Invalid/);
assert.throws(()=>createAdventure({mode:"cheat"}),/Invalid/);
assert.throws(()=>createAdventure({durationMin:1}),/Invalid/);
assert.equal(paceQualifies("surge",8,8.5),true);
assert.equal(paceQualifies("surge",10,8.5),false);
assert.equal(paceQualifies("quiet",10,8.5),true);
assert.equal(paceQualifies("quiet",8,8.5),false);
assert.equal(paceQualifies("steady",8.5,8.5),true);
assert.equal(paceRequirement("surge",8.5).upper<8.5,true);

let demo=createAdventure({mode:"demo",durationMin:12});
demo=startAdventure(demo);
assert.throws(()=>startAdventure(demo),/Already/);
let firstEncounter=null;
for(let step=0;step<72;step++){
 demo=advanceAdventure(demo,10,8.5);
 if(demo.event&&!firstEncounter)firstEncounter=demo.event.id;
}
assert.ok(firstEncounter);
assert.equal(demo.phase,"complete");
assert.equal(demo.elapsedSec,720);
assert.ok(demo.events.length>=2);
assert.ok(demo.distanceM>0);
assert.equal(settleAdventure(newGame(),demo,"demo-1").awarded,false);
assert.deepEqual(advanceAdventure(demo,10,8.5),demo);
assert.equal(endAdventure(demo).phase,"complete");
assert.throws(()=>advanceAdventure(startAdventure(createAdventure()),200,8.5),/Invalid/);

let totalSuccess=0,totalEvents=0,totalXp=0,totalGold=0;
let checksum="";
for(let seed=1;seed<=1000;seed++){
 let game=startAdventure(createAdventure({mode:"gps",seed,durationMin:20,basePace:8.5,style:["scout","vanguard","guardian"][seed%3]}));
 let x=seed;
 for(let i=0;i<120;i++){
  x=(1664525*x+1013904223)>>>0;
  const sample=[5.8,7.4,8.5,9.8,12.5][x%5];
  const prev=game;
  game=advanceAdventure(game,10,sample);
  assert.ok(game.hp>=0&&game.hp<=100);
  assert.ok(game.distanceM>=prev.distanceM);
  assert.ok(game.gold>=prev.gold&&game.xp>=prev.xp);
  assert.ok(game.events.length>=prev.events.length);
  if(game.phase==="complete")break;
 }
 const result=summarizeAdventure(game);
 assert.equal(result.elapsedSec,1200);
 assert.ok(result.distanceM>1000);
 assert.ok(game.events.every((e,i)=>i===0||game.events.slice(Math.max(0,i-4),i).every(prev=>prev.id!==e.id)),"Recent event must not repeat");
 totalSuccess+=result.success;totalEvents+=result.success+result.fail;
 totalXp+=result.xp;totalGold+=result.gold;checksum+=result.success%10;
}
const successRate=totalSuccess/totalEvents;
assert.ok(totalEvents>3000);
assert.ok(successRate>0.03&&successRate<0.99,"Varied trials should include wins and losses");
assert.ok(totalXp>0&&totalGold>0);

let real=startAdventure(createAdventure({mode:"gps",durationMin:12,seed:97}));
for(let i=0;i<72;i++)real=advanceAdventure(real,10,8.5);
let shared=newGame();
const award=settleAdventure(shared,real,"session-123");
assert.equal(award.awarded,true);
assert.equal(award.state.xp,real.xp);
const repeat=settleAdventure(award.state,real,"session-123");
assert.equal(repeat.awarded,false);
assert.equal(repeat.state.xp,real.xp);
assert.equal(settleAdventure(newGame(),{...real,distanceM:0},"gps-less").awarded,false);
assert.equal(settleAdventure(newGame(),{...real,elapsedSec:90},"short").awarded,false);
assert.equal(settleAdventure(newGame(),{...real,mode:"demo"},"fake").awarded,false);

console.log("AUDIO RUNNER TEST PASS | 1,000 twenty-minute randomized adventures");
console.log("Events:",totalEvents,"Success rate:",(successRate*100).toFixed(1)+"%","Mean XP:",(totalXp/1000).toFixed(1),"Mean G:",(totalGold/1000).toFixed(1));
console.log("Deterministic rules / GPS reward claim / demo no-reward / content diversity smoke checks OK.");
