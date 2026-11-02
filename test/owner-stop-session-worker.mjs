import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,readFile,writeFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';

// Public boundaries: actual Native/reader, workspace archive/factory lifetime,
// SDK notifications, HomeIO, RoleOwner.stop/readOperation and RoleLifetime.
const run=process.env.DSH_TEST_RUN,mode=process.argv[2]??'archive';
const gate=Promise.withResolvers(),reached=Promise.withResolvers(),flushGate=Promise.withResolvers(),flushReached=Promise.withResolvers();
const events=[],homePath=join(run,'role'),stopId='session-stop-'+mode;
const event=(kind,data={})=>events.push({index:events.length,kind,...data});
let role,home,reopened,workAgent,signal,readers=0,bodies=0,notifications=0,disposed=false,roleStopped=false,hostStopped=false,failure,factoryPending,factoryUnloaded=false,flushHeld=false;
const evidence={case:'37-owner-stop-session-'+mode,status:'running',mode,realBusinessCalls:0,events};
function tools(){const frames=[{type:'message_start',message:{id:'session-close-tool',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_session_'+mode,name:'role_read',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset:0,limit:100})}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(frames.map(value=>`event: ${value.type}\ndata: ${JSON.stringify(value)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
const {ctx,module,entries,shutdown}=await bootNativeFixture(run,entry=>entry.ordinal===1?tools():response('外部取消后不应生成'));
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home');
const {startRole}=await module('dsh-role-companion/runtime');
const {createNativeExecution}=await module('dsh-role-companion');
try{
  ctx.on('tools/execute',async(exec,next)=>{if(exec.name==='role_read'){bodies++;workAgent=exec.agent;signal=exec.signal;event('actual-sdk-body-entry',{sessionId:exec.agent.id,callId:exec.callId});}return next();});
  ctx.on('tools/result',(exec,result)=>{if(exec.name==='role_read'){notifications++;event('actual-canonical-final',{sessionId:exec.agent.id,callId:exec.callId,isError:result.isError});}});
  ctx.on('session/event',(session,record)=>{if(!session.id.startsWith('dsh-role-companion-')||record.type!=='tool/result')return;event('native-tool-result',{sessionId:session.id,seq:record.seq,sourceEventSeqs:record.sourceEventSeqs??null});});
  ctx.on('agent/disposed',({agent})=>{if(agent.id===workAgent?.id)event('actual-agent-disposed',{sessionId:agent.id});});
  ctx.on('session/disposed',session=>{if(session.id===workAgent?.id)event('actual-session-disposed',{sessionId:session.id});});
  ctx.on('session/flush',async session=>{if(mode!=='factory'||flushHeld||session!==workAgent?.session||notifications!==1)return;flushHeld=true;event('required-session-flush-held',{sessionId:session.id});flushReached.resolve();await flushGate.promise;event('required-session-flush-released',{sessionId:session.id});});
  home=await createRoleHome(homePath,{operationId:'session-create-'+mode,core:'真实宿主生命周期必须保存已开始工具的完整结果',settings:{inputLimitBytes:32768}},{async barrier(stage,detail){if(stage==='after-head-sync'&&(detail.operationId.startsWith('tool-observation-')||detail.operationId.startsWith('tool-final-')))event('durable-'+(detail.operationId.startsWith('tool-observation-')?'observation':'canonical'),{operationId:detail.operationId,revision:detail.revision});}});
  const native=await createNativeExecution(ctx),execution=withNativeScope(native,(scope,plan)=>{
    evidence.runId=plan.turn.runId;evidence.inputIds=plan.turn.inputIds;
    return Object.freeze({...scope,roleRead:Object.freeze({...scope.roleRead,async read(request){readers++;event('actual-reader-entry');const value=await scope.roleRead.read(request);event('actual-reader-value-ready');reached.resolve();await gate.promise;event('actual-reader-return');return value;}})});
  });
  execution.dispose=async()=>{await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');event('native-observer-dispose-after-home-release');await native.dispose();disposed=true;};
  role=await startRole(home,{execution});role.lifetime.stopped.then(()=>{roleStopped=true;event('role-stopped');});
  evidence.roleId=home.roleId;await role.runtime.receive(bound(home.roleId,'session-'+mode));await reached.promise;
  const before=await home.readConversation(),pendingTool=before.attempts.find(attempt=>attempt.kind==='tool');assert(pendingTool);
  assert.equal(pendingTool.observation,undefined,'real reader has not returned to the action observation boundary');
  assert.equal(pendingTool.outcome,undefined);assert.equal(readers,1);assert.equal(bodies,1);assert.equal(notifications,0);
  if(mode==='archive'){
    await ctx.workspaceRegistry.archiveSession(workAgent.id,{stopActivity:true});event('public-workspace-archive-returned');
    assert(ctx.workspaceRegistry.archivedSessionIds.includes(workAgent.id));
  }else{
    assert.equal(mode,'factory');const factory=ctx.configEditor.entries().find(entry=>entry.options.name==='@deepseek-ai/dsh-agent-loop');assert(factory?.fiber);
    event('public-factory-unload-requested');factoryPending=factory.fiber.dispose().then(()=>{factoryUnloaded=true;event('public-factory-unload-completed');});
    await new Promise(resolve=>setTimeout(resolve,50));assert.equal(factoryUnloaded,false,'factory cannot complete while a real tool is held');
  }
  assert.equal(signal.aborted,true,'host cancellation is visible while real body is still held');
  assert.equal(roleStopped,false);assert.equal(notifications,0);assert.equal(entries.length,1);assert.equal(disposed,false);await access(join(homePath,'writer.lock'));
  event('cancel-is-not-body-settlement');gate.resolve();
  if(mode==='archive')await waitFor(async()=>(await role.runtime.inspect()).home?.inputSummary.resolved===1);
  else{
    await flushReached.promise;
    const atFlush=await home.readConversation(),flushingTool=atFlush.attempts.find(attempt=>attempt.attemptId===pendingTool.attemptId);
    assert(flushingTool.observation);assert(flushingTool.outcome);assert.equal(flushingTool.outcome.data.result.final.isError,true);
    assert.equal(factoryUnloaded,false);assert.equal(ctx.agents.get(workAgent.id),workAgent);assert.equal(ctx.sessions.get(workAgent.id),workAgent.session);
    assert.equal(roleStopped,false);assert.equal(disposed,false);await access(join(homePath,'writer.lock'));
    event('factory-awaits-flush-with-records-and-owner-attached',{sessionId:workAgent.id,revision:atFlush.revision,attemptId:pendingTool.attemptId});
    flushGate.resolve();
    await factoryPending;assert.equal(ctx.agents.get(workAgent.id),undefined);assert.equal(ctx.sessions.get(workAgent.id),undefined);
    assert(events.some(value=>value.kind==='actual-agent-disposed'));assert(events.some(value=>value.kind==='actual-session-disposed'));
    await waitFor(async()=>(await home.readConversation()).attempts.find(attempt=>attempt.attemptId===pendingTool.attemptId)?.outcome);
  }
  const state=await home.readConversation(),tool=state.attempts.find(attempt=>attempt.attemptId===pendingTool.attemptId);
  assert.equal(tool.observation.kind,'returned');assert.equal(tool.observation.value.text,'真实宿主生命周期必须保存已开始工具的完整结果');
  assert.equal(tool.outcome.kind,'failed');assert.equal(tool.outcome.data.result.final.isError,true);assert.equal(Object.hasOwn(tool.outcome.data.result.final,'value'),false);
  assert.equal(notifications,1);assert.equal(readers,1);assert.equal(bodies,1);assert.equal(entries.length,1);
  event('complete-tool-record-readable');
  const receipt=await role.owner.stop({operationId:stopId});assert.equal(receipt.kind,'committed');
  if(mode==='factory'){
    const view=await waitFor(async()=>{const value=await role.owner.readOperation(stopId);return ['blocked','stopped'].includes(value.stop?.phase)?value:undefined;});
    Object.assign(evidence,{stopReceipt:receipt,stopView:view,sessionId:workAgent.id,attemptId:tool.attemptId,revision:state.revision,observation:tool.observation,canonical:tool.outcome.data.result.final,factoryUnloaded,roleStopped,actualModels:entries.length,actualReaders:readers,actualSDKBodies:bodies,canonicalNotifications:notifications});
    if(view.stop.phase==='blocked'){
      await access(join(homePath,'writer.lock'));assert.equal(roleStopped,false);assert.equal(disposed,false);
      Object.assign(evidence,{status:'blocked-observed',limitation:'Explicit Role stop cannot complete after external Factory has detached the native Session; no automatic-stopped expectation was made',lockRetained:true});
      throw Object.assign(Error('Explicit stop remains honestly blocked after public factory/session disposal'),{code:'FIXTURE_FACTORY_EXPLICIT_STOP_BLOCKED'});
    }
  }
  await role.lifetime.stopped;assert.equal(disposed,true);assert.equal((await role.owner.readOperation(stopId)).stop.phase,'stopped');
  await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');
  reopened=await openRoleHome(homePath);const restored=await reopened.readConversation();assert.deepEqual(restored.attempts.find(attempt=>attempt.attemptId===tool.attemptId),tool);
  const persistedStop=await reopened.readOperation(stopId);assert.equal(persistedStop.stop.checkpoint,'ready-to-close');assert.equal(persistedStop.stop.phase,'unverified');
  await reopened.close();reopened=undefined;
  await shutdown.shutdown(0);hostStopped=true;
  const index=kind=>events.find(value=>value.kind===kind)?.index;
  assert(index('cancel-is-not-body-settlement')<index('actual-reader-return'));
  assert(index('actual-reader-return')<index('durable-observation'));
  assert(index('durable-observation')<index('actual-canonical-final'));
  assert(index('actual-canonical-final')<index('native-tool-result'));
  assert(index('durable-canonical')<index('native-observer-dispose-after-home-release'));
  if(mode==='factory'){
    assert(index('factory-awaits-flush-with-records-and-owner-attached')<index('required-session-flush-released'));
    assert(index('required-session-flush-released')<index('actual-agent-disposed'));
    assert(index('actual-agent-disposed')<index('actual-session-disposed'));
    assert(index('actual-session-disposed')<index('public-factory-unload-completed'));
  }
  Object.assign(evidence,{status:'passed',sessionId:workAgent.id,attemptId:tool.attemptId,revision:state.revision,actualModels:entries.length,actualReaders:readers,actualSDKBodies:bodies,canonicalNotifications:notifications,observation:tool.observation,canonical:tool.outcome.data.result.final,turn:state.turns[0],stopReceipt:receipt,persistedStop,roleStopped,hostStopped,lockReleased:true,publicReopen:true});
}catch(error){failure=error;Object.assign(evidence,{status:'failed',error:{message:error.message,code:error.code??null,stack:error.stack},actualModels:entries.length,actualReaders:readers,actualSDKBodies:bodies,canonicalNotifications:notifications,roleStopped,hostStopped});}
finally{
  gate.resolve();flushGate.resolve();
  const deadline=setTimeout(()=>{writeFileSync(join(run,'owner-stop-session-result.json'),JSON.stringify({...evidence,cleanup:'bounded-failure-not-stopped'},null,2)+'\n');process.exit(2);},8000);
  try{if(reopened)await reopened.close();if(role&&!roleStopped){role.lifetime.requestStop('unload');await role.lifetime.stopped;}else if(!role&&home)await home.close();if(!hostStopped){await shutdown.shutdown(0);hostStopped=true;}evidence.hostStopped=hostStopped;await writeFile(join(run,'owner-stop-session-result.json'),JSON.stringify(evidence,null,2)+'\n');}
  finally{clearTimeout(deadline);}
}
if(failure){console.error('Public Session lifetime tracer failed',failure);process.exitCode=2;}
else console.log('Real workspace archive cancellation retained body observation/canonical, then explicit owner-stop released Home.');
