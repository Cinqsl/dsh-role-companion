import test from 'node:test';
import assert from 'node:assert/strict';
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

test('Gateway reads default auto-update profile when a partial host omits update config',async t=>{
  const ctx=new Context();
  t.after(async()=>ctx.fiber.dispose());
  for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);
  ctx.typert.register(TYPERT);
  await ctx.plugin(plugin.RoleCompanionController,{
    bootstrap:{get:()=>({path:'',roleId:'',creationOperationId:'',registrationOperationId:'',version:0})},
    restoration:{get:()=>({operationId:'',backupPath:'',destination:'',expectedRoleId:'',expectedManifestDigest:'',requestedProfileVersion:0})},
  });

  const owner=new Peer(ctx,{principal:{kind:'owner'}});
  const view=await ctx.typertGateway.invoke({peer:owner,namespace:'roleCompanion',method:'readAutoUpdate',args:{}});
  assert.deepEqual(
    {enabled:view.enabled,intervalMinutes:view.intervalMinutes,version:view.version,lastOperationId:view.lastOperationId},
    {enabled:false,intervalMinutes:15,version:0,lastOperationId:''},
  );
});
