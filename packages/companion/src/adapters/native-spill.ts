import {constants,type BigIntStats} from 'node:fs';
import {lstat,realpath,readdir,open} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {symbols,type Context} from '@deepseek-ai/cordis';
import {LocalSpillStore,sessionDir} from '@deepseek-ai/dsh-spill-local';
import type {SessionId} from '@deepseek-ai/dsh-session';
import type {ToolExecutionResult,PostToolDecision} from '@deepseek-ai/dsh-tools';
import {estimateContent} from '@deepseek-ai/dsh-token-meter/estimate';
import type {ToolMaterialBody} from '../home/turns.ts';
import {ExecutionError,safeExecutionCode} from '../runtime/execution.ts';

export interface NativeHostIO {readonly openFile:typeof open;}
export const nativeHostIO:NativeHostIO=Object.freeze({openFile:open});
export interface SpillCaptureGap {readonly kind:'sdk-spill-gap';readonly provenance:'unknown';readonly reason:string;readonly postCompleted:boolean;readonly artifacts:readonly {readonly text:string;readonly bytes:number;readonly digest:string}[];}
interface Artifact {readonly name:string;readonly identity:BigIntStats;readonly text:string;readonly bytes:number;readonly digest:string;readonly locator:string;}
const same=(a:BigIntStats,b:BigIntStats)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeNs===b.mtimeNs&&a.mode===b.mode&&a.nlink===b.nlink&&a.uid===b.uid;
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const original=(value:object):object=>{const target:unknown=Reflect.get(value,symbols.original);return target!==null&&typeof target==='object'?target:value;};
const denied=():never=>{throw new ExecutionError('SDK_SPILL_UNPROVEN');};
/** A backend-specific Host read capability, never issued from a model path or result notice. */
export class NativeSpillCapture {
    private readonly known=new Map<string,Artifact>();
    private rootIdentity:BigIntStats|undefined;
    private canonicalRoot:string|undefined;
    private busy=false;
    private constructor(private readonly ctx:Context,private readonly root:string,private readonly sessionId:SessionId,private readonly localEntry:ReturnType<Context['configEditor']['entries']>[number],private readonly policyEntry:ReturnType<Context['configEditor']['entries']>[number],private readonly localFiber:NonNullable<ReturnType<Context['configEditor']['entries']>[number]['fiber']>,private readonly policyFiber:NonNullable<ReturnType<Context['configEditor']['entries']>[number]['fiber']>,private readonly inlineTokens:number|undefined,private readonly storeIdentity:object,private readonly io:NativeHostIO){}
    static create(ctx:Context,sessionId:SessionId,io:NativeHostIO=nativeHostIO):NativeSpillCapture{
        const local=ctx.configEditor.entries().filter(x=>x.options.name==='@deepseek-ai/dsh-spill-local'),policy=ctx.configEditor.entries().filter(x=>x.options.name==='@deepseek-ai/dsh-spill-policy');
        if(local.length!==1||policy.length!==1)return denied();const localEntry=local[0]!,policyEntry=policy[0]!;
        if(!localEntry.fiber||!policyEntry.fiber||!(ctx.spillStore instanceof LocalSpillStore)||typeof process.getuid!=='function')return denied();
        const raw:unknown=policyEntry.options.config;let inlineTokens:number|undefined;
        if(raw!==undefined){if(!raw||typeof raw!=='object'||Array.isArray(raw))return denied();if('maxInlineTokens' in raw){if(typeof raw.maxInlineTokens!=='number'||!Number.isSafeInteger(raw.maxInlineTokens)||raw.maxInlineTokens<0)return denied();inlineTokens=raw.maxInlineTokens;}}
        return new NativeSpillCapture(ctx,ctx.spillStore.root,sessionId,localEntry,policyEntry,localEntry.fiber,policyEntry.fiber,inlineTokens,original(ctx.spillStore),io);
    }
    private assertLive(){
        const current=this.ctx.spillStore;
        if(!(current instanceof LocalSpillStore)||original(current)!==this.storeIdentity||current.root!==this.root||this.localEntry.fiber!==this.localFiber||this.policyEntry.fiber!==this.policyFiber||this.localFiber.state!==2||this.policyFiber.state!==2)denied();
        const raw:unknown=this.policyEntry.options.config;const cap=raw&&typeof raw==='object'&&'maxInlineTokens' in raw?raw.maxInlineTokens:undefined;if(cap!==this.inlineTokens)denied();
    }
    private async snapshot():Promise<Artifact[]>{
        let root:BigIntStats;
        try{root=await lstat(this.root,{bigint:true});}catch(error){if(error&&typeof error==='object'&&'code' in error&&error.code==='ENOENT'&&!this.rootIdentity)return [];throw error;}
        if(!root.isDirectory()||root.isSymbolicLink()||(root.mode&0o077n)!==0n||root.uid!==BigInt(process.getuid!()))return denied();
        const physical=await realpath(this.root);if(this.rootIdentity&&(root.dev!==this.rootIdentity.dev||root.ino!==this.rootIdentity.ino||physical!==this.canonicalRoot))return denied();this.rootIdentity=root;this.canonicalRoot=physical;
        const dir=sessionDir(physical,this.sessionId);let directory:BigIntStats;
        try{directory=await lstat(dir,{bigint:true});}catch(error){if(error&&typeof error==='object'&&'code' in error&&error.code==='ENOENT'&&!this.known.size)return [];throw error;}
        if(!directory.isDirectory()||directory.isSymbolicLink()||(directory.mode&0o077n)!==0n||directory.uid!==BigInt(process.getuid!())||await realpath(dir)!==dir)return denied();
        const names=(await readdir(dir)).sort();if(names.length>this.known.size+1)return denied();const rows:Artifact[]=[];
        for(const name of names){
            if(!/^[0-9a-f]{12}-[A-Za-z0-9._~-]+$/.test(name))return denied();const path=join(dir,name),before=await lstat(path,{bigint:true});
            if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1n||(before.mode&0o077n)!==0n||before.uid!==BigInt(process.getuid!())||before.size>8388608n)return denied();
            const handle=await this.io.openFile(path,constants.O_RDONLY|constants.O_NOFOLLOW);let bytes:Buffer;
            try{const opened=await handle.stat({bigint:true});if(!same(before,opened))return denied();const buffer=Buffer.alloc(8388609);let used=0;while(used<buffer.length){const {bytesRead}=await handle.read(buffer,used,Math.min(65536,buffer.length-used),used);if(!bytesRead)break;used+=bytesRead;}if(used>8388608)return denied();bytes=buffer.subarray(0,used);if(!same(opened,await handle.stat({bigint:true})))return denied();}finally{await handle.close();}
            if(!same(before,await lstat(path,{bigint:true}))||BigInt(bytes.length)!==before.size)return denied();const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
            rows.push({name,identity:before,text,bytes:bytes.length,digest:hash(bytes),locator:join(sessionDir(this.root,this.sessionId),name)});
        }
        const after=await lstat(dir,{bigint:true});if(after.dev!==directory.dev||after.ino!==directory.ino||after.mode!==directory.mode||after.uid!==directory.uid||after.mtimeNs!==directory.mtimeNs||after.ctimeNs!==directory.ctimeNs||JSON.stringify((await readdir(dir)).sort())!==JSON.stringify(names))return denied();
        for(const [name,old]of this.known){const row=rows.find(x=>x.name===name);if(!row||!same(old.identity,row.identity)||old.digest!==row.digest)return denied();}
        return rows;
    }
    /** Native model-order finalization is the only approved producer lane for this Session. */
    async around(result:Readonly<ToolExecutionResult>,next:()=>Promise<PostToolDecision>,save:(body:ToolMaterialBody)=>Promise<void>,gap:(fact:SpillCaptureGap)=>void):Promise<PostToolDecision>{
        this.assertLive();if(this.busy)return denied();this.busy=true;let enteredPost=false,postCompleted=false;let artifacts:Artifact[]=[];
        try{
            const before=await this.snapshot();if(before.length!==this.known.size)return denied();this.assertLive();enteredPost=true;const decision=await next();postCompleted=true;this.assertLive();const after=await this.snapshot(),added=after.filter(x=>!this.known.has(x.name));artifacts=added;
            const expectedText=result.content.map(block=>block.type==='text'?block.text:denied()).join('');const required=this.inlineTokens!==undefined&&estimateContent(result.content)>this.inlineTokens&&decision.kind==='accept'&&!Object.hasOwn(decision,'value');
            if(!required){if(added.length)return denied();return decision;}
            if(added.length!==1||decision.kind!=='accept')return denied();const artifact=added[0]!;
            if(artifact.bytes!==Buffer.byteLength(expectedText,'utf8')||artifact.digest!==hash(Buffer.from(expectedText,'utf8')))return denied();
            // Exposure cross-check only: the path was already authorized and read through the Host cap above.
            if(!decision.content?.some(block=>block.type==='text'&&block.text.includes(artifact.locator)))return denied();
            await save({source:'sdk-local-spill',text:artifact.text,bytes:artifact.bytes,digest:artifact.digest});const confirmed=await this.snapshot();if(confirmed.length!==after.length||confirmed.some((row,index)=>{const previous=after[index];return !previous||row.name!==previous.name||!same(row.identity,previous.identity)||row.digest!==previous.digest;}))return denied();this.known.set(artifact.name,artifact);return decision;
        }catch(error){if(enteredPost&&!artifacts.length){try{artifacts=(await this.snapshot()).filter(x=>!this.known.has(x.name));}catch{}}gap({kind:'sdk-spill-gap',provenance:'unknown',reason:safeExecutionCode(error),postCompleted,artifacts:artifacts.map(({text,bytes,digest})=>({text,bytes,digest}))});throw error;}finally{this.busy=false;}
    }
}
