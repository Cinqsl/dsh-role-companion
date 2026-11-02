import {createRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {join} from 'node:path';
const [stage,source,destination,resultPath]=process.argv.slice(2);let role;const operationId='crash-backup54-'+stage;
const home=await createRoleHome(source,{operationId:'crash-create54',core:'强退合成角色',settings:{inputLimitBytes:32768}},{barrier:async current=>{
 if(current!==stage)return;const progress=await role.owner.readBackup(operationId);const present=async path=>{try{await access(path);return true;}catch{return false;}};
 await writeFile(resultPath,JSON.stringify({case:'backup54-crash',stage,operationId,roleId:home.roleId,source,destination,progress,pid:process.pid,writerLock:await present(join(source,'writer.lock')),maintenanceLock:await present(join(source,'.maintenance.lock')),actualModels:0,actualTools:0},null,2)+'\n');process.exit(77);
}});
await mkdir(join(source,'works'));await writeFile(join(source,'works','work.txt'),'全部作品与旧正文必须保留');await writeFile(join(source,'views','settings.json'),'外部编辑投影必须完整保留\n');
await home.applyOwner({kind:'edit-read-rules',operationId:'crash-read-rules54',value:{toolConcurrency:1,readTimeoutMs:3210,displayCodePoints:500},expectedReadRulesVersion:1,expectedRevision:home.revision});
role=await startRole(home,{});const snapshot=await home.readSnapshot(),binding=snapshot.panelBinding;
await role.runtime.receive({operationId:'crash-input54',externalKey:'crash-key54',text:'原输入保留，不能重放旧栈',bindingId:binding.bindingId,bindingVersion:binding.bindingVersion,origin:'live',receivedAt:'2026-10-26T00:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
await role.owner.requestBackup({operationId,destination});await new Promise(()=>{});
