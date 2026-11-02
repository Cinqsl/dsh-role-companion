import {execFile,spawn} from 'node:child_process';
import {mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {Context} from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-config-editor';
import Schema from '@deepseek-ai/schemastery';
import {HomeError} from '../home/errors.ts';
import {OperationId} from '../home/ids.ts';
import type {AutoUpdateEditRequest} from '../types.ts';
import {withFileProfileEdit} from './file-protection-cache.ts';

export const autoUpdateRepository = 'https://github.com/Cinqsl/dsh-role-companion.git';
export const autoUpdateBranch = 'main';
const packageName = 'dsh-role-companion';
const packagePath = 'packages/companion';
const minIntervalMinutes = 5;
const maxIntervalMinutes = 1440;
const commandTimeoutMs = 20000;
const commitPattern = /^[0-9a-f]{7,40}$/;
const desktopBundleId = 'com.deepseek.dsh';
const relaunchMarker = 'relaunch.json';
const relaunchWindowMs = 10*60*1000;
const desktopRestartSupported=()=>process.platform==='darwin'&&process.env.__CFBundleIdentifier===desktopBundleId;

export interface AutoUpdateValue {
  readonly enabled:boolean;
  readonly intervalMinutes:number;
}

export interface AutoUpdateProfile extends AutoUpdateValue {
  readonly version:number;
  readonly lastOperationId:string;
}

export const autoUpdateDefaults:AutoUpdateProfile = Object.freeze({
  enabled:false,
  intervalMinutes:15,
  version:0,
  lastOperationId:'',
});

export const AutoUpdateConfig = Schema.object({
  enabled:Schema.boolean().default(autoUpdateDefaults.enabled),
  intervalMinutes:Schema.number().default(autoUpdateDefaults.intervalMinutes),
  version:Schema.number().default(autoUpdateDefaults.version),
  lastOperationId:Schema.string().default(autoUpdateDefaults.lastOperationId),
}).default({...autoUpdateDefaults}).volatile();

export type AutoUpdatePhase='disabled'|'idle'|'checking'|'up-to-date'|'scheduled'|'blocked'|'error';

export interface AutoUpdateView extends AutoUpdateProfile {
  readonly repository:string;
  readonly branch:string;
  readonly phase:AutoUpdatePhase;
  readonly reason:string;
  readonly currentCommit:string|null;
  readonly remoteCommit:string|null;
  readonly scheduledCommit:string|null;
  readonly lastCheckedAt:string|null;
  readonly lastScheduledAt:string|null;
  readonly restartSupported:boolean;
}

export interface PluginBundleInfo {
  readonly name:string;
  readonly source?:string;
}

export interface PluginManagerPort {
  listBundles():Promise<readonly PluginBundleInfo[]>;
}

export interface UpdateInstallRequest {
  readonly profileDir:string;
  readonly parentPid:number;
  readonly spec:string;
  readonly commit:string;
  readonly runtimeVersion:string;
  readonly appExecutable:string;
  readonly pnpmCommand?:string;
}

type CommandRunner=(file:string,args:readonly string[],options:{readonly cwd?:string;readonly timeoutMs:number})=>Promise<string>;
type ScheduleInstall=(request:UpdateInstallRequest)=>Promise<void>;

function defaultCommandRunner(file:string,args:readonly string[],options:{readonly cwd?:string;readonly timeoutMs:number}):Promise<string>{
  return new Promise((resolve,reject)=>{
    execFile(file,[...args],{
      ...(options.cwd?{cwd:options.cwd}:{}),
      timeout:options.timeoutMs,
      maxBuffer:1024*1024,
      env:{...process.env,GIT_TERMINAL_PROMPT:'0'},
    },(error,stdout)=>{
      if(error)reject(error);else resolve(String(stdout));
    });
  });
}

export const autoUpdateWorkerSource=String.raw`
import {spawn} from 'node:child_process';
import {mkdir,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';

const request=JSON.parse(Buffer.from(process.env.DSH_ROLE_COMPANION_UPDATE_REQUEST??'','base64').toString('utf8'));
const stateDir=join(request.profileDir,'.role-companion-update');
const packagePath=join(request.profileDir,'package.json');
const lockPath=join(request.profileDir,'pnpm-lock.yaml');
const beforePackage=join(stateDir,'package.before.json');
const beforeLock=join(stateDir,'pnpm-lock.before.yaml');
const resultPath=join(stateDir,'last-run.json');
const pendingPath=join(stateDir,'pending.json');
const relaunchPath=join(stateDir,'relaunch.json');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const alive=pid=>{try{process.kill(pid,0);return true}catch{return false}};
const finish=async(value)=>{await writeFile(resultPath,JSON.stringify({...value,at:new Date().toISOString()},null,2)+'\n',{mode:0o600});await rm(pendingPath,{force:true});};

await mkdir(stateDir,{recursive:true,mode:0o700});
await writeFile(pendingPath,JSON.stringify({...request,pid:process.pid,at:new Date().toISOString()},null,2)+'\n',{mode:0o600});

for(let second=0;second<7*24*60*60;second++){
  if(!alive(request.parentPid))break;
  await sleep(1000);
}
if(alive(request.parentPid)){
  await finish({status:'timeout',commit:request.commit,reason:'PARENT_STILL_RUNNING'});
  process.exit(0);
}

await sleep(2000);
let shouldRelaunch=false;
try{
  const marker=JSON.parse(await readFile(relaunchPath,'utf8'));
  shouldRelaunch=Number.isSafeInteger(marker?.expiresAt)&&marker.expiresAt>Date.now();
}catch{}
await rm(relaunchPath,{force:true});
let hadLock=true;
await copyFile(packagePath,beforePackage);
try{await copyFile(lockPath,beforeLock);}catch(error){if(error.code!=='ENOENT')throw error;hadLock=false;}
const child=request.pnpmCommand
  ? spawn(process.execPath,[request.pnpmCommand,'add',request.spec],{cwd:request.profileDir,env:process.env,stdio:['ignore','pipe','pipe']})
  : spawn(process.platform==='win32'?'pnpm.cmd':'pnpm',['add',request.spec],{cwd:request.profileDir,env:process.env,stdio:['ignore','pipe','pipe']});
let output='';
const retain=chunk=>{output=(output+chunk.toString()).slice(-16384);};
child.stdout.on('data',retain);
child.stderr.on('data',retain);
const exitCode=await new Promise(resolve=>{
  child.once('error',error=>{output=(output+'\n'+String(error?.message??error)).slice(-16384);resolve(-1);});
  child.once('close',code=>resolve(code??-1));
});

let installed=false;
try{
  const manifest=JSON.parse(await readFile(join(request.profileDir,'node_modules','dsh-role-companion','package.json'),'utf8'));
  const lock=await readFile(lockPath,'utf8');
  installed=exitCode===0&&
    manifest.name==='dsh-role-companion'&&
    manifest.dsh?.bundle?.patch===('./cordis.patch.yml')&&
    manifest.dsh?.compatibility?.dshReleases?.[request.runtimeVersion]==='compatible'&&
    lock.includes(request.commit);
}catch{}

if(!installed){
  await copyFile(beforePackage,packagePath);
  if(hadLock)await copyFile(beforeLock,lockPath);else await rm(lockPath,{force:true});
}
await finish({
  status:installed?'installed':'failed',
  commit:request.commit,
  exitCode,
  restored:!installed,
  output,
});
if(shouldRelaunch){
  await sleep(500);
  if(process.platform==='darwin'){
    const app=spawn('/usr/bin/open',['-b','com.deepseek.dsh'],{detached:true,stdio:'ignore'});
    app.unref();
  }else if(request.appExecutable){
    const env={...process.env};
    delete env.ELECTRON_RUN_AS_NODE;
    const app=spawn(request.appExecutable,[],{detached:true,stdio:'ignore',env});
    app.unref();
  }
}
process.exit(installed?0:1);
`;

async function defaultScheduleInstall(request:UpdateInstallRequest):Promise<void>{
  const payload=Buffer.from(JSON.stringify(request),'utf8').toString('base64');
  await new Promise<void>((resolve,reject)=>{
    const child=spawn(process.execPath,['--input-type=module','-e',autoUpdateWorkerSource],{
      detached:true,
      stdio:'ignore',
      env:{...process.env,ELECTRON_RUN_AS_NODE:'1',DSH_ROLE_COMPANION_UPDATE_REQUEST:payload},
    });
    child.once('error',reject);
    child.once('spawn',()=>{child.unref();resolve();});
  });
}

export function bundledPnpmCommand(argv:readonly string[]=process.argv):string|undefined{
  return argv.find(argument=>/[/\\]dependencies[/\\]pnpm[/\\]bin[/\\]pnpm\.mjs$/u.test(argument));
}

export async function cancelPendingDesktopInstall(profileDir:string,parentPid:number):Promise<void>{
  const directory=join(profileDir,'.role-companion-update'),path=join(directory,'pending.json');
  let pending:{readonly pid?:unknown;readonly parentPid?:unknown};
  try{pending=JSON.parse(await readFile(path,'utf8')) as typeof pending;}
  catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;return;}
  if(!Number.isSafeInteger(pending.pid)||Number(pending.pid)<=0||pending.parentPid!==parentPid)return;
  try{process.kill(Number(pending.pid),'SIGTERM');}catch(error){if((error as NodeJS.ErrnoException).code!=='ESRCH')throw error;}
  await rm(path,{force:true});
}

export async function requestDesktopRelaunch(profileDir:string,now=Date.now()):Promise<void>{
  const directory=join(profileDir,'.role-companion-update');
  await mkdir(directory,{recursive:true,mode:0o700});
  await writeFile(join(directory,relaunchMarker),JSON.stringify({
    requestedAt:new Date(now).toISOString(),
    expiresAt:now+relaunchWindowMs,
  },null,2)+'\n',{mode:0o600});
}

async function defaultRestartDesktop():Promise<void>{
  if(!desktopRestartSupported())throw new HomeError('AUTO_UPDATE_RESTART_UNAVAILABLE');
  await new Promise<void>((resolve,reject)=>{
    execFile('/usr/bin/osascript',['-e',`tell application id "${desktopBundleId}" to quit`],{timeout:10000},error=>{
      if(error)reject(error);else resolve();
    });
  });
}

export function validateAutoUpdateValue(value:unknown):value is AutoUpdateValue{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const candidate=value as Record<string,unknown>;
  return Object.keys(candidate).length===2&&
    typeof candidate.enabled==='boolean'&&
    typeof candidate.intervalMinutes==='number'&&
    Number.isSafeInteger(candidate.intervalMinutes)&&
    candidate.intervalMinutes>=minIntervalMinutes&&
    candidate.intervalMinutes<=maxIntervalMinutes;
}

export function validateAutoUpdateProfile(value:unknown):value is AutoUpdateProfile{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const candidate=value as Record<string,unknown>;
  if(!validateAutoUpdateValue({enabled:candidate.enabled,intervalMinutes:candidate.intervalMinutes}))return false;
  if(typeof candidate.lastOperationId!=='string'||(candidate.lastOperationId!==''&&!/^[a-zA-Z0-9_-]{1,128}$/.test(candidate.lastOperationId)))return false;
  return typeof candidate.version==='number'&&Number.isSafeInteger(candidate.version)&&candidate.version>=0;
}

export function prepareAutoUpdateProfile(current:AutoUpdateProfile,request:AutoUpdateEditRequest):AutoUpdateProfile{
  OperationId(request.operationId);
  if(!Number.isSafeInteger(request.expectedVersion)||request.expectedVersion<0||!validateAutoUpdateValue(request.value))throw new HomeError('INVALID_AUTO_UPDATE');
  if(current.lastOperationId===request.operationId){
    if(JSON.stringify(valueOf(current))!==JSON.stringify(request.value))throw new HomeError('OPERATION_CONFLICT');
    return current;
  }
  if(current.version!==request.expectedVersion)throw new HomeError('AUTO_UPDATE_VERSION_CONFLICT');
  return {...request.value,version:current.version+1,lastOperationId:request.operationId};
}

export async function editAutoUpdateProfile(ctx:Context,get:()=>AutoUpdateProfile,request:AutoUpdateEditRequest):Promise<AutoUpdateProfile>{
  const next=prepareAutoUpdateProfile(get(),request);
  const editor=ctx.get('configEditor');
  if(!editor)throw new HomeError('PROFILE_EDITOR_UNAVAILABLE');
  const entries=editor.entries().filter(entry=>entry.options.name===packageName);
  if(entries.length!==1)throw new HomeError('PROFILE_ENTRY_AMBIGUOUS');
  await withFileProfileEdit(ctx,()=>editor.edit(entries[0]!,current=>{
    const old=get();
    if(old.lastOperationId===request.operationId){
      if(JSON.stringify(valueOf(old))!==JSON.stringify(request.value))throw new HomeError('OPERATION_CONFLICT');
      return current;
    }
    if(old.version!==request.expectedVersion)throw new HomeError('AUTO_UPDATE_VERSION_CONFLICT');
    return {...current,update:next};
  }));
  const applied=get();
  if(applied.lastOperationId!==request.operationId||JSON.stringify(valueOf(applied))!==JSON.stringify(request.value))throw new HomeError('PROFILE_APPLY_UNCONFIRMED');
  return applied;
}

function valueOf(profile:AutoUpdateProfile):AutoUpdateValue{
  return {enabled:profile.enabled,intervalMinutes:profile.intervalMinutes};
}

function shortCommit(value:string|null):string|null{
  return value?value.slice(0,12):null;
}

function commitFromSource(source:string|undefined):string|null{
  if(!source)return null;
  const hash=source.indexOf('#');
  if(hash<0)return null;
  for(const part of source.slice(hash+1).split('&')){
    if(commitPattern.test(part))return part;
  }
  return null;
}

function sameCommit(current:string|null,remote:string):boolean{
  return current!==null&&(current===remote||(current.length<40&&remote.startsWith(current)));
}

export function autoUpdateSpec(commit:string):string{
  if(!/^[0-9a-f]{40}$/.test(commit))throw new HomeError('INVALID_AUTO_UPDATE_COMMIT');
  return `git+${autoUpdateRepository}#${commit}&path:${packagePath}`;
}

export class RoleCompanionAutoUpdater {
  private timer:ReturnType<typeof setTimeout>|undefined;
  private pending:Promise<AutoUpdateView>|undefined;
  private started=false;
  private closed=false;
  private phase:AutoUpdatePhase='idle';
  private reason='';
  private currentCommit:string|null=null;
  private remoteCommit:string|null=null;
  private scheduledCommit:string|null=null;
  private lastCheckedAt:string|null=null;
  private lastScheduledAt:string|null=null;

  constructor(private readonly options:{
    readonly profile:()=>AutoUpdateProfile;
    readonly manager:()=>PluginManagerPort|undefined;
    readonly profileDir:()=>string;
    readonly runtimeVersion:()=>string;
    readonly appExecutable?:()=>string;
    readonly pnpmCommand?:()=>string|undefined;
    readonly restartSupported?:()=>boolean;
    readonly requestRelaunch?:()=>Promise<void>;
    readonly restartDesktop?:()=>Promise<void>;
    readonly cancelScheduled?:()=>Promise<void>;
    readonly parentPid?:number;
    readonly now?:()=>Date;
    readonly run?:CommandRunner;
    readonly schedule?:ScheduleInstall;
    readonly repository?:string;
    readonly branch?:string;
  }){}

  start():void{
    if(this.started)return;
    this.started=true;
    this.reschedule(true);
  }

  close():void{
    this.closed=true;
    if(this.timer!==undefined)clearTimeout(this.timer);
    this.timer=undefined;
  }

  reschedule(first=false):void{
    if(!this.started||this.closed)return;
    if(this.timer!==undefined)clearTimeout(this.timer);
    this.timer=undefined;
    const profile=this.options.profile();
    if(!profile.enabled)return;
    const delay=first?10000:profile.intervalMinutes*60000;
    this.timer=setTimeout(()=>{
      this.timer=undefined;
      void this.check().finally(()=>this.reschedule());
    },delay);
    this.timer.unref?.();
  }

  inspect():AutoUpdateView{
    const profile=this.options.profile();
    return {
      ...profile,
      repository:this.options.repository??autoUpdateRepository,
      branch:this.options.branch??autoUpdateBranch,
      phase:profile.enabled||this.phase!=='disabled'?this.phase:'disabled',
      reason:this.reason,
      currentCommit:shortCommit(this.currentCommit),
      remoteCommit:shortCommit(this.remoteCommit),
      scheduledCommit:shortCommit(this.scheduledCommit),
      lastCheckedAt:this.lastCheckedAt,
      lastScheduledAt:this.lastScheduledAt,
      restartSupported:this.options.restartSupported?.()??desktopRestartSupported(),
    };
  }

  check():Promise<AutoUpdateView>{
    if(this.closed)return Promise.resolve(this.inspect());
    this.pending??=this.runCheck().finally(()=>{this.pending=undefined;});
    return this.pending;
  }

  private async runCheck():Promise<AutoUpdateView>{
    const profile=this.options.profile();
    this.lastCheckedAt=this.now();
    this.phase='checking';
    this.reason='';
    if(!profile.enabled)this.reason='AUTO_UPDATE_DISABLED';
    const manager=this.options.manager();
    if(!manager){
      this.phase='blocked';
      this.reason='PLUGIN_MANAGER_UNAVAILABLE';
      return this.inspect();
    }
    try{
      const remote=await this.remoteCommitNow();
      this.remoteCommit=remote;
      if(this.scheduledCommit===remote){
        this.phase='scheduled';
        this.reason='INSTALL_ON_EXIT';
        return this.inspect();
      }
      const bundles=await manager.listBundles();
      const bundle=bundles.find(item=>item.name===packageName);
      const source=bundle?.source;
      const localPath=source?.startsWith('link:')?source.slice(5):undefined;
      const discovered=localPath?await this.localHead(localPath):commitFromSource(source);
      this.currentCommit=discovered&&sameCommit(discovered,remote)?remote:discovered;
      if(localPath&&discovered!==null&&!sameCommit(discovered,remote)&&!await this.localCanFastForward(localPath,discovered,remote)){
        this.phase='blocked';
        this.reason='LOCAL_CHECKOUT_NOT_FAST_FORWARD';
        return this.inspect();
      }
      if(sameCommit(discovered,remote)){
        this.phase='up-to-date';
        return this.inspect();
      }
      const profileDir=this.options.profileDir(),parentPid=this.options.parentPid??process.pid,pnpmCommand=this.options.pnpmCommand?.()??bundledPnpmCommand();
      const request={
        profileDir,
        parentPid,
        spec:autoUpdateSpec(remote),
        commit:remote,
        runtimeVersion:this.options.runtimeVersion(),
        appExecutable:this.options.appExecutable?.()??process.execPath,
        ...(pnpmCommand?{pnpmCommand}:{}),
      };
      await (this.options.cancelScheduled??(()=>cancelPendingDesktopInstall(profileDir,parentPid)))();
      await (this.options.schedule??defaultScheduleInstall)(request);
      this.scheduledCommit=remote;
      this.lastScheduledAt=this.now();
      this.phase='scheduled';
      this.reason='INSTALL_ON_EXIT';
      return this.inspect();
    }catch(error){
      this.phase='error';
      this.reason=this.errorCode(error);
      return this.inspect();
    }
  }

  async applyAndRestart():Promise<AutoUpdateView>{
    const current=await this.check();
    if(current.phase!=='scheduled')return current;
    if(!this.inspect().restartSupported)throw new HomeError('AUTO_UPDATE_RESTART_UNAVAILABLE');
    await (this.options.requestRelaunch??(()=>requestDesktopRelaunch(this.options.profileDir())))();
    this.reason='RESTARTING';
    await (this.options.restartDesktop??defaultRestartDesktop)();
    return this.inspect();
  }

  private async remoteCommitNow():Promise<string>{
    const repository=this.options.repository??autoUpdateRepository;
    const branch=this.options.branch??autoUpdateBranch;
    const output=await this.git(['ls-remote',repository,`refs/heads/${branch}`]);
    const commit=output.trim().split(/\s+/)[0]??'';
    if(!/^[0-9a-f]{40}$/.test(commit))throw new HomeError('AUTO_UPDATE_REMOTE_INVALID');
    return commit;
  }

  private async localHead(path:string):Promise<string>{
    const commit=(await this.git(['-C',path,'rev-parse','HEAD'])).trim();
    if(!commitPattern.test(commit))throw new HomeError('AUTO_UPDATE_LOCAL_INVALID');
    return commit;
  }

  private async localCanFastForward(path:string,current:string,remote:string):Promise<boolean>{
    const repository=this.options.repository??autoUpdateRepository;
    const branch=this.options.branch??autoUpdateBranch;
    await this.git(['-C',path,'fetch','--quiet',repository,`refs/heads/${branch}`]);
    try{
      await this.git(['-C',path,'merge-base','--is-ancestor',current,remote]);
      return true;
    }catch(error){
      if((error as {code?:unknown})?.code===1)return false;
      throw error;
    }
  }

  private git(args:readonly string[]):Promise<string>{
    return (this.options.run??defaultCommandRunner)('git',args,{timeoutMs:commandTimeoutMs});
  }

  private now():string{
    return (this.options.now?.()??new Date()).toISOString();
  }

  private errorCode(error:unknown):string{
    const code=(error as {code?:unknown})?.code;
    if(code==='ETIMEDOUT')return 'AUTO_UPDATE_TIMEOUT';
    if(code==='ENOENT')return 'GIT_UNAVAILABLE';
    if(error instanceof HomeError)return error.code;
    return 'AUTO_UPDATE_FAILED';
  }
}
