import {createHash} from 'node:crypto';
import {HomeError} from '../home/errors.ts';
import {HomeRevision,KnowledgeId,KnowledgeVersion,ProposalId} from '../home/ids.ts';
import type {KnowledgeProposal, KnowledgeRecord, KnowledgeSnapshot, ProposalRecord} from '../home/knowledge.ts';
import {plainExact} from '../home/qq.ts';
import {knowledgeDifference} from './knowledge-view.ts';
import type {
  KnowledgeLibraryDetail,
  KnowledgeLibraryDetailRequest,
  KnowledgeLibraryPage,
  KnowledgeLibraryQuery,
  KnowledgeLibraryRecordSummary,
  KnowledgeRecordRef,
} from '../types.knowledge.ts';
import {boundedPreview} from './library-preview.ts';

const digest=(record:ProposalRecord|KnowledgeRecord)=>{const text=JSON.stringify(record);return {contentDigest:createHash('sha256').update(text,'utf8').digest('hex'),totalCodePoints:Array.from(text).length};};
const invalid=():never=>{throw new HomeError('INVALID_KNOWLEDGE_PAGE');};

function validate(query:KnowledgeLibraryQuery):void {
  if(!plainExact(query,['collection','offset','limit','keyword','kind','scope','status','from','to','order'])
    ||!['proposals','versions'].includes(query.collection)
    ||!Number.isSafeInteger(query.offset)||query.offset<0
    ||query.limit!==20&&query.limit!==50
    ||typeof query.keyword!=='string'||typeof query.kind!=='string'||typeof query.status!=='string'
    ||!['all','current','historical'].includes(query.scope)
    ||typeof query.from!=='string'||typeof query.to!=='string'
    ||!['newest','oldest'].includes(query.order))invalid();
  const from=query.from?Date.parse(query.from):null,to=query.to?Date.parse(query.to):null;
  if(from!==null&&!Number.isFinite(from)||to!==null&&!Number.isFinite(to)||from!==null&&to!==null&&from>to)invalid();
}

function proposalFor(record:KnowledgeRecord,snapshot:KnowledgeSnapshot):ProposalRecord|undefined {
  return 'proposalId' in record&&record.proposalId
    ? snapshot.proposals.find(proposal=>proposal.proposalId===record.proposalId)
    : undefined;
}

function effectiveAt(record:ProposalRecord|KnowledgeRecord,snapshot:KnowledgeSnapshot):string|null {
  if('createdAt'in record)return record.createdAt;
  if(record.ownerAction)return record.ownerAction.createdAt;
  return proposalFor(record,snapshot)?.createdAt??null;
}

function kindMetadata(value:KnowledgeProposal):readonly (string|number)[] {
  if(value.kind==='growth')return [value.area,value.phase];
  if(value.kind==='goal')return [value.state];
  if(value.kind==='activity')return [value.decision,...(value.restMs===undefined?[]:[value.restMs])];
  return [];
}

function searchable(record:ProposalRecord|KnowledgeRecord,snapshot:KnowledgeSnapshot):string {
  const proposal='value'in record?record:proposalFor(record,snapshot);
  const value='value'in record?record.value:record;
  const processing='processing'in record?record.processing:proposal?.processing;
  const status=processing?.status??('version'in record?record.ownerAction?'owner-rollback':'recorded':'pending-final');
  return [
    value.kind,
    value.topic,
    value.text,
    value.statement,
    value.scope,
    value.reason,
    ...kindMetadata(value),
    processing?.reason??'',
    status,
  ].map(value=>String(value)).join('\n').toLocaleLowerCase();
}

function filterKey(query:KnowledgeLibraryQuery):string {
  return JSON.stringify({
    collection:query.collection,
    keyword:query.keyword.trim().toLocaleLowerCase(),
    kind:query.kind,
    scope:query.scope,
    status:query.status,
    from:query.from?new Date(query.from).toISOString():'',
    to:query.to?new Date(query.to).toISOString():'',
    order:query.order,
  });
}

function summary(record:ProposalRecord|KnowledgeRecord,snapshot:KnowledgeSnapshot):KnowledgeLibraryRecordSummary {
  const proposal='value'in record?record:proposalFor(record,snapshot);
  const value='value'in record?record.value:record;
  const processing='processing'in record?record.processing:proposal?.processing;
  const ref:KnowledgeRecordRef='value'in record
    ? {kind:'proposal',proposalId:record.proposalId}
    : {kind:'version',knowledgeId:record.knowledgeId,version:record.version};
  const current='version'in record
    ? !snapshot.versions.some(other=>other.knowledgeId===record.knowledgeId&&other.version>record.version)
    : null;
  return {
    ref,
    origin:'ownerAction'in record&&record.ownerAction?'owner-action':'proposal',
    knowledgeId:'knowledgeId'in record?record.knowledgeId:processing?.knowledgeId??null,
    version:'version'in record?record.version:processing?.version??null,
    kind:value.kind,
    topicExcerpt:boundedPreview(value.topic,160),
    textExcerpt:boundedPreview(value.text,160),
    status:processing?.status??('version'in record?record.ownerAction?'owner-rollback':'recorded':'pending-final'),
    reasonExcerpt:boundedPreview(processing?.reason??'',240),
    current,
    effectiveAt:effectiveAt(record,snapshot),
    sourceCount:value.sources.length,
    sourceRefs:value.sources.slice(0,8).map(source=>source.ref),
    sourcesMore:value.sources.length>8,
    proposalId:'value'in record?record.proposalId:'proposalId'in record?record.proposalId??null:null,
    ownerOperationId:'ownerAction'in record?record.ownerAction?.operationId??null:null,
    committedRevision:record.committedRevision,
    ...digest(record),
  };
}

export function queryKnowledgeLibrary(snapshot:KnowledgeSnapshot,query:KnowledgeLibraryQuery):KnowledgeLibraryPage {
  validate(query);
  const keyword=query.keyword.trim().toLocaleLowerCase(),from=query.from?Date.parse(query.from):null,to=query.to?Date.parse(query.to):null;
  const all=(query.collection==='proposals'?snapshot.proposals:snapshot.versions)
    .map(record=>({record,summary:summary(record,snapshot),searchable:searchable(record,snapshot)}))
    .filter(({searchable:text})=>!keyword||text.includes(keyword))
    .filter(({summary})=>query.scope==='all'||query.scope==='current'&&summary.current===true||query.scope==='historical'&&summary.current===false)
    .filter(({summary})=>!query.kind||summary.kind===query.kind)
    .filter(({summary})=>!query.status||summary.status===query.status)
    .filter(({summary})=>{
      if(from===null&&to===null)return true;
      if(summary.effectiveAt===null)return false;
      const at=Date.parse(summary.effectiveAt);
      return Number.isFinite(at)&&(from===null||at>=from)&&(to===null||at<=to);
    })
    .sort((left,right)=>{
      if(left.summary.effectiveAt===null&&right.summary.effectiveAt===null)return query.order==='newest'?right.summary.committedRevision-left.summary.committedRevision:left.summary.committedRevision-right.summary.committedRevision;
      if(left.summary.effectiveAt===null)return 1;
      if(right.summary.effectiveAt===null)return -1;
      const delta=Date.parse(left.summary.effectiveAt)-Date.parse(right.summary.effectiveAt);
      if(delta!==0)return query.order==='newest'?-delta:delta;
      return query.order==='newest'?right.summary.committedRevision-left.summary.committedRevision:left.summary.committedRevision-right.summary.committedRevision;
    });
  const records=all.slice(query.offset,query.offset+query.limit).map(entry=>entry.summary);
  const end=records.length?query.offset+records.length:0;
  const nextOffset=query.offset+records.length<all.length?query.offset+records.length:null;
  return {
    revision:snapshot.revision,
    collection:query.collection,
    offset:query.offset,
    limit:query.limit,
    filterKey:filterKey(query),
    range:{start:records.length?query.offset+1:0,end},
    total:all.length,
    more:nextOffset!==null,
    nextOffset,
    records,
  };
}

function selector(value:unknown):KnowledgeRecordRef {
  if(plainExact(value,['kind','proposalId'])&&value.kind==='proposal')return {kind:'proposal',proposalId:ProposalId(value.proposalId)};
  if(plainExact(value,['kind','knowledgeId','version'])&&value.kind==='version'&&Number(value.version)>0)return {kind:'version',knowledgeId:KnowledgeId(value.knowledgeId),version:KnowledgeVersion(value.version)};
  return invalid();
}

export function readKnowledgeLibraryDetail(snapshot:KnowledgeSnapshot,request:KnowledgeLibraryDetailRequest):KnowledgeLibraryDetail {
  if(!plainExact(request,['ref','revision','contentDigest','offset','limit'])
    ||typeof request.contentDigest!=='string'||!/^[0-9a-f]{64}$/.test(request.contentDigest)
    ||!Number.isSafeInteger(request.offset)||request.offset<0
    ||!Number.isSafeInteger(request.limit)||request.limit<1||request.limit>16384)invalid();
  const ref=selector(request.ref),revision=HomeRevision(request.revision);
  if(revision!==snapshot.revision)throw new HomeError('KNOWLEDGE_RECORD_CHANGED');
  const record=ref.kind==='proposal'
    ? snapshot.proposals.find(proposal=>proposal.proposalId===ref.proposalId)
    : snapshot.versions.find(version=>version.knowledgeId===ref.knowledgeId&&version.version===ref.version);
  if(!record)throw new HomeError('KNOWLEDGE_RECORD_NOT_FOUND');
  const recordDigest=digest(record);
  if(recordDigest.contentDigest!==request.contentDigest)throw new HomeError('KNOWLEDGE_RECORD_CHANGED');
  const proposal='value'in record?record:proposalFor(record,snapshot);
  const value='value'in record?record.value:record;
  const processing='processing'in record?record.processing:proposal?.processing;
  const current='version'in record
    ? !snapshot.versions.some(other=>other.knowledgeId===record.knowledgeId&&other.version>record.version)
    : null;
  const ownerAction='ownerAction'in record&&record.ownerAction?{
    operationId:record.ownerAction.operationId,
    fromVersion:record.ownerAction.fromVersion,
    reason:record.ownerAction.reason,
    createdAt:record.ownerAction.createdAt,
  }:null;
  const difference=ref.kind==='version'?knowledgeDifference(snapshot,{
    knowledgeId:ref.knowledgeId,
    targetVersion:ref.version,
    revision:snapshot.revision,
  }):null;
  const preservedCorrections=[...new Map([
    ...('preservedCorrections'in record?record.preservedCorrections??[]:[]),
    ...(difference?.preservedCorrections??[]),
  ].map(ref=>[JSON.stringify(ref),ref])).values()];
  const body=Array.from(value.text);
  if(request.offset>body.length)invalid();
  const text=body.slice(request.offset,request.offset+request.limit).join('');
  const more=request.offset+Array.from(text).length<body.length;
  return {
    ref,
    revision:snapshot.revision,
    ...recordDigest,
    committedRevision:record.committedRevision,
    origin:ownerAction?'owner-action':'proposal',
    knowledgeId:'knowledgeId'in record?record.knowledgeId:processing?.knowledgeId??null,
    version:'version'in record?record.version:processing?.version??null,
    proposalId:'proposalId'in record?record.proposalId??null:null,
    ownerOperationId:ownerAction?.operationId??null,
    kind:value.kind,
    topic:value.topic,
    text,
    offset:request.offset,
    bodyTotalCodePoints:body.length,
    more,
    nextOffset:more?request.offset+Array.from(text).length:null,
    statement:value.statement,
    scope:value.scope,
    status:processing?.status??('version'in record?ownerAction?'owner-rollback':'recorded':'pending-final'),
    current,
    effectiveAt:effectiveAt(record,snapshot),
    proposalReason:value.reason,
    processingReason:processing?.reason??'',
    sources:value.sources.map(source=>({ref:source.ref,quote:source.quote})),
    preservedCorrections,
    ownerAction,
    rollbackOf:'rollbackOf'in record?record.rollbackOf??null:null,
    difference,
  };
}
