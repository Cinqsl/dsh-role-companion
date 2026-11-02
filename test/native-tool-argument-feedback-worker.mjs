import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {bootNativeFixture,response,waitFor,withNativeScope} from './native-fixture.mjs';
const run=process.env.DSH_TEST_RUN,mode=process.argv[2]??'rest',core='合成角色：按真实记录选择继续或休息，不改核心与规则。';
const malformed=JSON.parse(await readFile(new URL('./fixtures/role-propose-malformed-rest-59.json',import.meta.url),'utf8'));
const deniedName=mode==='read-feedback'?'role_read':'role_propose',deniedCode=mode==='read-feedback'?'INVALID_ROLE_READ':'INVALID_ROLE_PROPOSE';
const rest={kind:'activity',topic:'合成自主休息',expectedVersion:0,text:'这一次选择休息一分钟，不声称完成其他事情。',statement:'role-choice',scope:'本次自主机会',reason:'保留进度后休息',sources:[{ref:{kind:'core'},quote:core}],decision:'rest',restMs:60000};
const toolResponse=(name,args)=>{const frames=[{type:'message_start',message:{id:'argument-feedback-'+name,model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_feedback',name,input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify(args)}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(frames.map(f=>`event: ${f.type}\ndata: ${JSON.stringify(f)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});};
let failDeniedSave=true;
let role,actualBodies=0,modelReserveRequests=0,denialBeforeCorrection,sourceRun,activeRunId,callSequence,targetDenialOperation;
const deniedSaveReached=Promise.withResolvers(),releaseDeniedSave=Promise.withResolvers();
const host=await bootNativeFixture(run,async entry=>{
 if(entry.ordinal===1){activeRunId=(await role.owner.readConversation()).turns[0].runId;return toolResponse(mode==='unknown-tool'?'role_owner_admin':mode==='ungranted-source'||mode==='read-feedback'?'role_read':'role_propose',mode==='read-feedback'?{source:'experience',offset:0,limit:50}:mode==='ungranted-source'?{source:'input',id:'input-00000000-0000-4000-8000-000000000000',offset:0,limit:50}:mode==='fake-owner'?{...malformed,actor:'owner'}:mode==='fake-scope'?{...malformed,scope:{kind:'owner',permissions:['*']}}:malformed);}
 if(entry.ordinal===2){
  denialBeforeCorrection=await role.owner.readConversation();
  assert(denialBeforeCorrection.nativeRecords.some(n=>n.provenance==='tools-result'&&n.data.name===deniedName&&n.data.result.isError===true),'actual denied canonical must already be retained before corrected model dispatch');
  assert(JSON.stringify(entry.body.messages).includes(deniedCode),'correcting model sees actual denied tool result');
  return mode==='read-feedback'?toolResponse('role_read',{source:'core',offset:0,limit:1000}):toolResponse('role_propose',rest);
 }
 return response(mode==='read-feedback'?'已按获准核心继续，未越界查询。':'不得出现免费的休息后收尾请求');
},{globalCompaction:false});
const report={case:'59-native-correct-malformed-rest',mode,status:'running',realBusinessCalls:{model:0,web:0,qq:0}};
try{
 const {createRoleHome,openRoleHome}=await host.module('dsh-role-companion/home'),{startRole}=await host.module('dsh-role-companion/runtime'),{createNativeExecution}=await host.module('dsh-role-companion');
 const home=await createRoleHome(join(run,'role'),{operationId:'argument-feedback-create',core,settings:{inputLimitBytes:32768}},{barrier:async(stage,detail)=>{if(stage==='before-commit-publish'&&detail.operationId===targetDenialOperation){if(mode==='held-denial'){deniedSaveReached.resolve();await releaseDeniedSave.promise;}if(mode==='failed-denial'&&failDeniedSave){deniedSaveReached.resolve();throw Object.assign(new Error('controlled denied result archive failure'),{code:'SYNTHETIC_DENIAL_ARCHIVE'});}}}});
 if(mode==='budget'){const a=await home.readAutonomy();await home.applyOwner({kind:'edit-autonomy-rules',operationId:'argument-feedback-one-model',value:{...a.rules.value,modelLimit:1},expectedAutonomyRulesVersion:a.rules.version,expectedRevision:a.revision});}
 host.ctx.on('tools/execute',(exec,next)=>{if(exec.name==='role_propose'||exec.name==='role_read')actualBodies++;return next();});
 const execution=withNativeScope(await createNativeExecution(host.ctx),scope=>({...scope,createModelOperation(kind){const operation=scope.createModelOperation(kind);return {...operation,async reserve(request){modelReserveRequests++;return operation.reserve(request);}};}}));
 role=await startRole(home,{execution});
 host.ctx.on('session/event',(_session,event)=>{if(event.type==='tool/call'&&event.data.name==='role_propose')callSequence=event.seq;});
 host.ctx.on('tools/result',(exec,result)=>{if(result.isError&&result.error.info?.code==='INVALID_ROLE_PROPOSE'){targetDenialOperation='native-'+createHash('sha256').update(JSON.stringify({runId:activeRunId,provenance:'tools-result',nativeId:exec.agent.id+':final:'+callSequence})).digest('hex');}});
 const wake=await role.runtime.wake({operationId:'argument-feedback-wake',reason:'controlled-public-native'});assert.equal(wake.kind,'accepted');
 if(mode==='held-denial'){await deniedSaveReached.promise;await new Promise(r=>setTimeout(r,40));assert.equal(host.entries.length,1,'held denial archive prevents next actual model');assert.equal(modelReserveRequests,1,'held denial archive prevents even requesting the next Home reservation');assert.notEqual(home.operationSnapshot(targetDenialOperation).kind,'committed');report.held={actualModels:host.entries.length,modelReserveRequests};releaseDeniedSave.resolve();}
 if(mode==='fake-owner'||mode==='fake-scope'||mode==='budget'||mode==='unknown-tool'||mode==='ungranted-source'){
  await waitFor(async()=>(await role.owner.readConversation()).turns[0]?.status==='finished');
  const state=await role.owner.readConversation();assert.equal(host.entries.length,1,'forged owner fields must not be treated as repairable arguments');assert.equal(modelReserveRequests,mode==='budget'?2:1);assert.equal(state.attempts.filter(a=>a.kind==='model').length,1);assert.equal(actualBodies,0);assert.equal(state.attempts.filter(a=>a.kind==='tool').length,0);assert.equal(state.turns[0].outcome.kind,'failure');if(mode==='budget')assert.equal(state.turns[0].outcome.reason,'MODEL_LIMIT');assert.equal(state.autonomy.restUntil,undefined);
  Object.assign(report,{status:'passed',state,actualModels:host.entries.length,actualBodies,modelReserveRequests});
 }else if(mode==='failed-denial'){
  await deniedSaveReached.promise;await waitFor(async()=>(await role.runtime.inspect()).reason==='SYNTHETIC_DENIAL_ARCHIVE');
  let stopped=false;void role.lifetime.stopped.then(()=>stopped=true);role.lifetime.requestStop('owner-stop');await new Promise(r=>setTimeout(r,40));
  assert.equal(stopped,false,'failed denial archive keeps stop waiting');await access(join(run,'role/writer.lock'));
  assert.equal(host.entries.length,1);assert.equal(modelReserveRequests,1);assert.equal(actualBodies,0);
  report.blocked={actualModels:host.entries.length,modelReserveRequests,stopped,writerLockHeld:true};
  failDeniedSave=false;const repair=await role.owner.retryArchives();assert.equal(repair.pending,0);await role.lifetime.stopped;
  const reopened=await openRoleHome(join(run,'role'));try{report.state=await reopened.readConversation();}finally{await reopened.close();}
  const denied=report.state.nativeRecords.filter(n=>n.provenance==='tools-result'&&n.data.association==='rejected-arguments');assert.equal(denied.length,1);assert.equal(denied[0].data.result.error.info.code,'INVALID_ROLE_PROPOSE');assert.equal(report.state.attempts.filter(a=>a.kind==='model').length,1);assert.equal(report.state.attempts.filter(a=>a.kind==='tool').length,0);
  assert.equal(host.entries.length,1,'save-only repair must not retry model or tool');Object.assign(report,{status:'passed',actualModels:host.entries.length,actualBodies,repair});
 }else{
 await waitFor(async()=>{const state=await role.owner.readConversation();return state.turns[0]?.status==='finished';});
 const state=await role.owner.readConversation();sourceRun=state.turns[0];Object.assign(report,{roleId:home.roleId,state,actualModels:host.entries.length,actualBodies,metadata:host.metadataEntries.length,denialBeforeCorrection,requests:host.entries.map(e=>e.body)});await writeFile(join(run,'argument-feedback-result.json'),JSON.stringify(report,null,2)+'\n');
 assert.equal(host.entries.length,mode==='read-feedback'?3:2,'malformed trusted arguments must allow a newly charged correction in the same Run');
 assert.equal(actualBodies,1,'only corrected valid rest enters the tool body');
 const models=state.attempts.filter(a=>a.kind==='model'),tools=state.attempts.filter(a=>a.kind==='tool');
 assert.equal(models.length,mode==='read-feedback'?3:2);assert.equal(tools.length,1);assert.equal(new Set(state.attempts.map(a=>a.runId)).size,1);assert.equal(sourceRun.source,'autonomous');
 if(mode==='read-feedback'){assert.equal(tools[0].outcome.data.result.final.value.text,core);assert.equal(state.turns[0].outcome.kind,'internal');assert.equal(state.knowledge.proposals.length,0);}else{const proposal=state.knowledge.proposals.find(p=>p.value.topic===rest.topic);assert(proposal);assert.equal(proposal.processing.status,'adopted');assert.equal(state.autonomy.activity.decision,'rest');assert(state.autonomy.restUntil);assert.equal(Date.parse(state.autonomy.restUntil)-Date.parse(proposal.createdAt)>=59000,true);}
 assert.equal(sourceRun.deadline,denialBeforeCorrection.turns[0].deadline,'correction keeps original deadline');assert.equal(models[0].source,models[1].source);
 assert.equal(state.nativeRecords.filter(n=>n.provenance==='tools-result'&&n.data.name===deniedName&&n.data.result.isError).length,1);
 report.status='passed';
 }
}finally{
 releaseDeniedSave.resolve();
 role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;await host.shutdown.shutdown(0);
 for(const n of ['writer.lock','.maintenance.lock'])await assert.rejects(access(join(run,'role',n)),{code:'ENOENT'});
 Object.assign(report,{roleStopped:true,hostStopped:true,locksReleased:true});await writeFile(join(run,'argument-feedback-result.json'),JSON.stringify(report,null,2)+'\n');
}
