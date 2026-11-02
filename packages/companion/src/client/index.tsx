import {AutonomyPanel} from './autonomy-panel.tsx';
import {ProposalRulesPanel} from './proposal-rules-panel.tsx';
import {ContactPanel} from './contact-panel.tsx';
import {FileAccessPanel} from './file-access-panel.tsx';
import {FileRulesPanel} from './file-rules-panel.tsx';
import {QQHistoryPanel} from './qq-history-panel.tsx';
import {QQDeliveryPanel} from './qq-delivery-panel.tsx';
import {WebRulesPanel} from './web-rules-panel.tsx';
import {BackupPanel} from './backup-panel.tsx';
import {FormatPanel} from './format-panel.tsx';
import {RestorePanel,type RestorationActions} from './restore-panel.tsx';
import {RestoreConfirmationPanel,type RestoreConfirmationActions} from './restore-confirmation-panel.tsx';
import {HandoverPanel,type HandoverActions} from './handover-panel.tsx';
import {QQPanel} from './qq-panel.tsx';
import {StopPanel} from './stop-panel.tsx';
import {validateInputSettings} from '../home/settings.ts';
import {RetryRulesPanel} from './retry-rules-panel.tsx';
import {ReadRulesPanel} from './read-rules-panel.tsx';
import {RoleId,OperationId,HomeRevision,CoreVersion,InputSettingsVersion} from '../home/ids.ts';
import {ProfileSelectionVersion} from '../host-contracts.ts';
import {ConversationPanel} from './conversation-panel.tsx';
import {AutoUpdatePanel} from './auto-update.tsx';
import {RoleLibraryPage} from './library/page.tsx';
import { useEffect, useState, type ReactNode } from 'react';
import type { Context } from '@deepseek-ai/cordis';
import contribution from '../../lib/typert.remote-client.js';
import type {} from '@deepseek-ai/dsh-api-gateway/client';
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type {} from '@deepseek-ai/dsh-client-ui-settings/client';
import type { CompanionView } from '../types.ts';
import type { OwnerEditCommand, CreateHomeRequest } from '../home/index.ts';
import { InputPanel } from './input-panel.tsx';
import { installRoleCompanionStyles } from './styles.ts';
export const inject = ['slots', 'remote', 'pluginNavigation'];
type Pending = {
    kind: 'create';
    path: string;
    request: CreateHomeRequest;
    version: ProfileSelectionVersion;
} | {
    kind: 'attach';
    path: string;
    roleId: RoleId;
    operationId: OperationId;
    version: ProfileSelectionVersion;
} | {
    kind: 'edit';
    command: OwnerEditCommand;
    expectedRoleId: RoleId;
};
const pendingKey = 'dsh-role-companion:pending-owner-operation:v1';
const activeSectionKey = 'dsh-role-companion:active-section:v1';
type RoleSectionId = 'lifecycle' | 'role' | 'conversation' | 'rules';
const roleSectionIds: readonly RoleSectionId[] = ['lifecycle', 'role', 'conversation', 'rules'];
const isRoleSectionId=(value:unknown):value is RoleSectionId=>roleSectionIds.includes(value as RoleSectionId);
function storedSection(): RoleSectionId | null {
    try {
        const value = localStorage.getItem(activeSectionKey);
        return isRoleSectionId(value) ? value : null;
    }
    catch {
        return null;
    }
}
function RoleSection({id,title,description,open,onToggle,children}:{
    readonly id:RoleSectionId;
    readonly title:string;
    readonly description:string;
    readonly open:boolean;
    readonly onToggle:()=>void;
    readonly children:ReactNode;
}) {
    const titleId=`rc-${id}-title`,bodyId=`rc-${id}-body`;
    return <details className="rcGroup" id={`rc-${id}`} aria-labelledby={titleId} open={open}>
      <summary className="rcGroupHeader" onClick={event=>{event.preventDefault();onToggle();}}>
        <span className="rcGroupHeading">
          <span className="rcGroupTitle" id={titleId}>{title}</span>
          <span className="rcGroupDescription">{description}</span>
        </span>
      </summary>
      <div className="rcGroupBody" id={bodyId}>{children}</div>
    </details>;
}
function stored(): Pending | null { try {
    const item=JSON.parse(localStorage.getItem(pendingKey) || 'null') as Pending | null;
    if(!item)return null;
    if(item.kind==='create')return {...item,version:ProfileSelectionVersion(item.version),request:{...item.request,operationId:OperationId(item.request.operationId)}};
    if(item.kind==='attach')return {...item,roleId:RoleId(item.roleId),operationId:OperationId(item.operationId),version:ProfileSelectionVersion(item.version)};
    return {...item,expectedRoleId:RoleId(item.expectedRoleId),command:item.command.kind==='edit-core'?{...item.command,operationId:OperationId(item.command.operationId),expectedCoreVersion:CoreVersion(item.command.expectedCoreVersion),expectedRevision:HomeRevision(item.command.expectedRevision)}:{...item.command,operationId:OperationId(item.command.operationId),expectedSettingsVersion:InputSettingsVersion(item.command.expectedSettingsVersion),expectedRevision:HomeRevision(item.command.expectedRevision)}};
}
catch {
    return null;
} }
function maintenanceError(error:{readonly code:string;readonly details?:unknown}):Error{
    const details=error.details,code=details&&typeof details==='object'&&'reason'in details&&typeof details.reason==='string'?details.reason:error.code;
    return Object.assign(new Error(code),{code});
}
const roleReasonLabels:Readonly<Record<string,string>>={
    OFFICIAL_PROVIDER_CHANGED:'官方模型提供方配置已变化。请在 DSH 模型设置核对后重新启用插件。',
    OFFICIAL_ENDPOINT_REQUIRED:'当前模型没有使用官方 DeepSeek 端点。请在 DSH 模型设置中重新选择。',
    MODEL_CREDENTIAL_MISSING:'尚未配置官方模型凭据。请先在 DSH 模型设置中完成配置。',
    ROLE_STOPPING:'角色正在停稳，已有动作完成后会释放资源。',
    HOME_NOT_OPEN:'角色之家尚未打开。',
};
type RoleSurface = 'settings' | 'library';
function RolePanel({ ctx, surface }: {
    readonly ctx: Context;
    readonly surface: RoleSurface;
}) {
    const [view, setView] = useState<CompanionView | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [path, setPath] = useState('');
    const [identity, setIdentity] = useState('');
    const [core, setCore] = useState('');
    const [limit, setLimit] = useState('32768');
    const [pending, setPending] = useState<Pending | null>(stored);
    const [busy, setBusy] = useState(false);
    const [activeSection, setActiveSection] = useState<RoleSectionId | 'none'>(() => storedSection() ?? 'conversation');
    const operationId = (item: Pending) => item.kind === 'create' ? item.request.operationId : item.kind === 'attach' ? item.operationId : item.command.operationId;
    async function refresh() {
        try {
            const result = await ctx.remote.roleCompanion.inspect();
            if (result.ok) { setView(result.value); return result.value; }
            setError(`状态读取失败（${result.error.code}）。已取得的操作回执仍有效，可重新查询。`);
        } catch { setError('状态连接中断。已取得的操作回执仍有效，可重新查询。'); }
        return null;
    }

    useEffect(() => { let active = true; void ctx.remote.roleCompanion.inspect().then(result => { if (!active)
        return; if (result.ok)
        setView(result.value);
    else
        setError(`读取失败（${result.error.code}）。可重新查询。`); }).catch(() => { if (active)
        setError('连接中断，状态待核对。'); }); return () => { active = false; }; }, [ctx]);
    async function run(item: Pending) {
        setPending(item);
        try { localStorage.setItem(pendingKey, JSON.stringify(item)); } catch { setError('无法保留浏览器操作记录，本次尚未提交。请检查浏览器存储后重试。'); return; }
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = item.kind === 'create' ? await ctx.remote.roleCompanion.createHome(item.path, {...item.request,settings:{...item.request.settings}}, item.version) : item.kind === 'attach' ? await ctx.remote.roleCompanion.attachHome(item.path, item.roleId, item.operationId, item.version) : await ctx.remote.roleCompanion.applyOwner(item.command.kind==='edit-settings'?{...item.command,settings:{...item.command.settings}}:item.command, item.expectedRoleId);
            if (!result.ok) {
                const details = result.error.details as {
                    reason?: string;
                } | undefined;
                setError(`操作未完成（${details?.reason || result.error.code}）。保留原操作；先查询结果或按原内容重试。`);
                return;
            }
            const receipt = result.value;
            if ('registration' in receipt && receipt.registration !== 'registered') {
                setNotice(`角色之家已保存，${receipt.registration === 'uncertain' ? '登记结果待核对' : '尚未登记'}（${receipt.errorCode || 'unknown'}）。请保留原路径和操作 ID，使用原操作接续。`);
            }
            else if ('kind' in receipt && receipt.kind === 'unavailable') {
                setError(`操作不可用：${receipt.reason}`);
            }
            else {
                setNotice('kind' in receipt && receipt.kind === 'committed' && receipt.projection === 'diff' ? '已保存。检测到手工投影差异，已保留原文件。' : '已保存。可持久接纳面板来信；原生文字对话按当前模型配置准入；role_read 仅查询获准资料，网页只走官方独立 Search/Fetch，QQ 指定好友完整文字按原绑定回复。');
                localStorage.removeItem(pendingKey);
                setPending(null);
            }
            await refresh();
        }
        catch {
            setError('连接中断，提交结果待核对。取消等待不会撤销已提交操作；先查询原操作。');
        }
        finally {
            setBusy(false);
        }
    }
    function inputLimitValue():number|undefined {setNotice('');if(!limit.trim()){setError('输入正文上限不能为空。');return;}const value=Number(limit);if(!validateInputSettings({inputLimitBytes:value})){setError('输入正文上限必须为 1 至 1048576 的整数 UTF-8 字节。');return;}return value;}
    function toggleSection(section:RoleSectionId,open:boolean) {
        const next=open?'none':section;
        setActiveSection(next);
        try { if(next==='none')localStorage.removeItem(activeSectionKey);else localStorage.setItem(activeSectionKey,next); }
        catch {}
        if(next!=='none'&&typeof document!=='undefined')requestAnimationFrame(()=>document.getElementById(`rc-${section}`)?.scrollIntoView({block:'start'}));
    }
    function attach() {try {void run({kind:'attach',path,roleId:RoleId(identity),operationId:OperationId(crypto.randomUUID()),version:view!.bootstrap.version});}catch {setError('角色 ID 格式无效，请核对原 Home 的身份。');}}
    async function query() { if (!pending)
        return; setBusy(true); try {
        const current = await refresh();
        const expectedRoleId = pending.kind === 'edit' ? pending.expectedRoleId : pending.kind === 'attach' ? pending.roleId : current?.role.home?.creationOperationId === pending.request.operationId ? current.role.roleId : null;
        if (!expectedRoleId) { setError('原操作所属角色尚未核对，或当前已切换角色。保留原请求，请先重新接入原角色之家。');return; }
        const result = await ctx.remote.roleCompanion.readOperation(operationId(pending), expectedRoleId);
        if (result.ok) {
            const op = result.value;
            setNotice(`原操作 ${op.operationId}：${op.kind}，阶段 ${op.stage || '尚无已知提交'}，revision ${op.committedRevision ?? '待核对'}。`);
            await refresh();
        }
        else
            setError(`查询失败（${result.error.code}）。`);
    }
    catch {
        setError('查询连接中断，原操作仍待核对。');
    }
    finally {
        setBusy(false);
    } }
    if (!view)
        return <section className="rcPanel rcLoading" aria-label={surface==='library'?'角色资料库':'角色面板'} data-role-surface={surface}><p role="alert">{error}</p><p>正在读取角色状态…</p><button onClick={() => void refresh()}>重新查询</button></section>;
    const home = view.role.home;
    const readOnly=view.role.status==='read-only';
    const editable=!readOnly&&view.role.status!=='stopping'&&view.role.status!=='stopped'&&!view.role.backups?.some(record=>record.checkpoint!=='verified');
    const readable=editable||readOnly;
    const availableSections=[
        'lifecycle' as const,
        ...(view.role.status!=='read-only'?['role' as const]:[]),
        ...(home&&readable?['conversation' as const]:[]),
        ...(home&&readable?['rules' as const]:[]),
    ];
    const defaultSection=availableSections.includes('conversation')?'conversation':availableSections.includes('role')?'role':availableSections[0]??null;
    const visibleSection=activeSection==='none'?null:availableSections.includes(activeSection)?activeSection:defaultSection;
    if (surface === 'library') return <RoleLibraryPage ctx={ctx} view={view} refresh={refresh} error={error} notice={notice}/>;
    const restoreActions:RestorationActions={
        async requestRestore(request,expectedProfileVersion){const result=await ctx.remote.roleCompanion.requestRestore(request,expectedProfileVersion);if(!result.ok)throw maintenanceError(result.error);return result.value;},
        async readRestore(destination,request){const result=await ctx.remote.roleCompanion.readRestore(destination,request);if(!result.ok)throw maintenanceError(result.error);return result.value;}
    };
    const handoverActions:HandoverActions={
        async requestHandover(roleId,request){const result=await ctx.remote.roleCompanion.requestHandover(roleId,request);if(!result.ok)throw maintenanceError(result.error);return result.value;},
        async readHandover(roleId,operationId){const result=await ctx.remote.roleCompanion.readHandover(roleId,operationId);if(!result.ok)throw maintenanceError(result.error);return result.value;}
    };
    const confirmationActions:RestoreConfirmationActions={async confirmRestore(roleId,request,profileVersion){const result=await ctx.remote.roleCompanion.confirmRestore(roleId,{...request},profileVersion);if(!result.ok)throw maintenanceError(result.error);return result.value;}};
    const roleState = home && view.role.status === 'ready'
        ? {label: '原生对话已就绪', tone: 'success'}
        : readOnly
            ? {label: '当前为只读副本', tone: 'warning'}
            : view.role.status === 'stopping' || view.role.status === 'stopped'
                ? {label: '角色已停止', tone: 'warning'}
                : home
                    ? {label: '运行状态待核对', tone: 'danger'}
                    : {label: '等待配置', tone: 'neutral'};
    const qqState = !view.qq || view.qq.bindingVersion === 0
        ? '未绑定'
        : view.qq.transport.phase === 'ready'
            ? '已连接'
            : view.qq.transport.phase === 'connecting' || view.qq.transport.phase === 'checking'
                ? '连接中'
                : view.qq.transport.phase === 'disabled'
                    ? '未启用'
                    : '待核对';
    return <section className="rcPanel" aria-label="角色面板" data-role-surface={surface}>
    <header className="rcHeader">
      <div className="rcHeaderCopy">
        <span className="rcEyebrow">DSH 角色伙伴</span>
        <div className="rcTitleRow"><h2>角色配置</h2><span className="rcStatus" data-tone={roleState.tone}>{roleState.label}</span></div>
        <p className="rcSubtitle">统一管理角色之家、对话连接与运行规则。</p>
        {view.role.status !== 'ready' && <p className="rcStatusDetail">{home ? roleReasonLabels[view.role.reason] ?? view.role.reason : '绑定角色之家后即可开始配置。'}</p>}
      </div>
      <div className="rcHeaderActions">
        {surface === 'settings' && <button type="button" onClick={() => ctx.pluginNavigation.openBundle('dsh-role-companion')}>打开完整资料库</button>}
        <button className="rcRefreshButton" disabled={busy} onClick={() => void refresh()}>刷新状态</button>
      </div>
    </header>
    <dl className="rcMetrics">
      <div className="rcMetric"><dt>角色之家</dt><dd>{home ? '已打开' : '未配置'}</dd></div>
      <div className="rcMetric"><dt>原生对话</dt><dd>{home && view.role.status === 'ready' ? '可用' : readOnly ? '只读' : view.role.status === 'stopping' ? '停稳中' : view.role.status === 'stopped' ? '已停止' : '待核对'}</dd></div>
      <div className="rcMetric"><dt>QQ 通道</dt><dd>{qqState}</dd></div>
      <div className="rcMetric"><dt>Home revision</dt><dd>{view.role.revision ?? '无'}</dd></div>
      <div className="rcMetric"><dt>插件版本</dt><dd>{view.packageVersion}</dd></div>
    </dl>
    <details className="rcTechnical">
      <summary>安装与运行信息</summary>
      <div className="rcTechnicalBody">
        <dl>
          <dt>安装</dt><dd>{view.installed ? '已安装' : '未安装'} · {view.enabled === null ? '尚未取得装载清单' : view.enabled ? '已启用' : '未启用'}</dd>
          <dt>Host</dt><dd>{view.fiberPhase ?? '尚未取得阶段'} · 目标 DSH {view.requiredDsh}</dd>
          <dt>角色 ID</dt><dd>{view.role.roleId || '尚未创建或接入'}</dd>
          <dt>profile 引导版本</dt><dd>{view.bootstrap.version}</dd>
        </dl>
        {view.role.execution && <p>模型配置：{view.role.execution.reason}；凭据引用 {view.role.execution.credential?.ref||'尚未核对'}，{view.role.execution.credential?.configured?'已配置':'未配置'}。凭据在 DSH 原有模型与凭据设置中管理。</p>}
      </div>
    </details>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {readOnly&&<p role="status">当前副本只读：可查询原记录、来源和知识；单活交接完成前不接纳来信、不修改规则，也不重试归档或发送。</p>}
    {pending && <div className="rcPending"><p>待核对操作：{operationId(pending)}。原请求保留在此浏览器，刷新后可继续。</p><button disabled={busy} onClick={() => void query()}>查询原操作</button><button disabled={busy||readOnly} onClick={() => void run(pending)}>按原内容重试</button><button disabled={busy} onClick={() => { localStorage.removeItem(pendingKey); setPending(null); setNotice('已清除浏览器中的等待记录；不会回滚 Home。'); }}>结束本地等待</button></div>}
    <nav className="rcSectionNav" aria-label="角色配置分区">
      <button type="button" aria-expanded={visibleSection==='lifecycle'} aria-controls="rc-lifecycle-body" onClick={() => toggleSection('lifecycle',visibleSection==='lifecycle')}>生命周期</button>
      {view.role.status !== 'read-only' && <button type="button" aria-expanded={visibleSection==='role'} aria-controls="rc-role-body" onClick={() => toggleSection('role',visibleSection==='role')}>角色基础</button>}
      {home && readable && <button type="button" aria-expanded={visibleSection==='conversation'} aria-controls="rc-conversation-body" onClick={() => toggleSection('conversation',visibleSection==='conversation')}>对话连接</button>}
      {home && readable && <button type="button" aria-expanded={visibleSection==='rules'} aria-controls="rc-rules-body" onClick={() => toggleSection('rules',visibleSection==='rules')}>运行规则</button>}
    </nav>
    <div id="rc-section-content">
    <RoleSection id="lifecycle" title="生命周期与迁移" description="备份、恢复、交接、格式与停止。" open={visibleSection==='lifecycle'} onToggle={() => toggleSection('lifecycle',visibleSection==='lifecycle')}>
        <AutoUpdatePanel ctx={ctx}/>
        {(!view.bootstrap.path||readOnly||view.restoration)&&<RestorePanel key="restore" actions={restoreActions} profileVersion={view.bootstrap.version} restoration={view.restoration} restorationRequest={view.restorationRequest} canCreate={!view.bootstrap.path} onChanged={refresh}/>}
        {view.restoration&&view.restorationRequest&&<RestoreConfirmationPanel key={view.restorationRequest.request.operationId+':confirm'} actions={confirmationActions} restoration={view.restoration} original={view.restorationRequest} handover={view.restorationHandover} acceptance={view.restorationAcceptance} registered={view.bootstrap.path===view.restoration.destination&&view.bootstrap.roleId===view.restoration.roleId} roleStatus={view.role.status} onChanged={refresh}/>}
        {view.bootstrap.path&&home&&<HandoverPanel key={home.roleId+':handover'} actions={handoverActions} roleId={home.roleId} revision={home.revision} canStart={editable} onChanged={refresh}/>}
        {(view.role.roleId||view.role.backups?.[0]?.roleId)&&<BackupPanel key={(view.role.roleId??view.role.backups?.[0]?.roleId)+':backup'} ctx={ctx} view={view.role} onChanged={refresh}/>}
        {view.role.format&&<FormatPanel key={(view.role.roleId??'format')+':format'} ctx={ctx} view={view.role} onChanged={refresh}/>}
        {home && <StopPanel ctx={ctx} view={view.role} onChanged={refresh}/>}
    </RoleSection>
    {view.role.status !== 'read-only' && <RoleSection id="role" title="角色基础" description="角色身份、核心设定与输入边界。" open={visibleSection==='role'} onToggle={() => toggleSection('role',visibleSection==='role')}>
        {!home ? <fieldset disabled={busy || !!pending}><legend>创建或接入角色之家</legend>
          <label>Home 绝对路径<input aria-label="Home 绝对路径" value={path} onChange={e => setPath(e.target.value)}/></label>
          <label>初始核心设定<textarea aria-label="初始核心设定" value={core} onChange={e => setCore(e.target.value)}/></label>
          <label>输入正文上限（UTF-8 字节）<input type="number" min="1" max="1048576" value={limit} onChange={e => setLimit(e.target.value)}/></label>
          <button onClick={() => {const inputLimitBytes=inputLimitValue();if(inputLimitBytes===undefined)return;void run({ kind: 'create', path, version: view.bootstrap.version, request: { operationId: OperationId(crypto.randomUUID()), core, settings: { inputLimitBytes } } });}}>创建并登记</button>
          <label>已有角色 ID<input aria-label="已有角色 ID" value={identity} onChange={e => setIdentity(e.target.value)}/></label>
          <button onClick={attach}>校验并接入已有 Home</button>
          <p>创建先保存资料，再登记 profile。接入只读取既有身份和设定，不初始化覆盖。迁移副本前必须先停稳旧实例并完成单活交接。</p>
        </fieldset> : <fieldset disabled={busy || !!pending || !editable}><legend>核心与初始设定</legend>
          <p>核心版本 {home.core.version}，设置版本 {home.settings.version}；上下文代 {home.contextGeneration}。文本投影状态：{home.projection}。</p>
          <p>当前核心：{home.core.text}</p><label>新核心设定<textarea aria-label="新核心设定" value={core} onChange={e => setCore(e.target.value)}/></label>
          <button onClick={() => void run({ kind: 'edit', expectedRoleId: home.roleId, command: { kind: 'edit-core', operationId: OperationId(crypto.randomUUID()), text: core, expectedCoreVersion: home.core.version, expectedRevision: home.revision } })}>保存核心新版本</button>
          <p>当前输入正文上限：{home.settings.value.inputLimitBytes} UTF-8 字节。面板接纳时消费最新持久设置，超限整条拒绝。</p>
          <label>新输入上限（UTF-8 字节）<input aria-label="新输入上限" type="number" min="1" max="1048576" value={limit} onChange={e => setLimit(e.target.value)}/></label>
          <button onClick={() => {const inputLimitBytes=inputLimitValue();if(inputLimitBytes===undefined)return;void run({ kind: 'edit', expectedRoleId: home.roleId, command: { kind: 'edit-settings', operationId: OperationId(crypto.randomUUID()), settings: { inputLimitBytes }, expectedSettingsVersion: home.settings.version, expectedRevision: home.revision } });}}>保存设置新版本</button>
        </fieldset>}
    </RoleSection>}
    {home && readable && <RoleSection id="conversation" title="对话与连接" description="面板来信、原生对话与 QQ 收发。" open={visibleSection==='conversation'} onToggle={() => toggleSection('conversation',visibleSection==='conversation')}>
        {readable && <QQDeliveryPanel readOnly={readOnly} key={home.roleId+':qq-delivery'} ctx={ctx} roleId={home.roleId} bindingVersion={view.qq?.bindingVersion??0} revision={home.revision} onChanged={refresh}/>}
        {editable && <QQHistoryPanel key={home.roleId+':qq-history'} ctx={ctx} roleId={home.roleId} bindingVersion={view.qq?.bindingVersion??0} revision={home.revision} onChanged={refresh}/>}
        {editable && <QQPanel key={home.roleId+':qq'} ctx={ctx} roleId={home.roleId} bindingVersion={view.qq?.bindingVersion??0} revision={home.revision} onChanged={refresh}/>}
        {readOnly&&view.restoration&&(view.qq?.bindingVersion??0)>0&&<QQPanel key={home.roleId+':restore-qq'} restoreOnly ctx={ctx} roleId={home.roleId} bindingVersion={view.qq?.bindingVersion??0} revision={home.revision} onChanged={refresh}/>}
        {editable && <InputPanel key={home.roleId} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} limit={home.settings.value.inputLimitBytes} onChanged={refresh}/>}
        {readable && <ConversationPanel readOnly={readOnly} qqBindingVersion={view.qq?.bindingVersion??0} key={home.roleId+':'+home.panelBinding.bindingVersion} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} onChanged={refresh}/>}
    </RoleSection>}
    {home && readable && <RoleSection id="rules" title="运行规则" description="自主、联系、网页、文件与工具边界。" open={visibleSection==='rules'} onToggle={() => toggleSection('rules',visibleSection==='rules')}>
        {readable && <AutonomyPanel readOnly={readOnly} key={home.roleId+':'+home.panelBinding.bindingVersion+':autonomy'} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} onChanged={refresh}/>}
        {readable && <ContactPanel readOnly={readOnly} key={home.roleId+':'+home.panelBinding.bindingVersion+':contact'} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} onChanged={refresh}/>}
        {editable && <ProposalRulesPanel key={home.roleId+':'+home.panelBinding.bindingVersion+':proposal-rules'} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} onChanged={refresh}/>}
        {editable && <RetryRulesPanel key={home.roleId+':'+home.panelBinding.bindingVersion+':retry-rules'} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} onChanged={refresh}/>}
        {editable && <WebRulesPanel key={home.roleId+':'+home.panelBinding.bindingVersion+':web-rules'} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} onChanged={refresh}/>}
        {editable && <ReadRulesPanel key={home.roleId+':'+home.panelBinding.bindingVersion+':read-rules'} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} onChanged={refresh}/>}
        {editable && <FileAccessPanel key={home.roleId+':'+home.panelBinding.bindingVersion+':file-access'} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} onChanged={refresh}/> }
        {editable && <FileRulesPanel key={home.roleId+':'+home.panelBinding.bindingVersion+':file-rules'} ctx={ctx} roleId={home.roleId} bindingVersion={home.panelBinding.bindingVersion} revision={home.revision} onChanged={refresh}/>}
    </RoleSection>}
    </div>
    <button className="rcFooterAction" disabled={busy} onClick={() => void refresh()}>刷新状态</button>
    <p>面板来信固定绑定当前角色。经历采用本地词法检索，知识提议与版本核对已启用；单次自主机会可在自主活动区域接纳；主动联系的规则、意图与派生用量见“主动联系”区域，真实主动发送仍需结构化提议与全部准入。外部目录须先保存 Home grant 权限与本机物理映射。网页只走官方独立 API，QQ 指定好友完整文字按原绑定回复。role_read 只读取获准资料；角色没有修改核心与规则的工具能力。</p>
    <p>普通 DSH 会话不自动归入角色。关闭面板只关闭视图，不暂停或停止 Host。</p>
  </section>;
}
export async function apply(ctx: Context): Promise<void> {
    installRoleCompanionStyles();
    await ctx.remote.$mount(contribution);
    ctx.inject(['remote.roleCompanion'], consumer => {
        consumer.slots.inject('plugins.bundle.config', () => consumer.slots.register({ name: 'plugins.bundle.config', key: 'dsh-role-companion' }, ({ view }) => view === 'summary' ? '角色资料库：概览、来源、知识、执行记录与维护' : <RolePanel ctx={consumer} surface="library"/>));
        consumer.slots.inject('settings.section', () => consumer.slots.register({
            name: 'settings.section',
            id: 'dsh-role-companion',
            order: 23,
            label: 'DSH 角色伙伴',
        }, () => <RolePanel ctx={consumer} surface="settings"/>));
    });
}
