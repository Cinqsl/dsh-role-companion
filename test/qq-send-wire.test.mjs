import {replyEvidence} from './qq-replies-evidence.mjs';
import './network-guard.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {WebSocketServer} from 'ws';import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createRoleHome} from 'dsh-role-companion/home';import {startRole} from 'dsh-role-companion/runtime';import {createQQReceiveAdapter} from 'dsh-role-companion';
import {validQQMessage} from './qq-wire-fixture.mjs';
import {sendFixture,waitSend as waitQQ} from './qq-send-fixture.mjs';
test('核验同一连接后通过纯文字segment发送，当前echo有效成功ID才confirmed，全文独立保留',async t=>{
 const f=await sendFixture(t,(socket,request)=>socket.send(JSON.stringify({status:'ok',retcode:0,data:{message_id:-800},echo:request.echo})),{text:'完整🙂'.repeat(600)});f.sendInput();
 const state=await waitQQ(async()=>{const s=await f.home.readConversation();return s.deliveries?.[0]?.status==='confirmed'&&s;});assert.equal(f.modelEntries,1);assert.equal(state.sendAttempts.length,1);assert.equal(state.replies[0].text,f.text);const sends=f.requests.filter(r=>r.action==='send_private_msg');assert.equal(sends.length,1);assert.equal(sends[0].params.user_id,'20002');assert.equal(sends[0].params.auto_escape,true);assert.equal(sends[0].params.message.length,1);assert.equal(sends[0].params.message[0].type,'text');assert.equal(Array.from(sends[0].params.message[0].data.text).length,1500);assert.equal(state.deliveries[0].text,sends[0].params.message[0].data.text);assert.equal(state.sendAttempts[0].observation.evidence.echo,sends[0].echo);assert.equal(state.sendAttempts[0].observation.messageId,'-800');assert.equal((await f.home.readSnapshot()).inputs[0].status,'resolved');await replyEvidence('39-wire-first',{status:'passed',roleId:f.home.roleId,revision:f.home.revision,state,requests:f.requests,events:f.events,actual:{models:f.modelEntries,sends:sends.length}});
});
for(const mode of ['nonzero','missing-id','unsafe-id','wrong-echo','timeout-late','disconnect'])test('发送结果保守且不自动重发：'+mode,async t=>{
 let late;const f=await sendFixture(t,(socket,request)=>{
  if(mode==='disconnect'){socket.terminate();return;}
  const response={status:mode==='nonzero'?'failed':'ok',retcode:mode==='nonzero'?100:0,data:mode==='missing-id'?{}:{message_id:mode==='unsafe-id'?9007199254740992:-801},echo:mode==='wrong-echo'?'unrelated-echo':request.echo};
  if(mode==='timeout-late'){late=()=>socket.send(JSON.stringify(response));return;}
  socket.send(JSON.stringify(response));
 },{rules:{previewCodePoints:1500,sendTimeoutMs:3000}});f.sendInput();
 const state=await waitQQ(async()=>{const s=await f.home.readConversation();return s.deliveries[0]?.status==='unknown'&&s;});assert.equal(state.sendAttempts.length,1);assert.equal(f.requests.filter(r=>r.action==='send_private_msg').length,1);assert.equal(f.modelEntries,1);
 if(late)late();await f.adapter.reconnect();await waitQQ(()=>f.adapter.inspect().phase==='ready');await f.role.owner.apply({kind:'edit-delivery-rules',operationId:'after-'+mode,value:{previewCodePoints:200,sendTimeoutMs:30},expectedDeliveryRulesVersion:state.deliveryRules.version,expectedRevision:f.home.revision});
 const saved=await f.home.readConversation();assert.equal(saved.deliveries.length,1);assert.equal(saved.deliveries[0].text,state.deliveries[0].text);assert.equal(saved.deliveries[0].status,'unknown');assert.equal(f.requests.filter(r=>r.action==='send_private_msg').length,1);await replyEvidence('39-send-'+mode,{status:'passed',roleId:f.home.roleId,revision:f.home.revision,saved,requests:f.requests,actual:{models:f.modelEntries,sends:1}});
});
test('固定SnowLuma user_id转Number不可精确表示的好友ID拒绝发送能力，不允许把绑定目标舍入',async t=>{
 const f=await sendFixture(t,()=>assert.fail('unsafe target must never send'),{peerId:'9007199254740993'}),binding=(await f.home.readSnapshot()).qqBinding;assert.equal(f.adapter.inspect().phase,'ready');assert.equal(f.adapter.canSend(binding),false,'SnowLuma2.0.3 f.userId intCore converts numeric strings to Number, so unsafe peer IDs cannot be sent losslessly');assert.equal(f.requests.filter(r=>r.action==='send_private_msg').length,0);assert.equal(f.modelEntries,0);await replyEvidence('39-provider-target-compatibility',{status:'passed',binding,transport:f.adapter.inspect(),actual:{models:0,sends:0},source:'SnowLuma db142 onebot/action-kit.ts:172-196,347-352'});
});
