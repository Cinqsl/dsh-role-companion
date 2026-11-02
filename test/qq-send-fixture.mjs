import {replyEvidence} from './qq-replies-evidence.mjs';
import './network-guard.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {WebSocketServer} from 'ws';import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createRoleHome} from 'dsh-role-companion/home';import {startRole} from 'dsh-role-companion/runtime';import {createQQReceiveAdapter} from 'dsh-role-companion';
import {validQQMessage} from './qq-wire-fixture.mjs';
export const waitSend=async predicate=>{for(let i=0;i<1500;i++){const result=await predicate();if(result)return result;await new Promise(r=>setTimeout(r,10));}throw Error('QQ39 public send boundary did not settle in 15 seconds');};
const waitQQ=waitSend;
export async function sendFixture(t,respond,options={}){
 const root=await mkdtemp(join(tmpdir(),'dsh-send39-')),homePath=join(root,'role'),requests=[],events=[],sockets=[];let modelEntries=0;
 const server=new WebSocketServer({host:'127.0.0.1',port:0});await once(server,'listening');
 server.on('connection',socket=>{sockets.push(socket);socket.on('message',bytes=>{const request=JSON.parse(bytes.toString());requests.push(request);events.push({kind:'wire',action:request.action,echo:request.echo});if(request.action==='send_private_msg'){respond?.(socket,request);return;}const data=request.action==='get_version_info'?{app_name:'SnowLuma',app_version:'2.0.3-node',protocol_version:'v11'}:request.action==='get_login_info'?{user_id:10001}:[{user_id:options.peerId??20002}];socket.send(JSON.stringify({status:'ok',retcode:0,echo:request.echo,data}));});});
 const home=await createRoleHome(homePath,{operationId:'send-create',core:'受控QQ发送',settings:{inputLimitBytes:32768}},options.io);
 await home.applyOwner({kind:'bind-qq',operationId:'send-bind',connectionId:'connection-send',accountId:'10001',peerId:options.peerId??'20002',expectedBindingVersion:0,expectedRevision:home.revision});
 if(options.rules)await home.applyOwner({kind:'edit-delivery-rules',operationId:'send-initial-rules',value:options.rules,expectedDeliveryRulesVersion:1,expectedRevision:home.revision});
 const text=options.text??'单条完整QQ回复🙂',execution={inspect:async()=>({available:true,reason:'controlled'}),prepare:async outputLimit=>({contextWindow:131072,outputLimit}),run:async(plan,scope)=>{const a=await scope.reserveModel({test:'synthetic'});await a.enter();for await(const _ of a.iterate(async function*(){modelEntries++;events.push({kind:'model'});yield ''; })){}await a.settle({kind:'completed',data:{text}});return {kind:'reply',text};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}};
 let role;const adapter=createQQReceiveAdapter({configuration:()=>({enabled:true,connectionId:'connection-send',endpoint:`ws://127.0.0.1:${server.address().port}`,credentialRef:'SYNTHETIC_SEND',maxFrameBytes:1048576,readTimeoutMs:100,reconnectInitialMs:50,reconnectMaxMs:100,jitterRatio:0}),binding:async()=>(await home.readSnapshot()).qqBinding,resolveCredential:async()=> 'synthetic-send',receive:input=>role.runtime.receive(input)});
 role=await startRole(home,{execution,inbound:adapter,delivery:adapter});adapter.start();await waitQQ(()=>adapter.inspect().phase==='ready');
 t.after(async()=>{let timer,stopped=false;try{role.lifetime.requestStop('unload');await Promise.race([role.lifetime.stopped,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('send cleanup not stopped')),4000))]);stopped=true;}finally{clearTimeout(timer);for(const socket of sockets)socket.terminate();await new Promise(r=>server.close(r));if(stopped&&!options.preserve&&!options.preserveHome)await rm(root,{recursive:true,force:true});else t.diagnostic('Synthetic Home retained '+root);}});
 return {root,homePath,home,role,adapter,requests,events,sockets,text,get modelEntries(){return modelEntries;},sendInput:(id=-70)=>sockets.at(-1).send(JSON.stringify(validQQMessage(id)))};
}
