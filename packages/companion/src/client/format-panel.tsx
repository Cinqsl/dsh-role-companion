import {useEffect,useRef,useState} from 'react';
import type {Context} from '@deepseek-ai/cordis';
import {OperationId,RoleId,HomeRevision} from '../home/ids.ts';
import type {FormatUpgradeProgress,FormatUpgradeRequest,FormatUpgradeView} from '../home/format-upgrade.ts';
import type {RoleView} from '../runtime/index.ts';

const labels:{readonly [key:string]:string}={
  'not-found':'未找到原操作',requested:'已提交，准备写入新代',writing:'写入新代',validating:'校验新代',uncertain:'待核对，未完成切换',switched:'已升级',failed:'升级失败',
};
const statusLabels:{readonly [key:string]:string}={
  compatible:'当前格式 1.0，可直接使用',
  'needs-upgrade':'当前格式 1.0，可升级到 2.0',
  processing:'正在处理',
  failed:'升级失败：旧格式仍在，未切换',
  migrated:'已升级到 2.0，旧代保留',
  unsupported:'当前格式不受本版本支持；只读。请升级插件或按原包打开。',
};
const reason=(details:unknown,fallback:string)=>details&&typeof details==='object'&&'reason' in details&&typeof details.reason==='string'?details.reason:fallback;
const text=(format:{readonly major:number;readonly minor:number})=>format.major+'.'+format.minor;

/** The panel never cancels an upgrade: it only reports the original operation and ends local waiting. */
export function FormatPanel({ctx,view,onChanged}:{readonly ctx:Context;readonly view:RoleView;readonly onChanged:()=>Promise<unknown>}){
  const roleId=view.roleId;
  if(!roleId)return null;
  const storageKey='dsh-role-companion:format-upgrade:v1:'+roleId;
  const [request,setRequest]=useState<FormatUpgradeRequest|null>(()=>{try{const raw=JSON.parse(localStorage.getItem(storageKey)||'null');return raw&&typeof raw.operationId==='string'?{operationId:OperationId(raw.operationId),expectedRevision:HomeRevision(raw.expectedRevision)}:null;}catch{return null;}});
  const [operation,setOperation]=useState<FormatUpgradeProgress|null>(null);
  const [watching,setWatching]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const format:FormatUpgradeView|undefined=view.format;
  const chosen=operation??(format?.operationId?undefined:undefined);
  // View responses may arrive out of order; guard the poll like the backup panel does.
  const generation=useRef(0),querySequence=useRef(0),mounted=useRef(true),acting=useRef(false),selected=useRef(request?.operationId),currentPhase=useRef<string|undefined>(format?.phase);
  currentPhase.current=operation?.phase??format?.phase;
  const invalidate=()=>{generation.current++;querySequence.current++;};
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;invalidate();};},[]);
  useEffect(()=>{if(selected.current!==request?.operationId){invalidate();selected.current=request?.operationId;}},[request?.operationId]);
  const current=(ticket:number)=>mounted.current&&generation.current===ticket;
  const terminal=(phase:string|undefined)=>phase==='switched'||phase==='failed';
  async function refresh(automatic=false){
    if(!request||acting.current||automatic&&terminal(currentPhase.current))return;
    const ticket=generation.current,sequence=++querySequence.current,id=request.operationId;
    const valid=()=>current(ticket)&&sequence===querySequence.current&&!acting.current&&selected.current===id;
    try{const result=await ctx.remote.roleCompanion.readFormatUpgrade(RoleId(roleId),id);if(!valid())return;if(result.ok){setOperation(result.value.phase==='not-found'?null:result.value as FormatUpgradeProgress);setError('');await onChanged();}else setError(`升级查询未完成（${reason(result.error.details,result.error.code)}）。保留原操作 ID。`);}catch{if(valid())setError('升级查询连接中断。关闭面板或结束本地等待都不会撤销任务。');}
  }
  useEffect(()=>{if(!request||!watching||terminal(currentPhase.current))return;const timer=setInterval(()=>void refresh(true),750);return()=>clearInterval(timer);},[ctx,roleId,request?.operationId,watching,currentPhase.current]);
  function beginAction(){invalidate();acting.current=true;setBusy(true);setError('');return generation.current;}
  async function finishAction(ticket:number){if(!current(ticket))return;try{await onChanged();}catch{if(current(ticket))setError('升级状态刷新连接中断，请查询原操作。');}finally{if(current(ticket)){acting.current=false;setBusy(false);}}}
  async function start(resume=false){
    if(!format?.upgradesAvailable&&!resume)return;
    const item=request??{operationId:OperationId(crypto.randomUUID()),expectedRevision:HomeRevision(view.revision??0)};
    try{localStorage.setItem(storageKey,JSON.stringify(item));setRequest(item);}catch{setError('无法保留原操作 ID，本次尚未提交。');return;}
    setWatching(true);const ticket=beginAction();
    try{const result=resume?await ctx.remote.roleCompanion.resumeFormatUpgrade(RoleId(roleId),item):await ctx.remote.roleCompanion.requestFormatUpgrade(RoleId(roleId),item);if(!current(ticket))return;if(result.ok)setOperation(result.value as FormatUpgradeProgress);else setError(`升级请求未确认（${reason(result.error.details,result.error.code)}）。请查询或按原操作接续。`);}catch{if(current(ticket))setError('升级提交结果待核对。原操作 ID 已保留，先查询再决定。');}finally{await finishAction(ticket);}
  }
  const shown=operation??(format?.operationId?{operationId:format.operationId,phase:format.phase,checkpoint:format.checkpoint,error:format.error}:null);
  return <section aria-label="Home 格式">
    <h3>Home 格式</h3>
    <p>{format?statusLabels[format.status]:'格式状态尚未取得。'} 格式升级只由用户触发，没有自动开关；HMR 不会升级或降级继续活动。升级前必须先完成一次可校验的一致备份，升级保留旧代内容与全部保留状态。</p>
    {format&&<dl><dt>当前格式</dt><dd>{text(format.format)}</dd>{format.target&&<><dt>目标格式</dt><dd>{text(format.target)}</dd></>}<dt>布局</dt><dd>{format.layout}</dd><dt>可升级</dt><dd>{format.upgradesAvailable?'是（需先备份）':'否'}</dd>
      {shown?.operationId&&<><dt>原升级操作 ID</dt><dd>{shown.operationId}</dd></>}
      {shown?.phase&&<><dt>阶段</dt><dd>{labels[shown.phase]??shown.phase}</dd></>}
      {shown?.checkpoint&&<><dt>检查点</dt><dd>{shown.checkpoint}</dd></>}
      {shown?.error&&<><dt>错误</dt><dd>{shown.error==='FORMAT_UPGRADE_BACKUP_REQUIRED'?'缺少与本 revision 一致的可校验备份，升级未开始。先完成备份再按原操作重试。':`${shown.error}；旧格式仍在，未切换。`}</dd></>}
    </dl>}
    {error&&<p role="alert">{error}</p>}
    {format?.status==='needs-upgrade'&&!request&&<button disabled={busy||view.status==='read-only'||view.status==='stopping'||view.status==='stopped'||!!view.backups?.some(record=>record.checkpoint!=='verified')} onClick={()=>void start()}>校验备份并升级</button>}
    {request&&<><button disabled={busy} onClick={()=>void refresh()}>查询原升级操作</button>
      {(shown?.phase==='failed'||shown?.phase==='uncertain')&&<button disabled={busy} onClick={()=>void start(true)}>按原操作接续升级</button>}
      <button disabled={busy} onClick={()=>{invalidate();selected.current=undefined;localStorage.removeItem(storageKey);setRequest(null);setOperation(null);setWatching(false);setError('');}}>结束本地等待</button></>}
    <p>升级只对当前 Home 生效；只读副本不会升级，也不会导入另一份角色。结束本地等待不会撤销已写入的新代或改变旧代。</p>
  </section>;
}
