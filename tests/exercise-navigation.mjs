import assert from "node:assert/strict";
import fs from "node:fs";
import {createExerciseNavigator,exerciseSightClear} from "../src/exercise-navigation.mjs";

const tree={x:0,z:-7,r:2};
const player={x:0,z:0},enemy={x:0,z:-15};
assert.equal(exerciseSightClear(player,enemy,[tree]),false,"Tree blocks line of sight");
assert.equal(exerciseSightClear({x:6,z:0},enemy,[tree]),true,"Side view can see enemy");
const empty=createExerciseNavigator([]);
const straight=empty.plan(player,enemy,4.1);
assert.ok(straight&&straight.visible);
assert.ok(Math.abs(Math.hypot(straight.goal.x-enemy.x,straight.goal.z-enemy.z)-4.1)<.8);
const forest=createExerciseNavigator([tree,{x:-7,z:-13,r:1.0},{x:7,z:-13,r:1.1}]);
const around=forest.plan(player,enemy,4.1);
assert.ok(around?.visible,"A visible engagement point should be reachable around trees");
assert.ok(around.path.length>0);
assert.equal(exerciseSightClear(around.goal,enemy,forest.obstacles),true);
let at={...player},nodes=around.path.slice(),idx=0;
for(let step=0;step<350&&idx<nodes.length;step++){
 const goal=nodes[idx];
 if(Math.hypot(goal.x-at.x,goal.z-at.z)<.38){idx++;continue;}
 assert.ok(forest.walkClear(at,goal),"Planned next waypoint should not cut through a trunk");
 const distance=Math.hypot(goal.x-at.x,goal.z-at.z),rate=Math.min(distance,.09);
 at={x:at.x+(goal.x-at.x)/distance*rate,z:at.z+(goal.z-at.z)/distance*rate};
}
assert.ok(Math.hypot(at.x-around.goal.x,at.z-around.goal.z)<.8,"Auto path arrives at visible stand-off");
for(const o of forest.obstacles)assert.ok(Math.hypot(at.x-o.x,at.z-o.z)>=o.r+.25,"Camera stays out of obstacles");
const trapped=createExerciseNavigator([{x:-21,z:-30,r:1},{x:-20,z:-29,r:1}]);
const corner=trapped.plan({x:-22,z:-31},{x:-10,z:-20},4.5);
assert.ok(corner&&corner.path.length>0,"Pathfinder can escape a cluttered boundary");
const arena=fs.readFileSync(new URL("../indoor.html",import.meta.url),"utf8");
for(const marker of [
 'const forestObstacles=[];',
 'const forestNavigator=createExerciseNavigator(forestObstacles);',
 'forestObstacles.push({x,z,r:Math.max(1.10,scale*1.42),type:"tree"})',
 'exerciseSightClear(camera,enemy,forestObstacles)',
 'forestNavigator.plan(camera,enemy,spacing)',
 'if(enemy.windup>0||clock<enemy.impactUntil||meleeAction||rangedAction)return;',
 'exerciseApproachState(exerciseEngaged,dist,spacing)',
 'el("location").querySelector("span").textContent'
])assert.ok(arena.includes(marker),"Forest visibility/navigation integration missing: "+marker);
console.log("EXERCISE NAVIGATION PASS: line of sight, obstacle bypass, clear stance and map edge");
