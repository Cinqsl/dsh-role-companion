import assert from 'node:assert/strict';import {join} from 'node:path';import {writeFile,access} from 'node:fs/promises';import {bootNativeFixture,response,waitFor} from './native-fixture.mjs';
const run=process.env.DSH_TEST_RUN,mode=process.env.DSH50_MODE||'interval',order=[];let role;
const {ctx,module,entries,metadataEntries,shutdown}=await bootNativeFixture(run,entry=>{order.push('model-'+entry.ordinal);return response('内部观察：周期机会已到达，本次只记录，不向用户发送。');},{globalCompaction:false});
const report={case:'50-native-'+mode,status:'running',order,realBusinessCalls:{model:0,web:0,qq:0}};
/** Controlled clock + manual timer queue: the 60-minute schedule is advanced without wall-clock waiting. */
try{
 const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole,createNodeClock}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
 let utc=Date.parse('2026-10-27T01:00:00.000Z');const now=()=>new Date(utc),clock=createNodeClock(now),handles=new Set();
 const timers={setTimeout(fn,delay){const handle={due:utc+delay,fn};handles.add(handle);return handle;},clearTimeout(handle){handles.delete(handle);}};
 const fireDue=()=>{for(const handle of [...handles])if(handle.due<=utc){handles.delete(handle);handle.fn();}};
 const home=await createRoleHome(join(run,'role'),{operationId:'create50',core:'合成周期唤醒星图；内部活动不自动发信。',settings:{inputLimitBytes:32768}});
 role=await startRole(home,{clock,now,timers,execution:await createNativeExecution(ctx)});
 await waitFor(async()=>(await role.runtime.inspect()).status==='ready');
 if(mode==='pause'){await role.owner.apply({kind:'set-autonomy-pause',operationId:'pause-native',paused:true,at:new Date(utc).toISOString()});}
 const armed=await waitFor(async()=>{const view=await role.runtime.inspect();return mode==='pause'?(view.schedule?.paused?view:null):(view.schedule?.nextOpportunityAt?view:null);});
 Object.assign(report,{roleId:home.roleId,armed:armed.schedule,paused:await role.owner.readAutonomy().then(a=>a.pausedAt??null)});
 utc=Date.parse(armed.schedule.nextOpportunityAt||new Date(utc+3600000).toISOString());fireDue();
 if(mode==='pause'){
   await new Promise(resolve=>setTimeout(resolve,500));
   assert.equal(entries.length,0,'a paused schedule must not enter the native model');
   assert.equal((await role.owner.readConversation()).turns.length,0);
   await role.owner.apply({kind:'set-autonomy-pause',operationId:'resume-native',paused:false,at:new Date(utc).toISOString()});
   const resumed=await waitFor(async()=>{const view=await role.runtime.inspect();return view.schedule&&!view.schedule.paused&&view.schedule.nextOpportunityAt?view:null;});
   report.resumed=resumed.schedule;
   utc=Date.parse(resumed.schedule.nextOpportunityAt);fireDue();
 }
 await waitFor(async()=>{const state=await role.owner.readConversation();return state.turns.some(turn=>turn.source==='autonomous'&&turn.status==='finished');});
 const state=await role.owner.readConversation(),activity=await role.owner.readAutonomy();
 Object.assign(report,{state,activity,first:await role.runtime.inspect(),actualModels:entries.length,metadata:metadataEntries.length,requests:entries.map(entry=>entry.body)});
 assert.equal(state.turns.filter(turn=>turn.source==='autonomous').length,1,'one scheduled slot yields one autonomous turn');
 assert.equal(state.turns[0].outcome.kind,'internal');
 assert.equal(state.replies.length,0);assert.equal(state.deliveries.length,0);
 assert.equal(entries.length,1);assert.equal(metadataEntries.length,0);
 const consumed=await home.readAutonomySchedule();assert(consumed.lastSlotAt&&consumed.nextOpportunityAt,'the consumed slot persists');
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 // restart: the persisted schedule is restored and overdue slots are skipped rather than replayed
 utc+=6*60*60*1000;
 role=await startRole(await openRoleHome(join(run,'role')),{clock,now,timers,execution:await createNativeExecution(ctx)});
 const reopened=await waitFor(async()=>{const view=await role.runtime.inspect();return view.status==='ready'&&view.schedule?.armed&&view.schedule?.nextOpportunityAt?view:null;});
 Object.assign(report,{reopened:reopened.schedule,freshModels:entries.length});
 assert.equal(entries.length,1,'restart replays nothing');
 assert.equal(reopened.schedule.paused,mode==='pause'?false:false);
 assert(reopened.schedule.missedSlots>0,'overdue slots are counted during downtime');
 assert(Date.parse(reopened.schedule.nextOpportunityAt)>utc);
 // the reopened schedule must not be a stale server-side projection
 assert(reopened.schedule.armed,'the reopened runtime re-arms a future timer');
 report.status='passed';
}finally{role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;await shutdown.shutdown(0);for(const name of ['writer.lock','.maintenance.lock'])await assert.rejects(access(join(run,'role',name)),{code:'ENOENT'});Object.assign(report,{roleStopped:true,hostStopped:true,locksReleased:true});await writeFile(join(run,'autonomy-schedule-native.json'),JSON.stringify(report,null,2)+'\n');}
