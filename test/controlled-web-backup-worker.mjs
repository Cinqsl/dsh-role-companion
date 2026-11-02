import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {access,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {bootNativeFixture,response,waitFor,bound} from './native-fixture.mjs';

const run=process.env.DSH_TEST_RUN,source=join(run,'role'),destination=join(run,'copy');
const bodyGate=Promise.withResolvers(),bodyReached=Promise.withResolvers(),finalGate=Promise.withResolvers(),finalReached=Promise.withResolvers();
const flushGate=Promise.withResolvers(),flushReached=Promise.withResolvers(),copyGate=Promise.withResolvers(),copyReached=Promise.withResolvers();
const order=[],wire=[],idle=new Set(),nativeResults=new Set(),raw=' {"title":"停稳前的真实Fetch","content":"完整正文🙂","unknown":{"number":2.50}}\n';
const event=kind=>order.push({index:order.length,kind});
const report={status:'running',case:'web-body-final-flush-backup',order,realBusinessCalls:{model:0,web:0,qq:0}};
let role,home,toolSignal,wireSignal,canonicalFinals=0,toolBodies=0,copyEntries=0,heldFlush=false,stopped=false,failure;
const save=()=>writeFile(join(run,'web-backup-result.json'),JSON.stringify(report,null,2)+'\n');
const server=createServer(async(req,res)=>{
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 wire.push({path:req.url,body:JSON.parse(Buffer.concat(chunks).toString()),bearerMatches:req.headers.authorization==='Bearer synthetic-fixture-only'});event('actual-http');
 res.setHeader('content-type','application/json');res.write(raw.slice(0,16));await bodyGate.promise;res.end(raw.slice(16));
});server.listen(0,'127.0.0.1');await once(server,'listening');
const frames=[{type:'message_start',message:{id:'web-backup-step',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_web_backup',name:'role_web_fetch',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:'{"url":"https://example.com/backup"}'}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];
const {ctx,module,entries,metadataEntries,shutdown}=await bootNativeFixture(run,entry=>{
 event('actual-model-'+entry.ordinal);
 return entry.ordinal===1?new Response(frames.map(frame=>`event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}}):response('停止后不能发起后继模型');
},{globalCompaction:false});
try{
 const {createRoleHome,openRoleHome,verifyRoleBackup}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
 ctx.on('tools/execute',async(exec,next)=>{if(exec.name!=='role_web_fetch')return next();toolBodies++;toolSignal=exec.signal;const value=await next();event('real-observation-returned-final-held');finalReached.resolve();await finalGate.promise;return value;});
 ctx.on('tools/result',exec=>{if(exec.name==='role_web_fetch'){canonicalFinals++;event('canonical-final');}});
 ctx.on('agent/status',({agent,status})=>{if(status==='idle')idle.add(agent.session);});
 ctx.on('session/event',(session,message)=>{if(message.type==='tool/result')nativeResults.add(session);});
 ctx.on('session/flush',async session=>{if(heldFlush||!idle.has(session)||!nativeResults.has(session))return;heldFlush=true;event('required-flush-held');flushReached.resolve();await flushGate.promise;event('required-flush-released');});
 home=await createRoleHome(source,{operationId:'web-backup-create44',core:'网页正文不能提升权限',settings:{inputLimitBytes:32768}},{barrier:async stage=>{
  if(stage==='before-backup-file'&&copyEntries++===0){event('copy-first-file-held');copyReached.resolve();await copyGate.promise;}
 }});
 const port={async post(endpoint,body,secret,signal){
  assert.equal(endpoint,'https://api.deepseek.com/v1/tools/fetch');wireSignal=signal;
  const value=await fetch(`http://127.0.0.1:${server.address().port}/v1/tools/fetch`,{method:'POST',headers:{authorization:'Bearer '+secret,'content-type':'application/json'},body:JSON.stringify(body),redirect:'manual',signal});
  const stream=value.body.pipeThrough(new TransformStream({transform(chunk,controller){controller.enqueue(chunk);event('actual-body-delivered');bodyReached.resolve();}}));
  return new Response(stream,{status:value.status,headers:value.headers});
 }};
 const native=await createNativeExecution(ctx,undefined,port),dispose=native.dispose.bind(native);
 native.dispose=async()=>{await assert.rejects(access(join(source,'writer.lock')),{code:'ENOENT'});await dispose();event('native-disposed-after-home');};
 role=await startRole(home,{execution:native});role.lifetime.stopped.then(()=>{stopped=true;event('actual-role-stopped');});report.roleId=home.roleId;
 await role.runtime.receive(bound(home.roleId,'web-backup44'));await bodyReached.promise;
 const request={operationId:'web-backup-owner44',destination};report.request=request;report.receipt=await role.owner.requestBackup(request);event('backup-request-returned');
 assert.equal(report.receipt.phase,'stopping');assert.equal((await role.runtime.receive(bound(home.roleId,'after-web-backup44'))).kind,'rejected');
 assert.equal(wireSignal.aborted,false);assert.equal(toolSignal.aborted,false);assert.equal(copyEntries,0);assert.equal(canonicalFinals,0);await access(join(source,'writer.lock'));
 report.heldBody={operation:await role.owner.readBackup(request.operationId),conversation:await home.readConversation(),wireSignalAborted:wireSignal.aborted,toolSignalAborted:toolSignal.aborted};await save();
 assert.equal(report.heldBody.conversation.attempts.find(attempt=>attempt.kind==='web').outcome,undefined);
 bodyGate.resolve();await finalReached.promise;
 report.heldFinal={operation:await role.owner.readBackup(request.operationId),conversation:await home.readConversation(),wireSignalAborted:wireSignal.aborted,toolSignalAborted:toolSignal.aborted};await save();
 assert.equal(report.heldFinal.operation.phase,'stopping');assert.equal(copyEntries,0);assert.equal(canonicalFinals,0);assert.equal(stopped,false);assert.equal(toolSignal.aborted,false);
 const web=report.heldFinal.conversation.attempts.find(attempt=>attempt.kind==='web'),tool=report.heldFinal.conversation.attempts.find(attempt=>attempt.kind==='tool');
 assert.equal(Buffer.from(web.outcome.data.rawBase64,'base64').toString(),raw);assert.equal(tool.observation.value.markdown,'完整正文🙂');assert.equal(tool.outcome,undefined);
 finalGate.resolve();await flushReached.promise;report.heldFlush=await role.owner.readBackup(request.operationId);assert.equal(report.heldFlush.phase,'stopping');assert.equal(stopped,false);assert.equal(copyEntries,0);assert.equal(canonicalFinals,1);await access(join(source,'writer.lock'));await save();
 flushGate.resolve();await copyReached.promise;report.heldCopy=await role.owner.readBackup(request.operationId);
 assert.equal(report.heldCopy.phase,'copying');assert.equal(stopped,true);await assert.rejects(access(join(source,'writer.lock')),{code:'ENOENT'});await access(join(source,'.maintenance.lock'));
 await assert.rejects(openRoleHome(source),error=>error.code==='HOME_BUSY');
 assert(order.findIndex(entry=>entry.kind==='native-disposed-after-home')<order.findIndex(entry=>entry.kind==='copy-first-file-held'));
 copyGate.resolve();report.verified=await waitFor(async()=>{const value=await role.owner.readBackup(request.operationId);if(['failed','uncertain'].includes(value.phase))throw Error(JSON.stringify(value));return value.phase==='verified-restorable'?value:undefined;});
 await waitFor(async()=>{try{await access(join(source,'.maintenance.lock'));return false;}catch(error){if(error.code==='ENOENT')return true;throw error;}});
 const checked=await verifyRoleBackup(destination,{expectedRoleId:home.roleId,operationId:request.operationId});assert.equal(checked.sourceRevision,report.verified.sourceRevision);
 const child=spawnSync(process.execPath,[new URL('./backup-native-read-worker.mjs',import.meta.url).pathname,destination,home.roleId],{encoding:'utf8',env:{PATH:process.env.PATH},timeout:15000});
 report.freshProcess={exitCode:child.status,signal:child.signal,error:child.error?.message??null};assert.equal(child.error,undefined,child.stderr);assert.equal(child.status,0,child.stderr);report.freshRead=JSON.parse(child.stdout.trim());
 const saved=report.freshRead.conversation,savedTool=saved.attempts.find(attempt=>attempt.kind==='tool'),savedWeb=saved.attempts.find(attempt=>attempt.kind==='web');
 assert.equal(saved.attempts.length,3);assert.equal(Buffer.from(savedWeb.outcome.data.rawBase64,'base64').toString(),raw);assert.deepEqual(savedTool.outcome.data.result.final.value,savedTool.observation.value);assert.equal(savedTool.outcome.data.result.final.isError,false);assert.equal(savedWeb.webOperation.parentAttemptId,savedTool.attemptId);assert.deepEqual(savedWeb.webOperation,web.webOperation);assert.equal(saved.webRules.value.toolTimeoutMs,45000);
 assert.equal(entries.length,1);assert.equal(wire.length,1);assert.equal(toolBodies,1);assert.equal(canonicalFinals,1);assert.equal(metadataEntries.length,0);assert.deepEqual(wire[0],{path:'/v1/tools/fetch',body:{url:'https://example.com/backup'},bearerMatches:true});
 Object.assign(report,{status:'passed',actualModels:entries.length,actualHttp:wire.length,actualToolBodies:toolBodies,canonicalFinals,metadata:metadataEntries.length,roleStopped:stopped,sourceWriterReleased:true,sourceMaintenanceReleased:true,wire});
}catch(error){failure=error;Object.assign(report,{status:'failed',error:{code:error.code??null,message:error.message,stack:error.stack},actualModels:entries.length,actualHttp:wire.length,canonicalFinals});await save();}
finally{
 bodyGate.resolve();finalGate.resolve();flushGate.resolve();copyGate.resolve();
 const timer=setTimeout(()=>{process.exit(2);},8000);
 try{role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;else if(home)await home.close();await shutdown.shutdown(0);await new Promise(resolve=>server.close(resolve));report.hostStopped=true;await save();}finally{clearTimeout(timer);}
}
if(failure){console.error('Web lifecycle and consistent backup tracer failed',failure);process.exitCode=2;}
