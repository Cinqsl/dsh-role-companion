import {HomeError} from '../home/errors.ts';
import type {HomeSnapshot} from '../home/index.ts';
import type {ConversationSnapshot} from '../home/turns.ts';
import type {RoleView} from '../runtime/index.ts';
import type {
  CleanupCatalogItem,
  CleanupCatalogPage,
  CleanupCatalogPageRequest,
  MaintenanceHealth,
} from '../types.library.maintenance.ts';
import {cleanupRefKey} from '../home/cleanup.ts';
import {boundedPreview} from './library-preview.ts';

function pageRange(value:CleanupCatalogPageRequest):CleanupCatalogPageRequest {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype
    || Object.keys(value).sort().join('|') !== 'limit|offset'
    || !Number.isSafeInteger(value.offset) || value.offset < 0
    || !Number.isSafeInteger(value.limit) || value.limit < 1 || value.limit > 50) {
    throw new HomeError('INVALID_CLEANUP_PAGE');
  }
  return value;
}

function toolPreview(attempt:ConversationSnapshot['attempts'][number]):string {
  if (!attempt.observation) return '工具调用已预留，尚未记录返回结果。';
  if (attempt.observation.kind === 'threw') return `工具执行失败：${attempt.observation.code}`;
  return '工具调用已返回结果，正文和材料请到执行记录查看。';
}

function rowState(cleaned:boolean,complete:boolean):Pick<CleanupCatalogItem,'state'|'stateLabel'> {
  if (cleaned) return {state:'cleaned',stateLabel:'正文已清理，不能再次选择'};
  if (!complete) return {state:'incomplete',stateLabel:'记录不完整，请先核对'};
  return {state:'available',stateLabel:'可选择清理'};
}

export function cleanupCatalogPage(
  snapshot:HomeSnapshot,
  conversation:ConversationSnapshot,
  requested:CleanupCatalogPageRequest,
):CleanupCatalogPage {
  const page = pageRange(requested);
  if (snapshot.revision !== conversation.revision) {
    throw new HomeError('CLEANUP_SOURCE_CHANGED');
  }
  const rows:CleanupCatalogItem[] = [];
  for (const input of snapshot.inputs) {
    const state = rowState(!!input.cleanup, input.text.length > 0 || !!input.cleanup);
    rows.push({
      ref:{kind:'input',id:input.inputId},
      kind:'input',
      kindLabel:'用户来信',
      preview:input.cleanup ? '正文已清理，保留清理结果。' : boundedPreview(input.text,160,'正文为空'),
      occurredAt:input.receivedAt,
      ...state,
    });
  }
  for (const reply of conversation.replies) {
    const turn = conversation.turns.find(candidate => candidate.runId === reply.runId);
    if (!turn) continue;
    const state = rowState(!!reply.cleanup, reply.text.length > 0 || !!reply.cleanup);
    rows.push({
      ref:{kind:'reply',id:reply.replyId},
      kind:'reply',
      kindLabel:'角色回复',
      preview:reply.cleanup ? '正文已清理，保留回复结果。' : boundedPreview(reply.text,160,'正文为空'),
      occurredAt:turn.startedAt,
      ...state,
    });
  }
  for (const attempt of conversation.attempts.filter(candidate => candidate.kind === 'tool')) {
    const state = rowState(!!attempt.cleanup, !!attempt.observation);
    rows.push({
      ref:{kind:'tool',id:attempt.attemptId},
      kind:'tool',
      kindLabel:'工具执行',
      preview:attempt.cleanup ? '工具正文已清理，保留结果元数据。' : toolPreview(attempt),
      occurredAt:attempt.observation?.observedAt ?? attempt.reservedAt,
      ...state,
    });
  }
  rows.sort((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt)
    || cleanupRefKey(left.ref).localeCompare(cleanupRefKey(right.ref)));
  return {
    basis:{roleId:snapshot.roleId,revision:snapshot.revision},
    items:rows.slice(page.offset, page.offset + page.limit),
    offset:page.offset,
    total:rows.length,
    more:page.offset + page.limit < rows.length,
  };
}

export function maintenanceHealth(view:RoleView):MaintenanceHealth {
  const pendingCleanupCount = view.cleanups?.filter(task => task.phase !== 'complete').length ?? 0;
  if (!view.home || view.status === 'stopping' || view.status === 'stopped') {
    return {
      tone:'danger',
      label:'维护暂不可用',
      detail:'角色之家尚未就绪。请先核对角色运行状态，已保存的原操作 ID 不会被清除。',
      pendingCleanupCount,
    };
  }
  if (view.status === 'read-only') {
    return {
      tone:'warning',
      label:'只读维护',
      detail:'可以查看清理目录和查询原操作；选择、预览、确认与继续写入均已关闭。',
      pendingCleanupCount,
    };
  }
  if (view.status === 'not-ready') {
    return {
      tone:'warning',
      label:'运行状态待核对',
      detail:'角色之家可以读取清理目录；开始新清理或继续原操作前，请先核对运行状态。',
      pendingCleanupCount,
    };
  }
  if (pendingCleanupCount > 0) {
    return {
      tone:'warning',
      label:'清理待继续',
      detail:`有 ${pendingCleanupCount} 项清理任务尚未完成。原操作 ID 已保留，可查询后继续。`,
      pendingCleanupCount,
    };
  }
  if (view.home.projection !== 'current') {
    return {
      tone:'warning',
      label:'投影待核对',
      detail:'资料可以维护，但文本投影与角色之家不一致。请到投影标签预检影响。',
      pendingCleanupCount,
    };
  }
  return {
    tone:'success',
    label:'可以维护',
    detail:'角色之家可读可写，当前没有待继续的清理任务。',
    pendingCleanupCount,
  };
}
