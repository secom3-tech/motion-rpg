import assert from "node:assert/strict";
import fs from "node:fs";
import {spawnSync} from "node:child_process";
import os from "node:os";
import path from "node:path";
const get=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const arena=get("indoor.html");
const companion=get("android-watch-bridge/mobile/src/main/java/com/motionrpg/watchbridge/mobile/GameActivity.java");
const wearable=get("android-watch-bridge/wear/src/main/java/com/motionrpg/watchbridge/wear/WatchActivity.java");
const detector=get("android-watch-bridge/wear/src/main/java/com/motionrpg/watchbridge/wear/CurlCounter.java");
for(const marker of ['watchInputMode','window.motionRpgWatchInput=','window.motionRpgWatchStatus=','function renderWatchHud()','gameMode===\'dumbbell\'','input\')===\'watch\''])assert.ok(arena.includes(marker),"Watch game bridge missing: "+marker);
for(const marker of ['Wearable.getMessageClient(this).addListener','event.getPath()','window.motionRpgWatchInput','window.motionRpgWatchStatus','android.webkit.WebView','new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE}'])assert.ok(companion.includes(marker),"Mobile receiver missing: "+marker);
for(const marker of ['Sensor.TYPE_GRAVITY','Sensor.TYPE_ACCELEROMETER','new CurlCounter()','averageStable()','Wearable.getNodeClient(this).getConnectedNodes()','Wearable.getMessageClient(this).sendMessage'])assert.ok(wearable.includes(marker),"Watch sender missing: "+marker);
assert.ok(detector.includes("phase == -1"),"Must return to a down posture before counting");
for(const p of ['mobile/build.gradle','wear/build.gradle']){
 const content=get("android-watch-bridge/"+p);
 assert.ok(content.includes("applicationId 'com.motionrpg.watchbridge'"),"Wear Data Layer app IDs must match");
}
assert.ok(get("watch-setup.html").includes("watch4-fold6-debug-apks"));
const moduleScript=arena.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(moduleScript);
const file=path.join(os.tmpdir(),"watch-game-"+process.pid+".mjs");
try{fs.writeFileSync(file,moduleScript[1]);let check=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});assert.equal(check.status,0,check.stderr);}
finally{if(fs.existsSync(file))fs.unlinkSync(file);}
console.log("WATCH BRIDGE PASS: WebView relay, Wear OS Data Layer, paired package ID, game sensor route");
