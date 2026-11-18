/**
 * Forest exercise navigation. The same props used by the 3D arena are
 * registered as 2D visibility/collision circles; no WebGL dependencies.
 * Pathfinding only runs when a new route is needed, not on every frame.
 */
export const EXERCISE_NAV_BOUNDS=Object.freeze({minX:-22,maxX:22,minZ:-31,maxZ:7});
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const inside=(p,b)=>p.x>=b.minX&&p.x<=b.maxX&&p.z>=b.minZ&&p.z<=b.maxZ;
function segmentNearCircle(a,b,o,inflate=0){
 const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
 const t=den<1e-9?0:Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.z-a.z)*dz)/den));
 return Math.hypot(a.x+dx*t-o.x,a.z+dz*t-o.z)<o.r+inflate;
}
export function exerciseSightClear(from,to,obstacles){
 if(!from||!to||![from.x,from.z,to.x,to.z].every(finite))return false;
 // Stand clear of vegetation AND avoid shooting/standing with trunks in view.
 return !obstacles.some(o=>segmentNearCircle(from,to,o,.10));
}
export function createExerciseNavigator(obstacles,bounds=EXERCISE_NAV_BOUNDS){
 if(!Array.isArray(obstacles))throw Error("Forest obstacles required");
 const props=obstacles.filter(o=>[o.x,o.z,o.r].every(finite)&&o.r>0);
 const cell=1.05,nx=Math.floor((bounds.maxX-bounds.minX)/cell)+1,
  nz=Math.floor((bounds.maxZ-bounds.minZ)/cell)+1,n=nx*nz;
 const point=id=>({x:bounds.minX+(id%nx)*cell,z:bounds.minZ+Math.floor(id/nx)*cell});
 const valid=(ix,iz)=>ix>=0&&iz>=0&&ix<nx&&iz<nz;
 const index=(ix,iz)=>ix+iz*nx;
 const blocked=new Uint8Array(n);
 for(let i=0;i<n;i++){
  const p=point(i);
  if(props.some(o=>dist(p,o)<o.r+.42))blocked[i]=1;
 }
 function walkClear(a,b){
  if(!inside(b,bounds))return false;
  return !props.some(o=>{
   // A starting point can already be inside a prop after respawn or dodge.
   // Only permit a step that actually exits that same prop.
   const da=dist(a,o),db=dist(b,o);
   return !(da<o.r+.42&&db>da+.06)&&segmentNearCircle(a,b,o,.42);
  });
 }
 function nearestFree(p){
  let best=-1,score=Infinity;
  for(let i=0;i<n;i++){
   if(blocked[i])continue;
   const d=dist(p,point(i));
   if(d<score){score=d;best=i;}
  }
  return best;
 }
 const directions=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],
  [1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]];
 function plan(from,enemy,spacing){
  if(!from||!enemy||![from.x,from.z,enemy.x,enemy.z,spacing].every(finite))return null;
  const first=nearestFree(from);
  if(first<0)return null;
  const cost=new Float64Array(n).fill(Infinity),previous=new Int32Array(n).fill(-1);
  const visited=new Uint8Array(n),heap=[];
  function push(id,value){
   let p=heap.length;heap.push({id,value});
   while(p>0){const parent=(p-1)>>1;if(heap[parent].value<=value)break;
    heap[p]=heap[parent];p=parent;}heap[p]={id,value};
  }
  function pop(){
   const top=heap[0],last=heap.pop();
   if(heap.length){let i=0;while(2*i+1<heap.length){
    let c=2*i+1;if(c+1<heap.length&&heap[c+1].value<heap[c].value)c++;
    if(last.value<=heap[c].value)break;heap[i]=heap[c];i=c;
   }heap[i]=last;}
   return top;
  }
  cost[first]=0;push(first,0);
  let best=-1,bestScore=Infinity,bestVisible=false;
  let fallback=-1,fallbackScore=Infinity;
  while(heap.length){
   const current=pop(),id=current.id;
   if(visited[id])continue;visited[id]=1;
   const p=point(id),d=dist(p,enemy),maxD=Math.max(9.5,spacing+4.5);
   if(d>=spacing-.22&&d<=maxD){
    const score=cost[id]+Math.abs(d-spacing)*2.4;
    if(exerciseSightClear(p,enemy,props)){
     if(score<bestScore){best=id;bestScore=score;bestVisible=true;}
    }else if(score<fallbackScore){fallback=id;fallbackScore=score;}
   }
   const ix=id%nx,iz=Math.floor(id/nx);
   for(const [dx,dz,length] of directions){
    const x=ix+dx,z=iz+dz;if(!valid(x,z))continue;
    const next=index(x,z);if(blocked[next]||visited[next])continue;
    if(dx&&dz&&(blocked[index(ix+dx,iz)]||blocked[index(ix,iz+dz)]))continue;
    const candidate=cost[id]+length*cell;
    if(candidate<cost[next]){cost[next]=candidate;previous[next]=id;push(next,candidate);}
   }
  }
  if(best<0){best=fallback;bestVisible=false;}
  if(best<0)return null;
  const ids=[];let cur=best;
  while(cur>=0){ids.push(cur);if(cur===first)break;cur=previous[cur];}
  ids.reverse();
  const route=ids.map(point);
  const startNear=dist(from,route[0])<.70;
  if(startNear)route.shift();
  if(!route.length)route.push(point(best));
  return {path:route,goal:point(best),visible:bestVisible,target:{x:enemy.x,z:enemy.z}};
 }
 return {plan,walkClear,obstacles:props};
}
