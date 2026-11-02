import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';
const input=(roleId,n)=>({operationId:'input-'+n,bindingId:'panel-'+roleId,bindingVersion:1,externalKey:'key-'+n,text:'原文 '+n,origin:'live',receivedAt:'2026-10-25T08:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
test('Home 复合提交保存完整回复、原绑定展示和分组完成，重新打开不返回待生成输入',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-turn-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const home=await createRoleHome(path,{operationId:'create',core:'星河',settings:{inputLimitBytes:32768}});
 const a=await home.acceptInput(input(home.roleId,1));const b=await home.acceptInput(input(home.roleId,2));
 const group=await home.beginTurn({operationId:'group',inputIds:[a.inputId,b.inputId],runId:'run-one',now:'2026-10-25T08:01:00.000Z',expectedRevision:3});
 assert.equal(group.inputIds.length,2);assert.equal(group.deadline,'2026-10-25T08:11:00.000Z');
 const reservation=await home.reserveAttempt({operationId:'reserve',runId:group.runId,attemptId:'attempt-one',source:'user',kind:'model',expectedRevision:home.revision,contextGeneration:1,settingsVersion:1,now:'2026-10-25T08:01:01.000Z'});
 await home.enterAttempt({operationId:'enter',attemptId:reservation.attemptId,now:'2026-10-25T08:01:01.001Z'});
 await home.recordAttempt({operationId:'outcome',attemptId:reservation.attemptId,outcome:{kind:'completed',data:{usage:{inputTokens:1.25},text:'完整回复🌟'.repeat(4000)}}});
 const record=await home.readExecutionRecord({kind:'attempt',recordId:'attempt-one',offset:0,limit:100});assert.equal(record.more,true);let full=record.json;while(record.totalCodePoints>Array.from(full).length){const part=await home.readExecutionRecord({kind:'attempt',recordId:'attempt-one',offset:Array.from(full).length,limit:65536});full+=part.json;}assert.equal(JSON.parse(full).outcome.data.usage.inputTokens,1.25);
 const text='完整回复🌟'.repeat(4000);const finished=await home.finishTurn({operationId:'finish',runId:group.runId,outcome:{kind:'reply',text},contextGeneration:1});
 assert.equal(finished.kind,'committed');const reply=await home.readReply({replyId:finished.replyId,offset:0,limit:1048576});assert.equal(reply.text,text);assert.equal(reply.display,'queryable');assert.deepEqual(reply.inputIds,[a.inputId,b.inputId]);assert.equal(reply.bindingId,'panel-'+home.roleId);
 assert.equal((await home.readSnapshot()).inputs.every(x=>x.status==='resolved'),true);assert.equal((await home.readConversation()).attempts[0].outcome.data.usage.inputTokens,1.25);
 await home.close();const restored=await openRoleHome(path);assert.equal((await restored.readConversation()).replies.length,1);assert.equal((await restored.readSnapshot()).inputs.filter(x=>x.status==='queued').length,0);assert.equal((await restored.readReply({replyId:finished.replyId,offset:0,limit:1048576})).text,text);await restored.close();
});

test('完整经历的大 JSON 与超过 1 MiB 的完整回复采用受管内容，重开不裁剪正文',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-large-turn-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const home=await createRoleHome(path,{operationId:'create-large',core:'星河',settings:{inputLimitBytes:32768}});const receipt=await home.acceptInput(input(home.roleId,'large'));const group=await home.beginTurn({operationId:'group-large',inputIds:[receipt.inputId],runId:'run-large',now:'2026-10-25T08:01:00.000Z',expectedRevision:2});
 await home.reserveAttempt({operationId:'reserve-large',runId:group.runId,attemptId:'attempt-large',source:'user',kind:'model',expectedRevision:home.revision,contextGeneration:1,settingsVersion:1,now:'2026-10-25T08:01:01.000Z'});await home.enterAttempt({operationId:'enter-large',attemptId:'attempt-large',now:'2026-10-25T08:01:01.001Z'});
 const large='\u0001'.repeat(700000);await home.recordAttempt({operationId:'record-large',attemptId:'attempt-large',outcome:{kind:'completed',data:{a:large,b:large,usage:1.25}}});const finished=await home.finishTurn({operationId:'finish-large',runId:group.runId,contextGeneration:1,outcome:{kind:'reply',text:large+large}});await home.close();const restored=await openRoleHome(path);const state=await restored.readConversation();assert.equal(state.attempts[0].outcome.data.usage,1.25);assert.equal(state.attempts[0].outcome.data.a,large);const first=await restored.readReply({replyId:finished.replyId,offset:0,limit:1048576});assert.equal(first.totalCodePoints,1400000);assert.equal(first.more,true);const last=await restored.readReply({replyId:finished.replyId,offset:1048576,limit:1048576});assert.equal(first.text+last.text,large+large);assert.equal(last.more,false);await restored.close();
});
