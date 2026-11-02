import {writeFile,readdir,readFile,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';

/**
 * Prepare a real 1.0 Home with one verified backup, then drive a format upgrade and die at `stage`.
 * `mode=resume` instead opens the same Home in a fresh process and reports the durable task.
 */
const [mode,source,reportPath,stage='after-cleanup-generation-sync']=process.argv.slice(2);
const create={operationId:'crash-create56',core:'合成强退角色：旧代必须可核对。',settings:{inputLimitBytes:32768}};
const operationId='crash-upgrade56';
const report=async value=>{await writeFile(reportPath,JSON.stringify(value,null,2)+'\n');};

if(mode==='prepare'){
  const home=await createRoleHome(source,create);
  await home.applyOwner({kind:'edit-core',operationId:'crash-core56',text:'强退前核心',expectedCoreVersion:1,expectedRevision:1});
  const binding=(await home.readSnapshot()).panelBinding;
  await home.acceptInput({operationId:'crash-input56',bindingId:binding.bindingId,bindingVersion:binding.bindingVersion,externalKey:'crash-key56',text:'强退前输入正文。',origin:'live',receivedAt:'2026-10-28T01:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
  const role=await startRole(home,{});
  const destination=join(await realpath(source+'/..'),'backup-crash56');
  await role.owner.requestBackup({operationId:'crash-backup56',destination});
  let backup;
  for(let n=0;n<3000;n++){backup=await role.owner.readBackup('crash-backup56');if(backup.phase==='verified-restorable'||backup.phase==='failed')break;await new Promise(r=>setTimeout(r,5));}
  role.lifetime.requestStop('unload');await role.lifetime.stopped;
  await report({mode,backup,pid:process.pid});
  process.exit(0);
}

if(mode==='crash'){
  // The barrier must not call back into the same Home: that serial queue is the running task.
  // Durable facts are read from disk instead, exactly what a later process would see.
  const durable=async()=>{
    const head=JSON.parse(await readFile(join(source,'head.json'),'utf8'));
    const journalDirectory=join(source,'.format-upgrade'),names=(await readdir(journalDirectory).catch(()=>[])).filter(name=>!name.startsWith('.'));
    const journal=names.length?JSON.parse(await readFile(join(journalDirectory,names[0]),'utf8')):undefined;
    return {head,progress:journal,commits:(await readdir(join(source,'commits'))).filter(name=>!name.startsWith('.')).length,generations:(await readdir(join(source,'content-generations')).catch(()=>[])).filter(name=>name.startsWith('generation-'))};
  };
  const home=await openRoleHome(source,{io:{barrier:async(current,detail)=>{
    if(detail.operationId!==operationId||current!==stage)return;
    const facts=await durable();
    await report({mode,stage,operationId,roleId:home.roleId,pid:process.pid,revision:facts.head.revision,head:facts.head,progress:facts.progress,commits:facts.commits,generations:facts.generations,actualModels:0,actualTools:0,actualQQ:0});
    process.exit(77);
  }}});
  const revision=(await home.readSnapshot()).revision;
  await home.requestFormatUpgrade({operationId,expectedRevision:revision});
  await home.continueFormatUpgrade(operationId);
  await report({mode,stage,unexpected:'the crash stage was never reached'});
  process.exit(3);
}

if(mode==='resume'){
  const home=await openRoleHome(source);
  const before=await home.readFormatUpgrade(operationId),snapshot=await home.readSnapshot(),status=await home.formatStatus();
  const viewed=await (async()=>{const {startRole}=await import('dsh-role-companion/runtime');return startRole(home,{});})();
  const view=await viewed.runtime.inspect();
  const writeDenied=await viewed.owner.apply({kind:'edit-core',operationId:'crash-forbidden56',text:'不能绕过',expectedCoreVersion:snapshot.core.version,expectedRevision:snapshot.revision}).catch(error=>error.details?.reason??error.code);
  const receiptDenied=(await viewed.runtime.receive({text:'升级待核对时不能接纳'})).reason;
  const resumed=await viewed.owner.resumeFormatUpgrade({operationId,expectedRevision:snapshot.revision});
  const after=await home.readSnapshot(),statusAfter=await home.formatStatus();
  viewed.lifetime.requestStop('unload');await viewed.lifetime.stopped;
  await report({mode,roleId:home.roleId,pid:process.pid,before,view,writeDenied,receiptDenied,resumed,after:{revision:after.revision,core:after.core.text,inputs:after.inputs.map(input=>input.text)},status,statusAfter,actualModels:0,actualTools:0,actualQQ:0});
  process.exit(0);
}

await report({mode,error:'unknown mode'});process.exit(2);
