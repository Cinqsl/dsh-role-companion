import test from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import Loader from '@deepseek-ai/cordis-plugin-loader';
import Registry from '@deepseek-ai/dsh-typert-registry';
import Access from '@deepseek-ai/dsh-api-remote-access';
import Gateway from '@deepseek-ai/dsh-api-gateway';
import Inventory from '@deepseek-ai/dsh-host-plugin-inventory';
import Commands from '@deepseek-ai/dsh-commands';
import { Peer } from '@deepseek-ai/dsh-client-connection';
import * as plugin from 'dsh-role-companion';
import { TYPERT } from 'dsh-role-companion/typert';

test('真实 Gateway 使用生成的编解码器，只允许 owner 查询角色状态', async t => {
  const ctx = new Context();
  t.after(() => ctx.fiber.dispose());
  await ctx.plugin(Loader);
  await ctx.plugin(Registry);
  await ctx.plugin(Access);
  await ctx.plugin(Gateway);
  await ctx.plugin(Inventory);
  await ctx.plugin(Commands);
  ctx.typert.register(TYPERT);
  await ctx.plugin(plugin);
  const owner = new Peer(ctx, {principal:{kind:'owner'}});
  const call = peer => ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method:'inspect',args:{}});
  const view = await call(owner);
  assert.equal(view.role.status, 'not-ready');
  assert.equal(view.role.reason, 'home-not-open');
  assert.equal(view.requiredDsh, '0.2.1-rc.2 / 0.2.1-rc.3');
  assert.equal(TYPERT.invocations.find(method => method.namespace === 'roleCompanion' && method.method === 'inspect').result.mode, 'strict');
  // Explicitly grant a guest at Gateway policy: the business method must still deny.
  ctx.remoteAccess.registerPolicy('fixture-guest', {bindings:()=>[{role:{name:'status-reader',resource:'global',actions:['roleCompanion/inspect']},resource:{kind:'global'}}]});
  const guest = new Peer(ctx, {principal:{kind:'fixture-guest'}});
  await assert.rejects(call(guest), error => error.code === 'role/owner-required');
  await assert.rejects(ctx.roleCompanion.inspect(), error => error.code === 'role/owner-required');
  await assert.rejects(ctx.typertGateway.invoke({namespace:'roleCompanion',method:'inspect',args:{actor:'owner'}}));
  await assert.rejects(ctx.typertGateway.invoke({peer:guest,namespace:'roleCompanion',method:'inspect',args:{actor:'owner'}}));
  assert.equal((await call(owner)).role.status, 'not-ready');
});

test('owner Remote 创建保存 Home 后登记失败仍可查询原操作，并保留编辑能力',async t=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const {join}=await import('node:path');const {tmpdir}=await import('node:os');const root=await mkdtemp(join(tmpdir(),'role-gateway-'));
 const ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin);
 const owner=new Peer(ctx,{principal:{kind:'owner'}});let expectedRoleId='';const invoke=(method,args)=>ctx.typertGateway.invoke({peer:owner,namespace:'roleCompanion',method,args:{...args,...(['applyOwner','readOperation'].includes(method)?{expectedRoleId}:{})}});
 const {createRoleHome,openRoleHome}=await import('dsh-role-companion/home');const existingPath=join(root,'existing');const existing=await createRoleHome(existingPath,{operationId:'existing-create',core:'既有核心',settings:{inputLimitBytes:32768}});const existingId=existing.roleId;await existing.close();
 await assert.rejects(invoke('attachHome',{path:existingPath,expectedRoleId:'',operationId:'empty-identity',expectedProfileVersion:0}));assert.equal((await invoke('inspect',{})).role.roleId,null);
 const preserved=await openRoleHome(existingPath,{expectedRoleId:existingId});assert.equal((await preserved.readSnapshot()).core.text,'既有核心');await preserved.close();
 const req={operationId:'gateway-create',core:'合成核心',settings:{inputLimitBytes:32768}};
 const receipt=await invoke('createHome',{path:join(root,'home'),request:req,expectedProfileVersion:0});
 expectedRoleId=receipt.roleId;assert.equal(receipt.registration,'unregistered');assert.equal(receipt.errorCode,'PROFILE_EDITOR_UNAVAILABLE');
 assert.equal((await invoke('readOperation',{operationId:req.operationId})).stage,'created-unregistered');
 await assert.rejects(invoke('applyOwner',{command:{kind:'register-home',operationId:'forged',targetOperationId:req.operationId}}));assert.equal((await invoke('readOperation',{operationId:req.operationId})).stage,'created-unregistered');
 const next=await invoke('createHome',{path:join(root,'home'),request:req,expectedProfileVersion:0});assert.equal(next.roleId,receipt.roleId);
 const view=await invoke('inspect',{});assert.equal(view.role.home.core.text,req.core);
 const edit=await invoke('applyOwner',{command:{kind:'edit-core',operationId:'gateway-edit',text:'新核心',expectedCoreVersion:1,expectedRevision:1}});assert.equal(edit.committedRevision,2);
 for(const [method,args]of [['createHome',{path:join(root,'elsewhere'),request:req,expectedProfileVersion:0}],['attachHome',{path:join(root,'home'),expectedRoleId:receipt.roleId,operationId:'attach',expectedProfileVersion:0}],['applyOwner',{command:{kind:'edit-core',operationId:'denied',text:'不得保存',expectedCoreVersion:2,expectedRevision:2}}],['readOperation',{operationId:'gateway-edit'}]]){
  await assert.rejects(ctx.roleCompanion[method](...Object.values(args)),error=>error.code==='role/owner-required');
 }
});

test('旧 settings Remote 保留未知键并整笔拒绝，无效值和版本均不提交，合法 wire 继续可用',async t=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const {join}=await import('node:path');const {tmpdir}=await import('node:os');const root=await mkdtemp(join(tmpdir(),'role-settings-gateway-'));
 const ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin);
 const peer=new Peer(ctx,{principal:{kind:'owner'}});const invoke=(method,args)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args});
 const create=(name,settings)=>invoke('createHome',{path:join(root,name),request:{operationId:'create-'+name,core:'settings fixture',settings},expectedProfileVersion:0});
 // Compatible decoding must not erase this extra key before the Home-owned exact validator.
 await assert.rejects(create('unknown',{inputLimitBytes:32768,unexpected:1}),e=>e.code==='role/home-error'&&e.details.reason==='INVALID_SETTINGS');
 await assert.rejects(create('proto',JSON.parse('{"inputLimitBytes":32768,"__proto__":1}')),e=>e.code==='role/home-error'&&e.details.reason==='INVALID_SETTINGS');
 assert.equal((await invoke('inspect',{})).role.roleId,null);
 for(const [name,settings]of [['zero',{inputLimitBytes:0}],['fraction',{inputLimitBytes:1.5}],['missing',{}]])await assert.rejects(create(name,settings),e=>e.code==='role/home-error'&&e.details.reason==='INVALID_SETTINGS');
 // Structural and value-type errors are deterministic generated codec rejection.
 for(const settings of [{inputLimitBytes:'32768'},64])await assert.rejects(create('codec-value',settings),e=>e.code!=='role/home-error');
 await assert.rejects(invoke('createHome',{path:join(root,'codec'),request:{operationId:42,core:'fixture',settings:{inputLimitBytes:32768}},expectedProfileVersion:0}),e=>e.code!=='role/home-error');
 const created=await create('valid',{inputLimitBytes:32768});const expectedRoleId=created.roleId;
 const before=(await invoke('inspect',{})).role.home;
 const edit=(operationId,settings,versions={expectedSettingsVersion:before.settings.version,expectedRevision:before.revision})=>invoke('applyOwner',{expectedRoleId,command:{kind:'edit-settings',operationId,settings,...versions}});
 for(const [operationId,settings]of [['edit-unknown',{inputLimitBytes:64,unexpected:1}],['edit-zero',{inputLimitBytes:0}],['edit-fraction',{inputLimitBytes:1.5}],['edit-missing',{}],['edit-proto',JSON.parse('{"inputLimitBytes":64,"__proto__":1}')]]){
  await assert.rejects(edit(operationId,settings),e=>e.code==='role/home-error'&&e.details.reason==='INVALID_SETTINGS');
  assert.equal((await invoke('readOperation',{operationId,expectedRoleId})).kind,'not-found');
 }
 for(const settings of [{inputLimitBytes:'64'},64])await assert.rejects(edit('edit-codec-value',settings),e=>e.code!=='role/home-error');
 await assert.rejects(edit(42,{inputLimitBytes:64}),e=>e.code!=='role/home-error');
 await assert.rejects(edit('edit-version',{inputLimitBytes:64},{expectedSettingsVersion:99,expectedRevision:before.revision}),e=>e.code==='role/home-error'&&e.details.reason==='SETTINGS_VERSION_CONFLICT');
 assert.equal((await invoke('inspect',{})).role.home.revision,before.revision);
 const receipt=await edit('edit-valid',{inputLimitBytes:64});assert.equal(receipt.committedRevision,before.revision+1);
 const after=(await invoke('inspect',{})).role.home;assert.equal(after.settings.value.inputLimitBytes,64);assert.equal(after.settings.version,before.settings.version+1);
});

test('conversation Remote 拒绝未知、缺失、无效和 __proto__ 配置且不发布提交',async t=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const {join}=await import('node:path');const {tmpdir}=await import('node:os');const root=await mkdtemp(join(tmpdir(),'role-conversation-settings-'));
 const ctx=new Context();t.after(async()=>{await ctx.fiber.dispose();await rm(root,{recursive:true,force:true});});for(const p of [Loader,Registry,Access,Gateway,Inventory,Commands])await ctx.plugin(p);ctx.typert.register(TYPERT);await ctx.plugin(plugin);
 const peer=new Peer(ctx,{principal:{kind:'owner'}});const invoke=(method,args)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args});
 const created=await invoke('createHome',{path:join(root,'home'),request:{operationId:'conversation-create',core:'fixture',settings:{inputLimitBytes:32768}},expectedProfileVersion:0});const guard={expectedRoleId:created.roleId,expectedBindingVersion:1};
 const before=await invoke('readConversation',guard),valid=before.rules.value;
 const edit=(operationId,value,version=before.rules.version)=>invoke('editConversation',{...guard,request:{operationId,value,expectedConversationVersion:version,expectedRevision:before.revision}});
 for(const [operationId,value]of [['conversation-unknown',{...valid,unexpected:1}],['conversation-proto',Object.fromEntries([...Object.entries(valid),['__proto__',1]])],['conversation-missing',{}],['conversation-zero',{...valid,outputTokens:0}]]){
  await assert.rejects(edit(operationId,value),e=>e.code==='role/home-error'&&e.details.reason==='INVALID_CONVERSATION_SETTINGS');
  assert.equal((await invoke('readOperation',{operationId,expectedRoleId:created.roleId})).kind,'not-found');
 }
 await assert.rejects(edit('conversation-version',valid,99),e=>e.code==='role/home-error'&&e.details.reason==='CONVERSATION_VERSION_CONFLICT');
 for(const value of [{...valid,outputTokens:'1'},1])await assert.rejects(edit('conversation-codec-value',value),e=>e.code!=='role/home-error');
 await assert.rejects(edit(42,valid),e=>e.code!=='role/home-error');
 // This fixture has no route: the unchanged valid JSON reaches the existing route check.
 await assert.rejects(edit('conversation-valid',valid),e=>e.code==='role/home-error'&&e.details.reason==='MODEL_ROUTE_UNAVAILABLE');
 const after=await invoke('readConversation',guard);assert.equal(after.revision,before.revision);assert.deepEqual(after.rules,before.rules);
});
