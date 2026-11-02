import {useEffect,useState} from 'react';
import type {Context} from '@deepseek-ai/cordis';
import {OperationId,RoleId,BindingVersion} from '../home/ids.ts';
import type {HomeOperation} from '../home/index.ts';
import type {RoleView} from '../runtime/index.ts';
const key='dsh-role-companion:pending-stop:v1';
interface PendingStop {readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly operationId:OperationId;}
function stored():PendingStop|null{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value?{roleId:RoleId(value.roleId),bindingVersion:BindingVersion(value.bindingVersion),operationId:OperationId(value.operationId)}:null;}catch{return null;}}
function reason(details:unknown,fallback:string):string{return details&&typeof details==='object'&&'reason' in details&&typeof details.reason==='string'?details.reason:fallback;}
const phases={unverified:'旧进程停稳结果未确认',stopping:'正在收尾',blocked:'收尾受阻',stopped:'已停稳'};
const steps={actions:'等待已开始动作',records:'等待最终归档与故障核对','model-and-flush':'等待模型 idle 与必要 flush',home:'关闭 Home 并释放锁',observers:'关闭连接与观察订阅',complete:'收尾完成'};
export function StopPanel({ctx,view,onChanged}:{readonly ctx:Context;readonly view:RoleView;readonly onChanged:()=>Promise<unknown>}){
 const[pending,setPending]=useState<PendingStop|null>(stored),[operation,setOperation]=useState<HomeOperation|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const home=view.home;if(!home)return null;
 const selected=pending?.roleId===home.roleId&&pending.bindingVersion===home.panelBinding.bindingVersion?pending:undefined;
 const operationId=selected?.operationId??view.stop?.operationId,progress=operation&&operation.operationId===operationId?operation.stop??view.stop:view.stop;
 const guard={expectedRoleId:home.roleId,expectedBindingVersion:home.panelBinding.bindingVersion};
 const backupPending=view.backups?.some(record=>record.checkpoint!=='verified')??false;
 const canReopen=!backupPending&&view.status==='stopped'&&view.stop?.phase==='stopped'&&view.stop.reason==='owner-stop'&&view.stop.operationId===operationId;
 async function query(){if(!operationId)return;try{const result=await ctx.remote.roleCompanion.readStopOperation(guard.expectedRoleId,guard.expectedBindingVersion,operationId);if(result.ok){setOperation(result.value);setError('');await onChanged();}else setError(`停止查询未完成（${reason(result.error.details,result.error.code)}）。保留原操作 ID，可重新查询。`);}catch{setError('停止查询连接中断。取消等待不会撤销已提交操作。');}}
 useEffect(()=>{if(view.status!=='stopping'||!operationId)return;const timer=setInterval(()=>void query(),500);return()=>clearInterval(timer);},[ctx,view.status,operationId]);
 async function stop(){
  const request:PendingStop=selected??{roleId:home!.roleId,bindingVersion:home!.panelBinding.bindingVersion,operationId:OperationId(crypto.randomUUID())};
  try{localStorage.setItem(key,JSON.stringify(request));}catch{setError('无法保存本地操作 ID，本次尚未提交。');return;}setPending(request);setBusy(true);setError('');
  try{const result=await ctx.remote.roleCompanion.stopRole(request.roleId,request.bindingVersion,{operationId:request.operationId});if(result.ok){setOperation(result.value);}else setError(`停止请求未确认（${reason(result.error.details,result.error.code)}）。保留原操作，先查询或按原 ID 重试。`);}catch{setError('连接中断，停止提交结果待核对。关页或取消等待不会撤销已提交操作。');}finally{await onChanged();setBusy(false);}
 }
 async function repair(){setBusy(true);setError('');try{const result=await ctx.remote.roleCompanion.retryArchives(guard.expectedRoleId,guard.expectedBindingVersion);if(!result.ok)setError(`原记录修复未完成（${reason(result.error.details,result.error.code)}）。角色继续持有运行权。`);await query();await onChanged();}catch{setError('修复连接中断，请查询原停止操作。');}finally{setBusy(false);}}
 async function reopen(){if(!operationId)return;setBusy(true);setError('');try{const result=await ctx.remote.roleCompanion.reopenRole(guard.expectedRoleId,guard.expectedBindingVersion,operationId);if(result.ok){localStorage.removeItem(key);setPending(null);setOperation(null);await onChanged();}else setError(`重新打开未完成（${reason(result.error.details,result.error.code)}）。不会绕过未决收尾。`);}catch{setError('重新打开连接中断，请先刷新状态。');}finally{setBusy(false);}}
 return <section aria-label="停止角色"><h3>停止角色</h3>
  <p>停止关闭新入口，等待动作、最终记录、模型与 flush，再释放 Home 锁和关闭观察订阅。已提交不等于已停稳。</p>
  {progress&&<dl><dt>停止操作 ID</dt><dd>{progress.operationId}</dd><dt>停稳状态</dt><dd>{phases[progress.phase]}</dd><dt>收尾阶段</dt><dd>{progress.step?steps[progress.step]:'仅有持久检查点'}</dd><dt>持久检查点</dt><dd>{progress.checkpoint}（revision {progress.checkpointRevision}）</dd>{progress.error&&<><dt>收尾错误</dt><dd>{progress.error}</dd></>}</dl>}
  {!progress&&operationId&&<p>停止操作 {operationId}：{operation?.reason||'提交结果待核对'}。</p>}
  {pending&&!selected&&<p role="status">浏览器还保留另一角色或旧绑定的停止操作。当前按钮不会将它提交到当前角色。</p>}
  {error&&<p role="alert">{error}</p>}
  <button disabled={busy||backupPending||view.status==='read-only'||view.status==='stopping'||view.status==='stopped'} onClick={()=>void stop()}>{selected?'按原 ID 重试停止':'停止当前角色'}</button>
  {pending&&<button disabled={busy} onClick={()=>{localStorage.removeItem(key);setPending(null);setOperation(null);}}>结束本地等待</button>}
  {operationId&&<button disabled={busy} onClick={()=>void query()}>查询停止操作</button>}
  {(progress?.phase==='blocked'||operation?.kind==='uncertain')&&<button disabled={busy} onClick={()=>void repair()}>重试原记录与收尾</button>}
  {backupPending&&view.status==='stopped'&&<p role="status">备份维护尚未完成，请先核对或接续原备份操作。维护期间不重新打开写入者。</p>}
  {canReopen&&<button disabled={busy} onClick={()=>void reopen()}>重新打开角色</button>}
  {view.status==='stopped'&&view.stop&&view.stop.reason!=='owner-stop'&&<p role="status">本次停止由宿主生命周期触发。请在插件管理中停用后重新启用「DSH 角色伙伴」；重新启用会核对当前配置和原停止检查点。</p>}
  <p>关闭面板只结束视图等待。停止不修改持久暂停设置；重新打开会核对检查点并建立新执行栈，保留原用量和期限。</p>
 </section>;
}
