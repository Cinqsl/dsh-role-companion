import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {bootNativeFixture,response,waitFor,bound} from './native-fixture.mjs';
import {selectCurrentTopicCleanup} from '../scripts/58-next-memory-cleanup-selection.mjs';
const root=process.env.DSH_TEST_RUN;
assert(root,'DSH_TEST_RUN required');
const oldFact='旧确认：集合地点是映月桥，暗号是 ROUTE_C58。';
const confirmation='新的独立确认：下一轮集合地点是栖风台，暗号是 ROUTE_E58。请把本条原话作为新的独立来源，更新已有这项记忆。';
const replyText='受控机制记录已处理。';
const report={case:'stale-source-referencing-instruction-cleanup',status:'running',realBusinessCalls:{model:0,web:0,qq:0}};
let role,home,phase=0,issued=false,knowledgeId,oldSource,stale,confirmationRequest;
function tool(value){const frames=[{type:'message_start',message:{id:'stale-instruction',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_stale_'+phase,name:'role_propose',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify(value)}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(frames.map(frame=>`event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
const fixture=await bootNativeFixture(root,entry=>{
 if(phase===2&&!issued)confirmationRequest=entry.body;
 if(![0,2].includes(phase)||issued)return response(replyText);
 const description=entry.body.tools.find(tool=>tool.name==='role_read').description,grants=JSON.parse(description.slice(description.indexOf('{'))),inputId=grants.inputs[0].inputId;
 if(phase===0){issued=true;return tool({kind:'memory',topic:'合成散步测试',expectedVersion:0,text:oldFact,statement:'user-report',sources:[{ref:{kind:'input',id:inputId},quote:oldFact}],scope:'合成旧确认',reason:'独立完整旧原话'});}
 issued=true;return tool({kind:'memory',topic:'合成散步测试',targetId:knowledgeId,expectedVersion:1,text:confirmation,statement:'user-report',sources:[{ref:{kind:'input',id:inputId},quote:confirmation}],scope:'合成新确认',reason:'独立完整新原话，旧来源已清理'});
},{globalCompaction:false});
const settle=async input=>waitFor(async()=>(await home.readSnapshot()).inputs.find(item=>item.inputId===input.inputId)?.status==='resolved');
const versions=async()=>(await role.owner.readKnowledge()).versions;
try{
 const {createRoleHome}=await fixture.module('dsh-role-companion/home'),{startRole}=await fixture.module('dsh-role-companion/runtime'),{createNativeExecution}=await fixture.module('dsh-role-companion');
 home=await createRoleHome(join(root,'role'),{operationId:'stale-create',core:'合成角色严格区分历史资料与当前指令。',settings:{inputLimitBytes:32768}});role=await startRole(home,{execution:await createNativeExecution(fixture.ctx)});
 oldSource=await role.runtime.receive({...bound(home.roleId,'stale-old-source'),text:oldFact});await settle(oldSource);await waitFor(async()=>(await versions()).length===1);
 knowledgeId=(await versions())[0].knowledgeId;
 stale=await role.runtime.receive({...bound(home.roleId,'stale-instruction'),text:`旧操作指令：请核对上一条新的独立确认 ${oldSource.inputId}，并通过 role_read 读取完整原文；targetId 为 ${knowledgeId}，expectedVersion 为 4。`});await settle(stale);
 const selected=selectCurrentTopicCleanup(await home.readSnapshot().then(snapshot=>snapshot.inputs),await versions(),{includeReferencedInstructions:true});
 assert(selected.selection.sources.some(ref=>ref.id===oldSource.inputId),'old source must be selected');
 assert(selected.selection.sources.some(ref=>ref.id===stale.inputId),'stale source-referencing instruction must be selected');
 const preview=await role.owner.previewCleanup(selected.selection),request={kind:'cleanup-sources',operationId:'stale-instruction-cleanup',selection:selected.selection,expectedRevision:preview.revision,previewDigest:preview.digest};
 await role.owner.requestCleanup(request);let complete;await waitFor(async()=>{const progress=await role.owner.readCleanup(request.operationId);if(progress.error)throw Error(progress.error);if(progress.phase==='complete'){complete=progress;return true;}});assert(complete.physical.complete);
 report.cleanup={selection:selected.selection,effects:preview.effects.filter(effect=>(effect.kind==='input'&&[oldSource.inputId,stale.inputId].includes(effect.id))||(effect.kind==='knowledge'&&effect.id===knowledgeId)),physical:complete.physical};
 role.lifetime.requestStop('unload');await role.lifetime.stopped;
 const {openRoleHome}=await fixture.module('dsh-role-companion/home');home=await openRoleHome(join(root,'role'));role=await startRole(home,{execution:await createNativeExecution(fixture.ctx)});
 phase=2;issued=false;const current=await role.runtime.receive({...bound(home.roleId,'stale-new-confirmation'),text:confirmation});await settle(current);await waitFor(async()=>{const latest=(await versions()).at(-1);return latest?.version===2&&latest.text===confirmation;});
 assert(confirmationRequest,'actual post-cleanup Native request required');
 const body=JSON.stringify(confirmationRequest);
 assert(!body.includes('旧操作指令'),'stale instruction must not reach the post-cleanup model request');
 assert(!body.includes(oldFact),'cleaned old source text must not reach the post-cleanup model request');
 assert(body.includes(confirmation),'current confirmation must reach the model request');
 const latest=(await versions()).at(-1);assert.equal(latest.knowledgeId,knowledgeId);assert.equal(latest.version,2);assert.equal(latest.text,confirmation);assert.equal(latest.sources[0].ref.id,current.inputId);
 report.postCleanupRequest={staleInstructionAbsent:true,oldSourceAbsent:true,currentConfirmationPresent:true};report.newVersion={knowledgeId,version:latest.version,sourceInputId:current.inputId};report.status='passed';
}catch(error){report.error={name:error.name,code:error.code??null,message:error.message};throw error;}
finally{role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;await fixture.shutdown.shutdown(0);for(const name of ['writer.lock','.maintenance.lock'])await assert.rejects(access(join(root,'role',name)),{code:'ENOENT'});Object.assign(report,{controlledNativeModels:fixture.entries.length,metadata:fixture.metadataEntries.length,roleStopped:true,hostStopped:true,locksReleased:true});await writeFile(join(root,'stale-instruction-cleanup.json'),JSON.stringify(report,null,2)+'\n');}
