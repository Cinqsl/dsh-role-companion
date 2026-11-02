import assert from 'node:assert/strict';
import {join} from 'node:path';
import {writeFileSync,appendFileSync,readdirSync,readFileSync} from 'node:fs';
import {access,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';

// Approved boundaries only: installed Native + same startRole, issued reader,
// SDK observers, HomeIO, and public Home recovery. No SDK/product method patches.
const [window,phase]=process.argv.slice(2),run=process.env.DSH_TEST_RUN;
assert(['observation','capture','finish','repeat-callid'].includes(window));
assert(['first','recover'].includes(phase));
const homePath=join(run,'role');
const core='强退窗口：完整原始资料 αβ🌟\n'.repeat(700);
const finalReply='原始工具结果已经保存；恢复后继续完成本组。';
const callId='toolu_process_crash_'+window;
const sha=value=>createHash('sha256').update(value).digest('hex');
const events=[];
const event=(kind,data={})=>{const row={index:events.length,kind,...data};events.push(row);appendFileSync(join(run,phase+'-tool-events.jsonl'),JSON.stringify(row)+'\n');};
let actualReaders=0,actualBodies=0,notifications=0,actualPosts=0;
let role,home,reopened,plan,originalObservation,sessionId,stopped=false,hostStopped=false,diagnostic;

function toolResponse(){
  const frames=[{type:'message_start',message:{id:'tool-crash-step',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},
    {type:'content_block_start',index:0,content_block:{type:'tool_use',id:callId,name:'role_read',input:{}}},
    {type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset:0,limit:Array.from(core).length})}},
    {type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];
  return new Response(frames.map(value=>`event: ${value.type}\ndata: ${JSON.stringify(value)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});
}
const host=await bootNativeFixture(run,entry=>{
  event('actual-model-entry',{ordinal:entry.ordinal});
  if(phase==='first'&&(entry.ordinal===1||window==='repeat-callid'&&entry.ordinal===2))return toolResponse();
  assert(entry.ordinal<=(phase==='first'?(window==='repeat-callid'?3:2):1),'unexpected model replay');
  return response(finalReply); // A new recovery inference never requests a tool.
},{reuse:phase==='recover'});
const {ctx,module,entries,shutdown}=host;
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home');
const {startRole}=await module('dsh-role-companion/runtime');
const {createNativeExecution}=await module('dsh-role-companion');
const {LocalSpillStore,sessionDir}=await module('@deepseek-ai/dsh-spill-local');

function forceExit(stage,detail){
  assert(originalObservation&&plan&&sessionId);
  const directory=sessionDir(ctx.spillStore.root,sessionId);
  let names=[];
  try{names=readdirSync(directory);}catch(error){if(error.code!=='ENOENT')throw error;}
  const artifacts=names.map(name=>{const bytes=readFileSync(join(directory,name));return {name,bytes:bytes.length,digest:sha(bytes)};});
  const marker={window,phase,pid:process.pid,exitCode:77,orderlyStop:false,stage,...detail,roleId:home.roleId,runId:plan.turn.runId,bindingId:plan.turn.bindingId,bindingVersion:plan.turn.bindingVersion,inputIds:plan.turn.inputIds,deadline:plan.turn.deadline,sessionId,actualModels:entries.length,actualReaders,actualSDKBodies:actualBodies,actualPostDispatches:actualPosts,canonicalNotifications:notifications,observation:originalObservation,artifacts,events};
  writeFileSync(join(run,'tool-crash-marker.json'),JSON.stringify(marker,null,2)+'\n');
  process.exit(77); // Deliberate forced termination: no finally, flush or lifetime stop.
}

try{
  const local=ctx.configEditor.entries().find(entry=>entry.options.name==='@deepseek-ai/dsh-spill-local');
  const policy=ctx.configEditor.entries().find(entry=>entry.options.name==='@deepseek-ai/dsh-spill-policy');
  assert(local&&policy);
  await ctx.configEditor.edit(local,()=>({root:join(run,'sdk-spill'),cleanupPeriodDays:0}));
  await ctx.configEditor.edit(policy,()=>({maxInlineTokens:256}));
  assert(ctx.spillStore instanceof LocalSpillStore);
  ctx.on('tools/execute',async(exec,next)=>{
    if(exec.name==='role_read'){actualBodies++;sessionId=exec.agent.id;event('actual-sdk-body-entry',{callId:exec.callId,sessionId});}
    return next();
  });
  ctx.on('internal/dispatch',(_mode,name,args)=>{
    if(name==='tools/post-execute'&&args[0]?.name==='role_read'){actualPosts++;event('actual-sdk-post',{callId:args[0].callId});}
  },{global:true});
  ctx.on('tools/result',(exec,result)=>{
    if(exec.name==='role_read'){notifications++;event('canonical-notification',{callId:exec.callId,isError:result.isError});}
  });
  ctx.on('session/event',(session,record)=>{
    if(!session.id.startsWith('dsh-role-companion-')||!['tool/call','tool/result'].includes(record.type))return;
    event('native-'+record.type,{seq:record.seq,turn:record.data.turn,step:record.data.step,sourceEventSeqs:record.sourceEventSeqs??null,callId:record.type==='tool/call'?record.data.callId:record.data.message.source.callId,sessionId:session.id});
  });
  home=phase==='first'?await createRoleHome(homePath,{operationId:'tool-crash-create',core,settings:{inputLimitBytes:32768}},{
    async barrier(stage,detail){
      if(stage!=='after-head-sync')return;
      event('durable-home-operation',{operationId:detail.operationId,revision:detail.revision});
      const selected=window==='observation'||window==='repeat-callid'?'tool-observation-':window==='capture'?'capture-':'finish-';
      if(detail.operationId.startsWith(selected)&&(window!=='repeat-callid'||actualReaders===2))forceExit(stage,detail);
    },
  }):await openRoleHome(homePath);
  const before=phase==='recover'?await home.readConversation():undefined;
  const prior=phase==='recover'?JSON.parse(await readFile(join(run,'tool-crash-marker.json'),'utf8')):undefined;
  const oldTool=before?.attempts.filter(attempt=>attempt.kind==='tool').at(-1);
  const expectedObservation=oldTool?{...prior.observation,toolAttemptId:oldTool.attemptId}:undefined;
  if(phase==='recover'){
    assert(oldTool&&oldTool.enteredAt,'old actual tool reservation must survive');
    assert.equal(prior.actualReaders,window==='repeat-callid'?2:1);assert.equal(prior.actualSDKBodies,window==='repeat-callid'?2:1);
    assert.equal(prior.runId,before.turns[0].runId);
    assert.equal(prior.deadline,before.turns[0].deadline);
    assert.deepEqual(oldTool.observation.value,expectedObservation,'durable observation retains the complete issued reader value and its actual tool attempt anchor');
    assert.equal(oldTool.observation.value.text,core);
    assert.equal(oldTool.materials?.length??0,['observation','repeat-callid'].includes(window)?0:1);
    if(window!=='finish'){
      assert.equal(oldTool.outcome,undefined,'canonical final was not committed at this window');
      assert.equal(before.turns[0].status,'running');
      assert.equal(before.replies.length,0);
      assert.equal(prior.canonicalNotifications,window==='repeat-callid'?1:0);
    }else{
      assert.equal(oldTool.outcome.kind,'completed');
      assert.equal(before.turns[0].status,'finished');
      assert.equal(before.replies.length,1);
      assert.equal(before.replies[0].text,finalReply);
      assert.equal(prior.canonicalNotifications,1);
    }
  }
  const execution=withNativeScope(await createNativeExecution(ctx),(scope,currentPlan)=>{
    plan=currentPlan;
    return Object.freeze({...scope,roleRead:Object.freeze({...scope.roleRead,async read(request){
      actualReaders++;event('actual-reader-entry',{offset:request.offset,limit:request.limit});
      const value=await scope.roleRead.read(request);originalObservation=structuredClone(value);
      assert.equal(value.text,core);return value;
    }})});
  });
  role=await startRole(home,{execution});
  assert.equal((await role.runtime.inspect()).status,'ready');
  if(phase==='first')await role.runtime.receive(bound(home.roleId,'tool-crash-'+window));
  await waitFor(async()=>(await role.runtime.inspect()).home?.inputSummary.resolved===1);
  if(phase==='first')throw Error('Expected forced exit window did not occur');
  const state=await role.owner.readConversation();
  const recoveredTool=state.attempts.find(attempt=>attempt.attemptId===oldTool.attemptId);
  assert.equal(state.attempts.filter(attempt=>attempt.kind==='tool').length,window==='repeat-callid'?2:1,'no new tool reservation or automatic original-action replay');
  assert.equal(actualReaders,0);assert.equal(actualBodies,0);assert.equal(notifications,0);assert.equal(actualPosts,0);
  assert.equal(state.turns.length,1);assert.equal(state.turns[0].runId,prior.runId);assert.equal(state.turns[0].deadline,prior.deadline);
  assert.equal(state.turns[0].startedAt,before.turns[0].startedAt);
  assert.equal(Date.parse(state.turns[0].deadline)-Date.parse(state.turns[0].startedAt),600000,'recovery retains the original default ten-minute window');
  assert.equal(recoveredTool.enteredAt,oldTool.enteredAt);
  assert.deepEqual(recoveredTool.observation,oldTool.observation);
  assert.deepEqual(recoveredTool.materials,oldTool.materials);
  const oldModelIds=before.attempts.filter(attempt=>attempt.kind==='model').map(attempt=>attempt.attemptId);
  const newModels=state.attempts.filter(attempt=>attempt.kind==='model'&&!oldModelIds.includes(attempt.attemptId));
  assert.equal(entries.length,window==='finish'?0:1);
  assert.equal(newModels.length,entries.length,'re-inference consumes a distinct retained model reservation');
  assert.equal(state.attempts.length,before.attempts.length+newModels.length);
  for(const old of before.attempts.filter(attempt=>attempt.kind==='model'))assert.deepEqual(state.attempts.find(attempt=>attempt.attemptId===old.attemptId),old);
  assert(newModels.every(attempt=>attempt.enteredAt));
  const gaps=state.nativeRecords.filter(record=>record.data?.kind==='native-exposure-gap');
  if(window==='repeat-callid'){
    const nativeCalls=before.nativeRecords.filter(record=>record.provenance==='native-session'&&record.data.type==='tool/call');
    const sdkCalls=prior.events.filter(record=>record.kind==='native-tool/call');
    const sdkResults=prior.events.filter(record=>record.kind==='native-tool/result');
    assert.equal(nativeCalls.length,2);assert.equal(sdkCalls.length,2);assert.equal(sdkResults.length,1);
    assert.equal(new Set(sdkCalls.map(record=>record.callId)).size,1);
    assert.notEqual(sdkCalls[0].seq,sdkCalls[1].seq);assert.notEqual(sdkCalls[0].step,sdkCalls[1].step);
    assert.deepEqual(sdkResults[0].sourceEventSeqs,[sdkCalls[0].seq],'first closed result only cites the first actual tool call');
    diagnostic={sdkCalls,sdkResults,expectedSecondGapSourceNativeId:nativeCalls[1].nativeId,actualGaps:gaps.map(record=>record.data),homeNative:before.nativeRecords.filter(record=>record.provenance==='native-session').map(record=>({nativeId:record.nativeId,type:record.data.type,seq:record.data.seq,turn:record.data.data?.turn,step:record.data.data?.step,sourceEventSeqs:record.data.sourceEventSeqs??null})),secondAttempt:{attemptId:recoveredTool.attemptId,outcome:recoveredTool.outcome.kind,code:recoveredTool.outcome.code}};
    assert(gaps.some(record=>record.data.sourceNativeId===nativeCalls[1].nativeId),'second same-callId occurrence requires its own native-exposure-gap; the first closed result cannot close it');
    assert.equal(gaps.some(record=>record.data.sourceNativeId===nativeCalls[0].nativeId),false);
    const firstTool=before.attempts.filter(attempt=>attempt.kind==='tool')[0];
    assert.deepEqual(state.attempts.find(attempt=>attempt.attemptId===firstTool.attemptId),firstTool);
  }
  if(window!=='finish'){
    assert.equal(recoveredTool.outcome.kind,'failed');assert.equal(recoveredTool.outcome.code,'PROCESS_INTERRUPTED');
    assert.equal(recoveredTool.outcome.data?.result?.final,undefined,'missing canonical value must not be fabricated from observation/material');
    assert(gaps.some(record=>record.data.callId===callId&&record.data.reason==='PROCESS_INTERRUPTED'&&record.data.toolAdmission==='unavailable'));
    assert.equal(state.nativeRecords.filter(record=>record.provenance==='tools-result').length,window==='repeat-callid'?1:0);
  }else{
    assert.deepEqual(state.attempts,before.attempts,'saved finish requires no replacement attempt');
    assert.deepEqual(state.replies,before.replies,'saved reply ID, text and original binding stay unchanged');
    assert.deepEqual(state.turns,before.turns);
  }
  assert.equal(state.replies.length,1);
  const reply=state.replies[0];
  assert.equal((await role.owner.readReply({replyId:reply.replyId,offset:0,limit:1000})).text,finalReply);
  assert.equal(reply.bindingId,prior.bindingId);assert.equal(reply.bindingVersion,prior.bindingVersion);
  const materials=[];
  for(const material of recoveredTool.materials??[]){
    const text=JSON.stringify(expectedObservation);assert.equal(material.text,text);assert.equal(material.bytes,Buffer.byteLength(text,'utf8'));assert.equal(material.digest,sha(Buffer.from(text,'utf8')));
    assert(prior.artifacts.some(artifact=>artifact.bytes===material.bytes&&artifact.digest===material.digest));
    materials.push({materialId:material.materialId,source:material.source,bytes:material.bytes,digest:material.digest});
  }
  role.lifetime.requestStop('unload');await role.lifetime.stopped;stopped=true;event('role-stopped');
  await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');
  reopened=await openRoleHome(homePath);const confirmed=await reopened.readConversation();assert.deepEqual(confirmed.attempts,state.attempts);assert.deepEqual(confirmed.replies,state.replies);await reopened.close();reopened=undefined;
  await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');
  await shutdown.shutdown(0);hostStopped=true;event('host-stopped');
  assert.equal(entries.length,window==='finish'?0:1);assert.equal(actualReaders,0);assert.equal(actualBodies,0);
  const {observation,...first}=prior;
  const report={status:'passed',case:'35-tool-crash-'+window,window,roleId:home.roleId,runId:prior.runId,turnWindow:{source:state.turns[0].source,startedAt:state.turns[0].startedAt,deadline:prior.deadline,durationMs:600000,settingsVersion:state.turns[0].settingsVersion},first:{...first,readerValueBytes:Buffer.byteLength(JSON.stringify(observation),'utf8'),readerValueDigest:sha(Buffer.from(JSON.stringify(observation),'utf8')),observationBytes:Buffer.byteLength(JSON.stringify(expectedObservation),'utf8'),observationDigest:sha(Buffer.from(JSON.stringify(expectedObservation),'utf8')),observedToolAttemptId:oldTool.attemptId},recovery:{pid:process.pid,actualModels:entries.length,actualReaders,actualSDKBodies:actualBodies,actualPostDispatches:actualPosts,canonicalNotifications:notifications,beforeRevision:before.revision,revision:state.revision,reservationsBefore:before.attempts.length,reservationsAfter:state.attempts.length,oldModelAttemptIds:oldModelIds,newModelAttemptIds:newModels.map(attempt=>attempt.attemptId),oldToolAttemptId:oldTool.attemptId,oldToolEnteredAt:oldTool.enteredAt,oldToolOutcome:{kind:recoveredTool.outcome.kind,code:recoveredTool.outcome.code??null,canonicalValueAvailable:recoveredTool.outcome.data?.result?.final?.value!==undefined},toolReservations:state.attempts.filter(attempt=>attempt.kind==='tool').length,observationPreserved:true,materials,gaps:gaps.map(record=>({nativeId:record.nativeId,data:record.data})),replyId:reply.replyId,bindingId:reply.bindingId,bindingVersion:reply.bindingVersion,replyDigest:sha(Buffer.from(reply.text,'utf8')),savedReplyRegenerated:false,hostStopped:true,writerLockAbsent:true,publicReopen:true,events},externalBusinessCalls:0,fullAcceptanceCasesPassed:[]};
  if(diagnostic)report.diagnostic=diagnostic;
  await writeFile(join(run,'tool-crash-result.json'),JSON.stringify(report,null,2)+'\n');
  console.log('New-process native tool crash recovery passed:',window);
}catch(error){
  await writeFile(join(run,phase+'-tool-crash-failure.json'),JSON.stringify({phase,window,message:error.message,stack:error.stack,diagnostic,events,actualModels:entries.length,actualReaders,actualBodies,notifications},null,2)+'\n');
  throw error;
}finally{
  if(reopened)await reopened.close();
  if(role&&!stopped){role.lifetime.requestStop('unload');await role.lifetime.stopped;}
  else if(!role&&home)await home.close();
  if(!hostStopped)await shutdown.shutdown(0);
}
