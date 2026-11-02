import {useEffect,useRef,useState} from 'react';
import {OperationId,RoleId} from '../home/ids.ts';
import {ProfileSelectionVersion} from '../host-contracts.ts';
import {restoreConfirmation,type RestoreConfirmation,type RestoreAcceptance} from '../home/restore-acceptance.ts';
import type {HandoverRecord} from '../home/handovers.ts';
import type {RestoreProgress,RestoreRequest} from '../home/restores.ts';
import type {HomeConnectReceipt} from '../types.ts';

interface PendingConfirmation {readonly request:RestoreConfirmation;readonly profileVersion:ProfileSelectionVersion;readonly roleId:RoleId;}
export interface RestoreConfirmationActions {readonly confirmRestore:(roleId:RoleId,request:RestoreConfirmation,profileVersion:ProfileSelectionVersion)=>Promise<HomeConnectReceipt>;}
function load(key:string):PendingConfirmation|null{
 try{const value=JSON.parse(localStorage.getItem(key)||'null');if(!value)return null;return {request:restoreConfirmation(value.request),profileVersion:ProfileSelectionVersion(value.profileVersion),roleId:RoleId(value.roleId)};}catch{return null;}
}
function samePending(left:PendingConfirmation,right:PendingConfirmation):boolean{return left.roleId===right.roleId&&left.profileVersion===right.profileVersion&&left.request.operationId===right.request.operationId&&left.request.restoreOperationId===right.request.restoreOperationId&&left.request.handoverId===right.request.handoverId&&left.request.expectedManifestDigest===right.request.expectedManifestDigest&&left.request.expectedRevision===right.request.expectedRevision&&left.request.currentSourceStoppedConfirmed===right.request.currentSourceStoppedConfirmed;}

/** Only an explicit owner action issues confirmation; opening and querying remain pure reads. */
export function RestoreConfirmationPanel({actions,restoration,original,handover,acceptance,registered,roleStatus,onChanged}:{readonly actions:RestoreConfirmationActions;readonly restoration:RestoreProgress;readonly original:{readonly request:RestoreRequest;readonly profileVersion:ProfileSelectionVersion};readonly handover?:HandoverRecord;readonly acceptance?:RestoreAcceptance;readonly registered:boolean;readonly roleStatus:string;readonly onChanged:()=>Promise<unknown>}){
 const key='dsh-role-companion:restore-confirmation:v1:'+original.request.operationId;
 const[pending,setPending]=useState<PendingConfirmation|null>(()=>load(key)),[checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState<HomeConnectReceipt|null>(null);
 const mounted=useRef(true),acting=useRef(false),pendingRef=useRef(pending);pendingRef.current=pending;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const matching=restoration.operationId===original.request.operationId&&restoration.roleId===original.request.expectedRoleId&&restoration.destination===original.request.destination&&restoration.manifestDigest===original.request.expectedManifestDigest;
 const validHandover=matching&&handover?.readyRevision===restoration.sourceRevision&&handover?.stopOperationId===restoration.sourceStopOperationId;
 useEffect(()=>{
  if(!acceptance||!matching)return;
  if(acceptance.restoreOperationId!==original.request.operationId||acceptance.manifestDigest!==original.request.expectedManifestDigest||acceptance.sourceRevision!==restoration.sourceRevision||handover&&acceptance.handoverId!==handover.handoverId){setError('已保存的确认与当前恢复来源不一致。请查询核对，不提交新的确认。');return;}
  try{
   const item={roleId:original.request.expectedRoleId,profileVersion:original.profileVersion,request:restoreConfirmation({operationId:acceptance.operationId,restoreOperationId:acceptance.restoreOperationId,handoverId:acceptance.handoverId,expectedManifestDigest:acceptance.manifestDigest,expectedRevision:acceptance.sourceRevision,currentSourceStoppedConfirmed:true})};
   if(pendingRef.current&&!samePending(pendingRef.current,item)){setError('本地确认草稿与 Home 原回执不同。保留草稿，先核对原操作。');return;}
   localStorage.setItem(key,JSON.stringify(item));pendingRef.current=item;setPending(item);
  }catch{setError('无法保留 Home 原确认请求。仍可查询既有回执，本次不提交接续。');}
 },[acceptance,matching,original,restoration.sourceRevision,handover,key]);
 async function submit(){
  if(acting.current)return;
  let item=pendingRef.current;
  if(!matching){setError('恢复身份或清单不一致。请先查询核对。');return;}
  if(!item){
   if(acceptance||!checked||!validHandover||!handover||restoration.sourceRevision===undefined||restoration.phase!=='awaiting-handover')return;
   item={roleId:original.request.expectedRoleId,profileVersion:original.profileVersion,request:restoreConfirmation({operationId:OperationId(crypto.randomUUID()),restoreOperationId:original.request.operationId,handoverId:handover.handoverId,expectedManifestDigest:original.request.expectedManifestDigest,expectedRevision:restoration.sourceRevision,currentSourceStoppedConfirmed:true})};
   try{localStorage.setItem(key,JSON.stringify(item));}catch{setError('无法保留原确认请求，本次尚未提交。');return;}
   pendingRef.current=item;setPending(item);
  }
  if(item.roleId!==original.request.expectedRoleId||item.profileVersion!==original.profileVersion||item.request.restoreOperationId!==original.request.operationId||item.request.expectedManifestDigest!==original.request.expectedManifestDigest||item.request.expectedRevision!==restoration.sourceRevision){setError('本地原确认与当前恢复不一致。请保留请求并核对来源。');return;}
  acting.current=true;setBusy(true);setError('');
  try{
   const result=await actions.confirmRestore(item.roleId,item.request,item.profileVersion);
   if(result.roleId!==item.roleId||result.operationId!==item.request.operationId)throw Object.assign(new Error('RESTORE_IDENTITY_CONFLICT'),{code:'RESTORE_IDENTITY_CONFLICT'});
   if(mounted.current)setReceipt(result);
  }catch(cause){if(mounted.current){const code=cause&&typeof cause==='object'&&'code'in cause&&typeof cause.code==='string'?cause.code:'CONNECTION_UNCONFIRMED';setError(`确认尚未完成（${code}）。保留原操作，查询后按原内容接续。`);}}
  finally{acting.current=false;if(mounted.current){setBusy(false);try{await onChanged();}catch{if(mounted.current)setError('确认状态刷新中断。保留原操作，请查询确认与本机登记。');}}}
 }
 return <section aria-label="目标单活确认"><h4>目标单活确认</h4>
  <p>交接历史只说明当时的源机停稳。确认前须另行核对旧环境当前已停止；本机锁空闲和备份已校验均不能代替当前确认。旧凭据、外部目录和未决发送不会随此确认自动启用。</p>
  {error&&<p role="alert">{error}</p>}
  <dl><dt>原恢复操作</dt><dd>{original.request.operationId}</dd><dt>原 profile 引导版本</dt><dd>{original.profileVersion}</dd><dt>源 revision</dt><dd>{restoration.sourceRevision??'尚未确认'}</dd><dt>交接身份</dt><dd>{handover?.handoverId??'缺少当前恢复对应的交接证明'}</dd><dt>源停稳操作</dt><dd>{handover?.stopOperationId??'尚未确认'}</dd><dt>关联备份操作</dt><dd>{handover?.backupOperationId??'尚未确认'}</dd></dl>
  {handover?.recovery?.priorNativeFlush==='unknown'&&<p>旧执行栈没有恢复，旧原生 flush 未知；中断和缺口仍保留，不能视为旧动作全部成功。</p>}
  {!pending&&!acceptance&&restoration.phase==='awaiting-handover'&&<><label><input type="checkbox" aria-label="我确认旧环境当前已停止" checked={checked} disabled={busy||!validHandover} onChange={event=>setChecked(event.target.checked)}/>我确认旧环境当前已停止</label><button disabled={busy||!checked||!validHandover} onClick={()=>void submit()}>确认交接并登记本机</button></>}
  {!validHandover&&!acceptance&&<p>缺少与清单和源 revision 对应的交接证明，当前不能确认运行。</p>}
  {pending&&<><p>原确认操作：{pending.request.operationId}。接续保留当时的声明；若旧环境后来重启，应先重新停稳核对，不能把旧回执作为当前单活证明。</p>{!registered&&<button disabled={busy} onClick={()=>void submit()}>按原确认操作接续登记</button>}</>}
  {acceptance&&<p>Home 已保存确认：{acceptance.operationId}，提交 revision {acceptance.committedRevision}。这是原操作事实，不是新的当前停机声明。</p>}
  {receipt&&<p role="status">{receipt.registration==='registered'?'本机登记已确认。':`Home 确认已保存，本机登记${receipt.registration==='uncertain'?'待核对':'尚未完成'}（${receipt.errorCode??'unknown'}）；请沿原操作接续。`}</p>}
  <p>本机登记：{registered?'已核对':'尚未核对'}；角色运行状态：{roleStatus}。复制或 accepted 阶段本身不表示已运行。</p>
  <button disabled={busy} onClick={()=>void onChanged()}>查询确认与本机登记</button>
 </section>;
}
