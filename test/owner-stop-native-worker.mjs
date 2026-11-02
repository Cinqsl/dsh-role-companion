import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';
const run=process.env.DSH_TEST_RUN;
const defer=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:()=>resolve()};};
const finalGate=defer(),finalReached=defer(),flushGate=defer(),flushReached=defer(),order=[];
let role,home,signal,readers=0,notifications=0,flushHeld=false,stopped=false,failure;
const idle=new Set(),results=new Set(),evidence={case:'owner-stop-final-flush',status:'running',realBusinessCalls:0,order};
function toolResponse(){const frames=[{type:'message_start',message:{id:'stop-read',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_stop_read',name:'role_read',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset:0,limit:100})}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(frames.map(v=>`event: ${v.type}\ndata: ${JSON.stringify(v)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
const {ctx,module,entries,shutdown}=await bootNativeFixture(run,entry=>entry.ordinal===1?toolResponse():response('停止后不得发起模型'));
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
try{
 ctx.on('tools/result',exec=>{if(exec.name==='role_read'){notifications++;signal=exec.signal;order.push('actual-sdk-final');}});
 ctx.on('agent/status',({agent,status})=>{if(status==='idle'){idle.add(agent.session);order.push('actual-native-idle');}});
 ctx.on('session/event',(session,event)=>{if(event.type==='tool/result')results.add(session);});
 ctx.on('session/flush',async session=>{if(!flushHeld&&idle.has(session)&&results.has(session)){flushHeld=true;order.push('required-flush-held');flushReached.resolve();await flushGate.promise;order.push('required-flush-released');}});
 home=await createRoleHome(join(run,'role'),{operationId:'held-stop-create',core:'停止必须保留原始工具结果',settings:{inputLimitBytes:32768}},{barrier:async(stage,detail)=>{if(stage==='before-commit-publish'&&detail.operationId.startsWith('tool-final-')){order.push('home-final-held');finalReached.resolve();await finalGate.promise;order.push('home-final-released');}}});
 evidence.roleId=home.roleId;
 const native=await createNativeExecution(ctx),execution=withNativeScope(native,(scope,plan)=>{evidence.runId=plan.turn.runId;evidence.inputIds=plan.turn.inputIds;return Object.freeze({...scope,roleRead:Object.freeze({...scope.roleRead,read(request){readers++;order.push('actual-reader');return scope.roleRead.read(request);}})});});
 execution.dispose=async()=>{await assert.rejects(access(join(run,'role/writer.lock')),error=>error.code==='ENOENT');order.push('native-observer-dispose-after-home-release');await native.dispose();order.push('native-observer-disposed');};
 role=await startRole(home,{execution});role.lifetime.stopped.then(()=>{stopped=true;order.push('actual-role-stopped');});
 await role.runtime.receive(bound(home.roleId,'held-stop'));await finalReached.promise;assert.equal(notifications,1);assert.equal(readers,1);assert.equal(signal.aborted,false);
 const accepting=role.owner.stop({operationId:'held-owner-stop'});await waitFor(async()=>(await role.runtime.inspect()).status==='stopping');
 assert.equal((await role.owner.readOperation('held-owner-stop')).reason,'STOP_COMMIT_PENDING');
 assert.equal((await role.runtime.receive(bound(home.roleId,'after-stop'))).kind,'rejected');assert.equal(signal.aborted,false);assert.equal(stopped,false);await access(join(run,'role/writer.lock'));
 finalGate.resolve();const receipt=await accepting;assert.equal(receipt.kind,'committed');await flushReached.promise;
 const held=await role.owner.readOperation('held-owner-stop');assert.equal(held.stop.checkpoint,'requested');assert.equal(held.stop.phase,'stopping');assert.equal(stopped,false);await access(join(run,'role/writer.lock'));assert.equal(entries.length,1);
 flushGate.resolve();await role.lifetime.stopped;
 const stop=await role.owner.readOperation('held-owner-stop');assert.equal(stop.stop.phase,'stopped');assert.equal(stop.stop.checkpoint,'ready-to-close');
 const reopened=await openRoleHome(join(run,'role')),state=await reopened.readConversation(),tool=state.attempts.find(attempt=>attempt.kind==='tool');
 assert.equal(tool.observation.value.text,'停止必须保留原始工具结果');assert.equal(tool.outcome.data.result.final.value.text,'停止必须保留原始工具结果');assert.equal(tool.outcome.data.result.final.isError,false);await reopened.close();
 assert.equal(readers,1);assert.equal(notifications,1);assert.equal(entries.length,1);
 Object.assign(evidence,{status:'passed',receipt,held,stop,roleId:home.roleId,attemptId:tool.attemptId,runId:tool.runId,actualReaders:readers,canonicalNotifications:notifications,actualModels:entries.length,roleStopped:stopped,lockReleased:true});
}catch(error){failure=error;evidence.status='failed';evidence.error={name:error.name,code:error.code??null,message:error.message};}
finally{finalGate.resolve();flushGate.resolve();if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}else if(home)await home.close();await shutdown.shutdown(0);evidence.hostStopped=true;await writeFile(join(run,'owner-stop-native-result.json'),JSON.stringify(evidence,null,2)+'\n');}
if(failure){console.error('Owner stop held final/flush tracer',failure);process.exitCode=2;}else console.log('Owner stop retains actual final, required flush, Home lock and Native observer order.');
