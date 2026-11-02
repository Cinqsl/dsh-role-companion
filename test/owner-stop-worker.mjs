import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {bootNativeFixture,response} from './native-fixture.mjs';
const run=process.env.DSH_TEST_RUN;
const {ctx,module,entries,shutdown}=await bootNativeFixture(run,()=>response('禁止触发模型'));
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
let role,home,failure;const order=[];const evidence={case:'owner-stop-idle',status:'running',realBusinessCalls:0,order};
try{
 home=await createRoleHome(join(run,'role'),{operationId:'stop-create',core:'公开停止操作不会清空输入或计数',settings:{inputLimitBytes:32768}},{barrier:async(stage,detail)=>{if(stage==='before-commit-publish')order.push({stage,operationId:detail.operationId,revision:detail.revision});}});
 evidence.roleId=home.roleId;
 role=await startRole(home,{execution:await createNativeExecution(ctx)});
 const receipt=await role.owner.stop({operationId:'owner-stop-idle'});
 assert.equal(receipt.kind,'committed');assert.equal(receipt.operationId,'owner-stop-idle');
 const during=await role.owner.readOperation('owner-stop-idle');assert.equal(during.kind,'committed');assert.equal(during.stop.operationId,'owner-stop-idle');
 await role.lifetime.stopped;order.push('actual-role-stopped');
 const stopped=await role.owner.readOperation('owner-stop-idle');assert.equal(stopped.stop.phase,'stopped');assert.equal(stopped.stop.checkpoint,'ready-to-close');
 await assert.rejects(home.readSnapshot(),error=>error.code==='HOME_CLOSED');
 await assert.rejects(access(join(run,'role/writer.lock')),error=>error.code==='ENOENT');
 const reopened=await openRoleHome(join(run,'role')),persisted=await reopened.readOperation('owner-stop-idle');
 assert.equal(persisted.kind,'committed');assert.equal(persisted.stop.checkpoint,'ready-to-close');assert.equal(persisted.stop.phase,'unverified','reopened Home cannot invent old lifetime completion');
 await reopened.close();assert.equal(entries.length,0);
 Object.assign(evidence,{status:'passed',roleId:receipt.roleId,receipt,during,stopped,persisted,actualModels:entries.length,lockReleased:true});
}catch(error){failure=error;evidence.status='failed';evidence.error={name:error.name,code:error.code??null,message:error.message};}
finally{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}else if(home)await home.close();await shutdown.shutdown(0);evidence.hostStopped=true;await writeFile(join(run,'owner-stop-result.json'),JSON.stringify(evidence,null,2)+'\n');}
if(failure){console.error('Owner stop public tracer',failure);process.exitCode=2;}else console.log('Persistent owner-stop receipt and honest post-close operation projection passed.');
