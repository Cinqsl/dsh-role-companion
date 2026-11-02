import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
const [action,path]=process.argv.slice(2);
const request={operationId:'process-create',core:'跨进程核心',settings:{inputLimitBytes:32768}};
const emit=value=>process.stdout.write(JSON.stringify(value)+'\n');
try{
 let held;
 const io={barrier:async(stage,detail)=>{if((action==='crash-initial'&&stage==='before-commit-publish'&&detail.operationId==='process-create')||(action==='crash-lock'&&stage==='after-lock-publish')||(action==='crash-identity'&&stage==='after-identity-publish')||(action==='crash-edit'&&stage==='after-commit-publish'&&detail.operationId==='process-edit')){emit({stage:'published',boundary:stage,revision:detail.revision});await new Promise(()=>{held=setInterval(()=>{},1000);});}}};
 const home=(action==='create'||action==='crash-identity'||action==='crash-initial')?await createRoleHome(path,request,io):await openRoleHome(path,{io});
 const role=await startRole(home,{});
 // Startup stop reconciliation is a real Home write; wait through its public repair boundary before taking an optimistic edit revision.
 if(action==='crash-edit')await role.owner.retryArchives();
 if(action==='crash-edit')await role.owner.apply({kind:'edit-core',operationId:'process-edit',text:'中断后的已发布核心',expectedCoreVersion:1,expectedRevision:(await home.readSnapshot()).revision});
 emit({stage:'opened',view:await role.runtime.inspect(),operation:await role.owner.readOperation('process-edit')});
 held=setInterval(()=>{},1000);
 process.stdin.once('data',async()=>{clearInterval(held);role.lifetime.requestStop('unload');await role.lifetime.stopped;process.exit(0);});
}catch(error){emit({stage:'rejected',code:error.code||'ERROR'});process.exit(0);}
