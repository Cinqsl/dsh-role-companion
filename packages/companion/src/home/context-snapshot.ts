import {activeKnowledgeVersions,knowledgeSourceRequirements,rollbackKnowledgePair} from './knowledge-owner.ts';
import type {QQHistorySource} from './qq-history.ts';
import {createContextLineage,contextBindingAllowed} from './context-lineage.ts';
import {contextToolParts} from './context-tools.ts';
import {contextTextDigest as digest} from './context-digest.ts';
import {InputId,ReplyId,AttemptId,KnowledgeId,KnowledgeVersion,type RunId,type RoleId,type HomeRevision,type CoreVersion,type ContextGeneration,type ExperienceId,type BindingId,type BindingVersion} from './ids.ts';
import {HomeError} from './errors.ts';
import type {HomeSnapshot} from './index.ts';
import type {ConversationState,AttemptRecord} from './turns.ts';

/** Trusted Home callers choose the purpose. It is never a model query flag. */
export type ContextReaderRequest={readonly purpose:'management'}|{readonly purpose:'daily'|'history';readonly runId:RunId};
export type ContextSourceRef={readonly kind:'core'}|{readonly kind:'input';readonly id:InputId}|{readonly kind:'reply';readonly id:ReplyId}|{readonly kind:'tool';readonly id:AttemptId}|{readonly kind:'knowledge';readonly id:KnowledgeId;readonly version:KnowledgeVersion};
export interface ContextSnapshotBasis {readonly roleId:RoleId;readonly revision:HomeRevision;readonly contextGeneration:ContextGeneration;readonly coreVersion:CoreVersion;readonly runId?:RunId;}
export interface ContextSourceBasis {readonly ref:ContextSourceRef;readonly contentDigest:string;readonly committedRevision?:HomeRevision;readonly currentRun?:{readonly runId:RunId;readonly initialRevision:HomeRevision};}
export interface CurrentToolSourceRequest {readonly roleId:RoleId;readonly runId:RunId;readonly contextGeneration:ContextGeneration;readonly initialRevision:HomeRevision;readonly attemptId:AttemptId;readonly purpose:'daily'|'history';}
export interface CurrentToolSource {readonly source:ToolContextSource;readonly observedRevision:HomeRevision;}
export interface ContextSourceLineage {readonly dependencies:readonly ContextSourceRef[];readonly dataOrigins:readonly ContextSourceRef[];readonly modelAttempts:readonly AttemptId[];readonly lineage:'known'|'scope-bounded'|'unavailable';readonly derivedRead:boolean;readonly availableForDaily:boolean;}
interface SourceContent extends ContextSourceLineage {readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker;readonly text:string;readonly contentDigest:string;readonly completeness:'complete'|'gap';}
export interface CoreContextSource extends SourceContent {readonly ref:{readonly kind:'core'};readonly speaker:'owner';readonly coreVersion:CoreVersion;}
export interface InputContextSource extends SourceContent {
    readonly ref:{readonly kind:'input';readonly id:InputId};readonly speaker:'user';readonly experienceId:ExperienceId;readonly runId:RunId|null;readonly receiveSequence:number;
    readonly binding:{readonly bindingId:BindingId;readonly bindingVersion:BindingVersion};readonly occurredAt:string;
    readonly committedRevision:HomeRevision;
    /** Historical origin does not authorize the separate history-reader purpose. */
    readonly origin?:'history';readonly reportedAt?:string|null;readonly receivedAt?:string;readonly timeKind?:'admission';readonly historySource?:QQHistorySource;
}
export interface ReplyContextSource extends SourceContent {
    readonly ref:{readonly kind:'reply';readonly id:ReplyId};readonly speaker:'role';readonly experienceId:ExperienceId;
    readonly binding:{readonly bindingId:BindingId;readonly bindingVersion:BindingVersion};readonly occurredAt:string;readonly timeKind:'turn-start';
    readonly runId:RunId;readonly inputIds:readonly InputId[];readonly committedRevision:HomeRevision;
    readonly evidence:'generated-output-not-delivery-or-truth';
}
export interface ToolContextSource extends SourceContent {
    readonly ref:{readonly kind:'tool';readonly id:AttemptId};readonly speaker:'tool';readonly committedRevision?:HomeRevision;readonly currentRun?:{readonly runId:RunId;readonly initialRevision:HomeRevision};readonly toolName:string;readonly runId:RunId;
    readonly binding:{readonly bindingId:BindingId;readonly bindingVersion:BindingVersion};readonly occurredAt:string;readonly timeKind:'observation'|'reservation';
    readonly canonicalStatus:'success'|'error'|'unavailable';readonly evidence:'tool-result-not-world-truth';
}
export interface KnowledgeContextSource extends SourceContent {readonly ref:{readonly kind:'knowledge';readonly id:KnowledgeId;readonly version:KnowledgeVersion};readonly speaker:'role'|'owner';readonly knowledgeKind:import('./knowledge.ts').KnowledgeProposal['kind'];readonly statement:import('./knowledge.ts').KnowledgeProposal['statement'];readonly topic:string;readonly scope:string;readonly current:boolean;readonly committedRevision:HomeRevision;readonly evidence:'adopted-content-with-provenance-not-world-truth'|'owner-selected-body-with-later-corrections';}
export type ContextSource=CoreContextSource|InputContextSource|ReplyContextSource|ToolContextSource|KnowledgeContextSource;
export type ContextSourceMetadata=Omit<CoreContextSource,'text'>|Omit<InputContextSource,'text'>|Omit<ReplyContextSource,'text'>|Omit<ToolContextSource,'text'>|Omit<KnowledgeContextSource,'text'>;
export interface ContextSourceConstraint {readonly kind:'correction'|'replacement'|'provenance';readonly target:ContextSourceRef;readonly required:readonly ContextSourceRef[];}
export interface ContextSnapshotReader {
    readonly purpose:'management'|'daily'|'history';readonly basis:ContextSnapshotBasis;
    list():Promise<readonly ContextSourceMetadata[]>;
    constraints():Promise<readonly ContextSourceConstraint[]>;
    read(ref:ContextSourceRef):Promise<ContextSource>;
    check(refs?:readonly ContextSourceRef[]):Promise<void>;
    revoke():void;
}
function key(ref:ContextSourceRef):string {
    if(ref?.kind==='core'&&Object.keys(ref).join('|')==='kind')return 'core';
    if(ref?.kind==='input'&&Object.keys(ref).sort().join('|')==='id|kind')return 'input:'+InputId(ref.id);
    if(ref?.kind==='reply'&&Object.keys(ref).sort().join('|')==='id|kind')return 'reply:'+ReplyId(ref.id);
    if(ref?.kind==='tool'&&Object.keys(ref).sort().join('|')==='id|kind')return 'tool:'+AttemptId(ref.id);
    if(ref?.kind==='knowledge'&&Object.keys(ref).sort().join('|')==='id|kind|version'&&ref.version>0)return 'knowledge:'+KnowledgeId(ref.id)+':'+KnowledgeVersion(ref.version);
    throw new HomeError('INVALID_CONTEXT_SOURCE');
}
type ToolContextBody=Omit<ToolContextSource,keyof ContextSourceLineage>;
type ContextSourceBody=Omit<CoreContextSource,keyof ContextSourceLineage>|Omit<InputContextSource,keyof ContextSourceLineage>|Omit<ReplyContextSource,keyof ContextSourceLineage>|ToolContextBody|Omit<KnowledgeContextSource,keyof ContextSourceLineage>;
function toolSource(attempt:AttemptRecord,conversation:ConversationState):ToolContextBody {
    const {turn,request,name,final,canonical,complete}=contextToolParts(attempt,conversation),completeness=complete?'complete':'gap';
    const text=JSON.stringify({provenance:'historical-tool-record',completeness,request:typeof name==='string'?{name,arguments:request&&typeof request==='object'&&'arguments'in request?request.arguments:undefined}:null,observation:attempt.observation??null,final:canonical?final:{canonicalValue:'unavailable'},materials:attempt.materials??[]});
    return {ref:{kind:'tool',id:attempt.attemptId},speaker:'tool',toolName:typeof name==='string'?name:'unknown',runId:attempt.runId,binding:{bindingId:turn.bindingId,bindingVersion:turn.bindingVersion},occurredAt:attempt.observation?.observedAt??attempt.reservedAt,timeKind:attempt.observation?'observation':'reservation',canonicalStatus:canonical?final!.isError?'error':'success':'unavailable',evidence:'tool-result-not-world-truth',text,contentDigest:digest(text),completeness,...(attempt.cleanup?{cleanup:attempt.cleanup}:{})};
}
/** A derived content stamp, checked only against Home facts; it is not another revision owner. */
export function contextSourceDigest(snapshot:HomeSnapshot,conversation:ConversationState,ref:ContextSourceRef):string|undefined {
    key(ref);
    if(ref.kind==='core')return digest(snapshot.core.text);
    if(ref.kind==='knowledge'){const record=conversation.knowledge.versions.find(record=>record.knowledgeId===ref.id&&record.version===ref.version);return record?digest(JSON.stringify(record)):undefined;}
    if(ref.kind==='input'){const input=snapshot.inputs.find(input=>input.inputId===ref.id);return input?digest(input.text):undefined;}
    if(ref.kind==='reply'){const reply=conversation.replies.find(reply=>reply.replyId===ref.id);return reply?digest(reply.text):undefined;}
    const attempt=conversation.attempts.find(attempt=>attempt.attemptId===ref.id&&attempt.kind==='tool');return attempt?toolSource(attempt,conversation).contentDigest:undefined;
}
/** Keep the owner archive intact while model reads show only still-qualified citations and explicit gaps. */
function modelKnowledgeBody(snapshot:HomeSnapshot,conversation:ConversationState,source:ContextSourceBody,qualified:ContextSourceLineage,purpose:ContextReaderRequest['purpose']):ContextSourceBody {
 const ref=source.ref;if(purpose==='management'||ref.kind!=='knowledge')return source;
 const record=conversation.knowledge.versions.find(record=>record.knowledgeId===ref.id&&record.version===ref.version)!;
 const cleanup=(ref:ContextSourceRef)=>ref.kind==='input'?snapshot.inputs.find(input=>input.inputId===ref.id)?.cleanup:ref.kind==='reply'?conversation.replies.find(reply=>reply.replyId===ref.id)?.cleanup:ref.kind==='tool'?conversation.attempts.find(attempt=>attempt.attemptId===ref.id)?.cleanup:ref.kind==='knowledge'?conversation.knowledge.versions.find(record=>record.knowledgeId===ref.id&&record.version===ref.version)?.cleanup:undefined;
 const removed=record.sources.filter(source=>cleanup(source.ref)||qualified.availableForDaily&&!qualified.dependencies.some(ref=>key(ref)===key(source.ref)));
 if(!removed.length)return source;
 return {...source,text:JSON.stringify({...record,sources:record.sources.filter(source=>!removed.includes(source)),cleanedSources:removed.map(source=>({ref:source.ref,...(cleanup(source.ref)?{cleanup:cleanup(source.ref)}:{reason:'source-unavailable'})})),sourceUse:'Retained memory; removed original sources cannot be verified or cited as complete evidence'})};
}
/** Private fixed content plus live Home validation; no writable Home or disk handle escapes. */
export function createContextSnapshotReader(snapshot:HomeSnapshot,conversation:ConversationState,request:ContextReaderRequest,validate:(sources:readonly ContextSourceBasis[])=>Promise<void>):ContextSnapshotReader {
    const turn=request.purpose!=='management'?conversation.turns.find(turn=>turn.runId===request.runId&&turn.status==='running'):undefined;
    const bindingAllowed=(bindingId:BindingId,version:BindingVersion)=>contextBindingAllowed(snapshot,bindingId,version);
    if(request.purpose!=='management'&&(!turn||!bindingAllowed(turn.bindingId,turn.bindingVersion)))throw new HomeError('CONTEXT_RUN_NOT_ACTIVE');
    if(request.purpose==='history'&&!turn!.inputIds.some(id=>snapshot.inputs.some(input=>input.inputId===id&&input.contextPurpose==='history'&&input.channel===undefined)))throw new HomeError('HISTORY_NOT_REQUESTED');
    const inputs=snapshot.inputs.filter(input=>request.purpose==='management'||(request.purpose==='history'||bindingAllowed(input.bindingId,input.bindingVersion))&&(input.status==='resolved'||input.status==='running'&&turn?.inputIds.includes(input.inputId)));
    const replies=conversation.replies.filter(reply=>request.purpose!=='daily'||bindingAllowed(reply.bindingId,reply.bindingVersion));
    const basis=Object.freeze({roleId:snapshot.roleId,revision:snapshot.revision,contextGeneration:snapshot.contextGeneration,coreVersion:snapshot.core.version,...(turn?{runId:turn.runId}:{})});
    const bodies:ContextSourceBody[]=[{ref:{kind:'core'},speaker:'owner',coreVersion:snapshot.core.version,text:snapshot.core.text,contentDigest:digest(snapshot.core.text),completeness:'complete'},
        ...conversation.knowledge.versions.map((record):Omit<KnowledgeContextSource,keyof ContextSourceLineage>=>({ref:{kind:'knowledge',id:record.knowledgeId,version:record.version},speaker:record.ownerAction?'owner':'role',knowledgeKind:record.kind,statement:record.statement,topic:record.topic,scope:record.scope,current:!conversation.knowledge.versions.some(other=>other.knowledgeId===record.knowledgeId&&other.version>record.version),committedRevision:record.committedRevision,evidence:record.ownerAction?'owner-selected-body-with-later-corrections':'adopted-content-with-provenance-not-world-truth',text:JSON.stringify(record),contentDigest:digest(JSON.stringify(record)),completeness:record.cleanup?'gap':'complete',...(record.cleanup?{cleanup:record.cleanup}:{})})),
        ...inputs.map(input=>({ref:{kind:'input' as const,id:input.inputId},speaker:'user' as const,experienceId:input.experienceId,receiveSequence:input.receiveSequence,runId:conversation.turns.find(turn=>turn.inputIds.includes(input.inputId))?.runId??null,binding:{bindingId:input.bindingId,bindingVersion:input.bindingVersion},occurredAt:input.receivedAt,...(input.origin==='history'?{origin:'history' as const,reportedAt:input.historySource!.reportedAt,receivedAt:input.receivedAt,timeKind:'admission' as const,historySource:structuredClone(input.historySource!)}:{}),committedRevision:input.committedRevision,text:input.text,contentDigest:digest(input.text),completeness:input.cleanup?'gap' as const:'complete' as const,...(input.cleanup?{cleanup:input.cleanup}:{})})),
        ...replies.map((reply):Omit<ReplyContextSource,keyof ContextSourceLineage>=>{const turn=conversation.turns.find(turn=>turn.runId===reply.runId);if(!turn)throw new HomeError('CONTEXT_SOURCE_INCOMPLETE');return {ref:{kind:'reply',id:reply.replyId},speaker:'role',experienceId:reply.experienceId,binding:{bindingId:reply.bindingId,bindingVersion:reply.bindingVersion},occurredAt:turn.startedAt,timeKind:'turn-start',runId:reply.runId,inputIds:[...reply.inputIds],committedRevision:reply.committedRevision,evidence:'generated-output-not-delivery-or-truth',text:reply.text,contentDigest:digest(reply.text),completeness:reply.cleanup?'gap':'complete',...(reply.cleanup?{cleanup:reply.cleanup}:{})};}),
        ...conversation.attempts.filter(attempt=>attempt.kind==='tool').map(attempt=>toolSource(attempt,conversation)).filter(source=>request.purpose!=='daily'||source.completeness==='complete'&&bindingAllowed(source.binding.bindingId,source.binding.bindingVersion)).map(source=>{if(request.purpose==='management')return source;const pair=JSON.parse(source.text),final=pair.final;return {...source,text:JSON.stringify({...pair,final:source.canonicalStatus==='unavailable'?{canonicalValue:'unavailable'}:final.isError?{isError:true,error:{code:typeof final.error?.info?.code==='string'?final.error.info.code:'TOOL_FAILED'}}:{isError:false,value:final.value},materials:pair.materials.map((material:Record<string,unknown>)=>({materialId:material.materialId,source:material.source,bytes:material.bytes,digest:material.digest})),projection:'model-safe: canonical content/meta and private spill locators omitted; original remains in Home'})};})];
    const lineage=createContextLineage(snapshot,conversation),allRecords:ContextSource[]=bodies.map(source=>{const qualified=lineage.describe(source.ref);return {...modelKnowledgeBody(snapshot,conversation,source,qualified,request.purpose),...qualified};}),constraintCandidates:ContextSourceConstraint[]=[];
    const dependsOn=(ref:ContextSourceRef,target:ContextSourceRef,seen=new Set<string>()):boolean=>{if(key(ref)===key(target))return true;if(seen.has(key(ref)))return false;seen.add(key(ref));return lineage.describe(ref).dependencies.some(dependency=>dependsOn(dependency,target,seen));};
    const unavailable=new Set<string>(),activeKnowledge=activeKnowledgeVersions(conversation.knowledge);
    for(const record of conversation.knowledge.versions){const target:ContextSourceRef={kind:'knowledge',id:record.knowledgeId,version:record.version},required=record.ownerAction?rollbackKnowledgePair(record,conversation.knowledge,record=>lineage.describe({kind:'knowledge',id:record.knowledgeId,version:record.version}).dependencies).filter(ref=>key(ref)!==key(target)):request.purpose==='daily'?lineage.describe(target).dependencies:knowledgeSourceRequirements(record);if(required.every(ref=>allRecords.some(source=>key(source.ref)===key(ref))))constraintCandidates.push({kind:'provenance',target,required});}
    // Pair every source which actually depends on the retained basis, including old reads/echoes.
    // Constraints may link in both directions; immutable lineage remains acyclic.
    const rollbackGroups=conversation.knowledge.versions.filter(record=>record.ownerAction&&!record.cleanup&&activeKnowledge.includes(record)&&!conversation.knowledge.versions.some(other=>other.knowledgeId===record.knowledgeId&&other.version>record.version)).map(record=>{
        if(!record.ownerAction)throw new HomeError('INVALID_KNOWLEDGE_ROLLBACK');const group=rollbackKnowledgePair(record,conversation.knowledge,record=>lineage.describe({kind:'knowledge',id:record.knowledgeId,version:record.version}).dependencies);
        return {group,affected:allRecords.filter(source=>source.ref.kind!=='core'&&group.some(ref=>ref.kind!=='core'&&dependsOn(source.ref,ref)))};
    });
    let changed=true;while(changed){changed=false;for(const {group,affected}of rollbackGroups){if(group.every(ref=>!unavailable.has(key(ref))&&allRecords.some(source=>key(source.ref)===key(ref)&&source.availableForDaily)))continue;for(const source of affected)if(!unavailable.has(key(source.ref))){unavailable.add(key(source.ref));changed=true;}}}
    for(const {group,affected}of rollbackGroups){
        if(group.some(ref=>unavailable.has(key(ref))))continue;
        for(const source of affected){const required=group.filter(ref=>key(ref)!==key(source.ref));if(required.length&&!constraintCandidates.some(c=>c.kind==='provenance'&&key(c.target)===key(source.ref)&&JSON.stringify(c.required)===JSON.stringify(required)))constraintCandidates.push({kind:'provenance',target:source.ref,required});}
    }
    for(const record of conversation.knowledge.versions){
        if(!record.relation||!activeKnowledge.includes(record))continue;
        const previous=conversation.knowledge.versions.find(old=>old.knowledgeId===record.relation!.targetId&&old.version===record.relation!.version);if(!previous)continue;
        const required:ContextSourceRef[]=[{kind:'knowledge',id:record.knowledgeId,version:record.version},...record.sources.map(source=>source.ref)],available=required.every(ref=>!unavailable.has(key(ref))&&allRecords.some(source=>key(source.ref)===key(ref)&&source.availableForDaily));
        for(const source of allRecords){if(source.ref.kind==='core'||required.some(ref=>key(ref)===key(source.ref))||!previous.sources.some(old=>old.ref.kind!=='core'&&dependsOn(source.ref,old.ref)))continue;if(!available)unavailable.add(key(source.ref));else constraintCandidates.push({kind:record.relation.kind,target:source.ref,required});}
    }
    const records=allRecords.map(source=>unavailable.has(key(source.ref))?{...source,availableForDaily:false}:source).filter(source=>request.purpose!=='daily'||source.availableForDaily);
    let revoked=false;
    const live=()=>{if(revoked)throw new HomeError('CONTEXT_SNAPSHOT_REVOKED');};
    const check=async(refs?:readonly ContextSourceRef[])=>{live();const selected=refs?refs.map(ref=>{const source=records.find(source=>key(source.ref)===key(ref));if(!source)throw new HomeError('CONTEXT_SOURCE_NOT_GRANTED');return source;}):records;await validate(selected.map(({ref,contentDigest})=>({ref,contentDigest})));live();};
    return Object.freeze({purpose:request.purpose,basis,check,revoke(){revoked=true;},
        async constraints(){await check();return structuredClone(constraintCandidates.filter(constraint=>[constraint.target,...constraint.required].every(ref=>records.some(source=>key(source.ref)===key(ref)))));},
        async list(){await check();return records.map(({text,...metadata})=>structuredClone(metadata));},
        async read(ref:ContextSourceRef){const requested=key(ref),record=records.find(record=>key(record.ref)===requested);await check(record?[ref]:[]);if(!record)throw new HomeError('CONTEXT_SOURCE_NOT_GRANTED');if(record.cleanup)throw new HomeError('CONTEXT_SOURCE_CLEANED');return structuredClone(record);}
    });
}

export interface ContextSourcePageRequest {readonly offset:number;readonly limit:number;}
export interface ContextSourcePage {readonly basis:ContextSnapshotBasis;readonly purpose:'management';readonly constraints:readonly ContextSourceConstraint[];readonly sources:readonly ContextSourceMetadata[];readonly offset:number;readonly total:number;readonly more:boolean;}
export interface ContextSourceRead {readonly ref:ContextSourceRef;readonly revision:HomeRevision;readonly contentDigest:string;readonly offset:number;readonly limit:number;}
export interface ContextSourcePart {readonly basis:ContextSnapshotBasis;readonly source:ContextSourceMetadata;readonly text:string;readonly offset:number;readonly totalCodePoints:number;readonly more:boolean;}
function pageRange(value:{readonly offset:number;readonly limit:number},maximum:number){if(!value||!Number.isSafeInteger(value.offset)||value.offset<0||!Number.isSafeInteger(value.limit)||value.limit<1||value.limit>maximum)throw new HomeError('INVALID_CONTEXT_PAGE');}
/** Management paging projects an issued capability; it creates no second stored source. */
export async function readContextSourcePage(reader:ContextSnapshotReader,page:ContextSourcePageRequest):Promise<ContextSourcePage>{
    pageRange(page,100);if(reader.purpose!=='management')throw new HomeError('INVALID_CONTEXT_PURPOSE');const sources=await reader.list();return {basis:reader.basis,purpose:'management',constraints:await reader.constraints(),sources:sources.slice(page.offset,page.offset+page.limit),offset:page.offset,total:sources.length,more:page.offset+page.limit<sources.length};
}
export async function readContextSourcePart(reader:ContextSnapshotReader,request:ContextSourceRead):Promise<ContextSourcePart>{
    pageRange(request,65536);if(reader.purpose!=='management')throw new HomeError('INVALID_CONTEXT_PURPOSE');if(request.revision!==reader.basis.revision)throw new HomeError('CONTEXT_SOURCE_CHANGED');const {text,...source}=await reader.read(request.ref);if(source.contentDigest!==request.contentDigest)throw new HomeError('CONTEXT_SOURCE_CHANGED');const points=Array.from(text);return {basis:reader.basis,source,text:points.slice(request.offset,request.offset+request.limit).join(''),offset:request.offset,totalCodePoints:points.length,more:request.offset+request.limit<points.length};
}
