import {useEffect,useState} from 'react';
import type {LibraryMaintenanceView} from '../../types.ts';
import {MaintenanceCleanup} from './maintenance-cleanup.tsx';
import {DiagnosticRecoveryView} from './maintenance-diagnostics.tsx';
import {ProjectionMaintenanceView} from './maintenance-projection.tsx';
import {remoteErrorReason} from './remote-error.ts';
import type {RoleLibraryViewProps} from './types.ts';
import {LibraryUnavailable,libraryAvailability} from './view-state.tsx';

type MaintenanceTab='cleanup'|'projection'|'diagnostics';

export function MaintenanceView({ctx,view,refresh,readOnly,readable,target}:RoleLibraryViewProps) {
    const initialTab:MaintenanceTab=target?.view==='maintenance'?target.tab:'cleanup';
    const [tab,setTab]=useState<MaintenanceTab>(initialTab);
    const [offset,setOffset]=useState(0);
    const [maintenance,setMaintenance]=useState<LibraryMaintenanceView|null>(null);
    const [loading,setLoading]=useState(false);
    const [error,setError]=useState('');
    const [reload,setReload]=useState(0);
    const home=view.role.home;
    const roleId=home?.roleId??view.role.roleId;
    const bindingVersion=home?.panelBinding.bindingVersion;
    useEffect(()=>{
      if(!readable||!roleId||bindingVersion===undefined)return;
      let current=true;
      setLoading(true);setError('');
      void ctx.remote.roleCompanion.readMaintenance(roleId,bindingVersion,{offset,limit:20}).then(result=>{
        if(!current)return;
        if(result.ok)setMaintenance(result.value);
        else setError(`维护资料读取未完成（${remoteErrorReason(result.error)}）。`);
      }).catch(()=>{
        if(current)setError('维护资料连接中断，请重新查询。');
      }).finally(()=>{
        if(current)setLoading(false);
      });
      return()=>{current=false;};
    },[ctx,roleId,bindingVersion,home?.revision,offset,readable,reload]);
    if(!readable||!(home||readOnly))return <LibraryUnavailable>{libraryAvailability(view,readable)}</LibraryUnavailable>;
    const health=maintenance?.health;
    const changed=async()=>{setReload(value=>value+1);await refresh();};
    return <section className="rcLibraryMaintenance" aria-label="维护">
      <div className="rcMaintenanceHealth" data-tone={health?.tone??'neutral'}>
        <div>
          <span className="rcEyebrow">当前维护状态</span>
          <h3>{health?.label??'正在核对维护状态'}</h3>
          <p>{health?.detail??'正在读取角色之家与待处理任务。'}</p>
        </div>
        {!!health?.pendingCleanupCount&&<strong>{health.pendingCleanupCount} 项清理待继续</strong>}
      </div>
      <nav className="rcSectionNav rcMaintenanceNav" aria-label="维护内部视图">
        <button type="button" aria-expanded={tab==='cleanup'} onClick={()=>setTab('cleanup')}>清理</button>
        <button type="button" aria-expanded={tab==='projection'} onClick={()=>setTab('projection')}>投影</button>
        <button type="button" aria-expanded={tab==='diagnostics'} onClick={()=>setTab('diagnostics')}>诊断恢复</button>
      </nav>
      <div className="rcMaintenancePanel" data-maintenance-tab={tab}>
        {tab==='cleanup'&&<MaintenanceCleanup
          ctx={ctx}
          roleId={home?.roleId??view.role.roleId as import('../../types.ts').RoleId}
          bindingVersion={(home?.panelBinding.bindingVersion??1) as import('../../types.ts').BindingVersion}
          currentRevision={home?.revision??view.role.revision??0 as import('../../types.ts').HomeRevision}
          page={maintenance?.cleanup??null}
          loading={loading}
          error={error}
          offset={offset}
          readOnly={readOnly}
          tasks={view.role.cleanups??[]}
          onOffset={setOffset}
          onChanged={changed}
        />}
        {tab==='projection'&&<ProjectionMaintenanceView ctx={ctx} view={view} refresh={changed} readOnly={readOnly}/>}
        {tab==='diagnostics'&&<DiagnosticRecoveryView ctx={ctx} view={view} refresh={changed} readOnly={readOnly} readable={readable}/>}
      </div>
    </section>;
}
