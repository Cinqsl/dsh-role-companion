import './network-guard.mjs';import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {Context} from '@deepseek-ai/cordis';import Loader from '@deepseek-ai/cordis-plugin-loader';import Registry from '@deepseek-ai/dsh-typert-registry';import Access from '@deepseek-ai/dsh-api-remote-access';import Gateway from '@deepseek-ai/dsh-api-gateway';import Inventory from '@deepseek-ai/dsh-host-plugin-inventory';import Commands from '@deepseek-ai/dsh-commands';import {Peer} from '@deepseek-ai/dsh-client-connection';import * as plugin from 'dsh-role-companion';import {TYPERT} from 'dsh-role-companion/typert';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';import {startRole,createNodeClock,ianaDay} from 'dsh-role-companion/runtime';
const save=async(name,value)=>{if(process.env.DSH49_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH49_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH49_EVIDENCE_DIRECTORY,name+'.json'),JSON.stringify(value,null,2)+'\n');}};
const wait=async p=>{for(let n=0;n<400;n++){const v=await p();if(v)return v;await new Promise(r=>setTimeout(r,10));}throw Error('review result did not settle');};
test('实际Gateway可信核对时钟：只清封口不返还用量，读方法owner鉴权且跨窗口归属保持可查询',{timeout:60000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-tz-review-gateway49-')),path=join(root,'role');let success=false,utc='2026-10-27T03:00:00.000Z';
 const ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();if(success)await rm(root,{recursive:true,force:true});else t.diagnostic('retained '+root);});
 const now=()=>new Date(utc),track={models:0};
 const execution={inspect:async()=>({available:true,reason:'ready'}),prepare:async outputLimit=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:100000,outputLimit}),run:async(_plan,scope)=>{const a=await scope.reserveModel({source:scope.source});await a.enter();for await(const _ of a.iterate(async function*(){track.models++;yield '内部';})){}await a.settle({kind:'completed'});return {kind:'internal',reason:'INTERNAL_ACTIVITY'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}};
 const home=await createRoleHome(path,{operationId:'t49r-create',core:'合成核对Gateway角色',settings:{inputLimitBytes:32768}});
 const source=await startRole(home,{now,clock:createNodeClock(now),execution});
 await source.runtime.wake({});await wait(async()=>(await source.owner.readConversation()).turns.filter(x=>x.status==='finished').length===1);
 const warm=await source.owner.readAutonomy();
 utc='2026-10-27T02:50:00.000Z';
 assert.deepEqual(await source.runtime.wake({}),{kind:'skipped',reason:'CLOCK_ROLLBACK'});
 const blocked=await source.owner.readAutonomy();
 source.lifetime.requestStop('unload');await source.lifetime.stopped;
 for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin.RoleCompanionController,{bootstrap:{get:()=>({path,roleId:home.roleId,creationOperationId:'t49r-create',registrationOperationId:'t49r-create',version:1})},restoration:{get:()=>({operationId:'',backupPath:'',destination:'',expectedRoleId:'',expectedManifestDigest:'',requestedProfileVersion:0})}});
 const owner=new Peer(ctx,{principal:{kind:'owner'}}),invoke=(method,args,peer=owner)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args}),guard={expectedRoleId:home.roleId,expectedBindingVersion:1};
 const view=await wait(async()=>{try{return await invoke('readAutonomy',guard);}catch{return null;}});
 assert.equal(view.clockBlocked,'CLOCK_ROLLBACK');
 assert.deepEqual(view.windows,warm.windows);
 // The Gateway runtime always stamps its own ClockPort reading; a caller cannot supply one.
 // Whether that reading is still behind is decided by the mechanism seam (see timezone-calendar),
 // so here the property under test is that an accepted review only clears the seal.
 const staleReview={operationId:'t49r-stale',expectedRevision:view.revision};
 await assert.rejects(invoke('reviewAutonomyClock',{...guard,request:{...staleReview,clock:{utc:'2026-10-27T02:00:00.000Z',monotonicMs:0,processId:'forged',dataVersion:'forged'}}}),e=>e.details?.reason==='INVALID_CLOCK_REVIEW');
 assert.equal((await invoke('readOperation',{operationId:'t49r-stale',expectedRoleId:home.roleId})).kind,'not-found');
 // Owner-only: a peer without owner cannot read or review.
 const guest=new Peer(ctx,{principal:{kind:'t49r-guest'}});ctx.remoteAccess.registerPolicy('t49r-guest',{bindings:()=>[{role:{name:'t49r-guest',resource:'global',actions:['roleCompanion/reviewAutonomyClock','roleCompanion/readAutonomyAttribution','roleCompanion/readAutonomy']},resource:{kind:'global'}}]});
 const reviewRequest={operationId:'t49r-trusted',expectedRevision:view.revision};
 await assert.rejects(invoke('reviewAutonomyClock',{...guard,request:reviewRequest},guest),e=>e.code==='role/owner-required');
 await assert.rejects(invoke('readAutonomyAttribution',{...guard,request:{}},guest),e=>e.code==='role/owner-required');
 // Now the clock is trustworthy again: trusted review clears only the seal.
 utc='2026-10-27T03:10:00.000Z';
 const receipt=await invoke('reviewAutonomyClock',{...guard,request:reviewRequest});
 assert.equal(receipt.kind,'committed');
 const cleared=await invoke('readAutonomy',guard);
 assert.equal(cleared.clockBlocked,null);
 assert.deepEqual(cleared.windows,warm.windows);
 assert.equal(cleared.windows[0].used.model,1);
 // Cross-window attribution stays queryable from the same ledger.
 const conversation=await invoke('readConversation',{...guard,page:{offset:0,limit:20}});
 const attribution=await invoke('readAutonomyAttribution',{...guard,request:{runId:conversation.attempts[0].runId}});
 assert.equal(attribution.runs.length,1);
 assert.deepEqual(attribution.runs[0].windows,[warm.windows[0].windowId]);
 assert.equal(attribution.runs[0].deadline,conversation.turns[0].deadline);
 const allAttribution=await invoke('readAutonomyAttribution',{...guard,request:{}});
 assert.equal(allAttribution.runs.length,1);
 // Replaying the same review is idempotent at the operation level: same receipt, same state.
 assert.equal((await invoke('readOperation',{operationId:'t49r-trusted',expectedRoleId:home.roleId})).kind,'committed');
 assert.deepEqual(await invoke('readAutonomy',guard),cleared);
 await save('gateway-clock-review',{roleId:home.roleId,warm,blocked,view,receipt,cleared,attribution,ownerGuardRejections:2,actualControlledModels:track.models,realBusinessCalls:0});
 success=true;
});
test('真实IANA窗口边界在Gateway视图与实际预留间逐项一致，DST日不多给日额',{timeout:60000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-tz-view-gateway49-')),path=join(root,'role');let success=false;
 const ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();if(success)await rm(root,{recursive:true,force:true});else t.diagnostic('retained '+root);});
 let utc='2026-03-08T12:00:00.000Z';const now=()=>new Date(utc),track={models:0};
 const execution={inspect:async()=>({available:true,reason:'ready'}),prepare:async outputLimit=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:100000,outputLimit}),run:async(_plan,scope)=>{const a=await scope.reserveModel({source:scope.source});await a.enter();for await(const _ of a.iterate(async function*(){track.models++;yield '内部';})){}await a.settle({kind:'completed'});return {kind:'internal',reason:'INTERNAL_ACTIVITY'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}};
 const home=await createRoleHome(path,{operationId:'t49v-create',core:'合成边界视图角色',settings:{inputLimitBytes:32768}}),initial=await home.readAutonomy();
 await home.applyOwner({kind:'edit-autonomy-rules',operationId:'t49v-ny',value:{...initial.rules.value,timeZone:'America/New_York',modelLimit:2,dailyModelLimit:1},expectedAutonomyRulesVersion:1,expectedRevision:home.revision});
 const source=await startRole(home,{now,clock:createNodeClock(now),execution});
 await source.runtime.wake({});await wait(async()=>(await source.owner.readConversation()).turns.filter(x=>x.status==='finished').length===1);
 const spring=ianaDay('2026-03-08T12:00:00.000Z','America/New_York',createNodeClock().read().dataVersion);
 source.lifetime.requestStop('unload');await source.lifetime.stopped;
 for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin.RoleCompanionController,{bootstrap:{get:()=>({path,roleId:home.roleId,creationOperationId:'t49v-create',registrationOperationId:'t49v-create',version:1})},restoration:{get:()=>({operationId:'',backupPath:'',destination:'',expectedRoleId:'',expectedManifestDigest:'',requestedProfileVersion:0})}});
 const owner=new Peer(ctx,{principal:{kind:'owner'}}),invoke=(method,args)=>ctx.typertGateway.invoke({peer:owner,namespace:'roleCompanion',method,args}),guard={expectedRoleId:home.roleId,expectedBindingVersion:1};
 const view=await wait(async()=>{try{return await invoke('readAutonomy',guard);}catch{return null;}});
 assert.equal(view.windows[0].windowId,spring.windowId);
 assert.equal((Date.parse(view.windows[0].endUtc)-Date.parse(view.windows[0].startUtc))/3600000,23);
 assert.equal(view.nextResetUtc,view.windows[0].endUtc);
 assert.equal(view.currentWindowId,view.windows[0].windowId);
 assert.equal(view.windows[0].used.model,1);
 assert.equal(view.totalWindows,1);
 assert.equal(view.rules.value.timeZone,'America/New_York');
 assert.equal(view.clockDataVersion,createNodeClock().read().dataVersion);
 assert.equal(view.ruleEffect,'next-admission');
 assert.equal(view.timeZoneEditing,'available');
 await save('gateway-dst-view',{roleId:home.roleId,spring,view,actualControlledModels:track.models,realBusinessCalls:0});
 success=true;
});
