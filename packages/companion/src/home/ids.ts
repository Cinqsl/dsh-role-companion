/** Home-owned primitive contracts. Phantom symbols never change JSON or persisted bytes. */
declare const identity: unique symbol;
class ContractError extends Error { constructor(readonly code: string) { super(code); } }
function token(value: unknown, code: string, pattern = /^[a-zA-Z0-9_-]{1,128}$/): string {
    if (typeof value !== 'string' || !pattern.test(value)) throw new ContractError(code);
    return value;
}
function version(value: unknown, minimum: number): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) throw new ContractError('INVALID_VERSION');
    return value;
}
export type RoleId = string & { readonly [identity]: 'RoleCompanion.RoleId' };
export type InputId = string & { readonly [identity]: 'RoleCompanion.InputId' };
export type InputKey = string & { readonly [identity]: 'RoleCompanion.InputKey' };
export type BindingId = string & { readonly [identity]: 'RoleCompanion.BindingId' };
export type OperationId = string & { readonly [identity]: 'RoleCompanion.OperationId' };
export type ExperienceId = string & { readonly [identity]: 'RoleCompanion.ExperienceId' };
export type InputGroupId = string & { readonly [identity]: 'RoleCompanion.InputGroupId' };
export type RunId = string & { readonly [identity]: 'RoleCompanion.RunId' };
export type AttemptId = string & { readonly [identity]: 'RoleCompanion.AttemptId' };
export type ReplyId = string & { readonly [identity]: 'RoleCompanion.ReplyId' };
export type IntentId = string & { readonly [identity]: 'RoleCompanion.IntentId' };
export type NativeExposureId = string & { readonly [identity]: 'RoleCompanion.NativeExposureId' };
export type NativeRecordRef = string & { readonly [identity]: 'RoleCompanion.NativeRecordRef' };
export type MaterialId = string & {readonly [identity]:'RoleCompanion.MaterialId'};
export function MaterialId(value:unknown):MaterialId{return token(value,'INVALID_MATERIAL_ID',/^material-[0-9a-f-]{36}$/) as MaterialId;}
export function RoleId(value: unknown): RoleId { return token(value, 'INVALID_ROLE_ID', /^role-[0-9a-f-]{36}$/) as RoleId; }
export function InputId(value: unknown): InputId { return token(value, 'INVALID_INPUT_ID', /^input-[0-9a-f-]{36}$/) as InputId; }
export function InputKey(value: unknown): InputKey { return token(value, 'INVALID_OPERATION_ID') as InputKey; }
export function BindingId(value: unknown): BindingId { return token(value, 'INVALID_BINDING_ID', /^[\s\S]+$/) as BindingId; }
export function OperationId(value: unknown): OperationId { return token(value, 'INVALID_OPERATION_ID') as OperationId; }
export function ExperienceId(value: unknown): ExperienceId { return token(value, 'INVALID_EXPERIENCE_ID', /^[\s\S]+$/) as ExperienceId; }
export function InputGroupId(value: unknown): InputGroupId { return token(value, 'INVALID_INPUT_GROUP_ID', /^[\s\S]+$/) as InputGroupId; }
export function RunId(value: unknown): RunId { return token(value, 'INVALID_RUN_ID', /^[\s\S]+$/) as RunId; }
export function AttemptId(value: unknown): AttemptId { return token(value, 'INVALID_ATTEMPT_ID', /^[\s\S]+$/) as AttemptId; }
export function ReplyId(value: unknown): ReplyId { return token(value, 'INVALID_REPLY_ID', /^[\s\S]+$/) as ReplyId; }
export function IntentId(value: unknown): IntentId { return token(value, 'INVALID_INTENT_ID', /^[\s\S]+$/) as IntentId; }
export function NativeExposureId(value: unknown): NativeExposureId { return token(value, 'INVALID_NATIVE_EXPOSURE_ID', /^[\s\S]+$/) as NativeExposureId; }
export function NativeRecordRef(value: unknown): NativeRecordRef { return token(value, 'INVALID_NATIVE_RECORD_REF', /^(?:tools-result|native-session|host-denial)\/[\s\S]+$/) as NativeRecordRef; }
/** Zero belongs to pre-commit head/IO evidence; committed snapshots start at one. */
export type HomeRevision = number & { readonly [identity]: 'RoleCompanion.HomeRevision' };
export function HomeRevision(value: unknown): HomeRevision { return version(value, 0) as HomeRevision; }
export type CoreVersion = number & { readonly [identity]: 'RoleCompanion.CoreVersion' };
export function CoreVersion(value: unknown): CoreVersion { return version(value, 1) as CoreVersion; }
export type InputSettingsVersion = number & { readonly [identity]: 'RoleCompanion.InputSettingsVersion' };
export function InputSettingsVersion(value: unknown): InputSettingsVersion { return version(value, 1) as InputSettingsVersion; }
export type ConversationVersion = number & { readonly [identity]: 'RoleCompanion.ConversationVersion' };
export function ConversationVersion(value: unknown): ConversationVersion { return version(value, 1) as ConversationVersion; }
export type BindingVersion = number & { readonly [identity]: 'RoleCompanion.BindingVersion' };
export function BindingVersion(value: unknown): BindingVersion { return version(value, 1) as BindingVersion; }
export type ContextGeneration = number & { readonly [identity]: 'RoleCompanion.ContextGeneration' };
export function ContextGeneration(value: unknown): ContextGeneration { return version(value, 1) as ContextGeneration; }

export type ReadRulesVersion = number & {readonly [identity]:'RoleCompanion.ReadRulesVersion'};
export function ReadRulesVersion(value:unknown):ReadRulesVersion {return version(value,1) as ReadRulesVersion;}

export type LogicalOpId=string & {readonly [identity]:'RoleCompanion.LogicalOpId'};
export function LogicalOpId(value:unknown):LogicalOpId{return token(value,'INVALID_LOGICAL_OP_ID',/^logical-[0-9a-f-]{36}$/) as LogicalOpId;}

export type RetryRulesVersion=number & {readonly [identity]:'RoleCompanion.RetryRulesVersion'};
export function RetryRulesVersion(value:unknown):RetryRulesVersion{return version(value,1) as RetryRulesVersion;}

export type FileRulesVersion=number & {readonly [identity]:'RoleCompanion.FileRulesVersion'};
export function FileRulesVersion(value:unknown):FileRulesVersion{return version(value,1) as FileRulesVersion;}

export type FileTag=string & {readonly [identity]:'RoleCompanion.FileTag'};
export function FileTag(value:unknown):FileTag{return token(value,'INVALID_FILE_TAG',/^file-v1-[0-9a-f]{64}$/) as FileTag;}

export type FileAccessVersion=number & {readonly [identity]:'RoleCompanion.FileAccessVersion'};
export function FileAccessVersion(value:unknown):FileAccessVersion{return version(value,1) as FileAccessVersion;}
export type FileGrantId=string & {readonly [identity]:'RoleCompanion.FileGrantId'};
export function FileGrantId(value:unknown):FileGrantId{return token(value,'INVALID_FILE_GRANT_ID',/^file-grant-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) as FileGrantId;}
export type WebRulesVersion=number & {readonly [identity]:'RoleCompanion.WebRulesVersion'};
export function WebRulesVersion(value:unknown):WebRulesVersion{return version(value,1) as WebRulesVersion;}

export type BackupManifestDigest=string&{readonly[identity]:'RoleCompanion.BackupManifestDigest'};
export function BackupManifestDigest(value:unknown):BackupManifestDigest{return token(value,'INVALID_BACKUP_MANIFEST_DIGEST',/^[a-f0-9]{64}$/) as BackupManifestDigest;}
export type ProposalId=string & {readonly [identity]:'RoleCompanion.ProposalId'};
export function ProposalId(value:unknown):ProposalId{return token(value,'INVALID_PROPOSAL_ID',/^proposal-[A-Za-z0-9_-]+$/) as ProposalId;}
export type KnowledgeId=string & {readonly [identity]:'RoleCompanion.KnowledgeId'};
export function KnowledgeId(value:unknown):KnowledgeId{return token(value,'INVALID_KNOWLEDGE_ID',/^knowledge-[A-Za-z0-9_-]+$/) as KnowledgeId;}
/** Zero is only the expectation for a new topic; published versions start at one. */
export type KnowledgeVersion=number & {readonly [identity]:'RoleCompanion.KnowledgeVersion'};
export function KnowledgeVersion(value:unknown):KnowledgeVersion{return version(value,0) as KnowledgeVersion;}

export type ProposalRulesVersion=number & {readonly [identity]:'RoleCompanion.ProposalRulesVersion'};
export function ProposalRulesVersion(value:unknown):ProposalRulesVersion{return version(value,1) as ProposalRulesVersion;}

export type AutonomyRulesVersion=number & {readonly [identity]:'RoleCompanion.AutonomyRulesVersion'};
export function AutonomyRulesVersion(value:unknown):AutonomyRulesVersion{return version(value,1) as AutonomyRulesVersion;}
export type DayWindowId=string & {readonly [identity]:'RoleCompanion.DayWindowId'};
export function DayWindowId(value:unknown):DayWindowId{return token(value,'INVALID_DAY_WINDOW_ID',/^day-[0-9a-f]{64}$/) as DayWindowId;}
export type HandoverId=string&{readonly[identity]:'RoleCompanion.HandoverId'};
export function HandoverId(value:unknown):HandoverId{return token(value,'INVALID_HANDOVER_ID',/^handover-[a-f0-9]{64}$/) as HandoverId;}

/** 主动联系规则（#51）与自主活动规则各有独立版本，互不覆盖、互不改变旧 Home 重放语义。 */
export type ContactRulesVersion=number & {readonly[identity]:'RoleCompanion.ContactRulesVersion'};
export function ContactRulesVersion(value:unknown):ContactRulesVersion{return version(value,1) as ContactRulesVersion;}
/** 一次“想交流”的记录；与某条消息的发送结果分开，且绝不复用 ReplyRecord.intentId（intent-<runId> 派生串）。 */
export type ContactIntentId=string & {readonly[identity]:'RoleCompanion.ContactIntentId'};
export function ContactIntentId(value:unknown):ContactIntentId{return token(value,'INVALID_CONTACT_INTENT_ID',/^contact-intent-[A-Za-z0-9_-]+$/) as ContactIntentId;}
