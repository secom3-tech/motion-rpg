import assert from "node:assert/strict";
import {createWirelessHost,createWirelessController} from "../src/peer-bridge.mjs";
import {validMotionPacket} from "../src/motion-core.mjs";

class FakeEmitter{
 constructor(){this.events=new Map()}
 on(type,fn){const arr=this.events.get(type)||[];arr.push({fn,once:false});this.events.set(type,arr);return this}
 once(type,fn){const arr=this.events.get(type)||[];arr.push({fn,once:true});this.events.set(type,arr);return this}
 emit(type,...args){const arr=this.events.get(type)||[];this.events.set(type,arr.filter(x=>!x.once));for(const x of arr)x.fn(...args)}
}
class FakeConnection extends FakeEmitter{
 constructor(){super();this.open=false;this.partner=null}
 send(data){
  if(!this.open)throw Error("Closed");
  queueMicrotask(()=>{if(this.partner.open)this.partner.emit("data",data)});
 }
 close(){
  if(!this.open)return;
  this.open=false;this.emit("close");
  const other=this.partner;
  if(other.open){other.open=false;other.emit("close");}
 }
}
class FakePeer extends FakeEmitter{
 static map=new Map();
 static counter=0;
 constructor(id){
  super();
  this.id=typeof id==="string"?id:"fake-"+(++FakePeer.counter);
  if(FakePeer.map.has(this.id))throw Error("Peer ID collision");
  FakePeer.map.set(this.id,this);
  queueMicrotask(()=>this.emit("open",this.id));
 }
 connect(id){
  const receiver=FakePeer.map.get(id);
  const local=new FakeConnection(),remote=new FakeConnection();
  local.partner=remote;remote.partner=local;
  if(!receiver){queueMicrotask(()=>local.emit("error",Error("Peer not found")));return local;}
  queueMicrotask(()=>{
   receiver.emit("connection",remote);
   queueMicrotask(()=>{
    local.open=true;remote.open=true;
    remote.emit("open");local.emit("open");
   });
  });
  return local;
 }
 destroy(){FakePeer.map.delete(this.id)}
}
globalThis.window={peerjs:{Peer:FakePeer}};
const events=[],hostStatus=[],controllerStatus=[],replies=[];
const host=createWirelessHost({onStatus:x=>hostStatus.push(x),onMessage:x=>{
 events.push(x);
 if(x.type==="diagnostic")host.send({type:"diagnostic-ack",time:Date.now()});
}});
const controller=createWirelessController({onStatus:x=>controllerStatus.push(x),onMessage:x=>replies.push(x)});
const room=await host.start();
assert.match(room,/^mrpg-[0-9]{6}$/);
assert.equal(host.connected,false);
assert.equal(await controller.connect(room),room);
assert.equal(host.connected,true);
assert.equal(controller.connected,true);
const sample={type:"gesture",gesture:"melee",strength:80,seq:1,time:Date.now(),session:room};
assert.equal(controller.send(sample),true);
await new Promise(resolve=>setTimeout(resolve,10));
assert.ok(events.some(x=>validMotionPacket(x,room)),"Host receives the real gesture");
controller.send({type:"diagnostic",seq:2,time:Date.now()});
await new Promise(resolve=>setTimeout(resolve,10));
assert.ok(replies.some(x=>x.type==="diagnostic-ack"),"Host responds to diagnostic signal");
host.stop();
await new Promise(resolve=>setTimeout(resolve,10));
assert.equal(controller.connected,false);
assert.equal(host.connected,false);
assert.equal(FakePeer.map.size,0,"No lingering peers after cleanup");
console.log("WIRELESS BRIDGE TEST PASS: room pairing, gesture messages, diagnostics, cleanup");
