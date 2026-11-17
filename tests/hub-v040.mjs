import assert from "node:assert/strict";
import fs from "node:fs";
import {GEAR,DEFAULT_LOADOUT} from "../src/avatar.mjs";
import {renderHeroIllustration} from "../src/hero-illustration.mjs";

const html=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
const art=fs.readFileSync(new URL("../assets/village-hub.svg",import.meta.url),"utf8");
assert.ok(art.startsWith("<svg")&&art.includes('viewBox="0 0 1600 900"'),"Static village SVG must be available");
assert.ok(html.includes('./assets/village-hub.svg'),"Hub must reference the static artwork");
assert.ok(!html.includes('id="village3d"'),"No 3D-style canvas required for village");
assert.ok(!html.includes('id="townMovePad"'),"Village should not require walking/joystick");
assert.ok(!html.includes("requestAnimationFrame(drawVillageFrame)"),"No village animation loop");
assert.ok(html.includes('data-town="guild"'),"Guild request screen must be reachable");
assert.ok(html.includes('id="townProgressBar"'),"Guild needs quest progress");
for(const view of ["indoor","run","character"])assert.ok(html.includes('data-go="'+view+'"'));
assert.ok(html.includes("claimIndoorBattle")&&html.includes("settleAdventure"),"Reward settlement preserved");
assert.ok(html.includes('motion-rpg-save-v1'),"Saved game key must remain stable");
assert.ok(html.includes('motion-rpg-preview-equipment-v1'),"Preview gear storage key must remain stable");

const title={textContent:""};
const avatar={dataset:{},querySelector(selector){return selector==="title"?title:null}};
let markup="";
const mount={
 get firstElementChild(){return markup?avatar:null},
 set innerHTML(value){markup=value},
 querySelector(selector){return selector==="svg"?avatar:null}
};
renderHeroIllustration(mount,DEFAULT_LOADOUT);
assert.ok(markup.includes("heroPortrait")&&markup.includes("head-hunterCap"));
assert.deepEqual(avatar.dataset,DEFAULT_LOADOUT);
const initialMarkup=markup;
const armorSets=["hunter","leather","iron","forest","traveler"];
for(const armor of armorSets){
 const gear={head:"ironHelm",armor,weapon:"greatsword",offhand:"shield"};
 renderHeroIllustration(mount,gear);
 assert.equal(avatar.dataset.armor,armor);
 assert.equal(avatar.dataset.weapon,gear.weapon);
 assert.ok(title.textContent.includes(GEAR.armor.find(i=>i.id===armor).name));
 assert.equal(markup,initialMarkup,"Changing gear must reuse static SVG rather than recreate layers");
}
renderHeroIllustration(mount,{head:"hood",armor:"forest",weapon:"staff",offhand:"orb"});
assert.equal(avatar.dataset.head,"hood");
assert.equal(avatar.dataset.offhand,"orb");
assert.ok(markup.includes('svg[data-head="hood"]'));
assert.ok(markup.includes('svg[data-weapon="staff"]'));
console.log("V0.40 HUB PASS: static art, touch targets, preserved save/rewards, illustrated gear switching.");
