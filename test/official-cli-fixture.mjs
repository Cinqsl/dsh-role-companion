import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import {spawn,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {stageFixturePackage} from './stage-fixture-package.mjs';

const development=createRequire(new URL('../package.json',import.meta.url));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
/** The real published CLI owns argv and overlays. Only its official HTTP transport is synthetic. */
export async function bootOfficialCliFixture(run,transport,{execArgs=[],cliArguments=[],bootstrap,bootstrapFromDocument=false,additionalPatches=[],beforeBoot,reuse=false,reuseProfile=false,installPackage,profileName='files43',captureTransportError=false}={}){
 reuse ||= reuseProfile;
 const profile=join(run,'home/profiles',profileName);
 const {initProfile}=await import(pathToFileURL(development.resolve('@deepseek-ai/dsh-app-boot')).href);
 if(!reuse)initProfile(profile,['@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app','dsh-role-companion']);
 if(installPackage){
  const manifest=JSON.parse(await readFile(join(profile,'package.json'),'utf8'));manifest.dependencies['@deepseek-ai/dsh']='0.2.1-rc.3';await writeFile(join(profile,'package.json'),JSON.stringify(manifest,null,2)+'\n');
  const npmCache=process.env.npm_config_cache||execFileSync('npm',['config','get','cache'],{encoding:'utf8'}).trim();
  execFileSync('npm',['install',installPackage,'--prefer-offline','--ignore-scripts','--no-audit','--no-fund','--cache',npmCache],{cwd:profile,stdio:'inherit',env:{PATH:process.env.PATH,HOME:join(run,'home'),NPM_CONFIG_USERCONFIG:'/dev/null'}});
 }else if(!reuse)await stageFixturePackage(profile);
 if(!reuse){
 await writeFile(join(profile,'cordis.patch.yml'),JSON.stringify([{id:'llm-deepseek',config:{baseURL:'https://api.deepseek.com/anthropic',apiKeyEnv:'ROLE_FIXTURE_KEY',thinking:'disabled',maxTokens:4096,models:[{id:'deepseek-flash',name:'Controlled official route',contextWindow:1048576,maxTokens:4096,inputModalities:['text']}],retryPolicy:{mode:'normal',maxRetries:0}}},...(bootstrap&&bootstrapFromDocument?[{id:'role-companion',config:{bootstrap}}]:[]),...additionalPatches,{id:'session-title-llm',disabled:true},{id:'web-runtime',config:{openBrowser:false,printUrl:true,surfaceContext:false}}]));}

 await beforeBoot?.({profile,installed:createRequire(join(profile,'package.json'))});
 const tlsRoot=join(profile,'controlled-transport');await mkdir(tlsRoot,{recursive:true});const key=join(tlsRoot,'key.pem'),cert=join(tlsRoot,'cert.pem'),config=join(tlsRoot,'cert.cnf');
 await writeFile(config,'[req]\ndistinguished_name=dn\nx509_extensions=v3\nprompt=no\n[dn]\nCN=api.deepseek.com\n[v3]\nsubjectAltName=DNS:api.deepseek.com\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\n');
 execFileSync('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-config',config],{stdio:'ignore'});
 const entries=[],metadataEntries=[],targets=[],sockets=new Set();let transportError;
 const secure=https.createServer({key:await readFile(key),cert:await readFile(cert)},async(request,response)=>{
  try{assert.equal(request.headers.host,'api.deepseek.com');const chunks=[];for await(const chunk of request)chunks.push(chunk);const text=Buffer.concat(chunks).toString('utf8');
   if(request.url==='/anthropic/v1/messages'){assert.equal(request.headers['x-api-key'],'synthetic-fixture-only');const entry={ordinal:entries.length+1,body:JSON.parse(text)};entries.push(entry);const result=await transport(entry);response.writeHead(result.status,Object.fromEntries(result.headers));response.end(Buffer.from(await result.arrayBuffer()));}
   else if(request.url==='/anthropic/models'||request.url==='/models'){metadataEntries.push({path:request.url});response.writeHead(200,{'content-type':'application/json'});response.end(JSON.stringify({data:[{id:'deepseek-flash',object:'model',owned_by:'deepseek',context_window:1048576}]}));}
   else throw Error('UNEXPECTED_CONTROLLED_ROUTE');
  }catch(error){transportError=error;response.writeHead(500);response.end('{}');}
 });
 const proxy=http.createServer((request,response)=>{transportError=Error('UNEXPECTED_PROXY_REQUEST');response.writeHead(502);response.end();});
 proxy.on('connect',(request,socket,head)=>{targets.push(request.url);if(request.url!=='api.deepseek.com:443'){transportError=Error('UNEXPECTED_PROXY_TARGET');socket.destroy();return;}sockets.add(socket);socket.once('close',()=>sockets.delete(socket));socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)socket.unshift(head);secure.emit('connection',socket);});
 await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));const proxyUrl='http://127.0.0.1:'+proxy.address().port;
 const installed=createRequire(join(profile,'package.json')),cli=join(installed.resolve('@deepseek-ai/dsh/package.json'),'../lib/bin.js');let stdout='',stderr='',exited;
 const child=spawn(process.execPath,[...execArgs,cli,'--profile',profileName,...cliArguments,'--host','127.0.0.1','--port','0','--no-open'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TELEMETRY_DISABLED:'1',TMPDIR:run,ROLE_FIXTURE_KEY:'synthetic-fixture-only',HTTPS_PROXY:proxyUrl,HTTP_PROXY:proxyUrl,NO_PROXY:'127.0.0.1,localhost',NODE_EXTRA_CA_CERTS:cert},stdio:['ignore','pipe','pipe']});
 const exit=new Promise(resolve=>child.once('exit',(code,signal)=>{exited={code,signal};resolve(exited);}));child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
 let url;try{for(let count=0;count<1500;count++){url=stdout.match(/dsh web: (http:\/\/127\.0\.0\.1:[^\s]+)/)?.[1];if(url)break;if(exited)throw Error('OFFICIAL_CLI_EXITED_BEFORE_READY');await wait(10);}if(!url)throw Error('OFFICIAL_CLI_READY_TIMEOUT');}
 catch(error){child.kill('SIGINT');await exit;for(const socket of sockets)socket.destroy();await new Promise(resolve=>proxy.close(resolve));await writeFile(join(run,'cli-startup-failure.json'),JSON.stringify({status:'fixture-startup-failed',exit:exited,actualModels:entries.length,metadataEntries:metadataEntries.length,stderr:stderr.replaceAll(run,'<isolated-file-home>').replaceAll('synthetic-fixture-only','<synthetic-value-redacted>'),stdout:stdout.replace(/dsh web: [^\s]+/g,'dsh web: <private-process-url>').replaceAll(run,'<isolated-file-home>').replaceAll('synthetic-fixture-only','<synthetic-value-redacted>'),proxyClosed:true})+'\n');throw error;}
 const origin=new URL(url).origin,exchange=await fetch(url,{redirect:'manual'}),cookie=exchange.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
 const remote=async(service,method,args={})=>{const raw=await fetch(origin+'/api/'+service+'/'+method,{method:'POST',headers:{'content-type':'application/json',origin,cookie},body:JSON.stringify({type:'client-request',rpcId:'file-'+method,method:service+'/'+method,payload:{args}})});const body=await raw.json();assert.equal(body.result?.ok,true,JSON.stringify(body));return body.result.value;};
 const rpc=(method,args={})=>remote('roleCompanion',method,args);
 if(!reuse&&bootstrap&&!bootstrapFromDocument){const receipt=await rpc('attachHome',{path:bootstrap.path,expectedRoleId:bootstrap.roleId,operationId:'fixture-attach-'+(bootstrap.registrationOperationId||bootstrap.creationOperationId),expectedProfileVersion:0});assert.equal(receipt.registration,'registered',JSON.stringify(receipt));}
 return {rpc,remote,entries,metadataEntries,targets,child,profile,privateLoginUrl:url,async stop(){if(!exited)child.kill('SIGINT');const timer=setTimeout(()=>{child.kill('SIGTERM');},12000);let result;try{result=await exit;}finally{clearTimeout(timer);for(const socket of sockets)socket.destroy();await new Promise(resolve=>proxy.close(resolve));}if(transportError&&!captureTransportError)throw transportError;assert.ok([0,130].includes(result.code),'official CLI must settle SIGINT normally');return {...result,...transportError?{transportFailure:{name:transportError.name,message:transportError.message,code:transportError.code??null}}:{},stderr:stderr.replaceAll(run,'<isolated-file-home>'),stdout:stdout.replace(/dsh web: [^\s]+/g,'dsh web: <private-process-url>').replaceAll(run,'<isolated-file-home>'),proxyClosed:true};}};
}
