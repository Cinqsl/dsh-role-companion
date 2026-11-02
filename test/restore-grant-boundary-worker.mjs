import assert from 'node:assert/strict';
import {join} from 'node:path';
import {writeFile,mkdir,readFile,access as fsAccess} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
import {bootOfficialCliFixture} from './official-cli-fixture.mjs';
import {response} from './native-fixture.mjs';
/** Portable grant survives; the old absolute directory never becomes a machine-local root without an explicit owner mapping. */
const run=process.env.DSH_TEST_RUN,source=join(run,'source'),backup=join(run,'backup'),destination=join(run,'target'),oldExternal=join(run,'old-external'),newExternal=join(run,'new-external');
const grantId='file-grant-55555555-5555-4555-8555-555555555557';
const record={case:'55-restored-grant-does-not-authorize-old-path',status:'recorded',fullAcceptanceCasesPassed:[],realBusinessCalls:{model:0,web:0,qq:0},exits:[],models:0,metadata:0};
let sourceRole,host,failure;
async function wait(read,check){for(let i=0;i<1200;i++){const value=await read();if(check(value))return value;await new Promise(r=>setTimeout(r,10));}assert.fail('restored grant boundary did not settle');}
async function stopHost(){record.models+=host.entries.length;record.metadata+=host.metadataEntries.length;record.exits.push({pid:host.child.pid,models:host.entries.length,metadata:host.metadataEntries.length,...await host.stop()});host=undefined;}
function ask(scopePath,ordinal){const input={op:'readText',scope:'grant:'+grantId,path:scopePath,offset:0,limit:1000},values=[{type:'message_start',message:{id:'restored-grant-'+ordinal,model:'deepseek-flash',usage:{input_tokens:1,output_tokens:1}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'toolu_restored_grant_'+ordinal,name:'role_file',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify(input)}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:1}},{type:'message_stop'}];return new Response(values.map(v=>`event: ${v.type}\ndata: ${JSON.stringify(v)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
const transport=entry=>entry.ordinal===1?ask('original.txt',1):response('旧路径没有得到访问。');
try{
 await mkdir(oldExternal);await writeFile(join(oldExternal,'original.txt'),'旧环境外部目录字节不得经恢复自动授权。\n');record.oldBytes=(await readFile(join(oldExternal,'original.txt'))).length;record.oldDigest=createHash('sha256').update(await readFile(join(oldExternal,'original.txt'))).digest('hex');
 const home=await createRoleHome(source,{operationId:'grant-source55',core:'恢复保留 Home 权限书，但旧绝对路径不自动成为本机根。',settings:{inputLimitBytes:32768}});record.roleId=home.roleId;
 const access=await home.readFileAccess();
 record.portableAccess=await home.applyOwner({kind:'edit-file-access',operationId:'grant-edit55',expectedRevision:home.revision,expectedFileAccessVersion:access.version,value:{...access.value,grants:[{grantId,mode:'read-write'}]}}).then(()=>home.readFileAccess());
 sourceRole=await startRole(home,{});
 await sourceRole.owner.requestHandover({operationId:'grant-outgoing55',destination:backup,expectedRevision:home.revision});
 record.handover=await wait(()=>sourceRole.owner.readHandover('grant-outgoing55'),x=>x.phase==='verified');await sourceRole.lifetime.stopped;sourceRole=undefined;
 host=await bootOfficialCliFixture(run,transport,{profileName:'grant55',captureTransportError:true});
 record.copy=await host.rpc('requestRestore',{request:{operationId:'grant-copy55',backupPath:backup,destination,expectedRoleId:home.roleId,expectedManifestDigest:record.handover.backup.manifestDigest},expectedProfileVersion:0});
 const preview=await host.rpc('inspect');assert.equal(preview.role.status,'read-only');
 record.previewFileAccess=await host.rpc('readFileAccess',{expectedRoleId:home.roleId,expectedBindingVersion:1});
 assert.deepEqual(record.previewFileAccess.value,record.portableAccess.value,'Home authority keeps the portable grant');
 assert.equal(record.previewFileAccess.localMappings.length,1);assert.equal(record.previewFileAccess.localMappings[0].path,null);assert.equal(record.previewFileAccess.localMappings[0].status,'unbound');
 record.confirm={operationId:'grant-confirm55',restoreOperationId:'grant-copy55',handoverId:record.handover.record.handoverId,expectedManifestDigest:record.copy.manifestDigest,expectedRevision:record.copy.sourceRevision,currentSourceStoppedConfirmed:true};
 record.receipt=await host.rpc('confirmRestore',{expectedRoleId:home.roleId,request:record.confirm,expectedRestoreProfileVersion:0});assert.equal(record.receipt.registration,'registered');
 record.ready=await wait(()=>host.rpc('inspect'),view=>view.role.status==='ready');
 record.readyFileAccess=await host.rpc('readFileAccess',{expectedRoleId:home.roleId,expectedBindingVersion:1});
 assert.deepEqual(record.readyFileAccess.value,record.portableAccess.value);assert.deepEqual(record.readyFileAccess.localMappings,record.previewFileAccess.localMappings,'restoration must not invent a machine-local root');
 assert.equal(host.entries.length,0);
 record.firstInput=await host.rpc('submitInput',{request:{operationId:'grant-old-input55',clientRequestId:'grant-old-input55',expectedRoleId:home.roleId,expectedBindingVersion:1,text:'尝试读取旧外部目录。'}});
 record.first=await wait(()=>host.rpc('readConversation',{expectedRoleId:home.roleId,expectedBindingVersion:1}),view=>view.turns[0]?.status==='finished');
 record.firstOutcome={outcome:record.first.turns[0].outcome,reason:record.first.turns[0].reason,toolAttempts:record.first.totalToolAttempts};
 assert.equal(host.entries.length,1);
 assert.equal(record.first.totalToolAttempts,0,'an unbound grant must not issue a tool attempt');
 assert.equal(record.first.turns[0].reason,'FILE_SCOPE_UNAVAILABLE');
 record.deniedObservation=record.first.nativeRecords?.find(row=>row.provenance==='host-denial')?.data??null;
 await stopHost();
 // Explicit owner mapping to a different directory: the new root works, the old absolute path still does not exist as a root.
 await mkdir(newExternal);await writeFile(join(newExternal,'original.txt'),'新环境明确映射后的目录字节。\n');
 host=await bootOfficialCliFixture(run,entry=>entry.ordinal===1?ask('original.txt',2):response('已按新映射读取。'),{profileName:'grant55',reuse:true,captureTransportError:true});
 await wait(()=>host.rpc('inspect'),view=>view.role.status==='ready');
 record.mapping=await host.rpc('editFileMapping',{expectedRoleId:home.roleId,expectedBindingVersion:1,request:{operationId:'grant-map55',grantId,path:newExternal,expectedFileMappingVersion:record.readyFileAccess.mappingVersion,expectedFileAccessVersion:record.readyFileAccess.version}});
 record.mappedLocal=record.mapping.localMappings;assert.equal(record.mapping.localMappings[0].path,newExternal);assert.equal(record.mapping.localMappings[0].status,'bound');
 record.secondInput=await host.rpc('submitInput',{request:{operationId:'grant-new-input55',clientRequestId:'grant-new-input55',expectedRoleId:home.roleId,expectedBindingVersion:1,text:'按新映射读取。'}});
 record.second=await wait(()=>host.rpc('readConversation',{expectedRoleId:home.roleId,expectedBindingVersion:1}),view=>view.turns.length===2&&view.turns[1].status==='finished');
 assert.equal(host.entries.length,2,'the mapped read needs a tool body plus one final model body');
 record.secondOutcome={outcome:record.second.turns[1].outcome,reason:record.second.turns[1].reason,toolAttempts:record.second.totalToolAttempts};
 assert.equal(record.second.turns[1].outcome,'reply','the mapped read completes with a saved reply');
 assert.equal(record.second.totalToolAttempts,1,'explicit mapping must issue exactly one tool attempt');
 const attempt=record.second.attempts.find(row=>row.kind==='tool');
 assert(attempt,'the mapped read must persist a tool attempt');
 record.toolAttempt={attemptId:attempt.attemptId,kind:attempt.kind};
 record.toolReceipt=await host.rpc('readExecutionRecord',{expectedRoleId:home.roleId,expectedBindingVersion:1,request:{kind:'attempt',recordId:attempt.attemptId,offset:0,limit:4000}});
 let text=record.toolReceipt.json;while(record.toolReceipt.more){record.toolReceipt=await host.rpc('readExecutionRecord',{expectedRoleId:home.roleId,expectedBindingVersion:1,request:{kind:'attempt',recordId:attempt.attemptId,offset:Array.from(text).length,limit:4000}});text+=record.toolReceipt.json;}
 record.newBytes=JSON.parse(text).observation.value.text;
 assert.equal(record.newBytes,'新环境明确映射后的目录字节。\n','the mapped directory content must reach the tool result');
 await stopHost();
 assert.deepEqual(await readFile(join(oldExternal,'original.txt')),Buffer.from('旧环境外部目录字节不得经恢复自动授权。\n'),'old external bytes must stay untouched');
 record.writerReleased=await fsAccess(join(destination,'writer.lock')).then(()=>false,error=>error.code==='ENOENT');
 record.status='passed';
}catch(error){failure=error;record.status='failed';record.error={name:error.name,message:error.message,code:error.code??null};}
finally{if(host)await stopHost();if(sourceRole){sourceRole.lifetime.requestStop('unload');await sourceRole.lifetime.stopped;}const disk=await openRoleHome(destination,{expectedRoleId:record.roleId}).catch(()=>undefined);if(disk){record.diskAccess=await disk.readFileAccess();await disk.close();}await writeFile(join(run,'restore-grant-boundary-result.json'),JSON.stringify(record,null,2).replaceAll(run,'<isolated-restore-home>')+'\n');}
if(failure)throw failure;
