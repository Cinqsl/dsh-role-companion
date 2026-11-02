import type {AttemptRecord, ConversationSnapshot, NativeRecord} from '../home/turns.ts';
import type {PanelBinding} from '../home/inputs.ts';
import type {QQBinding} from '../home/qq.ts';
import type {HomeSnapshot, OpenedRoleHome} from '../home/index.ts';
import type {
    AttemptId,
    BindingVersion,
    HomeRevision,
    MaterialId,
    NativeRecordRef,
    RoleId,
} from '../home/ids.ts';
import type {
    NativeRecordSummary,
    ToolAttemptSummary,
    ToolFinalSummary,
} from '../types.ts';
import type {
    ExecutionLibraryItem,
    ExecutionLibraryPage,
    ExecutionLibraryQuery,
    ExecutionLibraryDetail,
    ExecutionLibraryDetailRequest,
    ExecutionLibraryPart,
    ExecutionLibraryPartRequest,
    ExecutionLibrarySection,
    ExecutionLibrarySectionField,
} from '../types.library.executions.ts';
import {plainExact} from '../home/qq.ts';
import {HomeError} from '../home/errors.ts';
import {createHash} from 'node:crypto';

const objectValue = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);
const field = (value: unknown, key: string): unknown =>
    objectValue(value) ? value[key] : undefined;
export const viewCode = (value: unknown, fallback = ''): string =>
    typeof value === 'string' && /^[A-Z][A-Z0-9_]{1,63}$/.test(value) ? value : fallback;
const viewClosure = (value: unknown): NativeRecordSummary['closure'] =>
    value === 'before-dispatch' || value === 'recovery-not-started' || value === 'recovery-unknown'
        ? value
        : 'unknown';
const toolNames = new Set(['all', 'role_read', 'role_file', 'role_web_search', 'role_web_fetch', 'role_propose', 'unknown']);
const results = new Set(['all', 'success', 'error', 'pending', 'unavailable', 'gap', 'synthetic', 'recorded', 'refused']);
const sectionFields = new Set<ExecutionLibrarySectionField>(['request', 'observation', 'final', 'native', 'raw', 'material']);
const dateValue = (value: string | null): number | null => {
    if (value === null) return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const searchableItem = (item: ExecutionLibraryItem): string => [
    item.typeLabel,
    item.name,
    item.summary,
    item.result,
    item.statusLabel,
    item.channel,
    item.runId,
    item.tool?.observation.code ?? '',
    item.tool?.final.code ?? '',
    item.native?.code ?? '',
].join('\n').toLocaleLowerCase();

export function validateExecutionLibraryQuery(value: unknown): asserts value is ExecutionLibraryQuery {
    if (!plainExact(value, ['collection', 'keyword', 'toolName', 'result', 'channel', 'from', 'to', 'sort', 'offset', 'limit', 'expectedRevision'])) {
        throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    }
    if (value.collection !== 'tools' && value.collection !== 'native') throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    if (typeof value.keyword !== 'string' || value.keyword.length > 256) throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    if (typeof value.toolName !== 'string' || !toolNames.has(value.toolName)) throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    if (typeof value.result !== 'string' || !results.has(value.result)) throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    if (value.channel !== 'all' && value.channel !== 'panel' && value.channel !== 'qq') throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    if (value.sort !== 'newest' && value.sort !== 'oldest') throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    if (!Number.isSafeInteger(value.offset) || Number(value.offset) < 0) throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    if (value.limit !== 20 && value.limit !== 50) throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    if (value.expectedRevision !== null && (!Number.isSafeInteger(value.expectedRevision) || Number(value.expectedRevision) < 0)) {
        throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    }
    if (value.from !== null && (typeof value.from !== 'string' || dateValue(value.from) === null)) {
        throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    }
    if (value.to !== null && (typeof value.to !== 'string' || dateValue(value.to) === null)) {
        throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    }
    if (typeof value.from === 'string' && typeof value.to === 'string' && Date.parse(value.from) > Date.parse(value.to)) {
        throw new HomeError('INVALID_EXECUTION_LIBRARY_PAGE');
    }
}

function validRevision(value: unknown): value is HomeRevision {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function validateExecutionLibraryDetailRequest(value: unknown): asserts value is ExecutionLibraryDetailRequest {
    if (!plainExact(value, ['collection', 'recordId', 'expectedRevision'])) throw new HomeError('INVALID_EXECUTION_LIBRARY_DETAIL');
    if (value.collection !== 'tools' && value.collection !== 'native') throw new HomeError('INVALID_EXECUTION_LIBRARY_DETAIL');
    if (typeof value.recordId !== 'string' || value.recordId.length < 1 || value.recordId.length > 512) throw new HomeError('INVALID_EXECUTION_LIBRARY_DETAIL');
    if (!validRevision(value.expectedRevision)) throw new HomeError('INVALID_EXECUTION_LIBRARY_DETAIL');
}

export function validateExecutionLibraryPartRequest(value: unknown): asserts value is ExecutionLibraryPartRequest {
    if (!plainExact(value, ['collection', 'recordId', 'field', 'materialId', 'offset', 'limit', 'expectedRevision', 'expectedContentDigest'])) {
        throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    }
    if (value.collection !== 'tools' && value.collection !== 'native') throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    if (typeof value.recordId !== 'string' || value.recordId.length < 1 || value.recordId.length > 512) throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    if (typeof value.field !== 'string' || !sectionFields.has(value.field as ExecutionLibrarySectionField)) throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    if (value.materialId !== null && (typeof value.materialId !== 'string' || !/^material-[0-9a-f-]{36}$/.test(value.materialId))) throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    if (!Number.isSafeInteger(value.offset) || Number(value.offset) < 0) throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    if (!Number.isSafeInteger(value.limit) || Number(value.limit) < 1 || Number(value.limit) > 16384) throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    if (!validRevision(value.expectedRevision)) throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    if (typeof value.expectedContentDigest !== 'string' || !/^[a-f0-9]{64}$/.test(value.expectedContentDigest)) throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    if (value.field === 'material' ? value.materialId === null : value.materialId !== null) throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
}

function toolFinalSummary(candidate: unknown, settled: boolean, code: unknown, closure?: unknown): ToolFinalSummary {
    const content = field(candidate, 'content');
    if (field(candidate, 'provenance') === 'synthetic-native' || field(candidate, 'canonicalValue') === 'unavailable') {
        return {
            provenance: 'synthetic-native',
            closure: viewClosure(field(closure, 'kind')),
            status: 'unavailable',
            code: viewCode(field(field(candidate, 'error'), 'code'), viewCode(code)),
            value: 'unavailable',
            contentBlocks: Array.isArray(content) ? content.length : null,
            metaSaved: false,
        };
    }
    if (
        objectValue(candidate)
        && Array.isArray(candidate.content)
        && ((candidate.isError === false && Object.hasOwn(candidate, 'value')) || (candidate.isError === true && objectValue(candidate.error)))
    ) {
        return {
            provenance: 'tools-result',
            closure: null,
            status: candidate.isError ? 'error' : 'success',
            code: candidate.isError
                ? viewCode(field(field(candidate.error, 'info'), 'code'), viewCode(code, 'TOOL_FAILED'))
                : '',
            value: candidate.isError ? 'not-applicable' : 'saved',
            contentBlocks: candidate.content.length,
            metaSaved: Object.hasOwn(candidate, 'meta'),
        };
    }
    return {
        provenance: 'unavailable',
        closure: null,
        status: settled ? 'unavailable' : 'pending',
        code: viewCode(code),
        value: 'unavailable',
        contentBlocks: null,
        metaSaved: false,
    };
}

export function toolAttemptSummary(attempt: AttemptRecord, nativeRecords: readonly NativeRecord[]): ToolAttemptSummary {
    const final = toolFinalSummary(
        field(field(attempt.outcome?.data, 'result'), 'final'),
        !!attempt.outcome,
        attempt.outcome?.code,
        field(field(attempt.outcome?.data, 'result'), 'closure'),
    );
    const materials = attempt.materials ?? [];
    const candidateName = field(field(attempt.outcome?.data, 'request'), 'name');
    const name = candidateName === 'role_propose'
        || candidateName === 'role_file'
        || candidateName === 'role_read'
        || candidateName === 'role_web_search'
        || candidateName === 'role_web_fetch'
        ? candidateName
        : 'unknown';
    const gap = final.status === 'unavailable' || nativeRecords.some(record => {
        const kind = field(record.data, 'kind');
        return record.runId === attempt.runId
            && field(record.data, 'attemptId') === attempt.attemptId
            && (kind === 'sdk-spill-gap' || kind === 'native-exposure-gap' || kind === 'file-effect-gap');
    });
    return {
        name,
        observation: {
            status: attempt.observation?.kind ?? 'not-recorded',
            code: attempt.observation?.kind === 'threw' ? viewCode(attempt.observation.code, 'RECORDED_ERROR') : '',
            observedAt: attempt.observation?.observedAt ?? null,
        },
        final,
        gap,
        materials: materials.slice(0, 4).map(({materialId, source, bytes, digest}) => ({materialId, source, bytes, digest})),
        materialCount: materials.length,
        materialsMore: materials.length > 4,
    };
}

export function nativeRecordSummary(record: NativeRecord): NativeRecordSummary {
    const data = record.data;
    const closure = field(data, 'closure');
    const kind = field(data, 'kind');
    const empty: NativeRecordSummary = {
        kind: 'other',
        status: 'recorded',
        code: '',
        canonicalValue: 'unavailable',
        closure: null,
        gapKind: null,
        artifactCount: 0,
        knownArtifactBytes: null,
    };
    if (field(closure, 'provenance') === 'synthetic') {
        const error = field(field(data, 'data'), 'error');
        return {
            ...empty,
            kind: 'synthetic-closure',
            status: 'synthetic',
            code: viewCode(field(error, 'code'), viewCode(field(field(error, 'info'), 'code'))),
            closure: viewClosure(field(closure, 'kind')),
        };
    }
    if (kind === 'sdk-spill-gap' || kind === 'native-exposure-gap' || kind === 'file-effect-gap') {
        const artifacts = field(data, 'artifacts');
        let bytes: number | null = null;
        if (Array.isArray(artifacts)) {
            bytes = 0;
            for (const artifact of artifacts) {
                const count = field(artifact, 'bytes');
                if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(bytes + count)) {
                    bytes = null;
                    break;
                }
                bytes += count;
            }
        }
        return {
            ...empty,
            kind: 'gap',
            status: 'gap',
            gapKind: kind,
            code: viewCode(field(data, 'reason'), 'RECORDED_GAP'),
            artifactCount: Array.isArray(artifacts) ? artifacts.length : 0,
            knownArtifactBytes: bytes,
        };
    }
    if (record.provenance === 'tools-result') {
        const final = toolFinalSummary(field(data, 'result'), true, undefined);
        if (final.status === 'success' || final.status === 'error') {
            return {...empty, kind: 'canonical-tool-result', status: final.status, code: final.code, canonicalValue: final.value};
        }
    }
    const type = field(data, 'type');
    return {...empty, kind: type === 'tool/call' ? 'tool-call' : type === 'tool/result' ? 'tool-result' : 'other'};
}

function channelFor(
    snapshot: ConversationSnapshot,
    runId: string,
    panelBinding: PanelBinding,
    qqBinding: QQBinding | null,
): {readonly channel: 'panel' | 'qq'; readonly version: BindingVersion} | null {
    const turn = snapshot.turns.find(candidate => candidate.runId === runId);
    if (!turn) return null;
    if (turn.bindingId === panelBinding.bindingId && turn.bindingVersion === panelBinding.bindingVersion) {
        return {channel: 'panel', version: panelBinding.bindingVersion};
    }
    if (qqBinding && turn.bindingId === qqBinding.bindingId && turn.bindingVersion === qqBinding.version) {
        return {channel: 'qq', version: qqBinding.version};
    }
    return null;
}

function toolTime(attempt: AttemptRecord): {readonly occurredAt: string; readonly basis: ExecutionLibraryItem['timeBasis']} {
    if (attempt.observation?.observedAt) return {occurredAt: attempt.observation.observedAt, basis: 'tool-observed'};
    return {occurredAt: attempt.enteredAt ?? attempt.reservedAt, basis: 'tool-reserved'};
}

function nativeName(record: NativeRecord, summary: NativeRecordSummary): string {
    const name = field(record.data, 'name');
    if (typeof name === 'string' && /^[a-z][a-z0-9_]{0,63}$/.test(name)) return name;
    if (summary.kind === 'gap') {
        return summary.gapKind === 'sdk-spill-gap'
            ? 'SDK 外置资料归属缺口'
            : summary.gapKind === 'file-effect-gap'
                ? '文件修改结果不明'
                : '原生经历缺口';
    }
    if (summary.kind === 'synthetic-closure') return '原生合成闭合';
    if (summary.kind === 'canonical-tool-result') return '工具最终结果';
    if (summary.kind === 'tool-call') return '工具调用';
    if (summary.kind === 'tool-result') return '工具展示事件';
    return record.provenance === 'host-denial' ? '原生拒绝' : '原生记录';
}

function toolItem(
    attempt: AttemptRecord,
    snapshot: ConversationSnapshot,
    panelBinding: PanelBinding,
    qqBinding: QQBinding | null,
): ExecutionLibraryItem | null {
    const channel = channelFor(snapshot, attempt.runId, panelBinding, qqBinding);
    if (!channel) return null;
    const tool = toolAttemptSummary(attempt, snapshot.nativeRecords);
    const time = toolTime(attempt);
    const observed = tool.observation.status === 'returned'
        ? '观察已返回'
        : tool.observation.status === 'threw'
            ? '观察已抛错'
            : '尚无观察';
    const final = tool.final.status === 'success'
        ? '最终规范成功'
        : tool.final.status === 'error'
            ? '最终规范错误'
            : tool.final.status === 'pending'
                ? '最终结果待保存'
                : '最终规范结果不可用';
    return {
        collection: 'tools',
        recordId: attempt.attemptId,
        runId: attempt.runId,
        channel: channel.channel,
        channelBindingVersion: channel.version,
        occurredAt: time.occurredAt,
        timeBasis: time.basis,
        typeLabel: '工具执行',
        name: tool.name === 'unknown' ? '受控工具' : tool.name,
        summary: `${observed}；${final}`,
        result: tool.final.status,
        statusLabel: final,
        dispatchObserved: attempt.outcome?.kind === 'not-dispatched'
            ? false
            : objectValue(attempt.outcome?.data) && typeof attempt.outcome.data.dispatchObserved === 'boolean'
                ? attempt.outcome.data.dispatchObserved
                : null,
        tool,
        native: null,
    };
}

function recordFor(snapshot: ConversationSnapshot, collection: 'tools' | 'native', recordId: string): AttemptRecord | NativeRecord | undefined {
    return collection === 'tools'
        ? snapshot.attempts.find(attempt => attempt.kind === 'tool' && attempt.attemptId === recordId)
        : snapshot.nativeRecords.find(record => `${record.provenance}/${record.nativeId}` === recordId);
}

function digestRecord(record: AttemptRecord | NativeRecord): string {
    return createHash('sha256').update(JSON.stringify(record), 'utf8').digest('hex');
}

interface StableLibraryRecord {
    readonly record: AttemptRecord | NativeRecord;
    readonly state: ConversationSnapshot;
    readonly snapshot: HomeSnapshot;
    readonly item: ExecutionLibraryItem;
    readonly contentDigest: string;
}

async function stableLibraryRecord(
    home: Pick<OpenedRoleHome, 'readSnapshot' | 'readConversation'>,
    collection: 'tools' | 'native',
    recordId: string,
    expectedRevision: HomeRevision,
    panelBinding: PanelBinding,
): Promise<StableLibraryRecord> {
    const beforeSnapshot = await home.readSnapshot();
    const before = await home.readConversation();
    if (before.revision !== expectedRevision || beforeSnapshot.revision !== expectedRevision) {
        throw new HomeError('EXECUTION_LIBRARY_REVISION_CHANGED');
    }
    const prior = recordFor(before, collection, recordId);
    if (!prior) throw new HomeError('EXECUTION_RECORD_NOT_FOUND');
    const priorChannel = channelFor(before, prior.runId, panelBinding, beforeSnapshot.qqBinding ?? null);
    if (!priorChannel) throw new HomeError('BINDING_CHANGED');
    const after = await home.readConversation();
    const afterSnapshot = await home.readSnapshot();
    const current = recordFor(after, collection, recordId);
    if (after.revision !== expectedRevision || afterSnapshot.revision !== expectedRevision || !current) {
        throw new HomeError('EXECUTION_RECORD_CHANGED');
    }
    const currentChannel = channelFor(after, current.runId, panelBinding, afterSnapshot.qqBinding ?? null);
    if (!currentChannel || currentChannel.channel !== priorChannel.channel || currentChannel.version !== priorChannel.version) {
        throw new HomeError('BINDING_CHANGED');
    }
    const beforeDigest = digestRecord(prior);
    const contentDigest = digestRecord(current);
    if (beforeDigest !== contentDigest) throw new HomeError('EXECUTION_RECORD_CHANGED');
    const item = collection === 'tools'
        ? toolItem(prior as AttemptRecord, before, panelBinding, beforeSnapshot.qqBinding ?? null)
        : nativeItem(prior as NativeRecord, before, panelBinding, beforeSnapshot.qqBinding ?? null);
    if (!item) throw new HomeError('BINDING_CHANGED');
    return {record: structuredClone(prior), state: before, snapshot: beforeSnapshot, item, contentDigest};
}

interface SectionText {
    readonly field: ExecutionLibrarySectionField;
    readonly materialId: MaterialId | null;
    readonly label: string;
    readonly text: string;
}

function sectionsFor(collection: 'tools' | 'native', record: AttemptRecord | NativeRecord): readonly SectionText[] {
    const pretty = (value: unknown): string => JSON.stringify(value ?? null, null, 2);
    if (collection === 'tools') {
        const attempt = record as AttemptRecord;
        const materials = attempt.materials ?? [];
        return [
            {field: 'request', materialId: null, label: '请求', text: pretty(field(attempt.outcome?.data, 'request'))},
            {field: 'observation', materialId: null, label: '执行观察', text: pretty(attempt.observation ?? {status: 'not-recorded'})},
            {field: 'final', materialId: null, label: '最终规范结果', text: pretty(field(field(attempt.outcome?.data, 'result'), 'final'))},
            ...materials.map(material => ({
                field: 'material' as const,
                materialId: material.materialId,
                label: material.source === 'sdk-local-spill'
                    ? 'SDK 外置材料'
                    : material.source === 'role-read-result'
                        ? '资料读取材料'
                        : material.source === 'role-file-result'
                            ? '文件操作材料'
                            : '网页工具材料',
                text: material.text,
            })),
            {field: 'raw', materialId: null, label: '原始 JSON', text: pretty(attempt)},
        ];
    }
    const native = record as NativeRecord;
    return [
        {field: 'native', materialId: null, label: '原生事件与闭合信息', text: pretty(native.data)},
        {field: 'raw', materialId: null, label: '原始 JSON', text: pretty(native)},
    ];
}

export async function readExecutionLibraryDetail(
    home: Pick<OpenedRoleHome, 'readSnapshot' | 'readConversation'>,
    roleId: RoleId,
    panelBinding: PanelBinding,
    request: ExecutionLibraryDetailRequest,
): Promise<ExecutionLibraryDetail> {
    validateExecutionLibraryDetailRequest(request);
    const stable = await stableLibraryRecord(home, request.collection, request.recordId, request.expectedRevision, panelBinding);
    const sections = sectionsFor(request.collection, stable.record).map(section => ({
        field: section.field,
        materialId: section.materialId,
        label: section.label,
        totalCodePoints: Array.from(section.text).length,
    }));
    return {
        roleId,
        revision: stable.state.revision,
        item: stable.item,
        contentDigest: stable.contentDigest,
        sections,
    };
}

export async function readExecutionLibraryPart(
    home: Pick<OpenedRoleHome, 'readSnapshot' | 'readConversation'>,
    roleId: RoleId,
    panelBinding: PanelBinding,
    request: ExecutionLibraryPartRequest,
): Promise<ExecutionLibraryPart> {
    validateExecutionLibraryPartRequest(request);
    const stable = await stableLibraryRecord(home, request.collection, request.recordId, request.expectedRevision, panelBinding);
    if (stable.contentDigest !== request.expectedContentDigest) throw new HomeError('EXECUTION_RECORD_CHANGED');
    const section = sectionsFor(request.collection, stable.record).find(candidate =>
        candidate.field === request.field
        && (candidate.materialId ?? null) === request.materialId
    );
    if (!section) throw new HomeError('EXECUTION_RECORD_NOT_FOUND');
    const points = Array.from(section.text);
    if (request.offset > points.length) throw new HomeError('INVALID_EXECUTION_LIBRARY_PART');
    const text = points.slice(request.offset, request.offset + request.limit).join('');
    const more = request.offset + Array.from(text).length < points.length;
    return {
        roleId,
        revision: stable.state.revision,
        collection: request.collection,
        recordId: request.recordId,
        field: request.field,
        materialId: request.materialId,
        contentDigest: stable.contentDigest,
        text,
        offset: request.offset,
        totalCodePoints: points.length,
        more,
        nextOffset: more ? request.offset + Array.from(text).length : null,
    };
}

function nativeItem(
    record: NativeRecord,
    snapshot: ConversationSnapshot,
    panelBinding: PanelBinding,
    qqBinding: QQBinding | null,
): ExecutionLibraryItem | null {
    const channel = channelFor(snapshot, record.runId, panelBinding, qqBinding);
    if (!channel) return null;
    const summary = nativeRecordSummary(record);
    const turn = snapshot.turns.find(candidate => candidate.runId === record.runId)!;
    const status = summary.status === 'success'
        ? '最终规范成功'
        : summary.status === 'error'
            ? '最终规范错误'
            : summary.status === 'gap'
                ? '记录存在缺口'
                : summary.status === 'synthetic'
                    ? '原生合成闭合'
                    : record.provenance === 'host-denial'
                        ? '原生拒绝'
                        : '事件已记录';
    const result: ExecutionLibraryItem['result'] = summary.status === 'success'
        || summary.status === 'error'
        || summary.status === 'gap'
        || summary.status === 'synthetic'
        ? summary.status
        : record.provenance === 'host-denial'
            ? 'refused'
            : 'recorded';
    return {
        collection: 'native',
        recordId: `${record.provenance}/${record.nativeId}` as NativeRecordRef,
        runId: record.runId,
        channel: channel.channel,
        channelBindingVersion: channel.version,
        occurredAt: turn.startedAt,
        timeBasis: 'run-started',
        typeLabel: record.provenance === 'host-denial' ? '原生拒绝' : '原生记录',
        name: nativeName(record, summary),
        summary: `${status}${summary.code ? `；${summary.code}` : ''}`,
        result,
        statusLabel: status,
        dispatchObserved: null,
        tool: null,
        native: summary,
    };
}

function executionFilterKey(query: ExecutionLibraryQuery): string {
    return JSON.stringify({
        collection: query.collection,
        keyword: query.keyword.trim().toLocaleLowerCase(),
        toolName: query.toolName,
        result: query.result,
        channel: query.channel,
        from: query.from ? new Date(query.from).toISOString() : null,
        to: query.to ? new Date(query.to).toISOString() : null,
        sort: query.sort,
    });
}

export function executionLibraryPage(
    snapshot: ConversationSnapshot,
    roleId: RoleId,
    panelBinding: PanelBinding,
    qqBinding: QQBinding | null,
    query: ExecutionLibraryQuery,
): ExecutionLibraryPage {
    if (query.expectedRevision !== null && query.expectedRevision !== snapshot.revision) {
        throw new HomeError('EXECUTION_LIBRARY_REVISION_CHANGED');
    }
    const unfiltered = query.collection === 'tools'
        ? snapshot.attempts
            .filter(attempt => attempt.kind === 'tool')
            .map(attempt => toolItem(attempt, snapshot, panelBinding, qqBinding))
            .filter((item): item is ExecutionLibraryItem => item !== null)
        : snapshot.nativeRecords
            .map(record => nativeItem(record, snapshot, panelBinding, qqBinding))
            .filter((item): item is ExecutionLibraryItem => item !== null);
    const keyword = query.keyword.trim().toLocaleLowerCase();
    const from = dateValue(query.from);
    const to = dateValue(query.to);
    const all = unfiltered.filter(item => {
        if (query.channel !== 'all' && item.channel !== query.channel) return false;
        if (query.result !== 'all' && item.result !== query.result) return false;
        if (query.toolName !== 'all' && (item.tool?.name ?? (item.name === query.toolName ? query.toolName : 'unknown')) !== query.toolName) return false;
        const occurredAt = Date.parse(item.occurredAt);
        if (from !== null && occurredAt < from) return false;
        if (to !== null && occurredAt > to) return false;
        if (!keyword) return true;
        return searchableItem(item).includes(keyword);
    });
    const direction = query.sort === 'newest' ? -1 : 1;
    all.sort((left, right) => {
        const time = Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
        if (time !== 0) return time * direction;
        return String(left.recordId).localeCompare(String(right.recordId)) * direction;
    });
    const items = all.slice(query.offset, query.offset + query.limit);
    const more = query.offset + items.length < all.length;
    return {
        roleId,
        revision: snapshot.revision as HomeRevision,
        collection: query.collection,
        offset: query.offset,
        limit: query.limit,
        filterKey: executionFilterKey(query),
        total: all.length,
        rangeStart: items.length ? query.offset + 1 : null,
        rangeEnd: items.length ? query.offset + items.length : null,
        more,
        nextOffset: more ? query.offset + items.length : null,
        hasPrevious: query.offset > 0,
        items,
    };
}
