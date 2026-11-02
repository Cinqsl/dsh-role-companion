import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,writeFile} from 'node:fs/promises';
import {bootNativeFixture,response,waitFor,bound} from './native-fixture.mjs';
const root=process.env.DSH_TEST_RUN;
assert(root,'DSH_TEST_RUN required');
const fact='事实。\n',trimmed='事实。';
let role,home,issued=false;
const report={case:'direct-user-report-trailing-whitespace',status:'running',realBusinessCalls:{model:0,web:0,qq:0}};
function tool(value){const frames=[{type:'message_start',message:{id:'trailing-report',model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_trailing',name:'role_propose',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify(value)}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(frames.map(frame=>`event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
const fixture=await bootNativeFixture(root,entry=>{
 if(issued)return response('受控记录已处理。');
 const description=entry.body.tools.find(tool=>tool.name==='role_read').description,grants=JSON.parse(description.slice(description.indexOf('{'))),inputId=grants.inputs[0].inputId;
 issued=true;return tool({kind:'memory',topic:'尾随空白合成事实',expectedVersion:0,text:trimmed,statement:'user-report',sources:[{ref:{kind:'input',id:inputId},quote:fact}],scope:'合成完整用户原话',reason:'模型逐字摘录但去掉结尾换行'});
},{globalCompaction:false});
try{
 const {createRoleHome}=await fixture.module('dsh-role-companion/home'),{startRole}=await fixture.module('dsh-role-companion/runtime'),{createNativeExecution}=await fixture.module('dsh-role-companion');
 home=await createRoleHome(join(root,'role'),{operationId:'trailing-create',core:'合成角色按完整用户原话记录。',settings:{inputLimitBytes:32768}});role=await startRole(home,{execution:await createNativeExecution(fixture.ctx)});
 const input=await role.runtime.receive({...bound(home.roleId,'trailing-input'),text:fact});await waitFor(async()=>(await home.readSnapshot()).inputs.find(item=>item.inputId===input.inputId)?.status==='resolved');
 let record;await waitFor(async()=>{const versions=(await role.owner.readKnowledge()).versions;record=versions[0];return !!record;});
 assert.equal(record.text,trimmed);assert.equal(record.sources[0].quote,fact);const proposals=(await role.owner.readKnowledge()).proposals;assert.equal(proposals.length,1);assert.equal(proposals[0].processing.status,'adopted');assert.equal(proposals[0].processing.reason,'EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH');assert.equal(proposals[0].processing.knowledgeId,record.knowledgeId);
 report.result={knowledgeId:record.knowledgeId,version:record.version,text:record.text,quote:proposals[0].value.sources[0].quote,processing:proposals[0].processing};report.status='passed';
}catch(error){report.error={name:error.name,code:error.code??null,message:error.message};throw error;}
finally{role?.lifetime.requestStop('unload');if(role)await role.lifetime.stopped;await fixture.shutdown.shutdown(0);for(const name of ['writer.lock','.maintenance.lock'])await assert.rejects(access(join(root,'role',name)),{code:'ENOENT'});Object.assign(report,{controlledNativeModels:fixture.entries.length,metadata:fixture.metadataEntries.length,roleStopped:true,hostStopped:true,locksReleased:true});await writeFile(join(root,'direct-user-report-trailing.json'),JSON.stringify(report,null,2)+'\n');}
