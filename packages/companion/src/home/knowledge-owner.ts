import {HomeError} from './errors.ts';
import {plainExact} from './qq.ts';
import {OperationId,KnowledgeId,KnowledgeVersion,HomeRevision} from './ids.ts';
import {parseKnowledgeProposal,type KnowledgeVersionData,type KnowledgeRecord,type KnowledgeState} from './knowledge.ts';
import type {ContextSourceRef} from './context-snapshot.ts';
export type KnowledgeVersionRef=Extract<ContextSourceRef,{kind:'knowledge'}>;
export interface KnowledgeRollbackRequest {
 readonly operationId:OperationId;readonly knowledgeId:KnowledgeId;readonly targetVersion:KnowledgeVersion;
 readonly expectedKnowledgeVersion:KnowledgeVersion;readonly expectedRevision:HomeRevision;readonly reason:string;
}
export interface RollbackKnowledge extends KnowledgeRollbackRequest {readonly kind:'rollback-knowledge';}
export interface KnowledgeOwnerAction {readonly kind:'rollback';readonly operationId:OperationId;readonly fromVersion:KnowledgeVersion;readonly reason:string;readonly createdAt:string;}
/** A real owner decision is not a model proposal or an invented canonical tool result. */
export type OwnerKnowledgeRecord=KnowledgeVersionData&{readonly proposalId?:never;readonly ownerAction:KnowledgeOwnerAction;readonly rollbackOf:{readonly knowledgeId:KnowledgeId;readonly version:KnowledgeVersion};readonly preservedCorrections:readonly KnowledgeVersionRef[];};
export type KnowledgeOwnerFact={readonly kind:'rollback-knowledge';readonly version:OwnerKnowledgeRecord};
const invalid=():never=>{throw new HomeError('INVALID_KNOWLEDGE_ROLLBACK');};
export function knowledgeRollbackCommand(value:unknown):RollbackKnowledge {
 if(!plainExact(value,['operationId','knowledgeId','targetVersion','expectedKnowledgeVersion','expectedRevision','reason']))return invalid();
 return parseKnowledgeRollback({...value,kind:'rollback-knowledge'});
}
export function parseKnowledgeRollback(value:unknown):RollbackKnowledge {
 if(!plainExact(value,['kind','operationId','knowledgeId','targetVersion','expectedKnowledgeVersion','expectedRevision','reason'])||value.kind!=='rollback-knowledge'||typeof value.reason!=='string'||!value.reason.trim()||value.reason.includes('\0'))return invalid();
 const targetVersion=KnowledgeVersion(value.targetVersion),expectedKnowledgeVersion=KnowledgeVersion(value.expectedKnowledgeVersion);if(targetVersion<1||expectedKnowledgeVersion<1)invalid();
 return {kind:'rollback-knowledge',operationId:OperationId(value.operationId),knowledgeId:KnowledgeId(value.knowledgeId),targetVersion,expectedKnowledgeVersion,expectedRevision:HomeRevision(value.expectedRevision),reason:value.reason};
}
export function rollbackKnowledgeBusiness(request:Pick<RollbackKnowledge,'knowledgeId'|'targetVersion'|'reason'>){return {kind:'rollback-knowledge',knowledgeId:request.knowledgeId,targetVersion:request.targetVersion,reason:request.reason};}
function content(record:KnowledgeRecord){const {knowledgeId,version,committedRevision,sourceBasis,proposalId,ownerAction,rollbackOf,preservedCorrections,...value}=record;return parseKnowledgeProposal(value);}
/** This only creates a Home fact. Source qualification remains with the existing Home reader. */
export function createKnowledgeRollback(state:KnowledgeState,command:RollbackKnowledge,revision:HomeRevision,createdAt:string):OwnerKnowledgeRecord {
 const request=parseKnowledgeRollback(command),current=state.versions.findLast(record=>record.knowledgeId===request.knowledgeId),target=state.versions.find(record=>record.knowledgeId===request.knowledgeId&&record.version===request.targetVersion);
 if(!current||!target)throw new HomeError('KNOWLEDGE_VERSION_NOT_FOUND');if(current.version!==request.expectedKnowledgeVersion)throw new HomeError('KNOWLEDGE_VERSION_CONFLICT');
 if(typeof createdAt!=='string'||!Number.isFinite(Date.parse(createdAt)))invalid();
 const candidates=[...state.versions.filter(record=>record.knowledgeId===current.knowledgeId&&record.version>target.version&&record.relation?.kind==='correction').map(record=>({kind:'knowledge' as const,id:record.knowledgeId,version:record.version})),...(current.preservedCorrections??[]),...(target.preservedCorrections??[])];
 const preservedCorrections=[...new Map(candidates.map(ref=>[JSON.stringify(ref),ref])).values()].sort((left,right)=>left.version-right.version);
 return {...content(target),...(target.sourceBasis?{sourceBasis:structuredClone(target.sourceBasis)}:{}),knowledgeId:current.knowledgeId,version:KnowledgeVersion(current.version+1),committedRevision:revision,ownerAction:{kind:'rollback',operationId:request.operationId,fromVersion:current.version,reason:request.reason,createdAt},rollbackOf:{knowledgeId:target.knowledgeId,version:target.version},preservedCorrections};
}

/** Current body and explicitly retained corrections share the existing source qualification. */
export function activeKnowledgeVersions(state:KnowledgeState):readonly KnowledgeRecord[]{
 const latest=new Map<KnowledgeId,KnowledgeRecord>();for(const record of state.versions)latest.set(record.knowledgeId,record);
 const active=new Map<string,KnowledgeRecord>();
 const include=(record:KnowledgeRecord)=>{const key=record.knowledgeId+':'+record.version;if(active.has(key))return;active.set(key,record);for(const ref of record.preservedCorrections??[]){const correction=state.versions.find(candidate=>candidate.knowledgeId===ref.id&&candidate.version===ref.version);if(correction)include(correction);}};
 for(const record of latest.values())include(record);return [...active.values()];
}
export function knowledgeSourceRequirements(record:KnowledgeRecord):readonly ContextSourceRef[]{return [...record.sources.map(source=>source.ref),...(record.preservedCorrections??[])];}
/** The owner's body and all retained qualifiers are one read/selection unit, in either direction. */
export function rollbackKnowledgePair(record:OwnerKnowledgeRecord,state:KnowledgeState,requirements:(record:KnowledgeRecord)=>readonly ContextSourceRef[]=knowledgeSourceRequirements):readonly ContextSourceRef[]{
 const refs=new Map<string,ContextSourceRef>();
 const include=(ref:ContextSourceRef)=>{const key=JSON.stringify(ref);if(refs.has(key))return;refs.set(key,ref);if(ref.kind==='knowledge'){const version=state.versions.find(candidate=>candidate.knowledgeId===ref.id&&candidate.version===ref.version);if(version)for(const source of requirements(version))include(source);}};
 include({kind:'knowledge',id:record.knowledgeId,version:record.version});return [...refs.values()];
}
