import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
import {qqEvidence} from './qq-evidence.mjs';
test('QQ binding发布后确认故障按原操作恢复，不能先返回已确认却保留uncertain',{timeout:10000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'dsh-qq-bind-fault38-'));let once=true,home,role;
 t.after(async()=>{let timer;try{const cleanup=async()=>{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}else await home?.close();};await Promise.race([cleanup(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('QQ binding cleanup blocked; synthetic Home retained at '+root)),2000);})]);await rm(root,{recursive:true,force:true});}finally{clearTimeout(timer);}});
 home=await createRoleHome(join(root,'role'),{operationId:'bind-fault-create',core:'合成绑定故障',settings:{inputLimitBytes:32768}},{barrier:async(stage,detail)=>{if(stage==='after-head-publish'&&detail.operationId==='bind-fault'&&once){once=false;throw Error('synthetic head confirmation refusal');}}});role=await startRole(home,{});
 const command={kind:'bind-qq',operationId:'bind-fault',connectionId:'connection-fault',accountId:'10001',peerId:'20002',expectedBindingVersion:0,expectedRevision:home.revision};
 await assert.rejects(role.owner.apply(command),{code:'IO_UNCERTAIN'});assert.equal((await role.owner.readOperation(command.operationId)).kind,'uncertain');
 const retried=await role.owner.apply(command),receipt=await role.owner.readOperation(command.operationId);
 await qqEvidence('38-binding-confirmation',{status:receipt.kind==='committed'?'passed':'failed',roleId:home.roleId,revision:home.revision,retried,receipt});
 assert.equal(retried.kind,'committed');assert.equal(receipt.kind,'committed');assert.equal((await home.readSnapshot()).qqBinding.version,1);
 role.lifetime.requestStop('unload');await role.lifetime.stopped;role=undefined;home=await openRoleHome(join(root,'role'));assert.equal((await home.readSnapshot()).qqBinding.version,1);assert.equal((await home.readOperation(command.operationId)).kind,'committed');
});
