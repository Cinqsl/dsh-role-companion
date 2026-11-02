import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import type {Context} from '@deepseek-ai/cordis';
import type {
    BindingVersion,
    ContextSourcePart,
    LibrarySourceAvailability,
    LibrarySourceCompleteness,
    LibrarySourceKind,
    LibrarySourcePage,
    LibrarySourceSort,
    LibrarySourceSummary,
    LibraryOverviewTarget,
    RoleId,
} from '../../types.ts';
import {contextSourceRefTechnical,librarySourceLabels} from '../../library/source-ref.ts';
import {useListDetailFocus} from './list-detail-focus.ts';
import type {RoleLibraryViewProps} from './types.ts';
import {isNonNegativeInteger,isPageLimit,isRecord,readLibraryPreference,writeLibraryPreference} from './persistence.ts';
import {remoteErrorReason} from './remote-error.ts';
import {LibraryUnavailable,libraryAvailability} from './view-state.tsx';

const detailLimit=4096;

interface Filters {
    readonly keyword:string;
    readonly kind:'all'|LibrarySourceKind;
    readonly completeness:LibrarySourceCompleteness;
    readonly availability:LibrarySourceAvailability;
    readonly period:'all'|'7d'|'30d';
    readonly sort:LibrarySourceSort;
}

const initialFilters:Filters={keyword:'',kind:'all',completeness:'all',availability:'all',period:'all',sort:'newest'};
type SourceQuery=ReturnType<typeof queryFor>;
interface SourcePreference {
    readonly filters:Filters;
    readonly query:SourceQuery;
    readonly offset:number;
    readonly limit:20|50;
}

function sourceKind(source:LibrarySourceSummary):LibrarySourceKind {
    return source.source.ref.kind as LibrarySourceKind;
}

function sourceStatus(source:LibrarySourceSummary):readonly string[] {
    const values:string[]=[];
    if(source.source.cleanup)values.push('正文已清理');
    else values.push(source.source.completeness==='gap'?'有缺口':'完整');
    values.push(source.source.availableForDaily?'可用于日常':'不用于日常');
    return values;
}

function formatTime(value:string|null):string {
    if(!value)return'固定置顶';
    return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
}

function dateGroup(value:string|null):string {
    if(!value)return'核心设定';
    return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date(value));
}

function dateKey(value:string|null):string {
    if(!value)return'core';
    const date=new Date(value);
    return Number.isNaN(date.getTime())?value:`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function queryFor(filters:Filters) {
    const now=Date.now(),from=filters.period==='7d'?new Date(now-7*86400000).toISOString():filters.period==='30d'?new Date(now-30*86400000).toISOString():null;
    return {
        keyword:filters.keyword.trim(),
        ...(filters.kind==='all'?{}:{types:[filters.kind]}),
        completeness:filters.completeness,
        availability:filters.availability,
        ...(from?{from}:{}),
        sort:filters.sort,
    };
}

function sourcePreference(value:unknown):value is SourcePreference {
    if(!isRecord(value)||!isRecord(value.filters)||!isRecord(value.query))return false;
    const filters=value.filters,query=value.query;
    return typeof filters.keyword==='string'
        &&['all','core','input','reply'].includes(String(filters.kind))
        &&['all','complete','gap'].includes(String(filters.completeness))
        &&['all','daily','archive'].includes(String(filters.availability))
        &&['all','7d','30d'].includes(String(filters.period))
        &&['newest','oldest'].includes(String(filters.sort))
        &&typeof query.keyword==='string'
        &&(query.types===undefined||Array.isArray(query.types)&&query.types.every(item=>['core','input','reply'].includes(String(item))))
        &&['all','complete','gap'].includes(String(query.completeness))
        &&['all','daily','archive'].includes(String(query.availability))
        &&(query.from===undefined||typeof query.from==='string')
        &&(query.to===undefined||typeof query.to==='string')
        &&['newest','oldest'].includes(String(query.sort))
        &&isNonNegativeInteger(value.offset)
        &&isPageLimit(value.limit);
}

function loadPreference(roleId:RoleId):SourcePreference {
    const value=readLibraryPreference(roleId,'sources',sourcePreference);
    return value??{
        filters:initialFilters,
        query:queryFor(initialFilters),
        offset:0,
        limit:20,
    };
}

function appliedFilters(filters:Filters):readonly {readonly label:string;readonly clear:Filters}[] {
    const values:{readonly label:string;readonly clear:Filters}[]=[];
    if(filters.keyword.trim())values.push({label:`关键词：${filters.keyword.trim()}`,clear:{...filters,keyword:''}});
    if(filters.kind!=='all')values.push({label:`类型：${librarySourceLabels[filters.kind]}`,clear:{...filters,kind:'all'}});
    if(filters.completeness!=='all')values.push({label:`完整性：${filters.completeness==='complete'?'完整':'有缺口'}`,clear:{...filters,completeness:'all'}});
    if(filters.availability!=='all')values.push({label:`日常用途：${filters.availability==='daily'?'可用于日常':'不用于日常'}`,clear:{...filters,availability:'all'}});
    if(filters.period!=='all')values.push({label:`时间：最近 ${filters.period==='7d'?'7':'30'} 天`,clear:{...filters,period:'all'}});
    return values;
}

function hasFilters(filters:Filters):boolean {
    return !!filters.keyword.trim()||filters.kind!=='all'||filters.completeness!=='all'||filters.availability!=='all'||filters.period!=='all';
}

function relationshipItems(source:LibrarySourceSummary['source']):readonly string[] {
    return [
        ...(source.dependencies.length?[`依赖：${source.dependencies.map(contextSourceRefTechnical).join('、')}`]:[]),
        ...(source.dataOrigins.length?[`数据来源：${source.dataOrigins.map(contextSourceRefTechnical).join('、')}`]:[]),
        ...(source.modelAttempts.length?[`产生于 ${source.modelAttempts.join('、')}`]:[]),
    ];
}

function SourcesList({ctx,roleId,bindingVersion,revision,readable,target}:{
    readonly ctx:Context;
    readonly roleId:RoleId;
    readonly bindingVersion:BindingVersion;
    readonly revision:number;
    readonly readable:boolean;
    readonly target?:LibraryOverviewTarget;
}) {
    const stored=loadPreference(roleId);
    const deepLinked=target?.view==='sources'&&!!target.ref;
    const [filters,setFilters]=useState<Filters>(deepLinked?initialFilters:stored.filters);
    const [query,setQuery]=useState<SourceQuery>(deepLinked?queryFor(initialFilters):stored.query);
    const [offset,setOffset]=useState(deepLinked?0:stored.offset);
    const [limit,setLimit]=useState<20|50>(stored.limit);
    const [page,setPage]=useState<LibrarySourcePage|null>(null);
    const [listError,setListError]=useState('');
    const [listBusy,setListBusy]=useState(false);
    const [selected,setSelected]=useState<LibrarySourceSummary|null>(null);
    const [part,setPart]=useState<ContextSourcePart|null>(null);
    const [detailError,setDetailError]=useState('');
    const [detailBusy,setDetailBusy]=useState(false);
    const listGeneration=useRef(0),detailGeneration=useRef(0);
    const deepLink=useRef('');
    const priorRole=useRef(roleId);
    const detailFocus=useListDetailFocus({
      open:!!selected,
      focusKey:selected?contextSourceRefTechnical(selected.source.ref):'',
      returnAttribute:'data-source-key',
      revealOnNarrow:true,
    });
    useEffect(()=>{
        writeLibraryPreference(roleId,'sources',{filters,query,offset,limit});
    },[roleId,filters,query,offset,limit]);
    useEffect(()=>{
        if(priorRole.current===roleId)return;
        priorRole.current=roleId;
        const restored=loadPreference(roleId);
        setFilters(restored.filters);setQuery(restored.query);setOffset(restored.offset);setLimit(restored.limit);
        setPage(null);setSelected(null);setPart(null);setListError('');setDetailError('');
    },[roleId]);
    useEffect(()=>{
        const issued=++listGeneration.current;
        setListBusy(true);
        setListError('');
        void ctx.remote.roleCompanion.readLibrarySources(roleId,bindingVersion,{...query,offset,limit}).then(result=>{
            if(issued!==listGeneration.current)return;
            if(result.ok){
                setPage(result.value);
                setSelected(current=>{
                    if(!current)return null;
                    const retained=result.value.sources.find(source=>contextSourceRefTechnical(source.source.ref)===contextSourceRefTechnical(current.source.ref));
                    return retained?.source.contentDigest===current.source.contentDigest?retained:null;
                });
            }else setListError(`来源列表读取未完成（${remoteErrorReason(result.error)}）。${page?'当前内容可能已过期。':''}`);
        }).catch(()=>{
            if(issued===listGeneration.current)setListError(`来源列表连接中断。${page?'当前内容可能已过期。':'请重新查询。'}`);
        }).finally(()=>{
            if(issued===listGeneration.current)setListBusy(false);
        });
        return()=>{listGeneration.current++;};
    },[ctx,roleId,bindingVersion,revision,query,offset,limit]);
    useEffect(()=>()=>{detailGeneration.current++;},[]);
    useEffect(()=>{
      if(target?.view!=='sources'||!target.ref||!page||selected)return;
      const key=contextSourceRefTechnical(target.ref);
      if(deepLink.current===key)return;
      const source=page.sources.find(candidate=>contextSourceRefTechnical(candidate.source.ref)===key);
      if(source){deepLink.current=key;void open(source);}
    },[page,target,selected]);
    function apply(next:Filters){
        setFilters(next);
        setQuery(queryFor(next));
        setOffset(0);
        setSelected(null);
        setPart(null);
        setDetailError('');
    }
    function choosePage(nextOffset:number){
        setOffset(nextOffset);
        setSelected(null);
        setPart(null);
        setDetailError('');
    }
    async function open(source:LibrarySourceSummary,from=0){
        if(!page)return;
        const issued=++detailGeneration.current;
        if(!from)detailFocus.captureOrigin(contextSourceRefTechnical(source.source.ref));
        setSelected(source);
        setDetailBusy(true);
        setDetailError('');
        if(!from)setPart(null);
        try{
            const result=await ctx.remote.roleCompanion.readContextSource(roleId,bindingVersion,{ref:source.source.ref,revision:page.revision,contentDigest:source.source.contentDigest,offset:from,limit:detailLimit});
            if(issued!==detailGeneration.current)return;
            if(!result.ok){
                const reason=remoteErrorReason(result.error);
                setDetailError(reason==='CONTEXT_SOURCE_CHANGED'?'记录已变化，请重新读取列表；不会拼接新旧正文。':`来源正文读取未完成（${reason}）。`);
                return;
            }
            if(from&&(!part||part.basis.revision!==result.value.basis.revision||part.source.contentDigest!==result.value.source.contentDigest)){
                setDetailError('记录已变化，请重新读取列表；不会拼接新旧正文。');
                return;
            }
            setPart(from?{...result.value,offset:0,text:part!.text+result.value.text}:result.value);
        }catch{
            if(issued===detailGeneration.current)setDetailError('来源正文连接中断，原记录仍由角色之家保存。');
        }finally{
            if(issued===detailGeneration.current)setDetailBusy(false);
        }
    }
    function closeDetail(){
        detailGeneration.current++;
        const key=selected?contextSourceRefTechnical(selected.source.ref):'';
        setSelected(null);
        setPart(null);
        setDetailError('');
        setDetailBusy(false);
        detailFocus.rememberReturnFocus(key);
    }
    function handleKeyDown(event:KeyboardEvent<HTMLElement>){
        if(event.defaultPrevented||event.key!=='Escape'||!selected||typeof window==='undefined'||window.innerWidth>=760)return;
        event.preventDefault();
        closeDetail();
    }
    const effectiveFilters:Filters={
        ...filters,
        keyword:query.keyword,
        kind:query.types?.length===1?query.types[0]:'all',
        completeness:query.completeness,
        availability:query.availability,
        sort:query.sort,
    };
    const chips=appliedFilters(effectiveFilters),hasQueryFilters=hasFilters(effectiveFilters);
    const grouped:{key:string;label:string;rows:LibrarySourceSummary[]}[]=[];
    for(const source of page?.sources??[]){
        const key=dateKey(source.occurredAt),label=dateGroup(source.occurredAt),current=grouped.at(-1);
        if(current?.key===key)current.rows.push(source);
        else grouped.push({key,label,rows:[source]});
    }
    return <section className="rcSourcesLibrary" data-detail-open={selected?'true':undefined} aria-label="角色资料来源" onKeyDown={handleKeyDown}>
      <header className="rcSourcesIntroduction">
        <div><h3>来源</h3><p>按原始发生顺序查看核心设定、用户来信和角色回复。列表只读；正文与技术字段按需打开。</p></div>
      </header>
      <div className="rcSourceFilters" role="group" aria-label="来源筛选">
        <label>搜索正文<input aria-label="搜索来源正文" type="search" value={filters.keyword} onChange={event=>setFilters({...filters,keyword:event.target.value})}/></label>
        <label>来源类型<select aria-label="来源类型" value={filters.kind} onChange={event=>apply({...filters,kind:event.target.value as Filters['kind']})}><option value="all">全部来源</option><option value="core">核心设定</option><option value="input">用户来信</option><option value="reply">角色回复</option></select></label>
        <label>完整性<select aria-label="来源完整性" value={filters.completeness} onChange={event=>apply({...filters,completeness:event.target.value as LibrarySourceCompleteness})}><option value="all">全部</option><option value="complete">完整</option><option value="gap">有缺口</option></select></label>
        <label>日常用途<select aria-label="来源日常用途" value={filters.availability} onChange={event=>apply({...filters,availability:event.target.value as LibrarySourceAvailability})}><option value="all">全部</option><option value="daily">可用于日常</option><option value="archive">不用于日常</option></select></label>
        <label>时间范围<select aria-label="来源时间范围" value={filters.period} onChange={event=>apply({...filters,period:event.target.value as Filters['period']})}><option value="all">全部时间</option><option value="7d">最近 7 天</option><option value="30d">最近 30 天</option></select></label>
        <label>排序<select aria-label="来源排序" value={filters.sort} onChange={event=>apply({...filters,sort:event.target.value as LibrarySourceSort})}><option value="newest">最新优先</option><option value="oldest">最早优先</option></select></label>
        <label>每页<select aria-label="每页来源数" value={limit} onChange={event=>{setLimit(Number(event.target.value) as 20|50);choosePage(0);}}><option value="20">20 条</option><option value="50">50 条</option></select></label>
        <button type="button" disabled={listBusy||!readable} onClick={()=>apply(filters)}>搜索来源</button>
      </div>
      {chips.length>0&&<div className="rcSourceChips" aria-label="已生效的来源筛选">{chips.map(chip=><button key={chip.label} type="button" onClick={()=>apply(chip.clear)}>移除{chip.label}</button>)}<button type="button" onClick={()=>apply(initialFilters)}>清除筛选</button></div>}
      {listError&&<p role="alert">{listError}</p>}
      {!page&&listBusy&&<p role="status">正在读取来源…</p>}
      {page&&<>
        <p className="rcSourceRange">筛选后 {page.total} 条；当前 {page.rangeStart}–{page.rangeEnd} 条；每页 {page.limit} 条；{page.more?'还有下一页':'已到末页'}。</p>
        {page.total===0?<div className="rcSourcesEmpty" role="status"><strong>{page.datasetTotal===0?'资料为空':'无匹配结果'}</strong><p>{page.datasetTotal===0?'角色之家还没有可阅读的核心设定、用户来信或角色回复。':'没有来源符合当前筛选条件。'}</p>{hasQueryFilters&&<button type="button" onClick={()=>apply(initialFilters)}>清除筛选</button>}</div>
        :<div className={`rcSourcesWorkspace${selected?' is-detail-open':''}`}>
          <div className="rcSourceIndex" data-source-list="" ref={detailFocus.listRef}>
            {grouped.map(group=><section className="rcSourceDateGroup" key={group.key} aria-label={group.label}><h4>{group.label}</h4><ol>{group.rows.map(source=>{
              const kind=sourceKind(source),status=sourceStatus(source);
              return <li key={contextSourceRefTechnical(source.source.ref)}><button type="button" className="rcSourceRow" data-source-key={contextSourceRefTechnical(source.source.ref)} aria-label={`打开${librarySourceLabels[kind]}：${source.preview||'无正文'}`} aria-current={selected&&contextSourceRefTechnical(selected.source.ref)===contextSourceRefTechnical(source.source.ref)?'true':undefined} onClick={()=>void open(source)}><span className="rcSourceRowMeta"><strong>{librarySourceLabels[kind]}</strong><time dateTime={source.occurredAt??undefined}>{formatTime(source.occurredAt)}</time></span><span className="rcSourcePreview">{source.preview||'正文已清理'}</span><span className="rcSourceStatuses">{status.map(value=><span key={value}>{value}</span>)}</span></button></li>;
            })}</ol></section>)}
          </div>
          {selected&&<article className="rcSourceDetail rcRecordDetail" aria-label={`${librarySourceLabels[sourceKind(selected)]}详情`}>
            <div className="rcSourceDetailHeader"><button type="button" className="rcSourceBack" onClick={closeDetail}>返回来源列表</button><span>{librarySourceLabels[sourceKind(selected)]}</span></div>
            <h3 tabIndex={-1} ref={detailFocus.detailHeadingRef}>{librarySourceLabels[sourceKind(selected)]}</h3>
            <p className="rcSourceDetailTime">{formatTime(selected.occurredAt)}</p>
            {detailError&&<div role="alert" className="rcSourceConflict"><strong>{detailError}</strong><button type="button" onClick={()=>void open(selected)}>重新读取这条记录</button></div>}
            {detailBusy&&!part&&<p role="status">正在读取来源正文…</p>}
            {part&&<div className="rcSourceBody" aria-label="来源正文"><pre>{part.text}</pre><p>已读取 {Array.from(part.text).length} / {part.totalCodePoints} 个码点。</p>{part.more&&!detailError&&<button type="button" disabled={detailBusy} onClick={()=>void open(selected,Array.from(part.text).length)}>{detailBusy?'正在读取正文…':'继续读取正文'}</button>}</div>}
            <section className="rcSourceRelations" aria-labelledby="source-relations-heading"><h4 id="source-relations-heading">来源关系</h4>{relationshipItems(selected.source).length?<ul>{relationshipItems(selected.source).map(item=><li key={item}>{item}</li>)}</ul>:<p>没有额外来源关系。</p>}</section>
            <details className="rcTechnical"><summary>技术信息</summary><div className="rcTechnicalBody"><dl>
              <div><dt>UUID / 引用</dt><dd>{contextSourceRefTechnical(selected.source.ref)}</dd></div>
              <div><dt>digest</dt><dd>{selected.source.contentDigest}</dd></div>
              <div><dt>revision</dt><dd>{'committedRevision'in selected.source?selected.source.committedRevision??page.revision:page.revision}</dd></div>
              <div><dt>binding</dt><dd>{'binding'in selected.source?`${selected.source.binding.bindingId} / v${selected.source.binding.bindingVersion}`:'不适用'}</dd></div>
              <div><dt>speaker</dt><dd>{selected.source.speaker}</dd></div>
              <div><dt>原始状态</dt><dd>{selected.source.cleanup?.reason??selected.source.completeness}</dd></div>
            </dl></div></details>
          </article>}
          {!selected&&<aside className="rcSourceDetail rcSourceDetailPlaceholder" aria-label="来源详情"><p>选择一条来源查看正文、来源关系与技术信息。</p></aside>}
        </div>}
        <nav className="rcSourcePager" aria-label="来源分页"><button type="button" disabled={listBusy||offset===0} onClick={()=>choosePage(Math.max(0,offset-limit))}>上一页来源</button><span>{page.rangeStart}–{page.rangeEnd} / {page.total}</span><button type="button" disabled={listBusy||!page.more} onClick={()=>page.nextOffset!==null&&choosePage(page.nextOffset)}>下一页来源</button></nav>
      </>}
    </section>;
}

export function SourcesView({ctx,view,readable,target}:RoleLibraryViewProps) {
    const home=view.role.home;
    return home&&readable?<SourcesList ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} readable={readable} target={target}/>:<LibraryUnavailable>{libraryAvailability(view,readable)}</LibraryUnavailable>;
}
