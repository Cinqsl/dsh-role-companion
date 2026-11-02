import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';

const run=process.env.DSH_TEST_RUN,homePath=join(run,'role'),stopId='owner-stop-required-flush-once';
const finalGate=Promise.withResolvers(),finalReached=Promise.withResolvers();
const events=[],event=(kind,data={})=>events.push({index:events.length,kind,...data});
const idle=new Set(),nativeResults=new Set();
let realHome,role,reopened,workAgent,signal,stopRequested=false,roleStopped=false,hostStopped=false,failure;
let readers=0,bodies=0,notifications=0,flushEntries=0,flushRejections=0,flushReturns=0,nativeCloseCalls=0,nativeCloseConfirms=0,homeCloses=0,nativeDisposeCalls=0;
const evidence={case:'48-autonomous-owner-stop-required-flush-once-rejected',status:'running',realBusinessCalls:0,events};
const errorView=error=>({name:error.name,code:error.code??null,message:error.message});
function tools(){
  const frames=[{type:'message_start',message:{id:'required-flush-tool',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_required_flush',name:'role_read',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset:0,limit:100})}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];
  return new Response(frames.map(value=>`event: ${value.type}\ndata: ${JSON.stringify(value)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});
}
const {ctx,module,entries,shutdown}=await bootNativeFixture(run,entry=>entry.ordinal===1?tools():response('停止后不得再次调用模型'));
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home');
const {startRole}=await module('dsh-role-companion/runtime');
const {createNativeExecution}=await module('dsh-role-companion');
const counts=()=>({actualModels:entries.length,actualReaders:readers,actualSDKBodies:bodies,canonicalNotifications:notifications,requiredFlushEntries:flushEntries,requiredFlushRejections:flushRejections,requiredFlushListenerReturns:flushReturns,nativeCloseCalls,nativeCloseConfirms,realHomeCloses:homeCloses,nativeDisposeCalls});
try{
  ctx.on('tools/execute',async(exec,next)=>{if(exec.name==='role_read'){bodies++;workAgent=exec.agent;event('actual-sdk-body',{sessionId:exec.agent.id,callId:exec.callId});}return next();});
  ctx.on('tools/result',exec=>{if(exec.name==='role_read'){notifications++;signal=exec.signal;event('actual-canonical-final',{sessionId:exec.agent.id,callId:exec.callId});}});
  ctx.on('agent/status',({agent,status})=>{if(status==='idle')idle.add(agent.session);});
  ctx.on('session/event',(session,record)=>{if(session!==workAgent?.session||record.type!=='tool/result')return;nativeResults.add(session);event('actual-native-tool-result',{sessionId:session.id,seq:record.seq,sourceEventSeqs:record.sourceEventSeqs??null});});
  // A genuine awaited SDK flush participant. No Session events/store, private
  // flush task, SDK method or result is fabricated. Other listeners still run.
  ctx.on('session/flush',async session=>{
    if(session!==workAgent?.session||!idle.has(session)||!nativeResults.has(session))return;
    flushEntries++;event('required-flush-listener-enter',{ordinal:flushEntries,sessionId:session.id});
    assert.equal(stopRequested,true);assert.equal(ctx.sessions.get(session.id),session);
    if(flushEntries===1){flushRejections++;event('required-flush-listener-rejected',{ordinal:flushEntries,sessionId:session.id});throw Object.assign(Error('Synthetic first required Session flush rejection'),{code:'FIXTURE_REQUIRED_FLUSH_ONCE'});}
    flushReturns++;event('required-flush-listener-returned',{ordinal:flushEntries,sessionId:session.id});
  });
  realHome=await createRoleHome(homePath,{operationId:'required-flush-create',core:'归档失败只能重试原flush，不得重做工具',settings:{inputLimitBytes:32768}},{async barrier(stage,detail){
    if(stage==='before-commit-publish'&&detail.operationId.startsWith('tool-final-')){event('home-canonical-held',{operationId:detail.operationId});finalReached.resolve();await finalGate.promise;event('home-canonical-released');}
    if(stage==='after-head-sync'&&(detail.operationId.startsWith('tool-observation-')||detail.operationId.startsWith('tool-final-')))event('durable-'+(detail.operationId.startsWith('tool-final-')?'canonical':'observation'),{revision:detail.revision,operationId:detail.operationId});
  }});
  const initial=await realHome.readAutonomy();await realHome.applyOwner({kind:'edit-autonomy-rules',operationId:'flush-limit48',value:{...initial.rules.value,modelLimit:1},expectedAutonomyRulesVersion:1,expectedRevision:realHome.revision});
  const home=new Proxy(realHome,{get(target,key){
    if(key==='close')return async()=>{homeCloses++;assert.equal(nativeCloseConfirms,1);event('actual-home-close-enter');await target.close();event('actual-home-close-complete');};
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});
  const native=await createNativeExecution(ctx),execution=withNativeScope(native,(scope,plan)=>{
    evidence.runId=plan.turn.runId;evidence.inputIds=plan.turn.inputIds;
    return Object.freeze({...scope,roleRead:Object.freeze({...scope.roleRead,read(request){readers++;event('actual-reader-entry');return scope.roleRead.read(request);}})});
  });
  execution.close=async()=>{nativeCloseCalls++;event('native-close-enter',{ordinal:nativeCloseCalls});try{await native.close();nativeCloseConfirms++;event('native-close-confirmed',{ordinal:nativeCloseCalls});}catch(error){event('native-close-rejected',{ordinal:nativeCloseCalls,error:errorView(error)});throw error;}};
  execution.dispose=async()=>{await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');nativeDisposeCalls++;event('native-dispose-after-home-release');await native.dispose();};
  role=await startRole(home,{execution});role.lifetime.stopped.then(()=>{roleStopped=true;event('role-stopped');});evidence.roleId=home.roleId;
  await role.runtime.wake({operationId:'flush-opportunity48',reason:'controlled-autonomous-flush'});await finalReached.promise;assert.deepEqual(evidence.inputIds,[]);
  assert.equal(readers,1);assert.equal(bodies,1);assert.equal(notifications,1);assert.equal(signal.aborted,false);assert.equal(flushEntries,0);
  stopRequested=true;event('public-owner-stop-requested');const accepting=role.owner.stop({operationId:stopId});
  await waitFor(async()=>(await role.runtime.inspect()).status==='stopping');
  assert.equal((await role.owner.readOperation(stopId)).reason,'STOP_COMMIT_PENDING');
  finalGate.resolve();const receipt=await accepting;assert.equal(receipt.kind,'committed');
  const blocked=await waitFor(async()=>{const value=await role.owner.readOperation(stopId);return value.stop?.phase==='blocked'?value:undefined;});
  // Let the failed stop task's public completion bookkeeping settle before the
  // one explicit retry, so a pending stop-task race cannot manufacture a RED.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(blocked.stop.checkpoint,'requested');assert.equal(roleStopped,false);assert.equal(flushEntries,1);assert.equal(flushRejections,1);assert.equal(flushReturns,0);
  assert.equal(nativeCloseConfirms,0);assert.equal(homeCloses,0);assert.equal(nativeDisposeCalls,0);assert.equal(ctx.sessions.get(workAgent.id),workAgent.session);await access(join(homePath,'writer.lock'));
  const saved=await realHome.readConversation();assert.equal(saved.turns[0].source,'autonomous');assert.equal(saved.autonomy.windows[0].used.model,1);assert.equal(saved.autonomy.windows[0].used.tool,1);evidence.autonomy=saved.autonomy;const tool=saved.attempts.find(attempt=>attempt.kind==='tool');
  assert.equal(tool.observation.kind,'returned');assert.equal(tool.observation.value.text,'归档失败只能重试原flush，不得重做工具');assert.equal(tool.outcome.data.result.final.isError,false);
  assert.equal(entries.length,1);assert.equal(readers,1);assert.equal(bodies,1);assert.equal(notifications,1);
  Object.assign(evidence,{sessionId:workAgent.id,attemptId:tool.attemptId,revision:saved.revision,stopReceipt:receipt,blocked,observation:tool.observation,canonical:tool.outcome.data.result.final,beforeRetry:counts()});event('blocked-with-lock-session-and-records',{revision:saved.revision});
  event('public-retryArchives-enter');
  let repaired,retryError;
  try{repaired=await role.owner.retryArchives();}catch(error){retryError=errorView(error);}
  event('public-retryArchives-returned',{repaired:repaired??null,error:retryError??null});
  await new Promise(resolve=>setImmediate(resolve));
  const afterRetry=await waitFor(async()=>{const value=await role.owner.readOperation(stopId);return ['blocked','stopped'].includes(value.stop?.phase)?value:undefined;});
  Object.assign(evidence,{retryResult:repaired??null,retryError:retryError??null,afterRetry,afterRetryCounts:counts()});
  if(afterRetry.stop.phase!=='stopped'){
    await access(join(homePath,'writer.lock'));assert.equal(roleStopped,false);assert.equal(homeCloses,0);assert.equal(nativeDisposeCalls,0);
    evidence.lockRetained=true;throw Object.assign(Error('Explicit retry did not re-enter the original required flush and complete stop'),{code:'FIXTURE_REQUIRED_FLUSH_RETRY_STUCK'});
  }
  assert.equal(retryError,undefined);assert.equal(repaired.pending,0);await role.lifetime.stopped;
  assert.equal(flushEntries,2);assert.equal(flushRejections,1);assert.equal(flushReturns,1);assert.equal(nativeCloseConfirms,1);assert.equal(homeCloses,1);assert.equal(nativeDisposeCalls,1);
  assert.equal(entries.length,1);assert.equal(readers,1);assert.equal(bodies,1);assert.equal(notifications,1);await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');
  reopened=await openRoleHome(homePath);const restored=await reopened.readConversation();assert.deepEqual(restored.autonomy,saved.autonomy);assert.deepEqual(restored.attempts.find(attempt=>attempt.attemptId===tool.attemptId),tool);
  const persisted=await reopened.readOperation(stopId);assert.equal(persisted.stop.checkpoint,'ready-to-close');assert.equal(persisted.stop.phase,'unverified');await reopened.close();reopened=undefined;
  await shutdown.shutdown(0);hostStopped=true;
  const at=kind=>events.find(value=>value.kind===kind)?.index;
  assert(at('required-flush-listener-rejected')<at('blocked-with-lock-session-and-records'));
  assert(at('public-retryArchives-enter')<at('required-flush-listener-returned'));
  assert(at('required-flush-listener-returned')<at('native-close-confirmed'));
  assert(at('native-close-confirmed')<at('actual-home-close-enter'));
  assert(at('actual-home-close-complete')<at('native-dispose-after-home-release'));
  assert(at('native-dispose-after-home-release')<at('role-stopped'));
  Object.assign(evidence,{status:'passed',...counts(),persisted,roleStopped,hostStopped,lockReleased:true,publicReopen:true});
}catch(error){failure=error;Object.assign(evidence,{status:'failed',error:errorView(error),...counts(),roleStopped,hostStopped});console.error('Required flush fault tracer:',error.code??error.message);}
finally{
  finalGate.resolve();
  const timer=setTimeout(()=>{writeFileSync(join(run,'autonomy-flush-result.json'),JSON.stringify({...evidence,cleanup:'bounded-failure-not-stopped'},null,2)+'\n');process.exit(2);},8000);
  try{
    if(reopened)await reopened.close();
    if(role&&!roleStopped){role.lifetime.requestStop('unload');await role.lifetime.stopped;}else if(!role&&realHome)await realHome.close();
    if(!hostStopped){await shutdown.shutdown(0);hostStopped=true;}evidence.hostStopped=hostStopped;
    await writeFile(join(run,'autonomy-flush-result.json'),JSON.stringify(evidence,null,2)+'\n');
  }finally{clearTimeout(timer);}
}
if(failure)process.exitCode=2;
else console.log('Required Session flush rejection stayed blocked; explicit retry completed original flush/Home close without business replay.');
