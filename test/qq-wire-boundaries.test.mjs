import test from 'node:test';
import assert from 'node:assert/strict';
import {qqWireFixture,waitQQ,validQQMessage} from './qq-wire-fixture.mjs';
import {qqEvidence} from './qq-evidence.mjs';
test('OneBot策略关闭1008不会盲目重新鉴权连接',{timeout:10000},async t=>{
 const f=await qqWireFixture(t);await waitQQ(()=>f.adapter.inspect().phase==='ready');f.sockets[0].close(1008,'synthetic policy denial');await waitQQ(()=>['blocked','backoff'].includes(f.adapter.inspect().phase));
 const view=f.adapter.inspect();await qqEvidence('38-policy-close',{status:view.phase==='blocked'?'passed':'failed',roleId:f.home.roleId,revision:f.home.revision,view,requests:f.requests,events:f.events});
 assert.equal(view.phase,'blocked');assert.equal(view.reason,'QQ_AUTH_FAILED');assert.equal(view.nextDelayMs,null);await new Promise(resolve=>setTimeout(resolve,100));assert.equal(f.sockets.length,1);assert.equal((await f.home.readSnapshot()).inputs.length,0);
});

test('OneBot过滤方向/好友/类型/媒体/伪来源并完整保留有效文字，同ID异文停止接纳',{timeout:12000},async t=>{
 const f=await qqWireFixture(t);await waitQQ(()=>f.adapter.inspect().phase==='ready');
 const valid=validQQMessage(),bad=[
  {...valid,post_type:'message_sent'}, {...valid,message_type:'group'}, {...valid,sub_type:'group'}, {...valid,sub_type:undefined},
  {...valid,user_id:30003}, {...valid,self_id:99999}, {...valid,sender:{user_id:10001}}, {...valid,sender:undefined},
  {...valid,message:[{type:'image',data:{file:'synthetic'}}]}, {...valid,message:[...valid.message,{type:'image',data:{file:'synthetic'}}]},
  {...valid,message:'文字字符串不伪装分段'}, {...valid,message:[]}, {...valid,message_id:9007199254740992}, {...valid,message_id:'-0'},
  {...valid,message:[{type:'text',data:{text:'\ud800'}}]}, {...valid,message:[{type:'text',data:{text:''}}]},
 ];const raw=['{invalid','{"__proto__":{"polluted":true}}',JSON.stringify({...valid,message_id:-8,message:[{type:'text',data:{text:'bad',constructor:'untrusted'}}]})];
 const before=f.adapter.inspect().counts.frames;for(const message of bad)f.sockets[0].send(JSON.stringify(message));for(const bytes of raw)f.sockets[0].send(bytes);
 await waitQQ(()=>f.adapter.inspect().counts.frames===before+bad.length+raw.length);await f.adapter.drain();assert.equal((await f.home.readSnapshot()).inputs.length,0);
 f.sockets[0].send(JSON.stringify({...valid,message:[{type:'text',data:{text:' 第一段🙂'}},{type:'text',data:{text:'\n第二段 '}}]}));await waitQQ(()=>f.adapter.inspect().counts.accepted===1);
 const accepted=await f.home.readSnapshot();assert.equal(accepted.inputs[0].text,' 第一段🙂\n第二段 ');assert.equal(accepted.inputs[0].qqSource.messageId,'-7');assert.equal((await f.home.readConversation()).turns.length,0);
 f.sockets[0].send(JSON.stringify(valid));await waitQQ(()=>f.adapter.inspect().phase==='blocked');assert.equal(f.adapter.inspect().reason,'QQ_INPUT_CONFLICT');assert.equal(f.adapter.inspect().counts.conflict,1);assert.equal((await f.home.readSnapshot()).inputs.length,1);assert.equal((await f.home.readSnapshot()).inputs[0].text,accepted.inputs[0].text);
 await qqEvidence('38-filter-and-conflict',{status:'passed',roleId:f.home.roleId,revision:f.home.revision,rejectedFrames:bad.length+raw.length,input:accepted.inputs[0],view:f.adapter.inspect(),requests:f.requests,events:f.events});
});

test('每新连接严格拒绝版本/账号/好友/鉴权不符而不自动重试',{timeout:15000},async t=>{
 for(const [code,response] of [
  ['QQ_VERSION_UNSUPPORTED',action=>action==='get_version_info'?{data:{app_name:'SnowLuma',app_version:'unknown',protocol_version:'v11'}}:{}],
  ['QQ_ACCOUNT_MISMATCH',action=>action==='get_login_info'?{data:{user_id:99999}}:{}],
  ['QQ_FRIEND_NOT_VERIFIED',action=>action==='get_friend_list'?{data:[{user_id:30003}]}:{}],
  ['QQ_AUTH_FAILED',()=>({status:'failed',retcode:401,data:null})],
 ])await t.test(code,async t=>{
  const f=await qqWireFixture(t,{response});await waitQQ(()=>f.adapter.inspect().phase==='blocked');assert.equal(f.adapter.inspect().reason,code);assert.equal(f.adapter.inspect().nextDelayMs,null);await new Promise(resolve=>setTimeout(resolve,80));assert.equal(f.sockets.length,1);assert.equal((await f.home.readSnapshot()).inputs.length,0);
  await qqEvidence('38-check-'+code,{status:'passed',roleId:f.home.roleId,revision:f.home.revision,view:f.adapter.inspect(),requests:f.requests,events:f.events});
 });
});

test('只读期限触发有界抖动退避，新连接重验并解析新凭据',{timeout:10000},async t=>{
 const f=await qqWireFixture(t,{configuration:{readTimeoutMs:25,reconnectInitialMs:40,reconnectMaxMs:80,jitterRatio:0.5},random:()=>1,onAction:({connection})=>connection===1?false:undefined});
 await waitQQ(()=>f.adapter.inspect().phase==='backoff');const backoff=f.adapter.inspect();assert.equal(backoff.reason,'QQ_CHECK_TIMEOUT');assert.equal(backoff.nextDelayMs,60);f.secret='synthetic-boundary-second';await waitQQ(()=>f.sockets.length===2&&f.adapter.inspect().phase==='ready');
 assert.deepEqual(f.headers,['Bearer synthetic-boundary-first','Bearer synthetic-boundary-second']);assert.deepEqual(f.requests.map(({action})=>action),['get_version_info','get_version_info','get_login_info','get_friend_list']);
 const first=f.events.find(value=>value.kind==='actual-readonly-entry'),second=f.events.find(value=>value.kind==='actual-connection'&&value.connection===2);assert(second.at-first.at>=70,'readonly deadline plus chosen jitter delay actually elapsed');assert(second.at-first.at<1500);
 await qqEvidence('38-readonly-deadline-backoff',{status:'passed',roleId:f.home.roleId,revision:f.home.revision,backoff,view:f.adapter.inspect(),requests:f.requests,headerMatches:f.headers.map((value,index)=>value==='Bearer '+(index?'synthetic-boundary-second':'synthetic-boundary-first')),events:f.events});
});

test('旧WS代已开始的异步binding回调不能污染替换绑定，新代按当前版本接纳',{timeout:10000},async t=>{
 let hold=false,entered,release;const entering=new Promise(resolve=>entered=resolve),released=new Promise(resolve=>release=resolve);
 const f=await qqWireFixture(t,{afterBinding:async()=>{if(hold){hold=false;entered();await released;}}});await waitQQ(()=>f.adapter.inspect().phase==='ready');const old=f.adapter.inspect();
 hold=true;f.sockets[0].send(JSON.stringify(validQQMessage()));await entering;
 await f.role.owner.apply({kind:'bind-qq',operationId:'boundary-rebind',connectionId:'connection-boundary',accountId:'10001',peerId:'20002',expectedBindingVersion:1,expectedRevision:f.home.revision});await f.adapter.reconnect();release();await f.adapter.drain();await waitQQ(()=>f.adapter.inspect().phase==='ready'&&f.adapter.inspect().generation!==old.generation);
 assert.equal((await f.home.readSnapshot()).inputs.length,0);f.sockets.at(-1).send(JSON.stringify(validQQMessage()));await waitQQ(()=>f.adapter.inspect().counts.accepted===1);const snapshot=await f.home.readSnapshot();assert.equal(snapshot.inputs[0].bindingVersion,2);assert.equal(snapshot.inputs[0].qqSource.messageId,'-7');
 await qqEvidence('38-old-generation-callback',{status:'passed',roleId:f.home.roleId,revision:f.home.revision,oldGeneration:old.generation,newGeneration:f.adapter.inspect().generation,input:snapshot.inputs[0],events:f.events,requests:f.requests});
});

test('关闭先seal新来信，已进入Home事务的接纳完成后才释放Home和协议观察',{timeout:12000},async t=>{
 let entered,release;const entering=new Promise(resolve=>entered=resolve),released=new Promise(resolve=>release=resolve);const ioEvents=[];
 const f=await qqWireFixture(t,{io:{barrier:async(stage,detail)=>{if(detail.operationId.startsWith('qq-input-')){ioEvents.push({stage,...detail});if(stage==='before-commit-publish'){entered();await released;}}}}});await waitQQ(()=>f.adapter.inspect().phase==='ready');
 f.sockets[0].send(JSON.stringify(validQQMessage()));await entering;const stopping=f.role.owner.stop({operationId:'boundary-stop-held-input'});await waitQQ(()=>f.adapter.inspect().phase==='sealed');assert.equal((await f.role.runtime.inspect()).status,'stopping');
 f.sockets[0].send(JSON.stringify(validQQMessage(-8)));let stopped=false;f.role.lifetime.stopped.then(()=>stopped=true);await new Promise(resolve=>setTimeout(resolve,30));assert.equal(stopped,false);assert.equal(f.events.filter(value=>value.kind==='actual-runtime-receive').length,1);release();await stopping;await f.role.lifetime.stopped;
 const {openRoleHome}=await import('dsh-role-companion/home');const reopened=await openRoleHome(f.homePath);const snapshot=await reopened.readSnapshot();assert.equal(snapshot.inputs.length,1);assert.equal(snapshot.inputs[0].qqSource.messageId,'-7');assert.equal(f.adapter.inspect().counts.accepted,1);assert.equal(f.adapter.inspect().phase,'closed');await reopened.close();
 assert(ioEvents.some(value=>value.stage==='after-head-sync'));const seal=f.events.find(value=>value.kind==='inbound-seal').index,drain=f.events.find(value=>value.kind==='inbound-drained').index,dispose=f.events.find(value=>value.kind==='protocol-dispose-after-home-release').index;assert(seal<drain&&drain<dispose);
 await qqEvidence('38-stop-held-input',{status:'passed',roleId:f.home.roleId,revision:snapshot.revision,input:snapshot.inputs[0],ioEvents,events:f.events,actualRuntimeReceives:1,publicReopen:true,roleStopped:stopped});
});

test('旧代await receive的真实拒绝收据不得覆盖已就绪新代状态',{timeout:10000},async t=>{
 const held=Promise.withResolvers(),entered=Promise.withResolvers();let once=true;
 const f=await qqWireFixture(t,{beforeReceive:async()=>{if(once){once=false;entered.resolve();await held.promise;}}});await waitQQ(()=>f.adapter.inspect().phase==='ready');const old=f.adapter.inspect();f.sockets[0].send(JSON.stringify(validQQMessage()));await entered.promise;
 await f.role.owner.apply({kind:'bind-qq',operationId:'boundary-rebind-before-old-receive',connectionId:'connection-boundary',accountId:'10001',peerId:'20002',expectedBindingVersion:1,expectedRevision:f.home.revision});await f.adapter.reconnect();await waitQQ(()=>f.adapter.inspect().phase==='ready'&&f.adapter.inspect().generation!==old.generation);held.resolve();await f.adapter.drain();const view=f.adapter.inspect();
 await qqEvidence('38-old-receive-receipt',{status:view.reason===''?'passed':'failed',roleId:f.home.roleId,revision:f.home.revision,view,oldGeneration:old.generation,events:f.events,requests:f.requests});assert.equal((await f.home.readSnapshot()).inputs.length,0);assert.equal(view.reason,'');assert.equal(view.phase,'ready');
 f.sockets.at(-1).send(JSON.stringify(validQQMessage()));await waitQQ(()=>f.adapter.inspect().counts.accepted===1);assert.equal((await f.home.readSnapshot()).inputs[0].bindingVersion,2);
});

test('固定版text segment存在未知内容字段时整条拒绝，不删字段后冒充完整纯文字',{timeout:10000},async t=>{
 const f=await qqWireFixture(t);await waitQQ(()=>f.adapter.inspect().phase==='ready');const before=f.adapter.inspect().counts.frames;
 f.sockets[0].send(JSON.stringify({...validQQMessage(-99),message:[{type:'text',data:{text:'未知内容拓展不得被静默丢弃',attachment:{type:'image',file:'synthetic'}}}]}));await waitQQ(()=>f.adapter.inspect().counts.frames===before+1);await f.adapter.drain();const snapshot=await f.home.readSnapshot(),view=f.adapter.inspect();
 await qqEvidence('38-unknown-content-field',{status:snapshot.inputs.length===0?'passed':'failed',roleId:f.home.roleId,revision:snapshot.revision,inputs:snapshot.inputs,view,events:f.events,requests:f.requests});assert.equal(snapshot.inputs.length,0);assert.equal(view.counts.unsupported,1);assert.equal((await f.home.readConversation()).turns.length,0);
});
