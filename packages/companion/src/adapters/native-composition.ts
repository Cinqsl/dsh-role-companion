import * as fsSearch from '@deepseek-ai/dsh-tool-fs-search';
import {BasicCompactionEngine} from '@deepseek-ai/dsh-compaction-basic';
import type {Context,Fiber,EffectMeta} from '@deepseek-ai/cordis';
import {ExecutionError} from '../runtime/execution.ts';
const nativeOwners=new WeakSet<Fiber>();
export function registerNativePostOwner(owner:Fiber):void{nativeOwners.add(owner);}
const recoveryOwners=new WeakSet<Fiber>();
export function registerNativeRecoveryOwner(owner:Fiber):void{recoveryOwners.add(owner);}
export const recoveryEvents=new Set(['agent/request-error','compaction/summary-error']);
const recoveryLabels=new Set([...recoveryEvents].map(name=>'ctx.on("'+name+'")'));
// These pinned recovery policies cannot recover this role's text-only request
// ahead of its own owner: normal provider retry is separately required to be 0.
const approvedRecoveryEntries=new Set(['@deepseek-ai/dsh-llm-retry','@deepseek-ai/dsh-compaction-basic','@deepseek-ai/dsh-compaction-image-offload']);
export function approvedRecoveryOwner(ctx:Context,owner:Fiber,native:Fiber):boolean{
    return owner===native||recoveryOwners.has(owner)||owner.runtime===ctx.registry.get(BasicCompactionEngine)||ctx.configEditor.entries().some(entry=>approvedRecoveryEntries.has(entry.options.name)&&entry.fiber===owner);
}
export function assertNativeRecoveryComposition(ctx:Context,native:Fiber):void{
    const contains=(effects:readonly EffectMeta[]):boolean=>effects.some(x=>recoveryLabels.has(x.label??'')||contains(x.children));
    const fibers=new Set<Fiber>([ctx.root.fiber]);for(const runtime of ctx.registry.values())for(const fiber of runtime.fibers)fibers.add(fiber);
    for(const fiber of fibers)if(contains(fiber.getEffects())&&!approvedRecoveryOwner(ctx,fiber,native))throw new ExecutionError('NATIVE_RECOVERY_COMPOSITION_UNPROVEN');
}
const streamOwners=new WeakSet<Fiber>();
export function registerNativeStreamOwner(owner:Fiber):void{streamOwners.add(owner);}
const approvedStreamEntries=new Set(['@deepseek-ai/dsh-session-checkpoint-policy','@deepseek-ai/dsh-session-title']);
export function approvedStreamOwner(ctx:Context,owner:Fiber,native:Fiber):boolean{return owner===native||streamOwners.has(owner)||ctx.configEditor.entries().some(entry=>approvedStreamEntries.has(entry.options.name)&&entry.fiber===owner);}
/** Unknown inner wrappers may call next twice beneath a one-use outer permit. */
export function assertNativeStreamComposition(ctx:Context,native:Fiber):void{
    const contains=(effects:readonly EffectMeta[]):boolean=>effects.some(x=>x.label==='ctx.on("llm/stream")'||contains(x.children));
    const fibers=new Set<Fiber>([ctx.root.fiber]);for(const runtime of ctx.registry.values())for(const fiber of runtime.fibers)fibers.add(fiber);
    for(const fiber of fibers)if(contains(fiber.getEffects())&&!approvedStreamOwner(ctx,fiber,native))throw new ExecutionError('NATIVE_STREAM_COMPOSITION_UNPROVEN');
}
const postLabel='ctx.on("tools/post-execute")';
// These pinned SDK policies have been read at 0.2.1-rc.3: only the spill policy
// writes for role_read. The exact-name search policies ignore it; the reminder
// adds context only. No name supplied by a model participates in this check.
const approvedPostEntries=new Set(['@deepseek-ai/dsh-spill-policy','@deepseek-ai/dsh-tool-fs-search','@deepseek-ai/dsh-repeat-tool-reminder']);
// BrowserSkill 0.3.3 awaits next() and only blocks its own failed skill load.
// Require both loader id and package so this does not approve arbitrary listeners.
const browserSkillPostEntry={id:'browserskill',name:'@wxg-prc-cpg/browser-skill-dsh-plugin'};
const containsPost=(effects:readonly EffectMeta[]):boolean=>effects.some(x=>x.label===postLabel||containsPost(x.children));
export function approvedPostEntry(id:unknown,name:unknown):boolean{
    return approvedPostEntries.has(String(name))||(id===browserSkillPostEntry.id&&name===browserSkillPostEntry.name);
}
export function approvedPostOwner(ctx:Context,owner:Fiber,native:Fiber):boolean{
    if(owner===native||nativeOwners.has(owner))return true;
    if(owner.runtime===ctx.registry.get(fsSearch))return true;
    return ctx.configEditor.entries().some(entry=>approvedPostEntry(entry.options.id,entry.options.name)&&entry.fiber===owner);
}
/** Public live effect metadata covers handlers installed before this adapter. */
export function assertNativePostComposition(ctx:Context,native:Fiber):void{
    const fibers=new Set<Fiber>([ctx.root.fiber]);
    for(const runtime of ctx.registry.values())for(const fiber of runtime.fibers)fibers.add(fiber);
    for(const fiber of fibers)if(containsPost(fiber.getEffects())&&!approvedPostOwner(ctx,fiber,native))throw new ExecutionError('NATIVE_POST_COMPOSITION_UNPROVEN');
}
