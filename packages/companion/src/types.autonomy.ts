import type {RoleId,BindingVersion,HomeRevision,OperationId,RunId,AutonomyRulesVersion,DayWindowId} from './home/ids.ts';
import type {AutonomyRules,AutonomySchedule,AutonomyWindow,WakeOpportunity,AutonomyAttributionRun} from './home/autonomy.ts';
import type {TurnRecord} from './home/turns.ts';
export interface AutonomyRulesEditRequest {readonly operationId:OperationId;readonly value:Readonly<Record<string,string|number>>;readonly expectedAutonomyRulesVersion:AutonomyRulesVersion;readonly expectedRevision:HomeRevision;}
export interface WakeRoleRequest {readonly operationId:OperationId;}
export interface AutonomyPauseRequest {readonly operationId:OperationId;readonly paused:boolean;readonly at:string;}
export interface ClockReviewRequest {readonly operationId:OperationId;readonly expectedRevision:HomeRevision;}
export interface AutonomyAttributionRequest {readonly runId?:RunId;}
export interface ActivitySummary {readonly runId:RunId;readonly status:TurnRecord['status'];readonly startedAt:string;readonly deadline:string;readonly reason:string;readonly textExcerpt:string;readonly totalCodePoints:number;readonly contentDigest:string;readonly modelUsed:number;readonly toolUsed:number;readonly webUsed:number;}
export interface AutonomyView {
 readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly revision:HomeRevision;
 readonly rules:AutonomyRules;readonly pending:WakeOpportunity|null;readonly restUntil:string|null;
 readonly clockBlocked:string|null;readonly clockDataVersion:string|null;
 readonly windows:readonly AutonomyWindow[];readonly totalWindows:number;
 /** Real next reset from the same window/IANA ledger: preserved window end or current calendar day end. */
 readonly nextResetUtc:string|null;
 /** Window owning the current admission decision; null before the first reservation. */
 readonly currentWindowId:DayWindowId|null;
 readonly activities:readonly ActivitySummary[];readonly totalActivities:number;
 /** Periodic opportunity projection from the same Home schedule sidecar (#50). */
 readonly schedule:AutonomyScheduleView;
 readonly ruleEffect:'next-admission';
 readonly timeZoneEditing:'available';
}
/**
 * Panel projection of the durable periodic schedule (#50). The interval itself lives in `rules`
 * (one owner, one version); pause intent lives in Home next to restUntil, not in the panel.
 */
export interface AutonomyScheduleView {readonly intervalMs:number;readonly paused:boolean;readonly pausedAt:string|null;readonly anchorAt:string;readonly lastSlotAt:string|null;readonly nextOpportunityAt:string;readonly missedSlots:number;readonly lastSkipReason:string|null;}
export interface ActivityRecordRead {readonly runId:RunId;readonly revision:HomeRevision;readonly contentDigest:string;readonly offset:number;readonly limit:number;}
export interface ActivityRecordPart {readonly runId:RunId;readonly revision:HomeRevision;readonly contentDigest:string;readonly text:string;readonly offset:number;readonly totalCodePoints:number;readonly more:boolean;}
export interface AutonomyAttributionView {readonly runs:readonly AutonomyAttributionRun[];}
