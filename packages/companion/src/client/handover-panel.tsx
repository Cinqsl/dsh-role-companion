import {useEffect,useRef,useState} from 'react';
import {OperationId,RoleId,HomeRevision} from '../home/ids.ts';
import {validateHandoverRequest,type HandoverRequest,type HandoverProgress} from '../home/handovers.ts';

export interface HandoverActions {
 readonly requestHandover:(roleId:RoleId,request:HandoverRequest)=>Promise<HandoverProgress>;
 readonly readHandover:(roleId:RoleId,operationId:OperationId)=>Promise<HandoverProgress>;
}
interface PendingHandover {readonly roleId:RoleId;readonly request:HandoverRequest;}
const labels:Record<HandoverProgress['phase'],string>={'not-found':'未找到原交接',closing:'等待原动作、最终记录及模型停稳',copying:'已停稳，正在制作交接备份',verified:'交接备份已校验，旧实例保持关闭',uncertain:'交接结果待核对',failed:'交接未完成'};
const errorCode=(error:unknown)=>error&&typeof error==='object'&&'code'in error&&typeof error.code==='string'?error.code:'CONNECTION_UNCONFIRMED';
function stored(key:string,roleId:RoleId):PendingHandover|null{
 try{const value:unknown=JSON.parse(localStorage.getItem(key)||'null');if(!value||typeof value!=='object'||!('roleId'in value)||value.roleId!==roleId||!('request'in value)||!validateHandoverRequest(value.request))return null;return {roleId,request:value.request};}catch{return null;}
}

/** Source release is explicit owner work. The receipt never substitutes for current target confirmation. */
export function HandoverPanel({actions,roleId,revision,canStart,onChanged}:{readonly actions:HandoverActions;readonly roleId:RoleId;readonly revision:HomeRevision;readonly canStart:boolean;readonly onChanged:()=>Promise<unknown>}){
 const key='dsh-role-companion:handover:v1:'+roleId;
 const[pending,setPending]=useState<PendingHandover|null>(()=>stored(key,roleId)),[destination,setDestination]=useState(''),[queryId,setQueryId]=useState('');
 const[progress,setProgress]=useState<HandoverProgress|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[watching,setWatching]=useState(true),[notFound,setNotFound]=useState(false),[rejectedBeforeCommit,setRejectedBeforeCommit]=useState(false);
 const mounted=useRef(true),generation=useRef(0),sequence=useRef(0),acting=useRef(false),pendingRef=useRef(pending);pendingRef.current=pending;
 const id=pending?.request.operationId??progress?.operationId;
 const selected=useRef(id);selected.current=id;
 const valid=(ticket:number)=>mounted.current&&generation.current===ticket;
 const invalidate=()=>{generation.current++;sequence.current++;};
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;invalidate();};},[]);

 async function refresh(automatic=false,requestedId?:OperationId){
  if(automatic&&acting.current)return;
  let operationId=requestedId??selected.current;
  if(!operationId){try{operationId=OperationId(queryId.trim());}catch{setError('填写原交接操作 ID 后查询。');return;}}
  if(selected.current&&selected.current!==operationId){invalidate();setProgress(null);}selected.current=operationId;
  const ticket=generation.current,issued=++sequence.current;
  try{const result=await actions.readHandover(roleId,operationId);if(!valid(ticket)||issued!==sequence.current)return;if(result.roleId!==roleId||result.operationId!==operationId)throw Object.assign(new Error('HANDOVER_IDENTITY_CONFLICT'),{code:'HANDOVER_IDENTITY_CONFLICT'});setProgress(result);setNotFound(result.phase==='not-found');setError('');await onChanged();}
  catch(cause){if(valid(ticket)&&issued===sequence.current){setNotFound(false);setError(`交接查询未确认（${errorCode(cause)}）。保留原操作，不重新制作另一份交接。`);}}
 }
 useEffect(()=>{if(!watching||!id||!progress||!['closing','copying','uncertain'].includes(progress.phase))return;const timer=setInterval(()=>void refresh(true),750);return()=>clearInterval(timer);},[actions,id,watching,progress?.phase]);

 async function submit(){
  if(acting.current)return;
  let item=pendingRef.current;
  if(!item){
   if(!canStart){setError('当前实例不能开始新的交接，请查询已有操作。');return;}
   const request={operationId:OperationId(crypto.randomUUID()),destination,expectedRevision:HomeRevision(revision)};
   if(!validateHandoverRequest(request)){setError('填写不在角色之家内的交接备份绝对路径。');return;}
   item={roleId,request};
   try{localStorage.setItem(key,JSON.stringify(item));}catch{setError('无法保留原交接请求，本次尚未提交。');return;}
   invalidate();pendingRef.current=item;selected.current=item.request.operationId;setPending(item);setProgress(null);
  }
  const owned=item,ticket=generation.current,issued=++sequence.current;
  acting.current=true;setBusy(true);setError('');setNotFound(false);setRejectedBeforeCommit(false);setWatching(true);
  try{const result=await actions.requestHandover(owned.roleId,owned.request);if(!valid(ticket)||issued!==sequence.current)return;if(result.operationId!==owned.request.operationId||result.roleId!==owned.roleId)throw Object.assign(new Error('HANDOVER_IDENTITY_CONFLICT'),{code:'HANDOVER_IDENTITY_CONFLICT'});setProgress(result);}
  catch(cause){if(valid(ticket)&&issued===sequence.current){const code=errorCode(cause);setRejectedBeforeCommit(['INVALID_HANDOVER','REVISION_CONFLICT','HANDOVER_ALREADY_REQUESTED','BACKUP_DESTINATION_NOT_EMPTY','BACKUP_PATH_OVERLAP','UNSAFE_BACKUP_PATH'].includes(code));setError(`交接未确认（${code}）。保留原请求和备份目录，先查询或按原操作接续。`);}}
  finally{if(mounted.current){acting.current=false;setBusy(false);}if(valid(ticket)){try{await onChanged();await refresh(false,owned.request.operationId);}catch{if(valid(ticket))setError('交接状态刷新中断。请查询原操作，关闭页面不会撤销已提交工作。');}}}
 }
 function discard(){
  if(acting.current||!notFound||!rejectedBeforeCommit)return;
  try{localStorage.removeItem(key);}catch{setError('无法清除本地交接草稿，原请求仍保留。');return;}
  invalidate();pendingRef.current=null;selected.current=undefined;setPending(null);setProgress(null);setDestination('');setQueryId('');setError('');setNotFound(false);setRejectedBeforeCommit(false);
 }
 return <section aria-label="迁移交接"><h3>迁移交接</h3>
  <p>在旧实例明确发起交接：先等待已开始动作、最终记录和模型停稳，再制作完整交接备份。旧实例随后保持只读；新环境仍需核对来源并明确确认旧环境已停止。</p>
  {error&&<p role="alert">{error}</p>}
  {progress?.record?.recovery?.priorNativeFlush==='unknown'&&<p role="status">旧进程中断后的原生会话 flush 状态未知，执行栈没有恢复。已保留中断尝试和结果缺口；目标环境仍须明确确认旧实例当前已停止。</p>}
  {!pending&&(!progress||progress.phase==='not-found')&&canStart&&<fieldset disabled={busy}><legend>停止当前旧实例并制作交接备份</legend><label>交接备份目录<input aria-label="交接备份目录" value={destination} onChange={event=>setDestination(event.target.value)}/></label><button onClick={()=>void submit()}>停稳旧实例并制作交接备份</button></fieldset>}
  {!pending&&<div><label>已有交接操作 ID<input aria-label="已有交接操作 ID" value={queryId} onChange={event=>setQueryId(event.target.value)}/></label><button disabled={busy} onClick={()=>{try{void refresh(false,OperationId(queryId.trim()));}catch{setError('原交接操作 ID 无效。');}}}>查询指定交接</button></div>}
  {(pending||progress)&&<><dl><dt>交接操作 ID</dt><dd>{id}</dd><dt>阶段</dt><dd>{progress?labels[progress.phase]:'提交结果待核对'}</dd><dt>交接备份目录</dt><dd>{pending?.request.destination??progress?.backup?.destination??'尚未核对'}</dd>
   {progress?.record&&<><dt>交接身份</dt><dd>{progress.record.handoverId}</dd><dt>请求 revision</dt><dd>{progress.record.requestedRevision}</dd><dt>停稳交接 revision</dt><dd>{progress.record.readyRevision??'尚未完成'}</dd><dt>停止操作</dt><dd>{progress.record.stopOperationId}</dd><dt>关联备份操作</dt><dd>{progress.record.backupOperationId}</dd></>}
   {progress?.backup&&<><dt>清单 SHA-256</dt><dd>{progress.backup.manifestDigest??'尚未完成'}</dd><dt>备份内容校验</dt><dd>{progress.backup.verifiedFiles} / {progress.backup.files.length+(progress.backup.maintenanceFiles?.length??0)}</dd></>}
   {progress?.error&&<><dt>待核对原因</dt><dd>{progress.error}</dd></>}
  </dl><button onClick={()=>void refresh()}>查询原交接</button>{pending&&progress?.phase!=='verified'&&<button disabled={busy} onClick={()=>void submit()}>按原操作接续交接</button>}<button onClick={()=>setWatching(value=>!value)}>{watching?'暂停交接自动查询':'继续交接自动查询'}</button>{pending&&notFound&&rejectedBeforeCommit&&<button disabled={busy} onClick={discard}>放弃未提交的交接草稿</button>}</>}
  {progress?.phase==='verified'&&<p>交接备份已校验。该历史回执不能证明其他副本当前也已停止；目标环境仍须完成当前单活确认。</p>}
  <p>普通停止或普通备份不代替本次交接。查询、关页和重新打开不会创建模型请求，也不会激活任何副本。</p>
 </section>;
}
