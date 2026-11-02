import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';
const run=process.env.DSH_TEST_RUN,mode=process.argv[2]??'race',order=[];
const event=(name,data={})=>{const item={ordinal:order.length+1,name,...data};order.push(item);console.log('[archive-diagnostic]',JSON.stringify(item));};
const report={mode,diagnosticOriginRevision:'50ef1372f0c2116b8aa74d253d2d6e1b9510e5f8',productRevision:process.env.DSH_TEST_PRODUCT_REVISION??null,order,realBusinessCalls:0,privateArchiveAccess:false,productionChanges:false};
let role,home,host,closureCalls=0,registered=0,bodies=0,notified=0,allowRepair=false,stopped=false;
let releaseFirst,releaseSecond;
const firstGate=new Promise(r=>releaseFirst=r),secondGate=new Promise(r=>releaseSecond=r);
const lock=async()=>access(join(run,'role/writer.lock')).then(()=>true,e=>e.code==='ENOENT'?false:Promise.reject(e));
const describe=e=>({code:e?.code??null,errorName:e?.name??null,message:String(e?.message??e)});
function toolResponse(){const frames=[{type:'message_start',message:{id:'archive-read',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_archive_read',name:'role_read',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset:0,limit:1000})}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(frames.map(v=>`event: ${v.type}\ndata: ${JSON.stringify(v)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
try{
 host=await bootNativeFixture(run,entry=>{event('model-transport',{entry:entry.ordinal});return entry.ordinal===1?toolResponse():response('不得因保存修复再次执行');});
 const {ctx,module,entries}=host;
 const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
 ctx.on('tools/execute',async(exec,next)=>{if(exec.name==='role_read'){bodies++;event('actual-native-body',{body:bodies});}return next();});
 ctx.on('tools/result',exec=>{if(exec.name==='role_read'){notified++;event('actual-sdk-final',{notification:notified});}});
 home=await createRoleHome(join(run,'role'),{operationId:'archive-create',core:'归档任务保留：原始最终结果 🌟',settings:{inputLimitBytes:32768}},{barrier:async(stage,detail)=>{if(mode!=='minimal'&&stage==='before-commit-publish')event('home-before-commit',{operationId:detail.operationId});}});
 const native=await createNativeExecution(ctx);
 const execution=withNativeScope(native,scope=>Object.freeze({...scope,registerFinalization(key,save){registered++;event('register-native-final',{key,registered});scope.registerFinalization(key,async()=>{const invocation=++closureCalls;event('registration-save-enter',{key,invocation});save();event('original-save-delegated',{key,invocation});if(invocation===1)throw Object.assign(Error('after original native final registration'),{code:'FIXTURE_REG_INITIAL'});if(mode!=='control'&&!allowRepair){if(invocation===2){await firstGate;if(mode==='bothfail'){event('registration-save-reject',{invocation});throw Object.assign(Error('older concurrent repair also fails'),{code:'FIXTURE_REG_OLDER'});}event('registration-save-success',{invocation});return;}if(invocation===3){await secondGate;event('registration-save-reject',{invocation});throw Object.assign(Error('second concurrent repair fails after older repair succeeds'),{code:'FIXTURE_REG_LATE'});}}event('registration-save-success',{invocation});});}}));
 role=await startRole(home,{execution});role.lifetime.stopped.then(()=>{stopped=true;event('role-stopped');});
 await role.runtime.receive(bound(home.roleId,'archive'));
 await waitFor(async()=>{const state=await home.readConversation();return (await role.runtime.inspect()).reason==='FIXTURE_REG_INITIAL'&&state.attempts.some(a=>a.kind==='tool'&&a.outcome)&&state.nativeRecords.some(r=>r.provenance==='tools-result');});
 const initial=await home.readConversation(),tool=initial.attempts.find(a=>a.kind==='tool');
 report.ids={roleId:home.roleId,runId:tool.runId,attemptId:tool.attemptId,toolFinalOperationId:'tool-final-'+tool.attemptId,nativeRecords:initial.nativeRecords.filter(r=>r.provenance==='tools-result').map(r=>({nativeId:r.nativeId,provenance:r.provenance}))};
 report.initial={registered,closureCalls,bodies,models:entries.length,notified,lock:await lock(),reason:(await role.runtime.inspect()).reason,toolOutcome:tool.outcome.kind};event('initial-failed-registration-captured',report.initial);
 assert.equal(registered,1);assert.equal(closureCalls,1);assert.equal(bodies,1);assert.equal(notified,1);assert.equal(entries.length,1);
 if(mode!=='control'){
  const repairA=role.owner.retryArchives().then(value=>{event('repair-a-resolved',value);return {status:'fulfilled',value};},error=>{event('repair-a-rejected',describe(error));return {status:'rejected',reason:describe(error)};});
  const repairB=role.owner.retryArchives().then(value=>{event('repair-b-resolved',value);return {status:'fulfilled',value};},error=>{event('repair-b-rejected',describe(error));return {status:'rejected',reason:describe(error)};});
  await waitFor(()=>closureCalls>=2);await new Promise(r=>setImmediate(r));
  report.parallelClosureEntries=closureCalls;
  if(closureCalls===3)event('both-concurrent-repair-closures-in-flight');else event('repair-did-not-reenter-first-held-closure');
  releaseFirst();await waitFor(()=>order.some(e=>['registration-save-success','registration-save-reject'].includes(e.name)&&e.invocation===2));await new Promise(r=>setImmediate(r));
  event(mode==='bothfail'?'older-rejection-completed-before-newer-reject':'older-success-completed-before-newer-reject');releaseSecond();
  report.concurrentRepairs=await Promise.all([repairA,repairB]);
  report.beforeFinalRepair={closureCalls,reason:(await role.runtime.inspect()).reason,lock:await lock()};
  allowRepair=true;
  try{report.finalRepair={status:'fulfilled',value:await role.owner.retryArchives()};}catch(error){report.finalRepair={status:'rejected',reason:describe(error)};}
  await new Promise(r=>setImmediate(r));
  report.afterFinalRepair={closureCalls,reason:(await role.runtime.inspect()).reason,bodies,models:entries.length,notified};event('final-public-repair-observed',report.afterFinalRepair);
  report.symptom={originalFailedClosureRetried:report.parallelClosureEntries===2?report.finalRepair.status==='fulfilled':closureCalls>=(mode==='bothfail'?5:4),expectedAtLeast:report.parallelClosureEntries===2?2:mode==='bothfail'?5:4,actual:closureCalls,pendingReported:report.finalRepair.value?.pending??null};
 }else{
  allowRepair=true;report.finalRepair={status:'fulfilled',value:await role.owner.retryArchives()};
  report.symptom={originalFailedClosureRetried:closureCalls===2,expected:2,actual:closureCalls,pendingReported:report.finalRepair.value.pending};
 }
 const state=await home.readConversation(),saved=state.attempts.find(a=>a.kind==='tool');
 report.record={canonicalText:saved.outcome.data.result.final.value.text,canonicalIsError:saved.outcome.data.result.final.isError,toolFinalOperation:await home.readOperation('tool-final-'+saved.attemptId),toolsResultRecords:state.nativeRecords.filter(r=>r.provenance==='tools-result').length};
 role.lifetime.requestStop('owner-stop');event('owner-stop-requested');
 if(report.symptom.originalFailedClosureRetried)await role.lifetime.stopped;else await new Promise(r=>setTimeout(r,100));
 report.stop={normalRoleStopped:stopped,lockBeforeHostShutdown:await lock(),reason:(await role.runtime.inspect()).reason};
 if(stopped){const reopened=await openRoleHome(join(run,'role'));report.reopen={revision:reopened.revision,toolCount:(await reopened.readConversation()).attempts.filter(a=>a.kind==='tool').length};await reopened.close();}
 report.verdict=report.symptom.originalFailedClosureRetried?'green':'red';
}catch(error){report.verdict='harness-error';report.error=describe(error);console.error('Archive diagnostic error',error);}
finally{
 releaseFirst();releaseSecond();
 if(host){try{await host.shutdown.shutdown(0);report.hostShutdown={settled:true};}catch(error){report.hostShutdown={settled:false,error:describe(error)};}}
 report.finalCounts={registered,closureCalls,bodies,notified,models:host?.entries.length??0};report.lockAfterHostShutdown=await lock();
 await writeFile(join(run,'evidence.json'),JSON.stringify(report,null,2)+'\n');
 console.log('ARCHIVE_DIAGNOSTIC_RESULT',JSON.stringify({verdict:report.verdict,symptom:report.symptom,stop:report.stop,hostShutdown:report.hostShutdown,lockAfterHostShutdown:report.lockAfterHostShutdown}));
}
process.exitCode=report.verdict==='green'?0:report.verdict==='red'?2:3;
