import {createHash} from 'node:crypto';
import {HomeError} from '../home/errors.ts';
import {ProposalId,KnowledgeId,KnowledgeVersion,HomeRevision} from '../home/ids.ts';
import {plainExact} from '../home/qq.ts';
import type {KnowledgeSnapshot,ProposalRecord,KnowledgeRecord} from '../home/knowledge.ts';
import type {KnowledgePageRequest,KnowledgePage,KnowledgeRecordRef,KnowledgeRecordRead,KnowledgeRecordPart,KnowledgeRecordSummary} from '../types.knowledge.ts';

const excerpt=(text:string,max:number)=>Array.from(text).slice(0,max).join('');
const serialized=(record:ProposalRecord|KnowledgeRecord)=>{const text=JSON.stringify(record);return {text,contentDigest:createHash('sha256').update(text,'utf8').digest('hex'),totalCodePoints:Array.from(text).length};};
const invalid=():never=>{throw new HomeError('INVALID_KNOWLEDGE_PAGE');};
function range(offset:number,limit:number,max:number):void{if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>max)invalid();}
function ref(value:KnowledgeRecordRef):KnowledgeRecordRef{
 if(plainExact(value,['kind','proposalId'])&&value.kind==='proposal')return {kind:'proposal',proposalId:ProposalId(value.proposalId)};
 if(plainExact(value,['kind','knowledgeId','version'])&&value.kind==='version'&&value.version>0)return {kind:'version',knowledgeId:KnowledgeId(value.knowledgeId),version:KnowledgeVersion(value.version)};
 return invalid();
}
/** Pure projection of a single Home-owned snapshot; no writable cache or second knowledge store. */
export function knowledgePage(snapshot:KnowledgeSnapshot,page:KnowledgePageRequest):KnowledgePage{
 if(!plainExact(page,['collection','offset','limit'])||!['proposals','versions'].includes(page.collection))invalid();range(page.offset,page.limit,50);
 const all=page.collection==='proposals'?snapshot.proposals:snapshot.versions;
 const records=all.slice(page.offset,page.offset+page.limit).map((record):KnowledgeRecordSummary=>{
  const proposal='value'in record?record:snapshot.proposals.find(p=>p.proposalId===record.proposalId),value='value'in record?record.value:record,processing=proposal?.processing,version='version'in record?record.version:processing?.version??null,knowledgeId='knowledgeId'in record?record.knowledgeId:processing?.knowledgeId??null;
  const selector:KnowledgeRecordRef='value'in record?{kind:'proposal',proposalId:record.proposalId}:{kind:'version',knowledgeId:record.knowledgeId,version:record.version};
  const {contentDigest,totalCodePoints}=serialized(record);
  return {ref:selector,proposalId:record.proposalId??null,ownerOperationId:'ownerAction'in record?record.ownerAction?.operationId??null:null,origin:'ownerAction'in record&&record.ownerAction?'owner-action':'proposal',knowledgeId,version,kind:value.kind,topicExcerpt:excerpt(value.topic,160),status:processing?.status??('value'in record?'pending-final':record.ownerAction?'owner-rollback':'recorded'),reasonExcerpt:excerpt(processing?.reason??'',240),proposalReasonExcerpt:excerpt(value.reason,240),sourceCount:value.sources.length,sourceRefs:value.sources.slice(0,8).map(source=>source.ref),sourcesMore:value.sources.length>8,current:'version'in record?!snapshot.versions.some(other=>other.knowledgeId===record.knowledgeId&&other.version>record.version):null,committedRevision:record.committedRevision,contentDigest,totalCodePoints};
 });
 return {revision:snapshot.revision,collection:page.collection,offset:page.offset,limit:page.limit,total:all.length,more:page.offset+page.limit<all.length,records};
}
export function knowledgeRecordPart(snapshot:KnowledgeSnapshot,request:KnowledgeRecordRead):KnowledgeRecordPart{
 if(!plainExact(request,['ref','revision','contentDigest','offset','limit'])||typeof request.contentDigest!=='string'||!/^[0-9a-f]{64}$/.test(request.contentDigest))invalid();range(request.offset,request.limit,4096);const selector=ref(request.ref),revision=HomeRevision(request.revision);
 if(revision!==snapshot.revision)throw new HomeError('KNOWLEDGE_RECORD_CHANGED');
 const record=selector.kind==='proposal'?snapshot.proposals.find(p=>p.proposalId===selector.proposalId):snapshot.versions.find(v=>v.knowledgeId===selector.knowledgeId&&v.version===selector.version);if(!record)throw new HomeError('KNOWLEDGE_RECORD_NOT_FOUND');
 const {text,contentDigest,totalCodePoints}=serialized(record);if(contentDigest!==request.contentDigest)throw new HomeError('KNOWLEDGE_RECORD_CHANGED');
 return {ref:selector,revision,contentDigest,text:Array.from(text).slice(request.offset,request.offset+request.limit).join(''),offset:request.offset,totalCodePoints,more:request.offset+request.limit<totalCodePoints};
}

/** Both sides come from the same Home snapshot; excerpts never replace original sources. */
export function knowledgeDifference(snapshot:KnowledgeSnapshot,request:import('../types.knowledge.ts').KnowledgeDifferenceRequest):import('../types.knowledge.ts').KnowledgeDifference {
 if(!plainExact(request,['knowledgeId','targetVersion','revision']))invalid();const knowledgeId=KnowledgeId(request.knowledgeId),targetVersion=KnowledgeVersion(request.targetVersion);if(targetVersion<1)invalid();if(HomeRevision(request.revision)!==snapshot.revision)throw new HomeError('KNOWLEDGE_RECORD_CHANGED');
 const target=snapshot.versions.find(record=>record.knowledgeId===knowledgeId&&record.version===targetVersion),current=snapshot.versions.findLast(record=>record.knowledgeId===knowledgeId);if(!target||!current)throw new HomeError('KNOWLEDGE_VERSION_NOT_FOUND');
 const fields=[...new Set([...Object.keys(target),...Object.keys(current)])].sort().flatMap(field=>{const left=Object.getOwnPropertyDescriptor(target,field)?.value,right=Object.getOwnPropertyDescriptor(current,field)?.value,a=left===undefined?'（无此字段）':JSON.stringify(left),b=right===undefined?'（无此字段）':JSON.stringify(right);return a===b?[]:[{field,targetExcerpt:excerpt(a,1024),currentExcerpt:excerpt(b,1024),targetMore:Array.from(a).length>1024,currentMore:Array.from(b).length>1024}];});
 return {revision:snapshot.revision,knowledgeId,targetVersion,currentVersion:current.version,targetDigest:serialized(target).contentDigest,currentDigest:serialized(current).contentDigest,fields,preservedCorrections:current.preservedCorrections??[]};
}
