import './network-guard.mjs';import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {Context} from '@deepseek-ai/cordis';import Loader from '@deepseek-ai/cordis-plugin-loader';import Registry from '@deepseek-ai/dsh-typert-registry';import Access from '@deepseek-ai/dsh-api-remote-access';import Gateway from '@deepseek-ai/dsh-api-gateway';import Inventory from '@deepseek-ai/dsh-host-plugin-inventory';import Commands from '@deepseek-ai/dsh-commands';import {Peer} from '@deepseek-ai/dsh-client-connection';import * as plugin from 'dsh-role-companion';import {TYPERT} from 'dsh-role-companion/typert';import {resolutionEvidence} from './qq-resolution-evidence.mjs';
test('明确再发Remote逐法鉴权与当前Role/绑定保护，未知键/proto/未确认风险无写入',async t=>{
 const root=await mkdtemp(join(tmpdir(),'dsh-reply-gateway39-')),ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin);
 const owner=new Peer(ctx,{principal:{kind:'owner'}}),invoke=(method,args,peer=owner)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args});
 const created=await invoke('createHome',{path:join(root,'role'),request:{operationId:'reply-gateway-create',core:'合成发件',settings:{inputLimitBytes:32768}},expectedProfileVersion:0}),id=created.roleId;
 const before=await invoke('inspect',{});
 const request={operationId:'resolution-gateway',deliveryId:'delivery-missing',sendAttemptId:'send-missing',decision:'resend',note:'核对旧证据后明确再发',duplicateRiskAcknowledged:true,expectedRevision:before.role.revision,expectedDeliveryRulesVersion:1};
 const args={expectedRoleId:id,expectedQQBindingVersion:0,request};
 ctx.remoteAccess.registerPolicy('resolution-guest',{bindings:()=>[{role:{name:'resolution-guest',resource:'global',actions:['roleCompanion/resolveQQDelivery']},resource:{kind:'global'}}]});const guest=new Peer(ctx,{principal:{kind:'resolution-guest'}});
 await assert.rejects(invoke('resolveQQDelivery',args,guest),e=>e.code==='role/owner-required');
 await assert.rejects(invoke('resolveQQDelivery',{...args,request:{...request,actor:'owner'}},guest),e=>e.code==='role/owner-required');
 await assert.rejects(ctx.roleCompanion.resolveQQDelivery(id,0,request),e=>e.code==='role/owner-required');
 await assert.rejects(invoke('resolveQQDelivery',{...args,expectedRoleId:'role-00000000-0000-0000-0000-000000000000'}),e=>e.details?.reason==='ROLE_CHANGED');
 await assert.rejects(invoke('resolveQQDelivery',{...args,expectedQQBindingVersion:1}),e=>e.details?.reason==='QQ_BINDING_CHANGED');
 for(const raw of [{...request,extra:1},{...request,note:''},{...request,duplicateRiskAcknowledged:false},JSON.parse(JSON.stringify(request).slice(0,-1)+',"__proto__":{}}')])await assert.rejects(invoke('resolveQQDelivery',{...args,request:raw}),e=>e.details?.reason==='INVALID_DELIVERY_RESOLUTION');
 const after=await invoke('inspect',{});assert.equal(after.role.revision,before.role.revision);assert.equal((await invoke('readOperation',{operationId:request.operationId,expectedRoleId:id})).kind,'not-found');await resolutionEvidence('40-gateway-guards',{status:'passed',roleId:id,revision:after.role.revision,actual:{models:0,sends:0},guards:['non-owner','forged-actor','direct-no-owner','cross-role','binding','unknown-key','proto','empty-note','risk-unacknowledged']});
});
