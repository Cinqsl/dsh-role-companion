import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,cp,readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome,openRoleHomeForRuntime,diagnoseRoleHome,canonicalBytes} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';

const create={operationId:'create-format56',core:'合成格式角色：身份与正文必须原样保留。',settings:{inputLimitBytes:32768}};

async function tree(root,prefix=''){
  const result={};
  for(const entry of await readdir(join(root,prefix),{withFileTypes:true})){
    const path=join(prefix,entry.name);
    // Locks are live process state, not authority; compare the durable Home only.
    if(entry.name==='writer.lock'||entry.name==='.maintenance.lock'||entry.name.startsWith('.takeover-'))continue;
    if(entry.isDirectory())Object.assign(result,await tree(root,path));
    else result[path]=await readFile(join(root,path),'utf8');
  }
  return result;
}
const realRoot=async(...parts)=>mkdtemp(join(await (await import('node:fs/promises')).realpath(tmpdir()),...parts));

test('已知支持的格式关系明确：1.0 写打开且可升级，golden 与旧 Home 字节不变',{timeout:20000},async t=>{
  const root=await realRoot('format-known56-'),path=join(root,'home');t.after(()=>rm(root,{recursive:true,force:true}));
  const home=await createRoleHome(path,create),status=await home.formatStatus();
  assert.deepEqual(status.format,{major:1,minor:0});
  assert.equal(status.identity.major,1);
  assert.equal(status.layout,'root-inline');
  assert.deepEqual(status.upgrade.to,{major:2,minor:0});
  assert.equal(status.upgrade.available,true);
  const before=await tree(path);await home.close();
  const reopened=await openRoleHome(path,{expectedRoleId:status.roleId});assert.deepEqual(await reopened.formatStatus(),status);await reopened.close();
  assert.deepEqual(await tree(path),before,'opening a supported Home must not rewrite its authority bytes');

  const goldenRoot=join(root,'golden'),fixture=JSON.parse(await readFile(new URL('./fixtures/home-v1-commit.json',import.meta.url),'utf8'));
  for(const dir of ['commits','blobs','views'])await mkdir(join(goldenRoot,dir),{recursive:true});
  for(const [name,bytes]of Object.entries(fixture.files))await writeFile(join(goldenRoot,name),bytes);
  const golden=await openRoleHome(goldenRoot);const goldenStatus=await golden.formatStatus();await golden.close();
  assert.deepEqual(goldenStatus.format,{major:1,minor:0});assert.equal(goldenStatus.layout,'root-inline');assert.equal(goldenStatus.upgrade.available,true);
  for(const [name,bytes]of Object.entries(fixture.files))assert.equal(await readFile(join(goldenRoot,name),'utf8'),bytes,'golden authority bytes changed: '+name);

  const legacy=join(root,'legacy');await cp(new URL('./fixtures/home-35-old-rules',import.meta.url),legacy,{recursive:true});const legacyBefore=await tree(legacy);
  const old=await openRoleHome(legacy);assert.deepEqual((await old.formatStatus()).format,{major:1,minor:0});await old.close();
  assert.deepEqual(await tree(legacy),legacyBefore,'opening the shipped 1.0 Home must not rewrite it');
});

test('不认识的主版本只读拒写，写路径与运行期动作都拒绝且字节不变',{timeout:20000},async t=>{
  const root=await realRoot('format-unknown56-'),path=join(root,'home');t.after(()=>rm(root,{recursive:true,force:true}));
  const home=await createRoleHome(path,create);await home.applyOwner({kind:'edit-core',operationId:'unknown-second56',text:'第二版正文',expectedCoreVersion:1,expectedRevision:1});await home.close();
  const identityPath=join(path,'identity.json'),identity=JSON.parse(await readFile(identityPath,'utf8'));await writeFile(identityPath,canonicalBytes({...identity,formatMajor:99}));
  const before=await tree(path);
  await assert.rejects(openRoleHome(path),{code:'UNKNOWN_FORMAT'});
  const diagnostic=await diagnoseRoleHome(path);assert.equal(diagnostic.mode,'read-only');assert.equal(diagnostic.reason,'UNKNOWN_FORMAT');
  const opened=await openRoleHomeForRuntime(path);assert.equal('kind' in opened,true);assert.equal((await opened.readDiagnostic()).reason,'UNKNOWN_FORMAT');
  const role=await startRole(opened,{});t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;});
  const view=await role.runtime.inspect();assert.equal(view.status,'read-only');assert.equal(view.format?.status,'unsupported');assert.equal(view.format?.format.major,99);
  assert.equal((await role.runtime.receive({text:'不能写入'})).reason,'read-only');
  assert.equal((await role.owner.apply({kind:'edit-core',operationId:'unsupported56',text:'拒绝写入',expectedCoreVersion:2,expectedRevision:2})).kind,'unavailable');
  assert.deepEqual(await tree(path),before,'a rejected unsupported format must not rewrite authority bytes');
});

test('声明为2.0但缺少存储代权威的Home只读，提示需要原包恢复而不是升级',{timeout:20000},async t=>{
  const root=await realRoot('format-declared56-'),path=join(root,'home');t.after(()=>rm(root,{recursive:true,force:true}));
  const home=await createRoleHome(path,create);await home.close();
  const identityPath=join(path,'identity.json'),identity=JSON.parse(await readFile(identityPath,'utf8'));await writeFile(identityPath,canonicalBytes({...identity,formatMajor:2,formatMinor:0}));
  const before=await tree(path);
  await assert.rejects(openRoleHome(path),{code:'FORMAT_AUTHORITY_MISSING'});
  const diagnostic=await diagnoseRoleHome(path);assert.equal(diagnostic.mode,'read-only');assert.equal(diagnostic.reason,'FORMAT_AUTHORITY_MISSING');
  const opened=await openRoleHomeForRuntime(path);assert.equal('kind' in opened,true);assert.equal((await opened.readDiagnostic()).reason,'FORMAT_AUTHORITY_MISSING');
  const role=await startRole(opened,{});t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;});
  assert.equal((await role.runtime.inspect()).status,'read-only');
  assert.equal((await role.runtime.receive({text:'不能写入'})).reason,'read-only');
  assert.deepEqual(await tree(path),before);
});
