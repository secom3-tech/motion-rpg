import assert from "node:assert/strict";
import fs from "node:fs";
import {huntPlan} from "../src/hunt-plan.mjs";
const html=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
const art=fs.readFileSync(new URL("../src/item-art.mjs",import.meta.url),"utf8");
for(const n of [0,1,2,3,7,8,15,24,35,36,99]){
 const p=huntPlan({rpgGear:{totalKills:n}});
 assert.ok(p.goal>n&&p.ratio>=0&&p.ratio<=1);
}
assert.equal(huntPlan({rpgGear:{totalKills:0}}).goal,3);
assert.equal(huntPlan({rpgGear:{totalKills:3}}).goal,8);
assert.ok(html.includes('location.assign("./indoor.html?v=1.0&mode=dumbbell&return=preview")'));
for(const marker of ['id="playForest"','id="huntPlanTitle"','id="startNewJourney"','id="restoreJourney"',"BACKUP_KEY","claimPendingBattle()"])assert.ok(html.includes(marker));
assert.ok(art.includes("blacksmith-craft-v1.webp"));
for(const id of ["bare","traveler","sword","none","hood","leather","lantern","axe","staff","orb","circlet","forest","shield","ironHelm","iron","greatsword"])
 assert.ok(art.includes(id+":"),"Missing illustrated craft item "+id);
console.log("PLAY RELEASE PASS");
