import assert from 'node:assert/strict';
import {join} from 'node:path';
import {writeFile,access} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {bootNativeFixture,response,waitFor} from './native-fixture.mjs';
const run=process.env.DSH_TEST_RUN,mode=process.argv[2],homePath=join(run,'role'),events=[],event=(kind,data={})=>events.push({index:events.length,kind,...data});
const held=Promise.withResolvers(),entered=Promise.withResolvers();let sessionId,flushEntries=0,hostStopped=false,roleStopped=false,failure,release=false;
const evidence={case:'38-qq-config-lifecycle-'+mode,status:'running',events,realBusinessCalls:{model:0,web:0,qq:0}};
const {ctx,module,entries,metadataEntries,shutdown}=await bootNativeFixture(run,entry=>{event('actual-model-entry',{ordinal:entry.ordinal});return response('配置停稳时保留的完整回答');},{globalCompaction:false});
const {Peer}=await module('@deepseek-ai/dsh-client-connection'),owner=new Peer(ctx,{principal:{kind:'owner'}}),invoke=(method,args={})=>ctx.typertGateway.invoke({peer:owner,namespace:'roleCompanion',method,args});
ctx.on('agent/status',({agent,status})=>{if(agent.id.startsWith('dsh-role-companion-')&&status==='idle')sessionId=agent.id;});
ctx.on('session/flush',async session=>{if(session.id!==sessionId)return;flushEntries++;event('actual-required-flush-enter',{sessionId:session.id,ordinal:flushEntries});entered.resolve();await held.promise;event('actual-required-flush-return',{sessionId:session.id,ordinal:flushEntries});});
let configWait=false;ctx.on('loader/partial-dispose',entry=>{if(configWait)event('public-profile-partial',{name:entry.options.name});},{global:true});
try{
 const created=await invoke('createHome',{path:homePath,request:{operationId:'qq-lifecycle-create',core:'QQ重开权限只属于明确配置操作',settings:{inputLimitBytes:32768}},expectedProfileVersion:0});assert.equal(created.registration,'registered');const roleId=created.roleId,guard={expectedRoleId:roleId,expectedBindingVersion:1};evidence.roleId=roleId;
 if(mode==='old-stop'){
  await invoke('stopRole',{...guard,request:{operationId:'qq-prior-owner-stop'}});await waitFor(async()=>(await invoke('readStopOperation',{...guard,operationId:'qq-prior-owner-stop'})).stop?.phase==='stopped');await invoke('reopenRole',{...guard,stopOperationId:'qq-prior-owner-stop'});event('prior-stop-reopened');
 }
 const received=await invoke('submitInput',{request:{operationId:'qq-lifecycle-panel',clientRequestId:'qq-lifecycle-key',text:'等待真实flush完成',...guard}});assert.equal(received.kind,'accepted');evidence.inputReceipt=received;await entered.promise;assert.equal(entries.length,1);
 const value={enabled:false,endpoint:'',credentialRef:'',maxFrameBytes:512,readTimeoutMs:80,reconnectInitialMs:10,reconnectMaxMs:20,jitterRatio:0.5};
 const editing=invoke('editQQConnection',{expectedRoleId:roleId,expectedQQBindingVersion:0,request:{operationId:'qq-lifecycle-edit',expectedProfileVersion:0,value}}).then(value=>({value}),error=>({error:{code:error.code,reason:error.details?.reason??null}}));
 await waitFor(async()=>(await invoke('inspect')).role.status==='stopping');await access(join(homePath,'writer.lock'));configWait=true;event('own-config-waiting-with-original-lock');
 const before=performance.now();await Promise.race([invoke('readOperation',{operationId:'qq-lifecycle-panel',expectedRoleId:roleId}),new Promise((_,reject)=>setTimeout(()=>reject(Error('QQ config wait occupied the owner control queue')),1000))]);evidence.controlReadMs=performance.now()-before;event('control-read-returned-during-flush-wait');
 let external;
 if(mode==='owner-stop'){
  await assert.rejects(invoke('stopRole',{...guard,request:{operationId:'qq-explicit-owner-stop'}}),error=>error.details?.reason==='STOP_ALREADY_REQUESTED');event('explicit-owner-stop-cancelled-reopen');
 }else if(mode==='old-stop'){
  const old=await invoke('stopRole',{...guard,request:{operationId:'qq-prior-owner-stop'}});assert.equal(old.stop.phase,'unverified');evidence.oldStop=old;event('old-stop-retry-did-not-stop-current-lifetime');
 }else if(mode==='external-config'){
  const provider=ctx.configEditor.entries().find(entry=>entry.options.name==='@deepseek-ai/dsh-llm-deepseek-api-key');assert(provider);
  external=ctx.configEditor.edit(provider,current=>({...current,thinking:'enabled'}));await waitFor(()=>events.some(value=>value.kind==='public-profile-partial'));event('external-provider-change-cancelled-reopen');
 }else throw Error('Unknown lifecycle mode');
 release=true;held.resolve();event('original-flush-released');const result=await editing;await external;evidence.editResult=result;
 if(mode==='old-stop'){
  assert.equal(result.value.profileVersion,1);assert.equal(result.value.lastOperationId,'qq-lifecycle-edit');const state=(await invoke('inspect')).role;assert.notEqual(state.status,'stopped');assert.equal((await invoke('readConversation',guard)).totalReplies,1);event('own-config-reopened-same-role');
  await invoke('stopRole',{...guard,request:{operationId:'qq-final-owner-stop'}});await waitFor(async()=>(await invoke('readStopOperation',{...guard,operationId:'qq-final-owner-stop'})).stop?.phase==='stopped');
 }else{
  assert.equal(result.error.reason,'QQ_RESTART_CANCELLED');const state=await waitFor(async()=>{const view=(await invoke('inspect')).role;return view.status==='stopped'?view:undefined;});evidence.stopped=state;
  const saved=await invoke('readQQ',{expectedRoleId:roleId,expectedQQBindingVersion:0});assert.equal(saved.profileVersion,0);assert.equal(saved.lastOperationId,'');evidence.saved=saved;
 }
 roleStopped=true;await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');
 const {openRoleHome}=await module('dsh-role-companion/home'),reopened=await openRoleHome(homePath),state=await reopened.readConversation();assert.equal(state.turns.length,1);assert.equal(state.replies.length,1);assert.equal(state.attempts.filter(value=>value.kind==='model').length,1);assert.equal(entries.length,1);assert.equal(state.turns[0].status,'finished');assert.equal(state.attempts[0].outcome.data.request.sessionId,sessionId);await reopened.close();
 evidence.home={revision:state.revision,runId:state.turns[0].runId,attemptIds:state.attempts.map(value=>value.attemptId),replyId:state.replies[0].replyId,sessionId};await shutdown.shutdown(0);hostStopped=true;Object.assign(evidence,{status:'passed',actualModels:entries.length,metadataEntries:metadataEntries.length,flushEntries,roleStopped,hostStopped,lockReleased:true,publicReopen:true});
}catch(error){failure=error;Object.assign(evidence,{status:'failed',error:{message:error.message,code:error.code??null,reason:error.details?.reason??null,stack:error.stack},actualModels:entries.length,flushEntries,release,roleStopped,hostStopped});}
finally{
 held.resolve();const timer=setTimeout(()=>{writeFileSync(join(run,'qq-config-lifecycle-result.json'),JSON.stringify({...evidence,cleanup:'bounded-failure-not-stopped'},null,2)+'\n');process.exit(2);},8000);
 try{if(!hostStopped){await shutdown.shutdown(0);hostStopped=true;}evidence.hostStopped=hostStopped;await writeFile(join(run,'qq-config-lifecycle-result.json'),JSON.stringify(evidence,null,2)+'\n');}finally{clearTimeout(timer);}
}
if(failure){console.error('QQ config lifecycle failed',mode,failure);process.exitCode=2;}
