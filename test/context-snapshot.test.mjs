import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,rm,mkdir,writeFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';

test('Home固定reader不混入后来资料，无关提交可复用，核心变更及撤销后不能从旧能力取正文',async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-context-snapshot45-'));
 const home=await createRoleHome(join(root,'role'),{operationId:'snapshot-create45',core:'完整核心不能截断',settings:{inputLimitBytes:32768}});
 let closed=false;t.after(async()=>{if(!closed)await home.close();await rm(root,{recursive:true,force:true});});
 const input=id=>({operationId:'input-'+id,bindingId:'panel-'+home.roleId,bindingVersion:1,externalKey:'key-'+id,text:id==='first'?'我通常晚上散步；但昨晚下雨又很累，所以没出门。':'后来才接纳的独立内容',origin:'live',receivedAt:'2026-10-27T03:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
 const first=await home.acceptInput(input('first'));
 const evidence={case:'45-home-fixed-reader',roleId:home.roleId,first,snapshot:await home.readSnapshot(),actualModels:0,actualHttp:0,realBusinessCalls:{model:0,web:0,qq:0}};
 const save=async result=>{if(!process.env.DSH45_EVIDENCE_DIRECTORY)return;await mkdir(process.env.DSH45_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH45_EVIDENCE_DIRECTORY,'reader-result.json'),JSON.stringify({...evidence,...result},null,2)+'\n');};
 await save({status:'observed-before-reader'});
 const reader=await home.openContextReader({purpose:'management'}),before=await reader.list();
 assert.equal(reader.basis.roleId,home.roleId);assert.equal(reader.basis.revision,home.revision);
 assert.deepEqual(before.map(source=>source.ref),[{kind:'core'},{kind:'input',id:first.inputId}]);
 const body=await reader.read({kind:'input',id:first.inputId});assert.equal(body.text,input('first').text);assert.equal(body.experienceId,first.experienceId);assert.equal(body.speaker,'user');
 assert.equal(body.binding.bindingId,first.bindingId);assert.equal(body.binding.bindingVersion,1);assert.equal(body.occurredAt,'2026-10-27T03:00:00.000Z');
 const second=await home.acceptInput(input('second'));assert(home.revision>reader.basis.revision);
 await reader.check();assert.deepEqual(await reader.list(),before);assert.equal((await reader.read({kind:'input',id:first.inputId})).text,body.text);
 await assert.rejects(reader.read({kind:'input',id:second.inputId}),{code:'CONTEXT_SOURCE_NOT_GRANTED'});
 const snapshot=await home.readSnapshot();await home.applyOwner({kind:'edit-core',operationId:'snapshot-new-core45',text:'用户修改后的新核心',expectedCoreVersion:snapshot.core.version,expectedRevision:snapshot.revision});
 await assert.rejects(reader.check(),{code:'CONTEXT_SNAPSHOT_STALE'});await assert.rejects(reader.read({kind:'input',id:first.inputId}),{code:'CONTEXT_SNAPSHOT_STALE'});
 const current=await home.openContextReader({purpose:'management'});assert.equal((await current.read({kind:'core'})).text,'用户修改后的新核心');
 current.revoke();await assert.rejects(current.read({kind:'core'}),{code:'CONTEXT_SNAPSHOT_REVOKED'});
 const closing=await home.openContextReader({purpose:'management'});await home.close();closed=true;await assert.rejects(closing.read({kind:'core'}),{code:'HOME_CLOSED'});await assert.rejects(access(join(root,'role/writer.lock')),{code:'ENOENT'});
 await save({status:'passed',fixedBasis:reader.basis,sources:before,fullSource:body,second,homeClosed:true,writerLockReleased:true,scope:'Real public Home only; no Runtime/Native or actual model/HTTP claimed'});
});

test('可信daily reader仅含已完成经历与当前组，排除同Home尚未处理的后来输入且随run结束失效',async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-context-daily45-')),home=await createRoleHome(join(root,'role'),{operationId:'daily-create45',core:'日常来源不是完整Home写能力',settings:{inputLimitBytes:32768}});
 const entered=Promise.withResolvers(),issue=Promise.withResolvers(),ready=Promise.withResolvers(),release=Promise.withResolvers();let ordinal=0;
 const role=await startRole(home,{execution:{inspect:async()=>({available:true,reason:'synthetic-scope-port'}),prepare:async()=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:65536,outputLimit:4096}),async run(plan){if(++ordinal===2){entered.resolve();await issue.promise;try{const request={purpose:'daily',runId:plan.turn.runId};ready.resolve({reader:await home.openContextReader(request),runId:plan.turn.runId,request});}catch(error){ready.resolve({error});throw error;}await release.promise;}return {kind:'reply',text:'合成已保存角色输出 '+ordinal};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}}});
 t.after(async()=>{issue.resolve();release.resolve();role.lifetime.requestStop('unload');await role.lifetime.stopped;await rm(root,{recursive:true,force:true});});
 const receive=name=>role.runtime.receive({operationId:'daily-'+name,bindingId:'panel-'+home.roleId,bindingVersion:1,externalKey:'daily-key-'+name,text:'合成日常 '+name,origin:'live',receivedAt:'2026-10-27T03:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
 const previous=await receive('previous');for(let n=0;n<1000;n++){if((await role.owner.readConversation()).replies.length)break;await new Promise(resolve=>setTimeout(resolve,5));}
 const current=await receive('current');await entered.promise;const future=await receive('future');issue.resolve();const result=await ready.promise;if(result.error)throw result.error;
 const {reader,runId}=result,sources=await reader.list();assert.equal(reader.purpose,'daily');assert.equal(reader.basis.runId,runId);
 result.request.runId='run-caller-mutated';await reader.check();result.request.purpose='management';
 const inputIds=sources.filter(source=>source.ref.kind==='input').map(source=>source.ref.id);assert.deepEqual(inputIds,[previous.inputId,current.inputId]);assert(sources.some(source=>source.ref.kind==='reply'));
 await assert.rejects(reader.read({kind:'input',id:future.inputId}),{code:'CONTEXT_SOURCE_NOT_GRANTED'});
 const management=await home.openContextReader({purpose:'management'});assert.equal((await management.read({kind:'input',id:future.inputId})).text,'合成日常 future');
 release.resolve();for(let n=0;n<1000;n++){if((await role.owner.readConversation()).turns.find(turn=>turn.runId===runId)?.status==='finished')break;await new Promise(resolve=>setTimeout(resolve,5));}
 await assert.rejects(reader.read({kind:'input',id:current.inputId}),{code:'CONTEXT_RUN_NOT_ACTIVE'});
 if(process.env.DSH45_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH45_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH45_EVIDENCE_DIRECTORY,'daily-source.json'),JSON.stringify({status:'passed',roleId:home.roleId,revision:home.revision,runId,previous,current,future,sources,basis:reader.basis,actualModels:0,actualHttp:0,scope:'Real Home/startRole with synthetic ExecutionPort; not Native/model/SDK canonical evidence',realBusinessCalls:{model:0,web:0,qq:0}},null,2)+'\n');}
});

test('Home reader区分真实持久输入与同Runtime生成回复的来源身份，不把角色文字当用户原话',async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-context-reply45-'));
 const home=await createRoleHome(join(root,'role'),{operationId:'reply-source-create45',core:'原话与角色回复保留各自来源',settings:{inputLimitBytes:32768}});
 const text='我想了解夜空，但还没写成笔记。';
 const role=await startRole(home,{execution:{inspect:async()=>({available:true,reason:'synthetic-execution-port'}),prepare:async()=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:65536,outputLimit:4096}),run:async()=>({kind:'reply',text}),quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}}});
 t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;await rm(root,{recursive:true,force:true});});
 const accepted=await role.runtime.receive({operationId:'reply-source-input45',bindingId:'panel-'+home.roleId,bindingVersion:1,externalKey:'reply-source-key45',text:'那晚我下雨又很累，所以没出门。',origin:'live',receivedAt:'2026-10-27T03:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
 let state;for(let n=0;n<1000;n++){state=await role.owner.readConversation();if(state.replies.length)break;await new Promise(resolve=>setTimeout(resolve,5));}assert.equal(state.replies.length,1);
 const reply=state.replies[0],reader=await home.openContextReader({purpose:'management'}),sources=await reader.list(),selected=sources.filter(source=>source.ref.kind==='reply');
 if(process.env.DSH45_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH45_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH45_EVIDENCE_DIRECTORY,'reply-source.json'),JSON.stringify({status:'observed-before-assert',roleId:home.roleId,revision:home.revision,accepted,reply,sources,actualModels:0,actualHttp:0,scope:'Real Home/startRole with synthetic public ExecutionPort; not Native model or SDK canonical evidence',realBusinessCalls:{model:0,web:0,qq:0}},null,2)+'\n');}
 assert.equal(selected.length,1);assert.equal(selected[0].ref.id,reply.replyId);
 const original=await reader.read({kind:'input',id:accepted.inputId}),generated=await reader.read({kind:'reply',id:reply.replyId});
 assert.equal(original.speaker,'user');assert.equal(generated.speaker,'role');assert.equal(generated.text,text);assert.equal(generated.experienceId,reply.experienceId);assert.notEqual(generated.experienceId,original.experienceId);
 assert.deepEqual(generated.inputIds,[accepted.inputId]);assert.equal(generated.runId,state.turns[0].runId);assert.equal(generated.binding.bindingId,accepted.bindingId);assert.equal(generated.timeKind,'turn-start');assert.equal(generated.occurredAt,state.turns[0].startedAt);assert.equal(generated.evidence,'generated-output-not-delivery-or-truth');
 if(process.env.DSH45_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH45_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH45_EVIDENCE_DIRECTORY,'reply-source.json'),JSON.stringify({status:'passed',roleId:home.roleId,revision:home.revision,accepted,reply,sources,original,generated,actualModels:0,actualHttp:0,scope:'Real Home/startRole with synthetic public ExecutionPort; not Native model or SDK canonical evidence',realBusinessCalls:{model:0,web:0,qq:0}},null,2)+'\n');}
});

test('历史用途由实际owner输入发行并持久保留，普通run不能借model旗标取得',async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-context-history45-')),home=await createRoleHome(join(root,'role'),{operationId:'history-create45',core:'历史核对不重新激活旧理解',settings:{inputLimitBytes:32768}}),observed=[];
 const role=await startRole(home,{execution:{inspect:async()=>({available:true,reason:'synthetic-history-port'}),prepare:async()=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:65536,outputLimit:4096}),async run(plan,scope){let result;try{const reader=await home.openContextReader({purpose:'history',runId:plan.turn.runId});result={purpose:reader.purpose,basis:reader.basis};reader.revoke();}catch(error){result={code:error.code??error.message};}observed.push({runId:plan.turn.runId,manifest:plan.frame.manifest,grants:scope.roleRead.grants,result});return {kind:'reply',text:'只按获准用途核对。'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}}});
 t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;await rm(root,{recursive:true,force:true});});
 const normal=await role.runtime.receive({operationId:'normal-purpose45',bindingId:'panel-'+home.roleId,bindingVersion:1,externalKey:'normal-purpose-key45',text:'普通问题不申请历史权限',origin:'live',receivedAt:'2026-10-27T03:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});for(let n=0;n<1000;n++){if((await role.owner.readConversation()).replies.length)break;await new Promise(resolve=>setTimeout(resolve,5));}
 const save=async status=>{if(process.env.DSH45_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH45_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH45_EVIDENCE_DIRECTORY,'history-purpose.json'),JSON.stringify({status,roleId:home.roleId,revision:home.revision,normal,observed,actualModels:0,actualHttp:0,scope:'Real Home/startRole with synthetic public ExecutionPort; no Native/model claim',realBusinessCalls:{model:0,web:0,qq:0}},null,2)+'\n');}};await save('before-assert');assert.equal(observed[0].result.code,'HISTORY_NOT_REQUESTED');assert.equal(observed[0].manifest.purpose,'daily');
 const historical=await role.runtime.receive({operationId:'history-purpose45',bindingId:'panel-'+home.roleId,bindingVersion:1,externalKey:'history-purpose-key45',text:'明确核对历史记录及当时限定',contextPurpose:'history',origin:'live',receivedAt:'2026-10-27T03:01:00.000Z',sourceEvidence:'authenticated-owner-panel'});assert.equal(historical.kind,'accepted');for(let n=0;n<1000;n++){if((await role.owner.readConversation()).replies.length===2)break;await new Promise(resolve=>setTimeout(resolve,5));}
 assert.equal(observed.length,2);assert.equal(observed[1].manifest.purpose,'history');assert.equal(observed[1].result.purpose,'history');assert.equal(observed[1].result.basis.runId,observed[1].runId);assert.equal(observed[1].grants.rule,'fixed-history-snapshot');
 await assert.rejects(home.openContextReader({purpose:'history',runId:observed[1].runId}),{code:'CONTEXT_RUN_NOT_ACTIVE'});await save('passed');
 role.lifetime.requestStop('unload');await role.lifetime.stopped;const {openRoleHome}=await import('dsh-role-companion/home'),reopened=await openRoleHome(join(root,'role'),{expectedRoleId:home.roleId});try{const inputs=(await reopened.readSnapshot()).inputs;assert.equal(inputs.find(input=>input.inputId===normal.inputId).contextPurpose,undefined);assert.equal(inputs.find(input=>input.inputId===historical.inputId).contextPurpose,'history');}finally{await reopened.close();}
});
