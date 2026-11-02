import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {Context} from '@deepseek-ai/cordis';
import Loader from '@deepseek-ai/cordis-plugin-loader';
import Registry from '@deepseek-ai/dsh-typert-registry';
import Access from '@deepseek-ai/dsh-api-remote-access';
import Gateway from '@deepseek-ai/dsh-api-gateway';
import Inventory from '@deepseek-ai/dsh-host-plugin-inventory';
import Commands from '@deepseek-ai/dsh-commands';
import {Peer} from '@deepseek-ai/dsh-client-connection';
import * as plugin from 'dsh-role-companion';
import {TYPERT} from 'dsh-role-companion/typert';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';

test('真实 Gateway 的 owner 面板绑定固定来源，逐一鉴权提交与读取且拒绝正文权限伪造',async t=>{
  const root=await mkdtemp(join(tmpdir(),'role-input-gateway-'));const ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});
  for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin);
  const owner=new Peer(ctx,{principal:{kind:'owner'}});let expectedRoleId='';const invoke=(method,args,peer=owner)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args:{...args,...(method==='readInputs'?{expectedRoleId}:{})}});
  const created=await invoke('createHome',{path:join(root,'home'),request:{operationId:'create-panel-home',core:'合成面板角色',settings:{inputLimitBytes:32768}},expectedProfileVersion:0});
  expectedRoleId=created.roleId;const request={clientRequestId:'browser-request',operationId:'panel-input',text:'  保留原文🌟\n',expectedRoleId,expectedBindingVersion:1};
  const receipt=await invoke('submitInput',{request});assert.equal(receipt.kind,'accepted');
  const list=await invoke('readInputs',{});assert.equal(list.roleId,created.roleId);assert.equal(list.binding.bindingId,'panel-'+created.roleId);assert.equal(list.inputs.length,1);assert.equal(list.inputs[0].text,request.text);assert.equal(list.inputs[0].sourceEvidence,'authenticated-owner-panel');assert.equal(list.processing,'unavailable');
  assert.equal((await invoke('submitInput',{request})).kind,'duplicate');
  // Gateway's compatible input decoder ignores unknown extension fields.
  for(const forged of [{actor:'owner'},{roleId:'other-role'},{bindingId:'other-binding'},{sourceEvidence:'system'}])assert.equal((await invoke('submitInput',{request:{...request,...forged}})).inputId,receipt.inputId);
  ctx.remoteAccess.registerPolicy('fixture-input-guest',{bindings:()=>[{role:{name:'guest-input',resource:'global',actions:['roleCompanion/submitInput','roleCompanion/readInputs']},resource:{kind:'global'}}]});
  const guest=new Peer(ctx,{principal:{kind:'fixture-input-guest'}});
  await assert.rejects(invoke('submitInput',{request:{...request,actor:'owner',bindingId:'forged'}},guest),error=>error.code==='role/owner-required');
  for(const [method,args]of [['submitInput',{request}],['readInputs',{}]]) {
    await assert.rejects(invoke(method,args,guest),error=>error.code==='role/owner-required');
    await assert.rejects(ctx.roleCompanion[method](...Object.values(args)),error=>error.code==='role/owner-required');
    await assert.rejects(ctx.typertGateway.invoke({namespace:'roleCompanion',method,args}));
  }
  assert.equal((await invoke('readInputs',{})).inputs.length,1);
  const metadata=(await invoke('inspect',{})).role.home;assert.equal('inputs' in metadata,false);assert.equal(metadata.inputSummary.queued,1);
  await invoke('submitInput',{request:{...request,clientRequestId:'second-key',operationId:'second-operation'}});
  const page=await invoke('readInputs',{page:{afterSequence:0,limit:1}});assert.equal(page.inputs.length,1);assert.equal(page.total,2);assert.equal(page.more,true);assert.equal(page.nextAfterSequence,1);
  const next=await invoke('readInputs',{page:{afterSequence:page.nextAfterSequence,limit:1}});assert.equal(next.inputs[0].receiveSequence,2);assert.equal(next.inputs[0].text,request.text);assert.equal(next.more,false);
  for(const page of [{afterSequence:0,limit:5},{afterSequence:-1,limit:1}])await assert.rejects(invoke('readInputs',{page}),error=>error.details.reason==='INVALID_INPUT_PAGE');
});

test('真实 Gateway 在 A 切换 B 后拒绝旧面板的输入、编辑与原操作查询，不重新选择目标',async t=>{
  const root=await mkdtemp(join(tmpdir(),'role-stale-panel-'));const homes=[];
  for(const name of ['a','b']) {const path=join(root,name);const home=await createRoleHome(path,{operationId:'create-'+name,core:'角色 '+name,settings:{inputLimitBytes:32768}});homes.push({path,roleId:home.roleId,creationOperationId:'create-'+name,registrationOperationId:'create-'+name,version:1});await home.close();}
  let selection=homes[0];const ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});
  for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);
  // Same public controller and schema-compatible Host bootstrap reference as production.
  await ctx.plugin(plugin.RoleCompanionController,{bootstrap:{get:()=>selection},restoration:{get:()=>({operationId:'',backupPath:'',destination:'',expectedRoleId:'',expectedManifestDigest:'',requestedProfileVersion:0})}});
  const owner=new Peer(ctx,{principal:{kind:'owner'}});const invoke=(method,args)=>ctx.typertGateway.invoke({peer:owner,namespace:'roleCompanion',method,args});
  assert.equal((await invoke('inspect',{})).role.roleId,homes[0].roleId);
  const request=Object.freeze({clientRequestId:'stale-a-key',operationId:'stale-a-operation',text:'写给 A 的原文',expectedRoleId:homes[0].roleId,expectedBindingVersion:1});
  selection=homes[1];ctx.roleCompanion.reconcileBootstrap();
  for(let attempt=0;attempt<100;attempt++){if((await invoke('inspect',{})).role.roleId===homes[1].roleId)break;await new Promise(resolve=>setTimeout(resolve,10));}
  assert.equal((await invoke('inspect',{})).role.roleId,homes[1].roleId);
  const before=(await invoke('inspect',{})).role;
  const stale=await invoke('submitInput',{request});assert.equal(stale.kind,'rejected');assert.equal(stale.reason,'role-changed');
  let coreError,queryError;
  await assert.rejects(invoke('applyOwner',{command:{kind:'edit-core',operationId:'stale-core',text:'不得覆盖 B',expectedRevision:2,expectedCoreVersion:1},expectedRoleId:homes[0].roleId}),error=>{coreError={code:error.code,reason:error.details.reason};return error.details.reason==='ROLE_CHANGED';});
  await assert.rejects(invoke('readOperation',{operationId:request.operationId,expectedRoleId:homes[0].roleId}),error=>{queryError={code:error.code,reason:error.details.reason};return error.details.reason==='ROLE_CHANGED';});
  assert.equal((await invoke('readInputs',{expectedRoleId:homes[1].roleId})).inputs.length,0);
  assert.equal((await invoke('inspect',{})).role.home.core.text,'角色 b');
  const afterRejected=(await invoke('inspect',{})).role;assert.equal(afterRejected.revision,before.revision);
  assert.equal((await invoke('submitInput',{request:{...request,expectedRoleId:homes[1].roleId,expectedBindingVersion:2}})).reason,'not-bound');
  const control=await invoke('submitInput',{request:{...request,operationId:'valid-b-operation',clientRequestId:'valid-b-key',expectedRoleId:homes[1].roleId}});assert.equal(control.kind,'accepted');
  assert.equal((await invoke('readInputs',{expectedRoleId:homes[1].roleId})).inputs.length,1);
  assert.equal(request.expectedRoleId,homes[0].roleId);assert.equal(request.operationId,'stale-a-operation');assert.equal(request.clientRequestId,'stale-a-key');
  const old=await openRoleHome(homes[0].path);const oldSnapshot=await old.readSnapshot();assert.equal(oldSnapshot.inputs.length,0);await old.close();
  t.diagnostic(JSON.stringify({caseId:'33-stale-role-gateway-guard',roleA:homes[0].roleId,roleB:homes[1].roleId,originalRequest:request,staleInput:stale,coreError,queryError,beforeBRevision:before.revision,afterRejectedBRevision:afterRejected.revision,validCurrentBReceipt:control,retainedARevision:oldSnapshot.revision,actualEntries:{staleInputCommits:0,staleCoreCommits:0,validCurrentBInputCommits:1,model:0,web:0,qq:0},fullAcceptanceCasesPassed:[]}));
});
