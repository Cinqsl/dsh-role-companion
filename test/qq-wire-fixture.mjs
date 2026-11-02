import './network-guard.mjs';
import assert from 'node:assert/strict';
import {WebSocketServer} from 'ws';
import {once} from 'node:events';
import {mkdtemp,rm,access} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
import {createQQReceiveAdapter} from 'dsh-role-companion';
export const waitQQ=async predicate=>{for(let n=0;n<500;n++){const value=await predicate();if(value)return value;await new Promise(resolve=>setTimeout(resolve,5));}throw Error('Controlled QQ boundary did not settle');};
export const validQQMessage=(id=-7)=>({post_type:'message',message_type:'private',sub_type:'friend',self_id:10001,user_id:20002,sender:{user_id:20002},message_id:id,message:[{type:'text',data:{text:'完整合成来信🙂\n'}}]});
export async function qqWireFixture(t,options={}){
 const root=await mkdtemp(join(tmpdir(),'dsh-qq-boundary38-')),homePath=join(root,'role'),events=[],requests=[],sockets=[],headers=[];
 const event=(kind,data={})=>events.push({index:events.length,kind,...data});
 const server=new WebSocketServer({host:'127.0.0.1',port:0});await once(server,'listening');
 server.on('connection',(socket,request)=>{sockets.push(socket);headers.push(request.headers.authorization);const connection=sockets.length;event('actual-connection',{connection,at:Date.now()});socket.on('message',bytes=>{
   const request=JSON.parse(bytes.toString());requests.push({connection,...request});event('actual-readonly-entry',{connection,action:request.action,at:Date.now()});
   assert(['get_version_info','get_login_info','get_friend_list'].includes(request.action));
   if(options.onAction?.({socket,request,connection})===false)return;
   const data=request.action==='get_version_info'?{app_name:'SnowLuma',app_version:'2.0.3-node',protocol_version:'v11'}:request.action==='get_login_info'?{user_id:10001,nickname:'synthetic'}:[{user_id:20002,nickname:'synthetic',remark:''}];
   socket.send(JSON.stringify({status:'ok',retcode:0,data,...options.response?.(request.action,connection),echo:request.echo}));
 });});
 const home=await createRoleHome(homePath,{operationId:'boundary-create',core:'合成QQ边界角色',settings:{inputLimitBytes:32768}},options.io);
 await home.applyOwner({kind:'bind-qq',operationId:'boundary-bind',connectionId:'connection-boundary',accountId:'10001',peerId:'20002',expectedBindingVersion:0,expectedRevision:home.revision});
 let role,secret='synthetic-boundary-first',configuration={enabled:true,connectionId:'connection-boundary',endpoint:`ws://127.0.0.1:${server.address().port}`,credentialRef:'SYNTHETIC_BOUNDARY',maxFrameBytes:1048576,readTimeoutMs:100,reconnectInitialMs:20,reconnectMaxMs:40,jitterRatio:0,...options.configuration};
 const adapter=createQQReceiveAdapter({configuration:()=>configuration,binding:async()=>{const value=(await home.readSnapshot()).qqBinding??null;await options.afterBinding?.(value);return value;},resolveCredential:async()=>secret,receive:async input=>{await options.beforeReceive?.(input);event('actual-runtime-receive',{externalKey:input.externalKey,operationId:input.operationId});return role.runtime.receive(input);},random:options.random});
 role=await startRole(home,{...options.ports,inbound:{seal:()=>{event('inbound-seal');adapter.seal();},drain:async()=>{await adapter.drain();event('inbound-drained');},dispose:async()=>{await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');event('protocol-dispose-after-home-release');await adapter.dispose();}}});
 let stopped=false;t.after(async()=>{
  let deadline,fault;try{role.lifetime.requestStop('unload');await Promise.race([role.lifetime.stopped,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('QQ boundary cleanup blocked; synthetic Home retained at '+root)),5000);})]);stopped=true;}catch(error){fault=error;}finally{clearTimeout(deadline);for(const socket of server.clients)socket.terminate();await new Promise(resolve=>server.close(resolve));}
  if(stopped)await rm(root,{recursive:true,force:true});if(fault)throw fault;
 });
 adapter.start();return {homePath,home,role,adapter,server,sockets,headers,requests,events,event,get configuration(){return configuration;},set configuration(value){configuration=value;},set secret(value){secret=value;},get stopped(){return stopped;}};
}
