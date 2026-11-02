import {openRoleHome} from 'dsh-role-companion/home';
import {access} from 'node:fs/promises';
import {join} from 'node:path';
const [path,roleId,inputId]=process.argv.slice(2),home=await openRoleHome(path,{expectedRoleId:roleId}),reader=await home.openContextReader({purpose:'management'}),sources=await reader.list(),source=await reader.read({kind:'input',id:inputId}),state=await home.readConversation();
const inputs=(await home.readSnapshot()).inputs;const report={inputs,basis:reader.basis,sources,source,budget:state.userBudget,runtimeStarted:false,modelOrHttpEntries:0};await home.close();for(const lock of ['writer.lock','.maintenance.lock'])await access(join(path,lock)).then(()=>{throw Error('lock retained');},error=>{if(error.code!=='ENOENT')throw error;});console.log(JSON.stringify({...report,locksReleased:true}));
