import assert from 'node:assert/strict';
import {access,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';

const run=process.env.DSH_TEST_RUN,source=join(run,'role'),destination=join(run,'backup'),contextRevoke=process.argv.includes('--context-revoke');
const deferred=()=>{let release;return {promise:new Promise(resolve=>release=resolve),release:()=>release()};};
const finalGate=deferred(),finalReached=deferred(),flushGate=deferred(),flushReached=deferred(),copyGate=deferred(),copyReached=deferred();
const order=[],idle=new Set(),nativeResults=new Set();
const evidence={case:'backup54-native-final-flush',status:'running',productCheckpoint:process.env.DSH54_PRODUCT_REVISION??'fixture package from this worktree',realBusinessCalls:{model:0,web:0,qq:0},order};
let role,home,failure,readers=0,toolBodies=0,canonicalFinals=0,copyEntries=0,requiredFlushHeld=false,stopped=false,toolSignal;
const event=(kind,data={})=>order.push({at:new Date().toISOString(),kind,...data});
async function save(){await writeFile(join(run,'backup-native-result.json'),JSON.stringify(evidence,null,2)+'\n');}
function toolResponse(){
 const frames=[{type:'message_start',message:{id:'backup54-read',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_backup54_read',name:'role_read',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset:0,limit:200})}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];
 return new Response(frames.map(frame=>`event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});
}
const {ctx,module,entries,metadataEntries,shutdown}=await bootNativeFixture(run,entry=>entry.ordinal===1?toolResponse():response('备份请求后不能发起后继模型'));
const {createRoleHome,verifyRoleBackup}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
try{
 ctx.on('tools/execute',async(exec,next)=>{
  if(exec.name!=='role_read')return next();toolBodies++;toolSignal=exec.signal;event('actual-sdk-tool-entry');
  const result=await next();event('real-observation-returned');finalReached.release();await finalGate.promise;event('sdk-wrapper-released',{signalAborted:exec.signal.aborted});return result;
 });
 ctx.on('tools/result',exec=>{if(exec.name==='role_read'){canonicalFinals++;event('actual-sdk-canonical-final');}});
 ctx.on('agent/status',({agent,status})=>{if(status==='idle'){idle.add(agent.session);event('actual-native-idle');}});
 ctx.on('session/event',(session,message)=>{if(message.type==='tool/result'){nativeResults.add(session);event('actual-native-tool-result',{seq:message.seq});}});
 ctx.on('session/flush',async session=>{
  if(requiredFlushHeld||!idle.has(session)||!nativeResults.has(session))return;
  requiredFlushHeld=true;event('required-flush-held');flushReached.release();await flushGate.promise;event('required-flush-released');
 });
 home=await createRoleHome(source,{operationId:'backup-native-create',core:'完整工具观察和最终结果保存后才能备份。',settings:{inputLimitBytes:32768}},{barrier:async stage=>{
  if(stage==='before-backup-file'&&copyEntries++===0){event('actual-copy-first-file-held');copyReached.release();await copyGate.promise;event('actual-copy-first-file-released');}
 }});
 const native=await createNativeExecution(ctx);assert(native);
 const execution=withNativeScope(native,(scope,plan)=>{
  evidence.runId=plan.turn.runId;evidence.inputIds=plan.turn.inputIds;
  return Object.freeze({...scope,roleRead:Object.freeze({...scope.roleRead,read(request){readers++;event('actual-reader');return scope.roleRead.read(request);}})});
 });
 execution.dispose=async()=>{
  await assert.rejects(access(join(source,'writer.lock')),error=>error.code==='ENOENT');event('native-dispose-after-home-release');await native.dispose();event('native-observers-disposed');
 };
 role=await startRole(home,{execution});role.lifetime.stopped.then(()=>{stopped=true;event('actual-role-stopped');});
 const rules=await role.owner.readReadRules();
 await role.owner.apply({kind:'edit-read-rules',operationId:'backup-native-timeout',value:{...rules.value,readTimeoutMs:120000},expectedReadRulesVersion:rules.version,expectedRevision:rules.revision});
 evidence.roleId=home.roleId;evidence.inputReceipt=await role.runtime.receive(bound(home.roleId,'backup-native-held'));
 await finalReached.promise;assert.equal(toolBodies,1);assert.equal(canonicalFinals,0);assert.equal(readers,1);assert.equal(toolSignal.aborted,false);
 const observation=await home.readConversation(),toolBefore=observation.attempts.find(attempt=>attempt.kind==='tool');assert.equal(toolBefore.observation.kind,'returned');
 if(contextRevoke){const reader=await home.openContextReader({purpose:'management'});evidence.oldSourceBasis=reader.basis;const snapshot=await home.readSnapshot();evidence.sourceChange=await role.owner.apply({kind:'edit-core',operationId:'backup-context-change45',text:'用户管理的新核心；旧工具配对仍完整保存但不重用旧上下文。',expectedCoreVersion:snapshot.core.version,expectedRevision:snapshot.revision});await assert.rejects(reader.read({kind:'core'}),{code:'CONTEXT_SNAPSHOT_STALE'});evidence.oldSourceRevoked=true;event('source-revoked-before-backup');}
 evidence.request={operationId:'backup-native-owner',destination};event('owner-backup-request');
 evidence.receipt=await role.owner.requestBackup(evidence.request);assert.equal(evidence.receipt.phase,'stopping');
 assert.equal((await role.runtime.receive(bound(home.roleId,'after-backup'))).kind,'rejected');
 assert.equal((await role.runtime.inspect()).status,'stopping');assert.equal(stopped,false);assert.equal(copyEntries,0);assert.equal(canonicalFinals,0);assert.equal(toolSignal.aborted,false);
 await access(join(source,'writer.lock'));await assert.rejects(access(destination),error=>error.code==='ENOENT');
 evidence.heldBeforeFinal=await role.owner.readBackup(evidence.request.operationId);await save();
 finalGate.release();await flushReached.promise;
 evidence.heldAtFlush=await role.owner.readBackup(evidence.request.operationId);assert.equal(evidence.heldAtFlush.phase,'stopping');assert.equal(stopped,false);assert.equal(copyEntries,0);assert.equal(canonicalFinals,1);assert.equal(entries.length,1);await access(join(source,'writer.lock'));await save();
 flushGate.release();await copyReached.promise;
 assert.equal(stopped,true);assert.equal((await role.runtime.inspect()).status,'stopped');await assert.rejects(access(join(source,'writer.lock')),error=>error.code==='ENOENT');await access(join(source,'.maintenance.lock'));
 evidence.heldDuringCopy=await role.owner.readBackup(evidence.request.operationId);assert.equal(evidence.heldDuringCopy.phase,'copying');
 const disposedIndex=order.findIndex(entry=>entry.kind==='native-observers-disposed'),copyIndex=order.findIndex(entry=>entry.kind==='actual-copy-first-file-held');assert(disposedIndex>=0&&disposedIndex<copyIndex,'Copy must begin after actual lifetime and observers have settled');
 copyGate.release();await waitFor(async()=>{const value=await role.owner.readBackup(evidence.request.operationId);if(value.phase==='failed'||value.phase==='uncertain')throw Error(JSON.stringify(value));if(value.phase==='verified-restorable'){evidence.verified=value;return true;}return false;});
 await waitFor(async()=>{try{await access(join(source,'.maintenance.lock'));return false;}catch(error){if(error.code==='ENOENT')return true;throw error;}});
 const checked=await verifyRoleBackup(destination,{expectedRoleId:home.roleId,operationId:evidence.request.operationId});assert.equal(checked.sourceRevision,evidence.verified.sourceRevision);
 const child=spawnSync(process.execPath,[new URL('./backup-native-read-worker.mjs',import.meta.url).pathname,destination,home.roleId],{encoding:'utf8',env:{PATH:process.env.PATH},timeout:15000});
 evidence.freshRead={exitCode:child.status,signal:child.signal,error:child.error?.message??null};assert.equal(child.error,undefined,child.stderr);assert.equal(child.status,0,child.stderr);const saved=JSON.parse(child.stdout.trim());
 assert.equal(saved.snapshot.roleId,home.roleId);assert.equal(saved.snapshot.revision,evidence.verified.sourceRevision);
 if(contextRevoke){assert.equal(saved.snapshot.core.text,'用户管理的新核心；旧工具配对仍完整保存但不重用旧上下文。');assert.equal(saved.snapshot.contextGeneration,2);evidence.newSourcePreserved=true;}
 assert.equal(saved.conversation.attempts.length,2);assert.equal(saved.conversation.attempts.filter(attempt=>attempt.kind==='model').length,1);
 const tool=saved.conversation.attempts.find(attempt=>attempt.kind==='tool');assert.equal(tool.observation.kind,'returned');assert.equal(tool.observation.value.text,'完整工具观察和最终结果保存后才能备份。');assert.equal(tool.outcome.data.result.final.isError,false);assert.equal(tool.outcome.data.result.final.value.text,tool.observation.value.text);assert.equal(tool.readRules.value.readTimeoutMs,120000);
 assert.equal(entries.length,1);assert.equal(readers,1);assert.equal(toolBodies,1);assert.equal(canonicalFinals,1);assert.equal(metadataEntries.length,0);
 assert.deepEqual(await role.owner.resumeBackup(evidence.request),evidence.verified);
 const checkedAgain=await verifyRoleBackup(destination,{expectedRoleId:home.roleId,operationId:evidence.request.operationId});assert.equal(checkedAgain.manifestDigest,checked.manifestDigest);
 Object.assign(evidence,{status:'passed',copyRead:saved,actualModels:entries.length,actualReaders:readers,actualToolBodies:toolBodies,canonicalFinals,metadataEntries:metadataEntries.length,roleStopped:stopped,sourceWriterLockReleased:true,sourceMaintenanceLeaseReleased:true,freshReadScope:'Public Home reads in a new process; no Runtime/native activation or #55 handoff',initialTracer:'Coverage of the already implemented8a65 public behavior; no fabricated new RED'});
}catch(error){failure=error;evidence.status='failed';evidence.error={name:error.name,code:error.code??null,message:error.message};await save();}
finally{
 finalGate.release();flushGate.release();copyGate.release();
 if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}else if(home)await home.close();
 await shutdown.shutdown(0);evidence.hostStopped=true;await save();
}
if(failure){console.error('Native backup final/flush tracer failed',failure);process.exitCode=2;}else console.log('Actual canonical result, required flush, Home and Native disposal precede consistent backup.');
