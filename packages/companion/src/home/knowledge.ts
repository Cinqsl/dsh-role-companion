import type {OwnerKnowledgeRecord,KnowledgeOwnerFact} from './knowledge-owner.ts';
import {plainExact} from './qq.ts';
import {HomeError} from './errors.ts';
import {AutonomyRulesVersion,ProposalId,KnowledgeId,KnowledgeVersion,ProposalRulesVersion,IntentId,InputId,ReplyId,AttemptId,ContextGeneration,ConversationVersion,HomeRevision,RunId,type OperationId} from './ids.ts';
import type {ContextSourceRef,ContextSourceBasis,ContextSource} from './context-snapshot.ts';
import type {AttemptRecord,NativeRecord} from './turns.ts';
import {contextField as field} from './context-tools.ts';
import type {InputRecord} from './inputs.ts';
export interface ProposalSource {readonly ref:ContextSourceRef;readonly quote:string;}
interface ProposalValue {readonly topic:string;readonly targetId?:KnowledgeId;readonly expectedVersion:KnowledgeVersion;readonly text:string;readonly statement:'user-report'|'role-choice'|'external-observation'|'tentative';readonly relation?:{readonly kind:'correction'|'replacement';readonly targetId:KnowledgeId;readonly version:KnowledgeVersion};readonly sources:readonly ProposalSource[];readonly scope:string;readonly reason:string;}
export type KnowledgeProposal=ProposalValue&(
 {readonly kind:'memory'|'summary'}|
 {readonly kind:'growth';readonly area:'interest'|'preference'|'relationship'|'habit';readonly phase:'exploring'|'stable'}|
 {readonly kind:'goal';readonly state:'planned'|'in-progress'|'paused'|'completed'|'abandoned'}|
 {readonly kind:'activity';readonly decision:'continue'|'switch-interest'|'rest';readonly restMs?:number}|
 {readonly kind:'contact';readonly intentId?:import('./ids.ts').IntentId});
export interface ProposalClaim {readonly contextGeneration:ContextGeneration;readonly settingsVersion:ConversationVersion;readonly autonomyRulesVersion?:AutonomyRulesVersion;readonly inputSequence?:number;readonly initialRevision?:HomeRevision;readonly sourceBasis?:readonly ContextSourceBasis[];readonly proposalRulesVersion?:ProposalRulesVersion;}
export interface ProposalAssessment {readonly status:'adopt'|'pending-review'|'reject';readonly reason:string;readonly sources:readonly ContextSourceBasis[];}
export interface ProposalProcessing {readonly status:'adopted'|'pending-review'|'rejected'|'unchanged';readonly reason:string;readonly committedRevision:HomeRevision;readonly knowledgeId?:KnowledgeId;readonly version?:KnowledgeVersion;}
export interface ProposalRecord {readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker;readonly proposalId:ProposalId;readonly operationId:OperationId;readonly runId:RunId;readonly attemptId:AttemptId;readonly claim:ProposalClaim;readonly value:KnowledgeProposal;readonly createdAt:string;readonly committedRevision:HomeRevision;readonly processing?:ProposalProcessing;}
export type KnowledgeVersionData=KnowledgeProposal&{readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker;readonly sourceBasis?:readonly ContextSourceBasis[];readonly knowledgeId:KnowledgeId;readonly version:KnowledgeVersion;readonly committedRevision:HomeRevision;};
export type ProposedKnowledgeRecord=KnowledgeVersionData&{readonly proposalId:ProposalId;readonly ownerAction?:never;readonly rollbackOf?:never;readonly preservedCorrections?:never;};
export type KnowledgeRecord=ProposedKnowledgeRecord|OwnerKnowledgeRecord;
export function admitProposedKnowledge(record:KnowledgeRecord):ProposedKnowledgeRecord{if(record.ownerAction!==undefined||record.proposalId===undefined)invalid();return {...record,knowledgeId:KnowledgeId(record.knowledgeId),version:KnowledgeVersion(record.version),proposalId:ProposalId(record.proposalId),committedRevision:HomeRevision(record.committedRevision)};}
export interface KnowledgeState {readonly proposals:readonly ProposalRecord[];readonly versions:readonly KnowledgeRecord[];}
export interface KnowledgeSnapshot extends KnowledgeState {readonly revision:HomeRevision;}
export type KnowledgeFact=KnowledgeOwnerFact|{readonly kind:'save-proposal';readonly proposal:ProposalRecord}|{readonly kind:'process-proposal';readonly proposalId:ProposalId;readonly assessment:ProposalAssessment;readonly processing:ProposalProcessing;readonly activity?:{readonly adoptedAt:string;readonly restUntil?:string};readonly version?:KnowledgeRecord;};
export const emptyKnowledge=():KnowledgeState=>({proposals:[],versions:[]});
function invalid():never{throw new HomeError('INVALID_ROLE_PROPOSE');}
const nonempty=(value:unknown):value is string=>typeof value==='string'&&!!value.trim()&&!value.includes('\0');
function admitProposalRef(value:unknown):ContextSourceRef {
 if(plainExact(value,['kind'])&&value.kind==='core')return {kind:'core'};
 if(plainExact(value,['kind','id','version'])&&value.kind==='knowledge'&&Number(value.version)>0)return {kind:'knowledge',id:KnowledgeId(value.id),version:KnowledgeVersion(value.version)};
 if(!plainExact(value,['kind','id']))return invalid();
 if(value.kind==='input')return {kind:'input',id:InputId(value.id)};if(value.kind==='reply')return {kind:'reply',id:ReplyId(value.id)};if(value.kind==='tool')return {kind:'tool',id:AttemptId(value.id)};return invalid();
}
function admitSourceBasis(value:unknown):ContextSourceBasis {
 if(!plainExact(value,['ref','contentDigest',...['committedRevision','currentRun'].filter(key=>!!value&&typeof value==='object'&&Object.hasOwn(value,key))])||typeof value.contentDigest!=='string'||!/^[0-9a-f]{64}$/.test(value.contentDigest))return invalid();
 const ref=admitProposalRef(value.ref),committedRevision=Object.hasOwn(value,'committedRevision')?HomeRevision(value.committedRevision):undefined,origin=Object.hasOwn(value,'currentRun')?value.currentRun:undefined;
 if(origin!==undefined&&(!plainExact(origin,['runId','initialRevision'])||ref.kind!=='tool'||committedRevision===undefined||committedRevision<=Number(origin.initialRevision)))return invalid();
 return {ref,contentDigest:value.contentDigest,...(committedRevision!==undefined?{committedRevision}:{}),...(origin?{currentRun:{runId:RunId(origin.runId),initialRevision:HomeRevision(origin.initialRevision)}}:{})};
}
export function knowledgeSourceBasis(source:ContextSource):ContextSourceBasis {return {ref:source.ref,contentDigest:source.contentDigest,...('committedRevision'in source&&source.committedRevision!==undefined?{committedRevision:source.committedRevision}:{}),...('currentRun'in source&&source.currentRun?{currentRun:source.currentRun}:{})};}
export function parseKnowledgeProposal(value:unknown):KnowledgeProposal {
 if(!value||typeof value!=='object'||Array.isArray(value))invalid();
 const kind=field(value,'kind'),extra=kind==='growth'?['area','phase']:kind==='goal'?['state']:kind==='activity'?['decision',...(Object.hasOwn(value,'restMs')?['restMs']:[])]:kind==='contact'&&Object.hasOwn(value,'intentId')?['intentId']:[];
 if(!plainExact(value,['kind','topic','expectedVersion','text','statement','sources','scope','reason',...extra,...['targetId','relation'].filter(key=>Object.hasOwn(value,key))])||!['memory','growth','summary','goal','activity','contact'].includes(String(kind))||!nonempty(value.topic)||!nonempty(value.text)||!nonempty(value.scope)||!nonempty(value.reason)||!['user-report','role-choice','external-observation','tentative'].includes(String(value.statement))||!Array.isArray(value.sources)||!value.sources.length)invalid();
 const expectedVersion=KnowledgeVersion(value.expectedVersion),targetId=Object.hasOwn(value,'targetId')?KnowledgeId(value.targetId):undefined;if(!!targetId!==(expectedVersion>0))invalid();
 const relation=Object.hasOwn(value,'relation')?value.relation:undefined;
 if(relation!==undefined&&(!plainExact(relation,['kind','targetId','version'])||!['correction','replacement'].includes(String(relation.kind))||!targetId||relation.targetId!==targetId||relation.version!==expectedVersion))invalid();
 const sources=value.sources.map((source:unknown):ProposalSource=>{if(!plainExact(source,['ref','quote'])||!nonempty(source.quote))return invalid();return {ref:admitProposalRef(source.ref),quote:source.quote};});
 if(new Set(sources.map(source=>JSON.stringify(source.ref))).size!==sources.length)invalid();
 const base={topic:value.topic,...(targetId?{targetId}:{}),expectedVersion,text:value.text,statement:value.statement as KnowledgeProposal['statement'],sources,scope:value.scope,reason:value.reason,...(relation?{relation:{kind:relation.kind as 'correction'|'replacement',targetId:KnowledgeId(relation.targetId),version:KnowledgeVersion(relation.version)}}:{})};
 if(kind==='memory'||kind==='summary')return {...base,kind};
 if(kind==='growth'&&['interest','preference','relationship','habit'].includes(String(value.area))&&['exploring','stable'].includes(String(value.phase)))return {...base,kind,area:value.area as 'interest'|'preference'|'relationship'|'habit',phase:value.phase as 'exploring'|'stable'};
 if(kind==='goal'&&['planned','in-progress','paused','completed','abandoned'].includes(String(value.state)))return {...base,kind,state:value.state as 'planned'|'in-progress'|'paused'|'completed'|'abandoned'};
 if(kind==='activity'&&['continue','switch-interest','rest'].includes(String(value.decision))&&(value.decision==='rest'?Number.isSafeInteger(value.restMs)&&Number(value.restMs)>0:!Object.hasOwn(value,'restMs')))return {...base,kind,decision:value.decision as 'continue'|'switch-interest'|'rest',...(value.decision==='rest'?{restMs:Number(value.restMs)}:{})};
 if(kind==='contact')return {...base,kind,...(Object.hasOwn(value,'intentId')?{intentId:IntentId(value.intentId)}:{})};
 return invalid();
}
/** Decode Home's structured source envelope; a quote match still proves no interpretation. */
export function proposalQuotePresent(source:ContextSource,quote:string):boolean {
 if(source.text===quote)return true;
 if(source.ref.kind!=='tool'&&source.ref.kind!=='knowledge')return source.text.includes(quote);
 try{const envelope:unknown=JSON.parse(source.text),values:unknown[]=source.ref.kind==='knowledge'?[envelope]:[field(field(envelope,'observation'),'value'),field(field(envelope,'final'),'value'),...('toolName'in source&&source.toolName==='role_propose'?[field(field(envelope,'request'),'arguments')]:[])];
  while(values.length){const value=values.pop();if(typeof value==='string'){if(value.includes(quote))return true;}else if(Array.isArray(value))values.push(...value);else if(value&&typeof value==='object')values.push(...Object.values(value));}return false;
 }catch{return false;}
}
/** Source existence and a quote match do not certify the proposed interpretation. */
export function assessKnowledgeProposal(value:KnowledgeProposal,sources:readonly ContextSource[],inputs:readonly InputRecord[]):ProposalAssessment {
 const basis=sources.map(knowledgeSourceBasis),result=(status:ProposalAssessment['status'],reason:string):ProposalAssessment=>({status,reason,sources:basis});
 if(sources.length!==value.sources.length||sources.some((source,index)=>JSON.stringify(source.ref)!==JSON.stringify(value.sources[index]!.ref)||!proposalQuotePresent(source,value.sources[index]!.quote)))return result('pending-review','SOURCE_QUOTE_MISMATCH');
 if(sources.some(source=>!source.availableForDaily||source.completeness!=='complete'))return result('pending-review','SOURCE_UNAVAILABLE_FOR_DAILY');
 if(value.kind==='memory')return directUserReport(value,inputs)?result('adopt','EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH'):value.statement==='external-observation'&&sources.length===1&&sources[0]!.ref.kind==='tool'&&!sources[0]!.derivedRead&&value.text===sources[0]!.text?result('adopt','EXTRACTIVE_EXTERNAL_OBSERVATION_NOT_WORLD_TRUTH'):result('pending-review','SEMANTIC_REVIEW_REQUIRED');
 if(value.kind==='summary')return value.statement==='tentative'&&value.text===value.sources.map(source=>source.quote).join('\n')?result('adopt','EXTRACTIVE_SUMMARY_NOT_INDEPENDENT_EVIDENCE'):result('pending-review','SUMMARY_INTERPRETATION_UNREVIEWED');
 if(value.statement!=='role-choice')return result('pending-review','ROLE_CHOICE_LABEL_REQUIRED');
 if(value.kind==='growth'){
  if(value.phase==='exploring')return result('adopt','CURRENT_ROLE_EXPLORATION_NOT_USER_PREFERENCE');
  const raw=sources.filter(source=>source.ref.kind==='input'||source.ref.kind==='tool'&&!source.derivedRead),runs=new Set(raw.flatMap(source=>'runId'in source&&source.runId?[source.runId]:[])),independent=new Set(raw.map(source=>source.contentDigest));
  return runs.size>=2&&independent.size>=2?result('adopt','ROLE_CHOICE_WITH_CROSS_TURN_RAW_EVIDENCE'):result('pending-review','CROSS_TURN_INDEPENDENT_EVIDENCE_REQUIRED');
 }
 if(value.kind==='goal')return ['planned','paused','abandoned'].includes(value.state)?result('adopt','CURRENT_GOAL_DECISION_NOT_COMPLETION'):result('pending-review','ACTUAL_GOAL_PROGRESS_NOT_VERIFIED');
 return result('adopt',value.kind==='activity'?'ACTIVITY_DECISION_ONLY_NO_AUTONOMOUS_ISSUANCE':'CONTACT_PROPOSAL_ONLY_NO_DELIVERY');
}
export function proposalClaim(value:ProposalClaim):ProposalClaim{if(!plainExact(value,['contextGeneration','settingsVersion',...(Object.hasOwn(value,'autonomyRulesVersion')?['autonomyRulesVersion']:[]),...(Object.hasOwn(value,'inputSequence')?['inputSequence']:[]),...(Object.hasOwn(value,'proposalRulesVersion')?['proposalRulesVersion']:[]),...(Object.hasOwn(value,'initialRevision')?['initialRevision']:[]),...(Object.hasOwn(value,'sourceBasis')?['sourceBasis']:[])])||value.inputSequence!==undefined&&(!Number.isSafeInteger(value.inputSequence)||value.inputSequence<0)||value.autonomyRulesVersion!==undefined&&(!Number.isSafeInteger(value.autonomyRulesVersion)||value.autonomyRulesVersion<1)||value.sourceBasis!==undefined&&!Array.isArray(value.sourceBasis))invalid();return {contextGeneration:ContextGeneration(value.contextGeneration),settingsVersion:ConversationVersion(value.settingsVersion),...(value.autonomyRulesVersion!==undefined?{autonomyRulesVersion:AutonomyRulesVersion(value.autonomyRulesVersion)}:{}),...(value.inputSequence!==undefined?{inputSequence:value.inputSequence}:{}),...(value.proposalRulesVersion!==undefined?{proposalRulesVersion:ProposalRulesVersion(value.proposalRulesVersion)}:{}),...(value.initialRevision!==undefined?{initialRevision:HomeRevision(value.initialRevision)}:{}),...(value.sourceBasis!==undefined?{sourceBasis:value.sourceBasis.map(admitSourceBasis)}:{})};}
/** Identical provenance and meaning need a processed receipt, not another knowledge version. */
export function unchangedKnowledge(value:KnowledgeProposal,previous:KnowledgeRecord):boolean {
 const comparable=(proposal:KnowledgeProposal)=>({kind:proposal.kind,topic:proposal.topic,text:proposal.text,statement:proposal.statement,sources:proposal.sources,scope:proposal.scope,...(proposal.kind==='growth'?{area:proposal.area,phase:proposal.phase}:proposal.kind==='goal'?{state:proposal.state}:proposal.kind==='activity'?{decision:proposal.decision,...(proposal.restMs!==undefined?{restMs:proposal.restMs}:{})}:proposal.kind==='contact'&&proposal.intentId?{intentId:proposal.intentId}:{})});
 return JSON.stringify(comparable(value))===JSON.stringify(comparable(previous));
}
/** Follow only trusted Home lineage, never IDs embedded in user/model prose. */
export function correctedSourceReused(value:KnowledgeProposal,state:KnowledgeState,describe:(ref:ContextSourceRef)=>import('./context-snapshot.ts').ContextSourceLineage):boolean {
 if(!value.targetId)return false;
 const key=(ref:ContextSourceRef)=>JSON.stringify(ref),visiting=new Set<string>();
 const roots=(ref:ContextSourceRef):readonly ContextSourceRef[]=>{const id=key(ref);if(visiting.has(id))return [];visiting.add(id);try{if(ref.kind==='input')return [ref];if(ref.kind==='knowledge'){const record=state.versions.find(record=>record.knowledgeId===ref.id&&record.version===ref.version);return record?record.sources.flatMap(source=>roots(source.ref)):[];}const lineage=describe(ref);if(ref.kind==='tool'&&!lineage.derivedRead)return [ref];return (lineage.dataOrigins.length?lineage.dataOrigins:lineage.dependencies).flatMap(roots);}finally{visiting.delete(id);}};
 const superseded=state.versions.filter(record=>record.knowledgeId===value.targetId&&record.relation?.kind==='correction').flatMap(record=>state.versions.filter(old=>old.knowledgeId===record.relation!.targetId&&old.version===record.relation!.version)).flatMap(record=>record.sources.flatMap(source=>roots(source.ref))),banned=new Set(superseded.map(key)),offered=value.sources.flatMap(source=>roots(source.ref));
 return offered.length>0&&offered.every(ref=>banned.has(key(ref)));
}
/** Repetition of evidence already reviewed by the owner cannot overwrite that owner decision. */
export function ownerActionSourceReused(value:KnowledgeProposal,state:KnowledgeState,describe:(ref:ContextSourceRef)=>import('./context-snapshot.ts').ContextSourceLineage):boolean {
 if(!value.targetId)return false;const owner=state.versions.findLast(record=>record.knowledgeId===value.targetId&&record.ownerAction);if(!owner)return false;
 const key=(ref:ContextSourceRef)=>JSON.stringify(ref),visiting=new Set<string>();
 const roots=(ref:ContextSourceRef):readonly ContextSourceRef[]=>{const id=key(ref);if(visiting.has(id))return [];visiting.add(id);try{if(ref.kind==='input')return [ref];if(ref.kind==='knowledge'){const record=state.versions.find(record=>record.knowledgeId===ref.id&&record.version===ref.version);return record?record.sources.flatMap(source=>roots(source.ref)):[];}if(ref.kind!=='tool')return [];const lineage=describe(ref);return lineage.derivedRead?lineage.dataOrigins.flatMap(roots):[ref];}finally{visiting.delete(id);}};
 const reviewed=new Set(state.versions.filter(record=>record.knowledgeId===owner.knowledgeId&&record.committedRevision<=owner.committedRevision).flatMap(record=>record.sources.flatMap(source=>roots(source.ref))).map(key)),offered=value.sources.flatMap(source=>roots(source.ref));
 return !offered.length||offered.every(ref=>reviewed.has(key(ref)));
}
/** This first extractive path proves the quoted utterance, not its objective truth. */
export function directUserReport(value:KnowledgeProposal,inputs:readonly InputRecord[]):boolean{const sameText=(left:string,right:string)=>left.trimEnd()===right.trimEnd();return value.statement==='user-report'&&value.sources.length>0&&value.sources.every(source=>{const ref=source.ref;return ref.kind==='input'&&inputs.some(input=>input.inputId===ref.id&&sameText(input.text,source.quote)&&sameText(value.text,input.text));});}
export function canonicalProposalSucceeded(attempt:AttemptRecord,record:ProposalRecord):boolean{
 const data=attempt.outcome?.data;if(attempt.outcome?.kind!=='completed'||!data||typeof data!=='object'||!('request'in data)||!('result'in data)||!data.request||typeof data.request!=='object'||!('name'in data.request)||data.request.name!=='role_propose'||!data.result||typeof data.result!=='object'||!('final'in data.result)||!data.result.final||typeof data.result.final!=='object')return false;
 const final=data.result.final;if(!('isError'in final)||final.isError!==false||!('content'in final)||!Array.isArray(final.content)||!('value'in final)||!final.value||typeof final.value!=='object'||!('proposalId'in final.value)||final.value.proposalId!==record.proposalId)return false;return true;
}
export function canonicalProposalRecorded(attempt:AttemptRecord,record:ProposalRecord,native:readonly NativeRecord[]):boolean {const request=field(attempt.outcome?.data,'request'),association=field(request,'native'),seq=field(association,'callSeq'),session=field(association,'sessionId');return typeof session==='string'&&typeof seq==='number'&&native.some(entry=>{if(entry.runId!==record.runId||entry.provenance!=='tools-result'||entry.nativeId!==session+':final:'+seq||field(entry.data,'association')!=='issued-execution'||field(entry.data,'name')!=='role_propose'||field(entry.data,'callSeq')!==seq)return false;try{if(JSON.stringify(parseKnowledgeProposal(field(entry.data,'arguments')))!==JSON.stringify(record.value))return false;}catch{return false;}const result=field(entry.data,'result');return field(result,'isError')===true||field(field(result,'value'),'proposalId')===record.proposalId;});}
