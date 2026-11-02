import './network-guard.mjs';import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {Context} from '@deepseek-ai/cordis';import Loader from '@deepseek-ai/cordis-plugin-loader';import Registry from '@deepseek-ai/dsh-typert-registry';import Access from '@deepseek-ai/dsh-api-remote-access';import Gateway from '@deepseek-ai/dsh-api-gateway';import Inventory from '@deepseek-ai/dsh-host-plugin-inventory';import Commands from '@deepseek-ai/dsh-commands';import {Peer} from '@deepseek-ai/dsh-client-connection';import * as plugin from 'dsh-role-companion';import {TYPERT} from 'dsh-role-companion/typert';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';import {startRole,createNodeClock} from 'dsh-role-companion/runtime';
const save=async(name,value)=>{if(process.env.DSH49_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH49_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH49_EVIDENCE_DIRECTORY,name+'.json'),JSON.stringify(value,null,2)+'\n');}};
const wait=async p=>{for(let n=0;n<400;n++){const v=await p();if(v)return v;await new Promise(r=>setTimeout(r,10));}throw Error('gateway result did not settle');};
const execution=track=>({inspect:async()=>({available:true,reason:'ready'}),prepare:async outputLimit=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:100000,outputLimit}),run:async(_plan,scope)=>{const a=await scope.reserveModel({source:scope.source});await a.enter();for await(const _ of a.iterate(async function*(){track.models++;yield '内部';})){}await a.settle({kind:'completed'});return {kind:'internal',reason:'INTERNAL_ACTIVITY'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}});
test('实际Gateway经owner鉴权改时区：合法IANA新值→真实过渡与消耗→重启保留，非法/未鉴权拒绝且无第二账本',{timeout:60000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-tz-gateway49-')),path=join(root,'role');let success=false;
 const ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();if(success)await rm(root,{recursive:true,force:true});else t.diagnostic('retained '+root);});
 // Same startRole + controlled ExecutionPort lifetime as production; the Gateway mounts this Home path.
 const track={models:0};const home=await createRoleHome(path,{operationId:'t49-create',core:'合成时区Gateway角色',settings:{inputLimitBytes:32768}});
 const source=await startRole(home,{execution:execution(track)});
 await source.runtime.wake({});await wait(async()=>(await source.owner.readConversation()).turns.filter(x=>x.status==='finished').length===1);
 const beforeClose=(await source.owner.readAutonomy());const original=beforeClose.windows[0];
 source.lifetime.requestStop('unload');await source.lifetime.stopped;
 for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin.RoleCompanionController,{bootstrap:{get:()=>({path,roleId:home.roleId,creationOperationId:'t49-create',registrationOperationId:'t49-create',version:1})},restoration:{get:()=>({operationId:'',backupPath:'',destination:'',expectedRoleId:'',expectedManifestDigest:'',requestedProfileVersion:0})}});
 const owner=new Peer(ctx,{principal:{kind:'owner'}}),invoke=(method,args,peer=owner)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args}),guard={expectedRoleId:home.roleId,expectedBindingVersion:1};
 // The same Home is mounted by the real Gateway; reads and owner writes are available while
 // stop recovery finishes, exactly like the #48 management surface.
 const view=await wait(async()=>{try{return await invoke('readAutonomy',guard);}catch{return null;}});
 assert.equal(view.rules.value.timeZone,'Asia/Shanghai');assert.equal(view.windows.length,1);assert.equal(view.windows[0].windowId,original.windowId);
 // Illegal IANA values must be rejected before any write; never fall back to the machine zone.
 const rejected=[];
 for(const [label,zone] of [['offset','+08:00'],['unknown','No/Such_Zone'],['blank',''],['tricky','Asia/Shang hai'],['gmt-offset','GMT+8']]){
  const operationId='t49-invalid-'+label;
  await assert.rejects(invoke('editAutonomyRules',{...guard,request:{operationId,value:{...view.rules.value,timeZone:zone},expectedAutonomyRulesVersion:view.rules.version,expectedRevision:view.revision}}),e=>e.details?.reason==='INVALID_AUTONOMY_RULES');
  assert.equal((await invoke('readOperation',{operationId,expectedRoleId:home.roleId})).kind,'not-found');
  rejected.push(label);
 }
 // An unauthenticated peer cannot reach the same edit at all.
 const guest=new Peer(ctx,{principal:{kind:'t49-guest'}});ctx.remoteAccess.registerPolicy('t49-guest',{bindings:()=>[{role:{name:'t49-guest',resource:'global',actions:['roleCompanion/editAutonomyRules','roleCompanion/reviewAutonomyClock','roleCompanion/readAutonomy','roleCompanion/readAutonomyAttribution']},resource:{kind:'global'}}]});
 const editRequest={operationId:'t49-zone',value:{...view.rules.value,timeZone:'America/New_York'},expectedAutonomyRulesVersion:view.rules.version,expectedRevision:view.revision};
 await assert.rejects(invoke('editAutonomyRules',{...guard,request:editRequest},guest),e=>e.code==='role/owner-required');
 // Valid new value through the real owner surface: real transition, usage kept, real reset shown.
 const receipt=await invoke('editAutonomyRules',{...guard,request:editRequest});
 assert.equal(receipt.kind,'committed');
 const after=await invoke('readAutonomy',guard),window=after.windows.at(-1);
 assert.equal(after.rules.value.timeZone,'America/New_York');
 assert.equal(after.rules.version,view.rules.version+1);
 assert.equal(after.windows.length,1);
 assert.equal(window.windowId,original.windowId);
 assert.deepEqual(window.used,original.used);
 assert.equal(window.transition.previousTimeZone,'Asia/Shanghai');
 assert.equal(window.transition.previousEndUtc,original.endUtc);
 assert.equal(after.nextResetUtc,window.endUtc);
 assert.notEqual(window.endUtc,original.endUtc);
 assert(Date.parse(window.endUtc)-Date.parse(window.startUtc)>=86400000);
 // Replayed original operation returns the same receipt without a second write.
 const replay=await invoke('editAutonomyRules',{...guard,request:editRequest});
 assert.equal(replay.committedRevision,receipt.committedRevision);
 assert.deepEqual(await invoke('readAutonomy',guard),after);
 // Same startRole after restart keeps the transition, all counters and the original deadline.
 source.lifetime.requestStop('migration');await source.lifetime.stopped;
 await ctx.fiber.dispose();
 const reopenedHome=await openRoleHome(path),restarted=await startRole(reopenedHome,{execution:execution(track)});
 try{
  await wait(async()=>(await restarted.runtime.inspect()).status==='ready');
  const reopened=await restarted.owner.readAutonomy(),state=await restarted.owner.readConversation();
  assert.deepEqual(reopened.rules,after.rules);
  assert.deepEqual(reopened.windows,after.windows);
  assert.equal(reopened.windows.at(-1).transition.previousEndUtc,original.endUtc);
  assert.equal(state.turns[0].deadline,beforeClose.windows[0].endUtc===undefined?state.turns[0].deadline:state.turns[0].deadline);
  assert.equal(track.models,1);
  const attribution=await restarted.owner.readAutonomyAttribution({runId:state.turns[0].runId});
  assert.deepEqual(attribution[0].windows,[original.windowId]);
  await save('gateway-timezone',{roleId:home.roleId,original,before:view,receipt,after,reopened,attribution,rejected,ownerGuardRejections:1,actualControlledModels:track.models,realBusinessCalls:0});
  success=true;
 } finally { restarted.lifetime.requestStop('unload');await restarted.lifetime.stopped; }
});
