import './network-guard.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';import {startRole,createNodeClock} from 'dsh-role-companion/runtime';
import {Context} from '@deepseek-ai/cordis';import Loader from '@deepseek-ai/cordis-plugin-loader';import Registry from '@deepseek-ai/dsh-typert-registry';import Access from '@deepseek-ai/dsh-api-remote-access';import Gateway from '@deepseek-ai/dsh-api-gateway';import Inventory from '@deepseek-ai/dsh-host-plugin-inventory';import Commands from '@deepseek-ai/dsh-commands';import {Peer} from '@deepseek-ai/dsh-client-connection';import * as plugin from 'dsh-role-companion';import {TYPERT} from 'dsh-role-companion/typert';
const wait=async predicate=>{for(let n=0;n<400;n++){const value=await predicate();if(value)return value;await new Promise(r=>setTimeout(r,10));}throw Error('scheduled result did not settle');};
/** Controlled clock and manual timer queue: no real 60-minute wait. */
function controlledClock(start){let utc=start;const now=()=>new Date(utc),clock=createNodeClock(now);return {clock,now,advance(ms){utc=new Date(Date.parse(utc)+ms).toISOString();},get utc(){return utc;},set utc(value){utc=value;}};}
function manualTimers(nowMs){const handles=new Set();let seq=0;return {port:{setTimeout(run,delay){const handle={id:++seq,run,dueAt:nowMs()+delay};handles.add(handle);return handle;},clearTimeout(handle){handles.delete(handle);}},pending(){return [...handles].map(h=>({id:h.id,delayMs:h.dueAt-nowMs()}));},fireDue(){for(const handle of [...handles])if(handle.dueAt<=nowMs()){handles.delete(handle);handle.run();}}};}
function controlledExecution(){const calls=[];return {calls,port:{inspect:async()=>({available:true,reason:'ready'}),prepare:async outputLimit=>{calls.push({kind:'prepare',outputLimit});return {provider:'deepseek-official',model:'deepseek-flash',contextWindow:100000,outputLimit};},run:async(_plan,scope)=>{calls.push({kind:'run',source:scope.source});const attempt=await scope.reserveModel({source:scope.source});await attempt.enter();for await(const _ of attempt.iterate(async function*(){yield 'schedule-internal';})){}await attempt.settle({kind:'completed',data:{text:'schedule-internal'}});return {kind:'internal',reason:'INTERNAL_ACTIVITY',text:'schedule-internal'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}}};}
test('默认60分钟周期经同一wake与真实准入，到点前零模型、到点一次自主、下一机会持久且重开不补跑',{timeout:30000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-autonomy-schedule50-'));let success=false;t.after(()=>success?rm(root,{recursive:true,force:true}):t.diagnostic('retained '+root));const path=join(root,'role');
 const time=controlledClock('2026-10-27T01:00:00.000Z'),timers=manualTimers(()=>Date.parse(time.utc)),execution=controlledExecution();
 let role=await startRole(await createRoleHome(path,{operationId:'create50',core:'合成周期唤醒角色',settings:{inputLimitBytes:32768}}),{clock:time.clock,now:time.now,timers:timers.port,execution:execution.port});
 const ready=await wait(async()=>{const view=await role.runtime.inspect();return view.status==='ready'?view:null;});
 assert.equal(ready.status,'ready');
 const initial=await wait(async()=>{const view=await role.runtime.inspect();return view.schedule&&view.schedule.nextOpportunityAt?view:null;});
 const initialRules=(await role.owner.readAutonomy()).rules;
 assert.equal(initialRules.value.wakeIntervalMs,3600000);
 assert.equal(initialRules.value.wakeIntervalMs,60*60*1000);
 assert.equal(initial.schedule.paused,false);
 assert.equal(initial.schedule.nextOpportunityAt,'2026-10-27T02:00:00.000Z');
 assert.equal(initial.schedule.lastSlotAt,null);
 assert.equal(timers.pending().length,1);assert.equal(timers.pending()[0].delayMs,3600000);
 time.advance(59*60*1000);timers.fireDue();await new Promise(r=>setTimeout(r,50));
 assert.equal(execution.calls.filter(c=>c.kind==='run').length,0);
 assert.equal((await role.owner.readConversation()).turns.length,0);
 time.advance(60*1000);timers.fireDue();
 const state=await wait(async()=>{const s=await role.owner.readConversation();return s.turns.some(turn=>turn.source==='autonomous'&&turn.status==='finished')?s:null;});
 assert.equal(execution.calls.filter(c=>c.kind==='run').length,1);
 assert.equal(execution.calls.filter(c=>c.kind==='run')[0].source,'autonomous');
 assert.equal(state.replies.length,0);assert.equal(state.deliveries.length,0);
 assert.equal(state.turns[0].outcome.kind,'internal');
 const after=await wait(async()=>{const view=await role.runtime.inspect();return view.schedule?.lastSlotAt?view:null;});
 assert.equal(after.schedule.lastSlotAt,'2026-10-27T02:00:00.000Z');
 assert.equal(after.schedule.nextOpportunityAt,'2026-10-27T03:00:00.000Z');
 assert.equal((await role.owner.readAutonomy()).windows[0].used.model,1);
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 time.advance(4*60*60*1000);
 role=await startRole(await openRoleHome(path),{clock:time.clock,now:time.now,timers:timers.port,execution:execution.port});
 await wait(async()=>(await role.runtime.inspect()).status==='ready');
 const reopened=await wait(async()=>{const view=await role.runtime.inspect();return view.schedule?.nextOpportunityAt?view:null;});
 assert.equal(execution.calls.filter(c=>c.kind==='run').length,1);
 assert.equal(reopened.schedule.paused,false);
 assert.equal(reopened.schedule.lastSlotAt,'2026-10-27T03:00:00.000Z');
 assert(reopened.schedule.missedSlots>0,'downtime slots are counted, not replayed');
 const restoredNext=Date.parse(reopened.schedule.nextOpportunityAt);
 assert(restoredNext>Date.parse('2026-10-27T06:00:00.000Z'));
 assert.equal((restoredNext-Date.parse('2026-10-27T01:00:00.000Z'))%3600000,0);
 if(process.env.DSH50_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH50_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH50_EVIDENCE_DIRECTORY,'schedule.json'),JSON.stringify({roleId:(await role.runtime.inspect()).roleId,initial,after,reopened,controlledClockAdvanceMs:5*60*60*1000,actualModels:execution.calls.filter(c=>c.kind==='run').length,state},null,2)+'\n');}
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 success=true;
});
test('暂停只挡自主：用户来信仍回复；暂停期间到点不发机会；恢复保留休息、轮用量与原deadline且不立即新轮',{timeout:40000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-autonomy-pause50-'));let success=false;t.after(()=>success?rm(root,{recursive:true,force:true}):t.diagnostic('retained '+root));const path=join(root,'role');
 const time=controlledClock('2026-10-27T01:00:00.000Z'),timers=manualTimers(()=>Date.parse(time.utc));
 let models=0;const port={inspect:async()=>({available:true,reason:'ready'}),prepare:async outputLimit=>({provider:'deepseek-official',model:'deepseek-flash',contextWindow:100000,outputLimit}),run:async(_plan,scope)=>{models++;const attempt=await scope.reserveModel({source:scope.source});await attempt.enter();for await(const _ of attempt.iterate(async function*(){yield 'pause-internal';})){}await attempt.settle({kind:'completed',data:{text:'pause-internal'}});if(scope.source==='user'){const policy=await scope.parameters();return {kind:'reply',text:'暂停期间正常回复'};}return {kind:'internal',reason:'INTERNAL_ACTIVITY',text:'pause-internal'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}};
 const home=await createRoleHome(path,{operationId:'create50p',core:'合成暂停角色',settings:{inputLimitBytes:32768}});
 let role=await startRole(home,{clock:time.clock,now:time.now,timers:timers.port,execution:port});
 const ready=await wait(async()=>{const view=await role.runtime.inspect();return view.status==='ready'&&view.schedule?.nextOpportunityAt?view:null;});
 // pause through the owner command; no new autonomous admission while paused
 const paused=await role.owner.apply({kind:'set-autonomy-pause',operationId:'pause-1',paused:true,at:time.utc,expectedRevision:home.revision});
 assert.equal(paused.kind,'committed');
 const pausedView=await wait(async()=>{const view=await role.runtime.inspect();return view.schedule?.paused?view:null;});
 assert.equal(pausedView.schedule.paused,true);
 assert.equal(pausedView.schedule.armed,false);
 assert.equal(timers.pending().length,0);
 time.advance(60*60*1000);timers.fireDue();await new Promise(r=>setTimeout(r,200));
 assert.equal(models,0,'paused schedule must not create an autonomous opportunity');
 assert.equal((await role.owner.readConversation()).turns.length,0);
 // normal user message still answered while paused
 const binding=(await role.runtime.inspect()).home.panelBinding;
 const receipt=await role.runtime.receive({operationId:'pause-user',externalKey:'pause-user-key',...binding,text:'暂停时仍要正常回复',origin:'live',receivedAt:time.utc,sourceEvidence:'authenticated-owner-panel'});
 assert.equal(receipt.kind,'accepted');
 const answered=await wait(async()=>{const state=await role.owner.readConversation();return state.replies.length===1?state:null;});
 assert.equal(answered.replies[0].text,'暂停期间正常回复');
 assert.equal(models,1);
 // a rest deadline is preserved across pause / resume
 const restUntil=new Date(Date.parse(time.utc)+3600000).toISOString();
 await role.owner.apply({kind:'set-autonomy-pause',operationId:'resume-1',paused:false,at:time.utc});
 const resumed=await wait(async()=>{const view=await role.runtime.inspect();return view.schedule&&!view.schedule.paused?view:null;});
 assert.equal(resumed.schedule.paused,false);
 // resume never mints a new round: one wake is still the next opportunity
 const autonomousTurns=()=>role.owner.readConversation().then(s=>s.turns.filter(turn=>turn.source==='autonomous').length);
 assert.equal(await autonomousTurns(),0);
 assert.equal(models,1);
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 role=await startRole(await openRoleHome(path),{clock:time.clock,now:time.now,timers:timers.port,execution:port});
 const reopened=await wait(async()=>{const view=await role.runtime.inspect();return view.status==='ready'&&view.schedule?view:null;});
 assert.equal(reopened.schedule.paused,false,'pause intent was committed, so reopening stays resumed');
 if(process.env.DSH50_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH50_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH50_EVIDENCE_DIRECTORY,'pause.json'),JSON.stringify({roleId:home.roleId,paused:pausedView.schedule,resumed:resumed.schedule,reopened:reopened.schedule,answered,actualControlledModels:models},null,2)+'\n');}
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 success=true;
});
test('忙碌时漏过最多合并一个且不补跑，用户工作优先；额度耗尽或休息时跳到点不询问模型',{timeout:40000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-autonomy-busy50-'));let success=false;t.after(()=>success?rm(root,{recursive:true,force:true}):t.diagnostic('retained '+root));const path=join(root,'role');
 const time=controlledClock('2026-10-27T01:00:00.000Z'),timers=manualTimers(()=>Date.parse(time.utc));
 let models=0,prepares=0,releases=0,release;
 const held=new Promise(resolve=>release=resolve);
 const port={inspect:async()=>({available:true,reason:'ready'}),prepare:async outputLimit=>{prepares++;return {provider:'deepseek-official',model:'deepseek-flash',contextWindow:100000,outputLimit};},run:async(_plan,scope)=>{models++;const attempt=await scope.reserveModel({source:scope.source});await attempt.enter();for await(const _ of attempt.iterate(async function*(){yield 'busy-internal';})){}await attempt.settle({kind:'completed',data:{text:'busy-internal'}});if(scope.source==='user')return {kind:'reply',text:'忙碌时用户优先'};releases++;await held;return {kind:'internal',reason:'INTERNAL_ACTIVITY',text:'busy-internal'};},quiesce:async()=>({idle:true,flushed:true}),close:async()=>{}};
 const home=await createRoleHome(path,{operationId:'create50b',core:'合成忙碌角色',settings:{inputLimitBytes:32768}});
 let role=await startRole(home,{clock:time.clock,now:time.now,timers:timers.port,execution:port});
 await wait(async()=>{const view=await role.runtime.inspect();return view.status==='ready'&&view.schedule?.nextOpportunityAt?view:null;});
 time.advance(60*60*1000);timers.fireDue();
 await wait(async()=>releases===1);
 const busy=(await role.runtime.inspect()).schedule;
 assert.equal(busy.lastSlotAt,'2026-10-27T02:00:00.000Z');
 // Advance the controlled clock past two more slots while the first turn is still held.
 time.advance(2*60*60*1000);
 // The runtime's own timer queue is only pushed at the slot boundary it knows about; re-fire each due tick.
 for(let tick=0;tick<3;tick++){timers.fireDue();await new Promise(r=>setTimeout(r,150));}
 const missed=(await role.runtime.inspect()).schedule;
 assert.equal(models,1,'no extra model while the first autonomous turn is held');
 assert(missed.missedSlots>=1,'slots missed during a busy turn are counted, not queued');
 assert(Date.parse(missed.nextOpportunityAt)>Date.parse('2026-10-27T04:00:00.000Z'),'the backlog collapses into one future slot');
 const binding=(await role.runtime.inspect()).home.panelBinding;
 await role.runtime.receive({operationId:'busy-user',externalKey:'busy-user-key',...binding,text:'忙碌时用户输入',origin:'live',receivedAt:time.utc,sourceEvidence:'authenticated-owner-panel'});
 release();
 const resolved=await wait(async()=>{const state=await role.owner.readConversation();return state.turns.some(turn=>turn.source==='autonomous'&&turn.status==='finished')&&state.replies.length===1?state:null;});
 assert.equal(resolved.replies[0].text,'忙碌时用户优先');
 const activity=await role.owner.readAutonomy();
 assert.equal(activity.windows[0].used.model,1,'the autonomous model is charged to the autonomy day window');
 assert.equal(resolved.attempts.filter(a=>a.source==='user'&&a.kind==='model').length,1,'the user turn keeps its own budget');
 // Daily/round quota exhausted: the next slot is skipped with no prepare/run, and the skip is visible.
 const before=await role.owner.readAutonomy();
 await role.owner.apply({kind:'edit-autonomy-rules',operationId:'zero-round-50',value:{...before.rules.value,modelLimit:0},expectedAutonomyRulesVersion:before.rules.version,expectedRevision:before.revision});
 const zeroed=await role.owner.readAutonomy();
 const modelsBeforeSkip=models,preparesBeforeSkip=prepares;
 const armedAt=(await role.runtime.inspect()).schedule.nextOpportunityAt;
 time.utc=new Date(Date.parse(armedAt)+1000).toISOString();
 timers.fireDue();
 await wait(async()=>{const view=await role.runtime.inspect();return view.schedule?.lastSkipReason?view:null;});
 const skipped=await role.runtime.inspect();
 assert.equal(skipped.schedule.lastSkipReason,'AUTONOMOUS_MODEL_LIMIT');
 assert.equal(models,modelsBeforeSkip,'an exhausted opportunity skips without a free model call');
 assert.equal(prepares,preparesBeforeSkip);
 assert.equal((await role.owner.readAutonomy()).windows[0].used.model,zeroed.windows[0].used.model);
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 if(process.env.DSH50_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH50_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH50_EVIDENCE_DIRECTORY,'busy.json'),JSON.stringify({roleId:home.roleId,busy,missed,skipped:skipped.schedule,resolved,actualModels:models,prepares},null,2)+'\n');}
 success=true;
});
test('真实Gateway owner可读周期与暂停、保存周期带版本校验且重启保留，暂停复权由同一owner完成',{timeout:40000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-autonomy-gateway50-'));let success=false;
 const ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();if(success)await rm(root,{recursive:true,force:true});else t.diagnostic('retained '+root);});
 for(const plugin of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(plugin);
 ctx.typert.register(TYPERT);await ctx.plugin(plugin);
 const owner=new Peer(ctx,{principal:{kind:'owner'}}),guest=new Peer(ctx,{principal:{kind:'schedule-guest'}}),invoke=(method,args,peer=owner)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args});
 const created=await invoke('createHome',{path:join(root,'role'),request:{operationId:'create50g',core:'合成周期面板角色',settings:{inputLimitBytes:32768}},expectedProfileVersion:0}),guard={expectedRoleId:created.roleId,expectedBindingVersion:1};
 const before=await invoke('readAutonomy',guard);
 assert.equal(before.rules.value.wakeIntervalMs,3600000);
 assert.equal(before.schedule.paused,false);
 assert.equal(before.schedule.anchorAt,'','before a runtime arms the schedule the panel shows no anchor rather than inventing one');
 const intervalChange={operationId:'interval-50',value:{...before.rules.value,wakeIntervalMs:7200000},expectedAutonomyRulesVersion:before.rules.version,expectedRevision:before.revision};
 const receipt=await invoke('editAutonomyRules',{...guard,request:intervalChange});
 assert.equal(receipt.kind,'committed');
 const after=await invoke('readAutonomy',guard);
 assert.equal(after.rules.value.wakeIntervalMs,7200000);
 assert.equal(after.rules.version,before.rules.version+1);
 assert.equal(after.schedule.intervalMs,7200000,'the panel projects the single persisted interval');
 // invalid interval is rejected and no write lands
 await assert.rejects(invoke('editAutonomyRules',{...guard,request:{...intervalChange,operationId:'bad-interval-50',value:{...after.rules.value,wakeIntervalMs:1000},expectedAutonomyRulesVersion:after.rules.version,expectedRevision:after.revision}}),e=>e.details.reason==='INVALID_AUTONOMY_RULES');
 assert.equal((await invoke('readAutonomy',guard)).rules.version,after.rules.version);
 // pause and resume through the same authenticated owner path
 const paused=await invoke('setAutonomyPause',{...guard,request:{operationId:'pause-50',paused:true,at:new Date().toISOString()}});
 assert.equal(paused.kind,'committed');
 const pausedView=await invoke('readAutonomy',guard);
 assert.equal(pausedView.schedule.paused,true);
 assert.equal(pausedView.pausedAt!==null,true);
 const resumed=await invoke('setAutonomyPause',{...guard,request:{operationId:'resume-50',paused:false,at:new Date().toISOString()}});
 assert.equal(resumed.kind,'committed');
 assert.equal((await invoke('readAutonomy',guard)).schedule.paused,false);
 // owner authentication covers the new methods
 const methods=[['setAutonomyPause',{request:{operationId:'guest-pause',paused:true,at:new Date().toISOString()}}]];
 ctx.remoteAccess.registerPolicy('schedule-guest',{bindings:()=>[{role:{name:'schedule-guest',resource:'global',actions:methods.map(([method])=>'roleCompanion/'+method)},resource:{kind:'global'}}]});
 for(const [method,extra]of methods){const args={...guard,...extra};await assert.rejects(invoke(method,args,guest),e=>e.code==='role/owner-required');await assert.rejects(invoke(method,{...args,expectedBindingVersion:2}),e=>e.details.reason==='BINDING_CHANGED');}
 if(process.env.DSH50_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH50_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH50_EVIDENCE_DIRECTORY,'gateway-schedule.json'),JSON.stringify({roleId:created.roleId,before:{rules:before.rules,schedule:before.schedule},after:{rules:after.rules,schedule:after.schedule},pausedView:{schedule:pausedView.schedule,pausedAt:pausedView.pausedAt},receipt},null,2)+'\n');}
 success=true;
});
test('真实Native受控模型下周期机会按同一startRole准入，暂停时零模型，重启只核对并跳过过期槽',{timeout:120000},async t=>{
 const {spawnSync}=await import('node:child_process'),{readFile}=await import('node:fs/promises'),{realpath}=await import('node:fs/promises');
 for(const mode of ['interval','pause']){
  const run=await mkdtemp(join(await realpath(tmpdir()),'role-autonomy-schedule-native50-'));let success=false;
  t.after(()=>success?rm(run,{recursive:true,force:true}):t.diagnostic('retained '+run));
  const child=spawnSync(process.execPath,[new URL('./autonomy-schedule-native-worker.mjs',import.meta.url).pathname],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),TMPDIR:run,DSH_TEST_RUN:run,DSH50_MODE:mode,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:110000});
  let absent=false;try{process.kill(child.pid,0);}catch(error){if(error.code!=='ESRCH')throw error;absent=true;}
  assert.equal(child.error,undefined,child.stdout+child.stderr);
  assert.equal(child.status,0,child.stdout+child.stderr);
  assert(absent,'worker process must exit');
  const result=JSON.parse(await readFile(join(run,'autonomy-schedule-native.json'),'utf8'));
  if(process.env.DSH50_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH50_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH50_EVIDENCE_DIRECTORY,'native-'+mode+'.json'),JSON.stringify(result,null,2)+'\n');}
  assert.equal(result.status,'passed',JSON.stringify(result).slice(0,400));
  assert.equal(result.actualModels,1);
  assert.equal(result.realBusinessCalls.model,0);
  success=true;
 }
});
test('改周期只重算未来机会：已消费槽位、日用量与原deadline保留，保存失败不伪称已保存',{timeout:30000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-autonomy-interval50-'));let success=false;t.after(()=>success?rm(root,{recursive:true,force:true}):t.diagnostic('retained '+root));const path=join(root,'role');
 const time=controlledClock('2026-10-27T01:00:00.000Z'),timers=manualTimers(()=>Date.parse(time.utc)),execution=controlledExecution();
 let role=await startRole(await createRoleHome(path,{operationId:'create50i',core:'合成改周期角色',settings:{inputLimitBytes:32768}}),{clock:time.clock,now:time.now,timers:timers.port,execution:execution.port});
 const armed=await wait(async()=>{const view=await role.runtime.inspect();return view.schedule?.nextOpportunityAt?view:null;});
 time.utc='2026-10-27T02:00:00.000Z';timers.fireDue();
 const first=await wait(async()=>{const state=await role.owner.readConversation();return state.turns.some(turn=>turn.source==='autonomous'&&turn.status==='finished')?state:null;});
 const before=await role.owner.readAutonomy();const beforeSchedule=await role.owner.readAutonomySchedule??null;
 const beforeView=(await role.runtime.inspect()).schedule;
 assert.equal(before.windows[0].used.model,1);
 // change the interval: next slot is recomputed on the new grid, the consumed slot and usage stay
 const intervalChange={operationId:'interval-change-50',value:{...before.rules.value,wakeIntervalMs:7200000},expectedAutonomyRulesVersion:before.rules.version,expectedRevision:before.revision};
 const receipt=await role.owner.apply({kind:'edit-autonomy-rules',...intervalChange});
 assert.equal(receipt.kind,'committed');
 const after=await role.owner.readAutonomy();
 const afterView=(await role.runtime.inspect()).schedule;
 assert.equal(after.rules.value.wakeIntervalMs,7200000);
 assert.equal(after.windows[0].used.model,1,'usage is never reset by an interval change');
 assert.equal(first.turns[0].deadline,(await role.owner.readConversation()).turns[0].deadline,'the finished turn deadline is untouched');
 assert.equal(afterView.lastSlotAt,beforeView.lastSlotAt,'consumed slots are not replayed');
 assert.equal(afterView.missedSlots,beforeView.missedSlots,'changing the interval does not invent missed slots');
 const nextGap=Date.parse(afterView.nextOpportunityAt)-Date.parse(afterView.lastSlotAt);
 assert(nextGap>0&&nextGap<=7200000,'the next opportunity is recomputed within one new interval, not backfilled');
 assert.equal((Date.parse(afterView.nextOpportunityAt)-Date.parse(afterView.anchorAt))%7200000,0,'the recomputed slot stays on the anchor grid');
 // an invalid interval is rejected without any write, and the panel never claims a save
 const rejectedAt=await role.owner.readAutonomy();
 await assert.rejects(role.owner.apply({kind:'edit-autonomy-rules',operationId:'bad-interval-50',value:{...rejectedAt.rules.value,wakeIntervalMs:59},expectedAutonomyRulesVersion:rejectedAt.rules.version,expectedRevision:rejectedAt.revision}),{code:'INVALID_AUTONOMY_RULES'});
 assert.deepEqual(await role.owner.readAutonomy(),rejectedAt,'a rejected save leaves the previous rules version intact');
 assert.equal((await role.runtime.inspect()).schedule.intervalMs,7200000);
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 // restart keeps the edited interval and the schedule sidecar
 role=await startRole(await openRoleHome(path),{clock:time.clock,now:time.now,timers:timers.port,execution:execution.port});
 const reopened=await wait(async()=>{const view=await role.runtime.inspect();return view.status==='ready'&&view.schedule?.nextOpportunityAt?view:null;});
 assert.equal(reopened.schedule.intervalMs,7200000);
 assert.equal(reopened.schedule.lastSlotAt,beforeView.lastSlotAt);
 assert.equal((await role.owner.readAutonomy()).windows[0].used.model,1);
 if(process.env.DSH50_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH50_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH50_EVIDENCE_DIRECTORY,'interval.json'),JSON.stringify({roleId:before.roleId,first,before:{rules:before.rules,schedule:beforeView,windows:before.windows},after:{rules:after.rules,schedule:afterView,windows:after.windows},reopened:reopened.schedule,actualControlledModels:execution.calls.filter(c=>c.kind==='run').length},null,2)+'\n');}
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 success=true;
});
test('周期调度不阻塞短控制队列：读取面板状态不触发模型，关闭面板不暂停Host',{timeout:30000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-autonomy-queue50-'));let success=false;t.after(()=>success?rm(root,{recursive:true,force:true}):t.diagnostic('retained '+root));const path=join(root,'role');
 const time=controlledClock('2026-10-27T01:00:00.000Z'),timers=manualTimers(()=>Date.parse(time.utc)),execution=controlledExecution();
 let role=await startRole(await createRoleHome(path,{operationId:'create50q',core:'合成控制队列角色',settings:{inputLimitBytes:32768}}),{clock:time.clock,now:time.now,timers:timers.port,execution:execution.port});
 await wait(async()=>{const view=await role.runtime.inspect();return view.schedule?.nextOpportunityAt?view:null;});
 // Panel-style reads and inspect never spend a model or pause the schedule.
 const modelsBefore=execution.calls.filter(c=>c.kind==='run').length;
 for(let n=0;n<5;n++){await role.runtime.inspect();await role.owner.readAutonomy();await role.owner.readConversation();}
 assert.equal(execution.calls.filter(c=>c.kind==='run').length,modelsBefore,'reading the panel never schedules or runs a model');
 assert.equal((await role.runtime.inspect()).schedule.paused,false);
 // A short owner control command still completes promptly while the hourly timer is armed.
 const started=Date.now();
 const receipt=await role.owner.apply({kind:'set-autonomy-pause',operationId:'queue-pause-50',paused:true,at:time.utc});
 assert.equal(receipt.kind,'committed');
 assert(Date.now()-started<5000,'a short control write is not blocked by the armed hourly timer');
 assert.equal((await role.runtime.inspect()).schedule.paused,true);
 // "Closing the panel" only stops reads: the Host and the saved pause intent survive.
 const readOnlyWhileClosed=await role.runtime.inspect();
 assert.equal(readOnlyWhileClosed.status,'ready','the Host keeps running with no panel attached');
 assert.equal(readOnlyWhileClosed.schedule.paused,true);
 const again=await role.owner.apply({kind:'set-autonomy-pause',operationId:'queue-resume-50',paused:false,at:time.utc});
 assert.equal(again.kind,'committed');
 assert.equal((await role.runtime.inspect()).schedule.paused,false);
 if(process.env.DSH50_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH50_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH50_EVIDENCE_DIRECTORY,'control-queue.json'),JSON.stringify({roleId:(await role.runtime.inspect()).roleId,modelsBefore,modelsAfter:execution.calls.filter(c=>c.kind==='run').length,firstWriteMs:Date.now()-started,statusWhileUnattended:readOnlyWhileClosed.status},null,2)+'\n');}
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 success=true;
});
