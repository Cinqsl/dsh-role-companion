import assert from 'node:assert/strict';import {join} from 'node:path';import {access,writeFile} from 'node:fs/promises';
import {bootNativeFixture,waitFor,bound} from './native-fixture.mjs';import {saveNativeEvidence35} from './evidence35.mjs';
const run=process.env.DSH_TEST_RUN,mode=process.argv[2]??'reload',signals=[],order=[];let role,home,failure,signal,releaseFetch=()=>{},stopped=false,observed,before,during,after;
const multiple=mode==='multiple-global';
const {ctx,module,entries,metadataEntries,shutdown}=await bootNativeFixture(run,entry=>{signal=entry.signal;order.push('actual-model-start');return new Promise((resolve,reject)=>{releaseFetch=()=>{order.push('actual-model-settled');reject(new DOMException('Controlled source revocation','AbortError'));};});},{globalCompaction:multiple,additionalPatches:multiple?[{insert:[{id:'second-compaction-owner',name:'@deepseek-ai/dsh-compaction-basic',isolate:{compaction:true},config:{auto:false,maxTokens:32}}]}]:[]});
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
const presetId=ctx.agentPresets.defaultId,declaration=ctx.configEditor.entries().find(x=>x.options.name==='@deepseek-ai/dsh-agent-preset'&&x.options.config.id===presetId),selection=ctx.configEditor.entries().find(x=>x.options.name==='@deepseek-ai/dsh-agent-preset-registry');
const declarationFiber=declaration.fiber,selectionFiber=selection.fiber;
const compositions=()=>ctx.agentPresets.inspectCompositions().filter(x=>x.id===presetId);
ctx.on('loader/partial-dispose',row=>{if(row===declaration)signals.push({event:'declaration-partial-dispose',id:row.options.id});},{global:true,prepend:true});
ctx.on('internal/status',(fiber,old)=>{if(fiber===declarationFiber)signals.push({event:'declaration-status',old,state:fiber.state});},{global:true,prepend:true});
selectionFiber.ctx.on('loader/volatile-update',function(){if(this.fiber===selectionFiber)signals.push({event:'selection-volatile',defaultId:ctx.agentPresets.defaultId});},{prepend:true});
try{
 home=await createRoleHome(join(run,'role'),{operationId:'lifecycle-create',core:'A source configuration lifetime is retained until actual work and Home close finish.',settings:{inputLimitBytes:32768}});role=await startRole(home,{execution:await createNativeExecution(ctx)});void role.lifetime.stopped.then(()=>{stopped=true;order.push('role-stopped');});
 if(multiple){const view=await role.runtime.inspect();assert.equal(view.status,'not-ready');assert.equal(view.execution.reason,'COMPACTION_OWNER_UNAVAILABLE');assert.equal(ctx.configEditor.entries().filter(x=>x.options.name==='@deepseek-ai/dsh-compaction-basic').length,2);assert.equal(entries.length,0);assert.equal(metadataEntries.length,0);assert.equal((await home.readConversation()).attempts.length,0);observed=view;}
 else{
  assert.equal(ctx.get('compaction'),undefined);assert.equal((await role.runtime.inspect()).status,'ready');before=compositions();assert.equal(before.length,1);await role.runtime.receive(bound(home.roleId,'source-'+mode));await waitFor(()=>signal);assert.equal(entries.length,1);
  if(mode==='reload')await declaration.update({config:{...declaration.options.config,description:'Controlled replacement of the existing declaration'}});
  else if(mode==='disable')await declaration.update({disabled:true});
  else if(mode==='remove')declaration.parent.tree.remove(declaration.options.id);
  else if(mode==='selection')await selection.update({config:{...selection.options.config,selectedDefault:'minimal'}});
  else throw Error('Unknown controlled source mode');
  await ctx.loader.await();await waitFor(()=>signal.aborted);observed=await role.runtime.inspect();assert.equal(observed.status,'stopping');assert.equal(observed.reason,'COMPACTION_OWNER_CHANGED');assert.equal(stopped,false,'old request and recording lifetime must remain held');await access(join(run,'role/writer.lock'));during=compositions();assert.equal(during.length,mode==='reload'?2:1,'the old retained revision stays alive during actual in-flight work');assert.equal((await role.runtime.receive(bound(home.roleId,'revoked'))).kind,'rejected');assert.equal(entries.length,1);assert.equal(metadataEntries.length,0);order.push('release-old-consumer');releaseFetch();await waitFor(()=>stopped);await role.lifetime.stopped;after=compositions();assert.equal(after.length,mode==='reload'||mode==='selection'?1:0,'the retired revision is released only after old consumers and Home stop');
 }
}catch(error){failure=error;}
finally{
 releaseFetch();if(role&&!stopped){role.lifetime.requestStop('unload');await role.lifetime.stopped;}
 const lockAbsent=await access(join(run,'role/writer.lock')).then(()=>false,e=>e.code==='ENOENT'),reopened=await openRoleHome(join(run,'role'));const state=await reopened.readConversation();if(!multiple&&!failure){assert.equal(state.attempts.length,1);assert.equal(state.attempts[0].outcome.kind,'cancelled');assert.equal(state.replies.length,0);}await saveNativeEvidence35(run,'compaction-lifecycle',{home:reopened,state,entries,status:failure?'failed':'passed',error:failure,metrics:{mode,signals,observed,before,during,after,stopped},order});await reopened.close();await shutdown.shutdown(0);await writeFile(join(run,'compaction-lifecycle-result.json'),JSON.stringify({status:failure?'failed':'passed',mode,roleId:home?.roleId,observed,signals,before,during,after,actualModels:entries.length,metadataEntries:metadataEntries.length,stopped,writerLockAbsent:lockAbsent,hostStopped:true,error:failure?.message??null,order,realBusinessCalls:{model:0,web:0,qq:0}},null,2)+'\n');
}if(failure)throw failure;
