import assert from 'node:assert/strict';
import {join} from 'node:path';
import {readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {createRoleHome,restoreRoleBackup} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
import {bootOfficialCliFixture} from './official-cli-fixture.mjs';
import {response} from './native-fixture.mjs';
/** Negative matrix: the same interruption must stay refused when the deny records or the cache are not provable. */
const run=process.env.DSH_TEST_RUN,mode=process.argv[2];
const source=join(run,'source'),backup=join(run,'backup'),destination=join(run,'target');
const record={case:'55-activation-resume-negative-'+mode,status:'recorded',fullAcceptanceCasesPassed:[],realBusinessCalls:{model:0,web:0,qq:0},mode,exits:[]};
let sourceRole,host,failure;
async function wait(read,check){for(let i=0;i<1200;i++){const value=await read();if(check(value))return value;await new Promise(r=>setTimeout(r,10));}assert.fail('resume negative did not settle');}
async function stopHost(){record.exits.push({pid:host.child.pid,models:host.entries.length,metadata:host.metadataEntries.length,...await host.stop()});host=undefined;}
try{
 const home=await createRoleHome(source,{operationId:'neg-source55',core:'不可核对的保护状态必须失败关闭。',settings:{inputLimitBytes:32768}});record.roleId=home.roleId;
 sourceRole=await startRole(home,{});
 await sourceRole.owner.requestHandover({operationId:'neg-outgoing55',destination:backup,expectedRevision:home.revision});
 record.handover=await wait(()=>sourceRole.owner.readHandover('neg-outgoing55'),x=>x.phase==='verified');await sourceRole.lifetime.stopped;sourceRole=undefined;
 host=await bootOfficialCliFixture(run,()=>response('不得在不可核对时运行。'),{profileName:'neg55',captureTransportError:true});
 record.copy=await host.rpc('requestRestore',{request:{operationId:'neg-copy55',backupPath:backup,destination,expectedRoleId:home.roleId,expectedManifestDigest:record.handover.backup.manifestDigest},expectedProfileVersion:0});
 await stopHost();
 // Publish the acceptance from another process, leaving the local registration unwritten.
 const {openRoleHome}=await import('dsh-role-companion/home');
 const opened=await openRoleHome(destination,{expectedRoleId:home.roleId});
 const preview=await startRole(opened,{});
 record.acceptance=await preview.owner.confirmRestore({operationId:'neg-confirm55',restoreOperationId:'neg-copy55',handoverId:record.handover.record.handoverId,expectedManifestDigest:record.copy.manifestDigest,expectedRevision:record.copy.sourceRevision,currentSourceStoppedConfirmed:true});
 preview.lifetime.requestStop('migration');await preview.lifetime.stopped;
 const storages=join(run,'home/storages');const dir=join(storages,(await readdir(storages)).find(name=>name.startsWith('role_file_protection_')));
 record.before=JSON.parse(await readFile(join(dir,'global.json'),'utf8'));
 if(mode==='cache-cleared'){
  // Control: erasing the deny cache is NOT an accepted recovery path; whatever happens must not be reported as a safe activation.
  await rm(join(dir,'global.json'));
 }else if(mode==='record-removed'){
  // Remove one persisted deny record while leaving the manifest reference: the cache must detect the loss, not silently re-seal.
  const roots=Object.keys(record.before.record.roots);assert(roots.length>0);
  await rm(join(dir,'roots',roots[0]+'.json'));
 }else if(mode==='checkpoint-rewritten'){
  // Rewrite the persisted checkpoint to the observed value: only the deny owner may confirm it, not a file edit.
  const current=record.before.record;await writeFile(join(dir,'global.json'),JSON.stringify({version:1,record:{...current,checkpoint:'e'.repeat(64)}})+'\n');
 }else if(mode==='unproven-admission'){
  // Mark the cache unproven: admission must fail closed regardless of the pending confirmation.
  const current=record.before.record;await writeFile(join(dir,'global.json'),JSON.stringify({version:1,record:{...current,unproven:true}})+'\n');
 }else throw Error('unknown mode '+mode);
 host=await bootOfficialCliFixture(run,()=>response('不得在不可核对时运行。'),{profileName:'neg55',reuse:true,captureTransportError:true});
 const conf={operationId:'neg-confirm55',restoreOperationId:'neg-copy55',handoverId:record.handover.record.handoverId,expectedManifestDigest:record.copy.manifestDigest,expectedRevision:record.copy.sourceRevision,currentSourceStoppedConfirmed:true};
 record.resume=await host.rpc('confirmRestore',{expectedRoleId:home.roleId,request:conf,expectedRestoreProfileVersion:0}).then(value=>({kind:'resumed',value}),error=>({kind:'refused',error:error.message}));
 record.after=await host.rpc('inspect');
 record.models=host.entries.length;record.metadata=host.metadataEntries.length;
 assert.equal(host.entries.length,0,'an unprovable deny state must not issue model requests');
 assert.notEqual(record.after.role.status,'ready','an unprovable deny state must not activate the role');
 assert.equal(record.after.bootstrap.path,'');
 if(mode==='cache-cleared'){
  // Erasing the cache is treated as an unproven profile, so the copy cannot be confirmed here either.
  record.classification='cleared cache is not a recovery path; the owner still refuses to confirm';
  assert.equal(record.resume.kind,'refused');
 }else{
  assert.equal(record.resume.kind,'refused','unprovable deny metadata must keep the confirmation refused');
  assert.match(record.resume.error,/FILE_SOURCE|FILE_PROTECTION|CHECKPOINT|CACHE/);
 }
 record.status='passed';
 await stopHost();
}catch(error){failure=error;record.status='failed';record.error={name:error.name,message:error.message,code:error.code??null};}
finally{if(host)await stopHost();if(sourceRole){sourceRole.lifetime.requestStop('unload');await sourceRole.lifetime.stopped;}await writeFile(join(run,'resume-negative-'+mode+'-result.json'),JSON.stringify(record,null,2).replaceAll(run,'<isolated-restore-home>')+'\n');}
if(failure)throw failure;
