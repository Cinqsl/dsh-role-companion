import assert from 'node:assert/strict';
import {join} from 'node:path';
import {access,readFile,writeFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {bootNativeFixture,waitFor} from './native-fixture.mjs';

const run=process.env.DSH_TEST_RUN,phase=process.argv[2]??'first';
const host=await bootNativeFixture(run,()=>assert.fail('history configuration must not call a model'),{reuse:phase==='fresh',globalCompaction:false});
const {ctx,module,entries,metadataEntries,shutdown}=host;
const {Peer}=await module('@deepseek-ai/dsh-client-connection');
const peer=new Peer(ctx,{principal:{kind:'owner'}}),invoke=(method,args)=>ctx.typertGateway.invoke({peer,namespace:'roleCompanion',method,args});
const homePath=join(run,'role'),report={caseId:'42-history-config-'+phase,status:'running',actualModelEntries:0,actualCatalogEntries:0,realBusinessCalls:{model:0,web:0,qq:0}};
let roleId,stopped=false,hostStopped=false,failure;
const fields={enabled:false,endpoint:'',credentialRef:'',maxFrameBytes:1048576,readTimeoutMs:10000,reconnectInitialMs:1000,reconnectMaxMs:60000,jitterRatio:0.2};
try{
 if(phase==='first'){
  const created=await invoke('createHome',{path:homePath,request:{operationId:'history42-config-create',core:'合成历史补查配置角色',settings:{inputLimitBytes:32768}},expectedProfileVersion:0});roleId=created.roleId;report.created=created;
  const before=await invoke('readQQ',{expectedRoleId:roleId,expectedQQBindingVersion:0});report.before=before;
  assert.deepEqual([before.value.historyPageSize,before.value.historyMaxPages,before.value.historyCooldownMs],[50,3,60000]);
  const value={...fields,historyPageSize:7,historyMaxPages:2,historyCooldownMs:12345};
  report.saved=await invoke('editQQConnection',{expectedRoleId:roleId,expectedQQBindingVersion:0,request:{operationId:'history42-config-save',expectedProfileVersion:0,value}});
  assert.equal(report.saved.profileVersion,1);assert.deepEqual([report.saved.value.historyPageSize,report.saved.value.historyMaxPages,report.saved.value.historyCooldownMs],[7,2,12345]);
  report.replayed=await invoke('editQQConnection',{expectedRoleId:roleId,expectedQQBindingVersion:0,request:{operationId:'history42-config-save',expectedProfileVersion:0,value}});assert.equal(report.replayed.profileVersion,1);
  report.legacy=await invoke('editQQConnection',{expectedRoleId:roleId,expectedQQBindingVersion:0,request:{operationId:'history42-config-legacy',expectedProfileVersion:1,value:{...fields,readTimeoutMs:9999}}});
  assert.equal(report.legacy.profileVersion,2);assert.deepEqual([report.legacy.value.historyPageSize,report.legacy.value.historyMaxPages,report.legacy.value.historyCooldownMs],[7,2,12345]);
  const rejected=[];for(const [name,change]of [['unknown',{unknown:true}],['partial',{historyMaxPages:undefined}],['size',{historyPageSize:201}],['pages',{historyMaxPages:0}],['cooldown',{historyCooldownMs:0}]]){
   const candidate={...value,...change};if(name==='partial')delete candidate.historyMaxPages;
   await assert.rejects(invoke('editQQConnection',{expectedRoleId:roleId,expectedQQBindingVersion:0,request:{operationId:'history42-config-invalid-'+name,expectedProfileVersion:2,value:candidate}}),e=>{rejected.push({name,code:e.details?.reason??e.code});return e.details?.reason==='INVALID_QQ_TRANSPORT';});
  }report.rejected=rejected;assert.equal((await invoke('readQQ',{expectedRoleId:roleId,expectedQQBindingVersion:0})).profileVersion,2);
  await writeFile(join(run,'history42-config-marker.json'),JSON.stringify({roleId,version:2,values:report.legacy.value})+'\n');
 }else{
  const marker=JSON.parse(await readFile(join(run,'history42-config-marker.json'),'utf8'));roleId=marker.roleId;
  report.restored=await invoke('readQQ',{expectedRoleId:roleId,expectedQQBindingVersion:0});assert.equal(report.restored.profileVersion,marker.version);assert.deepEqual(report.restored.value,marker.values);
 }
 const operationId='history42-config-stop-'+phase;report.stop=await invoke('stopRole',{expectedRoleId:roleId,expectedBindingVersion:1,request:{operationId}});
 await waitFor(async()=>(await invoke('readStopOperation',{expectedRoleId:roleId,expectedBindingVersion:1,operationId})).stop?.phase==='stopped');stopped=true;
 await assert.rejects(access(join(homePath,'writer.lock')),{code:'ENOENT'});await assert.rejects(access(join(homePath,'.maintenance.lock')),{code:'ENOENT'});
 await shutdown.shutdown(0);hostStopped=true;
 assert.equal(entries.length,0);assert.equal(metadataEntries.length,0);Object.assign(report,{status:'passed',roleId,roleStopped:true,hostStopped:true,locksReleased:true});
}catch(e){failure=e;Object.assign(report,{status:'failed',roleId,error:{code:e.code??null,reason:e.details?.reason??null,message:e.message,stack:e.stack}});}
finally{
 const timeout=setTimeout(()=>{writeFileSync(join(run,'history42-config-'+phase+'.json'),JSON.stringify({...report,cleanup:'bounded-failure-not-stopped'},null,2)+'\n');process.exit(2);},8000);
 try{if(!hostStopped){await shutdown.shutdown(0);hostStopped=true;}report.actualModelEntries=entries.length;report.actualCatalogEntries=metadataEntries.length;report.hostStopped=hostStopped;report.roleStopped=stopped;await writeFile(join(run,'history42-config-'+phase+'.json'),JSON.stringify(report,null,2)+'\n');}finally{clearTimeout(timeout);}
}
if(failure){console.error(failure);process.exitCode=2;}
