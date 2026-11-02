import type {ContextSnapshotReader,ContextSnapshotBasis,ContextSourceBasis,ContextSource,ContextSourceRef,ContextSourceConstraint} from '../home/context-snapshot.ts';
import { type RoleId, type InputId, type ExperienceId, type HomeRevision, type CoreVersion, type ContextGeneration } from '../home/ids.ts';
import type { HomeSnapshot } from '../home/index.ts';
import type { TurnRecord } from '../home/turns.ts';
export interface ContextAllocation {readonly contextWindow:number;readonly outputLimit:number;}
export interface ContextMeasurement {readonly kind:'required-estimate'|'adapter-allocation'|'actual-request-bytes';readonly contextWindow:number;readonly outputReserve:number;readonly framingReserve:number;readonly toolsAndMessagesBytes:number;}
export function contextMeasurement(kind:ContextMeasurement['kind'],allocation:ContextAllocation,bytes:number):ContextMeasurement{if(!Number.isSafeInteger(allocation.contextWindow)||allocation.contextWindow<=0||!Number.isSafeInteger(allocation.outputLimit)||allocation.outputLimit<1||!Number.isSafeInteger(bytes)||bytes<0)throw new ContextError('CONTEXT_CAPACITY');return {kind,contextWindow:allocation.contextWindow,outputReserve:allocation.outputLimit,framingReserve:2048,toolsAndMessagesBytes:bytes};}
export const isContextInvalidation=(code:string):boolean=>['CONTEXT_STALE','CONTEXT_SNAPSHOT_STALE','CONTEXT_SOURCE_CHANGED'].includes(code);
export class ContextError extends Error {constructor(readonly code:string){super(code);}}
export interface ContextFrame {
    readonly roleId:RoleId;readonly revision:HomeRevision;readonly contextGeneration:ContextGeneration;readonly core:string;
    readonly history:readonly ContextSource[];
    readonly inputs:readonly {readonly inputId:InputId;readonly experienceId:ExperienceId;readonly text:string;readonly history?:{readonly reportedAt:string|null;readonly receivedAt:string}}[];
    readonly manifest:{readonly snapshot:ContextSnapshotBasis;readonly sources:readonly ContextSourceBasis[];readonly coreVersion:CoreVersion;readonly inputIds:readonly InputId[];readonly granted:readonly ContextSourceRef[];readonly measurement:ContextMeasurement;readonly retrieval:'local-lexical';readonly purpose:'daily'|'history';readonly selected:readonly ContextSourceRef[];readonly constraints:readonly ContextSourceConstraint[];readonly omitted:readonly {readonly ref:ContextSourceRef;readonly reason:'no-match'|'capacity'|'covered'|'current-input'|'replaced'}[]};
}
const normalized=(text:string)=>text.normalize('NFKC').toLocaleLowerCase('en-US');
function terms(text:string):readonly string[]{const parts=normalized(text).match(/[\p{Script=Han}]+|[\p{Letter}\p{Number}_-]+/gu)??[];return [...new Set(parts.flatMap(part=>/\p{Script=Han}/u.test(part)?[part,...Array.from({length:Math.max(0,part.length-1)},(_,index)=>part.slice(index,index+2))]:[part]))];}
const refKey=(ref:ContextSourceRef)=>JSON.stringify(ref);
const sourceRoot=(source:ContextSource)=>'runId'in source&&source.runId?'run:'+source.runId:refKey(source.ref);
const sourceOrder=(source:ContextSource)=>source.ref.kind==='input'?0:source.ref.kind==='tool'?1:2;
function unitRoots(sources:readonly ContextSource[],constraints:readonly ContextSourceConstraint[]):Map<string,string>{
    const roots=new Map(sources.map(source=>[refKey(source.ref),sourceRoot(source)])),parent=new Map(sources.map(source=>[sourceRoot(source),sourceRoot(source)]));
    const find=(root:string):string=>{let current=root;while(parent.get(current)!==current)current=parent.get(current)!;return current;};
    for(const constraint of constraints){const linked=[constraint.target,...constraint.required].flatMap(ref=>roots.has(refKey(ref))?[find(roots.get(refKey(ref))!)]:[]);for(const root of linked.slice(1)){const left=find(root),right=find(linked[0]!);parent.set(left>right?left:right,left>right?right:left);}}
    return new Map([...roots].map(([ref,root])=>[ref,find(root)]));
}
export async function searchContextSources(reader:ContextSnapshotReader,query:string,exclude:readonly ContextSourceRef[]=[]):Promise<{readonly sources:readonly ContextSource[];readonly constraints:readonly ContextSourceConstraint[];readonly omitted:ContextFrame['manifest']['omitted']}>{
    const queryTerms=terms(query),omitted:ContextFrame['manifest']['omitted'][number][]=[],all:ContextSource[]=[],constraints=await reader.constraints(),metadata=await reader.list();
    const seen=new Set<string>();for(const source of metadata)if(source.ref.kind!=='core'&&!seen.has(refKey(source.ref))){seen.add(refKey(source.ref));all.push(await reader.read(source.ref));}
    for(const constraint of constraints){if(!['correction','replacement','provenance'].includes(constraint.kind)||constraint.target.kind==='core'||!constraint.required.length)throw new ContextError('CONTEXT_INVALID_CONSTRAINT');for(const ref of [constraint.target,...constraint.required])if(!metadata.some(source=>refKey(source.ref)===refKey(ref)))throw new ContextError('CONTEXT_REQUIRED_SOURCE_UNAVAILABLE');}
    const roots=unitRoots(all,constraints),groups=new Map<string,ContextSource[]>(),replaced=reader.purpose==='daily'?new Set(constraints.filter(constraint=>constraint.kind==='replacement').flatMap(constraint=>all.filter(source=>refKey(source.ref)===refKey(constraint.target)).map(source=>sourceRoot(source)))):new Set<string>();
    for(const source of all){const root=roots.get(refKey(source.ref))!,group=groups.get(root)??[];group.push(source);groups.set(root,group);}
    const unitOrder=new Map<string,number>();for(const source of all)if(source.ref.kind==='input'&&'receiveSequence'in source)unitOrder.set(sourceRoot(source),Math.min(unitOrder.get(sourceRoot(source))??Number.MAX_SAFE_INTEGER,source.receiveSequence));
    const ranked:{sources:ContextSource[];root:string;score:readonly number[]}[]=[],selectedConstraints:ContextSourceConstraint[]=[];
    for(const[root,sources]of groups){
        const candidates=sources.filter(source=>!exclude.some(ref=>refKey(ref)===refKey(source.ref))),body=normalized(candidates.map(source=>source.text).join('\n')),sourceTerms=new Set(terms(body));
        const exact=candidates.some(source=>source.ref.kind!=='core'&&normalized(query).includes(normalized(source.ref.id)))?1:0,phrase=queryTerms.filter(term=>term.length>2&&body.includes(term)).length,coverage=queryTerms.filter(term=>sourceTerms.has(term)).length;
        const payload=sources.filter(source=>{const reason=exclude.some(ref=>refKey(ref)===refKey(source.ref))?'current-input':replaced.has(sourceRoot(source))?'replaced':null;if(reason){omitted.push({ref:source.ref,reason});return false;}return true;});
        if(!exact&&!phrase&&!coverage){omitted.push(...payload.map(source=>({ref:source.ref,reason:'no-match' as const})));continue;}
        selectedConstraints.push(...constraints.filter(constraint=>[constraint.target,...constraint.required].some(ref=>roots.get(refKey(ref))===root)));
        payload.sort((a,b)=>(unitOrder.get(sourceRoot(a))??Number.MAX_SAFE_INTEGER)-(unitOrder.get(sourceRoot(b))??Number.MAX_SAFE_INTEGER)||sourceOrder(a)-sourceOrder(b)||('occurredAt'in a&&'occurredAt'in b?a.occurredAt.localeCompare(b.occurredAt):0)||refKey(a.ref).localeCompare(refKey(b.ref)));
        ranked.push({root,sources:payload,score:[exact,phrase,coverage,Math.max(...sources.map(source=>Date.parse('occurredAt'in source?source.occurredAt:'1970-01-01')))]});
    }
    ranked.sort((a,b)=>{for(let index=0;index<a.score.length;index++){const difference=b.score[index]!-a.score[index]!;if(difference)return difference;}return a.root.localeCompare(b.root);});
    return {sources:ranked.flatMap(item=>item.sources),constraints:selectedConstraints,omitted};
}
/** Whole raw source units keep qualifiers and tool pairs intact. No index is another authority. */
export async function prepareCharacterContext(snapshot:HomeSnapshot,turn:TurnRecord,route:ContextAllocation,reader:ContextSnapshotReader):Promise<ContextFrame> {
    if(snapshot.contextGeneration!==turn.contextGeneration)throw new ContextError('CONTEXT_STALE');
    const inputs=turn.inputIds.map(id=>{const x=snapshot.inputs.find(x=>x.inputId===id);if(!x||x.status!=='running'||x.bindingId!==turn.bindingId||x.bindingVersion!==turn.bindingVersion)throw new ContextError('INPUT_SCOPE_CHANGED');return {inputId:x.inputId,experienceId:x.experienceId,text:x.text,...(x.origin==='history'?{history:{reportedAt:x.historySource?.reportedAt??null,receivedAt:x.receivedAt}}:{})};});
    if(reader.purpose==='management'||reader.basis.roleId!==snapshot.roleId||reader.basis.contextGeneration!==snapshot.contextGeneration||reader.basis.runId!==turn.runId)throw new ContextError('CONTEXT_STALE');
    const metadata=await reader.list(),granted=[...new Map(metadata.map(source=>[refKey(source.ref),source.ref])).values()];
    const {sources:history,omitted,constraints}=await searchContextSources(reader,turn.source==='autonomous'?[snapshot.core.text,...metadata.flatMap(source=>source.ref.kind==='knowledge'&&'current'in source&&source.current&&'topic'in source?[source.topic]:[])].join('\n'):inputs.map(input=>input.text).join('\n'),turn.inputIds.map(id=>({kind:'input',id})));
    const requiredBytes=Buffer.byteLength(JSON.stringify({core:snapshot.core.text,inputs}),'utf8'),measurement=contextMeasurement('required-estimate',route,requiredBytes);
    const selected:ContextSourceRef[]=[{kind:'core'},...inputs.map(input=>({kind:'input' as const,id:input.inputId})),...history.map(source=>source.ref)],sources=selected.map(ref=>{const source=metadata.find(source=>refKey(source.ref)===refKey(ref));if(!source)throw new ContextError('CONTEXT_REQUIRED_SOURCE_UNAVAILABLE');return {ref,contentDigest:source.contentDigest};});
    const frame:ContextFrame={roleId:snapshot.roleId,revision:reader.basis.revision,contextGeneration:snapshot.contextGeneration,core:snapshot.core.text,inputs,history,manifest:{snapshot:reader.basis,sources,coreVersion:snapshot.core.version,inputIds:turn.inputIds,granted,measurement,retrieval:'local-lexical',purpose:reader.purpose,constraints,selected,omitted}};
    // UTF-8 bytes are a conservative allocation, including a framing reserve. Required material is never clipped.
    if(requiredBytes+measurement.outputReserve+measurement.framingReserve>measurement.contextWindow)throw new ContextError('CONTEXT_CAPACITY');
    await reader.check(frame.manifest.selected);
    for(const input of frame.inputs)Object.freeze(input);Object.freeze(frame.inputs);Object.freeze(frame.manifest.inputIds);Object.freeze(frame.manifest);return Object.freeze(frame);
}

/** The adapter measures the actual registered tools and final message shape before initial admission. */
export function fitCharacterContext(frame:ContextFrame,measure:(frame:ContextFrame)=>number,allocation:ContextAllocation):ContextFrame{
    let history=[...frame.history],omitted=[...frame.manifest.omitted];
    const project=():ContextFrame=>{const selected=frame.manifest.selected.filter(ref=>!frame.history.some(source=>refKey(source.ref)===refKey(ref))||history.some(source=>refKey(source.ref)===refKey(ref)));return {...frame,history,manifest:{...frame.manifest,selected,sources:frame.manifest.sources.filter(source=>selected.some(ref=>refKey(source.ref)===refKey(ref))),omitted}};};
    while(measure(project())+allocation.outputLimit+2048>allocation.contextWindow){const last=history.at(-1);if(!last)throw new ContextError('CONTEXT_CAPACITY');const roots=unitRoots(history,frame.manifest.constraints),root=roots.get(refKey(last.ref)),removed=history.filter(source=>roots.get(refKey(source.ref))===root);history=history.filter(source=>roots.get(refKey(source.ref))!==root);omitted.push(...removed.map(source=>({ref:source.ref,reason:'capacity' as const})));}
    const fitted=project();return {...fitted,manifest:{...fitted.manifest,measurement:contextMeasurement('adapter-allocation',allocation,measure(fitted))}};
}
