import assert from 'node:assert/strict';
import {access,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {bootNativeFixture,waitFor,bound,withNativeScope} from './native-fixture.mjs';

const run=process.env.DSH_TEST_RUN,phase=process.argv[2]??'zero-create';
const result={case:phase,status:'running',realModelCalls:0,realCatalogCalls:0,webCalls:0,qqCalls:0,order:[]};
const order=(event,detail={})=>result.order.push({...detail,ordinal:result.order.length+1,event});
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const modelGate=defer(),modelReached=defer(),limitReads=[{entered:defer(),release:defer()},{entered:defer(),release:defer()}];
let role,home,host,readers=0,bodies=0,finals=0,execSignal,workAgent,releaseRead,reachRead,releaseEnter,reachEnter;
const readGate=new Promise(resolve=>releaseRead=resolve),readReached=new Promise(resolve=>reachRead=resolve),enterGate=new Promise(resolve=>releaseEnter=resolve),enterReached=new Promise(resolve=>reachEnter=resolve);
const lock=()=>access(join(run,'role/writer.lock')).then(()=>true,e=>e.code==='ENOENT'?false:Promise.reject(e));
const persist=()=>writeFile(join(run,phase+'.json'),JSON.stringify(result,null,2)+'\n');
function toolResponse(offset=0){
 const frames=[{type:'message_start',message:{id:'budget-'+offset,model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_budget_'+offset,name:'role_read',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset,limit:40})}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];
 return new Response(frames.map(value=>`event: ${value.type}\ndata: ${JSON.stringify(value)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});
}
async function edit(value,operationId){
 const state=await role.owner.readConversation();
 await role.owner.apply({kind:'edit-conversation',operationId,expectedConversationVersion:state.rules.version,expectedRevision:state.revision,value:{...state.rules.value,...value}});
 return role.owner.readConversation();
}
async function resolved(count){await waitFor(async()=>{const view=await role.runtime.inspect();return view.home?.inputSummary.resolved===count;});}
const usage=state=>({revision:state.revision,rules:state.rules,turn:state.turns.at(-1),toolAttemptIds:state.attempts.filter(attempt=>attempt.kind==='tool').map(attempt=>attempt.attemptId)});
async function exerciseLimits(){
 if(phase==='limits-create')await edit({toolLimit:1},'budget-initial-one');
 const initial=await role.owner.readConversation();
 if(phase==='limits-reopen'){
  assert.equal(initial.rules.value.toolLimit,1);assert.equal(initial.rules.value.outputTokens,2048);assert.equal(initial.rules.value.windowMs,1200000);
  assert.equal(initial.attempts.filter(attempt=>attempt.kind==='tool').length,2);
 }
 await role.runtime.receive(bound(home.roleId,phase));
 if(phase==='limits-create'){
  await modelReached.promise;
  const started=await role.owner.readConversation(),deadline=started.turns[0].deadline;
  assert.equal(host.entries[0].body.max_tokens,4096);
  assert.equal(Date.parse(deadline)-Date.parse(started.turns[0].startedAt),600000);
  result.initialRunning=usage(started);
  const outputEdited=await edit({windowMs:1200000,outputTokens:2048},'budget-active-request');
  assert.equal(outputEdited.turns[0].deadline,deadline);assert.equal(host.entries[0].body.max_tokens,4096);
  order('owner-edited-during-model',{version:outputEdited.rules.version,oldRequestMaxTokens:host.entries[0].body.max_tokens});modelGate.resolve();
  await limitReads[0].entered.promise;
  const beforeRaise=await role.owner.readConversation();assert.equal(beforeRaise.attempts.filter(attempt=>attempt.kind==='tool').length,1);
  const raised=await edit({toolLimit:3},'budget-raise');
  assert.equal(raised.attempts.filter(attempt=>attempt.kind==='tool').length,1);assert.equal(raised.turns[0].deadline,deadline);result.raised=usage(raised);
  order('owner-raised-after-one-charge',{version:raised.rules.version});limitReads[0].release.resolve();
  await limitReads[1].entered.promise;
  const beforeLower=await role.owner.readConversation();assert.equal(beforeLower.attempts.filter(attempt=>attempt.kind==='tool').length,2);
  const lowered=await edit({toolLimit:1},'budget-lower');
  assert.equal(lowered.attempts.filter(attempt=>attempt.kind==='tool').length,2);assert.equal(lowered.turns[0].deadline,deadline);result.lowered=usage(lowered);
  const rejected=[];
  for(const [operationId,value,version,code]of [
   ['budget-stale',{...lowered.rules.value,toolLimit:4},raised.rules.version,'CONVERSATION_VERSION_CONFLICT'],
   ['budget-invalid',{...lowered.rules.value,toolLimit:-1},lowered.rules.version,'INVALID_CONVERSATION_SETTINGS']
  ]){
   await assert.rejects(role.owner.apply({kind:'edit-conversation',operationId,expectedConversationVersion:version,expectedRevision:lowered.revision,value}),error=>error.code===code);
   const operation=await role.owner.readOperation(operationId);assert.equal(operation.kind,'not-found');rejected.push({operationId,code,operation});
  }
  const afterReject=await role.owner.readConversation();assert.deepEqual(usage(afterReject),usage(lowered));result.rejected=rejected;
  order('owner-lowered-below-two-charges',{version:lowered.rules.version});limitReads[1].release.resolve();
 }
 await resolved(phase==='limits-create'?1:2);
 const state=await role.owner.readConversation(),turn=state.turns.at(-1),tools=state.attempts.filter(attempt=>attempt.kind==='tool'&&attempt.runId===turn.runId);
 assert.equal(turn.outcome.kind,'failure');assert.equal(turn.outcome.reason,'TOOL_LIMIT');
 assert.equal(readers,phase==='limits-create'?2:1);assert.equal(bodies,readers);assert.equal(tools.length,readers);
 assert.equal(host.entries.length,phase==='limits-create'?3:2);
 assert(tools.every(attempt=>attempt.outcome.kind==='completed'&&attempt.outcome.data.dispatchObserved));
 assert.deepEqual(host.entries.map(entry=>entry.body.max_tokens),phase==='limits-create'?[4096,2048,2048]:[2048,2048]);
 assert.equal(state.rules.value.toolLimit,1);
 if(phase==='limits-create'){assert.equal(turn.deadline,result.initialRunning.turn.deadline);assert.equal(turn.settingsVersion,result.initialRunning.turn.settingsVersion);}
 else{assert.equal(Date.parse(turn.deadline)-Date.parse(turn.startedAt),1200000);assert.equal(state.turns[0].deadline,initial.turns[0].deadline);assert.deepEqual(state.rules,initial.rules);}
 result.modelRequests=state.attempts.filter(attempt=>attempt.kind==='model'&&attempt.runId===turn.runId).map(attempt=>({attemptId:attempt.attemptId,maxTokens:attempt.outcome.data.request.maxTokens,outcome:attempt.outcome.kind}));
 return state;
}
try{
 host=await bootNativeFixture(run,async entry=>{order('controlled-model',{requestOrdinal:entry.ordinal,maxTokens:entry.body.max_tokens});if(phase==='limits-create'&&entry.ordinal===1){modelReached.resolve();await modelGate.promise;}return toolResponse(phase.startsWith('limits')?entry.ordinal-1:0);},{reuse:phase.endsWith('reopen')});
 const {ctx,module}=host;
 result.packageSha256={};for(const file of ['runtime.js','home.js','index.js'])result.packageSha256[file]=createHash('sha256').update(await readFile(join(host.profile,'node_modules/dsh-role-companion/lib',file))).digest('hex');
 const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
 ctx.on('tools/execute',async(exec,next)=>{if(exec.name==='role_read'){bodies++;execSignal=exec.signal;workAgent=exec.agent;order('sdk-body-enter');}return next();});
 ctx.on('tools/result',exec=>{if(exec.name==='role_read'){finals++;order('sdk-final');}});
 home=phase.endsWith('reopen')?await openRoleHome(join(run,'role')):await createRoleHome(join(run,'role'),{operationId:'budget-create',core:'合成预算核心：已发生尝试不返还。',settings:{inputLimitBytes:32768}},{barrier:async(stage,detail)=>{if(phase==='not-dispatched'&&stage==='before-commit-publish'&&detail.operationId.startsWith('enter-tool-')){order('entered-reservation-held',{operationId:detail.operationId});reachEnter();await enterGate;}}});
 const execution=withNativeScope(await createNativeExecution(ctx),scope=>Object.freeze({...scope,roleRead:Object.freeze({...scope.roleRead,async read(request){readers++;order('actual-reader',{offset:request.offset});const value=await scope.roleRead.read(request);if(phase==='cancelled'){reachRead();await readGate;}if(phase==='limits-create'&&limitReads[request.offset]){limitReads[request.offset].entered.resolve();await limitReads[request.offset].release.promise;}if(phase==='failed')throw Object.assign(Error('synthetic source failure after actual source entry'),{code:'FIXTURE_READ_FAILED'});return value;}})}));
 role=await startRole(home,{execution});
 let state;
 if(phase.startsWith('limits'))state=await exerciseLimits();
 else{
 if(phase==='zero-create')await edit({toolLimit:0},'budget-zero');
 if(['failed','cancelled','not-dispatched'].includes(phase))await edit({toolLimit:1},'budget-one');
 if(phase==='not-dispatched'){const rules=await role.owner.readReadRules();await role.owner.apply({kind:'edit-read-rules',operationId:'budget-cooperation',expectedReadRulesVersion:rules.version,expectedRevision:rules.revision,value:{...rules.value,readTimeoutMs:1000}});}
 const before=await role.owner.readConversation();
 await role.runtime.receive(bound(home.roleId,phase));
 if(phase==='cancelled'){await readReached;const charged=await role.owner.readConversation();assert.equal(charged.attempts.filter(attempt=>attempt.kind==='tool').length,1);const pending=charged.attempts.find(attempt=>attempt.kind==='tool');result.pendingBeforeCancel={attemptId:pending.attemptId,runId:pending.runId,reservedAt:pending.reservedAt,enteredAt:pending.enteredAt};workAgent.cancel({kind:'user'});assert.equal(execSignal.aborted,true);order('public-user-cancel');releaseRead();}
 if(phase==='not-dispatched'){await enterReached;await waitFor(()=>execSignal?.aborted);assert.equal(readers,0);order('cooperative-cancel-before-actual-reader');releaseEnter();}
 await resolved(phase==='zero-reopen'?2:1);
 state=await role.owner.readConversation();const turn=state.turns.at(-1),tools=state.attempts.filter(attempt=>attempt.kind==='tool');
 if(phase.startsWith('zero')){
  assert.equal(state.rules.value.toolLimit,0);
  assert.equal(readers,0,'toolLimit=0 must prevent the actual public source reader');
  assert.equal(bodies,0,'the native pre-dispatch quota refusal must not run the tool body');
  assert.equal(tools.length,0,'quota denial must not manufacture a reservation');
  assert.equal(host.entries.length,1,'quota denial cannot call another model to explain the error');
 }else{
  assert.equal(readers,phase==='not-dispatched'?0:1);assert.equal(bodies,1);
  assert.equal(tools.length,1,'failed, cancelled and undispatched reservations remain charged against toolLimit=1');
  assert.equal(host.entries.length,phase==='cancelled'?1:2);
  if(phase==='failed'){
   assert.equal(tools[0].observation.kind,'threw');assert.equal(tools[0].observation.code,'FIXTURE_READ_FAILED');
   assert.equal(tools[0].outcome.kind,'failed');assert.equal(tools[0].outcome.data.dispatchObserved,true);
  }else if(phase==='cancelled'){
   assert.equal(tools[0].attemptId,result.pendingBeforeCancel.attemptId);assert.equal(tools[0].observation.kind,'returned');assert.equal(tools[0].outcome.kind,'failed');assert.equal(tools[0].outcome.data.dispatchObserved,true);
   assert.equal(tools[0].outcome.data.result.final.isError,true);assert.equal(Object.hasOwn(tools[0].outcome.data.result.final,'value'),false);
  }else{
   assert.equal(tools[0].observation,undefined);assert.equal(tools[0].outcome.kind,'not-dispatched');assert.equal(tools[0].outcome.data.dispatchObserved,false);
   assert.equal(tools[0].outcome.data.result.final.error.info.code,'ROLE_READ_TIMEOUT');
  }
 }
 assert.equal(turn.outcome.kind,'failure');assert.equal(turn.outcome.reason,phase==='cancelled'?'MODEL_CANCELLED':'TOOL_LIMIT');
 assert.deepEqual(state.rules,before.rules);
 }
 const turn=state.turns.at(-1),tools=state.attempts.filter(attempt=>attempt.kind==='tool');
 assert.equal(finals,phase==='limits-create'?3:['failed','not-dispatched','limits-reopen'].includes(phase)?2:1);
 result.roleId=home.roleId;result.revision=state.revision;result.rules=state.rules;result.turn=turn;result.toolAttempts=tools;
 role.lifetime.requestStop('owner-stop');await role.lifetime.stopped;result.roleStopped=true;
 assert.equal(await lock(),false);result.writerLockAfterStop=false;
 const reopened=await openRoleHome(join(run,'role'));assert.deepEqual((await reopened.readConversation()).rules,state.rules);assert.equal((await reopened.readConversation()).attempts.filter(attempt=>attempt.kind==='tool').length,tools.length);await reopened.close();result.publicReopen=true;
 await host.shutdown.shutdown(0);result.hostStopped=true;result.status='passed';
}catch(error){result.status='failed';result.error={code:error.code??null,message:error.message,stack:error.stack};console.error('Tool budget public native failure',error);}
finally{
 releaseRead();releaseEnter();modelGate.resolve();for(const read of limitReads)read.release.resolve();
 result.counts={actualReaders:readers,nativeBodies:bodies,canonicalNotifications:finals,controlledModels:host?.entries.length??0,controlledCatalogRequests:host?.metadataEntries.length??0};result.writerLockAtExit=await lock();await persist();
}
if(result.status!=='passed')process.exit(2);
console.log(JSON.stringify({case:phase,status:result.status,counts:result.counts,roleId:result.roleId}));
