import {useEffect,useRef,useState} from 'react';
import type {Context} from '@deepseek-ai/cordis';
import {OperationId} from '../../home/ids.ts';
import type {
  BindingVersion,
  CleanupCatalogItem,
  CleanupCatalogPage,
  CleanupCommand,
  CleanupPreview,
  CleanupProgress,
  CleanupWaiting,
  HomeRevision,
  RoleId,
} from '../../types.ts';
import {clearPendingCleanup,loadPendingCleanup,savePendingCleanup,type PendingCleanup} from './maintenance-pending.ts';
import {remoteErrorReason} from './remote-error.ts';

type Progress=CleanupProgress|CleanupWaiting;
const refKey=(item:CleanupCatalogItem)=>item.kind+':'+item.ref.id;
const phaseText:Readonly<Record<Progress['phase'],string>>={
  'waiting-actions':'等待已进入动作及最终归档',
  'logical-complete':'已逻辑撤销，正文尚未清完',
  purging:'正在清除不再使用的正文',
  complete:'清理完成',
};
const effectNames:Readonly<Record<string,string>>={
  input:'用户来信',reply:'角色回复',tool:'工具执行',turn:'对话回合',attempt:'执行尝试',
  native:'原生记录',delivery:'发送结果',proposal:'知识提议',knowledge:'知识版本',
  'qq-history':'QQ 历史查询','autonomy-activity':'自主活动',
};
const externalNames:Readonly<Record<string,string>>={
  'QQ messages':'QQ 消息','DSH private storage':'DSH 私有存储',
  'external files':'外部文件','independent backups':'独立备份',
};

function effectLine(effect:CleanupPreview['effects'][number]):string {
  return `${effectNames[effect.kind]??effect.kind} · ${effect.id}${effect.version===undefined?'':` / v${effect.version}`}`;
}

export function MaintenanceCleanup({
  ctx,
  roleId,
  bindingVersion,
  currentRevision,
  page,
  loading,
  error,
  offset,
  readOnly,
  tasks,
  onOffset,
  onChanged,
}:{
  readonly ctx:Context;
  readonly roleId:RoleId;
  readonly bindingVersion:BindingVersion;
  readonly currentRevision:HomeRevision;
  readonly page:CleanupCatalogPage|null;
  readonly loading:boolean;
  readonly error:string;
  readonly offset:number;
  readonly readOnly:boolean;
  readonly tasks:readonly Progress[];
  readonly onOffset:(offset:number)=>void;
  readonly onChanged:()=>Promise<unknown>;
}) {
  const [selected,setSelected]=useState<readonly CleanupCatalogItem[]>([]);
  const [derived,setDerived]=useState<'retain'|'remove'>('retain');
  const [preview,setPreview]=useState<CleanupPreview|null>(null);
  const [progress,setProgress]=useState<Progress|null>(null);
  const [pending,setPending]=useState<PendingCleanup|null>(()=>loadPendingCleanup(roleId));
  const [operationId,setOperationId]=useState(pending?.command.operationId??'');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [actionError,setActionError]=useState('');
  const generation=useRef(0);
  const items:readonly CleanupCatalogItem[]=page?.items??[];
  const stale=!!preview&&preview.revision!==currentRevision;

  useEffect(()=>{
    const restored=loadPendingCleanup(roleId);
    setPending(restored);setOperationId(restored?.command.operationId??'');
    setSelected([]);setPreview(null);setProgress(null);setActionError('');
  },[roleId]);
  useEffect(()=>()=>{generation.current++;},[]);
  useEffect(()=>{
    if(!progress||progress.phase==='complete'||progress.error||busy)return;
    const timer=setTimeout(()=>void query(progress.operationId),1000);
    return()=>clearTimeout(timer);
  },[progress?.operationId,progress?.phase,progress?.error,busy]);

  function select(item:CleanupCatalogItem,checked:boolean) {
    if(readOnly||pending||busy)return;
    setSelected(current=>checked
      ?[...current.filter(candidate=>refKey(candidate)!==refKey(item)),item]
      :current.filter(candidate=>refKey(candidate)!==refKey(item)));
    setPreview(null);setProgress(null);setActionError('');
  }

  async function inspect() {
    if(readOnly||!selected.length)return;
    const issued=++generation.current;
    setBusy(true);setActionError('');setNotice('');
    try {
      const selection={
        sources:selected.map(item=>item.ref).sort((left,right)=>
          (left.kind+':'+left.id).localeCompare(right.kind+':'+right.id)),
        derived,
      };
      const result=await ctx.remote.roleCompanion.previewCleanup(roleId,bindingVersion,selection);
      if(issued!==generation.current)return;
      if(result.ok)setPreview(result.value);
      else setActionError(`清理预览未完成（${remoteErrorReason(result.error)}）。`);
    } catch {
      if(issued===generation.current)setActionError('预览连接中断，尚未发起清理。');
    } finally {
      if(issued===generation.current)setBusy(false);
    }
  }

  async function submit() {
    if(readOnly||!preview||stale)return;
    const command:CleanupCommand={
      ...(pending?.command??{operationId:OperationId(crypto.randomUUID())}),
      kind:'cleanup-sources',
      selection:preview.selection,
      expectedRevision:preview.revision,
      previewDigest:preview.digest,
    };
    const stored={roleId,bindingVersion,command};
    if(!savePendingCleanup(stored)) {
      setActionError('无法保存原清理操作 ID，本次尚未提交。请检查浏览器存储。');
      return;
    }
    setPending(stored);setOperationId(command.operationId);
    const issued=++generation.current;
    setBusy(true);setActionError('');setNotice('');
    try {
      const result=await ctx.remote.roleCompanion.requestCleanup(roleId,bindingVersion,command);
      if(issued!==generation.current)return;
      if(!result.ok) {
        const code=remoteErrorReason(result.error);
        setActionError(code==='CLEANUP_PREVIEW_CHANGED'
          ?'角色之家版本已经变化，旧预览不能确认。请重新预览后再继续。'
          :`清理请求未确认（${code}）。请保留原操作 ID，先查询原任务。`);
        return;
      }
      setProgress(result.value);
      if(result.value.phase==='complete') {
        clearPendingCleanup(roleId);setPending(null);
        setNotice('清理已完成，正文处理结果已保存。');
      } else {
        setNotice('清理请求已确认，正在等待或继续原任务。');
      }
      await onChanged();
    } catch {
      if(issued===generation.current)setActionError('清理连接中断，提交结果不明；请查询或重试原操作，不要更换操作 ID。');
    } finally {
      if(issued===generation.current)setBusy(false);
    }
  }

  async function resumeOriginal() {
    if(readOnly||!pending||pending.bindingVersion!==bindingVersion)return;
    if(!savePendingCleanup(pending)) {
      setActionError('无法保存原清理操作 ID，本次尚未提交。请检查浏览器存储。');
      return;
    }
    const issued=++generation.current;
    setBusy(true);setActionError('');setNotice('');
    try {
      const result=await ctx.remote.roleCompanion.requestCleanup(roleId,bindingVersion,pending.command);
      if(issued!==generation.current)return;
      if(!result.ok) {
        setActionError(`原清理操作尚未确认（${remoteErrorReason(result.error)}）。操作 ID 与原请求继续保留。`);
        return;
      }
      setProgress(result.value);
      if(result.value.phase==='complete') {
        clearPendingCleanup(roleId);setPending(null);
        setNotice('原清理操作已完成。');
      } else {
        setNotice('已按原操作 ID 继续清理，结果保留以便核对。');
      }
      await onChanged();
    } catch {
      if(issued===generation.current)setActionError('恢复连接中断，原操作 ID 与原请求仍保留。');
    } finally {
      if(issued===generation.current)setBusy(false);
    }
  }

  async function query(id=operationId) {
    let original;
    try { original=OperationId(id); }
    catch { setActionError('请填写原清理操作 ID。');return; }
    const issued=++generation.current;
    setBusy(true);setActionError('');setNotice('');
    try {
      const result=await ctx.remote.roleCompanion.readCleanup(roleId,bindingVersion,original);
      if(issued!==generation.current)return;
      if(!result.ok)setActionError(`原任务查询未完成（${remoteErrorReason(result.error)}）。`);
      else if(result.value.phase==='not-found')setNotice('角色之家尚未记录该任务；保留原操作 ID，可在核对后按原请求重试。');
      else {
        setProgress(result.value);setOperationId(original);
        if(result.value.phase==='complete') {
          clearPendingCleanup(roleId);setPending(null);
        }
      }
    } catch {
      if(issued===generation.current)setActionError('原任务连接中断，操作 ID 和原请求仍保留。');
    } finally {
      if(issued===generation.current)setBusy(false);
    }
  }

  function clearLocal() {
    clearPendingCleanup(roleId);setPending(null);setProgress(null);
    setNotice('已结束本地等待；角色之家中已经提交的操作不会被撤销。');
  }

  const locked=readOnly||busy||!!pending;
  return <section className="rcMaintenanceCleanup" aria-label="清理经历来源">
    <div className="rcMaintenanceSectionHeading">
      <div>
        <h3>清理经历来源</h3>
        <p>选择用户来信、角色回复或工具执行，先预览影响，再由角色所有者确认一次。</p>
      </div>
      {page&&<p className="rcMaintenanceRange">共 {page.total} 条，当前 {items.length?`${page.offset+1}–${page.offset+items.length}`:'0'}</p>}
    </div>
    {readOnly&&<p role="status">当前为只读角色：可以查看清理目录和查询原任务，不能选择、预览、确认或继续写入。</p>}
    {(error||actionError)&&<p role="alert">{actionError||error}</p>}
    {notice&&<p role="status">{notice}</p>}
    {loading&&!page&&<p role="status">正在读取清理目录…</p>}
    {page&&items.length===0&&<p className="rcLibraryState">当前没有可清理的经历来源。</p>}
    {items.length>0&&<ul className="rcCleanupRows">
      {items.map(item=><li key={refKey(item)} data-cleanup-state={item.state}>
        <label>
          <input type="checkbox" disabled={item.state!=='available'||locked}
            aria-label={`${item.kindLabel}：${item.preview}`}
            checked={selected.some(candidate=>refKey(candidate)===refKey(item))}
            onChange={event=>select(item,event.target.checked)}/>
          <span className="rcCleanupRowCopy">
            <span className="rcCleanupRowTitle"><strong>{item.kindLabel}</strong><span className="rcCleanupState">{item.stateLabel}</span></span>
            <span className="rcCleanupPreview">{item.preview}</span>
            {item.occurredAt&&<time dateTime={item.occurredAt}>{new Date(item.occurredAt).toLocaleString('zh-CN')}</time>}
          </span>
        </label>
      </li>)}
    </ul>}
    {page&&page.total>0&&<nav className="rcCleanupPager" aria-label="清理来源分页">
      <button type="button" disabled={loading||offset===0} onClick={()=>onOffset(Math.max(0,offset-20))}>上一页清理来源</button>
      <button type="button" disabled={loading||!page.more} onClick={()=>onOffset(offset+20)}>下一页清理来源</button>
    </nav>}
    {!readOnly&&!pending&&selected.length>0&&<label className="rcCleanupDerived">派生知识处理
      <select value={derived} onChange={event=>{setDerived(event.target.value as 'retain'|'remove');setPreview(null);}}>
        <option value="retain">保留派生知识并重新判定日常用途</option>
        <option value="remove">一并清理派生知识</option>
      </select>
    </label>}
    {preview&&<section className="rcCleanupImpact" aria-label="清理影响预览">
      <div className="rcMaintenanceSectionHeading">
        <div><h3>清理影响预览</h3><p>预览绑定角色之家 revision {preview.revision} 与摘要 {preview.digest.slice(0,12)}…。</p></div>
        <span className="rcCleanupState">{stale?'版本已变化，必须重新预览':'当前预览有效'}</span>
      </div>
      <div className="rcCleanupImpactGrid">
        <section><h4>将撤销的记录</h4><ul>{preview.effects.filter(effect=>effect.action==='revoke').map(effect=><li key={effect.kind+effect.id+(effect.version??'')}>{effectLine(effect)}</li>)}</ul>{!preview.effects.some(effect=>effect.action==='revoke')&&<p>没有需要撤销的记录。</p>}</section>
        <section><h4>保留的结果元数据</h4><ul>{preview.effects.filter(effect=>effect.action!=='revoke').map(effect=><li key={effect.kind+effect.id+(effect.version??'')}>{effectLine(effect)}</li>)}</ul>{!preview.effects.some(effect=>effect.action!=='revoke')&&<p>没有额外保留项。</p>}</section>
        <section><h4>仍被其他资料使用的共享正文</h4>{preview.sharedContent.length?<ul>{preview.sharedContent.map(shared=><li key={shared.digest}>保留由 {shared.retainedUses.join('、')||'其他资料'} 使用的内容（{shared.utf8Bytes} 字节）。</li>)}</ul>:<p>没有共享正文。</p>}</section>
        <section><h4>派生知识处理</h4><p>{preview.selection.derived==='retain'?'保留派生知识并重新判定日常用途。':'同时清理派生知识正文。'}</p><p>{preview.quiescingRuns.length?`将等待 ${preview.quiescingRuns.length} 个执行范围收尾。`:'没有进行中的执行。'}</p></section>
        <section><h4>外部副本范围</h4><ul>{preview.externalCopies.map(copy=><li key={copy}>{externalNames[copy]??copy}</li>)}</ul></section>
      </div>
      {!progress&&<button type="button" className="rcDangerAction" disabled={busy||readOnly||stale} onClick={()=>void submit()}>
        确认清理所选记录
      </button>}
      {stale&&<p role="alert">角色之家版本已经变化，旧预览不能确认。请重新预览。</p>}
    </section>}
    <section className="rcCleanupRecovery" aria-label="清理操作恢复">
      <h4>原操作查询与继续</h4>
      <label>原清理操作 ID<input value={operationId} onChange={event=>setOperationId(event.target.value)}/></label>
      <div className="rcCleanupRecoveryActions">
        <button type="button" disabled={busy||!operationId} onClick={()=>void query()}>查询原清理任务</button>
        {pending&&pending.bindingVersion===bindingVersion&&!readOnly&&<button type="button" disabled={busy} onClick={()=>void resumeOriginal()}>继续原清理操作</button>}
        {pending&&<button type="button" disabled={busy} onClick={clearLocal}>结束本地等待</button>}
      </div>
      {pending&&<p role="status">待核对原操作：{pending.command.operationId}。操作 ID 已保存在此浏览器。</p>}
      {!!tasks.length&&<ul className="rcCleanupTasks">{tasks.map(task=><li key={task.operationId}><span>{task.operationId}：{phaseText[task.phase]}</span><button type="button" disabled={busy} onClick={()=>void query(task.operationId)}>读取这项清理任务</button></li>)}</ul>}
    </section>
    {progress&&<section className="rcCleanupProgress" aria-label="清理进度">
      <h3>清理进度</h3>
      <p>操作 {progress.operationId}：{phaseText[progress.phase]}。物理清理{progress.physical.complete?'已完成':'尚未完成'}。</p>
      {progress.error&&<p role="alert">清理停在 {progress.error}。原操作 ID 已保留，正文不会提前标记为已删除。</p>}
    </section>}
    {selected.length>0&&<aside className="rcCleanupSelectionBar" aria-label="已选清理来源" aria-live="polite">
      <p>已选择 {selected.length} 项</p>
      <ul>{selected.map(item=><li key={refKey(item)}>
        <button type="button" disabled={locked} aria-label={`移除${item.kindLabel}：${item.preview}`} onClick={()=>select(item,false)}>移除</button>
        <span><strong>{item.kindLabel}</strong>：{item.preview}</span>
      </li>)}</ul>
      <div className="rcCleanupSelectionActions">
        <button type="button" disabled={locked} onClick={()=>{setSelected([]);setPreview(null);}}>清空选择</button>
        <button type="button" className="rcPrimaryAction" disabled={locked} onClick={()=>void inspect()}>继续预览</button>
      </div>
    </aside>}
  </section>;
}
