import {useEffect,useState} from 'react';
import type {BackupProgress} from '../../home/backups.ts';
import type {OperationId,RoleId} from '../../home/ids.ts';
import type {HomeDiagnostic} from '../../home/projections.ts';
import {diagnosticSummary} from '../../host/library-diagnostic-view.ts';
import {remoteErrorReason} from './remote-error.ts';
import type {RoleLibraryViewProps} from './types.ts';

const backupLabels:Readonly<Record<BackupProgress['phase'],string>>={
  'not-found':'未找到原操作',
  stopping:'等待角色停稳',
  stopped:'已停稳，等待复制',
  copying:'复制中',
  verifying:'校验中',
  uncertain:'待核对',
  failed:'校验失败',
  'verified-restorable':'可恢复备份',
};

export function DiagnosticRecoveryView({ctx,view,refresh,readOnly}:RoleLibraryViewProps) {
  const roleId=(view.role.home?.roleId??view.selectedRoleId??view.role.roleId??'') as RoleId;
  const bindingVersion=view.role.home?.panelBinding.bindingVersion;
  const [diagnostic,setDiagnostic]=useState<HomeDiagnostic|null>(view.role.diagnostic??null);
  const backups=view.role.backups??[];
  const [selectedBackupId,setSelectedBackupId]=useState<string>(backups[0]?.operationId??'');
  const [verification,setVerification]=useState<BackupProgress|null>(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    setDiagnostic(view.role.diagnostic??null);
    setVerification(null);
    setNotice('');
    setError('');
    setSelectedBackupId(current=>backups.some(record=>record.operationId===current)?current:backups[0]?.operationId??'');
  },[roleId]);

  useEffect(()=>{
    if(!roleId)return;
    let current=true;
    void ctx.remote.roleCompanion.readDiagnostic(roleId).then(result=>{
      if(!current)return;
      if(result.ok)setDiagnostic(result.value);
      else setError(`资料完整性读取未完成（${remoteErrorReason(result.error)}）。`);
    }).catch(()=>{
      if(current)setError('资料完整性连接中断，当前故障现场保持保留。');
    });
    return()=>{current=false;};
  },[ctx,roleId]);

  async function verifyBackup() {
    if(!selectedBackupId)return;
    setBusy(true);setError('');setNotice('');
    try{
      const result=await ctx.remote.roleCompanion.verifyBackup(roleId,selectedBackupId as OperationId);
      if(result.ok){
        setVerification(result.value);
        setNotice(result.value.phase==='verified-restorable'
          ?'所选副本校验为可恢复备份；只校验所选副本，不替换资料或启动副本。'
          :`所选副本校验结果为「${backupLabels[result.value.phase]}」；没有替换资料或启动副本。`);
        await refresh();
      }else{
        setError(`所选副本校验未完成（${remoteErrorReason(result.error)}）。保留原备份操作后重试。`);
      }
    }catch{
      setError('所选副本校验结果待核对；角色资料没有被替换或启动。');
    }finally{
      setBusy(false);
    }
  }

  async function retryArchives() {
    if(bindingVersion===undefined)return;
    setBusy(true);setError('');setNotice('');
    try{
      const result=await ctx.remote.roleCompanion.retryArchives(roleId,bindingVersion);
      if(result.ok){
        setNotice(`原工具记录保存重试完成，仍待保存 ${result.value.pending} 项。此操作只补写已经捕获的工具记录，不重新执行工具。`);
        await refresh();
      }else{
        setError(`原工具记录保存仍未确认（${remoteErrorReason(result.error)}）。后继动作保持受阻。`);
      }
    }catch{
      setError('原工具记录保存结果待核对；不会重新执行工具。');
    }finally{
      setBusy(false);
    }
  }

  const currentBackup=verification??backups.find(record=>record.operationId===selectedBackupId);
  const status=diagnostic?diagnosticSummary(diagnostic):null;
  return <section className="rcDiagnosticRecovery" aria-label="诊断恢复">
    <div className="rcMaintenanceSectionHeading">
      <div>
        <h3>诊断与恢复</h3>
        <p>核对资料完整性、故障证据与恢复边界。恢复动作只处理已经发生的保存问题。</p>
      </div>
    </div>
    {readOnly&&<p role="status">当前角色为只读副本：允许诊断读取、备份校验和原操作查询，不能提交投影写入或归档保存重试。</p>}
    {error&&<p role="alert">{error}</p>}
    {notice&&<p role="status">{notice}</p>}
    <section className="rcDiagnosticSection" aria-label="资料完整性">
      <div className="rcDiagnosticHeading">
        <div>
          <h4>资料完整性</h4>
          <p>诊断只读取身份、revision 和受控证据，不改写故障资料。</p>
        </div>
        <button type="button" disabled={busy} onClick={()=>{
          setBusy(true);setError('');
          void ctx.remote.roleCompanion.readDiagnostic(roleId).then(result=>{
            if(result.ok)setDiagnostic(result.value);
            else setError(`资料完整性读取未完成（${remoteErrorReason(result.error)}）。`);
          }).catch(()=>setError('资料完整性连接中断。')).finally(()=>setBusy(false));
        }}>重新检查资料完整性</button>
      </div>
      {status&&<div className="rcMaintenanceStatus" data-tone={status.tone}>
        <strong>{status.label}</strong>
        <p>{status.detail}</p>
      </div>}
      {diagnostic&&<dl className="rcDiagnosticFacts">
        <div><dt>诊断模式</dt><dd>{diagnostic.mode==='healthy'?'完整校验通过':'只读故障诊断'}</dd></div>
        <div><dt>故障原因</dt><dd>{diagnostic.reason}</dd></div>
        <div><dt>文件声称身份</dt><dd>{diagnostic.claimedRoleId??'无法读取'}</dd></div>
        <div><dt>完整校验身份</dt><dd>{diagnostic.verifiedRoleId??'尚未验证'}</dd></div>
        <div><dt>校验 revision</dt><dd>{diagnostic.verifiedRevision??'无'}</dd></div>
      </dl>}
      {diagnostic&&<details className="rcDiagnosticEvidence" open>
        <summary>故障证据与恢复边界</summary>
        <p>不跳过坏记录，不重置确认下界，不初始化覆盖。已有备份只在所选副本内校验，恢复和单活交接继续使用各自入口。</p>
        <ul>{diagnostic.evidence.map(item=><li key={item.file}>{item.file}：{item.bytes} 字节，SHA-256 {item.digest}</li>)}</ul>
        {diagnostic.recovery.length>0&&<p>恢复边界：{diagnostic.recovery.join('、')}。</p>}
      </details>}
    </section>
    <section className="rcDiagnosticSection" aria-label="备份校验">
      <div className="rcDiagnosticHeading">
        <div>
          <h4>已有备份校验</h4>
          <p>只校验所选副本，不替换资料或启动副本。校验结果不授予恢复、迁移或第二份活跃角色权限。</p>
        </div>
      </div>
      {backups.length===0
        ?<p className="rcLibraryState">当前没有已保存的备份操作。创建备份仍在生命周期维护中完成。</p>
        :<>
          <label>待校验备份
            <select aria-label="待校验备份" value={selectedBackupId} onChange={event=>{setSelectedBackupId(event.target.value);setVerification(null);}}>
              {backups.map(record=><option key={record.operationId} value={record.operationId}>{record.operationId}：{backupLabels[record.phase]}</option>)}
            </select>
          </label>
          {currentBackup&&<dl className="rcBackupVerificationFacts">
            <div><dt>备份操作 ID</dt><dd>{currentBackup.operationId}</dd></div>
            <div><dt>阶段</dt><dd>{backupLabels[currentBackup.phase]}</dd></div>
            <div><dt>复制 / 校验</dt><dd>{currentBackup.copiedFiles} / {currentBackup.verifiedFiles} 项</dd></div>
            <div><dt>源 revision</dt><dd>{currentBackup.sourceRevision??'尚未停稳'}</dd></div>
          </dl>}
          <button type="button" disabled={busy||!selectedBackupId} onClick={()=>void verifyBackup()}>仅校验所选备份</button>
        </>}
    </section>
    <section className="rcDiagnosticSection" aria-label="原工具记录保存重试">
      <div className="rcDiagnosticHeading">
        <div>
          <h4>原工具记录保存</h4>
          <p>只补写已经捕获的工具记录，不重新执行工具，也不发送新的模型请求。</p>
        </div>
        <button type="button" disabled={busy||readOnly||bindingVersion===undefined} onClick={()=>void retryArchives()}>重试原工具记录保存</button>
      </div>
      <p>角色原因：{view.role.reason||'当前没有额外故障原因'}。归档保存重试与工具重做是两件事；这里不会再次调用工具或重复外部副作用。</p>
    </section>
  </section>;
}
