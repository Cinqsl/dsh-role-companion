import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';

const run=process.env.DSH_TEST_RUN,mode=process.argv[2],homePath=join(run,'role');
const waiting=mode.startsWith('wait-'),retryEntered=Promise.withResolvers(),retryWaits=[];
const events=[],event=(kind,data={})=>events.push({index:events.length,kind,...data});
const evidence={case:'36-primary-retry-'+mode,mode,status:'running',realBusinessCalls:{model:0,web:0,qq:0},events};
let home,role,reopened,failure,roleStopped=false,hostStopped=false,retryPending=false,readers=0,bodies=0,finals=0,reserveCalls=0,retryCalls=0;
const errorView=error=>({name:error.name,code:error.code??null,message:error.message});
const {ctx,module,entries,metadataEntries,shutdown}=await bootNativeFixture(run,entry=>{
  event('actual-model-transport',{ordinal:entry.ordinal});
  if(mode==='rate-429'&&entry.ordinal===2)return response('限流后只重试一次的完整回复');
  if(waiting&&entry.ordinal>1)return response(mode==='wait-core'?'新核心下逐次计费的接续回复':'控制变更后不应发出的重试');
  const [status,error]=mode==='auth'?[401,{type:'authentication_error',message:'Synthetic authentication failure'}]:mode==='context'?[400,{code:'context_length_exceeded',message:'maximum context length exceeded'}]:mode==='rate-429'?[429,{type:'rate_limit_error',message:'Synthetic temporary rate limit'}]:[503,{type:'api_error',message:'Synthetic temporary server failure'}];
  return new Response(JSON.stringify({type:'error',error}),{status,headers:{'content-type':'application/json'}});
});
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
try{
  ctx.on('tools/execute',async(_exec,next)=>{bodies++;return next();});ctx.on('tools/result',()=>{finals++;});
  home=await createRoleHome(homePath,{operationId:'retry-boundaries-create',core:'同一逻辑请求最多一次受控重试',settings:{inputLimitBytes:32768}},{async barrier(stage,detail){if(stage==='after-head-sync'&&(detail.operationId.startsWith('reserve-')||detail.operationId.startsWith('record-')||detail.operationId.startsWith('finish-')||detail.operationId.startsWith('failure-')))event('home-commit',{operationId:detail.operationId,revision:detail.revision});}});
  const native=await createNativeExecution(ctx),execution=withNativeScope(native,(scope,plan)=>{
    evidence.runId=plan.turn.runId;evidence.deadline=plan.turn.deadline;evidence.inputIds=plan.turn.inputIds;
    return Object.freeze({...scope,roleRead:Object.freeze({...scope.roleRead,read(request){readers++;return scope.roleRead.read(request);}}),createModelOperation(purpose){
      const operation=scope.createModelOperation(purpose);
      return Object.freeze({...operation,async reserve(request){reserveCalls++;event('public-model-reserve-enter',{ordinal:reserveCalls,purpose});const permit=await operation.reserve(request);event('public-model-reserve-return',{attemptId:permit.attemptId});return permit;},async retry(...args){retryCalls++;const start=performance.now();event('public-model-retry-enter',{ordinal:retryCalls,failure:args[0]});const task=operation.retry(...args);retryPending=true;retryEntered.resolve();try{return await task;}finally{retryPending=false;const elapsedMs=performance.now()-start;retryWaits.push(elapsedMs);event('public-model-retry-settled',{ordinal:retryCalls,elapsedMs});}}});
    }});
  });
  role=await startRole(home,{execution});role.lifetime.stopped.then(()=>{roleStopped=true;event('role-stopped');});evidence.roleId=home.roleId;
  const before=await home.readSnapshot();await role.owner.apply({kind:'edit-retry-rules',operationId:'retry-boundaries-delay',expectedRetryRulesVersion:1,expectedRevision:before.revision,value:{maxAutomaticRetries:1,retryDelayMs:waiting?5000:25}});
  if(mode==='limit-0'||mode==='limit-1'){const current=await home.readConversation();await role.owner.apply({kind:'edit-conversation',operationId:'retry-boundaries-limit',expectedConversationVersion:current.rules.version,expectedRevision:current.revision,value:{...current.rules.value,modelLimit:mode==='limit-0'?0:1}});}
  await role.runtime.receive(bound(home.roleId,mode));
  if(waiting){
    await retryEntered.promise;await new Promise(resolve=>setTimeout(resolve,100));
    assert.equal(retryPending,true,'the real public retry promise must still be pending when the owner acts');
    const current=await home.readSnapshot(),saved=await home.readConversation();assert.equal(saved.attempts.length,1);assert.equal(saved.attempts[0].outcome.kind,'failed');assert.equal(entries.length,1);
    event('retry-pending-with-original-failure-durable',{revision:saved.revision,attemptId:saved.attempts[0].attemptId});
    const start=performance.now();event('public-control-enter',{mode});let receipt;
    if(mode==='wait-rules')receipt=await role.owner.apply({kind:'edit-retry-rules',operationId:'retry-live-disable',expectedRetryRulesVersion:saved.retryRules.version,expectedRevision:current.revision,value:{maxAutomaticRetries:0,retryDelayMs:5000}});
    else if(mode==='wait-core')receipt=await role.owner.apply({kind:'edit-core',operationId:'retry-live-core',text:'owner在真实重试等待中更新核心',expectedCoreVersion:current.core.version,expectedRevision:current.revision});
    else{assert.equal(mode,'wait-stop');role.lifetime.requestStop('owner-stop');receipt=await role.lifetime.stopped;}
    const elapsedMs=performance.now()-start;event('public-control-returned',{mode,elapsedMs,receipt});Object.assign(evidence,{beforeControl:saved,control:{mode,elapsedMs,receipt,retryPendingAtReturn:retryPending}});
    assert(elapsedMs<2500,'a short public control must complete before the configured 5000ms retry wait elapses');
    if(mode!=='wait-stop')assert.equal(receipt.kind,'committed');
  }
  if(!roleStopped)await waitFor(async()=>(await role.runtime.inspect()).home?.inputSummary.resolved===1);
  let state;
  if(roleStopped){reopened=await openRoleHome(homePath);state=await reopened.readConversation();await reopened.close();reopened=undefined;}else state=await home.readConversation();
  const models=state.attempts.filter(attempt=>attempt.kind==='model');
  Object.assign(evidence,{state,actualModels:entries.length,actualReaders:readers,actualSDKBodies:bodies,canonicalNotifications:finals,reserveCalls,retryCalls,retryWaits,metadataEntries:metadataEntries.length,modelRequests:entries.map(entry=>({ordinal:entry.ordinal,body:entry.body,signalAborted:entry.signal.aborted}))});
  if(mode==='double-503'||mode==='rate-429'){
    assert.equal(entries.length,2,'one logical operation may dispatch at most one freshly reserved retry');assert.equal(models.length,2);assert.deepEqual(models.map(x=>x.outcome.kind),['failed',mode==='double-503'?'failed':'completed']);
    assert.equal(models[0].outcome.modelFailure.code,mode==='double-503'?'SERVER':'RATE_LIMIT');if(mode==='double-503')assert.equal(models[1].outcome.modelFailure.code,'SERVER');
    assert.equal(models[0].modelOperation.logicalOpId,models[1].modelOperation.logicalOpId);assert.deepEqual(models.map(x=>x.modelOperation.ordinal),[0,1]);assert.equal(models[1].modelOperation.previousAttemptId,models[0].attemptId);assert.deepEqual(models.map(x=>x.source),['user','user']);
  }else if(mode==='limit-0'||mode==='limit-1'){
    const limit=mode==='limit-0'?0:1;assert.equal(entries.length,limit);assert.equal(models.length,limit);assert.equal(state.rules.value.modelLimit,limit);assert.equal(state.turns[0].outcome.kind,'failure');assert.equal(state.turns[0].outcome.reason,'MODEL_LIMIT');
    if(limit)assert.equal(models[0].outcome.modelFailure.code,'SERVER');
  }else if(waiting){
    const old=evidence.beforeControl.attempts[0],oldLogical=old.modelOperation.logicalOpId;
    assert.equal(state.attempts.filter(attempt=>attempt.modelOperation?.logicalOpId===oldLogical).length,1,'the invalidated old logical operation cannot reserve an ordinal1 retry');
    assert.deepEqual(models.find(attempt=>attempt.attemptId===old.attemptId),old,'the old failed attempt and charge must remain intact');
    assert.equal(models[0].outcome.modelFailure.code,'SERVER');assert.equal(models[0].modelOperation.ordinal,0);assert.equal(state.turns[0].deadline,evidence.beforeControl.turns[0].deadline);assert.equal(state.turns[0].startedAt,evidence.beforeControl.turns[0].startedAt);
    if(mode==='wait-core'){
      assert.equal(entries.length,2);assert.equal(models.length,2);assert.equal(reserveCalls,2);assert.equal(models[1].modelOperation.ordinal,0);assert.notEqual(models[1].modelOperation.logicalOpId,oldLogical);
      assert.deepEqual(models.map(attempt=>attempt.source),['user','user']);assert(models.every(attempt=>attempt.runId===evidence.runId&&attempt.enteredAt));assert.equal(state.rules.value.modelLimit,8);
      const oldWire=JSON.stringify(entries[0].body),newWire=JSON.stringify(entries[1].body);assert(oldWire.includes('同一逻辑请求最多一次受控重试'));assert(!oldWire.includes('owner在真实重试等待中更新核心'));assert(newWire.includes('owner在真实重试等待中更新核心'));assert(!newWire.includes('同一逻辑请求最多一次受控重试'));
      evidence.coreContract='Old logical retry is closed; a distinct paid primary may continue from the new snapshot under the same Home source, run budget and deadline';
    }else{assert.equal(entries.length,1);assert.equal(models.length,1);assert.equal(reserveCalls,1,'changed admission must be checked before reserving a retry');assert.equal(models[0].source,'user');}
    if(mode==='wait-rules'){assert.equal(state.retryRules.version,3);assert.equal(state.retryRules.value.maxAutomaticRetries,0);}
  }else{
    assert(['auth','context'].includes(mode));assert.equal(entries.length,1);assert.equal(models.length,1);assert.equal(models[0].outcome.modelFailure.code,mode==='auth'?'AUTH':'CONTEXT_WINDOW_EXCEEDED');assert.equal(models[0].outcome.kind,'failed');
  }
  assert.equal(state.turns[0].status,'finished');assert.equal(state.replies.length,mode==='rate-429'||mode==='wait-core'?1:0);if(mode==='rate-429')assert.equal(state.replies[0].text,'限流后只重试一次的完整回复');if(mode==='wait-core')assert.equal(state.replies[0].text,'新核心下逐次计费的接续回复');assert.equal(readers,0);assert.equal(bodies,0);assert.equal(finals,0);assert.equal(metadataEntries.length,0);
  role.lifetime.requestStop('unload');await role.lifetime.stopped;await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');
  reopened=await openRoleHome(homePath);const restored=await reopened.readConversation();assert.deepEqual(restored.attempts,state.attempts);assert.deepEqual(restored.turns,state.turns);assert.deepEqual(restored.rules,state.rules);assert.deepEqual(restored.retryRules,state.retryRules);if(mode==='wait-core')assert.equal((await reopened.readSnapshot()).core.text,'owner在真实重试等待中更新核心');await reopened.close();reopened=undefined;
  await shutdown.shutdown(0);hostStopped=true;Object.assign(evidence,{status:'passed',roleStopped,hostStopped,lockReleased:true,publicReopen:true});
}catch(error){failure=error;Object.assign(evidence,{status:'failed',error:errorView(error),actualModels:entries.length,actualReaders:readers,actualSDKBodies:bodies,canonicalNotifications:finals,reserveCalls,retryCalls,roleStopped,hostStopped});try{evidence.failedState=await home?.readConversation();}catch{}console.error('Primary retry boundary:',mode,error.code??error.message);}
finally{
  const timer=setTimeout(()=>{writeFileSync(join(run,'model-retry-boundaries-result.json'),JSON.stringify({...evidence,cleanup:'bounded-failure-not-stopped'},null,2)+'\n');process.exit(2);},8000);
  try{if(reopened)await reopened.close();if(role&&!roleStopped){role.lifetime.requestStop('unload');await role.lifetime.stopped;}else if(!role&&home)await home.close();if(!hostStopped){await shutdown.shutdown(0);hostStopped=true;}evidence.hostStopped=hostStopped;await writeFile(join(run,'model-retry-boundaries-result.json'),JSON.stringify(evidence,null,2)+'\n');}finally{clearTimeout(timer);}
}
if(failure)process.exitCode=2;
