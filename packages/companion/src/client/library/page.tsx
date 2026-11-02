import {useEffect,useRef,useState} from 'react';
import type {CompanionView} from '../../types.ts';
import type {LibraryOverviewTarget} from '../../types.ts';
import type {Context} from '@deepseek-ai/cordis';
import {ExecutionsView} from './executions-view.tsx';
import {KnowledgeView} from './knowledge-view.tsx';
import {MaintenanceView} from './maintenance-view.tsx';
import {RoleLibraryNavigation} from './navigation.tsx';
import {OverviewView} from './overview-view.tsx';
import {readLibraryPreference,writeLibraryPreference} from './persistence.ts';
import {SourcesView} from './sources-view.tsx';
import type {RoleLibraryView,RoleLibraryViewProps} from './types.ts';
import {roleReasonLabels,roleStatus} from './view-state.tsx';

const libraryViewIds:readonly RoleLibraryView[]=['overview','sources','knowledge','executions','maintenance'];
const isLibraryView=(value:unknown):value is RoleLibraryView=>libraryViewIds.includes(value as RoleLibraryView);

function roleKey(view:CompanionView):string {
    return view.selectedRoleId??view.role.home?.roleId??view.role.roleId??'unbound';
}

function storedView(view:CompanionView):RoleLibraryView {
    return readLibraryPreference(roleKey(view),'active-view',isLibraryView)??'overview';
}

export function RoleLibraryPage({ctx,view,refresh,error,notice}:{
    readonly ctx:Context;
    readonly view:CompanionView;
    readonly refresh:()=>Promise<unknown>;
    readonly error:string;
    readonly notice:string;
}) {
    const currentRole=roleKey(view);
    const [navigation,setNavigation]=useState<{readonly view:RoleLibraryView;readonly target?:LibraryOverviewTarget}>(()=>({view:storedView(view)}));
    const priorRole=useRef(currentRole);
    const activeView=navigation.view;
    const home=view.role.home;
    const readOnly=view.role.status==='read-only';
    const editable=!readOnly&&view.role.status!=='stopping'&&view.role.status!=='stopped'&&!view.role.backups?.some(record=>record.checkpoint!=='verified');
    const readable=editable||readOnly;
    const viewProps:RoleLibraryViewProps={ctx,view,refresh,readOnly,readable,target:navigation.target};
    const state=roleStatus(view);
    const remember=(next:RoleLibraryView)=>writeLibraryPreference(currentRole,'active-view',next);
    const open=(target:LibraryOverviewTarget)=>{
        remember(target.view);
        setNavigation({view:target.view,target});
    };
    const select=(next:RoleLibraryView)=>{
        remember(next);
        setNavigation({view:next});
    };
    useEffect(()=>{
        if(priorRole.current===currentRole)return;
        priorRole.current=currentRole;
        setNavigation({view:storedView(view)});
    },[currentRole,view]);
    const current=activeView==='overview'?<OverviewView ctx={ctx} view={view} readable={readable} onOpen={open}/>
        :activeView==='sources'?<SourcesView {...viewProps}/>
        :activeView==='knowledge'?<KnowledgeView {...viewProps}/>
        :activeView==='executions'?<ExecutionsView {...viewProps}/>
        :<MaintenanceView {...viewProps}/>;
    return <section className="rcPanel rcLibraryPanel" aria-label="角色资料库">
      <header className="rcHeader">
        <div className="rcHeaderCopy">
          <span className="rcEyebrow">DSH 角色伙伴</span>
          <div className="rcTitleRow"><h2>角色资料库</h2><span className="rcStatus" data-tone={state.tone}>{state.label}</span></div>
          <p className="rcSubtitle">浏览角色之家中的原始经历、长期记忆、执行记录与维护状态。</p>
          {view.role.status!=='ready'&&<p className="rcStatusDetail">{home?roleReasonLabels[view.role.reason]??view.role.reason:'绑定角色之家后即可读取资料。'}</p>}
        </div>
        <button className="rcRefreshButton" onClick={()=>void refresh()}>刷新资料</button>
      </header>
      {error&&<p role="alert">{error}</p>}
      {notice&&<p role="status">{notice}</p>}
      <RoleLibraryNavigation activeView={activeView} onSelect={select}/>
      <div className="rcLibraryContent" data-library-view={activeView} aria-live="polite">{current}</div>
    </section>;
}
