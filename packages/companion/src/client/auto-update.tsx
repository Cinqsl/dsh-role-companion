import {useEffect,useState} from 'react';
import type {Context} from '@deepseek-ai/cordis';
import type {AutoUpdateView} from '../types.ts';
import {OperationId} from '../home/ids.ts';

const phaseLabels:Readonly<Record<AutoUpdateView['phase'],string>>={
  disabled:'自动更新已关闭',
  idle:'尚未检查',
  checking:'正在检查 main',
  'up-to-date':'已是最新',
  scheduled:'等待 DSH 退出后安装',
  blocked:'检查或排队被阻止',
  error:'更新失败',
};
const reasonLabels:Readonly<Record<string,string>>={
  AUTO_UPDATE_DISABLED:'开启自动更新后会按设定周期检查。',
  PLUGIN_MANAGER_UNAVAILABLE:'当前 Host 没有提供插件清单服务。',
  LOCAL_CHECKOUT_NOT_FAST_FORWARD:'当前本地 commit 不在 main 的历史上，不会自动覆盖可能有未合并改动的分支。',
  INSTALL_ON_EXIT:'更新已排队，正常退出 DSH 后自动安装，下次启动生效。',
  RESTARTING:'正在退出 DSH，安装完成后会自动重新打开。',
  AUTO_UPDATE_RESTART_UNAVAILABLE:'当前环境无法自动重启 DSH。',
  AUTO_UPDATE_TIMEOUT:'访问 GitHub 超时。',
  GIT_UNAVAILABLE:'找不到 Git，无法检查 main。',
  AUTO_UPDATE_REMOTE_INVALID:'main 分支返回了无效的 commit。',
  AUTO_UPDATE_LOCAL_INVALID:'无法识别当前安装的 commit。',
  AUTO_UPDATE_FAILED:'检查更新时发生未知错误。',
};
const reason=(code:string):string=>reasonLabels[code]??(/^[A-Z][A-Z0-9_]{1,63}$/.test(code)?code:'');
const commit=(value:string|null):string=>value??'未知';

export function AutoUpdatePanel({ctx}:{
  readonly ctx:Context;
}){
  const [view,setView]=useState<AutoUpdateView|null>(null);
  const [enabled,setEnabled]=useState(false);
  const [interval,setIntervalMinutes]=useState('15');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const load=(value:AutoUpdateView)=>{
    setView(value);
    setEnabled(value.enabled);
    setIntervalMinutes(String(value.intervalMinutes));
  };
  useEffect(()=>{
    let active=true;
    const read=async(hydrate:boolean)=>{
      try{
        const result=await ctx.remote.roleCompanion.readAutoUpdate();
        if(!active)return;
        if(result.ok){
          if(hydrate)load(result.value);
          else setView(result.value);
        }
        else setError(`更新状态读取失败（${result.error.code}）。`);
      }
      catch{if(active)setError('更新状态连接中断。');}
    };
    void read(true);
    const timer=setInterval(()=>void read(false),15000);
    return()=>{active=false;clearInterval(timer);};
  },[ctx]);
  async function save(){
    if(!view)return;
    const minutes=Number(interval);
    if(!Number.isSafeInteger(minutes)||minutes<5||minutes>1440){
      setError('检查周期必须是 5 至 1440 分钟的整数。');
      return;
    }
    setBusy(true);setError('');setNotice('');
    try{
      const result=await ctx.remote.roleCompanion.editAutoUpdate({
        operationId:OperationId(crypto.randomUUID()),
        expectedVersion:view.version,
        value:{enabled,intervalMinutes:minutes},
      });
      if(result.ok){load(result.value);setNotice('自动更新规则已保存。');}
      else setError(`保存失败（${result.error.code}）。`);
    }
    catch{setError('保存连接中断，请重新读取后核对。');}
    finally{setBusy(false);}
  }
  async function check(){
    setBusy(true);setError('');setNotice('');
    try{
      const result=await ctx.remote.roleCompanion.checkAutoUpdate();
      if(result.ok){
        load(result.value);
        setNotice(result.value.phase==='up-to-date'?'main 已是当前安装版本。':result.value.phase==='scheduled'?'更新已排队，正常退出 DSH 后自动安装。':'检查完成。');
      }
      else setError(`检查失败（${result.error.code}）。`);
    }
    catch{setError('检查连接中断，请刷新状态后核对。');}
    finally{setBusy(false);}
  }
  async function updateAndRestart(){
    setBusy(true);setError('');setNotice('');
    try{
      const checked=await ctx.remote.roleCompanion.checkAutoUpdate();
      if(!checked.ok){setError(`检查失败（${checked.error.code}）。`);return;}
      load(checked.value);
      if(checked.value.phase==='up-to-date'){setNotice('main 已是当前安装版本。');return;}
      if(checked.value.phase!=='scheduled'){
        setError(checked.value.reason?reason(checked.value.reason):'当前不能安装更新。');
        return;
      }
      setNotice('正在安排更新并重启 DSH…');
      const applied=await ctx.remote.roleCompanion.applyAutoUpdate();
      if(!applied.ok)setError(`重启更新失败（${applied.error.code}）。`);
    }
    catch{setNotice('重启请求已发出；如果仍停留在当前页面，请正常退出 DSH 完成安装。');}
    finally{setBusy(false);}
  }
  return <section aria-label="自动更新">
    <h3>自动更新</h3>
    <p>固定跟踪 <code>Cinqsl/dsh-role-companion</code> 的 <code>main</code> 分支，并安装检查到的精确 commit。更新在 DSH 正常退出后执行，不会在运行中替换当前插件。</p>
    {view&&<dl className="rcUpdateFacts">
      <div><dt>状态</dt><dd>{phaseLabels[view.phase]}</dd></div>
      <div><dt>当前 commit</dt><dd>{commit(view.currentCommit)}</dd></div>
      <div><dt>main commit</dt><dd>{commit(view.remoteCommit)}</dd></div>
      <div><dt>上次检查</dt><dd>{view.lastCheckedAt??'尚未检查'}</dd></div>
    </dl>}
    {view?.reason&&<p role="status">{reason(view.reason)}</p>}
    {error&&<p role="alert">{error}</p>}
    {notice&&<p role="status">{notice}</p>}
    <fieldset disabled={busy||!view}>
      <legend>main 同步规则</legend>
      <label><input aria-label="自动检查并安装 main" type="checkbox" checked={enabled} onChange={event=>setEnabled(event.currentTarget.checked)}/>自动检查并安装 <code>main</code></label>
      <label>检查周期（分钟）<input aria-label="自动更新检查周期" type="number" min="5" max="1440" value={interval} onChange={event=>setIntervalMinutes(event.currentTarget.value)}/></label>
      <button disabled={!view} onClick={()=>void save()}>保存自动更新规则</button>
      <button disabled={!view} onClick={()=>void check()}>立即检查并同步</button>
      {view?.restartSupported&&<button disabled={busy} onClick={()=>void updateAndRestart()}>立即更新并重启</button>}
    </fieldset>
  </section>;
}
