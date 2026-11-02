import {openRoleHome,verifyRoleBackup} from 'dsh-role-companion/home';
import {join} from 'node:path';
const [destination,roleId]=process.argv.slice(2);
try{
 const verified=await verifyRoleBackup(destination,{expectedRoleId:roleId}),home=await openRoleHome(join(destination,'home'),{expectedRoleId:roleId});
 try{console.log(JSON.stringify({verified,snapshot:await home.readSnapshot(),conversation:await home.readConversation(),runtimeStarted:false}));}finally{await home.close();}
}catch(error){console.error(error);process.exitCode=2;}
