import {useEffect,useState} from 'react';
import type {Context} from '@deepseek-ai/cordis';
import type {CompanionView} from '../../types.ts';
import type {HomeOperation} from '../../home/index.ts';
import {CoreVersion,HomeRevision,InputSettingsVersion,OperationId,RoleId} from '../../home/ids.ts';
import type {ProjectionCommand,ProjectionPreview} from '../../home/projections.ts';
import {projectionMaintenanceStatus,projectionProgressStatus} from '../../host/library-diagnostic-view.ts';
import {remoteErrorReason} from './remote-error.ts';

const pendingPrefix='dsh-role-companion:pending-projection-operation:v1:';
const legacyPendingKey='dsh-role-companion:pending-projection:v1';

interface PendingProjection {
  readonly roleId:RoleId;
  readonly command:ProjectionCommand;
}

const isRecord=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const pendingKey=(roleId:RoleId)=>pendingPrefix+roleId;

function parsePending(value:unknown,roleId:RoleId):PendingProjection|null {
  if(!isRecord(value)||value.roleId!==roleId||!isRecord(value.command))return null;
  const command=value.command;
  if((command.kind!=='import-projection'&&command.kind!=='rebuild-projection')
    ||command.projectionId!=='settings'||typeof command.operationId!=='string'
    ||(command.observedDigest!==null&&typeof command.observedDigest!=='string')
    ||typeof command.expectedRevision!=='number'||!Number.isSafeInteger(command.expectedRevision)
    ||typeof command.expectedCoreVersion!=='number'||!Number.isSafeInteger(command.expectedCoreVersion)
    ||typeof command.expectedSettingsVersion!=='number'||!Number.isSafeInteger(command.expectedSettingsVersion))return null;
  return {
    roleId,
    command:{
      kind:command.kind,
      operationId:OperationId(command.operationId),
      projectionId:'settings',
      observedDigest:command.observedDigest,
      expectedRevision:HomeRevision(command.expectedRevision),
      expectedCoreVersion:CoreVersion(command.expectedCoreVersion),
      expectedSettingsVersion:InputSettingsVersion(command.expectedSettingsVersion),
    },
  };
}

function loadPending(roleId:RoleId):PendingProjection|null {
  try{
    const current=parsePending(JSON.parse(localStorage.getItem(pendingKey(roleId))||'null'),roleId);
    if(current)return current;
    const legacy=parsePending(JSON.parse(localStorage.getItem(legacyPendingKey)||'null'),roleId);
    if(legacy&&savePending(legacy))localStorage.removeItem(legacyPendingKey);
    return legacy;
  }catch{
    return null;
  }
}

function savePending(value:PendingProjection):boolean {
  try{
    localStorage.setItem(pendingKey(value.roleId),JSON.stringify(value));
    return true;
  }catch{
    return false;
  }
}

function clearPending(roleId:RoleId):void {
  try{localStorage.removeItem(pendingKey(roleId));}catch{}
}

export function ProjectionMaintenanceView({ctx,view,refresh,readOnly}:{
  readonly ctx:Context;
  readonly view:CompanionView;
  readonly refresh:()=>Promise<unknown>;
  readonly readOnly:boolean;
}) {
  const roleId=(view.role.home?.roleId??view.selectedRoleId??view.role.roleId??'') as RoleId;
  const [preview,setPreview]=useState<ProjectionPreview|null>(null);
  const [pending,setPending]=useState<PendingProjection|null>(()=>loadPending(roleId));
  const [operation,setOperation]=useState<HomeOperation|null>(null);
  const [preserved,setPreserved]=useState('');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');

  useEffect(()=>{
    setPreview(null);
    setOperation(null);
    setPreserved('');
    setNotice('');
    setPending(loadPending(roleId));
  },[roleId]);

  async function read() {
    setBusy(true);setNotice('');
    try{
      const result=await ctx.remote.roleCompanion.previewProjection('settings',roleId);
      if(result.ok)setPreview(result.value);
      else setNotice(`投影读取未完成（${remoteErrorReason(result.error)}）。原文件保持保留。`);
      await refresh();
    }catch{
      setNotice('连接中断，尚未取得新投影预览。');
    }finally{
      setBusy(false);
    }
  }

  async function query() {
    if(!pending)return;
    setBusy(true);setNotice('');
    try{
      const result=await ctx.remote.roleCompanion.readOperation(pending.command.operationId,pending.roleId);
      if(result.ok)setOperation(result.value);
      else setNotice(`原操作查询失败（${remoteErrorReason(result.error)}）。`);
      await refresh();
    }catch{
      setNotice('连接中断，原操作结果待核对。');
    }finally{
      setBusy(false);
    }
  }

  async function apply(item:PendingProjection) {
    if(item.roleId!==roleId){
      setNotice('原操作属于另一个角色，不能在当前角色重试。');
      return;
    }
    if(!savePending(item)){
      setNotice('无法保留原操作，本次尚未提交。请检查浏览器存储后重试。');
      return;
    }
    setPending(item);setBusy(true);setNotice('');
    try{
      const result=await ctx.remote.roleCompanion.manageProjection(item.command,item.roleId);
      if(!result.ok){
        setNotice(`操作未完成（${remoteErrorReason(result.error)}）。保留原操作，先查询再重试。`);
        return;
      }
      const receipt=result.value;
      if(receipt.kind==='unavailable'){
        setNotice(`当前不可写（${receipt.reason}）。`);
        return;
      }
      setOperation(receipt);
      if(receipt.projectionOperation?.state==='complete'){
        clearPending(roleId);
        setPending(null);
        setNotice('操作意图和物理投影均已完成；原手改内容仍保留在受管资料中。');
      }else{
        setNotice('操作意图已提交，物理投影尚未完成。使用原操作查询或接续，不新建同一导入。');
      }
      const updated=await ctx.remote.roleCompanion.previewProjection('settings',roleId);
      if(updated.ok)setPreview(updated.value);
    }catch{
      setNotice('连接中断，结果待核对。取消等待不会回滚已提交操作，请查询原操作。');
    }finally{
      await refresh();
      setBusy(false);
    }
  }

  function submit(kind:ProjectionCommand['kind']) {
    if(!preview)return;
    void apply({
      roleId:preview.roleId,
      command:{
        kind,
        operationId:OperationId(crypto.randomUUID()),
        projectionId:preview.projectionId,
        observedDigest:preview.actualDigest,
        expectedRevision:preview.revision,
        expectedCoreVersion:preview.coreVersion,
        expectedSettingsVersion:preview.settingsVersion,
      },
    });
  }

  async function showPreserved() {
    if(!operation)return;
    setBusy(true);
    try{
      const result=await ctx.remote.roleCompanion.readPreservedProjection(operation.operationId,operation.roleId??roleId);
      if(!result.ok){
        setNotice(`保留内容读取失败（${remoteErrorReason(result.error)}）。`);
        return;
      }
      const bytes=Uint8Array.from(atob(result.value.bytesBase64),character=>character.charCodeAt(0));
      try{
        setPreserved(result.value.absent?'原投影不存在。':new TextDecoder('utf-8',{fatal:true}).decode(bytes));
      }catch{
        setPreserved(`非 UTF-8 原始字节（Base64）：\n${result.value.bytesBase64}`);
      }
    }catch{
      setNotice('保留内容读取中断。');
    }finally{
      setBusy(false);
    }
  }

  const status=preview?projectionMaintenanceStatus(preview):null;
  const progress=projectionProgressStatus(operation?.projectionOperation);
  return <section className="rcProjectionMaintenance" aria-label="投影维护">
    <div className="rcMaintenanceSectionHeading">
      <div>
        <h3>文本投影</h3>
        <p>权威内容来自角色之家；手工修改只形成待处理差异。受控导入仅处理核心与输入上限，不修改角色身份、版本、原始经历或历史。</p>
      </div>
      <button type="button" disabled={busy||readOnly} onClick={()=>void read()}>查看最新投影差异</button>
    </div>
    {readOnly&&<p role="status">当前角色为只读副本：可以查询已保存的原投影操作，不能预览写入、导入、重建或读取受管保留原文。</p>}
    {notice&&<p role="status">{notice}</p>}
    {status&&<div className="rcMaintenanceStatus" data-tone={status.tone}>
      <strong>{status.label}</strong>
      <p>{status.detail}</p>
      {preview?.reason&&<small>{preview.reason}</small>}
    </div>}
    {preview&&<div className="rcProjectionDiff">
      <div className="rcProjectionText">
        <h4>权威内容生成结果</h4>
        <textarea aria-label="权威内容生成结果" readOnly rows={12} value={preview.expectedText}/>
        <small>摘要 {preview.expectedDigest}</small>
      </div>
      <div className="rcProjectionText">
        <h4>实际文件内容</h4>
        <textarea aria-label="实际文件内容" readOnly rows={12} value={preview.actualText??'文件缺失、超出安全边界或包含不可安全显示的字节'}/>
        <small>摘要 {preview.actualDigest??'无文件'}</small>
      </div>
      <dl className="rcProjectionFacts">
        <div><dt>允许导入字段</dt><dd>{preview.changes.length?preview.changes.join('、'):'无'}</dd></div>
        <div><dt>Home revision</dt><dd>{preview.revision}</dd></div>
        <div><dt>核心 / 设置版本</dt><dd>{preview.coreVersion} / {preview.settingsVersion}</dd></div>
      </dl>
      {preview.sourceTemplate&&<p>来源模板 revision {preview.sourceTemplate.revision}、核心版本 {preview.sourceTemplate.coreVersion}、设置版本 {preview.sourceTemplate.settingsVersion}。执行时按当前角色之家版本重新核对。</p>}
      <div className="rcProjectionActions">
        <button type="button" disabled={busy||readOnly||!!pending||!preview.importable} onClick={()=>submit('import-projection')}>受控导入当前差异</button>
        <button type="button" disabled={busy||readOnly||!!pending||preview.state==='unavailable'} onClick={()=>submit('rebuild-projection')}>保留手改原文并重建投影</button>
      </div>
      <p>重建会先受管保留当前字节，再替换可读投影；发现较新手改、摘要变化或版本过期时停止。</p>
    </div>}
    {pending&&<section className="rcProjectionRecovery" aria-label="投影原操作恢复">
      <h4>待核对投影操作</h4>
      <p>操作 ID：{pending.command.operationId}</p>
      <button type="button" disabled={busy} onClick={()=>void query()}>查询投影原操作</button>
      <button type="button" disabled={busy||readOnly} onClick={()=>void apply(pending)}>接续投影原操作</button>
      <button type="button" disabled={busy} onClick={()=>{
        clearPending(roleId);
        setPending(null);
        setNotice('已结束本地等待；角色之家中已提交的操作不会被回滚。');
      }}>结束投影本地等待</button>
    </section>}
    {operation&&<section className="rcProjectionOperation" aria-label="投影原操作">
      <h4>原投影操作</h4>
      <p>{operation.operationId}；{operation.kind}；提交 revision {operation.committedRevision??'待核对'}。</p>
      <div className="rcMaintenanceStatus" data-tone={progress.tone}>
        <strong>{progress.label}</strong>
        <p>{operation.projectionOperation?.reason??progress.detail}</p>
      </div>
      {operation.projectionOperation&&<button type="button" disabled={busy||readOnly} onClick={()=>void showPreserved()}>查看受管保留原文</button>}
      {preserved&&<label>受管保留原文<textarea aria-label="受管保留原文" readOnly rows={8} value={preserved}/></label>}
    </section>}
  </section>;
}
