import type {SessionId} from '@deepseek-ai/dsh-session/types';
import type {Context} from '@deepseek-ai/cordis';
import type {Agent} from '@deepseek-ai/dsh-agent';
import type {} from '@deepseek-ai/dsh-llm';
import type {} from '@deepseek-ai/dsh-tools';
import type {ToolExecution} from '@deepseek-ai/dsh-tools';
import {registerNativeStreamOwner} from './native-composition.ts';
/** Persisted technical ownership is deny-only. It never issues a run capability. */
export const WORK_SESSION_PREFIX='dsh-role-companion-';
export const WORK_SESSION_PRESET='dsh-role-companion-work-v1';
const issued=new WeakMap<Agent,{readonly owner:object;readonly guard?:(exec:Readonly<ToolExecution>,caller:Agent|undefined)=>string|undefined}>();
const legacyDenied=new Set<SessionId>();
const fencedRoots=new WeakSet<object>();
export function registerNativeOwner(agent:Agent,owner:object,guard?:(exec:Readonly<ToolExecution>,caller:Agent|undefined)=>string|undefined){issued.set(agent,{owner,...(guard?{guard}:{})});}
export function revokeNativeOwner(agent:Agent,owner:object){if(issued.get(agent)?.owner===owner)issued.delete(agent);}
export function restoreDeniedSessions(ids:readonly SessionId[]){for(const id of ids)if(!id.startsWith(WORK_SESSION_PREFIX))legacyDenied.add(id);}
const technicalId=(id:SessionId|undefined)=>!!id&&(id.startsWith(WORK_SESSION_PREFIX)||legacyDenied.has(id));
function technical(agent:Agent|undefined){return !!agent&&(technicalId(agent.id)||agent.session.header.agentPreset===WORK_SESSION_PRESET);}
export function installNativeOwnershipFence(ctx:Context){
    if(fencedRoots.has(ctx.root))return;fencedRoots.add(ctx.root);
    registerNativeStreamOwner(ctx.fiber);
    ctx.effect(function*(){
        yield ()=>{fencedRoots.delete(ctx.root);};
        yield ctx.on('agent/pre-step',async({agent},next)=>technical(agent)&&!issued.has(agent)?{kind:'reject'}:next(),{prepend:true,global:true});
        yield ctx.on('llm/stream',(options,next)=>{
            const actor=ctx.get('agents')?.currentInitiator();
            // A live private owner only delegates to the narrower run gate. Metadata grants nothing.
            if(actor&&issued.has(actor))return next();
            const associated=options.sessionId?ctx.get('agents')?.get(options.sessionId):undefined;
            if(technical(actor)||technical(associated)||technicalId(options.sessionId))throw Object.assign(new Error('NATIVE_SCOPE_CLOSED'),{code:'NATIVE_SCOPE_CLOSED'});
            return next();
        },{prepend:true,global:true});
        const guards=ctx.inject(['tools'],c=>{c.tools.guard(exec=>{const caller=c.get('agents')?.currentInitiator();if(!technical(exec.agent)&&!technical(caller))return undefined;const owner=caller?issued.get(caller):undefined;if(!owner||caller!==exec.agent||!owner.guard)return '角色工具没有当前可信许可。';return owner.guard(exec,caller);});});
        yield guards.dispose;
    },'role-native: persistent technical deny fence');
}
