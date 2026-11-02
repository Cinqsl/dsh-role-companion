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

async function roleFixture(t) {
  const root=await mkdtemp(join(tmpdir(),'library-overview-gateway-'));
  const ctx=new Context();
  t.after(async()=>{
    await ctx.fiber.dispose();
    await rm(root,{recursive:true,force:true});
  });
  for(const dependency of [Loader,Registry,Access,Gateway,Inventory,Commands]) {
    await ctx.plugin(dependency);
  }
  ctx.typert.register(TYPERT);
  await ctx.plugin(plugin);
  const owner=new Peer(ctx,{principal:{kind:'owner'}});
  const guest=new Peer(ctx,{principal:{kind:'overview-guest'}});
  const invoke=(method,args,peer=owner)=>
    ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args});
  const created=await invoke('createHome',{
    path:join(root,'home'),
    request:{
      operationId:'library-overview-create',
      core:'合成角色，用于资料概览测试。',
      settings:{inputLimitBytes:32768},
    },
    expectedProfileVersion:0,
  });
  return {
    ctx,
    invoke,
    guest,
    guard:{expectedRoleId:created.roleId,expectedBindingVersion:1},
  };
}

test('资料概览经真实 Gateway 读取空状态且不新增操作或 revision',{timeout:30000},async t=>{
  const {ctx,invoke,guest,guard}=await roleFixture(t);
  const before=await invoke('inspect',{});
  const overview=await invoke('readLibraryOverview',guard);

  assert.equal(overview.roleId,guard.expectedRoleId);
  assert.equal(overview.revision,before.role.home.revision);
  assert.deepEqual(overview.actions,[]);
  assert.equal(overview.actionCount,0);
  assert.deepEqual(overview.recent,[]);
  assert.equal((await invoke('inspect',{})).role.home.revision,before.role.home.revision);

  const method='readLibraryOverview';
  ctx.remoteAccess.registerPolicy('overview-guest',{
    bindings:()=>[{
      role:{name:'overview-reader',resource:'global',actions:[`roleCompanion/${method}`]},
      resource:{kind:'global'},
    }],
  });
  await assert.rejects(invoke(method,guard,guest),error=>error.code==='role/owner-required');
  await assert.rejects(
    invoke(method,{...guard,expectedRoleId:'role-00000000-0000-4000-8000-000000000000'}),
    error=>error.details?.reason==='ROLE_CHANGED',
  );
  await assert.rejects(
    invoke(method,{...guard,expectedBindingVersion:2}),
    error=>error.details?.reason==='BINDING_CHANGED',
  );
});
