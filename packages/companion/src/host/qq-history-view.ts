import {createHash} from 'node:crypto';
import {HomeError} from '../home/errors.ts';
import {OperationId,type RoleId} from '../home/ids.ts';
import {plainExact,type QQBinding} from '../home/qq.ts';
import {QQHistoryQueryId,QQHistoryCandidateId,QQHistoryRequestId,type QQHistorySnapshot} from '../home/qq-history.ts';
import type {QQHistoryReadRequest,QQHistoryView,QQHistoryRecordRead,QQHistoryRecordPage} from '../types.ts';

export function qqHistoryView(state:QQHistorySnapshot,roleId:RoleId,binding:QQBinding|null,readable:boolean,request:QQHistoryReadRequest|undefined):QQHistoryView{
 const range=request??{queryId:null,operationId:null,queryOffset:0,candidateOffset:0,limit:20};
 if(!plainExact(range,['queryId','operationId','queryOffset','candidateOffset','limit'])||!Number.isSafeInteger(range.queryOffset)||range.queryOffset<0||!Number.isSafeInteger(range.candidateOffset)||range.candidateOffset<0||!Number.isSafeInteger(range.limit)||range.limit<1||range.limit>50)throw new HomeError('INVALID_QQ_HISTORY_PAGE');
 if(range.queryId!==null)QQHistoryQueryId(range.queryId);if(range.operationId!==null)OperationId(range.operationId);
 const selected=range.operationId===null?undefined:state.selections.find(s=>s.operationId===range.operationId);const ordered=[...state.queries].reverse(),query=range.queryId!==null?state.queries.find(q=>q.queryId===range.queryId):range.operationId!==null?state.queries.find(q=>q.operationId===range.operationId||q.queryId===selected?.queryId):ordered[0];
 if(range.queryId!==null&&!query||range.operationId!==null&&query&&query.operationId!==range.operationId&&!selected)throw new HomeError('QQ_HISTORY_QUERY_NOT_FOUND');
 const summaries=ordered.slice(range.queryOffset,range.queryOffset+20).map(q=>({queryId:q.queryId,operationId:q.operationId,bindingVersion:q.target.version,startedAt:q.startedAt,phase:q.phase,candidates:q.candidates.length}));
 return {selections:state.selections.filter(s=>!query||s.queryId===query.queryId).slice(-20),roleId,bindingVersion:binding?.version??0,revision:state.revision,readable,reason:!binding?'QQ_NOT_BOUND':!readable?'QQ_HISTORY_NOT_CONNECTED':'',queries:summaries,totalQueries:state.queries.length,queryOffset:range.queryOffset,moreQueries:range.queryOffset+20<state.queries.length,query:query?{
  queryId:query.queryId,operationId:query.operationId,target:query.target,startedAt:query.startedAt,policy:query.policy,anchor:query.anchor?{inputId:query.anchor.inputId,messageId:query.anchor.messageId}:null,phase:query.phase,gapReasons:query.gapReasons,
  requests:query.requests.map(r=>({requestId:r.requestId,pageIndex:r.pageIndex,limit:r.limit,anchorMessageId:r.anchorMessageId,reservedAt:r.reservedAt,enteredAt:r.enteredAt??null,status:r.outcome?.kind??(r.enteredAt?'entered' as const:'reserved' as const),code:r.outcome?.kind==='failed'?r.outcome.code:'',dispatchObserved:r.outcome?.kind==='response'?true:r.outcome?.kind==='failed'?r.outcome.dispatchObserved:null})),
  candidates:query.candidates.slice(range.candidateOffset,range.candidateOffset+range.limit).map(c=>({candidateId:c.candidateId,messageId:c.messageId,preview:Array.from(c.text).slice(0,500).join(''),totalCodePoints:Array.from(c.text).length,reportedAt:c.reportedAt,eligible:c.eligible,reason:c.reason})),totalCandidates:query.candidates.length,candidateOffset:range.candidateOffset,moreCandidates:range.candidateOffset+range.limit<query.candidates.length,
  outgoingRows:query.requests.reduce((n,r)=>n+(r.outcome?.kind==='response'?r.outcome.rows.filter(row=>row.kind==='outgoing').length:0),0),unsupportedRows:query.requests.reduce((n,r)=>n+(r.outcome?.kind==='response'?r.outcome.rows.filter(row=>row.kind==='unsupported').length:0),0),
 }:null};
}
export function qqHistoryRecord(state:QQHistorySnapshot,request:QQHistoryRecordRead):QQHistoryRecordPage{
 if(!plainExact(request,['kind','queryId','recordId','offset','limit'])||!['candidate','request'].includes(request.kind)||!Number.isSafeInteger(request.offset)||request.offset<0||!Number.isSafeInteger(request.limit)||request.limit<1||request.limit>65536)throw new HomeError('INVALID_QQ_HISTORY_RECORD_PAGE');
 QQHistoryQueryId(request.queryId);const query=state.queries.find(q=>q.queryId===request.queryId);if(!query)throw new HomeError('QQ_HISTORY_QUERY_NOT_FOUND');
 const id=request.kind==='candidate'?QQHistoryCandidateId(request.recordId):QQHistoryRequestId(request.recordId),record=request.kind==='candidate'?query.candidates.find(c=>c.candidateId===id):query.requests.find(r=>r.requestId===id);if(!record)throw new HomeError('QQ_HISTORY_RECORD_NOT_FOUND');
 const json=JSON.stringify(record),points=Array.from(json);return {queryId:query.queryId,recordId:request.recordId,kind:request.kind,revision:state.revision,json:points.slice(request.offset,request.offset+request.limit).join(''),contentDigest:createHash('sha256').update(json).digest('hex'),offset:request.offset,totalCodePoints:points.length,more:request.offset+request.limit<points.length};
}
