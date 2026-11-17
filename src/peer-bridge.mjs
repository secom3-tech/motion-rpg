/**
 * Transient WebRTC data link between a hosted arena and one S21 controller.
 * Works on GitHub Pages, but requires PeerJS Cloud signaling and internet.
 * Peer-to-peer transmission is best effort (NAT/firewalls may prevent it).
 * No camera frames, GPS or game saves are sent.
 */
const PEER_CDN="https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js";
let libraryPromise=null;
export function loadPeerLibrary(){
 if(typeof window==="undefined")return Promise.reject(Error("Browser only"));
 if(window.peerjs?.Peer||window.Peer)return Promise.resolve(window.peerjs?.Peer||window.Peer);
 if(libraryPromise)return libraryPromise;
 libraryPromise=new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src=PEER_CDN;script.async=true;script.crossOrigin="anonymous";
  script.onload=()=>{const ctor=window.peerjs?.Peer||window.Peer;if(ctor)resolve(ctor);else reject(Error("PeerJS did not export a Peer constructor"));};
  script.onerror=()=>reject(Error("무선 연결 라이브러리를 다운로드하지 못했습니다."));
  document.head.append(script);
 }).catch(e=>{libraryPromise=null;throw e});
 return libraryPromise;
}
/**
 * A short six-digit code for pairing. Internal WebRTC peer ID retains an mrpg-
 * prefix. The room is ephemeral and accepts one controller only.
 * 6 digits are convenient, but not a strong authentication secret.
 */
export function randomRoom(randomBytes=null){
 const bytes=randomBytes||(()=>{const b=new Uint8Array(4);crypto.getRandomValues(b);return b})();
 if(bytes.length<4)throw Error("At least 4 random bytes required");
 const number=((bytes[0]*0x1000000)+(bytes[1]<<16)+(bytes[2]<<8)+bytes[3])>>>0;
 return "mrpg-"+String(number%1000000).padStart(6,"0");
}
export function cleanRoom(input){
 const str=String(input||"").trim().toLowerCase().replace(/\s+/g,"");
 const value=str.startsWith("mrpg-")?str:"mrpg-"+str;
 // Continue accepting older longer peer codes for already open sessions.
 return /^mrpg-(?:[0-9]{6}|[a-hj-km-np-z2-9]{10})$/.test(value)?value:null;
}
export function createWirelessHost({onStatus=()=>{},onMessage=()=>{}}={}){
 let peer=null,conn=null,room="",active=false,lastHeartbeat=0,watch=null,latestPing=0;
 const status=(message,connected=false)=>onStatus({message,connected,room,latencyMs:latestPing});
 const accept=connection=>{
  if(!active){connection.close();return;}
  if(conn&&conn.open){connection.close();return;}
  conn=connection;
  conn.on("open",()=>{
   lastHeartbeat=Date.now();status("S21 연결됨",true);
   conn.send({type:"hello",version:1});
  });
  conn.on("data",data=>{
   if(!active||!conn?.open||!data||typeof data!=="object")return;
   lastHeartbeat=Date.now();
   if(data.type==="pong"&&Number.isFinite(data.at)){latestPing=Math.max(0,Date.now()-data.at);status("S21 연결됨",true);return;}
   if(["gesture","diagnostic","move","look","target","control-stop","weapon-switch","skill","sensor-state"].includes(data.type))onMessage(data);
  });
  conn.on("close",()=>{if(conn===connection)conn=null;status("S21 연결 해제",false)});
  conn.on("error",e=>status("연결 오류: "+(e?.message||"통신 실패"),false));
 };
 async function start(){
  if(active)throw Error("Hosting already started");
  const Peer=await loadPeerLibrary();
  room=randomRoom();active=true;
  try{
   peer=new Peer(room,{debug:0});
   await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error("시그널 서버 응답이 없습니다.")),15000);
    peer.once("open",()=>{clearTimeout(timeout);resolve()});
    peer.once("error",e=>{clearTimeout(timeout);reject(e)});
   });
   peer.on("connection",accept);
   peer.on("disconnected",()=>status("중계 서버 연결이 끊겼습니다.",!!conn?.open));
   peer.on("error",e=>status("무선 오류: "+(e?.message||String(e)),false));
   watch=setInterval(()=>{
    if(!active)return;
    if(conn?.open){
     if(Date.now()-lastHeartbeat>18000){conn.close();status("S21 응답이 없어 연결을 끊었습니다.",false);}
     else conn.send({type:"ping",at:Date.now()});
    }
   },4500);
   status("연결 코드가 준비됐습니다. S21에서 입력하세요.",false);
   return room;
  }catch(e){stop();throw e;}
 }
 function stop(){
  active=false;clearInterval(watch);watch=null;
  try{conn?.close()}catch{}
  try{peer?.destroy()}catch{}
  conn=null;peer=null;room="";lastHeartbeat=0;
  status("연결 대기 중지",false);
 }
 function send(data){if(!active||!conn?.open)return false;try{conn.send(data);return true}catch{return false}}
 return {start,stop,send,get room(){return room},get connected(){return !!conn?.open},get latencyMs(){return latestPing}};
}
export function createWirelessController({onStatus=()=>{},onMessage=()=>{}}={}){
 let peer=null,conn=null,active=false,room="",watch=null,lastSeen=0;
 const status=(message,connected=false)=>onStatus({message,connected,room});
 async function connect(input){
  if(active)throw Error("Already connected or connecting");
  const normalized=cleanRoom(input);
  if(!normalized)throw Error("연결 코드 형식이 올바르지 않습니다.");
  const Peer=await loadPeerLibrary();
  active=true;room=normalized;
  try{
   peer=new Peer({debug:0});
   await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error("중계 서버에 연결할 수 없습니다.")),15000);
    peer.once("open",()=>{clearTimeout(timeout);resolve()});
    peer.once("error",e=>{clearTimeout(timeout);reject(e)});
   });
   conn=peer.connect(room,{reliable:true,serialization:"json"});
   conn.on("data",data=>{
    if(!active||!data||typeof data!=="object")return;
    lastSeen=Date.now();
    if(data.type==="ping"&&Number.isFinite(data.at)){if(conn.open)conn.send({type:"pong",at:data.at});return;}
    onMessage(data);
   });
   conn.on("close",()=>{status("폴드6 연결 종료",false);disconnect()});
   conn.on("error",e=>status("데이터 채널 오류: "+(e?.message||"연결 실패"),false));
   await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error("연결 코드가 잘못됐거나 기기를 찾을 수 없습니다.")),16000);
    conn.once("open",()=>{clearTimeout(timeout);resolve()});
    conn.once("error",e=>{clearTimeout(timeout);reject(e)});
   });
   lastSeen=Date.now();
   watch=setInterval(()=>{if(active&&Date.now()-lastSeen>20000){status("게임 기기의 응답이 없습니다.",false);disconnect();}},5000);
   status("폴드6 게임과 연결됨",true);
   return room;
  }catch(e){disconnect();throw e;}
 }
 function send(data){if(!active||!conn?.open)return false;try{conn.send(data);return true}catch{return false}}
 function disconnect(){
  active=false;clearInterval(watch);watch=null;
  try{conn?.close()}catch{}
  try{peer?.destroy()}catch{}
  conn=null;peer=null;room="";status("연결 해제",false);
 }
 return {connect,send,disconnect,get connected(){return !!conn?.open},get room(){return room}};
}
