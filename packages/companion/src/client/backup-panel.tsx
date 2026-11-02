import {useEffect,useRef,useState} from 'react';
import type {Context} from '@deepseek-ai/cordis';
import {OperationId,RoleId} from '../home/ids.ts';
import type {BackupProgress,BackupRequest} from '../home/backups.ts';
import type {RoleView} from '../runtime/index.ts';
const labels={ 'not-found':'未找到原操作',stopping:'等待角色停稳',stopped:'已停稳，等待复制',copying:'复制中',verifying:'校验中',uncertain:'待核对',failed:'失败','verified-restorable':'可恢复备份'};
const reason=(details:unknown,fallback:string)=>details&&typeof details==='object'&&'reason' in details&&typeof details.reason==='string'?details.reason:fallback;
export function BackupPanel({ctx,view,onChanged}:{readonly ctx:Context;readonly view:RoleView;readonly onChanged:()=>Promise<unknown>}){
 const roleId=view.roleId??view.backups?.[0]?.roleId;if(!roleId)return null;
 const storageKey='dsh-role-companion:backup:v1:'+roleId;
 const[pending,setPending]=useState<BackupRequest|null>(()=>{try{const raw=JSON.parse(localStorage.getItem(storageKey)||'null');return raw&&typeof raw.destination==='string'?{operationId:OperationId(raw.operationId),destination:raw.destination}:null;}catch{return null;}}),[destination,setDestination]=useState(''),[operation,setOperation]=useState<BackupProgress|null>(null),[watching,setWatching]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const chosen=operation??view.backups?.find(record=>record.operationId===pending?.operationId)??(!pending&&watching?view.backups?.find(record=>record.checkpoint!=='verified'):undefined);
 const request=pending??(chosen?{operationId:chosen.operationId,destination:chosen.destination}:null),operationId=request?.operationId;
 // View response ordering is independent of durable Home revisions.
 const generation=useRef(0),querySequence=useRef(0),mounted=useRef(true),acting=useRef(false),selected=useRef(operationId),currentPhase=useRef(chosen?.phase);
 currentPhase.current=chosen?.phase;
 const invalidate=()=>{generation.current++;querySequence.current++;};
 const current=(ticket:number)=>mounted.current&&generation.current===ticket;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;invalidate();};},[]);
 useEffect(()=>{if(selected.current!==operationId){invalidate();selected.current=operationId;}},[operationId]);
 const accept=(value:BackupProgress)=>{currentPhase.current=value.phase;setOperation(value);};
 async function refresh(automatic=false){
  if(!operationId||acting.current||automatic&&(currentPhase.current==='verified-restorable'||currentPhase.current==='failed'))return;
  const ticket=generation.current,sequence=++querySequence.current,id=operationId;
  const valid=()=>current(ticket)&&sequence===querySequence.current&&!acting.current&&selected.current===id;
  try{const result=await ctx.remote.roleCompanion.readBackup(RoleId(roleId),id);if(!valid())return;if(result.ok){accept(result.value);setError('');await onChanged();}else setError(`备份查询未完成（${reason(result.error.details,result.error.code)}）。保留原操作与目标。`);}catch{if(valid())setError('备份查询连接中断。取消等待不会撤销维护任务。');}
 }
 useEffect(()=>{if(!operationId||!watching||chosen?.phase==='verified-restorable'||chosen?.phase==='failed')return;const timer=setInterval(()=>void refresh(true),750);return()=>clearInterval(timer);},[ctx,roleId,operationId,watching,chosen?.phase]);
 function beginAction(id:OperationId){invalidate();selected.current=id;acting.current=true;setBusy(true);setError('');return generation.current;}
 async function finishAction(ticket:number){if(!current(ticket))return;try{await onChanged();}catch{if(current(ticket))setError('备份状态刷新连接中断，请查询原操作。');}finally{if(current(ticket)){acting.current=false;setBusy(false);}}}
 async function submit(resume=false){
  setWatching(true);let item=request;if(!item){if(!destination.trim()){setError('填写一个不在角色之家内的绝对备份目录。');return;}item={operationId:OperationId(crypto.randomUUID()),destination:destination.trim()};}
  try{localStorage.setItem(storageKey,JSON.stringify(item));setPending(item);}catch{setError('无法保留原操作 ID 与目标，本次尚未提交。');return;}
  const ticket=beginAction(item.operationId);
  try{const result=resume?await ctx.remote.roleCompanion.resumeBackup(RoleId(roleId),item):await ctx.remote.roleCompanion.requestBackup(RoleId(roleId),item);if(!current(ticket))return;if(result.ok)accept(result.value);else setError(`备份请求未确认（${reason(result.error.details,result.error.code)}）。请查询或按原操作接续，不更换目标。`);}catch{if(current(ticket))setError('备份提交结果待核对。原操作 ID 与目标已保留。');}finally{await finishAction(ticket);}
 }
 async function verify(){
  if(!operationId)return;const ticket=beginAction(operationId);
  try{const result=await ctx.remote.roleCompanion.verifyBackup(RoleId(roleId),operationId);if(!current(ticket))return;if(result.ok)accept(result.value);else setError(`备份校验未完成（${reason(result.error.details,result.error.code)}）。`);}catch{if(current(ticket))setError('备份校验结果待核对，请查询原操作。');}finally{await finishAction(ticket);}
 }
 return <section aria-label="一致角色备份"><h3>一致角色备份</h3><p>先通过当前角色生命周期停稳，再复制固定 revision 的完整资料并校验。备份保留原身份、正文和作品；不包含宿主密钥、DSH 私库、执行栈和临时锁。本面板不会导入或激活另一份角色。</p>
  {error&&<p role="alert">{error}</p>}
  {chosen&&<dl><dt>备份操作 ID</dt><dd>{chosen.operationId}</dd><dt>阶段</dt><dd>{labels[chosen.phase]}</dd><dt>目标</dt><dd>{chosen.destination}</dd><dt>检查点</dt><dd>{chosen.checkpoint}</dd><dt>源 revision</dt><dd>{chosen.sourceRevision??'尚未停稳'}</dd><dt>复制与校验清单项</dt><dd>{chosen.copiedFiles} / {chosen.files.length+(chosen.maintenanceFiles?.length??0)}；已校验 {chosen.verifiedFiles}</dd>{chosen.manifestDigest&&<><dt>清单 SHA-256</dt><dd>{chosen.manifestDigest}</dd></>}{chosen.error&&<><dt>错误</dt><dd>{chosen.error==='BACKUP_ACCESS_BUSY'?'备份正在被本地实例读取或写入。先结束该访问，再按原操作重新校验；这不表示备份已损坏。':`${chosen.error}。保留原请求，先核对收尾或副本。`}</dd></>}</dl>}
  {chosen&&chosen.files.length>0&&<details><summary>内容清单（共 {chosen.files.length} 项）</summary><ul>{chosen.files.map(file=><li key={file.path}>{file.path}；{file.kind==='directory'?'目录':`${file.bytes} 字节；${file.digest}`}</li>)}</ul></details>}
  {chosen?.maintenanceFiles&&<details><summary>维护历史快照（{chosen.maintenanceFiles.length} 项）</summary><p>当前操作冻结于源停稳检查点；完成回执由本次复制校验确认。历史目标仅供核对，不授予写入或恢复权限。</p><ul>{chosen.maintenanceFiles.map(file=><li key={file.path}>{file.path}；{file.bytes} 字节；{file.digest}</li>)}</ul></details>}
  {!request&&<><label>备份目标目录<input aria-label="备份目标目录" value={destination} onChange={event=>setDestination(event.target.value)}/></label><button disabled={busy||view.status==='stopping'||view.status==='read-only'||!!view.backups?.some(record=>record.checkpoint!=='verified')} onClick={()=>void submit()}>停稳并备份</button></>}
  {request&&<><button disabled={busy} onClick={()=>void refresh()}>查询原备份</button>{chosen?.checkpoint!=='verified'&&<button disabled={busy} onClick={()=>void submit(true)}>按原操作接续备份</button>}{chosen?.checkpoint==='verified'&&<button disabled={busy} onClick={()=>void verify()}>重新校验备份</button>}<button disabled={busy} onClick={()=>{invalidate();selected.current=undefined;localStorage.removeItem(storageKey);setPending(null);setOperation(null);setWatching(false);setDestination('');setError('');}}>结束本地等待</button></>}
  {(view.backups?.length??0)>0&&<details><summary>已保存备份操作</summary><ul>{view.backups?.map(record=><li key={record.operationId}>{record.operationId}：{labels[record.phase]} <button disabled={busy} onClick={()=>{invalidate();selected.current=record.operationId;setWatching(true);setPending({operationId:record.operationId,destination:record.destination});setOperation(record);}}>查看此操作</button></li>)}</ul></details>}
  <p>关闭面板或结束本地等待不会撤销已写维护进度。部分副本、失败和待核对均不表示可恢复。此区域只创建和核验备份；恢复与单活交接在对应区域操作。</p>
 </section>;
}
