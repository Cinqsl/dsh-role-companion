import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access, readFile, readdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bootNativeFixture, response, waitFor, bound, withNativeScope} from './native-fixture.mjs';

// Agreed seams: same startRole/owner/lifetime, public issued reader decoration,
// SDK observers and HomeIO barriers. No SDK method, queue or commit is replaced.
const run = process.env.DSH_TEST_RUN;
const homePath = join(run,'role');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const partA = '片段 A：ALPHA αβ🌟\n'.repeat(700);
const partB = '片段 B：BRAVO γδ🌙\n'.repeat(700);
const core = partA+partB;
const expectedText = {A:partA, B:partB};
const calls = [
  {label:'A', callId:'toolu_parallel_spill_A', offset:0, limit:Array.from(partA).length},
  {label:'B', callId:'toolu_parallel_spill_B', offset:Array.from(partA).length, limit:Array.from(partB).length},
];
const labelFor = callId => calls.find(call => call.callId===callId)?.label;
const events = [];
const event = (kind, data={}) => events.push({index:events.length, kind, ...data});
const releases = Object.fromEntries(calls.map(call => [call.label, Promise.withResolvers()]));
const finalHold = Promise.withResolvers();
const readerValues = new Map();
const notifications = [];
const postOrder = [];
const bodyOrder = [];
const finalSaves = new Map();
const commits = [];
let activeReaders=0, maxReaders=0, actualReaders=0, actualBodies=0, actualPosts=0;
let finalHeld=false, role, reopened, stopped=false, hostStopped=false;

function toolResponse() {
  const frames=[{type:'message_start',message:{id:'parallel-spill-step',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}}];
  for (const [index,call] of calls.entries()) frames.push(
    {type:'content_block_start',index,content_block:{type:'tool_use',id:call.callId,name:'role_read',input:{}}},
    {type:'content_block_delta',index,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset:call.offset,limit:call.limit})}},
    {type:'content_block_stop',index},
  );
  frames.push({type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'});
  return new Response(frames.map(value=>`event: ${value.type}\ndata: ${JSON.stringify(value)}\n\n`).join(''), {headers:{'content-type':'text/event-stream'}});
}

const {ctx,module,entries,shutdown} = await bootNativeFixture(run, async entry => {
  event('actual-model-entry',{ordinal:entry.ordinal, finalSaves:finalSaves.size});
  if (entry.ordinal===1) return toolResponse();
  assert.equal(entry.ordinal,2,'no unexpected auxiliary/repeated model request');
  assert.equal(finalSaves.size,2,'second actual model must follow both durable final saves');
  const state=await role.owner.readConversation();
  const tools=state.attempts.filter(attempt=>attempt.kind==='tool');
  assert.equal(tools.length,2);
  for (const tool of tools) {
    assert.equal(tool.outcome.kind,'completed');
    assert.equal((await role.owner.readOperation('tool-final-'+tool.attemptId)).kind,'committed');
  }
  const blocks=entry.body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]);
  const results=blocks.filter(block=>block.type==='tool_result');
  assert.equal(results.length,2);
  for (const result of results) {
    const text=typeof result.content==='string'?result.content:result.content.map(block=>block.text??'').join('');
    const receipt=JSON.parse(text);
    assert.match(receipt.materialId,/^material-/);
    assert.equal(text.includes(join(run,'sdk-spill')),false);
    assert.equal(text.includes('role_read.txt'),false);
  }
  return response('两份完整原始经历已保存');
});
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home');
const {startRole}=await module('dsh-role-companion/runtime');
const {createNativeExecution}=await module('dsh-role-companion');
const {LocalSpillStore,sessionDir}=await module('@deepseek-ai/dsh-spill-local');

try {
  const local=ctx.configEditor.entries().find(entry=>entry.options.name==='@deepseek-ai/dsh-spill-local');
  const policy=ctx.configEditor.entries().find(entry=>entry.options.name==='@deepseek-ai/dsh-spill-policy');
  assert(local&&policy);
  await ctx.configEditor.edit(local,()=>({root:join(run,'sdk-spill'),cleanupPeriodDays:0}));
  await ctx.configEditor.edit(policy,()=>({maxInlineTokens:256}));
  assert(ctx.spillStore instanceof LocalSpillStore);

  // Observe dispatch without registering a new post producer: composition stays closed.
  ctx.on('internal/dispatch',(mode,name,args)=>{
    const exec=args[0];
    if (name!=='tools/post-execute'||exec?.name!=='role_read') return;
    const label=labelFor(exec.callId);
    assert(label);
    actualPosts++; postOrder.push(label);
    event('sdk-post-dispatch',{label,callId:exec.callId,sessionId:exec.agent.id,mode});
  },{global:true});
  ctx.on('tools/execute',async(exec,next)=>{
    if (exec.name!=='role_read') return next();
    const label=labelFor(exec.callId); assert(label);
    actualBodies++; event('sdk-body-entry',{label,callId:exec.callId});
    const result=await next();
    bodyOrder.push(label); event('sdk-body-completed',{label,callId:exec.callId});
    return result;
  });
  ctx.on('tools/result',(exec,result)=>{
    if (exec.name!=='role_read') return;
    const label=labelFor(exec.callId); assert(label);
    notifications.push({label,callId:exec.callId,sessionId:exec.agent.id,result:structuredClone(result)});
    event('sdk-canonical-notification',{label,callId:exec.callId});
  });
  ctx.on('session/event',(session,record)=>{
    if (!session.id.startsWith('dsh-role-companion-')||!['tool/call','tool/result'].includes(record.type)) return;
    const callId=record.type==='tool/call'?record.data.callId:record.data.message.source.callId;
    event('native-'+record.type,{sessionId:session.id,seq:record.seq,callId,label:labelFor(callId),turn:record.data.turn,step:record.data.step});
  });

  const home=await createRoleHome(homePath,{operationId:'parallel-spill-create',core,settings:{inputLimitBytes:32768}},{
    async barrier(stage,detail) {
      if (stage==='before-commit-publish'&&detail.operationId.startsWith('tool-final-')&&finalSaves.size===1) {
        finalHeld=true; event('second-final-save-held',{operationId:detail.operationId,revision:detail.revision});
        await finalHold.promise;
        event('second-final-save-released',{operationId:detail.operationId,revision:detail.revision});
      }
      if (stage==='after-head-sync') {
        commits.push({...detail});
        if (detail.operationId.startsWith('tool-final-')) {
          finalSaves.set(detail.operationId,detail.revision);
          event('durable-tool-final',{operationId:detail.operationId,revision:detail.revision});
        }
        if (detail.operationId.startsWith('capture-')) event('durable-material',{operationId:detail.operationId,revision:detail.revision});
      }
    },
  });
  const execution=withNativeScope(await createNativeExecution(ctx),scope=>Object.freeze({...scope,
    roleRead:Object.freeze({...scope.roleRead,async read(request) {
      const call=calls.find(value=>value.offset===request.offset); assert(call);
      actualReaders++; activeReaders++; maxReaders=Math.max(maxReaders,activeReaders);
      event('actual-reader-entry',{label:call.label,offset:request.offset});
      try {
        const value=await scope.roleRead.read(request);
        assert.equal(value.text,expectedText[call.label]);
        readerValues.set(call.label,structuredClone(value));
        event('actual-reader-value-ready',{label:call.label});
        await releases[call.label].promise;
        event('actual-reader-return',{label:call.label});
        return value;
      } finally { activeReaders--; }
    }}),
  }));
  role=await startRole(home,{execution});
  assert.equal((await role.runtime.inspect()).status,'ready');
  assert.equal((await role.owner.readReadRules()).value.toolConcurrency,2,'use the real persisted default');
  await role.runtime.receive(bound(home.roleId,'parallel-spill'));
  await waitFor(()=>readerValues.size===2);
  assert.equal(actualReaders,2); assert.equal(maxReaders,2); assert.equal(actualBodies,2);
  releases.B.resolve();
  await waitFor(()=>bodyOrder.length===1);
  assert.deepEqual(bodyOrder,['B']);
  assert.equal(actualPosts,0,'B completion must not overtake model-order A post slot');
  assert.equal(notifications.length,0);
  releases.A.resolve();
  await waitFor(()=>finalHeld);
  assert.deepEqual(bodyOrder,['B','A']);
  assert.deepEqual(postOrder,['A','B']);
  assert.deepEqual(notifications.map(value=>value.label),['A','B']);
  assert.equal(entries.length,1,'second actual model waits while final B save is held');
  assert.equal(finalSaves.size,1);
  event('held-final-assertions-confirmed');
  finalHold.resolve();
  await waitFor(async()=>(await role.runtime.inspect()).home?.inputSummary.resolved===1);

  const state=await role.owner.readConversation();
  const tools=state.attempts.filter(attempt=>attempt.kind==='tool');
  assert.equal(tools.length,2); assert.equal(entries.length,2); assert.equal(actualPosts,2);
  const sessionId=notifications[0].sessionId;
  const directory=sessionDir(ctx.spillStore.root,sessionId);
  const artifacts=await Promise.all((await readdir(directory)).map(async name=>{
    const bytes=await readFile(join(directory,name));
    return {name,bytes:bytes.length,digest:sha(bytes),text:new TextDecoder('utf-8',{fatal:true}).decode(bytes)};
  }));
  assert.equal(artifacts.length,2);
  const records=[];
  for (const call of calls) {
    const tool=tools.find(attempt=>attempt.observation?.value?.offset===call.offset); assert(tool);
    assert.equal(tool.readRules.value.toolConcurrency,2);
    assert.equal(tool.materials.length,1);
    const material=tool.materials[0];
    const expectedValue={...readerValues.get(call.label),toolAttemptId:tool.attemptId};
    const json=JSON.stringify(expectedValue);
    assert.equal(JSON.stringify(tool.observation.value),json);
    assert.equal(material.text,json,'Home material must contain that call full observation JSON');
    const artifact=artifacts.find(value=>value.text===json); assert(artifact);
    assert.equal(material.bytes,Buffer.byteLength(json,'utf8'));
    assert.equal(material.bytes,artifact.bytes); assert.equal(material.digest,artifact.digest);
    const final=tool.outcome.data.result.final;
    assert.equal(tool.outcome.kind,'completed'); assert.equal(final.isError,false);
    assert.deepEqual(final.value,expectedValue,'canonical value preserves every original reader field and the actual Home parent tool anchor after SDK spill');
    const notified=notifications.find(value=>value.label===call.label);
    assert.deepEqual(notified.result.value,expectedValue);
    assert.deepEqual(notified.result.content,final.content);
    const content=final.content.map(block=>block.text??'').join('');
    const safe=JSON.parse(content);
    assert.deepEqual(safe,{source:'sdk-local-spill',materialId:material.materialId,bytes:material.bytes,digest:material.digest,toolAttemptId:tool.attemptId});
    assert.equal(content.includes(directory),false); assert.equal(content.includes(artifact.name),false);
    assert.equal(content.includes(expectedText[call.label]),false);
    const operationId='tool-final-'+tool.attemptId;
    const receipt=await role.owner.readOperation(operationId); assert.equal(receipt.kind,'committed');
    assert.equal(finalSaves.get(operationId),receipt.committedRevision);
    const native=events.filter(value=>value.callId===call.callId&&value.kind.startsWith('native-'));
    assert.deepEqual(native.map(value=>value.kind),['native-tool/call','native-tool/result']);
    records.push({label:call.label,callId:call.callId,attemptId:tool.attemptId,materialId:material.materialId,materialSource:material.source,bytes:material.bytes,digest:material.digest,artifactName:artifact.name,observationDigest:sha(Buffer.from(json,'utf8')),finalRevision:receipt.committedRevision,native: native.map(({kind,seq,turn,step})=>({kind,seq,turn,step})),canonicalValueComplete:true,safeContent:safe});
  }
  assert.notEqual(records[0].digest,records[1].digest);
  const nativeCalls=events.filter(value=>value.kind==='native-tool/call');
  assert.equal(nativeCalls.length,2);
  assert(nativeCalls.every(value=>Number.isSafeInteger(value.turn)&&Number.isSafeInteger(value.step)));
  assert.equal(new Set(nativeCalls.map(value=>value.turn+':'+value.step)).size,1,'both tools originate in the same real native step');
  assert.deepEqual(nativeCalls.map(value=>value.label),['A','B']);
  const index=(kind,label)=>events.find(value=>value.kind===kind&&(label===undefined||value.label===label))?.index;
  assert(index('actual-reader-return','B')<index('actual-reader-return','A'));
  assert(index('sdk-post-dispatch','A')<index('sdk-canonical-notification','A'));
  assert(index('sdk-canonical-notification','A')<index('native-tool/result','A'));
  assert(index('native-tool/result','A')<index('sdk-post-dispatch','B'));
  assert(index('sdk-post-dispatch','B')<index('sdk-canonical-notification','B'));
  assert.equal(finalSaves.size,2);
  const model2=events.find(value=>value.kind==='actual-model-entry'&&value.ordinal===2);
  assert(events.filter(value=>value.kind==='durable-tool-final').every(value=>value.index<model2.index));
  const turn=state.turns[0]; assert.equal(turn.status,'finished');
  role.lifetime.requestStop('unload'); await role.lifetime.stopped; stopped=true;
  event('role-stopped');
  await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');
  reopened=await openRoleHome(homePath);
  const restored=await reopened.readConversation();
  assert.deepEqual(restored.attempts.filter(attempt=>attempt.kind==='tool'),tools);
  assert.equal(restored.replies.length,1);
  await reopened.close(); reopened=undefined;
  await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');
  await shutdown.shutdown(0); hostStopped=true;
  event('host-stopped');
  const report={status:'passed',case:'same-startRole-parallel-native-spill',roleId:home.roleId,runId:turn.runId,sessionId,revision:state.revision,inlineTokens:256,backend:'exact LocalSpillStore',actualModelEntries:entries.length,actualReaderEntries:actualReaders,maxConcurrentReaders:maxReaders,actualSDKBodies:actualBodies,actualPostDispatches:actualPosts,canonicalNotifications:notifications.length,readerCompletionOrder:bodyOrder,postOrder,finalOrder:notifications.map(value=>value.label),records,commits,events,finalBSaveWasHeld:true,secondModelSawBothFinalReceipts:true,reopened:true,writerLockAbsent:true,hostStopped:true,externalBusinessCalls:0};
  await writeFile(join(run,'parallel-spill-result.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Same-role parallel native spill: B body first; A/B ordered post/final; two exact Home materials; both finals before model 2; stopped and reopened.');
} catch(error) {
  await writeFile(join(run,'parallel-spill-failure.json'),JSON.stringify({message:error.message,stack:error.stack,events,counts:{models:entries.length,readers:actualReaders,bodies:actualBodies,posts:actualPosts,notifications:notifications.length,finalSaves:finalSaves.size}},null,2)+'\n');
  throw error;
} finally {
  releases.A.resolve(); releases.B.resolve(); finalHold.resolve();
  if (reopened) await reopened.close();
  if (role&&!stopped) { role.lifetime.requestStop('unload'); await role.lifetime.stopped; }
  if (!hostStopped) await shutdown.shutdown(0);
}
