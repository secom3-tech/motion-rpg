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
assert.ok(html.includes("data-town=\"guild\"")&&html.includes("data-town=\"smith\"")&&html.includes("data-town=\"ranger\""));
assert.ok(html.includes("townTalk(\"guild\")")&&html.includes("./src/avatar.mjs"));
assert.ok(html.includes("data-outfit=\"hunter\""));
assert.ok(html.includes("모험가 장비실"));

console.log("PREVIEW SMOKE PASS: module syntax, unique IDs, references and main modes");
