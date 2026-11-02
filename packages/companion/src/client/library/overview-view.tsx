import {useEffect,useState} from 'react';
import type {Context} from '@deepseek-ai/cordis';
import type {CompanionView,LibraryOverview,LibraryOverviewTarget} from '../../types.ts';
import {remoteErrorReason} from './remote-error.ts';

const categories:readonly {readonly label:string;readonly target:LibraryOverviewTarget}[]=[
    {label:'概览',target:{view:'overview'}},
    {label:'来源',target:{view:'sources'}},
    {label:'知识',target:{view:'knowledge',collection:'versions'}},
    {label:'执行记录',target:{view:'executions',collection:'tools'}},
    {label:'维护',target:{view:'maintenance',tab:'cleanup'}},
];

function timeLabel(value:string|null):string {
    if(!value)return '发生时间未记录';
    const time=Date.parse(value);
    return Number.isFinite(time)
        ?new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short'}).format(time)
        :'发生时间未记录';
}

export function OverviewView({ctx,view,readable,onOpen}:{
    readonly ctx:Context;
    readonly view:CompanionView;
    readonly readable:boolean;
    readonly onOpen:(target:LibraryOverviewTarget)=>void;
}) {
    const home=view.role.home;
    const scope=home?`${home.roleId}:${home.panelBinding.bindingVersion}`:'';
    const [stored,setStored]=useState<{readonly scope:string;readonly value:LibraryOverview}|null>(null);
    const overview=readable&&stored?.scope===scope?stored.value:null;
    const [loading,setLoading]=useState(false);
    const [error,setError]=useState('');
    const [reload,setReload]=useState(0);
    useEffect(()=>{
      if(!home||!readable){
        setStored(null);
        setLoading(false);
        setError('');
        return;
      }
      if(typeof ctx.remote.roleCompanion.readLibraryOverview!=='function')return;
      let current=true;
      setStored(value=>value?.scope===scope?value:null);
      setLoading(true);
      setError('');
      void ctx.remote.roleCompanion.readLibraryOverview(home.roleId,home.panelBinding.bindingVersion).then(result=>{
        if(!current)return;
        if(result.ok)setStored({scope,value:result.value});
        else setError(`概览读取未完成（${remoteErrorReason(result.error)}）。分类入口仍可使用。`);
      }).catch(()=>{
        if(current)setError('概览连接中断。分类入口仍可使用，请重新读取概览。');
      }).finally(()=>{
        if(current)setLoading(false);
      });
      return()=>{current=false;};
    },[ctx,scope,home?.revision,readable,reload]);

    const canNavigate=!!home&&readable;
    return <section className="rcLibraryOverview" aria-label="资料概览">
      <header className="rcOverviewHeader">
        <div><h3>概览</h3><p>先核对仍需处理的事项，再继续浏览最近资料。</p></div>
        {view.role.status==='read-only'&&<span className="rcStatus" data-tone="warning">只读浏览</span>}
      </header>
      {!home&&<p className="rcLibraryState">尚未配置角色之家。角色配置页仍可用于创建或接入角色之家。</p>}
      {loading&&!overview&&<p role="status">正在读取资料概览…</p>}
      {error&&<div className="rcOverviewError"><p role="alert">{error}</p><button type="button" onClick={()=>setReload(value=>value+1)}>重新读取概览</button></div>}
      {overview&&<section className="rcOverviewAttention" aria-label="待处理事项">
        <h4>{overview.actionCount?`待处理 ${overview.actionCount} 项`:'当前没有待处理事项'}</h4>
        {overview.actionCount===0
          ?<p role="status">执行、归档、资料读取与投影状态正常。</p>
          :<ol>{overview.actions.map(action=><li key={action.id}>
            <div><strong>{action.reason}</strong><p>{action.impact}</p></div>
            <button type="button" disabled={!canNavigate} onClick={()=>onOpen(action.target)}>{action.actionLabel}</button>
          </li>)}</ol>}
        {overview.actionCount>overview.actions.length&&<p>另有 {overview.actionCount-overview.actions.length} 项待处理，可从下方分类继续核对。</p>}
      </section>}
      {overview&&<section className="rcOverviewRecent" aria-label="最近资料">
        <h4>最近资料</h4>
        {overview.recent.length
          ?<ol>{overview.recent.map(item=><li key={item.id}>
            <button type="button" disabled={!canNavigate} onClick={()=>onOpen(item.target)}>
              <span><strong>{item.title}</strong><time dateTime={item.occurredAt??undefined}>{timeLabel(item.occurredAt)}</time></span>
              <span>{item.typeLabel} · {item.summary}</span>
            </button>
          </li>)}</ol>
          :<p>还没有可浏览的来源或知识记录。</p>}
      </section>}
      <nav className="rcOverviewCategories" aria-label="资料分类入口">
        {categories.map(item=><button key={item.label} type="button" disabled={!canNavigate} onClick={()=>onOpen(item.target)}>{item.label}</button>)}
      </nav>
    </section>;
}
