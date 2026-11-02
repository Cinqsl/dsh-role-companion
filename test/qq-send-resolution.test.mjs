import {resolutionEvidence} from './qq-resolution-evidence.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {sendFixture,waitSend} from './qq-send-fixture.mjs';

test('unknown 核对后明确再发产生关联新发件，当前规则生效而旧原文/尝试不改，同操作不重复发送',async t=>{
 let sends=0;
 const f=await sendFixture(t,(socket,request)=>{sends++;socket.send(JSON.stringify({echo:request.echo,status:sends===1?'failed':'ok',retcode:sends===1?100:0,data:sends===1?{}:{message_id:-940}}));},{text:'完整再发🙂'.repeat(500)});
 f.sendInput();
 const before=await waitSend(async()=>{const s=await f.home.readConversation();return s.deliveries[0]?.status==='unknown'&&s;});
 const original=structuredClone(before.deliveries[0]),attempt=structuredClone(before.sendAttempts[0]);
 await f.role.owner.apply({kind:'edit-delivery-rules',operationId:'resolution-rules',value:{previewCodePoints:200,sendTimeoutMs:500},expectedDeliveryRulesVersion:1,expectedRevision:f.home.revision});
 const command={kind:'resolve-delivery',operationId:'resolution-resend',deliveryId:original.deliveryId,sendAttemptId:attempt.sendAttemptId,decision:'resend',note:'已核对原始非零响应，仍明确再发，可能重复。',duplicateRiskAcknowledged:true,expectedQQBindingVersion:original.target.version,expectedDeliveryRulesVersion:2,expectedRevision:f.home.revision};
 const receipt=await f.role.owner.apply(command);assert.equal(receipt.kind,'committed');
 const after=await waitSend(async()=>{const s=await f.home.readConversation();return s.deliveries[1]?.status==='confirmed'&&s;});
 assert.equal(sends,2);assert.equal(f.modelEntries,1);assert.deepEqual(after.deliveries[0],original);assert.deepEqual(after.sendAttempts[0],attempt);
 assert.notEqual(after.deliveries[1].deliveryId,original.deliveryId);assert.equal(after.deliveries[1].retryOf,original.deliveryId);assert.equal(after.deliveries[1].resolutionOperationId,command.operationId);assert.equal(after.deliveries[1].replyId,original.replyId);assert.equal(after.deliveries[1].intentId,original.intentId);assert.equal(Array.from(after.deliveries[1].text).length,200);assert.equal(after.sendAttempts[1].rules.value.sendTimeoutMs,500);
 assert.equal(after.deliveryResolutions[0].newDeliveryId,after.deliveries[1].deliveryId);assert.equal(after.deliveryResolutions[0].committedRevision,receipt.committedRevision);
 assert.equal((await f.role.owner.apply(command)).committedRevision,receipt.committedRevision);assert.equal((await f.role.owner.readOperation(command.operationId)).committedRevision,receipt.committedRevision);assert.equal(sends,2);assert.equal((await f.home.readConversation()).deliveries.length,2);
 await assert.rejects(f.role.owner.apply({...command,note:'改变原业务内容'}),{code:'OPERATION_CONFLICT'});
 await assert.rejects(f.role.owner.apply({...command,operationId:'resolution-second-key',expectedRevision:f.home.revision}),{code:'DELIVERY_ALREADY_REISSUED'});
 await resolutionEvidence('40-runtime-redelivery',{status:'passed',roleId:f.home.roleId,receipt,before,after,requests:f.requests,events:f.events,actual:{models:f.modelEntries,sends}});
});

test('核对后选择不再发只存用户处置，不能证明未发送；离线禁止创建新发送',async t=>{
 const f=await sendFixture(t,(socket,request)=>socket.send(JSON.stringify({echo:request.echo,status:'failed',retcode:100,data:{}})));
 f.sendInput();const before=await waitSend(async()=>{const s=await f.home.readConversation();return s.deliveries[0]?.status==='unknown'&&s;});
 const d=before.deliveries[0],a=before.sendAttempts[0];f.adapter.seal();
 const command={kind:'resolve-delivery',operationId:'resolution-offline',deliveryId:d.deliveryId,sendAttemptId:a.sendAttemptId,decision:'resend',note:'明示仍再发',duplicateRiskAcknowledged:true,expectedQQBindingVersion:d.target.version,expectedDeliveryRulesVersion:1,expectedRevision:f.home.revision};
 await assert.rejects(f.role.owner.apply(command),{code:'QQ_SEND_UNAVAILABLE'});
 const receipt=await f.role.owner.apply({...command,operationId:'resolution-no-resend',decision:'no-resend',duplicateRiskAcknowledged:false,note:'已查看证据，本次不再发；不认定旧消息失败。'});assert.equal(receipt.kind,'committed');
 const saved=await f.home.readConversation();assert.deepEqual(saved.deliveries,before.deliveries);assert.deepEqual(saved.sendAttempts,before.sendAttempts);assert.equal(saved.deliveryResolutions.length,1);assert.equal(saved.deliveryResolutions[0].decision,'no-resend');assert.equal(saved.deliveryResolutions[0].newDeliveryId,undefined);assert.equal(f.requests.filter(r=>r.action==='send_private_msg').length,1);assert.equal(f.modelEntries,1);await resolutionEvidence('40-no-resend',{status:'passed',roleId:f.home.roleId,before,saved,receipt,actual:{models:f.modelEntries,sends:f.requests.filter(r=>r.action==='send_private_msg').length}});
});

test('明确再发提交IO_UNCERTAIN保留原键，换键拒绝；只修原操作并仅发送一次新项',async t=>{
 let once=true,sends=0;const f=await sendFixture(t,(socket,request)=>{sends++;socket.send(JSON.stringify({status:sends===1?'failed':'ok',retcode:sends===1?100:0,data:sends===1?{}:{message_id:-941},echo:request.echo}));},{preserveHome:true,io:{barrier:async(stage,detail)=>{if(once&&stage==='after-head-sync'&&detail.operationId==='resolution-uncertain'){once=false;throw Object.assign(Error('synthetic resolution confirmation failure'),{code:'SYNTHETIC_RESOLUTION_IO'});}}}});
 f.sendInput();const before=await waitSend(async()=>{const s=await f.home.readConversation();return s.deliveries[0]?.status==='unknown'&&s;}),d=before.deliveries[0];
 const command={kind:'resolve-delivery',operationId:'resolution-uncertain',deliveryId:d.deliveryId,sendAttemptId:d.sendAttemptId,decision:'resend',note:'核对后仍明确再发，保留原操作',duplicateRiskAcknowledged:true,expectedQQBindingVersion:d.target.version,expectedDeliveryRulesVersion:1,expectedRevision:f.home.revision};
 await assert.rejects(f.role.owner.apply(command),{code:'IO_UNCERTAIN'});const uncertain=await f.role.owner.readOperation(command.operationId);assert.equal(uncertain.kind,'uncertain');assert.equal(sends,1);
 await assert.rejects(f.role.owner.apply({...command,operationId:'resolution-forbidden-new-key'}),{code:'IO_UNCERTAIN'});assert.equal(sends,1);
 const receipt=await f.role.owner.apply(command);const repaired=await f.home.readSnapshot(),repairedView=await f.role.runtime.inspect();await resolutionEvidence('40-resolution-post-repair',{status:'recorded-before-admission-check',roleId:f.home.roleId,receipt,repaired,repairedView,requests:f.requests,actual:{models:f.modelEntries,sends}});assert.equal(repaired.uncertainOperationId,undefined);assert.notEqual(repairedView.reason,'IO_UNCERTAIN','confirmed original owner operation must release only its temporary uncertainty gate');const saved=await waitSend(async()=>{const s=await f.home.readConversation();return s.deliveries[1]?.status==='confirmed'&&s;});assert.equal(saved.deliveryResolutions.length,1);assert.equal(saved.sendAttempts.length,2);assert.deepEqual(saved.sendAttempts[0],before.sendAttempts[0]);assert.equal(sends,2);assert.equal(f.modelEntries,1);assert.equal((await f.role.owner.apply(command)).committedRevision,receipt.committedRevision);
 await resolutionEvidence('40-resolution-uncertain',{status:'passed',roleId:f.home.roleId,before,uncertain,receipt,saved,requests:f.requests,actual:{models:f.modelEntries,sends}});
});

test('确定未dispatch的rejected也不自动再发，明确新项经原真实wire发送而不重推理',async t=>{
 let once=true;const f=await sendFixture(t,(socket,request)=>socket.send(JSON.stringify({status:'ok',retcode:0,data:{message_id:-942},echo:request.echo})),{io:{barrier:async(stage,detail)=>{if(once&&stage==='after-head-sync'&&detail.operationId.startsWith('begin-delivery-')){once=false;throw Object.assign(Error('synthetic begin save confirmation'),{code:'SYNTHETIC_BEGIN_IO'});}}}});
 f.sendInput();await waitSend(async()=>(await f.role.runtime.inspect()).reason==='IO_UNCERTAIN');await f.role.owner.retryArchives();
 const before=await f.home.readConversation(),d=before.deliveries[0];assert.equal(d.status,'rejected');assert.equal(before.sendAttempts[0].observation.code,'SEND_NOT_DISPATCHED');assert.equal(f.requests.filter(r=>r.action==='send_private_msg').length,0);
 const command={kind:'resolve-delivery',operationId:'resolution-rejected',deliveryId:d.deliveryId,sendAttemptId:d.sendAttemptId,decision:'resend',note:'原预留确认失败且实际未dispatch，明确创建新发件',duplicateRiskAcknowledged:true,expectedQQBindingVersion:d.target.version,expectedDeliveryRulesVersion:1,expectedRevision:f.home.revision};
 const receipt=await f.role.owner.apply(command),saved=await waitSend(async()=>{const s=await f.home.readConversation();return s.deliveries[1]?.status==='confirmed'&&s;});assert.deepEqual(saved.deliveries[0],d);assert.deepEqual(saved.sendAttempts[0],before.sendAttempts[0]);assert.equal(saved.sendAttempts.length,2);assert.equal(f.requests.filter(r=>r.action==='send_private_msg').length,1);assert.equal(f.modelEntries,1);await resolutionEvidence('40-rejected-explicit',{status:'passed',roleId:f.home.roleId,before,saved,receipt,actual:{models:f.modelEntries,sends:1}});
});

test('明确再发在途期间stop保留原结果出口并等待新attempt持久化才释放Home',async t=>{
 let sends=0,release;const f=await sendFixture(t,(socket,request)=>{sends++;if(sends===1)socket.send(JSON.stringify({status:'failed',retcode:100,data:{},echo:request.echo}));else release=()=>socket.send(JSON.stringify({status:'ok',retcode:0,data:{message_id:-943},echo:request.echo}));},{rules:{previewCodePoints:1500,sendTimeoutMs:5000}});
 f.sendInput();const before=await waitSend(async()=>{const s=await f.home.readConversation();return s.deliveries[0]?.status==='unknown'&&s;}),d=before.deliveries[0];
 await f.role.owner.apply({kind:'resolve-delivery',operationId:'resolution-stop-choice',deliveryId:d.deliveryId,sendAttemptId:d.sendAttemptId,decision:'resend',note:'明确创建新尝试，停止仍须保存真实观察',duplicateRiskAcknowledged:true,expectedQQBindingVersion:1,expectedDeliveryRulesVersion:2,expectedRevision:f.home.revision});await waitSend(()=>release);
 const sending=await f.home.readConversation(),op=await f.role.owner.stop({operationId:'resolution-held-stop'}),{access}=await import('node:fs/promises'),{join}=await import('node:path'),{openRoleHome}=await import('dsh-role-companion/home');assert.equal(op.stop.phase,'stopping');await access(join(f.homePath,'writer.lock'));assert.equal(f.adapter.inspect().phase,'sealed');assert.equal((await f.role.owner.readOperation('resolution-held-stop')).stop.phase,'stopping');
 release();await f.role.lifetime.stopped;assert.equal(f.adapter.inspect().phase,'closed');await assert.rejects(access(join(f.homePath,'writer.lock')),e=>e.code==='ENOENT');const reopened=await openRoleHome(f.homePath),saved=await reopened.readConversation();await reopened.close();assert.deepEqual(saved.deliveries[0],d);assert.deepEqual(saved.sendAttempts[0],before.sendAttempts[0]);assert.equal(saved.deliveries[1].status,'confirmed');assert.equal(saved.sendAttempts[1].observation.messageId,'-943');assert.equal(sends,2);assert.equal(f.modelEntries,1);await resolutionEvidence('40-stop-explicit-inflight',{status:'passed',roleId:f.home.roleId,before,sending,saved,op,finalOperation:await f.role.owner.readOperation('resolution-held-stop'),protocol:f.adapter.inspect(),lockReleased:true,publicReopen:true,actual:{models:f.modelEntries,sends}});
});
