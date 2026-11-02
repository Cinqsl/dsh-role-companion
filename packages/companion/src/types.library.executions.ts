import type {
    AttemptId,
    BindingVersion,
    HomeRevision,
    NativeRecordRef,
    MaterialId,
    RoleId,
    RunId,
} from './home/ids.ts';
import type {
    NativeRecordSummary,
    ToolAttemptSummary,
} from './types.ts';

export type ExecutionLibraryCollection = 'tools' | 'native';
export type ExecutionLibraryChannel = 'all' | 'panel' | 'qq';
export type ExecutionLibrarySort = 'newest' | 'oldest';
export type ExecutionLibraryToolName =
    | 'all'
    | 'role_read'
    | 'role_file'
    | 'role_web_search'
    | 'role_web_fetch'
    | 'role_propose'
    | 'unknown';
export type ExecutionLibraryResult =
    | 'all'
    | 'success'
    | 'error'
    | 'pending'
    | 'unavailable'
    | 'gap'
    | 'synthetic'
    | 'recorded'
    | 'refused';

export interface ExecutionLibraryQuery {
    readonly collection: ExecutionLibraryCollection;
    readonly keyword: string;
    readonly toolName: ExecutionLibraryToolName;
    readonly result: ExecutionLibraryResult;
    readonly channel: ExecutionLibraryChannel;
    readonly from: string | null;
    readonly to: string | null;
    readonly sort: ExecutionLibrarySort;
    readonly offset: number;
    readonly limit: 20 | 50;
    readonly expectedRevision: HomeRevision | null;
}

export interface ExecutionLibraryItem {
    readonly collection: ExecutionLibraryCollection;
    readonly recordId: AttemptId | NativeRecordRef;
    readonly runId: RunId;
    readonly channel: 'panel' | 'qq';
    readonly channelBindingVersion: BindingVersion;
    readonly occurredAt: string;
    readonly timeBasis: 'tool-observed' | 'tool-reserved' | 'run-started';
    readonly typeLabel: string;
    readonly name: string;
    readonly summary: string;
    readonly result: Exclude<ExecutionLibraryResult, 'all'>;
    readonly statusLabel: string;
    readonly dispatchObserved: boolean | null;
    readonly tool: ToolAttemptSummary | null;
    readonly native: NativeRecordSummary | null;
}

export interface ExecutionLibraryPage {
    readonly roleId: RoleId;
    readonly revision: HomeRevision;
    readonly collection: ExecutionLibraryCollection;
    readonly offset: number;
    readonly limit: 20 | 50;
    readonly filterKey: string;
    readonly total: number;
    readonly rangeStart: number | null;
    readonly rangeEnd: number | null;
    readonly more: boolean;
    readonly nextOffset: number | null;
    readonly hasPrevious: boolean;
    readonly items: readonly ExecutionLibraryItem[];
}

export interface ExecutionLibraryDetailRequest {
    readonly collection: ExecutionLibraryCollection;
    readonly recordId: AttemptId | NativeRecordRef;
    readonly expectedRevision: HomeRevision;
}

export type ExecutionLibrarySectionField = 'request' | 'observation' | 'final' | 'native' | 'raw' | 'material';

export interface ExecutionLibrarySection {
    readonly field: ExecutionLibrarySectionField;
    readonly materialId: MaterialId | null;
    readonly label: string;
    readonly totalCodePoints: number;
}

export interface ExecutionLibraryDetail {
    readonly roleId: RoleId;
    readonly revision: HomeRevision;
    readonly item: ExecutionLibraryItem;
    readonly contentDigest: string;
    readonly sections: readonly ExecutionLibrarySection[];
}

export interface ExecutionLibraryPartRequest {
    readonly collection: ExecutionLibraryCollection;
    readonly recordId: AttemptId | NativeRecordRef;
    readonly field: ExecutionLibrarySectionField;
    readonly materialId: MaterialId | null;
    readonly offset: number;
    readonly limit: number;
    readonly expectedRevision: HomeRevision;
    readonly expectedContentDigest: string;
}

export interface ExecutionLibraryPart {
    readonly roleId: RoleId;
    readonly revision: HomeRevision;
    readonly collection: ExecutionLibraryCollection;
    readonly recordId: AttemptId | NativeRecordRef;
    readonly field: ExecutionLibrarySectionField;
    readonly materialId: MaterialId | null;
    readonly contentDigest: string;
    readonly text: string;
    readonly offset: number;
    readonly totalCodePoints: number;
    readonly more: boolean;
    readonly nextOffset: number | null;
}
