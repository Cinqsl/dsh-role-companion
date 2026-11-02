import { type RoleId, type InputId, type InputKey, BindingId, type OperationId, type ExperienceId, type HomeRevision, BindingVersion } from './ids.ts';
import type {QQInputSource} from './qq.ts';
/** Trusted adapter input. Browser requests cannot choose this provenance. */
export interface BoundInput {
    /** Explicit authenticated owner request, distinct from transport origin. */
    readonly contextPurpose?:'history';
    readonly channel?:'qq';
    readonly qqSource?:QQInputSource;
    readonly operationId: OperationId;
    readonly bindingId: BindingId;
    readonly bindingVersion: BindingVersion;
    readonly externalKey: InputKey;
    readonly text: string;
    readonly origin: 'live'|'history';
    readonly historySource?:import('./qq-history.ts').QQHistorySource;
    readonly receivedAt: string;
    readonly sourceEvidence: string;
}
export interface PanelBinding {
    readonly bindingId: BindingId;
    readonly bindingVersion: BindingVersion;
    readonly source: 'owner-panel';
}
/** The verified Home identity fixes the panel namespace across processes. */
export function panelBindingFor(roleId: RoleId): PanelBinding {
    return { bindingId: BindingId('panel-' + roleId), bindingVersion: BindingVersion(1), source: 'owner-panel' };
}
export interface InputAcceptedReceipt {
    readonly kind: 'accepted' | 'duplicate';
    readonly operationId: OperationId;
    readonly roleId: RoleId;
    readonly inputId: InputId;
    readonly experienceId: ExperienceId;
    readonly committedRevision: HomeRevision;
    readonly receiveSequence: number;
    readonly bindingId: BindingId;
    readonly bindingVersion: BindingVersion;
    readonly status: 'queued';
}
export type InputReceipt = InputAcceptedReceipt | {
    readonly kind: 'uncertain';
    readonly operationId: OperationId;
    readonly reason: 'IO_UNCERTAIN';
} | {
    readonly kind: 'rejected';
    readonly operationId?: OperationId;
    readonly reason: 'not-ready' | 'read-only' | 'stopping' | 'input-too-large' | 'role-changed' | 'not-bound' | 'key-conflict' | 'operation-conflict' | 'invalid-input' | 'storage-error';
    readonly errorCode?: string;
};
export interface InputRecord {
    readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker;
    readonly contextPurpose?:'history';
    readonly channel?:'qq';
    readonly qqSource?:QQInputSource;
    readonly inputId: InputId;
    readonly experienceId: ExperienceId;
    readonly operationId: OperationId;
    readonly committedRevision: HomeRevision;
    readonly receiveSequence: number;
    readonly bindingId: BindingId;
    readonly bindingVersion: BindingVersion;
    readonly externalKey: InputKey;
    readonly text: string;
    readonly utf8Bytes: number;
    readonly origin: 'live'|'history';
    readonly historySource?:import('./qq-history.ts').QQHistorySource;
    readonly receivedAt: string;
    readonly sourceEvidence: string;
    readonly status: 'queued' | 'running' | 'resolved' | 'cancelled' | 'blocked';
    readonly blockedReason?: string;
    readonly processingUnavailableReason?: 'execution-unavailable'|'qq-replies-unavailable';
}
/** #38 accepts/displays QQ while its reply execution capability is unavailable. */
export function runnableInput(input:Pick<InputRecord,'channel'>,qqReplies=false):boolean{return input.channel!=='qq'||qqReplies;}
export interface PanelInputRequest {
    readonly contextPurpose?:'history';
    readonly clientRequestId: InputKey;
    readonly operationId: OperationId;
    readonly text: string;
    readonly expectedRoleId: RoleId;
    readonly expectedBindingVersion: BindingVersion;
}
export interface InputListView {
    readonly roleId: RoleId | null;
    readonly revision: HomeRevision | null;
    readonly binding: PanelBinding | null;
    readonly inputs: readonly InputRecord[];
    readonly processing: 'unavailable' | 'available';
    readonly afterSequence: number;
    readonly limit: number;
    readonly total: number;
    readonly more: boolean;
    readonly nextAfterSequence: number | null;
    readonly uncertainOperationId?: OperationId;
}
export interface InputPageRequest {
    readonly afterSequence: number;
    readonly limit: number;
}
