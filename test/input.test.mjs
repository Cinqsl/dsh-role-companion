import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome, openRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';

const initial = {operationId:'create-input-home',core:'合成角色：星河',settings:{inputLimitBytes:32768}};
const bound = (roleId, overrides={}) => ({operationId:'input-first',bindingId:'panel-'+roleId,bindingVersion:1,externalKey:'browser-first',text:'  原文\n你好🌟\u0001',origin:'live',receivedAt:'2026-10-25T08:00:00.000Z',sourceEvidence:'authenticated-owner-panel',...overrides});
const stop = async role => {role.lifetime.requestStop('unload');await role.lifetime.stopped;};

test('同一 startRole 持久接纳原文与 queued，重开只凭 Home 恢复收据及顺序', async t => {
  const root=await mkdtemp(join(tmpdir(),'role-input-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');
  const home=await createRoleHome(path,initial);const role=await startRole(home,{});const input=bound(home.roleId);
  const receipt=await role.runtime.receive(input);
  assert.equal(receipt.kind,'accepted');assert.equal(receipt.committedRevision,2);assert.equal(receipt.receiveSequence,1);assert.equal(receipt.status,'queued');
  assert.equal((await role.owner.readOperation(input.operationId)).inputReceipt.inputId,receipt.inputId);
  const view=await role.runtime.inspect();assert.equal((await home.readSnapshot()).inputs[0].text,input.text);assert.equal((await home.readSnapshot()).inputs[0].utf8Bytes,20);assert.equal(view.home.contextGeneration,1);
  assert.equal((await home.readSnapshot()).inputs[0].processingUnavailableReason,'execution-unavailable');
  await stop(role);
  const restoredHome=await openRoleHome(path);const next=await startRole(restoredHome,{});const restored=await restoredHome.readSnapshot();
  assert.equal(restored.inputs[0].inputId,receipt.inputId);assert.equal(restored.inputs[0].text,input.text);assert.equal(restored.panelBinding.bindingId,input.bindingId);
  assert.equal((await next.runtime.receive({...input,receivedAt:'2026-10-26T00:00:00.000Z'})).kind,'duplicate');
  await next.owner.retryArchives();const previousStop=restoredHome.stopSnapshots().at(-1);assert.equal(previousStop.checkpoint,'ready-to-close');assert.equal((await next.runtime.inspect()).revision,previousStop.reconciledRevision);assert.equal((await next.owner.readOperation(input.operationId)).committedRevision,receipt.committedRevision);await stop(next);
});

test('原收据优先于后来降低的上限，同键同文复用原操作，同键异文拒绝而独立同文各自排队', async t => {
  const root=await mkdtemp(join(tmpdir(),'role-input-dedupe-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const home=await createRoleHome(join(root,'home'),initial);const role=await startRole(home,{});const input=bound(home.roleId,{text:'你好'});
  const first=await role.runtime.receive(input);
  await role.owner.apply({kind:'edit-settings',operationId:'lower-limit',settings:{inputLimitBytes:4},expectedSettingsVersion:1,expectedRevision:2});
  const retry=await role.runtime.receive({...input,receivedAt:'2026-10-26T00:00:00.000Z'});assert.equal(retry.kind,'duplicate');assert.equal(retry.inputId,first.inputId);
  const duplicate=await role.runtime.receive({...input,operationId:'different-operation'});assert.equal(duplicate.operationId,input.operationId);assert.equal(duplicate.committedRevision,2);
  assert.equal((await role.owner.readOperation('different-operation')).kind,'not-found');
  assert.equal((await role.runtime.receive({...input,operationId:'conflicting-key',text:'别'})).reason,'key-conflict');
  assert.equal((await role.runtime.receive({...input,text:'别'})).reason,'operation-conflict');
  assert.equal((await role.runtime.receive({...input,operationId:'too-large',externalKey:'new-key'})).reason,'input-too-large');
  await role.owner.apply({kind:'edit-settings',operationId:'raise-limit',settings:{inputLimitBytes:32768},expectedSettingsVersion:2,expectedRevision:3});
  const independent=await role.runtime.receive({...input,operationId:'independent',externalKey:'independent-key'});assert.equal(independent.kind,'accepted');assert.notEqual(independent.inputId,first.inputId);assert.equal(independent.receiveSequence,2);
  assert.equal((await home.readSnapshot()).inputs.length,2);await stop(role);
});

test('提交发布或确认下界故障返回原操作待核对，确定发布前拒绝与重试不重复接纳', async t => {
  for (const stage of ['before-commit-publish','after-commit-publish','after-head-publish']) {
    const root=await mkdtemp(join(tmpdir(),'role-input-fault-'));t.after(()=>rm(root,{recursive:true,force:true}));let once=true;
    const home=await createRoleHome(join(root,'home'),initial,{barrier:async(current,detail)=>{if(current===stage&&detail.operationId==='input-first'&&once){once=false;throw Error('synthetic input storage failure');}}});
    const role=await startRole(home,{});const input=bound(home.roleId);const first=await role.runtime.receive(input);
    if(stage==='before-commit-publish') {assert.equal(first.kind,'rejected');assert.equal(first.reason,'storage-error');assert.equal((await role.owner.readOperation(input.operationId)).kind,'not-found');}
    else {
      assert.equal(first.kind,'uncertain');assert.equal(first.operationId,input.operationId);assert.equal((await role.owner.readOperation(input.operationId)).kind,'uncertain');
      assert.equal((await role.runtime.inspect()).home.uncertainOperationId,input.operationId);
      const blocked=await role.runtime.receive({...input,operationId:'new-while-uncertain',externalKey:'different-key'});assert.equal(blocked.kind,'uncertain');assert.equal(blocked.operationId,input.operationId);
    }
    const retried=await role.runtime.receive(input);assert.ok(['accepted','duplicate'].includes(retried.kind));assert.equal(retried.committedRevision,2);
    assert.equal((await home.readSnapshot()).inputs.length,1);assert.equal((await role.owner.readOperation(input.operationId)).inputReceipt.inputId,retried.inputId);await stop(role);
  }
});

test('Home 在串行提交内消费最新输入上限，竞态设置冲突与错误绑定均不接纳原文',async t=>{
  const root=await mkdtemp(join(tmpdir(),'role-input-race-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const home=await createRoleHome(join(root,'home'),initial);const role=await startRole(home,{});const input=bound(home.roleId,{text:'你好'});
  const edit=role.owner.apply({kind:'edit-settings',operationId:'racing-settings',settings:{inputLimitBytes:4},expectedSettingsVersion:1,expectedRevision:1});
  const receive=role.runtime.receive(input);await edit;assert.equal((await receive).reason,'input-too-large');
  assert.equal((await role.runtime.receive({...input,text:'a',bindingId:'other-role-binding'})).reason,'not-bound');
  assert.equal((await role.runtime.receive({...input,text:'a',bindingVersion:2})).reason,'not-bound');
  assert.equal((await role.runtime.receive({...input,text:'a',sourceEvidence:'untrusted-session'})).reason,'invalid-input');
  assert.equal((await role.runtime.receive({...input,text:'\uD800'})).reason,'invalid-input');
  assert.equal((await home.readSnapshot()).inputs.length,0);
  const accepted=role.runtime.receive({...input,text:'🌟'});
  const stale=role.owner.apply({kind:'edit-settings',operationId:'racing-stale-settings',settings:{inputLimitBytes:1},expectedSettingsVersion:2,expectedRevision:2});
  assert.equal((await accepted).kind,'accepted');await assert.rejects(stale,{code:'REVISION_CONFLICT'});
  assert.equal((await home.readSnapshot()).inputs[0].text,'🌟');await stop(role);
});
