import {RoleId,OperationId,InputKey,BindingVersion,HomeRevision} from '../home/ids.ts';
import { useEffect, useState } from 'react';
import type { Context } from '@deepseek-ai/cordis';
import type { InputListView, PanelInputRequest } from '../types.ts';

interface PendingInput { readonly roleId: RoleId; readonly request: PanelInputRequest; readonly queryOperationId?: OperationId; }
const storageKey = (roleId: RoleId) => 'dsh-role-companion:pending-input:v1:' + roleId;
function stored(roleId: RoleId): PendingInput | null {
    try {
        const item = JSON.parse(localStorage.getItem(storageKey(roleId)) || 'null') as PendingInput | null;
        return item?.roleId === roleId && typeof item.request?.text === 'string' && typeof item.request.clientRequestId === 'string' && typeof item.request.operationId === 'string' ? {...item,roleId:RoleId(item.roleId),...(item.queryOperationId?{queryOperationId:OperationId(item.queryOperationId)}:{}),request:{...item.request,operationId:OperationId(item.request.operationId),clientRequestId:InputKey(item.request.clientRequestId),expectedRoleId:RoleId(item.request.expectedRoleId),expectedBindingVersion:BindingVersion(item.request.expectedBindingVersion)}} : null;
    } catch { return null; }
}
export function InputPanel({ ctx, roleId, bindingVersion, revision, limit, onChanged }: { readonly ctx: Context; readonly roleId: RoleId; readonly bindingVersion: BindingVersion; readonly revision: HomeRevision; readonly limit: number; readonly onChanged: () => Promise<unknown>; }) {
    const [pending, setPending] = useState<PendingInput | null>(() => stored(roleId));
    const [history,setHistory]=useState(stored(roleId)?.request.contextPurpose==='history');
    const [text, setText] = useState(() => stored(roleId)?.request.text ?? '');
    const [list, setList] = useState<InputListView | null>(null);
    const [cursor, setCursor] = useState(0);
    const [busy, setBusy] = useState(false);
    const [rejected, setRejected] = useState(false);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    async function refresh() {
        try {
            const result = await ctx.remote.roleCompanion.readInputs(roleId, { afterSequence: cursor, limit: 4 });
            if (result.ok) setList(result.value);
            else setError(`待办读取失败（${result.error.code}）。已保存的来信不会因视图断开而撤销。`);
        } catch { setError('待办连接中断。可重新读取 Home 快照。'); }
    }
    useEffect(() => {
        let active = true;
        void ctx.remote.roleCompanion.readInputs(roleId, { afterSequence: cursor, limit: 4 }).then(result => {
            if (!active) return;
            if (result.ok) setList(result.value);
            else setError(`待办读取失败（${result.error.code}）。`);
        }).catch(() => { if (active) setError('待办连接中断。可重新读取。'); });
        return () => { active = false; };
    }, [ctx, roleId, revision, cursor]);
    function retain(item: PendingInput): boolean {
        try { localStorage.setItem(storageKey(roleId), JSON.stringify(item));setPending(item);return true; }
        catch { setError('无法保留原文与提交 ID，本次尚未提交。请检查浏览器存储后重试。');return false; }
    }
    function settled() {
        localStorage.removeItem(storageKey(roleId));setPending(null);setRejected(false);
    }
    async function run(item: PendingInput) {
        if (!retain(item)) return;
        setBusy(true);setError('');setRejected(false);
        try {
            const result = await ctx.remote.roleCompanion.submitInput(item.request);
            if (!result.ok) { setError(`提交结果待核对（${result.error.code}）。保留原文与原 ID，查询或按原内容重试。`);return; }
            const receipt = result.value;
            if (receipt.kind === 'uncertain') {
                retain({ ...item, queryOperationId: receipt.operationId });
                setError(receipt.operationId === item.request.operationId ? `本次提交结果待核对（IO_UNCERTAIN），需查询原操作 ${receipt.operationId}。请保留原请求。` : `本次来信 ${item.request.operationId} 尚未接纳，受待核对操作 ${receipt.operationId} 阻塞。本次原文与 ID 保留；查询阻塞操作不会接纳本次来信。`);
            } else if (receipt.kind === 'rejected') {
                setRejected(true);setError(`尚未接纳：${receipt.reason}（${receipt.errorCode || '无额外错误码'}）。原文未裁剪，可按原内容重试或编辑后重新提交。`);
            } else {
                settled();setText('');
                setNotice(`${receipt.kind === 'duplicate' ? '已找到原收据' : '已接纳，等待处理'}。inputId ${receipt.inputId}；操作 ${receipt.operationId}；接收序号 ${receipt.receiveSequence}；revision ${receipt.committedRevision}。`);
            }
            await refresh();await onChanged();
        } catch { setError('连接中断，接纳结果待核对。原文、clientRequestId 与 operationId 已保留；查询原操作或按原内容重试。'); }
        finally { setBusy(false); }
    }
    async function query() {
        if (!pending) return;
        setBusy(true);setError('');
        try {
            const operationId = pending.queryOperationId || pending.request.operationId;
            const result = await ctx.remote.roleCompanion.readOperation(operationId, pending.request.expectedRoleId);
            if (!result.ok) { setError(`原操作查询失败（${result.error.code}）。`);return; }
            const operation = result.value;
            setNotice(`操作 ${operation.operationId}：${operation.kind}；revision ${operation.committedRevision ?? '待核对'}。${operation.inputReceipt ? `inputId ${operation.inputReceipt.inputId}，queued。` : '尚无确定接纳收据，继续保留原请求。'}${operation.operationId !== pending.request.operationId ? ` 本次来信 ${pending.request.operationId} 尚未接纳，仍保留原请求。` : ''}`);
            if (operation.inputReceipt && operation.operationId === pending.request.operationId) { settled();setText(''); }
            await refresh();await onChanged();
        } catch { setError('原操作查询连接中断，请继续保留原请求。'); }
        finally { setBusy(false); }
    }
    const statuses = { queued: '已接纳，等待处理', running: '处理中', resolved: '已处理', cancelled: '已取消', blocked: '受阻' };
    return <section aria-label="面板来信与本地待办">
        <h3>面板来信与本地待办</h3>
        <p>来信保存在当前角色之家。原生文字对话按当前官方模型配置处理；完整回复单独保存并可查询。role_read 可读取本轮获准资料，role_file 在保护来源核对后操作获准文件，官方独立 Search/Fetch 可探索网页，role_propose 可保存有来源的知识或活动/联系提议；工具最终归档与提议采用分别核对。QQ 有效文字私聊核验连接后按原绑定回复，断线待办不阻挡面板来信。</p>
        {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
        <label>来信原文<textarea aria-label="来信原文" value={text} disabled={busy || !!pending} onChange={event => setText(event.target.value)}/></label>
        <label><input type="checkbox" aria-label="明确核对历史记录" checked={history} disabled={busy||!!pending} onChange={event=>setHistory(event.target.checked)}/>明确核对历史记录（保留当时范围与缺口，不恢复旧理解）</label>
        <p>正文 {new TextEncoder().encode(text).length} UTF-8 字节；当前上限 {limit} 字节。Home 按提交时的最新设置核对，超限整条拒绝。</p>
        <button disabled={busy || !!pending || !text.length} onClick={() => void run({ roleId, request: { text,...(history?{contextPurpose:'history' as const}:{}), clientRequestId: InputKey(crypto.randomUUID()), operationId: OperationId(crypto.randomUUID()), expectedRoleId: roleId, expectedBindingVersion: bindingVersion } })}>提交来信</button>
        {pending && <div><p>待核对来信操作：{pending.request.operationId}；输入键：{pending.request.clientRequestId}。原文与 ID 保留在此浏览器，刷新后仍可接续；关闭视图不会撤销提交。</p>
            <pre style={{whiteSpace:'pre-wrap'}}>{pending.request.text}</pre>
            <button disabled={busy} onClick={() => void query()}>查询原来信操作</button>
            <button disabled={busy} onClick={() => void run(pending)}>按原内容重试来信</button>
            {rejected && <button disabled={busy} onClick={() => { settled();setNotice('已结束确定拒绝的请求，原文保留在编辑框。'); }}>编辑被拒绝原文</button>}
        </div>}
        <button disabled={busy} onClick={() => void refresh()}>重新读取本地待办</button>
        {list?.uncertainOperationId && <p role="alert">操作 {list.uncertainOperationId} 的提交结果待核对。已看到的 queued 记录不替代确定接纳收据；新来信受阻，查询不会清除持久故障。</p>}
        {list && <p>共 {list.total} 条来信；本页读取接收序号 {list.afterSequence} 之后最多 {list.limit} 条完整原文。{list.more ? '还有下一页。' : '已到末页。'}</p>}
        {cursor > 0 && <button disabled={busy} onClick={() => setCursor(0)}>返回最早来信</button>}
        {list?.more && <button disabled={busy} onClick={() => setCursor(list.nextAfterSequence!)}>读取下一页原文</button>}
        {list && (list.inputs.length ? <ol>{list.inputs.map(input => <li key={input.inputId}>
            <p>#{input.receiveSequence} {list.uncertainOperationId === input.operationId ? '接纳结果待核对' : statuses[input.status]}；{input.blockedReason==='binding-changed'?'原 QQ 绑定已变更，来信保留原目标':input.blockedReason==='QQ_OFFLINE'?(input.status==='running'?'当前 QQ 连接尚未通过核验；已开始的处理继续收尾，后续发送仍须有效连接':'当前 QQ 连接尚未通过核验，来信保留原目标等待准入'):input.blockedReason || (input.processingUnavailableReason==='qq-replies-unavailable'?'QQ 来信已保存；等待有效连接与回复准入':input.processingUnavailableReason && list.processing === 'unavailable' ? '处理能力尚未就绪' : '')}</p>
            <dl><dt>来源</dt><dd>{input.origin==='history'?'经用户明确选择的 QQ 历史补查（非实时来信）':input.channel==='qq'?'QQ 实时来信':'角色面板来信'}</dd>{input.origin==='history'&&<><dt>提供方报告时间</dt><dd>{input.historySource?.reportedAt??'未知'}</dd></>}<dt>本次接纳时间</dt><dd>{input.receivedAt}</dd><dt>inputId</dt><dd>{input.inputId}</dd><dt>操作</dt><dd>{input.operationId}</dd><dt>接纳 revision</dt><dd>{input.committedRevision}</dd><dt>绑定版本</dt><dd>{input.bindingVersion}</dd>{input.channel==='qq'&&input.qqSource&&(input.status==='blocked'||!!input.blockedReason)&&<><dt>原机器人账号</dt><dd>{input.qqSource.accountId}</dd><dt>原好友账号</dt><dd>{input.qqSource.peerId}</dd></>}<dt>原文大小</dt><dd>{input.utf8Bytes} UTF-8 字节</dd></dl>
            <pre style={{whiteSpace:'pre-wrap'}}>{input.text}</pre>
        </li>)}</ol> : <p>当前角色之家尚无已接纳来信。</p>)}
    </section>;
}
