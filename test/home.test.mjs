import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';
const request={operationId:'create-01',core:'合成角色：小星',settings:{inputLimitBytes:32768}};
test('创建之家先保存身份和初始设定，原操作重试及重新打开保持同一角色',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-home-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');
 const home=await createRoleHome(path,request);const first=await home.readSnapshot();
 assert.equal(first.core.text,'合成角色：小星');assert.equal(first.settings.value.inputLimitBytes,32768);
 assert.equal((await home.readOperation('create-01')).stage,'created-unregistered');await home.close();
 const retry=await createRoleHome(path,request);assert.equal((await retry.readSnapshot()).roleId,first.roleId);await retry.close();
 const opened=await openRoleHome(path);assert.equal((await opened.readSnapshot()).revision,1);await opened.close();
});

test('同一 startRole owner 编辑核心与设置，版本冲突拒绝，重启消费新限制',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-owner-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');
 const {startRole}=await import('dsh-role-companion/runtime');const role=await startRole(await createRoleHome(path,request),{});
 const change={kind:'edit-core',operationId:'core-02',text:'新核心',expectedCoreVersion:1,expectedRevision:1};
 assert.equal((await role.owner.apply(change)).committedRevision,2);
 assert.equal((await role.owner.apply({...change,expectedRevision:99})).committedRevision,2);
 await assert.rejects(role.owner.apply({...change,text:'冲突'}),{code:'OPERATION_CONFLICT'});
 await assert.rejects(role.owner.apply({...change,operationId:'old-version',expectedRevision:1}),{code:'REVISION_CONFLICT'});
 await role.owner.apply({kind:'edit-settings',operationId:'settings-03',settings:{inputLimitBytes:4},expectedSettingsVersion:1,expectedRevision:2});
 assert.equal((await role.runtime.receive({text:'12345'})).reason,'input-too-large');
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 const restored=await startRole(await openRoleHome(path),{});
 assert.equal((await restored.runtime.inspect()).home.core.text,'新核心');
 assert.equal((await restored.runtime.receive({text:'12345'})).reason,'input-too-large');restored.lifetime.requestStop('unload');await restored.lifetime.stopped;
});

test('已发布未确认收据保留原操作，不明期间拒绝其他写入，重试只补齐原提交',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-fault-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');let once=true;
 const home=await createRoleHome(path,request,{barrier:async(stage,detail)=>{if(stage==='after-commit-publish'&&detail.operationId==='core-fault'&&once){once=false;throw Error('synthetic fsync failure');}}});
 const edit={kind:'edit-core',operationId:'core-fault',text:'已发布核心',expectedCoreVersion:1,expectedRevision:1};
 await assert.rejects(home.applyOwner(edit),{code:'IO_UNCERTAIN'});
 assert.equal((await home.readOperation('core-fault')).kind,'uncertain');
 await assert.rejects(home.applyOwner({...edit,operationId:'other'}),{code:'IO_UNCERTAIN'});
 assert.equal((await home.applyOwner(edit)).committedRevision,2);assert.equal((await home.readSnapshot()).core.text,'已发布核心');await home.close();
});

test('IO_UNCERTAIN 原操作恢复会修复旧生成投影，手工投影改动保留且可见',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-view-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');let once=true;
 const home=await createRoleHome(path,request,{barrier:async(stage,detail)=>{if(stage==='after-commit-publish'&&detail.operationId==='view-fault'&&once){once=false;throw Error('synthetic');}}});
 const edit={kind:'edit-core',operationId:'view-fault',text:'新投影',expectedCoreVersion:1,expectedRevision:1};await assert.rejects(home.applyOwner(edit),{code:'IO_UNCERTAIN'});
 assert.equal((await home.applyOwner(edit)).projection,'current');
 const {writeFile,readFile}=await import('node:fs/promises');await writeFile(join(path,'views/settings.json'),'手工笔记\n');
 await home.applyOwner({...edit,operationId:'manual',text:'另一核心',expectedCoreVersion:2,expectedRevision:2});
 assert.equal((await home.readSnapshot()).projection,'diff');assert.equal(await readFile(join(path,'views/settings.json'),'utf8'),'手工笔记\n');await home.close();
});

test('最终提交的规范字节被改写时拒绝打开，不能仅依赖下一条 prev',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-corrupt-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const h=await createRoleHome(path,request);await h.applyOwner({kind:'edit-core',operationId:'original',text:'新核心',expectedCoreVersion:1,expectedRevision:1});await h.close();
 const {readFile,writeFile}=await import('node:fs/promises');const {canonicalBytes}=await import('dsh-role-companion/home');const file=join(path,'commits/000000000002.json');const c=JSON.parse(await readFile(file,'utf8'));c.operationId='altered';await writeFile(file,canonicalBytes(c));
 await assert.rejects(openRoleHome(path),{code:'CORRUPT_COMMIT'});
});

test('固定 UTF-8 规范编码样本与摘要独立匹配',async()=>{
 const {readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto');const {canonicalBytes}=await import('dsh-role-companion/home');const fixture=JSON.parse(await readFile(new URL('./fixtures/home-v1.json',import.meta.url),'utf8'));
 const bytes=canonicalBytes({z:-0,a:[1,'角色\n']});assert.equal(bytes.toString(),fixture.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),fixture.sha256);
 for(const value of [NaN,1.5,undefined,{a:undefined},[,,],{get a(){return 1;}},'\ud800'])assert.throws(()=>canonicalBytes(value));
});

test('未知格式、损坏正文与链缺口保留资料并拒绝写打开',async t=>{
 const {readFile,writeFile,unlink}=await import('node:fs/promises');const {canonicalBytes}=await import('dsh-role-companion/home');
 for(const mode of ['format','blob','gap']){const root=await mkdtemp(join(tmpdir(),'role-invalid-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const home=await createRoleHome(path,request);await home.applyOwner({kind:'edit-core',operationId:'second',text:'第二版',expectedCoreVersion:1,expectedRevision:1});await home.close();
  if(mode==='format'){const file=join(path,'identity.json');const id=JSON.parse(await readFile(file,'utf8'));id.formatMajor=99;await writeFile(file,canonicalBytes(id));await assert.rejects(openRoleHome(path),{code:'UNKNOWN_FORMAT'});}
  if(mode==='blob'){const c=JSON.parse(await readFile(join(path,'commits/000000000002.json'),'utf8'));await writeFile(join(path,'blobs',c.data.core+'.json'),'corrupted');await assert.rejects(openRoleHome(path),{code:'CORRUPT_CONTENT'});}
  if(mode==='gap'){await unlink(join(path,'commits/000000000001.json'));await assert.rejects(openRoleHome(path),{code:'CORRUPT_CHAIN'});}
 }
});

test('原创建操作可恢复已发布 identity 的自有临时 hard-link 别名',async t=>{
 const {link}=await import('node:fs/promises');const root=await mkdtemp(join(tmpdir(),'role-alias-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const first=await createRoleHome(path,request);const roleId=first.roleId;await first.close();await link(join(path,'identity.json'),join(path,'.identity.json.00000000-0000-4000-8000-000000000000.pending'));
 const retry=await createRoleHome(path,request);assert.equal(retry.roleId,roleId);await retry.close();
});

test('原文 UTF-8 上限内的控制字符核心可完整创建并重新打开',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-encoding-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const core='\u0001'.repeat(1048576);const home=await createRoleHome(path,{...request,core});await home.close();const reopened=await openRoleHome(path);assert.equal((await reopened.readSnapshot()).core.text,core);await reopened.close();
});

test('已有目录不被初始化覆盖，身份、指纹与活写者冲突明确拒绝',async t=>{
 const {mkdir,readdir}=await import('node:fs/promises');const root=await mkdtemp(join(tmpdir(),'role-conflicts-'));t.after(()=>rm(root,{recursive:true,force:true}));const unrelated=join(root,'notes');await mkdir(unrelated);await assert.rejects(createRoleHome(unrelated,request));assert.deepEqual(await readdir(unrelated),[]);
 const path=join(root,'home');const home=await createRoleHome(path,request);await assert.rejects(openRoleHome(path),{code:'HOME_BUSY'});await home.close();
 await assert.rejects(createRoleHome(path,{...request,core:'不同内容'}),{code:'CREATE_CONFLICT'});await assert.rejects(openRoleHome(path,{expectedRoleId:'role-00000000-0000-4000-8000-000000000000'}),{code:'IDENTITY_CONFLICT'});
 const reopened=await openRoleHome(path);assert.equal((await reopened.readSnapshot()).core.text,request.core);await reopened.close();
});

test('停稳与读取并发时仍返回可核对状态，不在 Home 关闭后读取正文',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-stopping-'));t.after(()=>rm(root,{recursive:true,force:true}));const {startRole}=await import('dsh-role-companion/runtime');const role=await startRole(await createRoleHome(join(root,'home'),request),{});role.lifetime.requestStop('migration');const view=await role.runtime.inspect();assert.ok(['stopping','stopped'].includes(view.status));await role.lifetime.stopped;
});

test('删除已确认的最终提交必须拒绝打开，不能回退为较早 revision',async t=>{
 const {unlink}=await import('node:fs/promises');const root=await mkdtemp(join(tmpdir(),'role-tail-loss-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const home=await createRoleHome(path,request);await home.applyOwner({kind:'edit-core',operationId:'acknowledged-tail',text:'已确认末尾',expectedCoreVersion:1,expectedRevision:1});await home.close();await unlink(join(path,'commits/000000000002.json'));await assert.rejects(openRoleHome(path),{code:'CORRUPT_HEAD'});
});

test('必需确认下界缺失时拒写，原创建重试也不重新初始化已提交资料',async t=>{
 const {unlink}=await import('node:fs/promises');const root=await mkdtemp(join(tmpdir(),'role-head-missing-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const home=await createRoleHome(path,request);await home.close();await unlink(join(path,'head.json'));await assert.rejects(openRoleHome(path),{code:'CORRUPT_HEAD'});await assert.rejects(createRoleHome(path,request),{code:'CORRUPT_HEAD'});
});
test('确认下界发布后同步故障仍为 IO_UNCERTAIN，原操作恢复一次提交',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-head-fault-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');let fail=true;const home=await createRoleHome(path,request,{barrier:async(stage,detail)=>{if(stage==='after-head-publish'&&detail.operationId==='floor-fault'&&fail){fail=false;throw Error('synthetic head directory sync');}}});const edit={kind:'edit-core',operationId:'floor-fault',text:'确认下界恢复核心',expectedCoreVersion:1,expectedRevision:1};await assert.rejects(home.applyOwner(edit),{code:'IO_UNCERTAIN'});assert.equal((await home.readOperation(edit.operationId)).kind,'uncertain');assert.equal((await home.applyOwner(edit)).committedRevision,2);await home.close();const next=await openRoleHome(path);assert.equal((await next.readSnapshot()).revision,2);await next.close();
});

test('固定 Home v1 提交与确认下界 golden 样本可由公开打开接口读取',async t=>{
 const {mkdir,writeFile,readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto');const fixture=JSON.parse(await readFile(new URL('./fixtures/home-v1-commit.json',import.meta.url),'utf8'));const root=await mkdtemp(join(tmpdir(),'role-golden-'));t.after(()=>rm(root,{recursive:true,force:true}));for(const dir of ['commits','blobs','views'])await mkdir(join(root,dir));for(const [name,bytes]of Object.entries(fixture.files))await writeFile(join(root,name),bytes);
 assert.equal(createHash('sha256').update(fixture.files['commits/000000000001.json']).digest('hex'),fixture.commitSha256);assert.equal(createHash('sha256').update(fixture.files['head.json']).digest('hex'),fixture.headSha256);const home=await openRoleHome(root);assert.equal(home.roleId,fixture.roleId);assert.equal((await home.readSnapshot()).core.text,fixture.core);assert.equal((await home.readOperation(fixture.operationId)).committedRevision,1);await home.close();for(const [name,bytes]of Object.entries(fixture.files))assert.equal(await readFile(join(root,name),'utf8'),bytes,'golden authority bytes changed: '+name);
});
