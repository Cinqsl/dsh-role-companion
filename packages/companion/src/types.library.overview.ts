import type {HomeRevision,RoleId} from './home/ids.ts';
import type {ContextSourceRef} from './home/context-snapshot.ts';
import type {KnowledgeRecordRef} from './types.knowledge.ts';

export type LibraryMaintenanceTab='cleanup'|'projection'|'diagnostics';

export type LibraryOverviewTarget=
  | {readonly view:'overview'}
  | {readonly view:'sources';readonly ref?:ContextSourceRef}
  | {readonly view:'knowledge';readonly collection:'versions'|'proposals';readonly ref?:KnowledgeRecordRef}
  | {readonly view:'executions';readonly collection:'tools'|'native'}
  | {readonly view:'maintenance';readonly tab:LibraryMaintenanceTab};

export type LibraryOverviewActionKind=
  | 'execution'
  | 'archive-gap'
  | 'source-gap'
  | 'projection'
  | 'fault';

export interface LibraryOverviewAction {
  readonly id:string;
  readonly kind:LibraryOverviewActionKind;
  readonly reason:string;
  readonly impact:string;
  readonly actionLabel:string;
  readonly target:LibraryOverviewTarget;
}

export interface LibraryOverviewRecent {
  readonly id:string;
  readonly kind:'source'|'knowledge';
  readonly typeLabel:string;
  readonly title:string;
  readonly summary:string;
  readonly occurredAt:string|null;
  readonly target:LibraryOverviewTarget;
}

export interface LibraryOverview {
  readonly roleId:RoleId;
  readonly revision:HomeRevision;
  readonly actions:readonly LibraryOverviewAction[];
  readonly actionCount:number;
  readonly recent:readonly LibraryOverviewRecent[];
}
