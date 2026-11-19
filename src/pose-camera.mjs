/**
 * Fold6 front-camera pose capture. The raw camera and landmarks stay local:
 * only an already-classified dodge event is returned to the game.
 * Uses the MediaPipe pose-lite model and a limited ~8fps cadence.
 */
import {createPoseTracker,poseFraming} from "./pose-core.mjs";
// Browser ESM availability depends on CDN packaging. jsDelivr package root
// is the primary endpoint; alternate vendors/versions are tried on failure.
const MODEL="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
export const VISION_SOURCES=Object.freeze([
 {name:"jsDelivr root 0.10.22",module:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22",wasm:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"},
 {name:"jsDelivr bundle 0.10.22",module:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs",wasm:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"},
 {name:"UNPKG 0.10.22",module:"https://unpkg.com/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs",wasm:"https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm"},
 {name:"jsDelivr root 0.10.14",module:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14",wasm:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"},
 {name:"jsDelivr 1.2.3",module:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/vision_bundle.mjs",wasm:"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm"}
]);
export async function loadPoseModel({importer=(url)=>import(url),report=()=>{}}={}){
 const errors=[];
 for(let i=0;i<VISION_SOURCES.length;i++){
  const source=VISION_SOURCES[i];
  try{
   report("자세 인식 준비 "+(i+1)+"/"+VISION_SOURCES.length+" · "+source.name);
   const module=await importer(source.module);
   const api=module?.FilesetResolver&&module?.PoseLandmarker?module:module?.default;
   if(!api?.FilesetResolver||!api?.PoseLandmarker)throw Error("모듈 내 자세 인식 API가 없음");
   const vision=await api.FilesetResolver.forVisionTasks(source.wasm);
   const model=await api.PoseLandmarker.createFromOptions(vision,{
    baseOptions:{modelAssetPath:MODEL,delegate:"CPU"},
    runningMode:"VIDEO",numPoses:1,
    minPoseDetectionConfidence:.6,
    minPosePresenceConfidence:.6,
    minTrackingConfidence:.55
   });
   report("자세 인식 엔진 준비 완료");
   return {model,source:source.name};
  }catch(error){errors.push(source.name+": "+(error?.message||String(error)));}
 }
 throw Error("모든 자세 인식 모듈 경로가 실패했습니다. Chrome 또는 삼성 인터넷에서 열어 다시 시도하세요. "+errors.map(x=>x.slice(0,100)).join(" | "));
}
export function createPoseCamera({video,onStatus=()=>{},onDodge=()=>{},onFraming=()=>{},cooldownMs=1100}={}){
 if(!video)throw Error("Camera video element missing");
 const pose=createPoseTracker({calibrationFrames:14,stableFrames:2,resetFrames:3,cooldownMs});
 let active=false,stream=null,model=null,timer=null,lastTime=-1,previousLabel="",starting=false;
 const status=(message)=>onStatus({message,running:active,calibrated:pose.calibrated});
 function stop(){
  active=false;starting=false;
  if(timer!==null){clearTimeout(timer);timer=null;}
  if(stream){for(const track of stream.getTracks())track.stop();}
  stream=null;
  video.pause();video.srcObject=null;
  try{model?.close()}catch{}
  model=null;lastTime=-1;previousLabel="";pose.reset();
  status("카메라 종료 · 화면 조작 유지");
 }
 function recalibrate(){pose.beginCalibration();lastTime=-1;previousLabel="";status("정면에서 가만히 서서 자세 기준을 다시 잡아요.");}
 function process(){
  if(!active)return;
  try{
   if(video.readyState>=2&&video.currentTime!==lastTime&&model){
    lastTime=video.currentTime;
    const now=performance.now();
    const result=model.detectForVideo(video,now);
    const landmarks=result.landmarks?.[0]||null;
    const data=pose.feed(landmarks,now);
    const framing=poseFraming(landmarks);
    onFraming({kind:framing.kind,message:framing.text,
     calibrated:data.calibrated,progress:data.progress??(data.calibrated?1:0)});
    if(data.event)onDodge(data.event);
    const label=framing.kind!=="good"?framing.text:data.status==="calibrating"?"기준 자세 측정 "+Math.round(data.progress*100)+"%":
      data.status==="lost"?"몸이 잘 안 보여요 · 카메라 앞에 서 주세요":
      data.movement==="duck"?"앉기 / 몸 낮추기 감지":data.movement==="left"||data.movement==="right"?"옆으로 피하기 감지":"카메라 추적 정상 · 좌우 이동·앉기로 회피";
    if(label!==previousLabel){status(label);previousLabel=label;}
   }
  }catch(e){const message="자세 인식 오류: "+(e?.message||String(e));stop();status(message);return;}
  timer=setTimeout(process,125);
 }
 async function start(){
  if(active||starting)throw Error("Camera already running");
  if(!navigator.mediaDevices?.getUserMedia)throw Error("이 브라우저에서 카메라 사용이 지원되지 않습니다.");
  starting=true;
  try{
   stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:"user",width:{ideal:480},height:{ideal:360},frameRate:{ideal:15,max:24}}});
   video.srcObject=stream;
   await video.play();
   status("자세 인식 모듈을 불러오는 중... (접속 경로 자동 변경 지원)");
   // Keep CPU vision inference independent from the arena WebGL renderer.
   const ready=await loadPoseModel({report:status});
   model=ready.model;
   pose.reset();active=true;starting=false;
   status("정면에서 2초 정도 가만히 서서 기준 자세를 잡아 주세요.");
   process();
  }catch(e){stop();throw e;}
 }
 return {start,stop,recalibrate,get active(){return active},get calibrated(){return pose.calibrated}};
}
