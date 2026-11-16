/**
 * Fold6 front-camera pose capture. The raw camera and landmarks stay local:
 * only an already-classified dodge event is returned to the game.
 * Uses the MediaPipe pose-lite model and a limited ~8fps cadence.
 */
import {createPoseTracker} from "./pose-core.mjs";
const VERSION="0.10.22";
const BUNDLE="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@"+VERSION+"/vision_bundle.mjs";
const WASM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@"+VERSION+"/wasm";
const MODEL="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function createPoseCamera({video,onStatus=()=>{},onDodge=()=>{}}={}){
 if(!video)throw Error("Camera video element missing");
 const pose=createPoseTracker({calibrationFrames:14,stableFrames:2,resetFrames:3,cooldownMs:1100});
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
    const data=pose.feed(result.landmarks?.[0]||null,now);
    if(data.event)onDodge(data.event);
    const label=data.status==="calibrating"?"기준 자세 측정 "+Math.round(data.progress*100)+"%":
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
   status("자세 인식 모델을 다운로드하고 있어요...");
   const {FilesetResolver,PoseLandmarker}=await import(BUNDLE);
   const vision=await FilesetResolver.forVisionTasks(WASM);
   // Keep CPU and arena WebGL independent; GPU can contend with mobile rendering.
   model=await PoseLandmarker.createFromOptions(vision,{
    baseOptions:{modelAssetPath:MODEL,delegate:"CPU"},
    runningMode:"VIDEO",numPoses:1,
    minPoseDetectionConfidence:.6,
    minPosePresenceConfidence:.6,
    minTrackingConfidence:.55
   });
   pose.reset();active=true;starting=false;
   status("정면에서 2초 정도 가만히 서서 기준 자세를 잡아 주세요.");
   process();
  }catch(e){stop();throw e;}
 }
 return {start,stop,recalibrate,get active(){return active},get calibrated(){return pose.calibrated}};
}
