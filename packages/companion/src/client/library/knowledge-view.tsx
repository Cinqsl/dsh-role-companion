import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import type {Context} from '@deepseek-ai/cordis';
import {BindingVersion,OperationId,RoleId,type HomeRevision} from '../../home/ids.ts';
import {knowledgeRollbackCommand} from '../../home/knowledge-owner.ts';
import type {HomeOperation} from '../../home/index.ts';
import type {OwnerReceipt} from '../../runtime/index.ts';
import {contextSourceRefLabel} from '../../library/source-ref.ts';
import type {
    KnowledgeDifferenceField,
    KnowledgeLibraryDetail,
    KnowledgeLibraryPage,
    KnowledgeLibraryQuery,
    KnowledgeLibraryRecordSummary,
    KnowledgeRecordPart,
    KnowledgeRecordRef,
    KnowledgeRollbackRequest,
    LibraryOverviewTarget,
} from '../../types.ts';
import type {RoleLibraryViewProps} from './types.ts';
import {useListDetailFocus} from './list-detail-focus.ts';
import {isNonNegativeInteger,isPageLimit,isRecord,readLibraryPreference,writeLibraryPreference} from './persistence.ts';
import {remoteErrorReason} from './remote-error.ts';
import {LibraryUnavailable,libraryAvailability} from './view-state.tsx';

type Collection=KnowledgeLibraryQuery['collection'];
type Filters=Pick<KnowledgeLibraryQuery,'keyword'|'kind'|'scope'|'status'|'from'|'to'|'order'>;
interface TabState{
    readonly filters:Filters;
    readonly offset:number;
    readonly limit:20|50;
    readonly page:KnowledgeLibraryPage|null;
    readonly selected:KnowledgeLibraryRecordSummary|null;
    readonly detail:KnowledgeLibraryDetail|null;
    readonly listError:string;
    readonly detailError:string;
    readonly technicalError:string;
    readonly raw:KnowledgeRecordPart|null;
    readonly loading:boolean;
    readonly detailLoading:boolean;
    readonly technicalLoading:boolean;
    readonly reload:number;
}
type Tabs=Readonly<Record<Collection,TabState>>;
interface PendingRollback{
    readonly roleId:RoleId;
    readonly bindingVersion:BindingVersion;
    readonly request:KnowledgeRollbackRequest;
}

const kindLabels:Readonly<Record<string,string>>={
    memory:'长期记忆',growth:'成长内容',summary:'经历摘要',goal:'短期目标',activity:'内部活动',contact:'主动联系',
};
const statusLabels:Readonly<Record<string,string>>={
    'pending-final':'待最终归档与处理核对','pending-review':'待核对',adopted:'已采用',rejected:'未采用',
    recorded:'已记录',unchanged:'未新增版本','owner-rollback':'角色所有者回退版本',
};
const reasonLabels:Readonly<Record<string,string>>={
    OWNER_ACTION_REQUIRES_NEW_EVIDENCE:'旧依据不能覆盖角色所有者的回退，保留待核对。',
    EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH:'完整用户原话已保存，内容未作客观事实认证。',
    EXTRACTIVE_EXTERNAL_OBSERVATION_NOT_WORLD_TRUTH:'完整外部观察已保存，不等于世界事实已核验。',
    CURRENT_ROLE_EXPLORATION_NOT_USER_PREFERENCE:'保存角色当前探索选择，不替用户确定偏好。',
    ROLE_CHOICE_WITH_CROSS_TURN_RAW_EVIDENCE:'角色选择有跨回合原始经历可核对，语义质量仍需评估。',
    EXTRACTIVE_SUMMARY_NOT_INDEPENDENT_EVIDENCE:'提取摘要用于定位，不能算作新的独立证据。',
    CURRENT_GOAL_DECISION_NOT_COMPLETION:'保存当前目标决定，不宣称活动已完成。',
    ACTIVITY_DECISION_ONLY_NO_AUTONOMOUS_ISSUANCE:'活动决定已保存，未发行自主执行。',
    CONTACT_PROPOSAL_ONLY_NO_DELIVERY:'联系提议已保存，未生成发送。',
    KNOWLEDGE_UNCHANGED:'内容和来源没有变化，关联原版本。',
    SEMANTIC_REVIEW_REQUIRED:'现有来源不能直接证明这一理解，保留待检查。',
    SOURCE_QUOTE_MISMATCH:'引用与原始来源不符。',
    SOURCE_UNAVAILABLE_FOR_DAILY:'来源当前不能用于日常取材。',
    CROSS_TURN_INDEPENDENT_EVIDENCE_REQUIRED:'缺少跨回合独立原始依据，副本和摘要不增加次数。',
    ACTUAL_GOAL_PROGRESS_NOT_VERIFIED:'尚无可核对的实际活动证明进度或完成。',
    CORRECTED_SOURCE_REUSE:'同一批旧依据不能恢复已被纠正的理解。',
    KNOWLEDGE_VERSION_CONFLICT:'预期版本已过时，未覆盖当前版本。',
    PROPOSAL_NEW_INPUT:'新输入已接纳，旧回合提议仅保留记录。',
    PROPOSAL_CONTEXT_STALE:'上下文或规则已变化，旧提议未采用。',
    CANONICAL_NOT_SUCCESSFUL:'工具最终规范结果未成功，未采用。',
};
const differenceLabels:Readonly<Record<string,string>>={
    topic:'主题',text:'正文',scope:'适用范围',reason:'提议理由',statement:'陈述性质',kind:'知识类型',
    sources:'来源',area:'成长领域',phase:'成长阶段',state:'目标状态',decision:'活动决定',
    ownerAction:'角色所有者操作',rollbackOf:'回退来源',preservedCorrections:'保留的后来纠正',sourceBasis:'来源依据',
};
const pendingPrefix='dsh-role-companion:pending-knowledge-rollback:v2';
const pendingKey=(roleId:RoleId,bindingVersion:BindingVersion)=>`${pendingPrefix}:${roleId}:${bindingVersion}`;
const detailLimit=4096;

const blankFilters=():Filters=>({keyword:'',kind:'',scope:'all',status:'',from:'',to:'',order:'newest'});
const blankTab=():TabState=>({
    filters:blankFilters(),offset:0,limit:20,page:null,selected:null,detail:null,listError:'',detailError:'',
    technicalError:'',raw:null,loading:false,detailLoading:false,technicalLoading:false,reload:0,
});
const blankTabs=():Tabs=>({versions:blankTab(),proposals:blankTab()});
interface KnowledgePreference {
    readonly collection:Collection;
    readonly tabs:Readonly<Record<Collection,{readonly filters:Filters;readonly offset:number;readonly limit:20|50}>>;
}
const collectionLabel=(collection:Collection)=>collection==='versions'?'知识版本':'提议';
const kindLabel=(kind:string)=>kindLabels[kind]??kind;
const statusLabel=(status:string)=>statusLabels[status]??status;
const reasonLabel=(reason:string)=>reasonLabels[reason]?`${reasonLabels[reason]}（${reason}）`:reason;
const fieldLabel=(field:string)=>differenceLabels[field]??field;
const hasFilters=(filters:Filters)=>Object.entries(filters).some(([key,value])=>key==='scope'?value!=='all':key==='order'?value!=='newest':value!=='');
const timeLabel=(value:string|null)=>{
    if(!value)return '发生时间未记录';
    const time=Date.parse(value);
    return Number.isFinite(time)?new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short'}).format(time):value;
};
const refKey=(ref:KnowledgeRecordRef)=>encodeURIComponent(JSON.stringify(ref));
const sameRef=(left:KnowledgeRecordRef,right:KnowledgeRecordRef)=>JSON.stringify(left)===JSON.stringify(right);

function knowledgePreference(value:unknown):value is KnowledgePreference {
    if(!isRecord(value)||(value.collection!=='versions'&&value.collection!=='proposals'))return false;
    const tabs=value.tabs;
    if(!isRecord(tabs))return false;
    return(['versions','proposals'] as const).every(collection=>{
        const tab=tabs[collection];
        if(!isRecord(tab)||!isRecord(tab.filters))return false;
        const filters=tab.filters;
        return typeof filters.keyword==='string'
            &&typeof filters.kind==='string'
            &&['all','current','historical'].includes(String(filters.scope))
            &&typeof filters.status==='string'
            &&typeof filters.from==='string'
            &&typeof filters.to==='string'
            &&['newest','oldest'].includes(String(filters.order))
            &&isNonNegativeInteger(tab.offset)
            &&isPageLimit(tab.limit);
    });
}

function loadPreference(roleId:RoleId,bindingVersion:BindingVersion,initialCollection:Collection):KnowledgePreference {
    return readLibraryPreference(roleId,`knowledge:${bindingVersion}`,knowledgePreference)
        ??{collection:initialCollection,tabs:{versions:{filters:blankFilters(),offset:0,limit:20},proposals:{filters:blankFilters(),offset:0,limit:20}}};
}

function restoredTabs(value:KnowledgePreference):Tabs {
    return {
        versions:{...blankTab(),filters:value.tabs.versions.filters,offset:value.tabs.versions.offset,limit:value.tabs.versions.limit},
        proposals:{...blankTab(),filters:value.tabs.proposals.filters,offset:value.tabs.proposals.offset,limit:value.tabs.proposals.limit},
    };
}

function storedPending(roleId:RoleId,bindingVersion:BindingVersion):PendingRollback|null {
    try {
        const raw=JSON.parse(localStorage.getItem(pendingKey(roleId,bindingVersion))||'null');
        if(!raw)return null;
        const {kind,...request}=knowledgeRollbackCommand(raw.request);
        return {roleId:RoleId(raw.roleId),bindingVersion:BindingVersion(raw.bindingVersion),request};
    }catch {
        return null;
    }
}

function KnowledgeLibrary({ctx,roleId,bindingVersion,revision,readOnly,refresh,target}:{
    readonly ctx:Context;
    readonly roleId:RoleId;
    readonly bindingVersion:BindingVersion;
    readonly revision:HomeRevision;
    readonly readOnly:boolean;
    readonly refresh:()=>Promise<unknown>;
    readonly target?:LibraryOverviewTarget;
}){
    const preferred=loadPreference(roleId,bindingVersion,target?.view==='knowledge'?target.collection:'versions');
    const initialCollection:Collection=target?.view==='knowledge'?target.collection:preferred.collection;
    const [collection,setCollection]=useState<Collection>(initialCollection);
    const [tabs,setTabs]=useState<Tabs>(()=>{
        const restored=restoredTabs(preferred);
        if(target?.view==='knowledge'&&target.ref){
            const deepLinkFilters=initialCollection==='versions'
                ?{...blankFilters(),scope:'current' as const}
                :blankFilters();
            return {...restored,[initialCollection]:{...restored[initialCollection],filters:deepLinkFilters,offset:0}};
        }
        return restored;
    });
    const [pending,setPending]=useState<PendingRollback|null>(()=>storedPending(roleId,bindingVersion));
    const [receipt,setReceipt]=useState<HomeOperation|OwnerReceipt|null>(null);
    const [actionBusy,setActionBusy]=useState(false);
    const [actionError,setActionError]=useState('');
    const [rollbackReason,setRollbackReason]=useState('');
    const detailGeneration=useRef(0);
    const deepLink=useRef('');
    const priorRole=useRef(`${roleId}:${bindingVersion}`);
    const active=tabs[collection];
    const detailFocus=useListDetailFocus<HTMLElement>({
        open:!!active.selected,
        focusKey:active.detail?refKey(active.detail.ref):'',
        returnAttribute:'data-record-key',
    });

    function update(which:Collection,change:(current:TabState)=>Partial<TabState>):void {
        setTabs(current=>({...current,[which]:{...current[which],...change(current[which])}}));
    }
    function closeDetail(which:Collection):void {
        detailGeneration.current++;
        const selected=tabs[which].selected;
        if(selected)detailFocus.rememberReturnFocus(refKey(selected.ref));
        update(which,()=>({selected:null,detail:null,detailError:'',technicalError:'',raw:null,detailLoading:false,technicalLoading:false}));
    }

    useEffect(()=>{
        const key=`${roleId}:${bindingVersion}`;
        if(priorRole.current===key)return;
        priorRole.current=key;
        detailGeneration.current++;
        const restored=loadPreference(roleId,bindingVersion,initialCollection);
        setCollection(restored.collection);
        setTabs(restoredTabs(restored));
        setReceipt(null);
        setActionError('');
        setRollbackReason('');
        setPending(storedPending(roleId,bindingVersion));
    },[roleId,bindingVersion,initialCollection]);

    useEffect(()=>{
        writeLibraryPreference(roleId,`knowledge:${bindingVersion}`,{
            collection,
            tabs:{
                versions:{filters:tabs.versions.filters,offset:tabs.versions.offset,limit:tabs.versions.limit},
                proposals:{filters:tabs.proposals.filters,offset:tabs.proposals.offset,limit:tabs.proposals.limit},
            },
        });
    },[roleId,bindingVersion,collection,tabs.versions.filters,tabs.versions.offset,tabs.versions.limit,
        tabs.proposals.filters,tabs.proposals.offset,tabs.proposals.limit]);

    useEffect(()=>{
        detailGeneration.current++;
        setTabs(current=>({
            versions:{...current.versions,selected:null,detail:null,detailError:'',technicalError:'',raw:null,page:null},
            proposals:{...current.proposals,selected:null,detail:null,detailError:'',technicalError:'',raw:null,page:null},
        }));
    },[revision]);

    useEffect(()=>{
        if(!readOnly)return;
        detailGeneration.current++;
        setTabs(current=>({
            versions:{...current.versions,detailError:'当前为只读角色；知识内容仍可查看，但不能提交回退。'},
            proposals:{...current.proposals,detailError:'当前为只读角色；提议仍可查看。'},
        }));
    },[readOnly]);

    useEffect(()=>{
        let current=true;
        const query:KnowledgeLibraryQuery={collection,offset:active.offset,limit:active.limit,...active.filters};
        update(collection,()=>({loading:true,listError:''}));
        void ctx.remote.roleCompanion.queryKnowledgeLibrary(roleId,bindingVersion,query).then(result=>{
            if(!current)return;
            if(result.ok)update(collection,()=>({page:result.value,listError:'',loading:false}));
            else update(collection,current=>({
                listError:`知识目录读取未完成（${remoteErrorReason(result.error)}）。${current.page?'当前内容可能已过期。':''}`,
                loading:false,
            }));
        }).catch(()=>{
            if(current)update(collection,current=>({
                listError:`知识目录连接中断。${current.page?'当前内容可能已过期。':'请重新查询。'}`,
                loading:false,
            }));
        });
        return()=>{current=false;};
    },[ctx,roleId,bindingVersion,revision,collection,active.offset,active.limit,active.filters.keyword,
        active.filters.kind,active.filters.scope,active.filters.status,active.filters.from,active.filters.to,
        active.filters.order,active.reload]);

    useEffect(()=>{
        if(target?.view!=='knowledge'||!target.ref||!active.page||active.selected)return;
        const key=refKey(target.ref);
        if(deepLink.current===key)return;
        const record=active.page.records.find(candidate=>sameRef(candidate.ref,target.ref!));
        if(record){deepLink.current=key;void inspectRecord(record);}
    },[active.page,target,active.selected]);

    function changeFilter<Key extends keyof Filters>(key:Key,value:Filters[Key]):void {
        detailGeneration.current++;
        update(collection,current=>({
            filters:{...current.filters,[key]:value},offset:0,page:null,selected:null,detail:null,raw:null,
            listError:'',detailError:'',technicalError:'',detailLoading:false,
        }));
        setRollbackReason('');
        setActionError('');
    }
    function clearFilters():void {
        detailGeneration.current++;
        update(collection,current=>({
            filters:blankFilters(),offset:0,page:null,selected:null,detail:null,raw:null,
            listError:'',detailError:'',technicalError:'',detailLoading:false,
        }));
    }
    function changePage(offset:number):void {
        detailGeneration.current++;
        update(collection,current=>({
            offset,selected:null,detail:null,raw:null,detailError:'',technicalError:'',detailLoading:false,
        }));
        setRollbackReason('');
    }
    function changeLimit(limit:20|50):void {
        detailGeneration.current++;
        update(collection,current=>({
            limit,offset:0,page:null,selected:null,detail:null,raw:null,detailError:'',technicalError:'',detailLoading:false,
        }));
    }

    async function inspectRecord(record:KnowledgeLibraryRecordSummary,from=0):Promise<void> {
        const page=active.page,prior=active.detail;
        if(!page)return;
        if(from&&(!prior||!sameRef(prior.ref,record.ref)||prior.offset+Array.from(prior.text).length!==from)){
            update(collection,()=>({detailLoading:false,detailError:'知识正文读取位置已变化，请从头重新读取。'}));
            return;
        }
        const token=++detailGeneration.current;
        if(!from){
            detailFocus.captureOrigin(refKey(record.ref));
            update(collection,()=>({selected:record,detail:null,detailLoading:true,detailError:'',technicalError:'',raw:null}));
            setRollbackReason('');
            setActionError('');
        }else update(collection,()=>({detailLoading:true,detailError:''}));
        const expectedRevision=from?prior!.revision:page.revision;
        const expectedDigest=from?prior!.contentDigest:record.contentDigest;
        try {
            const result=await ctx.remote.roleCompanion.readKnowledgeLibraryDetail(roleId,bindingVersion,{
                ref:record.ref,revision:expectedRevision,contentDigest:expectedDigest,offset:from,limit:detailLimit,
            });
            if(token!==detailGeneration.current)return;
            if(!result.ok){
                const reason=remoteErrorReason(result.error);
                update(collection,current=>({
                    detailLoading:false,detail:from?current.detail:null,
                    detailError:reason==='KNOWLEDGE_RECORD_CHANGED'
                        ?'知识记录已变化；旧正文未继续拼接，请重新查询目录后再读取。'
                        :`知识详情读取未完成（${reason}）。`,
                }));
                return;
            }
            if(result.value.revision!==expectedRevision||result.value.contentDigest!==expectedDigest||!sameRef(result.value.ref,record.ref)||result.value.offset!==from){
                update(collection,current=>({
                    detailLoading:false,detail:from?current.detail:null,
                    detailError:'知识记录版本、摘要或读取位置已变化；旧正文未继续拼接，请重新查询目录。',
                }));
                return;
            }
            if(from){
                update(collection,current=>{
                    const currentDetail=current.detail;
                    if(!currentDetail||!sameRef(currentDetail.ref,result.value.ref)||currentDetail.revision!==result.value.revision||currentDetail.contentDigest!==result.value.contentDigest){
                        return {detailLoading:false,detailError:'知识记录在分段读取期间已变化；旧正文未继续拼接，请重新读取。'};
                    }
                    return {
                        detail:{
                            ...result.value,
                            offset:currentDetail.offset,
                            text:currentDetail.text+result.value.text,
                        },
                        detailLoading:false,
                        detailError:'',
                    };
                });
            }else update(collection,()=>({detail:result.value,detailLoading:false,detailError:''}));
        }catch {
            if(token===detailGeneration.current)update(collection,current=>({
                detailLoading:false,detail:from?current.detail:null,
                detailError:'知识详情连接中断，原记录仍由角色之家保存。',
            }));
        }
    }
    function returnToList():void {
        closeDetail(collection);
    }
    function handleKeyDown(event:KeyboardEvent<HTMLElement>):void {
        if(event.defaultPrevented||event.key!=='Escape'||!active.selected||typeof window==='undefined'||window.innerWidth>=760)return;
        event.preventDefault();
        returnToList();
    }

    async function loadTechnical(from=0):Promise<void> {
        const page=active.page,detail=active.detail;
        if(!page||!detail)return;
        update(collection,()=>({technicalLoading:true,technicalError:''}));
        try {
            const result=await ctx.remote.roleCompanion.readKnowledgeRecord(roleId,bindingVersion,{
                ref:detail.ref,revision:detail.revision,contentDigest:detail.contentDigest,offset:from,limit:4096,
            });
            if(!result.ok){
                update(collection,()=>({
                    technicalLoading:false,raw:null,
                    technicalError:`原始记录读取未完成（${remoteErrorReason(result.error)}）；旧片段未拼接。`,
                }));
                return;
            }
            if(result.value.revision!==detail.revision||result.value.contentDigest!==detail.contentDigest||!sameRef(result.value.ref,detail.ref)){
                update(collection,()=>({technicalLoading:false,raw:null,technicalError:'原始记录版本、摘要或标识已变化；旧片段未拼接。'}));
                return;
            }
            update(collection,current=>{
                if(from&&(!current.raw||!sameRef(current.raw.ref,result.value.ref)||current.raw.revision!==result.value.revision||current.raw.contentDigest!==result.value.contentDigest)){
                    return {technicalLoading:false,raw:null,technicalError:'原始记录在分段读取期间已变化；请从头重新读取。'};
                }
                return {
                    technicalLoading:false,
                    technicalError:'',
                    raw:from&&current.raw?{...result.value,offset:0,text:current.raw.text+result.value.text}:result.value,
                };
            });
        }catch {
            update(collection,()=>({technicalLoading:false,raw:null,technicalError:'原始记录连接中断；请从头重新读取。'}));
        }
    }

    async function queryOperation():Promise<void> {
        if(!pending)return;
        setActionBusy(true);
        setActionError('');
        try {
            const result=await ctx.remote.roleCompanion.readKnowledgeOperation(roleId,bindingVersion,pending.request.operationId);
            if(result.ok)setReceipt(result.value);
            else setActionError(`原回退查询未完成（${remoteErrorReason(result.error)}）。`);
        }catch {
            setActionError('原回退查询连接中断；操作 ID 仍保留，可再次查询。');
        }finally {
            setActionBusy(false);
        }
    }
    async function rollback():Promise<void> {
        if(readOnly)return;
        const detail=active.detail;
        const captured:PendingRollback=pending??{
            roleId,bindingVersion,
            request:{
                operationId:OperationId(`rollback-${crypto.randomUUID()}`),
                knowledgeId:detail!.knowledgeId!,
                targetVersion:detail!.version!,
                expectedKnowledgeVersion:detail!.difference!.currentVersion,
                expectedRevision:detail!.revision,
                reason:rollbackReason,
            },
        };
        if(!pending&&!rollbackReason.trim())return;
        try {
            localStorage.setItem(pendingKey(roleId,bindingVersion),JSON.stringify(captured));
        }catch {
            setActionError('无法保存本地操作 ID，本次尚未提交。');
            return;
        }
        setPending(captured);
        setActionBusy(true);
        setActionError('');
        try {
            const result=await ctx.remote.roleCompanion.rollbackKnowledge(roleId,bindingVersion,captured.request);
            if(result.ok){
                setReceipt(result.value);
                update(collection,current=>({reload:current.reload+1}));
                await refresh();
            }else {
                setActionError(`回退未确认（${remoteErrorReason(result.error)}）。保留原操作；版本冲突后需重新选择，不能把原操作改成新目标。`);
            }
        }catch {
            setActionError('回退连接中断，结果待核对。关页或取消等待不会撤销已提交操作。');
        }finally {
            setActionBusy(false);
        }
    }
    function clearPending():void {
        try { localStorage.removeItem(pendingKey(roleId,bindingVersion)); }catch {}
        setPending(null);
        setReceipt(null);
        setActionError('');
        update(collection,current=>({reload:current.reload+1,selected:null,detail:null,raw:null}));
    }

    const filtered=hasFilters(active.filters);
    const unavailable=readOnly?'当前为只读角色，可以查看知识版本、提议和原操作，但不能提交回退。':'';
    return <section className="rcKnowledgeLibrary" aria-label="知识版本与提议" onKeyDown={handleKeyDown}>
      <header className="rcKnowledgeHeading">
        <div><h3>知识版本与提议</h3><p>知识版本记录角色之家当前保留的内容；提议记录处理过程。已采用不表示客观事实已经核验。</p></div>
        <span className="rcKnowledgeCount">{active.page?`共 ${active.page.total} 条`:'读取中'}</span>
      </header>
      <div className="rcKnowledgeTabs" role="tablist" aria-label="知识集合">
        {(['versions','proposals'] as const).map(item=><button key={item} type="button" role="tab" aria-selected={collection===item} onClick={()=>setCollection(item)}>{collectionLabel(item)}</button>)}
      </div>
      {unavailable&&<p className="rcKnowledgeReadonly" role="status">{unavailable}</p>}
      <div className="rcKnowledgeFilters">
        <label>关键词<input aria-label="关键词" value={active.filters.keyword} onChange={event=>changeFilter('keyword',event.currentTarget.value)} placeholder="主题、正文或原因" /></label>
        <label>知识类型<select aria-label="知识类型" value={active.filters.kind} onChange={event=>changeFilter('kind',event.currentTarget.value)}>
          <option value="">全部类型</option>{Object.entries(kindLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select></label>
        {collection==='versions'&&<label>版本范围<select aria-label="版本范围" value={active.filters.scope} onChange={event=>changeFilter('scope',event.currentTarget.value as Filters['scope'])}>
          <option value="all">当前和历史</option><option value="current">当前版本</option><option value="historical">历史版本</option>
        </select></label>}
        <label>处理状态<select aria-label="处理状态" value={active.filters.status} onChange={event=>changeFilter('status',event.currentTarget.value)}>
          <option value="">全部状态</option>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select></label>
        <label>开始日期<input type="date" aria-label="开始日期" value={active.filters.from.slice(0,10)} onChange={event=>changeFilter('from',event.currentTarget.value?`${event.currentTarget.value}T00:00:00.000Z`:'')} /></label>
        <label>结束日期<input type="date" aria-label="结束日期" value={active.filters.to.slice(0,10)} onChange={event=>changeFilter('to',event.currentTarget.value?`${event.currentTarget.value}T23:59:59.999Z`:'')} /></label>
        <label>排序<select aria-label="排序" value={active.filters.order} onChange={event=>changeFilter('order',event.currentTarget.value as Filters['order'])}>
          <option value="newest">最新优先</option><option value="oldest">最早优先</option>
        </select></label>
        <label>每页<select aria-label="每页数量" value={active.limit} onChange={event=>changeLimit(Number(event.currentTarget.value)===50?50:20)}>
          <option value="20">20 条</option><option value="50">50 条</option>
        </select></label>
        {filtered&&<button type="button" onClick={clearFilters}>清除筛选</button>}
      </div>
      <div className="rcKnowledgeLayout" data-detail-open={active.selected?'true':undefined}>
        <section className="rcKnowledgeListPanel" aria-label={`${collectionLabel(collection)}列表`} ref={detailFocus.listRef}>
          {active.listError&&<div className="rcKnowledgeError"><p role="alert">{active.listError}</p><button type="button" onClick={()=>update(collection,current=>({reload:current.reload+1}))}>重新查询</button></div>}
          {active.loading&&!active.page&&<p role="status">正在读取知识目录…</p>}
          {active.page&&<>
            <p className="rcKnowledgeRange">第 {active.page.range.start}–{active.page.range.end} 条，共 {active.page.total} 条。</p>
            {active.page.total===0?<div className="rcKnowledgeEmpty">
              <p>{filtered?'无匹配结果':'暂无已保存记录'}</p>
              {filtered&&<button type="button" onClick={clearFilters}>清除筛选</button>}
            </div>:<ul className="rcKnowledgeRecords">{active.page.records.map(record=><li key={refKey(record.ref)}>
              <button type="button" className="rcKnowledgeRecord" data-record-key={refKey(record.ref)} aria-pressed={active.selected&&sameRef(active.selected.ref,record.ref)||false} onClick={()=>void inspectRecord(record)}>
                <span className="rcKnowledgeRecordTop"><strong>{record.topicExcerpt}</strong><span className="rcKnowledgeStatus">{statusLabel(record.status)}</span></span>
                <span className="rcKnowledgeExcerpt">{record.textExcerpt}</span>
                <span className="rcKnowledgeMeta">{kindLabel(record.kind)} · {record.current===true?'当前版本':record.current===false?'历史版本':collectionLabel(record.ref.kind==='proposal'?'proposals':'versions')} · {timeLabel(record.effectiveAt)}</span>
              </button>
            </li>)}</ul>}
            <div className="rcKnowledgePaging">
              <button type="button" disabled={active.loading||active.offset===0} onClick={()=>changePage(Math.max(0,active.offset-active.limit))}>上一页</button>
              <span>{active.page.range.start}–{active.page.range.end} / {active.page.total}</span>
              <button type="button" disabled={active.loading||active.page.nextOffset===null} onClick={()=>{const next=active.page?.nextOffset;if(next!==null&&next!==undefined)changePage(next);}}>下一页</button>
            </div>
          </>}
        </section>
        <section className="rcKnowledgeDetailPanel" aria-label="知识详情">
          {!active.selected&&<p className="rcKnowledgePlaceholder">选择一条记录查看正文、来源和版本差异。</p>}
          {active.selected&&<>
            <button type="button" className="rcKnowledgeBack" onClick={returnToList}>返回知识列表</button>
            {active.detailLoading&&<p role="status">正在读取知识详情…</p>}
            {active.detailError&&<div className="rcKnowledgeError"><p role="alert">{active.detailError}</p><button type="button" onClick={()=>void inspectRecord(active.selected!)}>重新读取详情</button></div>}
            {active.detail&&<article className="rcKnowledgeDetail">
              <header><span>{kindLabel(active.detail.kind)}</span><h4 ref={detailFocus.detailHeadingRef} tabIndex={-1}>{active.detail.topic}</h4><p>{statusLabel(active.detail.status)} · {active.detail.current===true?'当前版本':active.detail.current===false?'历史版本':collectionLabel('proposals')} · {timeLabel(active.detail.effectiveAt)}</p></header>
              <dl className="rcKnowledgeDefinition"><div><dt>正文</dt><dd><span>{active.detail.text}</span><p>已读取第 {active.detail.offset+1}–{active.detail.offset+Array.from(active.detail.text).length} 个码点，共 {active.detail.bodyTotalCodePoints} 个。</p>{active.detail.more&&!active.detailError&&<button type="button" disabled={active.detailLoading} onClick={()=>void inspectRecord(active.selected!,active.detail!.nextOffset!)}>{active.detailLoading?'正在读取正文…':'继续读取知识正文'}</button>}</dd></div><div><dt>适用范围</dt><dd>{active.detail.scope}</dd></div><div><dt>陈述性质</dt><dd>{active.detail.statement}</dd></div></dl>
              {active.detail.processingReason&&<p>处理原因：{reasonLabel(active.detail.processingReason)}</p>}
              <section aria-label="来源引用"><h5>来源引用</h5>{active.detail.sources.length?<ul>{active.detail.sources.map((source,index)=><li key={`${index}:${JSON.stringify(source.ref)}`}><strong>{contextSourceRefLabel(source.ref)}</strong><blockquote>{source.quote}</blockquote></li>)}</ul>:<p>没有保留的来源引用。</p>}</section>
              <section aria-label="保留的后来纠正"><h5>保留的后来纠正</h5>{active.detail.preservedCorrections.length?<ul>{active.detail.preservedCorrections.map(ref=><li key={JSON.stringify(ref)}>{contextSourceRefLabel(ref)}</li>)}</ul>:<p>没有显式保留的后来纠正。</p>}</section>
              {active.detail.difference&&<section aria-label="版本差异"><h5>与当前版本比较</h5>{active.detail.difference.fields.length===0?<p>所选版本与当前版本没有字段差异。</p>:<ul className="rcKnowledgeDifference">{active.detail.difference.fields.map(field=><Difference key={field.field} field={field} />)}</ul>}</section>}
              {active.detail.ref.kind==='version'&&<section className="rcKnowledgeRollback" aria-label="知识回退">
                <h5>回退</h5>
                {readOnly?<p>当前为只读角色，不能提交回退。</p>:active.detail.current===true?<p>当前版本无需回退；选择历史版本后可比较差异并生成新的回退版本。</p>:!active.detail.difference?<p>版本差异不可用，暂时不能回退。</p>:<>
                  <label>回退理由<textarea aria-label="回退理由" value={rollbackReason} onChange={event=>setRollbackReason(event.currentTarget.value)} /></label>
                  <button type="button" disabled={actionBusy||!rollbackReason.trim()} onClick={()=>void rollback()}>提交回退</button>
                  <p>回退会生成新的当前版本，并继续保留来源、后来纠正和原操作记录。</p>
                </>}
              </section>}
              {actionError&&<p role="alert">{actionError}</p>}
              <details className="rcKnowledgeTechnical"><summary>技术信息</summary>
                <dl><div><dt>内容摘要</dt><dd>{active.detail.contentDigest}</dd></div><div><dt>资料 revision</dt><dd>{active.detail.revision}</dd></div><div><dt>保存 revision</dt><dd>{active.detail.committedRevision}</dd></div></dl>
                <button type="button" disabled={active.technicalLoading} onClick={()=>void loadTechnical()}>读取完整原始记录</button>
                {active.technicalError&&<p role="alert">{active.technicalError}</p>}
                {active.raw&&<><p>已读取 {Array.from(active.raw.text).length}/{active.raw.totalCodePoints} 码点。</p><pre>{active.raw.text}</pre>{active.raw.more&&<button type="button" disabled={active.technicalLoading} onClick={()=>void loadTechnical(Array.from(active.raw!.text).length)}>继续读取原始记录</button>}</>}
              </details>
            </article>}
          </>}
        </section>
      </div>
      {pending&&<section className="rcKnowledgeOperation" aria-label="知识回退操作">
        <h4>知识回退操作</h4>
        <p>操作 {pending.request.operationId}。取消等待或关闭页面不会撤销已提交操作；可查询原操作后再决定是否按原请求继续。</p>
        <div className="rcKnowledgeOperationActions">
          <button type="button" disabled={actionBusy} onClick={()=>void queryOperation()}>查询原回退操作</button>
          {!readOnly&&<button type="button" disabled={actionBusy} onClick={()=>void rollback()}>按原操作重试回退</button>}
          <button type="button" disabled={actionBusy} onClick={clearPending}>清除本地选择并重新核对</button>
        </div>
        {actionError&&<p role="alert">{actionError}</p>}
        {receipt&&<details><summary>回退回执技术信息</summary><pre>{JSON.stringify(receipt,null,2)}</pre></details>}
      </section>}
    </section>;
}

function Difference({field}:{readonly field:KnowledgeDifferenceField}){
    return <li><strong>{fieldLabel(field.field)}</strong><div><span>所选版本{field.targetMore?'（摘录）':''}</span><pre>{field.targetExcerpt}</pre></div><div><span>当前版本{field.currentMore?'（摘录）':''}</span><pre>{field.currentExcerpt}</pre></div></li>;
}

export function KnowledgeView({ctx,view,refresh,readOnly,readable,target}:RoleLibraryViewProps){
    const home=view.role.home;
    return home&&readable?<KnowledgeLibrary ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} readOnly={readOnly} refresh={refresh} target={target}/>:<LibraryUnavailable>{libraryAvailability(view,readable)}</LibraryUnavailable>;
}
