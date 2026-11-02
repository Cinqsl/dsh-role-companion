import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {bootNativeFixture,response,waitFor,bound} from './native-fixture.mjs';
const root=process.env.DSH_TEST_RUN,shape=process.argv[2],derived=process.argv[3]??'retain';
assert(root,'DSH_TEST_RUN required');assert(['exact','quote-trimmed','text-trimmed','inner-difference'].includes(shape));assert(['retain','remove'].includes(derived));
// The user's utterance ends with a newline; the model's extract differs only there, except in the exact and negative controls.
const fact='合成逐字自述：下一轮集合地点是栖风台，暗号是 ROUTE_L58。',spoken=fact+'\n',unrelated='合成无关便笺：圆形贴纸 UNRELATED_L58。';
const proposed={exact:{text:spoken,quote:spoken},'quote-trimmed':{text:spoken,quote:fact},'text-trimmed':{text:fact,quote:spoken},'inner-difference':{text:fact.replace('栖风台','栖风 台'),quote:spoken}}[shape];
let role,home,phase='unrelated',issued=false;
const report={case:'lineage-trailing-whitespace-user-report',shape,derived,status:'running',realBusinessCalls:{model:0,web:0,qq:0}};
function tool(value){const frames=[{type:'message_start',message:{id:'lineage-trailing',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_lineage_trailing',name:'role_propose',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify(value)}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(frames.map(frame=>`event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
const fixture=await bootNativeFixture(root,entry=>{
 if(phase!=='report'||issued)return response('受控记录已处理。');issued=true;
 report.reportFrameSawUnrelated=JSON.stringify(entry.body).includes(unrelated);
 const description=entry.body.tools.find(tool=>tool.name==='role_read').description,grants=JSON.parse(description.slice(description.indexOf('{'))),inputId=grants.inputs[0].inputId;
 return tool({kind:'memory',topic:'合成尾随空白自述',expectedVersion:0,text:proposed.text,statement:'user-report',sources:[{ref:{kind:'input',id:inputId},quote:proposed.quote}],scope:'仅完整用户原话',reason:'逐字摘录完整用户原话'});
},{globalCompaction:false});
const settle=async input=>waitFor(async()=>(await home.readSnapshot()).inputs.find(item=>item.inputId===input.inputId)?.status==='resolved');
const listed=async()=>{const reader=await home.openContextReader({purpose:'management'});try{return await reader.list();}finally{reader.revoke();}};
const memory=async id=>(await listed()).find(source=>source.ref.kind==='knowledge'&&source.ref.id===id&&source.current);
const cleanup=async(id,label)=>{const selection={sources:[{kind:'input',id}],derived},preview=await role.owner.previewCleanup(selection),request={kind:'cleanup-sources',operationId:label,selection,expectedRevision:preview.revision,previewDigest:preview.digest};await role.owner.requestCleanup(request);let complete;await waitFor(async()=>{const progress=await role.owner.readCleanup(request.operationId);if(progress.error)throw Error(progress.error);if(progress.phase==='complete'){complete=progress;return true;}});assert(complete.physical.complete);return {preview,complete};};
try{
 const {createRoleHome}=await fixture.module('dsh-role-companion/home'),{startRole}=await fixture.module('dsh-role-companion/runtime'),{createNativeExecution}=await fixture.module('dsh-role-companion');
 home=await createRoleHome(join(root,'role'),{operationId:'lineage-trailing-create',core:'合成角色按完整用户原话记录。',settings:{inputLimitBytes:32768}});role=await startRole(home,{execution:await createNativeExecution(fixture.ctx)});
 const other=await role.runtime.receive({...bound(home.roleId,'lineage-unrelated'),text:unrelated});await settle(other);
 phase='report';const input=await role.runtime.receive({...bound(home.roleId,'lineage-report'),text:spoken});await settle(input);phase='done';
 assert.equal(report.reportFrameSawUnrelated,true,'the proposing run frame must really carry the unrelated earlier source');
 let proposal;await waitFor(async()=>{proposal=(await role.owner.readKnowledge()).proposals[0];return !!proposal?.processing;});report.processing=proposal.processing;
 if(shape==='inner-difference'){
  assert.equal(proposal.processing.status,'pending-review');assert.equal(proposal.processing.reason,'SEMANTIC_REVIEW_REQUIRED');assert.equal((await role.owner.readKnowledge()).versions.length,0);
  report.unrelatedCleanup=await cleanup(other.inputId,'lineage-unrelated-cleanup');assert.equal((await role.owner.readKnowledge()).versions.length,0);assert(!(await listed()).some(source=>source.ref.kind==='knowledge'),'a non-trailing difference never becomes daily knowledge');
  report.status='passed';
 }else{
  assert.equal(proposal.processing.status,'adopted');assert.equal(proposal.processing.reason,'EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH');
  const knowledgeId=proposal.processing.knowledgeId,record=(await role.owner.readKnowledge()).versions.find(version=>version.knowledgeId===knowledgeId);assert.equal(record.text,proposed.text);assert.equal(record.sources[0].quote,proposed.quote);assert.equal(record.sources[0].ref.id,input.inputId);
  assert.equal((await memory(knowledgeId)).availableForDaily,true,'adopted user report is usable before any cleanup');
  report.unrelatedCleanup=await cleanup(other.inputId,'lineage-unrelated-cleanup');report.unrelatedCleanupKnowledgeEffects=report.unrelatedCleanup.preview.effects.filter(effect=>effect.kind==='knowledge'||effect.kind==='proposal');
  assert.equal((await home.readSnapshot()).inputs.find(item=>item.inputId===other.inputId).text,'');
  report.afterUnrelatedCleanup={availableForDaily:(await memory(knowledgeId))?.availableForDaily,text:(await role.owner.readKnowledge()).versions.find(version=>version.knowledgeId===knowledgeId).text};
  assert.equal(report.afterUnrelatedCleanup.availableForDaily,true,'cleaning an unrelated source seen by the proposing run must not revoke an independent user report');
  assert.equal(report.afterUnrelatedCleanup.text,proposed.text);assert(!report.unrelatedCleanup.preview.effects.some(effect=>effect.kind==='knowledge'&&effect.id===knowledgeId),'cleanup preview must not list the independent memory');
  // The memory still rests on its own utterance: a cleaned tombstone is not the same text.
  report.ownSourceCleanup=await cleanup(input.inputId,'lineage-own-source-cleanup');assert.equal((await memory(knowledgeId))?.availableForDaily??false,false,'cleaning the memory\'s own source still revokes it');
  report.status='passed';
 }
}catch(error){report.error={name:error.name,code:error.code??null,message:error.message};throw error;}
finally{role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;await fixture.shutdown.shutdown(0);for(const name of ['writer.lock','.maintenance.lock'])await assert.rejects(access(join(root,'role',name)),{code:'ENOENT'});Object.assign(report,{controlledNativeModels:fixture.entries.length,metadata:fixture.metadataEntries.length,roleStopped:true,hostStopped:true,locksReleased:true});await writeFile(join(root,'lineage-trailing-user-report.json'),JSON.stringify(report,null,2)+'\n');}
