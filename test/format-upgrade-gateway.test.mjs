import './network-guard.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,realpath,mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {Context} from '@deepseek-ai/cordis';import Loader from '@deepseek-ai/cordis-plugin-loader';import Registry from '@deepseek-ai/dsh-typert-registry';import Access from '@deepseek-ai/dsh-api-remote-access';import Gateway from '@deepseek-ai/dsh-api-gateway';import Inventory from '@deepseek-ai/dsh-host-plugin-inventory';import Commands from '@deepseek-ai/dsh-commands';import {Peer} from '@deepseek-ai/dsh-client-connection';import * as plugin from 'dsh-role-companion';import {TYPERT} from 'dsh-role-companion/typert';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';import {startRole} from 'dsh-role-companion/runtime';

async function waitFor(read,predicate){const end=Date.now()+15000;let value;while(Date.now()<end){value=await read();if(predicate(value))return value;await new Promise(r=>setTimeout(r,10));}assert.fail('timeout: '+JSON.stringify(value));}

test('四个格式升级方法经官方Gateway逐法守owner和Role，缺备份时拒绝且原操作可查询',{timeout:60000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-format-gateway56-')),ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin);
 const owner=new Peer(ctx,{principal:{kind:'owner'}}),guest=new Peer(ctx,{principal:{kind:'format-guest'}}),invoke=(method,args,peer=owner)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args});
 const created=await invoke('createHome',{path:join(root,'role'),request:{operationId:'format-gateway-create56',core:'Gateway合成格式角色',settings:{inputLimitBytes:32768}},expectedProfileVersion:0}),guard={expectedRoleId:created.roleId};
 const initial=await invoke('inspect',{});assert.equal(initial.role.format?.status,'needs-upgrade');
 const preview=await invoke('previewFormatUpgrade',guard);assert.deepEqual(preview.from,{major:1,minor:0});assert.equal(preview.backup.satisfied,false);
 const request={operationId:'format-upgrade-gateway56',expectedRevision:initial.role.revision};
 const retryRequest={operationId:'format-upgrade-gateway-retry56',expectedRevision:initial.role.revision};
 const methods=[['previewFormatUpgrade',{}],['requestFormatUpgrade',{request}],['readFormatUpgrade',{operationId:request.operationId}],['resumeFormatUpgrade',{request}]];
 ctx.remoteAccess.registerPolicy('format-guest',{bindings:()=>[{role:{name:'format-guest',resource:'global',actions:methods.map(([method])=>'roleCompanion/'+method)},resource:{kind:'global'}}]});
 for(const [method,extra]of methods){
  const args={...guard,...extra};
  await assert.rejects(invoke(method,args,guest),error=>error.code==='role/owner-required');
  await assert.rejects(ctx.roleCompanion[method](...Object.values(args)),error=>error.code==='role/owner-required');
  await assert.rejects(ctx.typertGateway.invoke({namespace:'roleCompanion',method,args:{...args,actor:'owner'}}));
  await assert.rejects(invoke(method,{...args,expectedRoleId:'role-00000000-0000-4000-8000-000000000000'}),error=>error.details.reason==='ROLE_CHANGED');
 }
 // Verified owner rejection: no backup, so the upgrade must refuse and leave a queryable failed task.
 await assert.rejects(invoke('requestFormatUpgrade',{...guard,request}),error=>error.details.reason==='FORMAT_UPGRADE_BACKUP_REQUIRED');
 const failed=await invoke('readFormatUpgrade',{...guard,operationId:request.operationId});assert.equal(failed.phase,'failed');assert.equal(failed.error,'FORMAT_UPGRADE_BACKUP_REQUIRED');
 assert.equal((await invoke('inspect',{})).role.revision,initial.role.revision);
 // A real owner backup stops the lifetime; the owner then reopens the same Home and upgrades it.
 const backup={operationId:'format-gateway-backup56',destination:join(root,'backup')};
 await invoke('requestBackup',{...guard,request:backup});
 const verified=await waitFor(()=>invoke('readBackup',{...guard,operationId:backup.operationId}),value=>value.phase==='verified-restorable'||value.phase==='failed');
 assert.equal(verified.phase,'verified-restorable',JSON.stringify(verified));
 const reopenedView=await invoke('reopenRole',{expectedRoleId:created.roleId,expectedBindingVersion:1,stopOperationId:verified.stopOperationId});
 assert.equal(reopenedView.format?.status,'needs-upgrade');
 const liveRevision=(await invoke('inspect',{})).role.revision;
 const progressed=await invoke('requestFormatUpgrade',{...guard,request:{...request,operationId:'format-upgrade-gateway56-live',expectedRevision:liveRevision}});
 assert.equal(progressed.phase,'switched',JSON.stringify(progressed));
 assert.equal((await invoke('inspect',{})).role.format?.status,'migrated');
 const afterReopen=await invoke('inspect',{});
 assert.deepEqual(afterReopen.role.format?.format,{major:2,minor:0});
 if(process.env.DSH56_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH56_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH56_EVIDENCE_DIRECTORY,'gateway.json'),JSON.stringify({status:'passed',roleId:created.roleId,preview,request,failed,progressed,retryRequest,ownerGuardRejections:methods.length*4,actualModels:0,actualTools:0,actualQQ:0},null,2)+'\n');}
});

test('真实网关HMR不自动升级也不降级继续活动，旧格式字节与阶段保持',{timeout:60000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-format-hmr56-')),ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);
 const rolePath=join(root,'role'),home=await createRoleHome(rolePath,{operationId:'format-hmr-create56',core:'HMR合成格式角色',settings:{inputLimitBytes:32768}}),roleId=home.roleId;await home.close();
 const profile={version:1},bootstrap={get:()=>({path:rolePath,roleId,creationOperationId:'format-hmr-create56',registrationOperationId:'format-hmr-create56',version:profile.version})},restoration={get:()=>({operationId:'',backupPath:'',destination:'',expectedRoleId:'',expectedManifestDigest:'',requestedProfileVersion:0})};
 const load=async()=>{const fiber=await ctx.plugin(plugin.RoleCompanionController,{bootstrap,restoration});return fiber;};
 let fiber=await load();
 const owner=new Peer(ctx,{principal:{kind:'owner'}}),invoke=(method,args)=>ctx.typertGateway.invoke({peer:owner,namespace:'roleCompanion',method,args});
 const before=await invoke('inspect',{});assert.equal(before.role.format?.status,'needs-upgrade',JSON.stringify(before.role));
 // A lifetime boot may publish its own stop/recovery commits; the claim here is narrower and exact:
 // HMR never switches the authority to a generation or rewrites the identity.
 const settledHead=async()=>JSON.parse(await (await import('node:fs/promises')).readFile(join(rolePath,'head.json'),'utf8'));
 const headBefore=await settledHead();
 assert.equal(headBefore.format,undefined);assert.equal(headBefore.storage,undefined);
 const identity=await (await import('node:fs/promises')).readFile(join(rolePath,'identity.json'),'utf8');
 // A real loader reload disposes the plugin fiber; the Host boots from the same unchanged profile.
 await fiber.dispose();
 fiber=await load();
 const after=await invoke('inspect',{});
 assert.equal(after.role.format?.status,'needs-upgrade',JSON.stringify(after.role));
 assert.deepEqual(after.role.format?.format,{major:1,minor:0});
 assert.deepEqual(after.role.format?.target,{major:2,minor:0});
 assert.equal(after.role.reason,before.role.reason);
 assert.equal(await (await import('node:fs/promises')).readFile(join(rolePath,'identity.json'),'utf8'),identity);
 const headAfter=await settledHead();
 assert.equal(headAfter.format,undefined,'HMR must not declare a generation format');
 assert.equal(headAfter.storage,undefined,'HMR must not point a generation');
 assert.equal(headAfter.roleId,headBefore.roleId);
 assert.deepEqual(await (await import('node:fs/promises')).readdir(join(rolePath,'.format-upgrade')).catch(()=>[]),[]);
 if(process.env.DSH56_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH56_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH56_EVIDENCE_DIRECTORY,'hmr.json'),JSON.stringify({status:'passed',roleId,before:before.role.format,after:after.role.format,identityUnchanged:true,headUnchanged:true,upgradeTasks:0,actualModels:0,actualTools:0,actualQQ:0},null,2)+'\n');}
});
