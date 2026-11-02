import './network-guard.mjs';import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';import {startRole,createNodeClock} from 'dsh-role-companion/runtime';
const wait=async p=>{for(let n=0;n<400;n++){const v=await p();if(v)return v;await new Promise(r=>setTimeout(r,10));}throw Error('transition result did not settle');};
const save=async(name,value)=>{if(process.env.DSH49_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH49_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH49_EVIDENCE_DIRECTORY,name+'.json'),JSON.stringify(value,null,2)+'\n');}};
const port=track=>({inspect:async()=>({available:true,reason:'ready'}),prepare:async outputLimit=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:100000,outputLimit}),run:async(_plan,scope)=>{const a=await scope.reserveModel({source:scope.source});await a.enter();for await(const _ of a.iterate(async function*(){track.models++;yield '内部';})){}await a.settle({kind:'completed'});return {kind:'internal',reason:'INTERNAL_ACTIVITY'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}});
test('已有日窗口时改时区按过渡算法保留窗口ID、已用量与原结束下界，显示真实IANA重置时间且不新开空预算',{timeout:20000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-timezone-transition49-'));let success=false;t.after(()=>success?rm(root,{recursive:true,force:true}):t.diagnostic('retained '+root));
 const path=join(root,'role');let utc='2026-03-09T10:00:00.000Z';const now=()=>new Date(utc),track={models:0};
 let role=await startRole(await createRoleHome(path,{operationId:'create',core:'合成时区过渡角色',settings:{inputLimitBytes:32768}}),{now,clock:createNodeClock(now),execution:port(track)});t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;});
 const created=await role.owner.readAutonomy();assert.equal(created.rules.value.timeZone,'Asia/Shanghai');await role.owner.apply({kind:'edit-autonomy-rules',operationId:'rules-two',value:{...created.rules.value,modelLimit:2,dailyModelLimit:2},expectedAutonomyRulesVersion:created.rules.version,expectedRevision:created.revision});
 await role.runtime.wake({});await wait(async()=>(await role.owner.readConversation()).turns.filter(x=>x.status==='finished').length===1);
 const before=await role.owner.readAutonomy();assert.equal(before.windows.length,1);assert.equal(before.windows[0].startUtc,'2026-03-08T16:00:00.000Z');assert.equal(before.windows[0].endUtc,'2026-03-09T16:00:00.000Z');assert.equal(before.windows[0].used.model,1);const originalWindowId=before.windows[0].windowId,originalEnd=before.windows[0].endUtc;
 // Real IANA transition: the preserved window keeps id/usage and its old end becomes the lower bound.
 const receipt=await role.owner.apply({kind:'edit-autonomy-rules',operationId:'rules-new-york',value:{...before.rules.value,timeZone:'America/New_York'},expectedAutonomyRulesVersion:before.rules.version,expectedRevision:before.revision});
 assert.equal(receipt.kind,'committed');
 const after=await role.owner.readAutonomy(),window=after.windows.at(-1);
 assert.equal(after.rules.value.timeZone,'America/New_York');
 assert.equal(after.windows.length,1);
 assert.equal(window.windowId,originalWindowId);
 assert.equal(window.used.model,1);
 assert.equal(window.startUtc,before.windows[0].startUtc);
 assert.equal(window.transition.previousEndUtc,originalEnd);
 assert.equal(window.transition.previousTimeZone,'Asia/Shanghai');
 assert.equal(window.timeZone,'America/New_York');
 // 2026-03-10T04:00Z is the real New York calendar midnight used for the reset (EDT).
 assert.equal(window.endUtc,'2026-03-10T04:00:00.000Z');
 assert.equal(Date.parse(window.endUtc)-Date.parse(window.startUtc),36*3600000);
 assert.equal(window.localDate,'2026-03-08');
 // Same window continues to charge the preserved daily budget: not a fresh empty budget.
 utc='2026-03-09T20:00:00.000Z';
 await role.runtime.wake({});await wait(async()=>(await role.owner.readConversation()).turns.filter(x=>x.status==='finished').length===2);
 const during=await role.owner.readAutonomy();
 assert.equal(during.windows.length,1);assert.equal(during.windows.at(-1).windowId,originalWindowId);assert.equal(during.windows.at(-1).used.model,2);
 const attempts=await role.owner.readConversation();assert.deepEqual(attempts.attempts.map(a=>a.windowId),[originalWindowId,originalWindowId]);
 assert.deepEqual(await role.runtime.wake({}),{kind:'skipped',reason:'AUTONOMOUS_MODEL_LIMIT'});
 // After the real reset the next IANA New York day is a new window; the used count does not carry as an extra allowance.
 utc='2026-03-10T05:00:00.000Z';
 await role.runtime.wake({});await wait(async()=>(await role.owner.readConversation()).turns.filter(x=>x.status==='finished').length===3);
 const nextDay=await role.owner.readAutonomy();
 assert.equal(nextDay.windows.length,2);
 assert.equal(nextDay.windows.at(-1).startUtc,'2026-03-10T04:00:00.000Z');
 assert.equal(nextDay.windows.at(-1).endUtc,'2026-03-11T04:00:00.000Z');
 assert.deepEqual(nextDay.windows.map(w=>w.used),[{model:2,tool:0,web:0},{model:1,tool:0,web:0}]);
 assert.equal(track.models,3);
 const view=await role.owner.readAutonomy();
 await save('transition-core',{originalWindowId,originalEnd,before,after,during,nextDay,view,actualControlledModels:track.models});
 // Restart preserves the transition record and every counter.
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 role=await startRole(await openRoleHome(path),{clock:createNodeClock(now),execution:port(track)});await wait(async()=>(await role.runtime.inspect()).status==='ready');
 const reopened=await role.owner.readAutonomy();
 assert.deepEqual(reopened.rules,nextDay.rules);
 assert.deepEqual(reopened.windows,nextDay.windows);
 assert.equal(reopened.windows.at(-2).transition.previousEndUtc,originalEnd);
 assert.equal(track.models,3);
 await save('transition-reopen',{reopened,actualControlledModels:track.models});
 role.lifetime.requestStop('unload');await role.lifetime.stopped;success=true;
});
