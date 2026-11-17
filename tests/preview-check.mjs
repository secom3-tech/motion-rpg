import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {spawnSync} from "node:child_process";
const html=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(match,"A module script must exist");
const tmp=path.join(os.tmpdir(),"motion-preview-parse-"+process.pid+".mjs");
try {
 fs.writeFileSync(tmp,match[1]);
 const syntax=spawnSync(process.execPath,["--check",tmp],{encoding:"utf8"});
 assert.equal(syntax.status,0,"Preview JS syntax invalid: "+syntax.stderr);
} finally {
 if(fs.existsSync(tmp))fs.unlinkSync(tmp);
}
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,"HTML IDs must be unique");
const refs=[...match[1].matchAll(/\$\("([^"]+)"\)/g)].map(m=>m[1]);
for(const ref of refs) assert.ok(ids.includes(ref),"Missing element: "+ref);
for(const required of ["page-village","page-run","page-indoor","page-character","runFeed","runTitle"])assert.ok(ids.includes(required));
assert.ok(html.includes("./src/expedition.mjs"));
assert.ok(html.includes("./indoor.html"));
assert.ok(html.includes("./src/village-world.mjs"),"Village must use the playable world module");
assert.ok(html.includes('id="village3d"')&&html.includes('id="townMovePad"')&&html.includes('id="townEncounter"'),"Village stage needs canvas, movement and NPC dialogue");
assert.ok(html.includes("gotoVillageSite(id)")&&html.includes("advanceVillageExplorer(villageState,dt,villageStick)"),"Village must support tap-to-walk and movement");
assert.ok(html.includes('id="townAction"')&&html.includes("./src/avatar.mjs"),"NPC and visual equipment remain connected");
assert.ok(html.includes("data-outfit=\"hunter\""));
assert.ok(html.includes("모험가 장비실"));
for(const id of ["craftBench","craftList","craftMaterials","craftStatus","claimCombat","combatStats"])assert.ok(html.includes('id="'+id+'"'),"Missing crafting UI "+id);
assert.ok(html.includes("claimIndoorBattle")&&html.includes("craftGear")&&html.includes("equipGear"));
assert.ok(html.includes("./src/gear-game.mjs"),"Missing integrated progression module");


console.log("PREVIEW SMOKE PASS: module syntax, unique IDs, references and main modes");
