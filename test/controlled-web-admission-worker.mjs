import assert from 'node:assert/strict';
import {access,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {bootNativeFixture,response,waitFor,bound} from './native-fixture.mjs';

const run=process.env.DSH_TEST_RUN,mode=process.argv[2],entered=Promise.withResolvers(),release=Promise.withResolvers(),ownerRevoked=Promise.withResolvers();
const events=[],event=kind=>events.push({index:events.length,kind}),report={status:'running',mode,events,realBusinessCalls:{model:0,web:0,qq:0}};
let role,home,canonicalFinals=0,actualHttp=0,signal,failure,stop;
const save=()=>writeFile(join(run,'web-admission-result.json'),JSON.stringify(report,null,2)+'\n');
const frames=[{type:'message_start',message:{id:'web-admission-step',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_web_admission',name:'role_web_search',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:'{"query":"已经预留不代表已dispatch"}'}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];
const {ctx,module,entries,metadataEntries,shutdown}=await bootNativeFixture(run,entry=>{
 event('actual-model-'+entry.ordinal);return entry.ordinal===1?new Response(frames.map(frame=>`event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}}):response('封口后不得发行');
},{globalCompaction:false});
try{
 const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
 home=await createRoleHome(join(run,'role'),{operationId:'web-admission-create44',core:'已预留仍必须通过真实发行入口',settings:{inputLimitBytes:32768}},{barrier:async(stage,detail)=>{
  if(stage==='before-commit-publish'&&detail.operationId.startsWith('enter-web-')){event('real-web-entry-save-held');entered.resolve();await release.promise;event('real-web-entry-save-released');}
 }});
 const port={async post(){actualHttp++;event('unexpected-actual-http');throw Error('Revoked admission must not reach transport');}};
 const native=await createNativeExecution(ctx,undefined,port);native.onClosing(code=>{report.nativeRevocation=code;event('public-native-owner-revoked');ownerRevoked.resolve();});
 ctx.on('tools/execute',async(exec,next)=>{if(exec.name==='role_web_search')signal=exec.signal;return next();});ctx.on('tools/result',exec=>{if(exec.name==='role_web_search'){canonicalFinals++;event('canonical-final');}});
 role=await startRole(home,{execution:native});report.roleId=home.roleId;await role.runtime.receive(bound(home.roleId,'web-admission-'+mode));await entered.promise;
 if(mode==='owner'){
  const provider=ctx.configEditor.entries().find(entry=>entry.options.name==='@deepseek-ai/dsh-llm-deepseek-api-key');assert(provider);
  stop=ctx.configEditor.edit(provider,current=>({...current,thinking:'enabled'}));await ownerRevoked.promise;
 }else{assert.equal(mode,'stop');stop=role.owner.stop({operationId:'web-pre-dispatch-stop44'});}
 const held=await role.runtime.inspect();report.held={view:held,actualHttp,canonicalFinals,toolSignalAborted:signal.aborted};await save();
 assert.equal(held.status,'stopping');assert.equal(actualHttp,0);assert.equal(canonicalFinals,0);await access(join(run,'role/writer.lock'));
 release.resolve();await stop;await role.lifetime.stopped;event('actual-role-stopped');
 const reopened=await openRoleHome(join(run,'role'),{expectedRoleId:home.roleId});
 try{report.after=await reopened.readConversation();report.snapshot=await reopened.readSnapshot();}finally{await reopened.close();}
 const web=report.after.attempts.filter(attempt=>attempt.kind==='web'),tool=report.after.attempts.filter(attempt=>attempt.kind==='tool');
 assert.equal(actualHttp,0);assert.equal(entries.length,1);assert.equal(web.length,1);assert.equal(tool.length,1);assert.equal(canonicalFinals,1);assert.equal(metadataEntries.length,0);
 assert.equal(web[0].outcome.kind,'not-dispatched');assert.equal(web[0].outcome.data.dispatchObserved,false);assert.equal(web[0].outcome.data.completeness,'not-dispatched');assert.equal(web[0].outcome.data.retainedBytes,0);assert.equal(web[0].webOperation.parentAttemptId,tool[0].attemptId);assert.equal(tool[0].outcome.data.result.final.isError,true);
 Object.assign(report,{status:'passed',actualModels:entries.length,actualHttp,canonicalFinals,metadata:metadataEntries.length,roleStopped:true,chargedTool:tool.length,chargedWeb:web.length});
}catch(error){failure=error;Object.assign(report,{status:'failed',error:{code:error.code??null,message:error.message,stack:error.stack},actualModels:entries.length,actualHttp,canonicalFinals});await save();}
finally{
 release.resolve();const timer=setTimeout(()=>process.exit(2),8000);
 try{await stop?.catch(()=>{});role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;else if(home)await home.close();await shutdown.shutdown(0);report.hostStopped=true;await assert.rejects(access(join(run,'role/writer.lock')),{code:'ENOENT'});await assert.rejects(access(join(run,'role/.maintenance.lock')),{code:'ENOENT'});report.locksReleased=true;await save();}finally{clearTimeout(timer);}
}
if(failure){console.error('Web pre-dispatch admission tracer failed',failure);process.exitCode=2;}
