import './network-guard.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,access,mkdir,writeFile} from 'node:fs/promises';import {join,resolve} from 'node:path';import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome,qqInputIdentity} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
const wait=async predicate=>{for(let i=0;i<1000;i++){const result=await predicate();if(result)return result;await new Promise(r=>setTimeout(r,10));}throw Error('history query public progress timed out');};
const save=async(name,value)=>{if(process.env.DSH42_EVIDENCE_DIR){await mkdir(process.env.DSH42_EVIDENCE_DIR,{recursive:true});await writeFile(resolve(process.env.DSH42_EVIDENCE_DIR,name+'.json'),JSON.stringify(value,null,2)+'\n');}};
test('同Runtime只读补查先看到本地持久输入，逐次进入有记录，候选未选择不接纳且重开保留',async t=>{
 const root=await mkdtemp(join(tmpdir(),'dsh-history-runtime42-')),path=join(root,'role'),home=await createRoleHome(path,{operationId:'history42-runtime-create',core:'合成历史候选角色',settings:{inputLimitBytes:32768}});let role,actualRequests=0;const order=[];
 t.after(async()=>{role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;await rm(root,{recursive:true,force:true});});
 await home.applyOwner({kind:'bind-qq',operationId:'history42-runtime-bind',connectionId:'connection-history42',accountId:'10001',peerId:'20002',expectedBindingVersion:0,expectedRevision:home.revision});
 const binding=(await home.readSnapshot()).qqBinding;
 const port={canRead:()=>true,policy:()=>({pageSize:3,maxPages:2,cooldownMs:60000,readTimeoutMs:1000,configurationVersion:1}),async read(prepared){
  return prepared.invoke(async()=>{actualRequests++;order.push({kind:'actual-readonly-action',requestId:prepared.request.requestId});const snapshot=await home.readSnapshot(),state=await role.owner.readQQHistory();assert.equal(snapshot.inputs.length,1,'local accepted input is restored before a remote query');assert.equal(state.queries[0].requests.length,1);assert(state.queries[0].requests[0].enteredAt,'entry is durable before the actual request');
   return {kind:'response',observedAt:'2026-10-27T00:01:00.000Z',generation:'synthetic-generation42',echo:'synthetic-echo42',responseJSON:JSON.stringify({status:'ok',retcode:0,data:{messages:[{message_id:-101,time:1793059200},{message_id:-102,time:1793059201}]}}),rows:[{messageId:'-101',kind:'incoming-friend-text',text:'已接纳锚点原文',reportedAt:'2026-10-27T00:00:00.000Z',reason:''},{messageId:'-102',kind:'incoming-friend-text',text:'尚未选择的完整历史候选🙂',reportedAt:'2026-10-27T00:00:01.000Z',reason:''}]};
  });
 }};
 role=await startRole(home,{history:port});
 const source={connectionId:binding.connectionId,accountId:binding.accountId,peerId:binding.peerId,direction:'incoming',messageId:'-101'};
 const accepted=await role.runtime.receive({...qqInputIdentity(binding,source),bindingId:binding.bindingId,bindingVersion:binding.version,channel:'qq',qqSource:source,text:'已接纳锚点原文',origin:'live',receivedAt:'2026-10-27T00:00:00.000Z',sourceEvidence:'verified-onebot-friend-text'});assert.equal(accepted.kind,'accepted');
 const receipt=await role.owner.queryQQHistory({operationId:'history42-runtime-query'});
 const state=await wait(async()=>{const view=await role.owner.readQQHistory();return view.queries[0]?.phase==='gap'&&view;});
 assert.equal(actualRequests,1);assert.equal(state.queries.length,1);const query=state.queries[0];assert.equal(query.operationId,receipt.operationId);assert.equal(query.anchor.inputId,accepted.inputId);assert.equal(query.policy.pageSize,3);assert.equal(query.requests[0].outcome.kind,'response');assert.equal(query.candidates.length,1);assert.equal(query.candidates[0].text,'尚未选择的完整历史候选🙂');assert.equal(query.candidates[0].reportedAt,'2026-10-27T00:00:01.000Z');assert.equal(query.candidates[0].eligible,true);assert(query.gapReasons.includes('QQ_HISTORY_COMPLETENESS_UNKNOWN'));
 assert.equal((await home.readSnapshot()).inputs.length,1,'preview is not a second input owner');assert.equal((await home.readConversation()).attempts.length,0);assert.equal((await home.readConversation()).deliveries.length,0);
 const replay=await role.owner.queryQQHistory({operationId:'history42-runtime-query'});assert.equal(replay.queryId,query.queryId);assert.equal(actualRequests,1);
 await assert.rejects(role.owner.queryQQHistory({operationId:'history42-runtime-cooldown'}),e=>e.code==='QQ_HISTORY_COOLDOWN');assert.equal(actualRequests,1);
 role.lifetime.requestStop('unload');await role.lifetime.stopped;await assert.rejects(access(join(path,'writer.lock')),{code:'ENOENT'});
 const fresh=await openRoleHome(path),restored=await fresh.readQQHistory();assert.deepEqual(restored.queries,state.queries);await fresh.close();
 await save('42-runtime-query',{status:'passed',roleId:home.roleId,accepted,receipt,state,restored,order,actualRequests,actualModels:0,actualSends:0,roleStopped:true,publicReopened:true,realBusinessCalls:{model:0,web:0,qq:0}});
});

test('历史原响应保存不明保持停止屏障，公开retryArchives只修原记录而不重复读取',async t=>{
 const root=await mkdtemp(join(tmpdir(),'dsh-history-archive42-')),path=join(root,'role');let role,failed=false,requests=0,stopped=false;
 const home=await createRoleHome(path,{operationId:'history42-archive-create',core:'合成历史归档故障角色',settings:{inputLimitBytes:32768}},{barrier:async(stage,detail)=>{if(!failed&&stage==='after-head-sync'&&detail.operationId.startsWith('history-result-')){failed=true;throw Object.assign(Error('synthetic history result sync fault'),{code:'SYNTHETIC_HISTORY_SYNC'});}}});
 t.after(async()=>{if(stopped)await rm(root,{recursive:true,force:true});else t.diagnostic('Retained actual blocked synthetic history Home '+root);});
 await home.applyOwner({kind:'bind-qq',operationId:'history42-archive-bind',connectionId:'connection-history-archive',accountId:'10001',peerId:'20002',expectedBindingVersion:0,expectedRevision:home.revision});
 const binding=(await home.readSnapshot()).qqBinding,source={connectionId:binding.connectionId,accountId:binding.accountId,peerId:binding.peerId,direction:'incoming',messageId:'-111'};
 const port={canRead:()=>true,policy:()=>({pageSize:3,maxPages:1,cooldownMs:60000,readTimeoutMs:1000,configurationVersion:1}),read:prepared=>prepared.invoke(async()=>{requests++;return {kind:'response',observedAt:new Date().toISOString(),generation:'synthetic-archive-generation',echo:'synthetic-archive-echo',responseJSON:' {"messages":[],"unknown":0.25}\n',rows:[{messageId:'-111',kind:'incoming-friend-text',text:'归档锚点',reportedAt:'2026-10-27T00:00:00.000Z',reason:''},{messageId:'-112',kind:'incoming-friend-text',text:'故障前实际取得的完整候选🙂',reportedAt:'2026-10-27T00:00:01.000Z',reason:''}]};})};
 role=await startRole(home,{history:port});await role.runtime.receive({...qqInputIdentity(binding,source),bindingId:binding.bindingId,bindingVersion:binding.version,channel:'qq',qqSource:source,text:'归档锚点',origin:'live',receivedAt:new Date().toISOString(),sourceEvidence:'verified-onebot-friend-text'});
 const receipt=await role.owner.queryQQHistory({operationId:'history42-archive-query'});await wait(async()=>(await role.runtime.inspect()).reason==='IO_UNCERTAIN');const held=await role.runtime.inspect();assert.equal(requests,1);
 role.lifetime.requestStop('unload');void role.lifetime.stopped.then(()=>stopped=true);await new Promise(r=>setTimeout(r,30));await access(join(path,'writer.lock'));assert.equal(stopped,false);
 const repair=await role.owner.retryArchives();for(let i=0;i<300&&!stopped;i++)await new Promise(r=>setTimeout(r,10));const after=await role.runtime.inspect();
 let restored;if(stopped){await assert.rejects(access(join(path,'writer.lock')),{code:'ENOENT'});const fresh=await openRoleHome(path);restored=await fresh.readQQHistory();await fresh.close();}else restored=await home.readQQHistory();
 await save('42-history-archive',{status:stopped?'passed':'failed',roleId:home.roleId,receipt,held,repair,after,restored,requests,stopped,realBusinessCalls:{model:0,web:0,qq:0}});
 assert.equal(stopped,true,'repair must not retain a rejected cached query task forever');assert.equal(requests,1);assert.equal(restored.queries[0].phase,'gap');assert.equal(restored.queries[0].requests[0].outcome.responseJSON,' {"messages":[],"unknown":0.25}\n');assert.equal(restored.queries[0].candidates[0].text,'故障前实际取得的完整候选🙂');
});

test('历史任务开始提交不明时保留原归档债务，恢复只修原记录而不补读',async t=>{
 const root=await mkdtemp(join(tmpdir(),'dsh-history-begin42-')),path=join(root,'role');let role,failed=false,requests=0,stopped=false;
 const operationId='history42-begin-uncertain';
 const home=await createRoleHome(path,{operationId:'history42-begin-create',core:'合成历史开始保存故障角色',settings:{inputLimitBytes:32768}},{barrier:async(stage,detail)=>{if(!failed&&stage==='after-head-sync'&&detail.operationId===operationId){failed=true;throw Object.assign(Error('synthetic history begin sync fault'),{code:'SYNTHETIC_HISTORY_BEGIN_SYNC'});}}});
 t.after(async()=>{if(stopped)await rm(root,{recursive:true,force:true});else t.diagnostic('Retained original uncertain history Home '+root);});
 await home.applyOwner({kind:'bind-qq',operationId:'history42-begin-bind',connectionId:'connection-history-begin',accountId:'10001',peerId:'20002',expectedBindingVersion:0,expectedRevision:home.revision});
 const binding=(await home.readSnapshot()).qqBinding,source={connectionId:binding.connectionId,accountId:binding.accountId,peerId:binding.peerId,direction:'incoming',messageId:'-121'};
 const port={canRead:()=>true,policy:()=>({pageSize:3,maxPages:1,cooldownMs:60000,readTimeoutMs:1000,configurationVersion:1}),read:prepared=>prepared.invoke(async()=>{requests++;return {kind:'response',observedAt:new Date().toISOString(),generation:'synthetic-begin-generation',echo:'synthetic-begin-echo',responseJSON:'{"messages":[]}',rows:[]};})};
 role=await startRole(home,{history:port});await role.runtime.receive({...qqInputIdentity(binding,source),bindingId:binding.bindingId,bindingVersion:binding.version,channel:'qq',qqSource:source,text:'开始锚点',origin:'live',receivedAt:new Date().toISOString(),sourceEvidence:'verified-onebot-friend-text'});
 await assert.rejects(role.owner.queryQQHistory({operationId}),e=>e.code==='IO_UNCERTAIN');assert.equal(requests,0);const before=await role.owner.readOperation(operationId);assert.equal(before.kind,'uncertain');
 await assert.rejects(role.owner.queryQQHistory({operationId:'history42-begin-new-key'}),e=>e.code==='IO_UNCERTAIN');assert.equal(requests,0);
 const repair=await role.owner.retryArchives();const restored=await role.owner.queryQQHistory({operationId});let complete=false;for(let i=0;i<300;i++){const view=await role.owner.readQQHistory();if(view.queries[0]?.phase==='gap'){complete=true;break;}await new Promise(r=>setTimeout(r,10));}
 const after=await role.owner.readOperation(operationId),state=await role.owner.readQQHistory();await save('42-history-begin-uncertain',{status:complete&&after.kind==='committed'?'passed':'failed',roleId:home.roleId,before,restored,after,state,requests,complete,realBusinessCalls:{model:0,web:0,qq:0}});
 assert.equal(after.kind,'committed');assert.equal(complete,true);assert.equal(requests,0);assert.equal(state.queries.length,1);assert.equal(state.queries[0].operationId,operationId);assert.equal(state.queries[0].requests.length,0);assert(state.queries[0].gapReasons.includes('QQ_HISTORY_NOT_DISPATCHED'));
 role.lifetime.requestStop('unload');await role.lifetime.stopped;stopped=true;await assert.rejects(access(join(path,'writer.lock')),{code:'ENOENT'});
});
