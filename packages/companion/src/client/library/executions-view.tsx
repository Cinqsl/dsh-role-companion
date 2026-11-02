import {useEffect,useRef,useState,type KeyboardEvent,type MutableRefObject} from 'react';
import type {
    ExecutionLibraryCollection,
    ExecutionLibraryDetail,
    ExecutionLibraryItem,
    ExecutionLibraryPage,
    ExecutionLibraryPart,
    ExecutionLibraryQuery,
    ExecutionLibrarySectionField,
} from '../../types.ts';
import type {HomeRevision,MaterialId} from '../../home/ids.ts';
import type {RoleLibraryViewProps} from './types.ts';
import {useListDetailFocus} from './list-detail-focus.ts';
import {isNonNegativeInteger,isPageLimit,isRecord,readLibraryPreference,writeLibraryPreference} from './persistence.ts';
import {remoteErrorReason} from './remote-error.ts';
import {LibraryUnavailable,libraryAvailability} from './view-state.tsx';

type QueryDraft=Omit<ExecutionLibraryQuery,'expectedRevision'>;
type PageMap=Partial<Record<ExecutionLibraryCollection,ExecutionLibraryPage>>;
type RevisionMap=Partial<Record<ExecutionLibraryCollection,HomeRevision>>;
type QueryMap=Record<ExecutionLibraryCollection,QueryDraft>;
type ErrorMap=Partial<Record<ExecutionLibraryCollection,string>>;

const initialQuery=(collection:ExecutionLibraryCollection):QueryDraft=>({
    collection,
    keyword:'',
    toolName:'all',
    result:'all',
    channel:'all',
    from:null,
    to:null,
    sort:'newest',
    offset:0,
    limit:20,
});

const initialQueries:QueryMap={tools:initialQuery('tools'),native:initialQuery('native')};
interface ExecutionPreference {
    readonly collection:ExecutionLibraryCollection;
    readonly queries:QueryMap;
}
const resultLabels:Readonly<Record<string,string>>={
    all:'全部结果',
    success:'最终成功',
    error:'最终错误',
    pending:'等待最终结果',
    unavailable:'最终结果不可用',
    gap:'存在缺口',
    synthetic:'合成闭合',
    recorded:'已记录',
    refused:'拒绝',
};
const channelLabels:Readonly<Record<string,string>>={all:'全部通道',panel:'面板会话',qq:'QQ 会话'};
const closureLabels:Readonly<Record<string,string>>={
    'before-dispatch':'派发前闭合',
    'recovery-not-started':'恢复时尚未开始',
    'recovery-unknown':'恢复时结果不明',
    unknown:'闭合来源待核对',
};
const materialLabels:Readonly<Record<string,string>>={
    'sdk-local-spill':'SDK 外置材料',
    'role-read-result':'资料读取材料',
    'role-file-result':'文件操作材料',
    'role-web-result':'网页工具材料',
};

const partKey=(field:ExecutionLibrarySectionField,materialId:string|null):string=>`${field}:${materialId??''}`;
const conflictMessage=(reason:string):string=>
    reason==='EXECUTION_LIBRARY_REVISION_CHANGED'
        ? '资料库 revision 已变化，请重新读取第一页；旧分页结果已关闭。'
        : reason==='EXECUTION_RECORD_CHANGED'||reason==='EXECUTION_LIBRARY_RECORD_CHANGED'
            ? '记录内容已变化，请重新打开详情；旧片段没有继续拼接。'
            : `执行记录读取未完成（${reason}）。`;
const reportTime=(value:string):string=>{
    const parsed=new Date(value);
    return Number.isNaN(parsed.getTime())
        ? value
        : new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(parsed);
};
const reportDate=(value:string):string=>{
    const parsed=new Date(value);
    return Number.isNaN(parsed.getTime())
        ? value
        : new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(parsed);
};
const reportDateKey=(value:string):string=>{
    const parsed=new Date(value);
    return Number.isNaN(parsed.getTime())?value:`${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
};
const localDateTime=(value:string|null):string=>{
    if(!value)return '';
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return '';
    const pad=(part:number)=>String(part).padStart(2,'0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const isoDateTime=(value:string):string|null=>{
    if(!value)return null;
    const date=new Date(value);
    return Number.isNaN(date.getTime())?null:date.toISOString();
};
const rangeLabel=(page:ExecutionLibraryPage):string=>
    page.rangeStart===null?'无匹配记录':`第 ${page.rangeStart}–${page.rangeEnd} 条，共 ${page.total} 条`;
const itemKey=(item:Pick<ExecutionLibraryItem,'collection'|'recordId'>):string=>`${item.collection}:${item.recordId}`;

function executionPreference(value:unknown):value is ExecutionPreference {
    if(!isRecord(value)||(value.collection!=='tools'&&value.collection!=='native'))return false;
    const queries=value.queries;
    if(!isRecord(queries))return false;
    return(['tools','native'] as const).every(collection=>{
        const query=queries[collection];
        if(!isRecord(query)||query.collection!==collection)return false;
        return typeof query.keyword==='string'
            &&['all','role_read','role_file','role_web_search','role_web_fetch','role_propose','unknown'].includes(String(query.toolName))
            &&['all','success','error','pending','unavailable','gap','synthetic','recorded','refused'].includes(String(query.result))
            &&['all','panel','qq'].includes(String(query.channel))
            &&(query.from===null||typeof query.from==='string')
            &&(query.to===null||typeof query.to==='string')
            &&['newest','oldest'].includes(String(query.sort))
            &&isNonNegativeInteger(query.offset)
            &&isPageLimit(query.limit);
    });
}

function loadPreference(roleId:string,bindingVersion:number,initialCollection:ExecutionLibraryCollection):ExecutionPreference {
    return readLibraryPreference(roleId,`executions:${bindingVersion}`,executionPreference)
        ??{collection:initialCollection,queries:initialQueries};
}

function FilterFields({query,onChange}:{
    readonly query:QueryDraft;
    readonly onChange:(next:QueryDraft)=>void;
}){
    const nameOptions=query.collection==='tools'
        ? [
            {value:'all',label:'全部工具'},
            {value:'role_read',label:'role_read'},
            {value:'role_file',label:'role_file'},
            {value:'role_web_search',label:'role_web_search'},
            {value:'role_web_fetch',label:'role_web_fetch'},
            {value:'role_propose',label:'role_propose'},
            {value:'unknown',label:'名称未记录'},
        ]
        : [
            {value:'all',label:'全部事件'},
            {value:'role_read',label:'role_read'},
            {value:'role_file',label:'role_file'},
            {value:'role_web_search',label:'role_web_search'},
            {value:'role_web_fetch',label:'role_web_fetch'},
            {value:'role_propose',label:'role_propose'},
            {value:'unknown',label:'其他事件'},
        ];
    const resultOptions=query.collection==='tools'
        ? ['all','success','error','pending','unavailable']
        : ['all','success','error','gap','synthetic','recorded','refused'];
    return <>
      <label className="rcExecutionKeyword">关键词
        <input aria-label="搜索执行记录" value={query.keyword} maxLength={256} onChange={event=>onChange({...query,keyword:event.target.value})}/>
      </label>
      <label>工具或事件
        <select aria-label="工具名称" value={query.toolName} onChange={event=>onChange({...query,toolName:event.target.value as QueryDraft['toolName']})}>
          {nameOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label>结果
        <select aria-label="业务结果" value={query.result} onChange={event=>onChange({...query,result:event.target.value as QueryDraft['result']})}>
          {resultOptions.map(value=><option key={value} value={value}>{resultLabels[value]}</option>)}
        </select>
      </label>
      <label>通道
        <select aria-label="通道" value={query.channel} onChange={event=>onChange({...query,channel:event.target.value as QueryDraft['channel']})}>
          {Object.entries(channelLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>开始时间
        <input aria-label="开始时间" type="datetime-local" value={localDateTime(query.from)} onChange={event=>onChange({...query,from:isoDateTime(event.target.value)})}/>
      </label>
      <label>结束时间
        <input aria-label="结束时间" type="datetime-local" value={localDateTime(query.to)} onChange={event=>onChange({...query,to:isoDateTime(event.target.value)})}/>
      </label>
      <label>排序
        <select aria-label="排序" value={query.sort} onChange={event=>onChange({...query,sort:event.target.value as QueryDraft['sort']})}>
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
        </select>
      </label>
      <label>每页条数
        <select aria-label="每页条数" value={query.limit} onChange={event=>onChange({...query,limit:Number(event.target.value) as 20|50})}>
          <option value="20">20 条</option>
          <option value="50">50 条</option>
        </select>
      </label>
    </>;
}

function ExecutionDetail({item,detail,parts,error,readOnly,headingRef,onBack,onRetry,onPart,onRelatedRun}:{
    readonly item:ExecutionLibraryItem;
    readonly detail:ExecutionLibraryDetail|null;
    readonly parts:Readonly<Record<string,ExecutionLibraryPart>>;
    readonly error:string;
    readonly readOnly:boolean;
    readonly headingRef:MutableRefObject<HTMLHeadingElement|null>;
    readonly onBack:()=>void;
    readonly onRetry:()=>void;
    readonly onPart:(field:ExecutionLibrarySectionField,materialId:string|null,offset?:number)=>void;
    readonly onRelatedRun:(runId:string)=>void;
}){
    const section=(field:ExecutionLibrarySectionField,materialId:string|null=null)=>parts[partKey(field,materialId)];
    const sectionBlock=(field:ExecutionLibrarySectionField,label:string,note?:string)=>{
        const part=section(field);
        return <section className="rcExecutionDetailSection" data-field={field}>
          <h4>{label}</h4>
          {note&&<p className="rcExecutionNote">{note}</p>}
          {part?<>
            <pre className="rcExecutionText">{part.text}</pre>
            <div className="rcExecutionPartMeta">
              <span>{Array.from(part.text).length+part.offset}/{part.totalCodePoints} 码点</span>
              {part.more&&<button type="button" onClick={()=>onPart(field,null,part.nextOffset??undefined)}>继续读取</button>}
            </div>
          </>:detail&&<p role="status">正在读取{label}…</p>}
        </section>;
    };
    const raw=section('raw');
    return <aside className="rcExecutionDetailPane" aria-label="执行记录详情">
      <div className="rcExecutionDetailHeader">
        <button type="button" className="rcExecutionBack" onClick={onBack}>返回执行列表</button>
        <div>
          <span className="rcEyebrow">{item.typeLabel} · {channelLabels[item.channel]}</span>
          <h3 ref={headingRef} tabIndex={-1}>{item.name}</h3>
          <p>{item.statusLabel} · {reportTime(item.occurredAt)}</p>
        </div>
      </div>
      {readOnly&&<p className="rcExecutionNote">只读副本：这些记录可浏览，归档修复只属于维护诊断。</p>}
      {error&&<p role="alert">{error}{detail&&<button type="button" onClick={onRetry}>重新读取详情</button>}</p>}
      {!error&&!detail&&<p role="status">正在读取执行记录详情…</p>}
      {detail&&<>
        {item.collection==='tools'?<>
          {sectionBlock('request','请求')}
          {sectionBlock('observation','执行观察（不是最终结果）','返回或抛错只是执行观察，不能据此认定最终成功。')}
          {sectionBlock('final','最终规范结果')}
          <details className="rcTechnical rcExecutionMaterials">
            <summary>材料与完整正文（{item.tool?.materialCount??0}）</summary>
            <div className="rcTechnicalBody">
              {(item.tool?.materials??[]).map(material=>{
                const part=section('material',material.materialId);
                return <section key={material.materialId}>
                  <h4>{materialLabels[material.source]}</h4>
                  <p>{material.bytes} UTF-8 字节 · {material.digest}</p>
                  {part?<><pre className="rcExecutionText">{part.text}</pre>{part.more&&<button type="button" onClick={()=>onPart('material',material.materialId,part.nextOffset??undefined)}>继续读取材料</button>}</>:<button type="button" onClick={()=>onPart('material',material.materialId,0)}>读取材料正文</button>}
                </section>;
              })}
              {item.tool?.materialsMore&&<p>其余材料可从原始 JSON 按段读取。</p>}
              {!item.tool?.materialCount&&<p>这条记录没有保存材料。</p>}
            </div>
          </details>
        </>:<>
          {sectionBlock('native','原生事件与闭合信息',item.native?.closure?`SDK 闭合：${closureLabels[item.native.closure]}`:'这条原生记录用于说明 SDK 展示事件、缺口或拒绝。')}
          <div className="rcExecutionRelated">
            <p>通过 run ID 可查找同一执行中的工具记录。</p>
            <button type="button" onClick={()=>onRelatedRun(String(item.runId))}>查找同一执行</button>
          </div>
        </>}
        <details className="rcTechnical rcExecutionTechnical">
          <summary>技术信息</summary>
          <div className="rcTechnicalBody">
            <dl>
              <dt>记录类型</dt><dd>{item.collection==='tools'?'工具执行':'原生记录'}</dd>
              <dt>Run ID</dt><dd>{item.runId}</dd>
              <dt>Record ID</dt><dd>{item.recordId}</dd>
              <dt>内容摘要</dt><dd>{detail.contentDigest}</dd>
              <dt>Home revision</dt><dd>{detail.revision}</dd>
            </dl>
            {raw?<pre className="rcExecutionText">{raw.text}</pre>:<button type="button" onClick={()=>onPart('raw',null,0)}>读取原始 JSON</button>}
            {raw?.more&&<button type="button" onClick={()=>onPart('raw',null,raw.nextOffset??undefined)}>继续读取原始 JSON</button>}
          </div>
        </details>
      </>}
    </aside>;
}

export function ExecutionsView({ctx,view,readOnly,readable,target}:RoleLibraryViewProps){
    const home=view.role.home;
    const roleId=home?.roleId??'unbound',bindingVersion=home?.panelBinding.bindingVersion??0;
    const preferred=loadPreference(roleId,bindingVersion,target?.view==='executions'?target.collection:'tools');
    const initialCollection:ExecutionLibraryCollection=target?.view==='executions'?target.collection:preferred.collection;
    const [collection,setCollection]=useState<ExecutionLibraryCollection>(initialCollection);
    const [queries,setQueries]=useState<QueryMap>(preferred.queries);
    const [pages,setPages]=useState<PageMap>({});
    const [revisions,setRevisions]=useState<RevisionMap>({});
    const [errors,setErrors]=useState<ErrorMap>({});
    const [busy,setBusy]=useState<Partial<Record<ExecutionLibraryCollection,boolean>>>({});
    const [selected,setSelected]=useState<ExecutionLibraryItem|null>(null);
    const [detail,setDetail]=useState<ExecutionLibraryDetail|null>(null);
    const [parts,setParts]=useState<Record<string,ExecutionLibraryPart>>({});
    const [detailError,setDetailError]=useState('');
    const [detailBusy,setDetailBusy]=useState(false);
    const priorRole=useRef(`${roleId}:${bindingVersion}`);
    const querySequence=useRef(0);
    const detailSequence=useRef(0);
    const detailFocus=useListDetailFocus({
        open:!!selected,
        focusKey:selected?itemKey(selected):'',
        returnAttribute:'data-execution-key',
    });

    async function loadPage(nextCollection:ExecutionLibraryCollection,nextQuery:QueryDraft,offset:number,expectedRevision:HomeRevision|null){
        if(!home)return;
        const sequence=++querySequence.current;
        setBusy(previous=>({...previous,[nextCollection]:true}));
        setErrors(previous=>({...previous,[nextCollection]:''}));
        try{
            const result=await ctx.remote.roleCompanion.readExecutionLibrary(home.roleId,home.panelBinding.bindingVersion,{...nextQuery,offset,expectedRevision});
            if(sequence!==querySequence.current)return;
            if(!result.ok){
                const reason=remoteErrorReason(result.error);
                setErrors(previous=>({...previous,[nextCollection]:conflictMessage(reason)}));
                if(reason==='EXECUTION_LIBRARY_REVISION_CHANGED')setPages(previous=>({...previous,[nextCollection]:undefined}));
                return;
            }
            setQueries(previous=>({...previous,[nextCollection]:{...nextQuery,offset}}));
            setPages(previous=>({...previous,[nextCollection]:result.value}));
            setRevisions(previous=>({...previous,[nextCollection]:result.value.revision}));
        }catch{
            if(sequence===querySequence.current)setErrors(previous=>({...previous,[nextCollection]:'执行记录连接中断；已保存资料仍可按原条件重新读取。'}));
        }finally{
            if(sequence===querySequence.current)setBusy(previous=>({...previous,[nextCollection]:false}));
        }
    }

    useEffect(()=>{
        if(!home)return;
        const current=queries[collection];
        const expected=current.offset>0?revisions[collection]??null:null;
        void loadPage(collection,current,current.offset,expected);
    },[ctx,roleId,bindingVersion,view.role.revision]);

    useEffect(()=>{
        writeLibraryPreference(roleId,`executions:${bindingVersion}`,{collection,queries});
    },[roleId,bindingVersion,collection,queries]);

    useEffect(()=>{
        const key=`${roleId}:${bindingVersion}`;
        if(priorRole.current===key)return;
        priorRole.current=key;
        const restored=loadPreference(roleId,bindingVersion,initialCollection);
        setCollection(restored.collection);
        setQueries(restored.queries);
        setPages({});
        setRevisions({});
        setErrors({});
    },[roleId,bindingVersion,initialCollection]);

    function closeDetail(restoreFocus=false){
        ++detailSequence.current;
        detailFocus.rememberReturnFocus(restoreFocus&&selected?itemKey(selected):'');
        setSelected(null);
        setDetail(null);
        setParts({});
        setDetailError('');
        setDetailBusy(false);
    }

    function applyQuery(next:QueryDraft){
        if(next.collection!==collection)return;
        closeDetail();
        const first={...next,offset:0};
        setQueries(previous=>({...previous,[collection]:first}));
        setRevisions(previous=>({...previous,[collection]:undefined}));
        void loadPage(collection,first,0,null);
    }

    function changeCollection(next:ExecutionLibraryCollection){
        closeDetail();
        setCollection(next);
        const current=queries[next];
        if(!pages[next])void loadPage(next,current,current.offset,current.offset>0?revisions[next]??null:null);
    }

    async function loadPart(item:ExecutionLibraryItem,currentDetail:ExecutionLibraryDetail,field:ExecutionLibrarySectionField,materialId:MaterialId|null,offset=0){
        if(!home)throw new Error('HOME_UNAVAILABLE');
        const result=await ctx.remote.roleCompanion.readExecutionLibraryPart(home.roleId,home.panelBinding.bindingVersion,{
            collection:item.collection,
            recordId:item.recordId,
            field,
            materialId,
            offset,
            limit:4096,
            expectedRevision:currentDetail.revision,
            expectedContentDigest:currentDetail.contentDigest,
        });
        if(!result.ok)throw new Error(remoteErrorReason(result.error));
        return result.value;
    }

    async function openDetail(item:ExecutionLibraryItem){
        if(!home)return;
        detailFocus.captureOrigin(itemKey(item));
        const sequence=++detailSequence.current;
        setSelected(item);
        setDetail(null);
        setParts({});
        setDetailError('');
        setDetailBusy(true);
        try{
            const result=await ctx.remote.roleCompanion.readExecutionLibraryDetail(home.roleId,home.panelBinding.bindingVersion,{
                collection:item.collection,
                recordId:item.recordId,
                expectedRevision:pages[item.collection]?.revision??home.revision,
            });
            if(sequence!==detailSequence.current)return;
            if(!result.ok){
                setDetailError(conflictMessage(remoteErrorReason(result.error)));
                return;
            }
            const current=result.value;
            setDetail(current);
            setSelected(current.item);
            const fields:readonly ExecutionLibrarySectionField[]=item.collection==='tools'?['request','observation','final']:['native'];
            const loaded=await Promise.all(fields.map(async field=>({field,part:await loadPart(current.item,current,field,null,0)})));
            if(sequence!==detailSequence.current)return;
            setParts(previous=>{
                const next={...previous};
                for(const entry of loaded)next[partKey(entry.field,null)]=entry.part;
                return next;
            });
        }catch(error){
            if(sequence===detailSequence.current)setDetailError(conflictMessage(error instanceof Error?error.message:'EXECUTION_RECORD_CHANGED'));
        }finally{
            if(sequence===detailSequence.current)setDetailBusy(false);
        }
    }

    async function loadMorePart(field:ExecutionLibrarySectionField,materialId:string|null,offset=0){
        if(!selected||!detail)return;
        const typedMaterialId=materialId as MaterialId|null,key=partKey(field,typedMaterialId);
        setDetailBusy(true);
        try{
            const next=await loadPart(selected,detail,field,typedMaterialId,offset);
            const prior=parts[key];
            if(prior&&prior.contentDigest!==next.contentDigest){
                setParts(previous=>{
                    const copy={...previous};
                    delete copy[key];
                    return copy;
                });
                setDetailError('记录内容已变化，请重新打开详情；旧片段没有继续拼接。');
                return;
            }
            setParts(previous=>({
                ...previous,
                [key]:prior&&next.offset>0?{...next,offset:prior.offset,text:prior.text+next.text}:next,
            }));
            setDetailError('');
        }catch(error){
            setDetailError(conflictMessage(error instanceof Error?error.message:'EXECUTION_RECORD_CHANGED'));
        }finally{
            setDetailBusy(false);
        }
    }

    async function retryDetail(){
        if(selected)await openDetail(selected);
    }

    async function relatedRun(runId:string){
        closeDetail();
        setCollection('tools');
        const next={...queries.tools,keyword:runId,offset:0};
        setQueries(previous=>({...previous,tools:next}));
        setRevisions(previous=>({...previous,tools:undefined}));
        await loadPage('tools',next,0,null);
    }

    function backToList(){
        closeDetail(true);
    }

    function handleKeyDown(event:KeyboardEvent<HTMLElement>):void {
        if(event.defaultPrevented||event.key!=='Escape'||!selected||typeof window==='undefined'||window.innerWidth>=760)return;
        event.preventDefault();
        backToList();
    }

    if(!home||!readable)return <LibraryUnavailable>{libraryAvailability(view,readable)}</LibraryUnavailable>;

    const currentQuery=queries[collection],page=pages[collection],error=errors[collection]??'';
    const groups:{readonly key:string;readonly label:string;readonly items:readonly ExecutionLibraryItem[]}[]=[];
    for(const item of page?.items??[]){
        const key=reportDateKey(item.occurredAt),last=groups.at(-1);
        if(last?.key===key)groups[groups.length-1]={...last,items:[...last.items,item]};
        else groups.push({key,label:reportDate(item.occurredAt),items:[item]});
    }
    const detailItem=detail?.item??selected;

    return <section className="rcExecutions" aria-label="执行记录" onKeyDown={handleKeyDown}>
      <header className="rcExecutionIntro">
        <div><h3>执行记录</h3><p>工具执行与原生记录分别查询；观察、最终规范结果和原生闭合保持各自含义。</p></div>
        {readOnly&&<span className="rcStatus" data-tone="warning">只读浏览</span>}
      </header>
      <nav className="rcExecutionTabs" aria-label="执行记录类型">
        <button type="button" aria-current={collection==='tools'?'page':undefined} onClick={()=>changeCollection('tools')}>工具执行</button>
        <button type="button" aria-current={collection==='native'?'page':undefined} onClick={()=>changeCollection('native')}>原生记录</button>
      </nav>
      <form className="rcExecutionFilters" aria-label={`${collection==='tools'?'工具执行':'原生记录'}筛选`} onSubmit={event=>{event.preventDefault();applyQuery(currentQuery);}}>
        <FilterFields query={currentQuery} onChange={next=>setQueries(previous=>({...previous,[collection]:next}))}/>
        <div className="rcExecutionFilterActions">
          <button type="submit" disabled={busy[collection]}>应用筛选</button>
          <button type="button" onClick={()=>applyQuery(initialQuery(collection))}>清除筛选</button>
        </div>
      </form>
      {error&&<p role="alert">{error}<button type="button" onClick={()=>void loadPage(collection,initialQuery(collection),0,null)}>重新读取第一页</button></p>}
      <div className="rcExecutionWorkspace" data-detail={detailItem?'open':'closed'} data-execution-collection={collection}>
        <div className="rcExecutionResults" ref={detailFocus.listRef}>
          {busy[collection]&&<p role="status">正在读取{collection==='tools'?'工具执行':'原生记录'}…</p>}
          {page&&<div className="rcExecutionPageStatus"><p>{rangeLabel(page)}；{page.more?'还有下一页':'已到末页'}</p></div>}
          {page&&!page.items.length&&<div className="rcExecutionNoResults"><p>没有匹配记录。</p><button type="button" onClick={()=>applyQuery(initialQuery(collection))}>清除筛选</button></div>}
          {groups.map(group=><section className="rcExecutionDateGroup" key={group.key} aria-label={group.label}>
            <h4>{group.label}</h4>
            <div className="rcExecutionList">
              {group.items.map(item=><button type="button" className="rcExecutionListItem" data-execution-key={itemKey(item)} key={item.recordId} aria-current={detailItem?.recordId===item.recordId?'true':undefined} onClick={()=>void openDetail(item)}>
                <span className="rcExecutionListTop"><span>{item.typeLabel}</span><strong>{item.name}</strong><time dateTime={item.occurredAt}>{reportTime(item.occurredAt)}</time></span>
                <span className="rcExecutionListSummary">{item.summary}</span>
                <span className="rcExecutionListFoot"><span>{item.statusLabel}</span><span>{channelLabels[item.channel]}</span></span>
              </button>)}
            </div>
          </section>)}
          {page&&<nav className="rcExecutionPagination" aria-label="执行记录分页">
            <button type="button" disabled={!page.hasPrevious||busy[collection]} onClick={()=>void loadPage(collection,currentQuery,Math.max(0,currentQuery.offset-currentQuery.limit),revisions[collection]??null)}>上一页</button>
            <button type="button" disabled={!page.more||busy[collection]} onClick={()=>void loadPage(collection,currentQuery,page.nextOffset??currentQuery.offset,page.revision)}>下一页</button>
          </nav>}
        </div>
        {detailItem
          ?<ExecutionDetail item={detailItem} detail={detail} parts={parts} error={detailError} readOnly={readOnly} headingRef={detailFocus.detailHeadingRef} onBack={backToList} onRetry={()=>void retryDetail()} onPart={(field,materialId,offset)=>void loadMorePart(field,materialId,offset??0)} onRelatedRun={runId=>void relatedRun(runId)}/>
          :<p className="rcExecutionEmpty">选择一条记录查看请求、观察、最终结果与材料。</p>}
      </div>
      {detailBusy&&<span className="rcExecutionBusy" role="status">正在读取记录片段…</span>}
    </section>;
}
