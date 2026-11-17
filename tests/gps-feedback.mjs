import assert from "node:assert/strict";
import fs from "node:fs";
import {gpsFeedback,GPS_ACCURACY_LIMIT_METERS} from "../src/gps-feedback.mjs";

assert.equal(GPS_ACCURACY_LIMIT_METERS,45);
assert.match(gpsFeedback("waiting").label,/연결 확인/);
assert.match(gpsFeedback("waiting").voice,/GPS 신호/);
assert.match(gpsFeedback("weak",75).label,/±75m/);
assert.match(gpsFeedback("weak").detail,/기록을 잠시 보류/);
assert.match(gpsFeedback("connected",8).label,/±8m/);
assert.match(gpsFeedback("connected").voice,/연결/);
assert.notEqual(gpsFeedback("connected").label,gpsFeedback("recording").label,"Position fix must not imply movement recording");
assert.match(gpsFeedback("recording").voice,/기록이 시작/);
assert.match(gpsFeedback("lost").voice,/끊겼/);
assert.match(gpsFeedback("denied").detail,/권한/);
assert.match(gpsFeedback("unsupported").label,/사용 불가/);
assert.equal(gpsFeedback("ended").voice,"");

const html=fs.readFileSync(new URL("../preview.html",import.meta.url),"utf8");
for(const marker of ['id="gpsStatus"','id="gpsStatusLabel"','id="gpsStatusDetail"',
 'import {gpsFeedback,GPS_ACCURACY_LIMIT_METERS}', 'voice=true',
 'setGpsStatus("waiting");startGeo()','setGpsStatus("connected",p.accuracy,false)',
 'setGpsStatus("recording",p.accuracy)','setGpsStatus("lost")','setGpsStatus("denied"',
 'setGpsStatus("weak",p.accuracy)','gpsGeneration++',
 'startLine.head+". "+startLine.detail','lastGps=now;\n  const measured='])
 assert.ok(html.includes(marker),"GPS UI behavior missing: "+marker);
assert.ok(html.includes('if(dt<2)return;\n  if(d<3)'),'Short location fixes should accumulate, not reset the GPS time anchor');
assert.ok(html.includes('gpsLastGoodAt>18000'),'Loss should be based on the last accurate fix');
assert.ok(html.includes('voice?"on":"off"'),'Voice preference must be under user control');
assert.ok(html.includes('gpsStatus').valueOf());
console.log("GPS VOICE PASS: status meanings, audible startup, loss, permissions, and rapid-fix timer protection");
