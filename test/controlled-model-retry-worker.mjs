import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';
import {saveNativeEvidence35} from './evidence35.mjs';
const run=process.env.DSH_TEST_RUN,reuse=process.argv.includes('--reuse-permit'),quota=process.argv.includes('--quota'),largeRetryAfter=process.argv.includes('--large-retry-after'),rulesDisabled=process.argv.includes('--rules-disabled'),shortDelay=process.argv.includes('--short-delay');
const retryWaits=[];
const {ctx,module,entries,metadataEntries,shutdown}=await bootNativeFixture(run,entry=>!reuse&&entry.ordinal===1?new Response(JSON.stringify({type:'error',error:quota?{code:'insufficient_quota',message:'account credits exhausted'}:{type:'api_error',message:'Controlled temporary provider failure'}}),{status:quota?429:503,headers:{'content-type':'application/json','retry-after':largeRetryAfter?'100000000000000000000':'0'}}):response('同一逻辑请求重试后完整回复'));
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
let role,home,failure;
try {
 home=await createRoleHome(join(run,'role'),{operationId:'retry-create',core:'只在当前用户来源内重试',settings:{inputLimitBytes:32768}});
 const native=await createNativeExecution(ctx),execution=reuse||shortDelay?withNativeScope(native,scope=>Object.freeze({...scope,createModelOperation(purpose){
  const operation=scope.createModelOperation(purpose);return Object.freeze({...operation,
   async retry(...args){const start=performance.now();try{return await operation.retry(...args);}finally{retryWaits.push(performance.now()-start);}},
   async reserve(request){const permit=await operation.reserve(request);if(!reuse)return permit;return Object.freeze({...permit,async *iterate(effect){yield* permit.iterate(effect);yield* permit.iterate(effect);}});}
  });
 }})):native;
 role=await startRole(home,{execution});
 if(rulesDisabled||shortDelay){const view=await home.readSnapshot();const receipt=await role.owner.apply({kind:'edit-retry-rules',operationId:'retry-disable',expectedRetryRulesVersion:1,expectedRevision:view.revision,value:{maxAutomaticRetries:rulesDisabled?0:1,retryDelayMs:shortDelay?25:1000}});assert.equal(receipt.kind,'committed');}
 await role.runtime.receive(bound(home.roleId,'transient'));
 await waitFor(async()=>(await role.runtime.inspect()).home?.inputSummary.resolved===1);
 const state=await role.owner.readConversation(),models=state.attempts.filter(x=>x.kind==='model');
 if(reuse){assert.equal(entries.length,1,'one issued model attempt must never dispatch a second native request by reusing its iterable capability');assert.equal(models.length,1);assert.equal(state.turns[0].outcome.kind,'failure');}
 else if(rulesDisabled){assert.equal(entries.length,1,'saved owner retry limit zero must block a new retry of the transient request');assert.equal(models.length,1);assert.equal(state.retryRules.version,2);assert.deepEqual(state.retryRules.value,{maxAutomaticRetries:0,retryDelayMs:1000});assert.equal(state.replies.length,0);}
 else if(largeRetryAfter){assert.equal(entries.length,1,'a provider Retry-After beyond the original deadline must not be dropped into the default retry wait');assert.equal(models.length,1);assert.equal(models[0].outcome.modelFailure.providerRetryAfterMs,1e23);assert.equal(state.replies.length,0);}
 else if(quota){assert.equal(entries.length,1,'terminal normalized QUOTA must not be retried merely because its HTTP status is 429');assert.equal(models.length,1);assert.equal(models[0].outcome.modelFailure.code,'QUOTA');assert.equal(state.replies.length,0);}
 else{assert.equal(entries.length,2,'a transient native request failure must get exactly one freshly reserved controlled retry');
 assert.equal(models.length,2);assert.deepEqual(models.map(x=>x.source),['user','user']);
 assert.deepEqual(models.map(x=>x.outcome.kind),['failed','completed']);
 assert.equal(models[0].modelOperation.logicalOpId,models[1].modelOperation.logicalOpId);assert.deepEqual(models.map(x=>x.modelOperation.ordinal),[0,1]);assert.equal(models[1].modelOperation.previousAttemptId,models[0].attemptId);assert.equal(models[0].outcome.modelFailure.status,503);
 assert.equal(state.replies.length,1);assert.equal((await role.owner.readReply({replyId:state.replies[0].replyId,offset:0,limit:100})).text,'同一逻辑请求重试后完整回复');
 }
 if(shortDelay){assert.equal(retryWaits.length,1);assert(retryWaits[0]>=20&&retryWaits[0]<900,'actual configured 25ms retry wait must replace the default 1000ms, observed '+retryWaits[0]);assert.equal(models[0].retryRules.version,2);assert.equal(models[1].retryRules.value.retryDelayMs,25);}
 assert.equal(metadataEntries.length,0);
 await saveNativeEvidence35(run,'controlled-model-retry',{home,state,entries,metrics:{actualProviderEntries:entries.length,retryWaits,metadataEntries:metadataEntries.length,logicalOperations:models.map(x=>({attemptId:x.attemptId,source:x.source,modelOperation:x.modelOperation,modelFailure:x.outcome.modelFailure??null}))}});
} catch(error) {failure=error;if(home)await saveNativeEvidence35(run,'controlled-model-retry',{home,entries,status:'failed',error});}
finally {
 role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;
 const lockAbsent=await access(join(run,'role/writer.lock')).then(()=>false,error=>error.code==='ENOENT');
 const reopened=await openRoleHome(join(run,'role')),saved=await reopened.readConversation();await reopened.close();
 await shutdown.shutdown(0);
 await writeFile(join(run,'retry-result.json'),JSON.stringify({status:failure?'failed':'passed',roleId:home?.roleId,models:entries.length,retryWaits,savedAttempts:saved.attempts.length,savedRetryRules:saved.retryRules??null,savedModelOperations:saved.attempts.map(x=>({attemptId:x.attemptId,modelOperation:x.modelOperation??null,retryRules:x.retryRules??null,modelFailure:x.outcome?.modelFailure??null})),writerLockAbsent:lockAbsent,hostStopped:true,error:failure?.message??null,externalBusinessCalls:{model:0,web:0,qq:0}},null,2)+'\n');
}
if(failure)throw failure;
