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
import {createToolViewFixture} from './tool-view-fixture.mjs';

async function mountFixture(t,fixture,root){
  const ctx=new Context();
  t.after(async()=>{
    try {
      await ctx.fiber.dispose();
    } finally {
      await rm(root,{recursive:true,force:true});
    }
  });
  for(const dependency of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(dependency);
  ctx.typert.register(TYPERT);
  await ctx.plugin(plugin.RoleCompanionController,{
    bootstrap:{get:()=>({path:fixture.path,roleId:fixture.roleId,creationOperationId:'tool-view-create',registrationOperationId:'tool-view-create',version:1})},
    restoration:{get:()=>({operationId:'',backupPath:'',destination:'',expectedRoleId:'',expectedManifestDigest:'',requestedProfileVersion:0})},
    update:{get:()=>({enabled:false,intervalMinutes:15,version:0,lastOperationId:''})},
  });
  const owner=new Peer(ctx,{principal:{kind:'owner'}});
  return {
    ctx,
    guard:{expectedRoleId:fixture.roleId,expectedBindingVersion:1},
    invoke:(method,args)=>ctx.typertGateway.invoke({peer:owner,namespace:'roleCompanion',method,args}),
  };
}

function query(collection,overrides={}){
  return {
    collection,
    keyword:'',
    toolName:'all',
    result:'all',
    channel:'all',
    from:null,
    to:null,
    sort:'newest',
    offset:0,
    limit:20,
    expectedRevision:null,
    ...overrides,
  };
}

function within(promise,label){
  return Promise.race([
    promise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error(`timed out: ${label}`)),5000)),
  ]);
}

test('执行资料库分别查询工具与原生集合且列表不泄露正文或私有定位',async t=>{
  t.diagnostic('create fixture');
  const root=await mkdtemp(join(tmpdir(),'library-executions-'));
  const fixture=await createToolViewFixture(join(root,'home'));
  t.diagnostic('mount gateway');
  const {invoke,guard}=await mountFixture(t,fixture,root);
  t.diagnostic('query tools');

  const tools=await within(invoke('readExecutionLibrary',{...guard,request:query('tools')}),'tool page');
  t.diagnostic('query native');
  assert.equal(tools.collection,'tools');
  assert.equal(tools.total,7);
  assert.equal(tools.items.length,7);
  assert.equal(tools.items[0].collection,'tools');
  assert.equal(tools.items.every(item=>item.collection==='tools'),true);
  assert.equal(tools.items.some(item=>item.name==='role_read'),true);
  assert.equal(typeof tools.filterKey,'string');

  const native=await within(invoke('readExecutionLibrary',{...guard,request:query('native')}),'native page');
  assert.equal(native.collection,'native');
  assert.equal(native.total,8);
  assert.equal(native.items.length,8);
  assert.equal(native.items.every(item=>item.collection==='native'),true);
  assert.notEqual(native.filterKey,tools.filterKey);

  const publicList=JSON.stringify({tools,native});
  assert.equal(publicList.includes(JSON.stringify(fixture.text).slice(1,100)),false);
  assert.equal(publicList.includes(fixture.privateLocator),false);
  assert.equal(publicList.includes('完整最终错误'),false);
  t.diagnostic('assertions complete');
});
