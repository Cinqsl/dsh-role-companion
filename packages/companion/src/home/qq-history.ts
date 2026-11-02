import {createHash} from 'node:crypto';
import {HomeError} from './errors.ts';
import {InputId,OperationId,type HomeRevision,type RoleId,type BindingVersion} from './ids.ts';
import {admitQQBinding,plainExact,QQMessageId,type QQBinding} from './qq.ts';
import {sameQQTarget} from './deliveries.ts';
import type {InputRecord,InputReceipt} from './inputs.ts';

declare const historyIdentity:unique symbol;
export type QQHistoryQueryId=string&{readonly[historyIdentity]:'QQHistoryQueryId'};
export type QQHistoryRequestId=string&{readonly[historyIdentity]:'QQHistoryRequestId'};
export type QQHistoryCandidateId=string&{readonly[historyIdentity]:'QQHistoryCandidateId'};
const token=(value:unknown,prefix:string)=>{if(typeof value!=='string'||!new RegExp('^'+prefix+'[0-9a-f]{64}$').test(value))throw new HomeError('INVALID_QQ_HISTORY_ID');return value;};
export const QQHistoryQueryId=(value:unknown)=>token(value,'history-') as QQHistoryQueryId;
export const QQHistoryRequestId=(value:unknown)=>token(value,'history-request-') as QQHistoryRequestId;
export const QQHistoryCandidateId=(value:unknown)=>token(value,'history-candidate-') as QQHistoryCandidateId;
export const historyDigest=(value:string)=>createHash('sha256').update(value).digest('hex');
export interface QQHistoryPolicy{readonly pageSize:number;readonly maxPages:number;readonly cooldownMs:number;readonly readTimeoutMs:number;readonly configurationVersion:number;}
export function validQQHistoryPolicy(value:unknown):value is QQHistoryPolicy{
 if(!plainExact(value,['pageSize','maxPages','cooldownMs','readTimeoutMs','configurationVersion']))return false;
 return ['pageSize','maxPages','cooldownMs','readTimeoutMs'].every(key=>typeof value[key]==='number'&&Number.isSafeInteger(value[key])&&Number(value[key])>=1)&&Number(value.pageSize)<=200&&Number(value.maxPages)<=16&&Number(value.cooldownMs)<=2147483647&&Number(value.readTimeoutMs)<=2147483647&&typeof value.configurationVersion==='number'&&Number.isSafeInteger(value.configurationVersion)&&value.configurationVersion>=0;
}
export interface QQHistoryRow{readonly messageId:QQMessageId|null;readonly kind:'incoming-friend-text'|'outgoing'|'unsupported';readonly text:string|null;readonly reportedAt:string|null;readonly reason:string;}
export type QQHistoryObservation={readonly kind:'response';readonly observedAt:string;readonly generation:string;readonly echo:string;readonly responseJSON:string;readonly rows:readonly QQHistoryRow[]}|{readonly kind:'failed';readonly observedAt:string;readonly code:string;readonly dispatchObserved:boolean;readonly generation?:string;readonly echo?:string;readonly responseJSON?:string;};
export interface QQHistoryPageRequest{readonly requestId:QQHistoryRequestId;readonly pageIndex:number;readonly anchorMessageId:QQMessageId|null;readonly limit:number;readonly reservedAt:string;}
export interface QQHistoryRequestRecord extends QQHistoryPageRequest{readonly enteredAt?:string;readonly outcome?:QQHistoryObservation;readonly rangeEstablished?:boolean;readonly nextAnchorMessageId?:QQMessageId;}
export interface QQHistoryCandidate{readonly candidateId:QQHistoryCandidateId;readonly requestId:QQHistoryRequestId;readonly messageId:QQMessageId;readonly text:string;readonly reportedAt:string|null;readonly eligible:boolean;readonly reason:string;}
export interface QQHistoryQuery{
 readonly queryId:QQHistoryQueryId;readonly operationId:OperationId;readonly trigger:'owner'|'reconnect';readonly target:QQBinding;readonly policy:QQHistoryPolicy;readonly startedAt:string;
 readonly anchor:{readonly inputId:InputId;readonly messageId:QQMessageId;readonly text:string}|null;
 readonly phase:'running'|'gap';readonly gapReasons:readonly string[];readonly requests:readonly QQHistoryRequestRecord[];readonly candidates:readonly QQHistoryCandidate[];
}
export interface QQHistorySource{readonly queryId:QQHistoryQueryId;readonly candidateId:QQHistoryCandidateId;readonly selectionOperationId:OperationId;readonly reportedAt:string|null;}
export interface SelectQQHistory{readonly operationId:OperationId;readonly queryId:QQHistoryQueryId;readonly candidateIds:readonly QQHistoryCandidateId[];readonly acknowledgedGap:true;readonly expectedRevision:HomeRevision;readonly expectedBindingVersion:BindingVersion;}
export interface QQHistorySelection{readonly operationId:OperationId;readonly queryId:QQHistoryQueryId;readonly candidateIds:readonly QQHistoryCandidateId[];readonly acknowledgedGap:true;readonly startedAt:string;readonly phase:'pending'|'completed';readonly receipts:readonly {readonly candidateId:QQHistoryCandidateId;readonly receipt:Exclude<InputReceipt,{kind:'uncertain'}>}[];}
export interface QQHistoryState{readonly queries:readonly QQHistoryQuery[];readonly selections:readonly QQHistorySelection[];}
export function historyInputOperation(selection:OperationId,candidate:QQHistoryCandidateId){return OperationId('history-input-'+historyDigest(selection+'\0'+candidate));}
export function validateHistoryInput(input:InputRecord|import('./inputs.ts').BoundInput,state:QQHistoryState):void{
 const source=input.historySource;if(input.origin!=='history'||!source||!plainExact(source,['queryId','candidateId','selectionOperationId','reportedAt']))throw new HomeError('INVALID_INPUT');
 const q=state.queries.find(q=>q.queryId===source.queryId),selection=state.selections.find(x=>x.operationId===source.selectionOperationId),candidate=q?.candidates.find(c=>c.candidateId===source.candidateId);
 if(!q||!selection||selection.queryId!==q.queryId||!selection.candidateIds.includes(source.candidateId)||!candidate?.eligible||input.operationId!==historyInputOperation(selection.operationId,candidate.candidateId)||input.channel!=='qq'||input.bindingId!==q.target.bindingId||input.bindingVersion!==q.target.version||input.qqSource?.messageId!==candidate.messageId||input.text!==candidate.text||source.reportedAt!==candidate.reportedAt||input.sourceEvidence!=='explicitly-selected-onebot-history')throw new HomeError('INVALID_INPUT');
}
export interface QQHistorySnapshot extends QQHistoryState{readonly revision:HomeRevision;}
export interface BeginQQHistory{readonly operationId:OperationId;readonly trigger:'owner'|'reconnect';readonly policy:QQHistoryPolicy;readonly now:string;readonly expectedBindingVersion?:BindingVersion;readonly anchorInputId?:InputId;}
export type QQHistoryFact={readonly action:'select';readonly selection:QQHistorySelection}|{readonly action:'selection-receipt';readonly selectionOperationId:OperationId;readonly candidateId:QQHistoryCandidateId;readonly receipt:Exclude<InputReceipt,{kind:'uncertain'}>}|{readonly action:'selection-finish';readonly selectionOperationId:OperationId}|{readonly action:'begin';readonly query:QQHistoryQuery}|{readonly action:'reserve';readonly queryId:QQHistoryQueryId;readonly request:QQHistoryPageRequest}|{readonly action:'enter';readonly queryId:QQHistoryQueryId;readonly requestId:QQHistoryRequestId;readonly now:string}|{readonly action:'observe';readonly queryId:QQHistoryQueryId;readonly requestId:QQHistoryRequestId;readonly outcome:QQHistoryObservation}|{readonly action:'finish';readonly queryId:QQHistoryQueryId;readonly reason:string;};
export const emptyQQHistory=():QQHistoryState=>({queries:[],selections:[]});
export function qqHistoryBusiness(fact:QQHistoryFact):unknown{if(fact.action==='select'){const {startedAt,phase,receipts,...selection}=fact.selection;return {action:fact.action,selection};}if(fact.action!=='begin')return fact;const q=fact.query;return {action:fact.action,queryId:q.queryId,operationId:q.operationId,trigger:q.trigger,target:q.target,policy:q.policy,anchor:q.anchor};}
const validTime=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value));
const invalid=():never=>{throw new HomeError('CORRUPT_QQ_HISTORY');};
function checkRow(row:QQHistoryRow){
 if(!plainExact(row,['messageId','kind','text','reportedAt','reason'])||!['incoming-friend-text','outgoing','unsupported'].includes(row.kind)||row.text!==null&&typeof row.text!=='string'||row.reportedAt!==null&&!validTime(row.reportedAt)||typeof row.reason!=='string')return invalid();
 if(row.messageId!==null)QQMessageId(row.messageId);
 if(row.kind==='incoming-friend-text'&&(!row.messageId||!row.text||Buffer.byteLength(row.text)>1048576||/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(row.text)))return invalid();
}
/** Replay uses the same Home-owned transition checks as first publication. */
export function applyQQHistoryFact(state:QQHistoryState,value:unknown,scope:{readonly roleId:RoleId;readonly binding:QQBinding|undefined;readonly inputs:readonly InputRecord[]}):QQHistoryState{
 if(!value||typeof value!=='object'||Array.isArray(value))return invalid();const fact=value as QQHistoryFact;
 if(fact.action==='select'){
  if(!plainExact(fact,['action','selection']))return invalid();const selection=fact.selection,q=state.queries.find(q=>q.queryId===selection.queryId);
  if(!plainExact(selection,['operationId','queryId','candidateIds','acknowledgedGap','startedAt','phase','receipts'])||!q||q.phase!=='gap'||!sameQQTarget(scope.binding,q.target)||selection.acknowledgedGap!==true||!Array.isArray(selection.candidateIds)||selection.candidateIds.length<1||selection.candidateIds.length>200||new Set(selection.candidateIds).size!==selection.candidateIds.length||selection.candidateIds.some(id=>!q.candidates.find(c=>c.candidateId===id)?.eligible)||!validTime(selection.startedAt)||selection.phase!=='pending'||!Array.isArray(selection.receipts)||selection.receipts.length||state.selections.some(x=>x.operationId===selection.operationId))return invalid();OperationId(selection.operationId);
  return {...state,selections:[...state.selections,structuredClone(selection)]};
 }
 if(fact.action==='selection-receipt'||fact.action==='selection-finish'){
  const selected=state.selections.find(s=>s.operationId===fact.selectionOperationId);if(!selected||selected.phase!=='pending')return invalid();let next=selected;
  if(fact.action==='selection-receipt'){
   if(!plainExact(fact,['action','selectionOperationId','candidateId','receipt'])||!selected.candidateIds.includes(fact.candidateId)||selected.receipts.some(r=>r.candidateId===fact.candidateId)||!fact.receipt||!['accepted','duplicate','rejected'].includes(fact.receipt.kind))return invalid();
   if(fact.receipt.kind==='accepted'||fact.receipt.kind==='duplicate'){const receipt=fact.receipt,q=state.queries.find(q=>q.queryId===selected.queryId)!,candidate=q.candidates.find(c=>c.candidateId===fact.candidateId)!,input=scope.inputs.find(i=>i.inputId===receipt.inputId);if(!input||input.text!==candidate.text||input.qqSource?.messageId!==candidate.messageId||input.bindingId!==q.target.bindingId||input.bindingVersion!==q.target.version||receipt.operationId!==input.operationId||receipt.receiveSequence!==input.receiveSequence||receipt.committedRevision!==input.committedRevision||receipt.roleId!==scope.roleId)return invalid();}
   next={...selected,receipts:[...selected.receipts,structuredClone({candidateId:fact.candidateId,receipt:fact.receipt})]};
  }else{if(!plainExact(fact,['action','selectionOperationId'])||selected.receipts.length!==selected.candidateIds.length)return invalid();next={...selected,phase:'completed'};}
  return {...state,selections:state.selections.map(s=>s===selected?next:s)};
 }
 if(fact.action==='begin'){
  if(!plainExact(fact,['action','query']))return invalid();const q=fact.query;
  if(!plainExact(q,['queryId','operationId','trigger','target','policy','startedAt','anchor','phase','gapReasons','requests','candidates']))return invalid();
  QQHistoryQueryId(q.queryId);OperationId(q.operationId);admitQQBinding(q.target,scope.roleId);
  if(q.queryId!=='history-'+historyDigest(q.operationId)||!['owner','reconnect'].includes(q.trigger)||!sameQQTarget(scope.binding,q.target)||!validQQHistoryPolicy(q.policy)||!validTime(q.startedAt)||q.phase!=='running'||!Array.isArray(q.gapReasons)||!Array.isArray(q.requests)||!Array.isArray(q.candidates)||q.gapReasons.length||q.requests.length||q.candidates.length||state.queries.some(x=>x.queryId===q.queryId||x.phase==='running'))return invalid();
  if(q.anchor!==null){if(!plainExact(q.anchor,['inputId','messageId','text']))return invalid();InputId(q.anchor.inputId);QQMessageId(q.anchor.messageId);const input=scope.inputs.find(x=>x.inputId===q.anchor!.inputId);if(!input||input.channel!=='qq'||input.bindingId!==q.target.bindingId||input.bindingVersion!==q.target.version||input.qqSource?.messageId!==q.anchor.messageId||input.text!==q.anchor.text)return invalid();}
  return {...state,queries:[...state.queries,structuredClone(q)]};
 }
 if(!['reserve','enter','observe','finish'].includes(fact.action))return invalid();
 QQHistoryQueryId(fact.queryId);const q=state.queries.find(x=>x.queryId===fact.queryId);if(!q||q.phase!=='running')return invalid();let next:QQHistoryQuery=q;
 if(fact.action==='reserve'){
  if(!plainExact(fact,['action','queryId','request']))return invalid();const r=fact.request;QQHistoryRequestId(r.requestId);
  if(!plainExact(r,['requestId','pageIndex','anchorMessageId','limit','reservedAt'])||r.pageIndex!==q.requests.length||r.pageIndex>=q.policy.maxPages||r.limit!==q.policy.pageSize||!validTime(r.reservedAt)||!sameQQTarget(scope.binding,q.target)||q.requests.some(x=>!x.outcome))return invalid();
  const prior=q.requests.at(-1);if(prior&&(!prior.rangeEstablished||!prior.nextAnchorMessageId||prior.outcome?.kind!=='response'||prior.outcome.rows.length!==q.policy.pageSize))return invalid();if(r.anchorMessageId!==(prior?.nextAnchorMessageId??q.anchor?.messageId??null))return invalid();if(r.anchorMessageId!==null)QQMessageId(r.anchorMessageId);
  next={...q,requests:[...q.requests,structuredClone(r)]};
 }else if(fact.action==='enter'){
  if(!plainExact(fact,['action','queryId','requestId','now'])||!validTime(fact.now)||!sameQQTarget(scope.binding,q.target))return invalid();const r=q.requests.find(x=>x.requestId===fact.requestId);if(!r||r.enteredAt||r.outcome)return invalid();next={...q,requests:q.requests.map(x=>x===r?{...r,enteredAt:fact.now}:x)};
 }else if(fact.action==='observe'){
  if(!plainExact(fact,['action','queryId','requestId','outcome']))return invalid();const r=q.requests.find(x=>x.requestId===fact.requestId),o=fact.outcome;if(!r||r.outcome||!o||!validTime(o.observedAt))return invalid();
  let rangeEstablished=false,nextAnchorMessageId:QQMessageId|undefined,candidates=[...q.candidates],reasons=[...q.gapReasons];
  if(o.kind==='response'){
   if(!plainExact(o,['kind','observedAt','generation','echo','responseJSON','rows'])||!r.enteredAt||typeof o.generation!=='string'||typeof o.echo!=='string'||typeof o.responseJSON!=='string'||Buffer.byteLength(o.responseJSON)>16777216||!Array.isArray(o.rows)||o.rows.length>r.limit)return invalid();JSON.parse(o.responseJSON);for(const row of o.rows)checkRow(row);
   const previous=q.requests.at(-2),previousRow=previous?.outcome?.kind==='response'?previous.outcome.rows.at(-1):undefined,first=o.rows[0];
   const ordered=o.rows.every((row,i)=>row.reportedAt!==null&&(i===0||Date.parse(o.rows[i-1]!.reportedAt!)<=Date.parse(row.reportedAt)));
   const boundaryMatches=!!r.anchorMessageId&&first?.messageId===r.anchorMessageId&&(r.pageIndex===0?first.kind==='incoming-friend-text'&&first.text===q.anchor?.text:!!previous?.rangeEstablished&&JSON.stringify(first)===JSON.stringify(previousRow));
   rangeEstablished=ordered&&boundaryMatches;
   if(!ordered)reasons.push('QQ_HISTORY_ORDER_UNPROVEN');if(!boundaryMatches)reasons.push('QQ_HISTORY_ANCHOR_MISSING');reasons.push('QQ_HISTORY_COMPLETENESS_UNKNOWN');
   const previousIds=new Set(q.requests.flatMap(request=>request.outcome?.kind==='response'?request.outcome.rows.flatMap(row=>row.messageId?[row.messageId]:[]):[]));const seen=new Set<string>();let progress=true;for(const [index,row]of o.rows.entries()){if(!row.messageId||seen.has(row.messageId)||index>0&&previousIds.has(row.messageId)){progress=false;continue;}seen.add(row.messageId);}
   if(!progress){rangeEstablished=false;reasons.push('QQ_HISTORY_PAGE_CYCLE');}
   for(const [index,row]of o.rows.entries()){
    if(row.kind!=='incoming-friend-text'||!row.messageId||!row.text||index===0&&row.messageId===r.anchorMessageId)continue;
    const prior=candidates.find(x=>x.messageId===row.messageId);if(prior){if(prior.text!==row.text){candidates=candidates.map(x=>x===prior?{...x,eligible:false,reason:'QQ_HISTORY_ID_CONFLICT'}:x);reasons.push('QQ_HISTORY_ID_CONFLICT');}continue;}
    const oldBinding=scope.inputs.some(input=>input.channel==='qq'&&input.bindingVersion!==q.target.version&&input.qqSource?.connectionId===q.target.connectionId&&input.qqSource.accountId===q.target.accountId&&input.qqSource.peerId===q.target.peerId&&input.qqSource.messageId===row.messageId);
    const eligible=rangeEstablished&&!oldBinding;const reason=oldBinding?'QQ_HISTORY_BEFORE_BINDING':eligible?'':'QQ_HISTORY_RANGE_UNPROVEN';
    candidates.push({candidateId:QQHistoryCandidateId('history-candidate-'+historyDigest(q.queryId+'\0'+row.messageId)),requestId:r.requestId,messageId:row.messageId,text:row.text,reportedAt:row.reportedAt,eligible,reason});
   }
   const last=o.rows.at(-1);if(rangeEstablished&&last?.messageId&&last.messageId!==r.anchorMessageId){if(last.kind==='unsupported')reasons.push('QQ_HISTORY_CURSOR_UNVERIFIED');else nextAnchorMessageId=last.messageId;}
  }else if(o.kind==='failed'){
   if(typeof o.code!=='string'||typeof o.dispatchObserved!=='boolean'||o.dispatchObserved&&!r.enteredAt)return invalid();reasons.push(o.code);
  }else return invalid();
  next={...q,gapReasons:[...new Set(reasons)],candidates,requests:q.requests.map(x=>x===r?{...r,outcome:structuredClone(o),rangeEstablished,...(nextAnchorMessageId?{nextAnchorMessageId}:{})}:x)};
 }else{
  if(!plainExact(fact,['action','queryId','reason'])||typeof fact.reason!=='string'||q.requests.some(x=>!x.outcome))return invalid();next={...q,phase:'gap',gapReasons:[...new Set([...q.gapReasons,fact.reason])]};
 }
 return {...state,queries:state.queries.map(x=>x===q?next:x)};
}
