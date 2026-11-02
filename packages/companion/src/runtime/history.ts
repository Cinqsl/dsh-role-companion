import {qqInputIdentity} from '../home/qq-key.ts';
import type {BoundInput,InputReceipt} from '../home/inputs.ts';
import {OperationId,type InputId} from '../home/ids.ts';
import type {BindingVersion} from '../home/ids.ts';
import {sameQQTarget} from '../home/deliveries.ts';
import type {QQBinding} from '../home/qq.ts';
import type {OpenedRoleHome} from '../home/index.ts';
import {historyInputOperation,type SelectQQHistory,type QQHistorySelection,historyDigest,QQHistoryRequestId,type QQHistoryQuery,type QQHistoryPolicy,type QQHistorySnapshot,type QQHistoryObservation,type QQHistoryPageRequest} from '../home/qq-history.ts';
import {ExecutionError,safeExecutionCode} from './execution.ts';
export interface PreparedQQHistoryRead{readonly query:QQHistoryQuery;readonly request:QQHistoryPageRequest;invoke<T>(effect:()=>Promise<T>):Promise<T>;}
/** Actual protocol varies here; scheduling, cooldown and records remain Runtime/Home owned. */
export interface QQHistoryPort{onVerified?(listener:(generation:string,target:QQBinding)=>Promise<void>):()=>void;onAvailability?(listener:()=>void):()=>void;canRead(target:QQBinding):boolean;policy():QQHistoryPolicy;read(prepared:PreparedQQHistoryRead):Promise<QQHistoryObservation>;}
export function createQQHistoryRuntime(options:{readonly home:OpenedRoleHome;readonly port:QQHistoryPort|undefined;readonly now:()=>string;readonly guard:()=>Promise<void>;readonly localIdle:(target:QQBinding,signal:AbortSignal)=>Promise<void>;readonly receive:(input:BoundInput)=>Promise<InputReceipt>;readonly archive:(operationId:OperationId,save:()=>Promise<void>)=>Promise<void>}){
 const {home,port,archive}=options;const idleWaiters=new Set<AbortController>();const selections=new Map<OperationId,Promise<QQHistorySelection>>();let task:Promise<void>|undefined,started:QQHistoryQuery['queryId']|undefined;
 const read=()=>home.readQQHistory();
 let reconnect:{operationId:OperationId;target:QQBinding;anchorInputId:InputId}|undefined,activating=false;
 const offVerified=port?.onVerified?.(async(generation,target)=>{const snapshot=await home.readSnapshot(),anchor=snapshot.inputs.filter(i=>i.channel==='qq'&&i.bindingId===target.bindingId&&i.bindingVersion===target.version&&i.qqSource).at(-1);reconnect=anchor?{operationId:OperationId('history-reconnect-'+historyDigest(home.roleId+'\0'+generation)),target,anchorInputId:anchor.inputId}:undefined;});
 const offAvailability=port?.onAvailability?.(()=>{void activate();});
 async function activate(){if(activating||!reconnect||!port?.canRead(reconnect.target))return;activating=true;const captured=reconnect;try{await options.guard();await query({operationId:captured.operationId,trigger:'reconnect',expectedBindingVersion:captured.target.version,anchorInputId:captured.anchorInputId});if(reconnect===captured)reconnect=undefined;}catch(error){if(safeExecutionCode(error)!=='STOP_RECOVERY_PENDING'&&reconnect===captured)reconnect=undefined;}finally{activating=false;}}
 const id=(prefix:string,value:string)=>OperationId(prefix+historyDigest(value));
 // A rejected command is not storage debt. A failed publication keeps only its original save closure.
 const denials=new Set(['INVALID_QQ_HISTORY_POLICY','INVALID_QQ_HISTORY_ID','INVALID_OPERATION_ID','QQ_NOT_BOUND','QQ_BINDING_CHANGED','QQ_HISTORY_QUERY_RUNNING','QQ_HISTORY_COOLDOWN','QQ_HISTORY_INITIAL_BINDING','QQ_HISTORY_ANCHOR_CHANGED','REVISION_CONFLICT','OPERATION_CONFLICT','QQ_HISTORY_QUERY_NOT_FOUND','CORRUPT_QQ_HISTORY','READ_ONLY_HOME','HOME_CLOSED']);
 async function saveIntent<T>(operationId:OperationId,save:()=>Promise<T>,onRepair?:(value:T)=>Promise<void>):Promise<T>{
  let value:T|undefined,denied:unknown,first=true;
  await archive(operationId,async()=>{const repairing=!first;first=false;let result:T;
   try{result=await save();}catch(error){if(denials.has(safeExecutionCode(error))){denied=error;return;}throw error;}
   if(repairing)await onRepair?.(result);value=result;
  });if(denied)throw denied;return value!;
 }
 async function gate(query:QQHistoryQuery){await options.guard();const target=(await home.readSnapshot()).qqBinding;if(!sameQQTarget(target,query.target))throw new ExecutionError('QQ_BINDING_CHANGED');if(!port?.canRead(query.target))throw new ExecutionError('QQ_HISTORY_NOT_CONNECTED');if(JSON.stringify(port.policy())!==JSON.stringify(query.policy))throw new ExecutionError('QQ_HISTORY_CONFIGURATION_CHANGED');}
 async function run(query:QQHistoryQuery){
  let reason='QQ_HISTORY_COMPLETENESS_UNKNOWN';
  try{
   for(let pageIndex=0;pageIndex<query.policy.maxPages;pageIndex++){
    await gate(query);const waiter=new AbortController();idleWaiters.add(waiter);try{await options.localIdle(query.target,waiter.signal);}finally{idleWaiters.delete(waiter);}
    await gate(query);const current=(await read()).queries.find(q=>q.queryId===query.queryId)!,previous=current.requests.at(-1);
    const request:QQHistoryPageRequest={requestId:QQHistoryRequestId('history-request-'+historyDigest(query.queryId+':'+pageIndex)),pageIndex,anchorMessageId:previous?.nextAnchorMessageId??query.anchor?.messageId??null,limit:query.policy.pageSize,reservedAt:options.now()};
    await archive(id('history-reserve-',request.requestId),()=>home.reserveQQHistoryPage({operationId:id('history-reserve-',request.requestId),queryId:query.queryId,page:request}));
    let invoked=false,entered=false;
    const prepared:PreparedQQHistoryRead=Object.freeze({query,request,async invoke<T>(effect:()=>Promise<T>):Promise<T>{if(invoked)throw new ExecutionError('QQ_HISTORY_PERMIT_USED');invoked=true;await gate(query);const now=options.now();await archive(id('history-enter-',request.requestId),()=>home.enterQQHistoryPage({operationId:id('history-enter-',request.requestId),queryId:query.queryId,requestId:request.requestId,now}));await gate(query);entered=true;return effect();}});
    let outcome:QQHistoryObservation;try{outcome=await port!.read(prepared);if(!entered&&(outcome.kind==='response'||outcome.dispatchObserved))throw new ExecutionError('QQ_HISTORY_NOT_DISPATCHED');}catch(error){outcome={kind:'failed',code:safeExecutionCode(error),dispatchObserved:entered,observedAt:options.now()};}
    const stable=structuredClone(outcome);await archive(id('history-result-',request.requestId),()=>home.observeQQHistoryPage({operationId:id('history-result-',request.requestId),queryId:query.queryId,requestId:request.requestId,outcome:stable}));
    const saved=(await read()).queries.find(q=>q.queryId===query.queryId)!.requests.at(-1)!;
    if(outcome.kind==='failed'){reason=outcome.code;break;}if(!saved.rangeEstablished){reason=query.anchor?'QQ_HISTORY_RANGE_UNPROVEN':'QQ_HISTORY_ANCHOR_MISSING';break;}if(outcome.rows.length<request.limit||!saved.nextAnchorMessageId)break;
    if(pageIndex===query.policy.maxPages-1)reason='QQ_HISTORY_PAGE_LIMIT';
   }
  }catch(error){reason=safeExecutionCode(error);}
  await archive(id('history-finish-',query.queryId),()=>home.finishQQHistory({operationId:id('history-finish-',query.queryId),queryId:query.queryId,reason}));
 }
 function launch(query:QQHistoryQuery){if(query.phase!=='running'||started===query.queryId)return;started=query.queryId;const current=run(query);task=current;void current.finally(()=>{if(task===current)task=undefined;}).catch(()=>{});}
 async function query(request:{readonly operationId:OperationId;readonly trigger?:'owner'|'reconnect';readonly expectedBindingVersion?:BindingVersion;readonly anchorInputId?:InputId}):Promise<QQHistoryQuery>{
   OperationId(request.operationId);await options.guard();const previous=(await read()).queries.find(q=>q.operationId===request.operationId);if(previous){const recovered=await home.beginQQHistory({operationId:request.operationId,trigger:previous.trigger,policy:previous.policy,now:previous.startedAt});launch(recovered);return recovered;}
   if(!port)throw new ExecutionError('QQ_HISTORY_UNAVAILABLE');const binding=(await home.readSnapshot()).qqBinding;if(!binding||!port.canRead(binding))throw new ExecutionError('QQ_HISTORY_NOT_CONNECTED');
   const begin={operationId:request.operationId,trigger:request.trigger??'owner',policy:structuredClone(port.policy()),now:options.now(),expectedBindingVersion:request.expectedBindingVersion??binding.version,...(request.anchorInputId?{anchorInputId:request.anchorInputId}:{})};
   const query=await saveIntent(request.operationId,()=>home.beginQQHistory(begin),async original=>{if(original.phase==='running')await home.finishQQHistory({operationId:id('history-finish-',original.queryId),queryId:original.queryId,reason:'QQ_HISTORY_NOT_DISPATCHED'});});
   launch(query);return query;
  }
 return {
  read,activate,interrupt(code:'ROLE_STOPPING'|'QQ_BINDING_CHANGED'|'SOURCE_CLEANUP'|'FORMAT_UPGRADE'){for(const waiter of idleWaiters)waiter.abort(code);},dispose(){offVerified?.();offAvailability?.();reconnect=undefined;},
  async recover(){for(const query of (await read()).queries.filter(q=>q.phase==='running')){
   for(const request of query.requests.filter(r=>!r.outcome)){const operationId=id('history-result-',request.requestId);await home.observeQQHistoryPage({operationId,queryId:query.queryId,requestId:request.requestId,outcome:{kind:'failed',observedAt:options.now(),code:'PROCESS_INTERRUPTED',dispatchObserved:!!request.enteredAt}});}
   await home.finishQQHistory({operationId:id('history-finish-',query.queryId),queryId:query.queryId,reason:'PROCESS_INTERRUPTED'});
  }},
  query,
  async select(request:SelectQQHistory):Promise<QQHistorySelection>{
   OperationId(request.operationId);await options.guard();const begin=structuredClone({...request,now:options.now()});let selection=await saveIntent(request.operationId,()=>home.beginQQHistorySelection(begin));if(selection.phase==='completed')return selection;
   const active=selections.get(request.operationId);if(active)return active;
   const work=(async()=>{const state=await read(),query=state.queries.find(q=>q.queryId===selection.queryId)!;
    for(const candidateId of selection.candidateIds){if(selection.receipts.some(r=>r.candidateId===candidateId))continue;const candidate=query.candidates.find(c=>c.candidateId===candidateId)!;
     const source={connectionId:query.target.connectionId,accountId:query.target.accountId,peerId:query.target.peerId,direction:'incoming' as const,messageId:candidate.messageId};
     const input:BoundInput={...qqInputIdentity(query.target,source),operationId:historyInputOperation(selection.operationId,candidateId),bindingId:query.target.bindingId,bindingVersion:query.target.version,channel:'qq',qqSource:source,text:candidate.text,origin:'history',historySource:{queryId:query.queryId,candidateId,selectionOperationId:selection.operationId,reportedAt:candidate.reportedAt},receivedAt:options.now(),sourceEvidence:'explicitly-selected-onebot-history'};
     let receipt:InputReceipt|undefined;const operationId=id('history-selected-',selection.operationId+'\0'+candidateId);
     await archive(input.operationId,async()=>{
      if(!receipt)receipt=await options.receive(input);
      // Repair only the already-issued original Home admission; never replay a protocol/model action.
      else if(receipt.kind==='uncertain')receipt=await home.acceptInput(input);
      if(receipt.kind==='uncertain')throw new ExecutionError('IO_UNCERTAIN');await home.recordQQHistorySelection({operationId,selectionOperationId:selection.operationId,candidateId,receipt});
     });
    }
    const operationId=id('history-selection-finish-',selection.operationId);await archive(operationId,()=>home.finishQQHistorySelection({operationId,selectionOperationId:selection.operationId}));return (await read()).selections.find(s=>s.operationId===selection.operationId)!;
   })();selections.set(request.operationId,work);try{return await work;}finally{if(selections.get(request.operationId)===work)selections.delete(request.operationId);}
  },
  async drain(){await task;await Promise.all(selections.values());},
 };
}
