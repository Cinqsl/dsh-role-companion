import {useEffect,useRef,useState} from 'react';
import {OperationId,RoleId,BackupManifestDigest} from '../home/ids.ts';
import {validateRestoreRequest,type RestoreProgress,type RestoreRead,type RestoreRequest} from '../home/restores.ts';
import {ProfileSelectionVersion} from '../host-contracts.ts';

export interface RestorationActions {
 readonly requestRestore:(request:RestoreRequest,expectedProfileVersion:ProfileSelectionVersion)=>Promise<RestoreProgress>;
 readonly readRestore:(destination:string,request:RestoreRead)=>Promise<RestoreProgress>;
}
interface PendingRestore {readonly request:RestoreRequest;readonly profileVersion:ProfileSelectionVersion;}
const storageKey='dsh-role-companion:restore:v1';
const phases:Record<RestoreProgress['phase'],string>={'not-found':'未找到原操作',copying:'正在复制',verifying:'正在校验','awaiting-handover':'副本已校验，等待单活交接',accepted:'交接确认已保存；本机登记另行核对',uncertain:'结果待核对',failed:'恢复失败'};
function stored():PendingRestore|null{
 try{const item:unknown=JSON.parse(localStorage.getItem(storageKey)||'null');if(!item||typeof item!=='object'||!('request'in item)||!('profileVersion'in item)||!validateRestoreRequest(item.request))return null;return {request:item.request,profileVersion:ProfileSelectionVersion(item.profileVersion)};}catch{return null;}
}
function failure(error:unknown):string{
 const code=error&&typeof error==='object'&&'code'in error&&typeof error.code==='string'?error.code:'CONNECTION_UNCONFIRMED';
 if(code==='BACKUP_ACCESS_BUSY')return '备份仍被其他访问占用。结束该访问后查询或按原操作接续。';
 if(code==='PROFILE_VERSION_CONFLICT')return '当前 profile 已变化。保留原请求并查询结果，不用新版本覆盖原操作。';
 return `恢复未确认（${code}）。保留原操作、路径和清单，先查询结果或按原内容接续。`;
}

/** Browser state remembers an owner request; only the Home/Host receipt determines its effect. */
export function RestorePanel({actions,profileVersion,restoration,restorationRequest,onChanged,canCreate=true}:{readonly actions:RestorationActions;readonly profileVersion:ProfileSelectionVersion;readonly restoration?:RestoreProgress;readonly restorationRequest?:PendingRestore;readonly onChanged:()=>Promise<unknown>;readonly canCreate?:boolean}){
 const[pending,setPending]=useState<PendingRestore|null>(stored),[progress,setProgress]=useState<RestoreProgress|null>(null);
 const[backupPath,setBackupPath]=useState(''),[destination,setDestination]=useState(''),[roleId,setRoleId]=useState(''),[manifest,setManifest]=useState('');
 const[busy,setBusy]=useState(false),[watching,setWatching]=useState(true),[error,setError]=useState(''),[queriedNotFound,setQueriedNotFound]=useState(false);
 const mounted=useRef(true),generation=useRef(0),replySequence=useRef(0),acting=useRef(false),pendingRef=useRef(pending);
 pendingRef.current=pending;
 const chosen=progress??(restoration&&(!pending||restoration.operationId===pending.request.operationId)?restoration:undefined);
 const selected=pending?{destination:pending.request.destination,operationId:pending.request.operationId,expectedRoleId:pending.request.expectedRoleId}:chosen?{destination:chosen.destination,operationId:chosen.operationId,expectedRoleId:chosen.roleId}:undefined;
 const selectedRef=useRef(selected);selectedRef.current=selected;
 const selectionKey=selected?JSON.stringify(selected):'';
 const observedSelection=useRef(selectionKey);
 const valid=(ticket:number)=>mounted.current&&generation.current===ticket;
 const invalidate=()=>{generation.current++;replySequence.current++;};
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;invalidate();};},[]);
 useEffect(()=>{if(observedSelection.current!==selectionKey){observedSelection.current=selectionKey;invalidate();setQueriedNotFound(false);}},[selectionKey]);
 useEffect(()=>{
  if(pendingRef.current||!restorationRequest)return;
  const request=restorationRequest.request;
  if(!validateRestoreRequest(request)||restoration&&(request.operationId!==restoration.operationId||request.expectedRoleId!==restoration.roleId||request.destination!==restoration.destination||!!restoration.backupPath&&request.backupPath!==restoration.backupPath||!!restoration.manifestDigest&&request.expectedManifestDigest!==restoration.manifestDigest)){setError('已保存进度与原请求不一致，请先查询核对，不提交新的恢复。');return;}
  try{const item={request,profileVersion:ProfileSelectionVersion(restorationRequest.profileVersion)};localStorage.setItem(storageKey,JSON.stringify(item));pendingRef.current=item;setPending(item);}catch{setError('无法在浏览器保留原恢复请求；当前仍可查询进度，尚未提交接续。');}
 },[restorationRequest,restoration]);

 async function refresh(automatic=false){
  const target=selectedRef.current;if(!target||automatic&&acting.current)return;
  const ticket=generation.current,sequence=++replySequence.current;
  try{
   const result=await actions.readRestore(target.destination,{operationId:target.operationId,expectedRoleId:target.expectedRoleId});
   if(!valid(ticket)||sequence!==replySequence.current)return;
   if(result.operationId!==target.operationId||result.roleId!==target.expectedRoleId||result.destination!==target.destination)throw Object.assign(new Error('RESTORE_IDENTITY_CONFLICT'),{code:'RESTORE_IDENTITY_CONFLICT'});
   setProgress(result);setQueriedNotFound(result.phase==='not-found');setError('');
   await onChanged();
  }catch(cause){if(valid(ticket)&&sequence===replySequence.current){setQueriedNotFound(false);setError(failure(cause));}}
 }
 useEffect(()=>{if(!watching||!selected||!chosen||!['copying','verifying','uncertain'].includes(chosen.phase))return;const timer=setInterval(()=>void refresh(true),750);return()=>clearInterval(timer);},[actions,selectionKey,watching,chosen?.phase]);

 async function submit(){
  if(acting.current)return;
  let item=pendingRef.current;
  if(!item){
   if(!canCreate){setError('当前 profile 已接入角色；请在空白 profile 开始新的恢复。');return;}
   if(!backupPath.trim()||!destination.trim()){setError('填写完整备份目录和一个空的目标 Home 绝对路径。');return;}
   try{item={request:{operationId:OperationId(crypto.randomUUID()),backupPath:backupPath.trim(),destination:destination.trim(),expectedRoleId:RoleId(roleId.trim()),expectedManifestDigest:BackupManifestDigest(manifest.trim())},profileVersion};}
   catch{setError('请核对角色 ID 和备份清单的完整 SHA-256。');return;}
   try{localStorage.setItem(storageKey,JSON.stringify(item));}catch{setError('无法保留原恢复请求，本次尚未提交。请先检查浏览器存储。');return;}
   invalidate();pendingRef.current=item;setPending(item);setProgress(null);
   selectedRef.current={destination:item.request.destination,operationId:item.request.operationId,expectedRoleId:item.request.expectedRoleId};
   observedSelection.current=JSON.stringify(selectedRef.current);
  }
  const request=item,ticket=generation.current,sequence=++replySequence.current;
  acting.current=true;setBusy(true);setWatching(true);setQueriedNotFound(false);setError('');
  try{
   const result=await actions.requestRestore(request.request,request.profileVersion);
   if(result.operationId!==request.request.operationId||result.roleId!==request.request.expectedRoleId||result.destination!==request.request.destination)throw Object.assign(new Error('RESTORE_IDENTITY_CONFLICT'),{code:'RESTORE_IDENTITY_CONFLICT'});
   if(valid(ticket)&&sequence===replySequence.current){setProgress(result);setError('');}
  }catch(cause){if(valid(ticket)&&sequence===replySequence.current)setError(failure(cause));}
  finally{
   if(mounted.current){acting.current=false;setBusy(false);}
   if(valid(ticket)){setQueriedNotFound(false);try{await onChanged();await refresh();}catch{if(valid(ticket))setError('恢复状态刷新中断。请查询原操作；关闭面板不会撤销已提交任务。');}}
  }
 }
 function discard(){
  if(acting.current||!queriedNotFound)return;
  try{localStorage.removeItem(storageKey);}catch{setError('无法清除本地草稿，原请求仍保留。');return;}
  invalidate();pendingRef.current=null;selectedRef.current=undefined;observedSelection.current='';setPending(null);setProgress(null);setBackupPath('');setDestination('');setRoleId('');setManifest('');setError('');setQueriedNotFound(false);setWatching(false);
 }
 return <section aria-label="恢复角色之家"><h3>恢复角色之家</h3>
  <p>从完整备份恢复同一角色。复制和校验完成后先保持只读，明确单活交接后才可运行。旧环境凭据和本机目录映射不随备份启用。</p>
  {error&&<p role="alert">{error}</p>}
  {!pending&&!chosen&&canCreate&&<fieldset disabled={busy}><legend>选择完整备份与空目标</legend>
   <label>备份目录<input aria-label="备份目录" value={backupPath} onChange={event=>setBackupPath(event.target.value)}/></label>
   <label>恢复目标 Home 目录<input aria-label="恢复目标 Home 目录" value={destination} onChange={event=>setDestination(event.target.value)}/></label>
   <label>备份角色 ID<input aria-label="备份角色 ID" value={roleId} onChange={event=>setRoleId(event.target.value)}/></label>
   <label>备份清单 SHA-256<input aria-label="备份清单 SHA-256" value={manifest} onChange={event=>setManifest(event.target.value)}/></label>
   <button onClick={()=>void submit()}>复制并校验备份</button>
  </fieldset>}
  {!pending&&!chosen&&!canCreate&&<p>当前 profile 已接入角色。请在空白 profile 恢复副本；本环境可继续查询既有角色及交接记录。</p>}
  {selected&&<><dl><dt>恢复阶段</dt><dd>{chosen?phases[chosen.phase]:'提交结果待核对'}</dd><dt>目标 Home</dt><dd>{selected.destination}</dd>
   {chosen&&<><dt>复制与校验</dt><dd>已复制 {chosen.copiedFiles} / {chosen.files.length} 项，已校验 {chosen.verifiedFiles} 项</dd>{chosen.error&&<><dt>原因</dt><dd>{chosen.error}</dd></>}</>}
  </dl><details><summary>恢复操作与来源依据</summary><dl><dt>操作 ID</dt><dd>{selected.operationId}</dd><dt>角色 ID</dt><dd>{selected.expectedRoleId}</dd><dt>原 profile 引导版本</dt><dd>{pending?.profileVersion??restorationRequest?.profileVersion??'原基线尚未确认'}</dd><dt>备份目录</dt><dd>{pending?.request.backupPath??chosen?.backupPath}</dd><dt>清单 SHA-256</dt><dd>{pending?.request.expectedManifestDigest??chosen?.manifestDigest??'尚未确认'}</dd><dt>源 revision</dt><dd>{chosen?.sourceRevision??'尚未确认'}</dd><dt>源停稳操作</dt><dd>{chosen?.sourceStopOperationId??'尚未确认'}</dd></dl></details>
   <button onClick={()=>void refresh()}>查询原恢复</button>
   {pending&&chosen?.phase!=='awaiting-handover'&&chosen?.phase!=='accepted'&&<button disabled={busy} onClick={()=>void submit()}>按原操作接续恢复</button>}
   <button onClick={()=>setWatching(value=>!value)}>{watching?'暂停自动查询':'继续自动查询'}</button>
   {pending&&queriedNotFound&&<button disabled={busy} onClick={discard}>放弃未提交的恢复草稿</button>}
  </>}
  {chosen?.phase==='awaiting-handover'&&<p>副本已复制并校验，当前仍等待单活交接。历史备份回执或本机锁空闲不能证明旧环境已经停止。</p>}
  <p>查询或重开本面板不会推理、发送或激活副本。关闭页面不撤销已保存进度；结果不明时沿原操作核对。</p>
 </section>;
}
