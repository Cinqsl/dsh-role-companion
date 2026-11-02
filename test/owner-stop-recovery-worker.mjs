import assert from 'node:assert/strict';
import {join} from 'node:path';
import {readFile,writeFile,access} from 'node:fs/promises';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';
const run=process.env.DSH_TEST_RUN,phase=process.argv[2],stopId='stop-before-force-exit',events=[];
const result={case:'owner-stop-recovery',phase,status:'running',realBusinessCalls:0,events};
let role,home,readers=0,notifications=0,ready,admission;
const readerReady=new Promise(resolve=>ready=resolve);
function tools(){const frames=[{type:'message_start',message:{id:'stop-force',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_stop_force',name:'role_read',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset:0,limit:100})}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(frames.map(value=>`event: ${value.type}\ndata: ${JSON.stringify(value)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
const host=await bootNativeFixture(run,async entry=>{events.push({event:'actual-model-entry',ordinal:entry.ordinal});if(phase==='first')return tools();const stop=await home.readOperation(stopId),state=await home.readConversation();const nextModel=state.attempts.filter(attempt=>attempt.kind==='model').at(-1);const reservation=await home.readOperation('reserve-'+nextModel.attemptId);admission={stop,reservation,attempts:state.attempts.map(attempt=>({attemptId:attempt.attemptId,kind:attempt.kind,outcome:attempt.outcome?.kind,code:attempt.outcome?.code})),nativeGaps:state.nativeRecords.filter(record=>record.data?.kind==='native-exposure-gap')};return response('新栈继续，不重放旧工具。');},{reuse:phase==='recover'});
const {ctx,module,entries,shutdown}=host,{createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
let failure;
try{
 ctx.on('tools/result',exec=>{if(exec.name==='role_read')notifications++;});
 home=phase==='first'?await createRoleHome(join(run,'role'),{operationId:'stop-recovery-create',core:'已开始工具强退后只保留可核对缺口',settings:{inputLimitBytes:32768}}):await openRoleHome(join(run,'role'));
 const native=await createNativeExecution(ctx),execution=withNativeScope(native,(scope,plan)=>{result.runId=plan.turn.runId;result.deadline=plan.turn.deadline;result.inputIds=plan.turn.inputIds;return Object.freeze({...scope,roleRead:Object.freeze({...scope.roleRead,async read(request){readers++;const value=await scope.roleRead.read(request);if(phase==='first'){events.push('actual-reader-value-held');ready();await new Promise(()=>{});}return value;}})});});
 role=await startRole(home,{execution});result.roleId=home.roleId;
 if(phase==='first'){
  await role.runtime.receive(bound(home.roleId,'stop-force'));await readerReady;
  const receipt=await role.owner.stop({operationId:stopId}),state=await home.readConversation(),tool=state.attempts.find(attempt=>attempt.kind==='tool');assert.equal(receipt.kind,'committed');assert.equal(receipt.stop.checkpoint,'requested');assert.equal(tool.outcome,undefined);assert.equal(notifications,0);await access(join(run,'role/writer.lock'));
  Object.assign(result,{status:'forced-exit',pid:process.pid,exitCode:77,stopReceipt:receipt,attemptId:tool.attemptId,actualModels:entries.length,actualReaders:readers,canonicalNotifications:notifications,roleStopped:false,hostStopped:false});await writeFile(join(run,'stop-recovery-marker.json'),JSON.stringify(result,null,2)+'\n');process.exit(77);
 }
 const original=JSON.parse(await readFile(join(run,'stop-recovery-marker.json'),'utf8'));
 await waitFor(async()=>(await role.runtime.inspect()).home?.inputSummary.resolved===1);
 const state=await role.owner.readConversation(),old=state.attempts.find(attempt=>attempt.attemptId===original.attemptId);
 Object.assign(result,{admission,original,actualModels:entries.length,actualReaders:readers,canonicalNotifications:notifications,oldOutcome:old?.outcome,toolAttempts:state.attempts.filter(attempt=>attempt.kind==='tool').map(attempt=>attempt.attemptId)});
 assert.equal(result.roleId,original.roleId);assert.equal(result.runId,original.runId);assert.equal(state.turns[0].deadline,original.deadline);assert.equal(readers,0);assert.equal(notifications,0);assert.equal(entries.length,1);assert.equal(result.toolAttempts.length,1);assert.equal(old.outcome.code,'PROCESS_INTERRUPTED');
 assert.equal(Number.isSafeInteger(admission.stop.stop.reconciledRevision),true,'stop checkpoint must be durably reconciled before a new actual model request');assert.equal(admission.stop.stop.reconciledRevision<admission.reservation.committedRevision,true,'reconciliation precedes new budget reservation');assert.equal(admission.stop.stop.phase,'unverified','reconciliation is not proof that the killed lifetime stopped');assert.equal(admission.nativeGaps.length,1);
 const retry=await role.owner.stop({operationId:stopId});assert.equal(retry.kind,'committed');assert.equal((await role.runtime.inspect()).status,'ready','old stop operation retry must not stop the new lifetime');
 result.oldStopRetry=retry;result.status='passed';
}catch(error){failure=error;result.status='failed';result.error={name:error.name,code:error.code??null,message:error.message};}
finally{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}else if(home)await home.close();await shutdown.shutdown(0);result.hostStopped=true;await writeFile(join(run,'stop-recovery-result.json'),JSON.stringify(result,null,2)+'\n');}
if(failure){console.error('Stop recovery public tracer',failure);process.exitCode=2;}else console.log('Durable stop reconciliation precedes new paid inference; old actions are not replayed.');
