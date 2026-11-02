import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome,qqInputIdentity} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
import {qqEvidence} from './qq-evidence.mjs';

test('QQ绑定与有效来信由同一Runtime/Home持久接纳，重开去重且不启动回复',async t=>{
  const path=await mkdtemp(join(tmpdir(),'dsh-qq-receive38-'));let home,role;
  t.after(async()=>{role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;else await home?.close();await rm(path,{recursive:true,force:true});});
  home=await createRoleHome(join(path,'role'),{operationId:'qq-create',core:'合成角色',settings:{inputLimitBytes:32768}});role=await startRole(home,{});
  const command={kind:'bind-qq',operationId:'qq-bind',connectionId:'connection-synthetic',accountId:'10001',peerId:'20002',expectedBindingVersion:0,expectedRevision:home.revision};
  assert.equal((await role.owner.apply(command)).kind,'committed');
  const binding=(await home.readSnapshot()).qqBinding;assert.equal(binding.version,1);
  const source={connectionId:binding.connectionId,accountId:binding.accountId,peerId:binding.peerId,direction:'incoming',messageId:'-7'};
  const input={...qqInputIdentity(binding,source),qqSource:source,operationId:'qq-input-one',bindingId:binding.bindingId,bindingVersion:binding.version,text:' 原始文字🙂\n',origin:'live',receivedAt:new Date().toISOString(),sourceEvidence:'verified-onebot-friend-text',channel:'qq'};
  const accepted=await role.runtime.receive(input);assert.equal(accepted.kind,'accepted');
  assert.equal((await role.runtime.receive({...input,operationId:'qq-input-retry',receivedAt:new Date().toISOString()})).kind,'duplicate');
  const snapshot=await home.readSnapshot();assert.equal(snapshot.inputs.length,1);assert.equal(snapshot.inputs[0].text,input.text);assert.equal(snapshot.inputs[0].processingUnavailableReason,'qq-replies-unavailable');assert.equal((await home.readConversation()).turns.length,0);
  role.lifetime.requestStop('unload');await role.lifetime.stopped;role=undefined;home=undefined;
  home=await openRoleHome(join(path,'role'));assert.deepEqual((await home.readSnapshot()).qqBinding,binding);
  role=await startRole(home,{});assert.equal((await role.runtime.receive({...input,operationId:'qq-after-restart'})).kind,'duplicate');assert.equal((await home.readConversation()).turns.length,0);
  await qqEvidence('38-home-receive',{status:'passed',roleId:home.roleId,binding,receipt:accepted,snapshot:await home.readSnapshot(),turns:0,publicReopen:true});
});

test('QQ来源身份不能借现有bindingId绕过Home核验',async t=>{
  const path=await mkdtemp(join(tmpdir(),'dsh-qq-source38-'));const home=await createRoleHome(join(path,'role'),{operationId:'source-create',core:'合成角色',settings:{inputLimitBytes:32768}}),role=await startRole(home,{});
  t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;await rm(path,{recursive:true,force:true});});
  await role.owner.apply({kind:'bind-qq',operationId:'source-bind',connectionId:'connection-synthetic',accountId:'10001',peerId:'20002',expectedBindingVersion:0,expectedRevision:home.revision});const binding=(await home.readSnapshot()).qqBinding;
  const receipt=await role.runtime.receive({operationId:'forged-source',bindingId:binding.bindingId,bindingVersion:binding.version,externalKey:'qq-forged',text:'不能进入',channel:'qq',origin:'live',receivedAt:new Date().toISOString(),sourceEvidence:'verified-onebot-friend-text',qqSource:{connectionId:'connection-synthetic',accountId:'99999',peerId:'20002',direction:'incoming',messageId:'-7'}});
  assert.equal(receipt.kind,'rejected');assert.equal(receipt.reason,'not-bound');assert.equal((await home.readSnapshot()).inputs.length,0);
  await qqEvidence('38-home-source-guard',{status:'passed',roleId:home.roleId,revision:home.revision,receipt,inputs:0});
});
