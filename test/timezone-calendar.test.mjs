import './network-guard.mjs';import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';import {startRole,createNodeClock,ianaDay} from 'dsh-role-companion/runtime';
const wait=async p=>{for(let n=0;n<500;n++){const v=await p();if(v)return v;await new Promise(r=>setTimeout(r,10));}throw Error('calendar case did not settle');};
const save=async(name,value)=>{if(process.env.DSH49_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH49_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH49_EVIDENCE_DIRECTORY,name+'.json'),JSON.stringify(value,null,2)+'\n');}};
const execution=track=>({inspect:async()=>({available:true,reason:'ready'}),prepare:async outputLimit=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:100000,outputLimit}),run:async(_plan,scope)=>{const a=await scope.reserveModel({source:scope.source});await a.enter();for await(const _ of a.iterate(async function*(){track.models++;yield '内部';})){}await a.settle({kind:'completed'});return scope.source==='user'?{kind:'reply',text:'正常回复'} :{kind:'internal',reason:'INTERNAL_ACTIVITY'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}});
test('真实IANA夏令时缺失/重复小时不产生第二个日额，午夜与跨午夜归属原窗口',{timeout:30000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-tz-dst49-'));let success=false;t.after(()=>success?rm(root,{recursive:true,force:true}):t.diagnostic('retained '+root));const path=join(root,'role');
 // Spring-forward day is 23 hours; fall-back day is 25 hours in New York.
 const spring=ianaDay('2026-03-08T12:00:00.000Z','America/New_York',createNodeClock().read().dataVersion),fall=ianaDay('2026-11-01T12:00:00.000Z','America/New_York',createNodeClock().read().dataVersion);
 assert.equal((Date.parse(spring.endUtc)-Date.parse(spring.startUtc))/3600000,23);
 assert.equal((Date.parse(fall.endUtc)-Date.parse(fall.startUtc))/3600000,25);
 let utc='2026-11-01T04:30:00.000Z';const now=()=>new Date(utc),track={models:0};
 const home=await createRoleHome(path,{operationId:'create',core:'合成夏令时角色',settings:{inputLimitBytes:32768}}),initial=await home.readAutonomy();
 await home.applyOwner({kind:'edit-autonomy-rules',operationId:'ny-dst',value:{...initial.rules.value,timeZone:'America/New_York',modelLimit:3,dailyModelLimit:2},expectedAutonomyRulesVersion:1,expectedRevision:home.revision});
 const role=await startRole(home,{now,clock:createNodeClock(now),execution:execution(track)});t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;});
 // Same New York calendar day across the repeated 01:00 hour: one window only, no extra daily budget.
 for(const [index,at] of ['2026-11-01T04:30:00.000Z','2026-11-01T05:30:00.000Z','2026-11-01T06:30:00.000Z'].entries()){
  utc=at;const receipt=await role.runtime.wake({});assert.equal(receipt.kind,index<2?'accepted':'skipped',JSON.stringify(receipt));
  if(receipt.kind==='skipped')break;
  await wait(async()=>(await role.owner.readConversation()).turns.filter(x=>x.status==='finished').length===index+1);
 }
 const fallback=await role.owner.readAutonomy();
 assert.equal(fallback.windows.length,1);
 assert.equal(fallback.windows[0].windowId,fall.windowId);
 assert.equal(fallback.windows[0].startUtc,'2026-11-01T04:00:00.000Z');
 assert.equal(fallback.windows[0].endUtc,'2026-11-02T05:00:00.000Z');
 assert.equal(fallback.windows[0].used.model,2);
 assert.deepEqual(await role.runtime.wake({}),{kind:'skipped',reason:'AUTONOMOUS_MODEL_LIMIT'});
 // Next day is a real (new) window: no repeated usage benefit, no skipped day accumulated.
 utc='2026-11-02T05:30:00.000Z';await role.runtime.wake({});await wait(async()=>(await role.owner.readConversation()).turns.some(x=>x.status==='finished'&&x.startedAt===utc));
 const afterFall=await role.owner.readAutonomy();
 assert.equal(afterFall.windows.length,2);assert.deepEqual(afterFall.windows.map(w=>w.used.model),[2,1]);
 assert.equal(afterFall.windows[1].startUtc,'2026-11-02T05:00:00.000Z');
 // Multi-day offline: only the current window is created, no unused allowance accumulates.
 utc='2026-11-06T12:00:00.000Z';await role.runtime.wake({});await wait(async()=>(await role.owner.readConversation()).turns.filter(x=>x.status==='finished').length===4);
 const offline=await role.owner.readAutonomy();
 assert.equal(offline.windows.length,3);
 assert.equal(offline.windows.at(-1).startUtc,'2026-11-06T05:00:00.000Z');
 assert.deepEqual(offline.windows.map(w=>w.used.model),[2,1,1]);
 await save('dst-fallback',{spring,fall,fallback,afterFall,offline,actualControlledModels:track.models,state:await role.owner.readConversation()});
 role.lifetime.requestStop('unload');await role.lifetime.stopped;success=true;
});
test('UTC明显回拨持久挡自主但保留正常回复，可信核对不返还用量且不清轮计数或原deadline',{timeout:30000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-tz-review49-'));let success=false;t.after(()=>success?rm(root,{recursive:true,force:true}):t.diagnostic('retained '+root));const path=join(root,'role');
 let utc='2026-10-27T03:00:00.000Z',reviewed=[];const now=()=>new Date(utc),track={models:0};
 let role=await startRole(await createRoleHome(path,{operationId:'create',core:'合成核对角色',settings:{inputLimitBytes:32768}}),{now,clock:createNodeClock(now),execution:execution(track)});t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;});
 await role.runtime.wake({});await wait(async()=>(await role.owner.readConversation()).turns.filter(x=>x.status==='finished').length===1);
 const warm=await role.owner.readAutonomy(),window=warm.windows[0],firstRun=(await role.owner.readConversation()).turns[0];
 utc='2026-10-27T02:58:00.000Z';
 assert.deepEqual(await role.runtime.wake({}),{kind:'skipped',reason:'CLOCK_ROLLBACK'});
 const blocked=await role.owner.readAutonomy();assert.equal(blocked.clockBlocked,'CLOCK_ROLLBACK');assert.deepEqual(blocked.windows,warm.windows);
 // A normal user reply must still be possible while blocked.
 const binding=(await role.runtime.inspect()).home.panelBinding;
 await role.runtime.receive({operationId:'user-during-rollback',externalKey:'user',...binding,text:'正常用户来信',origin:'live',receivedAt:utc,sourceEvidence:'authenticated-owner-panel'});
 await wait(async()=>(await role.owner.readConversation()).replies.length===1);
 assert.equal(track.models,2);
 // Restoring the old clock value does not unseal, and review never returns the used daily budget.
 utc='2026-10-27T03:05:00.000Z';
 assert.deepEqual(await role.runtime.wake({}),{kind:'skipped',reason:'CLOCK_ROLLBACK'});
 // A review while the clock is still visibly behind must be rejected, not silently accepted.
 utc='2026-10-27T02:40:00.000Z';
 await assert.rejects(role.owner.apply({kind:'review-autonomy-clock',operationId:'review-too-early',clock:createNodeClock().read(),expectedRevision:(await role.owner.readAutonomy()).revision}),{code:'CLOCK_ROLLBACK'});
 assert.equal((await role.owner.readAutonomy()).clockBlocked,'CLOCK_ROLLBACK');
 assert.deepEqual(await role.runtime.wake({}),{kind:'skipped',reason:'CLOCK_ROLLBACK'});
 // A trusted review after the clock is trustworthy clears the seal only; usage and the original window stay.
 utc='2026-10-27T03:05:00.000Z';
 const reviewedReceipt=await role.owner.apply({kind:'review-autonomy-clock',operationId:'review-trusted',clock:createNodeClock().read(),expectedRevision:(await role.owner.readAutonomy()).revision});
 assert.equal(reviewedReceipt.kind,'committed');
 const cleared=await role.owner.readAutonomy();
 assert.equal(cleared.clockBlocked,undefined);
 assert.deepEqual(cleared.windows,warm.windows);
 assert.equal(cleared.windows[0].used.model,1);
 // Round counters and original deadline survive the pause/review/reopen path: the same run keeps its counters.
 const state=await role.owner.readConversation();
 assert.equal(state.turns[0].deadline,firstRun.deadline);
 assert.equal(state.turns[0].startedAt,firstRun.startedAt);
 assert.equal(state.turns[0].status,'finished');
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 role=await startRole(await openRoleHome(path),{clock:createNodeClock(now),execution:execution(track)});await wait(async()=>(await role.runtime.inspect()).status==='ready');
 const reopened=await role.owner.readAutonomy();
 assert.equal(reopened.clockBlocked,undefined);
 assert.deepEqual(reopened.windows,warm.windows);
 assert.equal((await role.owner.readConversation()).turns[0].deadline,firstRun.deadline);
 // A later wake still uses the saved rules and the same daily counter (no refill from the review).
 const receipt=await role.runtime.wake({});
 assert.equal(receipt.kind,'accepted');
 await wait(async()=>track.models===3&&(await role.owner.readConversation()).turns.filter(x=>x.status==='finished').length===3);
 const afterReview=await role.owner.readAutonomy();
 assert.equal(afterReview.clockBlocked,undefined);
 assert.deepEqual(afterReview.windows.map(w=>w.used.model),[2]);
 assert.equal(track.models,3);
 await save('rollback-review',{warm,blocked,cleared,reopened,actualControlledModels:track.models});
 role.lifetime.requestStop('unload');await role.lifetime.stopped;success=true;
});
test('当前轮次与跨窗口尝试归属可查询：同一Run的每次预留带原WindowId',{timeout:20000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-tz-attribution49-'));let success=false;t.after(()=>success?rm(root,{recursive:true,force:true}):t.diagnostic('retained '+root));
 let utc='2026-03-09T03:59:00.000Z';const now=()=>new Date(utc),track={models:0};
 let entered=false;const port={inspect:async()=>({available:true,reason:'ready'}),prepare:async outputLimit=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:100000,outputLimit}),run:async(_plan,scope)=>{for(let i=0;i<2;i++){const a=await scope.reserveModel({i});await a.enter();for await(const _ of a.iterate(async function*(){track.models++;yield 'v';})){}await a.settle({kind:'completed'});if(!entered){entered=true;utc='2026-03-09T04:00:30.000Z';}}return {kind:'internal',reason:'INTERNAL_ACTIVITY'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}};
 const home=await createRoleHome(join(root,'role'),{operationId:'create',core:'合成归属角色',settings:{inputLimitBytes:32768}}),initial=await home.readAutonomy();
 await home.applyOwner({kind:'edit-autonomy-rules',operationId:'ny-attribution',value:{...initial.rules.value,timeZone:'America/New_York',modelLimit:2,dailyModelLimit:2},expectedAutonomyRulesVersion:1,expectedRevision:home.revision});
 const role=await startRole(home,{now,clock:createNodeClock(now),execution:port});t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;});
 await role.runtime.wake({});const state=await wait(async()=>{const s=await role.owner.readConversation();return s.turns[0]?.status==='finished'?s:null;});
 assert.equal(track.models,2);assert.notEqual(state.attempts[0].windowId,state.attempts[1].windowId);
 const attribution=await role.owner.readAutonomyAttribution({runId:state.turns[0].runId});
 assert.equal(attribution.length,1);
 assert.deepEqual(attribution[0].windows,[state.attempts[0].windowId,state.attempts[1].windowId]);
 assert.deepEqual(attribution[0].attempts.map(a=>[a.kind,a.windowId]),[['model',state.attempts[0].windowId],['model',state.attempts[1].windowId]]);
 assert.equal(attribution[0].deadline,state.turns[0].deadline);
 const current=await role.owner.readAutonomy();
 assert.equal(current.windows.at(-1).windowId,state.attempts[1].windowId);
 await save('attribution',{state,attribution,current,actualControlledModels:track.models});
 role.lifetime.requestStop('unload');await role.lifetime.stopped;success=true;
});
