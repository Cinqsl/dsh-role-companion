import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {bootNativeFixture,response,waitFor,bound,withNativeScope} from './native-fixture.mjs';

const run=process.env.DSH_TEST_RUN,homePath=join(run,'role'),stopId='owner-stop-close-once';
const events=[];const event=(kind,data={})=>events.push({index:events.length,kind,...data});
let realHome,role,reopened,closeAttempts=0,realCloseCalls=0,readers=0,bodies=0,notifications=0,disposeCalls=0,roleStopped=false,hostStopped=false,failure;
const evidence={case:'37-owner-stop-Home-close-once-rejected',status:'running',realBusinessCalls:0,events};
function tools(){const frames=[{type:'message_start',message:{id:'close-fault-tool',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_close_fault',name:'role_read',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({source:'core',offset:0,limit:100})}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(frames.map(value=>`event: ${value.type}\ndata: ${JSON.stringify(value)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
const {ctx,module,entries,shutdown}=await bootNativeFixture(run,entry=>entry.ordinal===1?tools():response('停止前已完整完成的回复'));
const {createRoleHome,openRoleHome}=await module('dsh-role-companion/home'),{startRole}=await module('dsh-role-companion/runtime'),{createNativeExecution}=await module('dsh-role-companion');
try{
  ctx.on('tools/execute',async(exec,next)=>{if(exec.name==='role_read'){bodies++;event('actual-sdk-body');}return next();});
  ctx.on('tools/result',exec=>{if(exec.name==='role_read'){notifications++;event('actual-canonical-final');}});
  realHome=await createRoleHome(homePath,{operationId:'close-fault-create',core:'真实Home关闭失败不允许提前撤掉记录能力',settings:{inputLimitBytes:32768}});
  // A public capability decorator: every method delegates with the real Home as
  // its receiver. Only the first close is rejected before invoking real close.
  const home=new Proxy(realHome,{get(target,key){
    if(key==='close')return async()=>{closeAttempts++;event('home-close-enter',{attempt:closeAttempts});if(closeAttempts===1){event('home-close-rejected');throw Object.assign(Error('Synthetic first Home.close refusal'),{code:'FIXTURE_HOME_CLOSE_ONCE'});}realCloseCalls++;await target.close();event('real-home-close-complete');};
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});
  const native=await createNativeExecution(ctx),execution=withNativeScope(native,(scope,plan)=>{evidence.runId=plan.turn.runId;evidence.inputIds=plan.turn.inputIds;return Object.freeze({...scope,roleRead:Object.freeze({...scope.roleRead,read(request){readers++;event('actual-reader');return scope.roleRead.read(request);}})});});
  execution.dispose=async()=>{disposeCalls++;await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');event('native-dispose-after-home-release');await native.dispose();};
  role=await startRole(home,{execution});role.lifetime.stopped.then(()=>{roleStopped=true;event('role-stopped');});
  await role.runtime.receive(bound(home.roleId,'close-fault'));await waitFor(async()=>(await role.runtime.inspect()).home?.inputSummary.resolved===1);
  const before=await realHome.readConversation();assert.equal(entries.length,2);assert.equal(readers,1);assert.equal(bodies,1);assert.equal(notifications,1);
  const receipt=await role.owner.stop({operationId:stopId});assert.equal(receipt.kind,'committed');
  const blocked=await waitFor(async()=>{const value=await role.owner.readOperation(stopId);return value.stop?.phase==='blocked'?value:undefined;});
  assert.equal(blocked.stop.error,'FIXTURE_HOME_CLOSE_ONCE');assert.equal(blocked.stop.checkpoint,'ready-to-close');assert.equal(roleStopped,false);assert.equal(disposeCalls,0);assert.equal(closeAttempts,1);assert.equal(realCloseCalls,0);
  await access(join(homePath,'writer.lock'));await realHome.readSnapshot();
  const checkpoint=await realHome.readOperation(stopId);assert.equal(checkpoint.stop.checkpoint,'ready-to-close');assert.equal(checkpoint.stop.phase,'unverified','durable checkpoint is not actual stopped');
  const rejected=await role.runtime.receive(bound(home.roleId,'after-close-fault'));assert.equal(rejected.kind,'rejected');
  event('blocked-checkpoint-retains-lock-and-recording');
  const repaired=await role.owner.retryArchives();assert.equal(repaired.pending,0);await role.lifetime.stopped;
  const stopped=await role.owner.readOperation(stopId);assert.equal(stopped.stop.phase,'stopped');
  assert.equal(closeAttempts,2);assert.equal(realCloseCalls,1);assert.equal(disposeCalls,1);assert.equal(entries.length,2);assert.equal(readers,1);assert.equal(bodies,1);assert.equal(notifications,1);
  await assert.rejects(access(join(homePath,'writer.lock')),error=>error.code==='ENOENT');
  reopened=await openRoleHome(homePath);const after=await reopened.readConversation();assert.deepEqual(after.attempts,before.attempts);assert.deepEqual(after.replies,before.replies);
  const persisted=await reopened.readOperation(stopId);assert.equal(persisted.stop.checkpoint,'ready-to-close');assert.equal(persisted.stop.phase,'unverified');await reopened.close();reopened=undefined;
  await shutdown.shutdown(0);hostStopped=true;
  const at=kind=>events.find(value=>value.kind===kind)?.index;
  assert(at('home-close-rejected')<at('blocked-checkpoint-retains-lock-and-recording'));
  assert(at('blocked-checkpoint-retains-lock-and-recording')<at('real-home-close-complete'));
  assert(at('real-home-close-complete')<at('native-dispose-after-home-release'));
  assert(at('native-dispose-after-home-release')<at('role-stopped'));
  Object.assign(evidence,{status:'passed',roleId:home.roleId,revision:after.revision,attemptIds:after.attempts.map(attempt=>attempt.attemptId),stopId,receipt,blocked,checkpoint,stopped,persisted,closeAttempts,realCloseCalls,disposeCalls,actualModels:entries.length,actualReaders:readers,actualSDKBodies:bodies,canonicalNotifications:notifications,roleStopped,hostStopped,lockReleased:true,publicReopen:true});
}catch(error){failure=error;Object.assign(evidence,{status:'failed',error:{message:error.message,code:error.code??null,stack:error.stack},closeAttempts,realCloseCalls,disposeCalls,actualModels:entries.length,actualReaders:readers,canonicalNotifications:notifications,roleStopped,hostStopped});}
finally{
  const timer=setTimeout(()=>{writeFileSync(join(run,'owner-stop-close-fault-result.json'),JSON.stringify({...evidence,cleanup:'bounded-failure-not-stopped'},null,2)+'\n');process.exit(2);},8000);
  try{if(reopened)await reopened.close();if(role&&!roleStopped){role.lifetime.requestStop('unload');await role.lifetime.stopped;}else if(!role&&realHome)await realHome.close();if(!hostStopped){await shutdown.shutdown(0);hostStopped=true;}evidence.hostStopped=hostStopped;await writeFile(join(run,'owner-stop-close-fault-result.json'),JSON.stringify(evidence,null,2)+'\n');}finally{clearTimeout(timer);}
}
if(failure){console.error('Public Home.close fault tracer failed',failure);process.exitCode=2;}
else console.log('Home.close refusal stayed blocked/locked; original close repaired without repeating Native business.');
