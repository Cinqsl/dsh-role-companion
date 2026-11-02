import type {} from '@deepseek-ai/dsh-token-meter';
import {BasicCompactionEngine,type ResolvedConfig,type ModelCompactPolicyConfig} from '@deepseek-ai/dsh-compaction-basic';
import {symbols,type Context,type Fiber} from '@deepseek-ai/cordis';
import type {Agent} from '@deepseek-ai/dsh-agent';
import type {Message,MessageId,ToolSchema} from '@deepseek-ai/dsh-llm';
import type {CompactionId} from '@deepseek-ai/dsh-compaction';
import type {SessionSeq} from '@deepseek-ai/dsh-session';
import type {} from '@deepseek-ai/dsh-agent-preset-registry';
import {createScope} from '@deepseek-ai/dsh-scope';
import {ExecutionError} from '../runtime/execution.ts';
import {registerNativeRecoveryOwner} from './native-composition.ts';
export interface NativeSummaryInput {readonly messages:readonly Message[];readonly tools?:readonly ToolSchema[];}
export interface NativeSummaryAuthority {
    check():void;
    reject(code:string):never;
    parameters():Promise<{readonly outputTokens:number}>;
    summarize<T extends {readonly maxTokens?:number}>(input:NativeSummaryInput,agent:Agent,signal:AbortSignal|undefined,configuredCap:number,next:()=>Promise<T>):Promise<T>;
}
const original=(value:object):object=>{const result:unknown=Reflect.get(value,symbols.original);return result!==null&&typeof result==='object'?result:value;};
export interface CompactionOwner {readonly config:ResolvedConfig;check():void;dispose():Promise<void>;}
type ConfigurationEntry=ReturnType<Context['configEditor']['entries']>[number];
/** A retained SDK configuration read, never an Agent preset mount or a second config owner. */
export async function acquireCompactionOwner(ctx:Context,revoke:(code:string)=>void):Promise<CompactionOwner>{
    const global=ctx.get('compaction'),registry=ctx.get('agentPresets');let entry:ConfigurationEntry|undefined,registryEntry:ConfigurationEntry|undefined,presetId:string|undefined;
    if(global!==undefined){const declarations=ctx.configEditor.entries().filter(x=>x.options.name==='@deepseek-ai/dsh-compaction-basic');if(declarations.length!==1)throw new ExecutionError('COMPACTION_OWNER_UNAVAILABLE');entry=declarations[0];}
    else{
        if(!registry)throw new ExecutionError('COMPACTION_OWNER_UNAVAILABLE');presetId=registry.defaultId;
        const declarations=ctx.configEditor.entries().filter(x=>{const value:unknown=x.options.config;return x.options.name==='@deepseek-ai/dsh-agent-preset'&&!!value&&typeof value==='object'&&'id'in value&&value.id===presetId;});
        if(declarations.length!==1)throw new ExecutionError('COMPACTION_OWNER_UNAVAILABLE');entry=declarations[0];const registries=ctx.configEditor.entries().filter(x=>x.options.name==='@deepseek-ai/dsh-agent-preset-registry');if(registries.length!==1)throw new ExecutionError('COMPACTION_OWNER_UNAVAILABLE');registryEntry=registries[0];
    }
    if(!entry?.fiber||entry.fiber.state!==2||registryEntry&&!registryEntry.fiber)throw new ExecutionError('COMPACTION_OWNER_UNAVAILABLE');
    const declaration=entry,declaringFiber=entry.fiber,selectionFiber=registryEntry?.fiber;let invalid=false,disposed=false,disposeTask:Promise<void>|undefined,serviceFiber:Fiber|undefined;
    const invalidate=()=>{if(invalid||disposed)return;invalid=true;revoke('COMPACTION_OWNER_CHANGED');};
    const removals=[
        ctx.on('loader/partial-dispose',row=>{if(row===declaration||row===registryEntry)invalidate();},{global:true,prepend:true}),
        ctx.on('loader/volatile-update',function(this:Context){if(this.fiber===declaringFiber||this.fiber===selectionFiber)invalidate();},{global:true,prepend:true}),
        ctx.on('internal/status',fiber=>{if((fiber===declaringFiber||fiber===selectionFiber||fiber===serviceFiber)&&fiber.state!==2)invalidate();},{global:true,prepend:true}),
        ctx.on('internal/plugin',fiber=>{if(fiber===declaringFiber||fiber===selectionFiber||fiber===serviceFiber)invalidate();},{global:true,prepend:true})
    ];
    // Loader volatile notifications may be filtered to their owning Fiber.
    // Observe there as well, while this reader's lifetime retains the disposers.
    for(const fiber of new Set([declaringFiber,...(selectionFiber?[selectionFiber]:[])])){const remove=fiber.ctx.on('loader/volatile-update',function(this:Context){if(this.fiber===fiber)invalidate();},{prepend:true});ctx.effect(()=>remove);removals.push(remove);}
    let lease:Awaited<ReturnType<NonNullable<typeof registry>['acquireScope']>>|undefined,reader:ReturnType<typeof createScope>|undefined,service:BasicCompactionEngine|undefined;
    const dispose=()=>{if(disposeTask)return disposeTask;disposeTask=(async()=>{disposed=true;for(const remove of removals)remove();await reader?.dispose();await lease?.[Symbol.asyncDispose]();})();return disposeTask;};
    try{
        if(global!==undefined){if(!(global instanceof BasicCompactionEngine))throw new ExecutionError('COMPACTION_ENGINE_UNSUPPORTED');service=global;}
        else{lease=await registry!.acquireScope(presetId);reader=createScope(ctx,{}, {parent:lease.key});const composition=registry!.inspectCompositions(reader.ctx);if(composition.length!==1||composition[0]!.id!==presetId||composition[0]!.leakedServices.length||composition[0]!.modules.filter(x=>x.moduleName==='@deepseek-ai/dsh-compaction-basic').length!==1)throw new ExecutionError('COMPACTION_COMPOSITION_UNPROVEN');const value=registry!.serviceFor({ctx:reader.ctx},'compaction');if(!(value instanceof BasicCompactionEngine))throw new ExecutionError('COMPACTION_ENGINE_UNSUPPORTED');service=value;}
        const implementation=original(service);if(!(implementation instanceof BasicCompactionEngine)||Object.getPrototypeOf(implementation)!==BasicCompactionEngine.prototype)throw new ExecutionError('COMPACTION_ENGINE_UNSUPPORTED');const config=implementation.config;
        // The public implementation inventory supplies the actual provider Fiber;
        // Service.ctx is protected and is not an ownership API for consumers.
        const implementations=Object.getOwnPropertySymbols(ctx.root.reflect.store).map(key=>ctx.root.reflect.store[key]!).filter(value=>value.name==='compaction'&&value.value===implementation);
        if(implementations.length!==1||implementations[0]!.fiber.runtime!==ctx.registry.get(BasicCompactionEngine)||global!==undefined&&implementations[0]!.fiber!==declaringFiber)throw new ExecutionError('COMPACTION_OWNER_UNPROVEN');serviceFiber=implementations[0]!.fiber;
        const check=()=>{const current=global!==undefined?ctx.get('compaction'):registry!.serviceFor({ctx:reader!.ctx},'compaction');if(invalid||disposed||serviceFiber?.state!==2||declaringFiber.state!==2||declaration.fiber!==declaringFiber||!ctx.configEditor.entries().includes(declaration)||global!==undefined&&ctx.configEditor.entries().filter(x=>x.options.name==='@deepseek-ai/dsh-compaction-basic').length!==1||registryEntry&&(registryEntry.fiber!==selectionFiber||selectionFiber?.state!==2||registry!.defaultId!==presetId)||!(current instanceof BasicCompactionEngine)||original(current)!==implementation||current.config!==config){invalidate();throw new ExecutionError('COMPACTION_OWNER_CHANGED');}};
        check();ctx.effect(()=>dispose,'role-native: release retained compaction configuration after Home');return Object.freeze({config,check,dispose});
    }catch(error){await dispose();throw error;}
}
interface EffectivePolicy {readonly thresholdRatio:number;readonly headroomTokens:number;readonly retainTokens:number;readonly summarizationProvider:string;readonly summarizationModel:string;readonly maxTokens:number;}
function policy(config:ResolvedConfig,contextWindow:number,outputTokens:number):EffectivePolicy {
    const override:Readonly<ModelCompactPolicyConfig>|undefined=config.modelPolicies.find(x=>x.provider==='deepseek-official'&&x.model==='deepseek-flash');
    const summaryProvider=override?.summarizationProvider??config.summarizationProvider,summaryModel=override?.summarizationModel??config.summarizationModel;
    if(summaryProvider!==''&&summaryProvider!=='deepseek-official'||summaryModel!==''&&summaryModel!=='deepseek-flash')throw new ExecutionError('COMPACTION_ROUTE_UNAPPROVED');
    const messageBudget=contextWindow-outputTokens,headroomTokens=override?.headroomTokens??config.headroomTokens,thresholdRatio=override?.thresholdRatio??config.thresholdRatio;
    const retention=override?.retainTokens!==undefined?override.retainTokens:override?.retainRatio!==undefined?Math.floor(messageBudget*override.retainRatio):config.retainTokens!==undefined?config.retainTokens:Math.floor(messageBudget*config.retainRatio);
    const threshold=Math.floor(Math.min(contextWindow*thresholdRatio,messageBudget-headroomTokens));
    if(!Number.isSafeInteger(contextWindow)||messageBudget<=0||messageBudget-headroomTokens<=0||threshold<=0||retention>=threshold)throw new ExecutionError('COMPACTION_CAPACITY');
    return {thresholdRatio,headroomTokens,retainTokens:retention,summarizationProvider:summaryProvider,summarizationModel:summaryModel,maxTokens:override?.maxTokens??config.maxTokens};
}
/** One exact private role instance; the official ancestor config remains the only config owner. */
export async function createRoleCompaction(ctx:Context,agent:Agent,config:ResolvedConfig,contextWindow:number,protectedIds:readonly MessageId[],authority:NativeSummaryAuthority):Promise<RoleCompactionPort>{
    const initial=await authority.parameters();policy(config,contextWindow,initial.outputTokens);
    let active=false,summaryCalls=0,activeId:CompactionId|undefined,summarySeq:SessionSeq|undefined,range:{start:SessionSeq;end:SessionSeq}|undefined;
    const protectedMessages=new Set(protectedIds);
    class RoleCompactor extends BasicCompactionEngine {
        constructor(c:Context,value:ConstructorParameters<typeof BasicCompactionEngine>[1]){registerNativeRecoveryOwner(c.fiber);super(c,value);}
        protected override async summarize(input:NativeSummaryInput,caller:Agent,signal?:AbortSignal){
            authority.check();if(!active||caller!==agent||++summaryCalls!==1)authority.reject('UNTRUSTED_COMPACTION_ORIGIN');
            const limits=await authority.parameters(),effective=policy(this.config,contextWindow,limits.outputTokens);
            return authority.summarize(input,caller,signal,effective.maxTokens,()=>super.summarize(input,caller,signal));
        }
        override async compactIfNeeded():Promise<null>{throw new ExecutionError('UNTRUSTED_COMPACTION_ORIGIN');}
        override async compactNow():Promise<null>{throw new ExecutionError('UNTRUSTED_COMPACTION_ORIGIN');}
    }
    const scoped=ctx.isolate('compaction').isolate('toolResultPruner');
    await scoped.plugin(RoleCompactor,{...config,auto:false,compactionRetries:0,maxOverflowRetries:0,modelPolicies:config.modelPolicies.map(x=>({...x,compactionRetries:0,maxOverflowRetries:0}))});
    let engine:RoleCompactor|undefined,capture:Context|undefined;
    await scoped.plugin({name:'role-compaction-owner',inject:['compaction','tokenMeter'],apply(c:Context){if(!(c.compaction instanceof RoleCompactor))throw new ExecutionError('COMPACTION_INSTANCE_UNCONFIRMED');engine=c.compaction;capture=c;registerNativeRecoveryOwner(c.fiber);c.on('compaction/summary-error',({session},next)=>session===agent.session?false:next(),{prepend:true});}});
    if(!engine||!capture)throw new ExecutionError('COMPACTION_INSTANCE_UNCONFIRMED');const service=original(engine),owner=engine,local=capture;
    return Object.freeze({
        observeStart(id:CompactionId){if(active){activeId=id;summarySeq=undefined;}},
        observeSummary(id:CompactionId,seq:SessionSeq){if(active&&activeId===id)summarySeq=seq;},
        observeEnd(id:CompactionId){if(activeId===id){activeId=undefined;summarySeq=undefined;}},
        acceptsCheckpoint(id:CompactionId,sources:readonly SessionSeq[]|undefined,surface:unknown){return active&&activeId===id&&summarySeq!==undefined&&!!sources?.includes(summarySeq)&&!!range&&!!surface&&typeof surface==='object'&&'op'in surface&&surface.op==='replace'&&'startSeq'in surface&&surface.startSeq===range.start&&'endSeq'in surface&&surface.endSeq===range.end;},
        async beforeStep(signal:AbortSignal){
            authority.check();if(active||original(local.compaction)!==service||local.get('toolResultPruner')!==undefined)throw new ExecutionError('COMPACTION_INSTANCE_UNCONFIRMED');
            const limits=await authority.parameters(),effective=policy(owner.config,contextWindow,limits.outputTokens),measurement=local.tokenMeter.measure(agent.session),threshold=Math.floor(Math.min(contextWindow*effective.thresholdRatio,contextWindow-limits.outputTokens-effective.headroomTokens));
            if(measurement.totalTokens<threshold)return;
            const events=agent.session.snapshotEvents(),bySeq=new Map(events.map(x=>[x.seq,x]));let cutoff=measurement.nodes.length,retained=0;while(cutoff>0&&retained<effective.retainTokens)retained+=measurement.nodes[--cutoff]!.tokens;
            for(let start=0;start<cutoff;start++){
                const first=bySeq.get(measurement.nodes[start]!.seq);if(first?.type!=='assistant/message'||protectedMessages.has(first.data.message.id))continue;
                const calls=first.data.message.content.filter(x=>x.type==='tool-call');if(!calls.length)continue;const expected=new Set(calls.map(x=>x.id));if(expected.size!==calls.length)continue;const seen=new Set<typeof calls[number]['id']>();
                for(let end=start+1;end<cutoff;end++){
                    const last=bySeq.get(measurement.nodes[end]!.seq);if(last?.type!=='tool/result'||protectedMessages.has(last.data.message.id)||!expected.has(last.data.message.toolCallId)||seen.has(last.data.message.toolCallId))break;seen.add(last.data.message.toolCallId);
                    if(seen.size!==expected.size)continue;
                    range={start:first.seq,end:last.seq};active=true;summaryCalls=0;
                    try{await owner.compactRegion(range.start,range.end,agent,signal);}finally{active=false;activeId=undefined;summarySeq=undefined;range=undefined;}
                    return;
                }
            }
        }
    });
}
export interface RoleCompactionPort {
    beforeStep(signal:AbortSignal):Promise<void>;
    observeStart(id:CompactionId):void;observeSummary(id:CompactionId,seq:SessionSeq):void;observeEnd(id:CompactionId):void;
    acceptsCheckpoint(id:CompactionId,sources:readonly SessionSeq[]|undefined,surface:unknown):boolean;
}
