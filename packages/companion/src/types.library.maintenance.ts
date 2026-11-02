import type {HomeRevision} from './home/ids.ts';
import type {CleanupSelection} from './home/cleanup.ts';

export type CleanupCatalogItem =
  | {
      readonly ref:CleanupSelection['sources'][number];
      readonly kind:'input';
      readonly kindLabel:'用户来信';
      readonly preview:string;
      readonly occurredAt:string;
      readonly state:'available'|'cleaned'|'incomplete';
      readonly stateLabel:string;
    }
  | {
      readonly ref:CleanupSelection['sources'][number];
      readonly kind:'reply';
      readonly kindLabel:'角色回复';
      readonly preview:string;
      readonly occurredAt:string;
      readonly state:'available'|'cleaned'|'incomplete';
      readonly stateLabel:string;
    }
  | {
      readonly ref:CleanupSelection['sources'][number];
      readonly kind:'tool';
      readonly kindLabel:'工具执行';
      readonly preview:string;
      readonly occurredAt:string;
      readonly state:'available'|'cleaned'|'incomplete';
      readonly stateLabel:string;
    };

export interface CleanupCatalogPageRequest {
  readonly offset:number;
  readonly limit:number;
}

export interface CleanupCatalogPage {
  readonly basis:{readonly roleId:string;readonly revision:HomeRevision};
  readonly items:readonly CleanupCatalogItem[];
  readonly offset:number;
  readonly total:number;
  readonly more:boolean;
}

export interface MaintenanceHealth {
  readonly tone:'success'|'warning'|'danger'|'neutral';
  readonly label:string;
  readonly detail:string;
  readonly pendingCleanupCount:number;
}

export interface LibraryMaintenanceView {
  readonly health:MaintenanceHealth;
  readonly cleanup:CleanupCatalogPage;
}
