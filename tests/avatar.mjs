import assert from "node:assert/strict";
import fs from "node:fs";
import {GEAR,DEFAULT_LOADOUT,SAMPLE_SETS,sanitizeLoadout,describeLoadout,drawAvatar} from "../src/avatar.mjs";
assert.deepEqual(Object.keys(GEAR).sort(),["armor","head","offhand","weapon"]);
for(const [slot,options] of Object.entries(GEAR)){
 assert.ok(options.length>=4,slot+" should offer visual diversity");
 assert.equal(new Set(options.map(x=>x.id)).size,options.length,slot+" item IDs should be unique");
 assert.ok(options.some(x=>x.id===DEFAULT_LOADOUT[slot]),slot+" default exists");
}
assert.deepEqual(sanitizeLoadout(null),DEFAULT_LOADOUT);
assert.equal(sanitizeLoadout({weapon:"not-an-item",armor:"iron"}).weapon,DEFAULT_LOADOUT.weapon);
assert.equal(DEFAULT_LOADOUT.weapon,"bow");
assert.equal(DEFAULT_LOADOUT.armor,"hunter");
assert.equal(DEFAULT_LOADOUT.head,"hunterCap");
assert.equal(DEFAULT_LOADOUT.offhand,"satchel");
assert.ok(describeLoadout(DEFAULT_LOADOUT).includes("사냥꾼"));
assert.ok(SAMPLE_SETS.hunter.weapon==="bow");
assert.equal(sanitizeLoadout({weapon:"not-an-item",armor:"iron"}).armor,"iron");
assert.ok(describeLoadout(SAMPLE_SETS.knight).includes("장검"));
let calls=0,polygons=0,gradients=0;
const ctx={
 save(){calls++;},restore(){calls++;},translate(){calls++;},scale(){calls++;},
 beginPath(){calls++;},closePath(){calls++;},moveTo(){polygons++;},lineTo(){polygons++;},fill(){calls++;},
 stroke(){calls++;},fillRect(){calls++;},ellipse(){calls++;},
 createRadialGradient(){gradients++;return {addColorStop(){}};}
};
for(const set of Object.values(SAMPLE_SETS))drawAvatar(ctx,150,300,1,set);
for(const slot of Object.keys(GEAR)){
 for(const option of GEAR[slot])drawAvatar(ctx,110,250,.75,sanitizeLoadout({...DEFAULT_LOADOUT,[slot]:option.id}));
}
assert.ok(calls>300&&polygons>300&&gradients>0,"Drawing code should create layered model meshes");
drawAvatar(ctx,NaN,200,1,DEFAULT_LOADOUT);
drawAvatar(ctx,0,200,0,DEFAULT_LOADOUT);
const html=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const slot of Object.keys(GEAR))assert.ok(html.includes('id="gear-'+slot+'"'));
assert.ok(!html.includes("renderVillageWorld(ctx,villageState,w,h,{drawHero:drawAvatar,loadout})"),"Static hub must not draw old polygon avatar");
assert.ok(html.includes("renderHeroIllustration"),"Equipment preview should use layered illustration");
assert.ok(html.includes("drawEquipment()"),"Equipment screen should render the shared avatar");
assert.ok(html.includes("motion-rpg-preview-equipment-v1"),"Visual equipment must have independent storage");
assert.ok(!html.includes('localStorage.setItem("motion-rpg-save-v1",JSON.stringify(loadout))'),"Visual preview must not overwrite progression");
console.log("AVATAR SMOKE PASS: 4 equipment slots, legacy renderer and v0.40 layered portrait");
