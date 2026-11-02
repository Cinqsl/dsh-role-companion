import './network-guard.mjs';
import assert from 'node:assert/strict';import {WebSocketServer} from 'ws';import {once} from 'node:events';import {join} from 'node:path';import {writeFile,readFile,access} from 'node:fs/promises';import {writeFileSync} from 'node:fs';
import {bootNativeFixture,response,waitFor} from './native-fixture.mjs';
const run=process.env.DSH_TEST_RUN,phase=process.argv[2],first=phase==='first',homePath=join(run,'role'),events=[],requests=[],sockets=[],full='原生再发完整回复🙂'.repeat(240);
const fixture=await bootNativeFixture(run,entry=>{events.push({kind:'actual-native-model',ordinal:entry.ordinal});return response(full);},{globalCompaction:false,reuse:!first});
const {ctx,module,entries,metadataEntries,shutdown}=fixture,{Peer}=await module('@deepseek-ai/dsh-client-connection'),{credentialRef}=await module('@deepseek-ai/dsh-credentials');
const owner=new Peer(ctx,{principal:{kind:'owner'}}),invoke=(method,args)=>ctx.typertGateway.invoke({peer:owner,namespace:'roleCompanion',method,args});
let roleId,secondSend,failure,hostStopped=false;const result={caseId:'40-native-'+phase,status:'running',events,requests,models:entries,metadata:metadataEntries,realBusiness:{model:0,web:0,qq:0}};
const server=new WebSocketServer({host:'127.0.0.1',port:0});await once(server,'listening');
server.on('connection',socket=>{sockets.push(socket);socket.on('message',bytes=>{try{const request=JSON.parse(bytes.toString());requests.push(request);events.push({kind:'actual-wire',action:request.action,echo:request.echo,socketOrdinal:sockets.indexOf(socket)+1});if(request.action==='send_private_msg'){const count=requests.filter(r=>r.action==='send_private_msg').length;if(count===1)socket.send(JSON.stringify({status:'failed',retcode:100,data:{},echo:request.echo}));else secondSend={socket,request};return;}const data=request.action==='get_version_info'?{app_name:'SnowLuma',app_version:'2.0.3-node',protocol_version:'v11'}:request.action==='get_login_info'?{user_id:10001}:[{user_id:20002}];socket.send(JSON.stringify({status:'ok',retcode:0,data,echo:request.echo}));}catch(e){failure=e;}});});
const config={enabled:true,endpoint:`ws://127.0.0.1:${server.address().port}`,credentialRef:'QQ_RESOLUTION_SYNTHETIC',maxFrameBytes:1048576,readTimeoutMs:300,reconnectInitialMs:20,reconnectMaxMs:40,jitterRatio:0};
const scope=()=>({expectedRoleId:roleId,expectedQQBindingVersion:1}),read=()=>invoke('readQQDeliveries',scope()),detail=id=>invoke('readQQDelivery',{...scope(),request:{deliveryId:id,offset:0,limit:65536}});
try{
 if(first){
  const created=await invoke('createHome',{path:homePath,request:{operationId:'resolution-native-create',core:'合成同一原生角色，不接触真实服务',settings:{inputLimitBytes:32768}},expectedProfileVersion:0});roleId=created.roleId;await ctx.credentials.set(credentialRef(config.credentialRef),'synthetic-onebot-only');
  await invoke('editQQConnection',{expectedRoleId:roleId,expectedQQBindingVersion:0,request:{operationId:'resolution-native-config',expectedProfileVersion:0,value:config}});
  await invoke('bindQQ',{expectedRoleId:roleId,expectedQQBindingVersion:0,request:{operationId:'resolution-native-bind',accountId:'10001',peerId:'20002',expectedRevision:(await invoke('inspect',{})).role.revision,replaceConfirmed:false}});
  await waitFor(async()=>(await invoke('readQQ',scope())).transport.phase==='ready');
  sockets.at(-1).send(JSON.stringify({post_type:'message',message_type:'private',sub_type:'friend',self_id:10001,user_id:20002,sender:{user_id:20002},message_id:-140,message:[{type:'text',data:{text:'请保留完整原生回复并明确核对发送'}}]}));
  const unknown=await waitFor(async()=>{const s=await read();return s.deliveries[0]?.status==='unknown'&&s;}),original=await detail(unknown.deliveries[0].deliveryId),attempt=JSON.parse(original.attemptJSON);result.original=original;
  assert.equal(entries.length,1);assert.equal(requests.filter(r=>r.action==='send_private_msg').length,1);
  await invoke('editQQDeliveryRules',{...scope(),request:{operationId:'resolution-native-rules',expectedRevision:unknown.revision,expectedDeliveryRulesVersion:1,value:{previewCodePoints:200,sendTimeoutMs:1500}}});
  await invoke('recheckQQ',scope());await waitFor(async()=>(await invoke('readQQ',scope())).transport.phase==='ready');assert.equal(requests.filter(r=>r.action==='send_private_msg').length,1);
  const latest=await read(),request={operationId:'resolution-native-resend',deliveryId:original.delivery.deliveryId,sendAttemptId:attempt.sendAttemptId,decision:'resend',note:'核对原非零响应，明确承认可能重复后再发',duplicateRiskAcknowledged:true,expectedRevision:latest.revision,expectedDeliveryRulesVersion:latest.rules.version};
  result.command=request;result.receipt=await invoke('resolveQQDelivery',{...scope(),request});await waitFor(()=>secondSend);
  const sending=await read();assert.equal(sending.deliveries[1].status,'sending');assert.equal(sending.deliveries[1].retryOf,original.delivery.deliveryId);assert.equal(Array.from(secondSend.request.params.message[0].data.text).length,200);
  // A late success for the old echo arrives on the new WS generation while the new attempt is pending.
  const beforeFrames=(await invoke('readQQ',scope())).transport.counts.frames;
  secondSend.socket.send(JSON.stringify({status:'ok',retcode:0,data:{message_id:-999},echo:attempt.observation.evidence.echo}));
  await waitFor(async()=>(await invoke('readQQ',scope())).transport.counts.frames>beforeFrames);
  result.afterOldEcho=await read();assert.equal(result.afterOldEcho.deliveries[1].status,'sending');assert.deepEqual((await detail(original.delivery.deliveryId)).delivery,original.delivery);
  secondSend.socket.send(JSON.stringify({status:'ok',retcode:0,data:{message_id:-940},echo:secondSend.request.echo}));
  const confirmed=await waitFor(async()=>{const s=await read();return s.deliveries[1]?.status==='confirmed'&&s;});result.confirmed=confirmed;
  const newDetail=await detail(confirmed.deliveries[1].deliveryId);assert.equal(JSON.parse(newDetail.attemptJSON).observation.messageId,'-940');assert.notEqual(JSON.parse(newDetail.attemptJSON).observation.evidence.generation,attempt.observation.evidence.generation);assert.equal(newDetail.resolutions[0].operationId,request.operationId);result.newDetail=newDetail;
  assert.deepEqual((await detail(original.delivery.deliveryId)).delivery,original.delivery);assert.equal((await detail(original.delivery.deliveryId)).attemptJSON,original.attemptJSON);
  assert.equal((await invoke('resolveQQDelivery',{...scope(),request})).committedRevision,result.receipt.committedRevision);assert.equal((await invoke('readOperation',{expectedRoleId:roleId,operationId:request.operationId})).committedRevision,result.receipt.committedRevision);
  result.conversation=await invoke('readConversation',{expectedRoleId:roleId,expectedBindingVersion:1});assert.equal(result.conversation.totalAttempts,1);assert.equal(result.conversation.totalReplies,1);result.modelRecord=await invoke('readQQExecutionRecord',{...scope(),request:{kind:'attempt',recordId:result.conversation.attempts[0].attemptId,offset:0,limit:65536}});assert.equal(JSON.parse(result.modelRecord.json).outcome.kind,'completed');
  result.fullReply=await invoke('readQQReply',{...scope(),request:{replyId:confirmed.deliveries[0].replyId,offset:0,limit:65536}});assert.equal(result.fullReply.text,full);assert.equal(entries.length,1);assert.equal(requests.filter(r=>r.action==='send_private_msg').length,2);
  await writeFile(join(run,'resolution-marker.json'),JSON.stringify({roleId,original,newDetail,confirmed,request,receipt:result.receipt,fullReply:result.fullReply},null,2)+'\n');
 }else{
  const marker=JSON.parse(await readFile(join(run,'resolution-marker.json'),'utf8'));roleId=marker.roleId;
  result.saved=await read();assert.deepEqual(result.saved.deliveries,marker.confirmed.deliveries);assert.equal((await detail(marker.original.delivery.deliveryId)).attemptJSON,marker.original.attemptJSON);assert.deepEqual((await detail(marker.newDetail.delivery.deliveryId)).resolutions,marker.newDetail.resolutions);assert.equal((await invoke('readOperation',{expectedRoleId:roleId,operationId:marker.request.operationId})).committedRevision,marker.receipt.committedRevision);
  await invoke('editQQConnection',{...scope(),request:{operationId:'resolution-native-fresh-endpoint',expectedProfileVersion:1,value:config}});await waitFor(async()=>(await invoke('readQQ',scope())).transport.phase==='ready');
  assert.equal((await invoke('resolveQQDelivery',{...scope(),request:marker.request})).committedRevision,marker.receipt.committedRevision);
  await invoke('bindQQ',{...scope(),request:{operationId:'resolution-native-bind2',accountId:'10001',peerId:'20002',expectedRevision:(await invoke('inspect',{})).role.revision,replaceConfirmed:true}});await waitFor(async()=>(await invoke('readQQ',{expectedRoleId:roleId,expectedQQBindingVersion:2})).transport.phase==='ready');
  await assert.rejects(invoke('resolveQQDelivery',{...scope(),request:marker.request}),e=>e.details?.reason==='QQ_BINDING_CHANGED');
  await assert.rejects(invoke('resolveQQDelivery',{expectedRoleId:roleId,expectedQQBindingVersion:2,request:{...marker.request,operationId:'resolution-old-binding-new-key',expectedRevision:(await invoke('inspect',{})).role.revision}}),e=>e.details?.reason==='QQ_BINDING_CHANGED');
  assert.equal(entries.length,0);assert.equal(requests.filter(r=>r.action==='send_private_msg').length,0);result.currentBinding=2;
 }
 assert.equal(metadataEntries.length,0);result.roleId=roleId;result.actual={models:entries.length,sends:requests.filter(r=>r.action==='send_private_msg').length};
 await invoke('stopRole',{expectedRoleId:roleId,expectedBindingVersion:1,request:{operationId:'resolution-native-stop-'+phase}});await waitFor(async()=>(await invoke('readStopOperation',{expectedRoleId:roleId,expectedBindingVersion:1,operationId:'resolution-native-stop-'+phase})).stop?.phase==='stopped');await assert.rejects(access(join(homePath,'writer.lock')),e=>e.code==='ENOENT');result.roleStopped=true;result.lockReleased=true;
 await shutdown.shutdown(0);hostStopped=true;result.hostStopped=true;result.status='passed';
}catch(e){failure=e;result.status='failed';result.error={message:e.message,code:e.code,reason:e.details?.reason,stack:e.stack};writeFileSync(join(run,'resolution-native-'+phase+'.json'),JSON.stringify(result,null,2)+'\n');}
finally{const timer=setTimeout(()=>process.exit(2),6000);try{if(!hostStopped)await shutdown.shutdown(0);for(const socket of server.clients)socket.terminate();await new Promise(r=>server.close(r));await writeFile(join(run,'resolution-native-'+phase+'.json'),JSON.stringify(result,null,2)+'\n');}finally{clearTimeout(timer);}}
if(failure)throw failure;
