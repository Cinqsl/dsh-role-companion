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
import {qqEvidence} from './qq-evidence.mjs';

test('真实Gateway逐法保护QQ管理，空配置不连接并拒绝缺少profile owner的保存',async t=>{
  const root=await mkdtemp(join(tmpdir(),'dsh-qq-gateway38-')),ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});
  for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin);
  const owner=new Peer(ctx,{principal:{kind:'owner'}}),invoke=(method,args,peer=owner)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args});
  const created=await invoke('createHome',{path:join(root,'role'),request:{operationId:'qq-gateway-create',core:'合成角色',settings:{inputLimitBytes:32768}},expectedProfileVersion:0}),id=created.roleId;
  const view=await invoke('readQQ',{expectedRoleId:id,expectedQQBindingVersion:0});assert.equal(view.profileVersion,0);assert.equal(view.binding,null);assert.equal(view.transport.replies,'unavailable');assert.equal(view.transport.counts.connections,0);
  const value={enabled:false,endpoint:'',credentialRef:'',maxFrameBytes:1048576,readTimeoutMs:10000,reconnectInitialMs:1000,reconnectMaxMs:60000,jitterRatio:0.2};
  await assert.rejects(invoke('editQQConnection',{expectedRoleId:id,expectedQQBindingVersion:0,request:{operationId:'qq-config',expectedProfileVersion:0,value}}),error=>error.details.reason==='PROFILE_EDITOR_UNAVAILABLE');
  ctx.remoteAccess.registerPolicy('qq-guest',{bindings:()=>[{role:{name:'qq-guest',resource:'global',actions:['roleCompanion/readQQ','roleCompanion/editQQConnection','roleCompanion/bindQQ','roleCompanion/recheckQQ']},resource:{kind:'global'}}]});
  const guest=new Peer(ctx,{principal:{kind:'qq-guest'}});
  for(const [method,args] of [['readQQ',{expectedRoleId:id,expectedQQBindingVersion:0}],['editQQConnection',{expectedRoleId:id,expectedQQBindingVersion:0,request:{operationId:'qq-config',expectedProfileVersion:0,value}}],['bindQQ',{expectedRoleId:id,expectedQQBindingVersion:0,request:{operationId:'qq-bind',accountId:'10001',peerId:'20002',expectedRevision:1,replaceConfirmed:false}}],['recheckQQ',{expectedRoleId:id,expectedQQBindingVersion:0}]]){
    await assert.rejects(invoke(method,args,guest),error=>error.code==='role/owner-required');await assert.rejects(ctx.roleCompanion[method](...Object.values(args)),error=>error.code==='role/owner-required');
    await assert.rejects(invoke(method,{...args,expectedRoleId:'role-00000000-0000-0000-0000-000000000000'}),error=>error.details?.reason==='ROLE_CHANGED');await assert.rejects(invoke(method,{...args,expectedQQBindingVersion:1}),error=>error.details?.reason==='QQ_BINDING_CHANGED');
  }
  await assert.rejects(invoke('readQQ',{expectedRoleId:'role-00000000-0000-0000-0000-000000000000',expectedQQBindingVersion:0}),error=>error.details.reason==='ROLE_CHANGED');
  await assert.rejects(invoke('readQQ',{expectedRoleId:id,expectedQQBindingVersion:1}),error=>error.details.reason==='QQ_BINDING_CHANGED');
  await qqEvidence('38-gateway-first-guards',{status:'passed',roleId:id,view,methods:['readQQ','editQQConnection','bindQQ','recheckQQ'],ownerRequired:true,roleGuard:true,bindingGuard:true,withoutProfileEditorRejected:true});
});
