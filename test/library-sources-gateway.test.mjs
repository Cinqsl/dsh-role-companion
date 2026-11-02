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
import {createLibrarySourcesFixture} from './library-sources-fixture.mjs';

async function mountLibrarySources(fixture) {
  const ctx=new Context();
  for(const imported of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(imported);
  ctx.typert.register(TYPERT);
  await ctx.plugin(plugin.RoleCompanionController,{
    bootstrap:{get:()=>({path:fixture.path,roleId:fixture.roleId,creationOperationId:'library-sources-create',registrationOperationId:'library-sources-create',version:1})},
    restoration:{get:()=>({operationId:'',backupPath:'',destination:'',expectedRoleId:'',expectedManifestDigest:'',requestedProfileVersion:0})},
    update:{get:()=>({enabled:false,intervalMinutes:15,version:0,lastOperationId:''})},
  });
  const owner=new Peer(ctx,{principal:{kind:'owner'}});
  return {ctx,invoke:(method,args,peer=owner)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args})};
}

test('资料库来源查询只投影可读经历，并在完整数据集上生成有界预览、筛选、排序和分页',{timeout:30000},async t=>{
  const root=await mkdtemp(join(tmpdir(),'library-sources-gateway-')),fixture=await createLibrarySourcesFixture(join(root,'home')),{ctx,invoke}=await mountLibrarySources(fixture);
  t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});
  const guard={expectedRoleId:fixture.roleId,expectedBindingVersion:1},before=await invoke('inspect',{});
  const newest=await invoke('readLibrarySources',{...guard,request:{offset:0,limit:20,sort:'newest'}});
  assert.equal(newest.total,26);
  assert.equal(newest.datasetTotal,26);
  assert.equal(newest.rangeStart,1);
  assert.equal(newest.rangeEnd,20);
  assert.equal(newest.more,true);
  assert.equal(newest.nextOffset,20);
  assert.equal(newest.sources.length,20);
  assert.equal(newest.sources[0].source.ref.kind,'core');
  assert.deepEqual(new Set(newest.sources.map(source=>source.source.ref.kind)),new Set(['core','input','reply']));
  assert.equal(newest.sources.some(source=>'id'in source.source.ref&&source.source.ref.id===fixture.toolAttemptId),false);
  assert.equal('text' in newest.sources[0].source,false);
  for(const source of newest.sources){assert(Array.from(source.preview).length<=160);assert.equal(source.preview.includes('\n'),false);}
  assert.equal(Array.from(newest.sources[0].preview).length,160);
  assert.equal((await invoke('inspect',{})).role.home.revision,before.role.home.revision);

  const keyword=await invoke('readLibrarySources',{...guard,request:{offset:0,limit:20,keyword:'蓝盐灯塔',sort:'newest'}});
  assert.equal(keyword.total,1);
  assert.equal(keyword.sources[0].source.ref.id,fixture.inputs[21].inputId);

  const oldest=await invoke('readLibrarySources',{...guard,request:{offset:0,limit:20,sort:'oldest'}});
  assert.equal(oldest.sources[0].source.ref.kind,'core');
  assert.equal(oldest.sources[1].source.ref.id,fixture.inputs[0].inputId);

  const second=await invoke('readLibrarySources',{...guard,request:{offset:20,limit:20,sort:'newest'}});
  assert.equal(second.sources.length,6);
  assert.equal(second.rangeStart,21);
  assert.equal(second.rangeEnd,26);
  assert.equal(second.more,false);
  assert.equal(second.nextOffset,null);
  const all=await invoke('readLibrarySources',{...guard,request:{offset:0,limit:50,sort:'newest'}});
  assert.equal(all.sources.length,26);
  assert.equal(all.more,false);

  const selected=oldest.sources.find(source=>source.source.ref.kind==='input'&&source.source.ref.id===fixture.inputs[0].inputId);
  const request={ref:selected.source.ref,revision:oldest.basis.revision,contentDigest:selected.source.contentDigest,offset:0,limit:32};
  const first=await invoke('readContextSource',{...guard,request});
  assert.equal(first.more,true);
  assert.equal(first.source.speaker,'user');
  const home=before.role.home;
  await invoke('applyOwner',{expectedRoleId:fixture.roleId,command:{kind:'edit-core',operationId:'library-sources-core-change',text:'新的核心',expectedCoreVersion:home.core.version,expectedRevision:home.revision}});
  await assert.rejects(invoke('readContextSource',{...guard,request}),error=>error.details?.reason==='CONTEXT_SOURCE_CHANGED');
});

test('资料库来源筛选作用于完整数据集，并保留清理目录、鉴权和只读查询语义',{timeout:30000},async t=>{
  const root=await mkdtemp(join(tmpdir(),'library-sources-filters-')),fixture=await createLibrarySourcesFixture(join(root,'home')),{ctx,invoke}=await mountLibrarySources(fixture);
  t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});
  const guard={expectedRoleId:fixture.roleId,expectedBindingVersion:1},before=await invoke('inspect',{});
  const inputOnly=await invoke('readLibrarySources',{...guard,request:{types:['input'],offset:0,limit:20,sort:'newest'}});
  assert.equal(inputOnly.total,24);
  assert.equal(inputOnly.sources.every(source=>source.source.ref.kind==='input'),true);
  const replyOnly=await invoke('readLibrarySources',{...guard,request:{types:['reply'],offset:0,limit:20}});
  assert.equal(replyOnly.total,1);
  assert.equal(replyOnly.sources[0].source.ref.kind,'reply');
  const complete=await invoke('readLibrarySources',{...guard,request:{types:['core','input','reply'],completeness:'complete',availability:'daily',offset:0,limit:50}});
  assert.equal(complete.total,2);
  const archive=await invoke('readLibrarySources',{...guard,request:{availability:'archive',offset:0,limit:20}});
  assert.equal(archive.total,24);
  assert.equal(archive.datasetTotal,26);
  assert.equal(archive.rangeStart,1);
  assert.equal(archive.rangeEnd,20);
  const ranged=await invoke('readLibrarySources',{...guard,request:{types:['input'],from:'2026-10-01T20:00:00.000Z',to:'2026-10-01T22:00:00.000Z',offset:0,limit:20,sort:'oldest'}});
  assert.equal(ranged.total,3);
  assert.deepEqual(ranged.sources.map(source=>source.source.ref.id),fixture.inputs.slice(20,23).map(input=>input.inputId));
  const empty=await invoke('readLibrarySources',{...guard,request:{keyword:'没有任何匹配词',offset:0,limit:20}});
  assert.equal(empty.total,0);
  assert.equal(empty.datasetTotal,26);
  assert.equal(typeof empty.filterKey,'string');
  assert.notEqual(empty.filterKey,complete.filterKey);

  const cleanupCatalog=await invoke('readContextSources',{...guard,page:{offset:0,limit:100}});
  assert.equal(cleanupCatalog.total,27);
  assert.equal(cleanupCatalog.sources.some(source=>source.ref.kind==='tool'),true);
  assert.equal(cleanupCatalog.sources.some(source=>source.ref.kind==='reply'),true);

  for(const request of [
    {offset:-1,limit:20},
    {offset:0,limit:21},
    {offset:0,limit:20,types:['input','input']},
    {offset:0,limit:20,from:'not-a-time'},
    {offset:0,limit:20,from:'2026-10-02T00:00:00.000Z',to:'2026-10-01T00:00:00.000Z'},
  ])await assert.rejects(invoke('readLibrarySources',{...guard,request}),error=>error.details?.reason==='INVALID_LIBRARY_SOURCE_QUERY');

  const source=inputOnly.sources[0],detailRequest={ref:source.source.ref,revision:inputOnly.revision,contentDigest:source.source.contentDigest,offset:0,limit:16};
  const methods=[['readLibrarySources',{request:{offset:0,limit:20}}],['readContextSource',{request:detailRequest}]];
  ctx.remoteAccess.registerPolicy('library-source-guest',{bindings:()=>[{role:{name:'library-source-reader',resource:'global',actions:methods.map(([method])=>'roleCompanion/'+method)},resource:{kind:'global'}}]});
  const guest=new Peer(ctx,{principal:{kind:'library-source-guest'}});
  for(const [method,extra]of methods){
    const args={...guard,...extra};
    await assert.rejects(invoke(method,args,guest),error=>error.code==='role/owner-required');
    await assert.rejects(invoke(method,{...args,expectedRoleId:'role-00000000-0000-4000-8000-000000000000'}),error=>error.details?.reason==='ROLE_CHANGED');
    await assert.rejects(invoke(method,{...args,expectedBindingVersion:2}),error=>error.details?.reason==='BINDING_CHANGED');
  }
  assert.equal((await invoke('inspect',{})).role.home.revision,before.role.home.revision);
});
