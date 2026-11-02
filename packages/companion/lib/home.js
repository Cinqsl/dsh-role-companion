// packages/companion/src/home/ids.ts
var ContractError = class extends Error {
  constructor(code2) {
    super(code2);
    this.code = code2;
  }
};
function token(value, code2, pattern = /^[a-zA-Z0-9_-]{1,128}$/) {
  if (typeof value !== "string" || !pattern.test(value)) throw new ContractError(code2);
  return value;
}
function version(value, minimum) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) throw new ContractError("INVALID_VERSION");
  return value;
}
function MaterialId(value) {
  return token(value, "INVALID_MATERIAL_ID", /^material-[0-9a-f-]{36}$/);
}
function RoleId(value) {
  return token(value, "INVALID_ROLE_ID", /^role-[0-9a-f-]{36}$/);
}
function InputId(value) {
  return token(value, "INVALID_INPUT_ID", /^input-[0-9a-f-]{36}$/);
}
function InputKey(value) {
  return token(value, "INVALID_OPERATION_ID");
}
function BindingId(value) {
  return token(value, "INVALID_BINDING_ID", /^[\s\S]+$/);
}
function OperationId(value) {
  return token(value, "INVALID_OPERATION_ID");
}
function ExperienceId(value) {
  return token(value, "INVALID_EXPERIENCE_ID", /^[\s\S]+$/);
}
function InputGroupId(value) {
  return token(value, "INVALID_INPUT_GROUP_ID", /^[\s\S]+$/);
}
function RunId(value) {
  return token(value, "INVALID_RUN_ID", /^[\s\S]+$/);
}
function AttemptId(value) {
  return token(value, "INVALID_ATTEMPT_ID", /^[\s\S]+$/);
}
function ReplyId(value) {
  return token(value, "INVALID_REPLY_ID", /^[\s\S]+$/);
}
function IntentId(value) {
  return token(value, "INVALID_INTENT_ID", /^[\s\S]+$/);
}
function NativeExposureId(value) {
  return token(value, "INVALID_NATIVE_EXPOSURE_ID", /^[\s\S]+$/);
}
function NativeRecordRef(value) {
  return token(value, "INVALID_NATIVE_RECORD_REF", /^(?:tools-result|native-session|host-denial)\/[\s\S]+$/);
}
function HomeRevision(value) {
  return version(value, 0);
}
function CoreVersion(value) {
  return version(value, 1);
}
function InputSettingsVersion(value) {
  return version(value, 1);
}
function ConversationVersion(value) {
  return version(value, 1);
}
function BindingVersion(value) {
  return version(value, 1);
}
function ContextGeneration(value) {
  return version(value, 1);
}
function ReadRulesVersion(value) {
  return version(value, 1);
}
function LogicalOpId(value) {
  return token(value, "INVALID_LOGICAL_OP_ID", /^logical-[0-9a-f-]{36}$/);
}
function RetryRulesVersion(value) {
  return version(value, 1);
}
function FileRulesVersion(value) {
  return version(value, 1);
}
function FileTag(value) {
  return token(value, "INVALID_FILE_TAG", /^file-v1-[0-9a-f]{64}$/);
}
function FileAccessVersion(value) {
  return version(value, 1);
}
function FileGrantId(value) {
  return token(value, "INVALID_FILE_GRANT_ID", /^file-grant-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
}
function WebRulesVersion(value) {
  return version(value, 1);
}
function BackupManifestDigest(value) {
  return token(value, "INVALID_BACKUP_MANIFEST_DIGEST", /^[a-f0-9]{64}$/);
}
function ProposalId(value) {
  return token(value, "INVALID_PROPOSAL_ID", /^proposal-[A-Za-z0-9_-]+$/);
}
function KnowledgeId(value) {
  return token(value, "INVALID_KNOWLEDGE_ID", /^knowledge-[A-Za-z0-9_-]+$/);
}
function KnowledgeVersion(value) {
  return version(value, 0);
}
function ProposalRulesVersion(value) {
  return version(value, 1);
}
function AutonomyRulesVersion(value) {
  return version(value, 1);
}
function DayWindowId(value) {
  return token(value, "INVALID_DAY_WINDOW_ID", /^day-[0-9a-f]{64}$/);
}
function HandoverId(value) {
  return token(value, "INVALID_HANDOVER_ID", /^handover-[a-f0-9]{64}$/);
}
function ContactRulesVersion(value) {
  return version(value, 1);
}
function ContactIntentId(value) {
  return token(value, "INVALID_CONTACT_INTENT_ID", /^contact-intent-[A-Za-z0-9_-]+$/);
}

// packages/companion/src/home/errors.ts
var HomeError = class extends Error {
  constructor(code2, message = code2, operationId) {
    super(message);
    this.code = code2;
    this.operationId = operationId;
  }
};

// packages/companion/src/home/restore-acceptance.ts
function restoreConfirmation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).some((key2) => typeof key2 !== "string") || Reflect.ownKeys(value).sort().join("|") !== "currentSourceStoppedConfirmed|expectedManifestDigest|expectedRevision|handoverId|operationId|restoreOperationId") throw new HomeError("INVALID_RESTORE_CONFIRMATION");
  if (!("operationId" in value) || !("restoreOperationId" in value) || !("handoverId" in value) || !("expectedManifestDigest" in value) || !("expectedRevision" in value) || !("currentSourceStoppedConfirmed" in value) || typeof value.currentSourceStoppedConfirmed !== "boolean") throw new HomeError("INVALID_RESTORE_CONFIRMATION");
  if (!value.currentSourceStoppedConfirmed) throw new HomeError("SOURCE_STOP_CONFIRMATION_REQUIRED");
  return { operationId: OperationId(value.operationId), restoreOperationId: OperationId(value.restoreOperationId), handoverId: HandoverId(value.handoverId), expectedManifestDigest: BackupManifestDigest(value.expectedManifestDigest), expectedRevision: HomeRevision(value.expectedRevision), currentSourceStoppedConfirmed: true };
}
var restoreInputEligible = (accepted, input) => !accepted || input.receiveSequence > accepted.inputSequence;
var restoreRunEligible = (accepted, runId) => !accepted || !accepted.inheritedRunIds.includes(runId);
function restoreDeliveryEligible(accepted, delivery, state) {
  if (!accepted) return true;
  const reply = state.replies.find((reply2) => reply2.replyId === delivery.replyId);
  if (reply && reply.committedRevision > accepted.sourceRevision) return true;
  const resolution = state.deliveryResolutions.find((resolution2) => resolution2.operationId === delivery.resolutionOperationId);
  return !!resolution && resolution.decision === "resend" && resolution.committedRevision > accepted.sourceRevision && resolution.deliveryId === delivery.retryOf && !!resolution.newDeliveryId;
}

// packages/companion/src/home/handovers.ts
function handoverReservation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join("|") !== "backupOperationId|destinationDigest|expectedRevision|handoverId|operationId|stopOperationId" || !("destinationDigest" in value) || typeof value.destinationDigest !== "string" || !/^[a-f0-9]{64}$/.test(value.destinationDigest)) throw new HomeError("INVALID_HANDOVER");
  if (!("operationId" in value) || !("handoverId" in value) || !("backupOperationId" in value) || !("stopOperationId" in value) || !("expectedRevision" in value)) throw new HomeError("INVALID_HANDOVER");
  return { operationId: OperationId(value.operationId), handoverId: HandoverId(value.handoverId), backupOperationId: OperationId(value.backupOperationId), stopOperationId: OperationId(value.stopOperationId), destinationDigest: value.destinationDigest, expectedRevision: HomeRevision(value.expectedRevision) };
}
var currentOutgoingHandover = (record, acceptedRevision) => record.requestedRevision > (acceptedRevision ?? 0);

// packages/companion/src/home/restore-admission.ts
import { lstat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
async function portableRestoreRequired(homePath) {
  try {
    await lstat(join(homePath, ".restore"));
    return true;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  if (basename(homePath) !== "home") return false;
  for (const name of ["manifest.json", "backup-operation.json"]) {
    try {
      await lstat(join(dirname(homePath), name));
      return true;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
  return false;
}

// packages/companion/src/home/qq.ts
var invalid = (code2) => {
  throw Object.assign(new Error(code2), { code: code2 });
};
function QQConnectionId(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) return invalid("INVALID_QQ_CONNECTION");
  return value;
}
function QQAccountId(value) {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,19}$/.test(value)) return invalid("INVALID_QQ_ACCOUNT");
  return value;
}
function QQPeerId(value) {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,19}$/.test(value)) return invalid("INVALID_QQ_PEER");
  return value;
}
function QQMessageId(value) {
  if (typeof value !== "string" || !/^[-]?(?:0|[1-9][0-9]{0,19})$/.test(value) || value === "-0") return invalid("INVALID_QQ_MESSAGE_ID");
  return value;
}
function admitQQInputSource(value) {
  if (!plainExact(value, ["connectionId", "accountId", "peerId", "direction", "messageId"]) || value.direction !== "incoming") return invalid("INVALID_QQ_SOURCE");
  return { connectionId: QQConnectionId(value.connectionId), accountId: QQAccountId(value.accountId), peerId: QQPeerId(value.peerId), direction: "incoming", messageId: QQMessageId(value.messageId) };
}
function plainExact(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).length !== keys.length) return false;
  return keys.every((key2) => {
    const field = Object.getOwnPropertyDescriptor(value, key2);
    return !!field && "value" in field;
  });
}
function validateBindQQ(value) {
  if (!plainExact(value, ["kind", "operationId", "connectionId", "accountId", "peerId", "expectedBindingVersion", "expectedRevision"])) return false;
  try {
    QQConnectionId(value.connectionId);
    QQAccountId(value.accountId);
    QQPeerId(value.peerId);
  } catch {
    return false;
  }
  return value.kind === "bind-qq" && value.accountId !== value.peerId && typeof value.expectedBindingVersion === "number" && Number.isSafeInteger(value.expectedBindingVersion) && value.expectedBindingVersion >= 0 && typeof value.expectedRevision === "number" && Number.isSafeInteger(value.expectedRevision) && value.expectedRevision >= 1;
}
function admitQQBinding(value, roleId) {
  if (!plainExact(value, ["bindingId", "version", "connectionId", "accountId", "peerId", "activatedRevision"]) || value.bindingId !== "qq-" + roleId || value.accountId === value.peerId) return invalid("INVALID_QQ_BINDING");
  return { bindingId: BindingId(value.bindingId), version: BindingVersion(value.version), connectionId: QQConnectionId(value.connectionId), accountId: QQAccountId(value.accountId), peerId: QQPeerId(value.peerId), activatedRevision: HomeRevision(value.activatedRevision) };
}

// packages/companion/src/home/context-tools.ts
var contextObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);
var contextField = (value, name) => contextObject(value) ? value[name] : void 0;
function contextToolParts(attempt, conversation) {
  const turn = conversation.turns.find((turn2) => turn2.runId === attempt.runId);
  if (!turn) throw new HomeError("CONTEXT_SOURCE_INCOMPLETE");
  const data = attempt.outcome?.data, request = contextField(data, "request"), name = contextField(request, "name"), rawFinal = contextField(contextField(data, "result"), "final");
  const final = contextObject(rawFinal) ? rawFinal : void 0;
  const canonical = !!final && final.provenance !== "synthetic-native" && final.canonicalValue !== "unavailable" && Array.isArray(final.content) && (final.isError === false && Object.hasOwn(final, "value") || final.isError === true && contextObject(final.error));
  const gap = conversation.nativeRecords.some((record) => record.runId === attempt.runId && contextField(record.data, "attemptId") === attempt.attemptId && ["sdk-spill-gap", "native-exposure-gap"].includes(String(contextField(record.data, "kind"))));
  const complete = canonical && !!attempt.observation && typeof name === "string" && contextObject(request) && Object.hasOwn(request, "arguments") && !gap;
  return { turn, request, name: typeof name === "string" ? name : "unknown", final, canonical, complete };
}
function confirmedToolCanonical(attempt, conversation) {
  const parts = contextToolParts(attempt, conversation), native = contextField(parts.request, "native"), session = contextField(native, "sessionId"), seq = contextField(native, "callSeq");
  if (!parts.complete || attempt.outcome?.kind !== "completed" || parts.final?.isError !== false || typeof session !== "string" || typeof seq !== "number") return;
  return conversation.nativeRecords.find((record) => record.runId === attempt.runId && record.provenance === "tools-result" && record.nativeId === session + ":final:" + seq && contextField(record.data, "association") === "issued-execution" && contextField(record.data, "callSeq") === seq && contextField(record.data, "name") === parts.name && JSON.stringify(contextField(record.data, "arguments")) === JSON.stringify(contextField(parts.request, "arguments")) && JSON.stringify(contextField(record.data, "result")) === JSON.stringify(parts.final));
}

// packages/companion/src/home/knowledge.ts
function admitProposedKnowledge(record) {
  if (record.ownerAction !== void 0 || record.proposalId === void 0) invalid2();
  return { ...record, knowledgeId: KnowledgeId(record.knowledgeId), version: KnowledgeVersion(record.version), proposalId: ProposalId(record.proposalId), committedRevision: HomeRevision(record.committedRevision) };
}
var emptyKnowledge = () => ({ proposals: [], versions: [] });
function invalid2() {
  throw new HomeError("INVALID_ROLE_PROPOSE");
}
var nonempty = (value) => typeof value === "string" && !!value.trim() && !value.includes("\0");
function admitProposalRef(value) {
  if (plainExact(value, ["kind"]) && value.kind === "core") return { kind: "core" };
  if (plainExact(value, ["kind", "id", "version"]) && value.kind === "knowledge" && Number(value.version) > 0) return { kind: "knowledge", id: KnowledgeId(value.id), version: KnowledgeVersion(value.version) };
  if (!plainExact(value, ["kind", "id"])) return invalid2();
  if (value.kind === "input") return { kind: "input", id: InputId(value.id) };
  if (value.kind === "reply") return { kind: "reply", id: ReplyId(value.id) };
  if (value.kind === "tool") return { kind: "tool", id: AttemptId(value.id) };
  return invalid2();
}
function admitSourceBasis(value) {
  if (!plainExact(value, ["ref", "contentDigest", ...["committedRevision", "currentRun"].filter((key2) => !!value && typeof value === "object" && Object.hasOwn(value, key2))]) || typeof value.contentDigest !== "string" || !/^[0-9a-f]{64}$/.test(value.contentDigest)) return invalid2();
  const ref = admitProposalRef(value.ref), committedRevision = Object.hasOwn(value, "committedRevision") ? HomeRevision(value.committedRevision) : void 0, origin = Object.hasOwn(value, "currentRun") ? value.currentRun : void 0;
  if (origin !== void 0 && (!plainExact(origin, ["runId", "initialRevision"]) || ref.kind !== "tool" || committedRevision === void 0 || committedRevision <= Number(origin.initialRevision))) return invalid2();
  return { ref, contentDigest: value.contentDigest, ...committedRevision !== void 0 ? { committedRevision } : {}, ...origin ? { currentRun: { runId: RunId(origin.runId), initialRevision: HomeRevision(origin.initialRevision) } } : {} };
}
function knowledgeSourceBasis(source) {
  return { ref: source.ref, contentDigest: source.contentDigest, ..."committedRevision" in source && source.committedRevision !== void 0 ? { committedRevision: source.committedRevision } : {}, ..."currentRun" in source && source.currentRun ? { currentRun: source.currentRun } : {} };
}
function parseKnowledgeProposal(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid2();
  const kind = contextField(value, "kind"), extra = kind === "growth" ? ["area", "phase"] : kind === "goal" ? ["state"] : kind === "activity" ? ["decision", ...Object.hasOwn(value, "restMs") ? ["restMs"] : []] : kind === "contact" && Object.hasOwn(value, "intentId") ? ["intentId"] : [];
  if (!plainExact(value, ["kind", "topic", "expectedVersion", "text", "statement", "sources", "scope", "reason", ...extra, ...["targetId", "relation"].filter((key2) => Object.hasOwn(value, key2))]) || !["memory", "growth", "summary", "goal", "activity", "contact"].includes(String(kind)) || !nonempty(value.topic) || !nonempty(value.text) || !nonempty(value.scope) || !nonempty(value.reason) || !["user-report", "role-choice", "external-observation", "tentative"].includes(String(value.statement)) || !Array.isArray(value.sources) || !value.sources.length) invalid2();
  const expectedVersion = KnowledgeVersion(value.expectedVersion), targetId = Object.hasOwn(value, "targetId") ? KnowledgeId(value.targetId) : void 0;
  if (!!targetId !== expectedVersion > 0) invalid2();
  const relation = Object.hasOwn(value, "relation") ? value.relation : void 0;
  if (relation !== void 0 && (!plainExact(relation, ["kind", "targetId", "version"]) || !["correction", "replacement"].includes(String(relation.kind)) || !targetId || relation.targetId !== targetId || relation.version !== expectedVersion)) invalid2();
  const sources = value.sources.map((source) => {
    if (!plainExact(source, ["ref", "quote"]) || !nonempty(source.quote)) return invalid2();
    return { ref: admitProposalRef(source.ref), quote: source.quote };
  });
  if (new Set(sources.map((source) => JSON.stringify(source.ref))).size !== sources.length) invalid2();
  const base = { topic: value.topic, ...targetId ? { targetId } : {}, expectedVersion, text: value.text, statement: value.statement, sources, scope: value.scope, reason: value.reason, ...relation ? { relation: { kind: relation.kind, targetId: KnowledgeId(relation.targetId), version: KnowledgeVersion(relation.version) } } : {} };
  if (kind === "memory" || kind === "summary") return { ...base, kind };
  if (kind === "growth" && ["interest", "preference", "relationship", "habit"].includes(String(value.area)) && ["exploring", "stable"].includes(String(value.phase))) return { ...base, kind, area: value.area, phase: value.phase };
  if (kind === "goal" && ["planned", "in-progress", "paused", "completed", "abandoned"].includes(String(value.state))) return { ...base, kind, state: value.state };
  if (kind === "activity" && ["continue", "switch-interest", "rest"].includes(String(value.decision)) && (value.decision === "rest" ? Number.isSafeInteger(value.restMs) && Number(value.restMs) > 0 : !Object.hasOwn(value, "restMs"))) return { ...base, kind, decision: value.decision, ...value.decision === "rest" ? { restMs: Number(value.restMs) } : {} };
  if (kind === "contact") return { ...base, kind, ...Object.hasOwn(value, "intentId") ? { intentId: IntentId(value.intentId) } : {} };
  return invalid2();
}
function proposalQuotePresent(source, quote) {
  if (source.text === quote) return true;
  if (source.ref.kind !== "tool" && source.ref.kind !== "knowledge") return source.text.includes(quote);
  try {
    const envelope = JSON.parse(source.text), values = source.ref.kind === "knowledge" ? [envelope] : [contextField(contextField(envelope, "observation"), "value"), contextField(contextField(envelope, "final"), "value"), ..."toolName" in source && source.toolName === "role_propose" ? [contextField(contextField(envelope, "request"), "arguments")] : []];
    while (values.length) {
      const value = values.pop();
      if (typeof value === "string") {
        if (value.includes(quote)) return true;
      } else if (Array.isArray(value)) values.push(...value);
      else if (value && typeof value === "object") values.push(...Object.values(value));
    }
    return false;
  } catch {
    return false;
  }
}
function assessKnowledgeProposal(value, sources, inputs) {
  const basis = sources.map(knowledgeSourceBasis), result = (status, reason) => ({ status, reason, sources: basis });
  if (sources.length !== value.sources.length || sources.some((source, index) => JSON.stringify(source.ref) !== JSON.stringify(value.sources[index].ref) || !proposalQuotePresent(source, value.sources[index].quote))) return result("pending-review", "SOURCE_QUOTE_MISMATCH");
  if (sources.some((source) => !source.availableForDaily || source.completeness !== "complete")) return result("pending-review", "SOURCE_UNAVAILABLE_FOR_DAILY");
  if (value.kind === "memory") return directUserReport(value, inputs) ? result("adopt", "EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH") : value.statement === "external-observation" && sources.length === 1 && sources[0].ref.kind === "tool" && !sources[0].derivedRead && value.text === sources[0].text ? result("adopt", "EXTRACTIVE_EXTERNAL_OBSERVATION_NOT_WORLD_TRUTH") : result("pending-review", "SEMANTIC_REVIEW_REQUIRED");
  if (value.kind === "summary") return value.statement === "tentative" && value.text === value.sources.map((source) => source.quote).join("\n") ? result("adopt", "EXTRACTIVE_SUMMARY_NOT_INDEPENDENT_EVIDENCE") : result("pending-review", "SUMMARY_INTERPRETATION_UNREVIEWED");
  if (value.statement !== "role-choice") return result("pending-review", "ROLE_CHOICE_LABEL_REQUIRED");
  if (value.kind === "growth") {
    if (value.phase === "exploring") return result("adopt", "CURRENT_ROLE_EXPLORATION_NOT_USER_PREFERENCE");
    const raw = sources.filter((source) => source.ref.kind === "input" || source.ref.kind === "tool" && !source.derivedRead), runs = new Set(raw.flatMap((source) => "runId" in source && source.runId ? [source.runId] : [])), independent = new Set(raw.map((source) => source.contentDigest));
    return runs.size >= 2 && independent.size >= 2 ? result("adopt", "ROLE_CHOICE_WITH_CROSS_TURN_RAW_EVIDENCE") : result("pending-review", "CROSS_TURN_INDEPENDENT_EVIDENCE_REQUIRED");
  }
  if (value.kind === "goal") return ["planned", "paused", "abandoned"].includes(value.state) ? result("adopt", "CURRENT_GOAL_DECISION_NOT_COMPLETION") : result("pending-review", "ACTUAL_GOAL_PROGRESS_NOT_VERIFIED");
  return result("adopt", value.kind === "activity" ? "ACTIVITY_DECISION_ONLY_NO_AUTONOMOUS_ISSUANCE" : "CONTACT_PROPOSAL_ONLY_NO_DELIVERY");
}
function proposalClaim(value) {
  if (!plainExact(value, ["contextGeneration", "settingsVersion", ...Object.hasOwn(value, "autonomyRulesVersion") ? ["autonomyRulesVersion"] : [], ...Object.hasOwn(value, "inputSequence") ? ["inputSequence"] : [], ...Object.hasOwn(value, "proposalRulesVersion") ? ["proposalRulesVersion"] : [], ...Object.hasOwn(value, "initialRevision") ? ["initialRevision"] : [], ...Object.hasOwn(value, "sourceBasis") ? ["sourceBasis"] : []]) || value.inputSequence !== void 0 && (!Number.isSafeInteger(value.inputSequence) || value.inputSequence < 0) || value.autonomyRulesVersion !== void 0 && (!Number.isSafeInteger(value.autonomyRulesVersion) || value.autonomyRulesVersion < 1) || value.sourceBasis !== void 0 && !Array.isArray(value.sourceBasis)) invalid2();
  return { contextGeneration: ContextGeneration(value.contextGeneration), settingsVersion: ConversationVersion(value.settingsVersion), ...value.autonomyRulesVersion !== void 0 ? { autonomyRulesVersion: AutonomyRulesVersion(value.autonomyRulesVersion) } : {}, ...value.inputSequence !== void 0 ? { inputSequence: value.inputSequence } : {}, ...value.proposalRulesVersion !== void 0 ? { proposalRulesVersion: ProposalRulesVersion(value.proposalRulesVersion) } : {}, ...value.initialRevision !== void 0 ? { initialRevision: HomeRevision(value.initialRevision) } : {}, ...value.sourceBasis !== void 0 ? { sourceBasis: value.sourceBasis.map(admitSourceBasis) } : {} };
}
function unchangedKnowledge(value, previous) {
  const comparable = (proposal) => ({ kind: proposal.kind, topic: proposal.topic, text: proposal.text, statement: proposal.statement, sources: proposal.sources, scope: proposal.scope, ...proposal.kind === "growth" ? { area: proposal.area, phase: proposal.phase } : proposal.kind === "goal" ? { state: proposal.state } : proposal.kind === "activity" ? { decision: proposal.decision, ...proposal.restMs !== void 0 ? { restMs: proposal.restMs } : {} } : proposal.kind === "contact" && proposal.intentId ? { intentId: proposal.intentId } : {} });
  return JSON.stringify(comparable(value)) === JSON.stringify(comparable(previous));
}
function correctedSourceReused(value, state, describe) {
  if (!value.targetId) return false;
  const key2 = (ref) => JSON.stringify(ref), visiting = /* @__PURE__ */ new Set();
  const roots = (ref) => {
    const id = key2(ref);
    if (visiting.has(id)) return [];
    visiting.add(id);
    try {
      if (ref.kind === "input") return [ref];
      if (ref.kind === "knowledge") {
        const record = state.versions.find((record2) => record2.knowledgeId === ref.id && record2.version === ref.version);
        return record ? record.sources.flatMap((source) => roots(source.ref)) : [];
      }
      const lineage = describe(ref);
      if (ref.kind === "tool" && !lineage.derivedRead) return [ref];
      return (lineage.dataOrigins.length ? lineage.dataOrigins : lineage.dependencies).flatMap(roots);
    } finally {
      visiting.delete(id);
    }
  };
  const superseded = state.versions.filter((record) => record.knowledgeId === value.targetId && record.relation?.kind === "correction").flatMap((record) => state.versions.filter((old) => old.knowledgeId === record.relation.targetId && old.version === record.relation.version)).flatMap((record) => record.sources.flatMap((source) => roots(source.ref))), banned = new Set(superseded.map(key2)), offered = value.sources.flatMap((source) => roots(source.ref));
  return offered.length > 0 && offered.every((ref) => banned.has(key2(ref)));
}
function ownerActionSourceReused(value, state, describe) {
  if (!value.targetId) return false;
  const owner = state.versions.findLast((record) => record.knowledgeId === value.targetId && record.ownerAction);
  if (!owner) return false;
  const key2 = (ref) => JSON.stringify(ref), visiting = /* @__PURE__ */ new Set();
  const roots = (ref) => {
    const id = key2(ref);
    if (visiting.has(id)) return [];
    visiting.add(id);
    try {
      if (ref.kind === "input") return [ref];
      if (ref.kind === "knowledge") {
        const record = state.versions.find((record2) => record2.knowledgeId === ref.id && record2.version === ref.version);
        return record ? record.sources.flatMap((source) => roots(source.ref)) : [];
      }
      if (ref.kind !== "tool") return [];
      const lineage = describe(ref);
      return lineage.derivedRead ? lineage.dataOrigins.flatMap(roots) : [ref];
    } finally {
      visiting.delete(id);
    }
  };
  const reviewed = new Set(state.versions.filter((record) => record.knowledgeId === owner.knowledgeId && record.committedRevision <= owner.committedRevision).flatMap((record) => record.sources.flatMap((source) => roots(source.ref))).map(key2)), offered = value.sources.flatMap((source) => roots(source.ref));
  return !offered.length || offered.every((ref) => reviewed.has(key2(ref)));
}
function directUserReport(value, inputs) {
  const sameText = (left, right) => left.trimEnd() === right.trimEnd();
  return value.statement === "user-report" && value.sources.length > 0 && value.sources.every((source) => {
    const ref = source.ref;
    return ref.kind === "input" && inputs.some((input) => input.inputId === ref.id && sameText(input.text, source.quote) && sameText(value.text, input.text));
  });
}
function canonicalProposalSucceeded(attempt, record) {
  const data = attempt.outcome?.data;
  if (attempt.outcome?.kind !== "completed" || !data || typeof data !== "object" || !("request" in data) || !("result" in data) || !data.request || typeof data.request !== "object" || !("name" in data.request) || data.request.name !== "role_propose" || !data.result || typeof data.result !== "object" || !("final" in data.result) || !data.result.final || typeof data.result.final !== "object") return false;
  const final = data.result.final;
  if (!("isError" in final) || final.isError !== false || !("content" in final) || !Array.isArray(final.content) || !("value" in final) || !final.value || typeof final.value !== "object" || !("proposalId" in final.value) || final.value.proposalId !== record.proposalId) return false;
  return true;
}
function canonicalProposalRecorded(attempt, record, native) {
  const request = contextField(attempt.outcome?.data, "request"), association = contextField(request, "native"), seq = contextField(association, "callSeq"), session = contextField(association, "sessionId");
  return typeof session === "string" && typeof seq === "number" && native.some((entry) => {
    if (entry.runId !== record.runId || entry.provenance !== "tools-result" || entry.nativeId !== session + ":final:" + seq || contextField(entry.data, "association") !== "issued-execution" || contextField(entry.data, "name") !== "role_propose" || contextField(entry.data, "callSeq") !== seq) return false;
    try {
      if (JSON.stringify(parseKnowledgeProposal(contextField(entry.data, "arguments"))) !== JSON.stringify(record.value)) return false;
    } catch {
      return false;
    }
    const result = contextField(entry.data, "result");
    return contextField(result, "isError") === true || contextField(contextField(result, "value"), "proposalId") === record.proposalId;
  });
}

// packages/companion/src/home/knowledge-owner.ts
var invalid3 = () => {
  throw new HomeError("INVALID_KNOWLEDGE_ROLLBACK");
};
function knowledgeRollbackCommand(value) {
  if (!plainExact(value, ["operationId", "knowledgeId", "targetVersion", "expectedKnowledgeVersion", "expectedRevision", "reason"])) return invalid3();
  return parseKnowledgeRollback({ ...value, kind: "rollback-knowledge" });
}
function parseKnowledgeRollback(value) {
  if (!plainExact(value, ["kind", "operationId", "knowledgeId", "targetVersion", "expectedKnowledgeVersion", "expectedRevision", "reason"]) || value.kind !== "rollback-knowledge" || typeof value.reason !== "string" || !value.reason.trim() || value.reason.includes("\0")) return invalid3();
  const targetVersion = KnowledgeVersion(value.targetVersion), expectedKnowledgeVersion = KnowledgeVersion(value.expectedKnowledgeVersion);
  if (targetVersion < 1 || expectedKnowledgeVersion < 1) invalid3();
  return { kind: "rollback-knowledge", operationId: OperationId(value.operationId), knowledgeId: KnowledgeId(value.knowledgeId), targetVersion, expectedKnowledgeVersion, expectedRevision: HomeRevision(value.expectedRevision), reason: value.reason };
}
function rollbackKnowledgeBusiness(request) {
  return { kind: "rollback-knowledge", knowledgeId: request.knowledgeId, targetVersion: request.targetVersion, reason: request.reason };
}
function content(record) {
  const { knowledgeId, version: version2, committedRevision, sourceBasis, proposalId, ownerAction, rollbackOf, preservedCorrections, ...value } = record;
  return parseKnowledgeProposal(value);
}
function createKnowledgeRollback(state, command, revision, createdAt) {
  const request = parseKnowledgeRollback(command), current = state.versions.findLast((record) => record.knowledgeId === request.knowledgeId), target = state.versions.find((record) => record.knowledgeId === request.knowledgeId && record.version === request.targetVersion);
  if (!current || !target) throw new HomeError("KNOWLEDGE_VERSION_NOT_FOUND");
  if (current.version !== request.expectedKnowledgeVersion) throw new HomeError("KNOWLEDGE_VERSION_CONFLICT");
  if (typeof createdAt !== "string" || !Number.isFinite(Date.parse(createdAt))) invalid3();
  const candidates = [...state.versions.filter((record) => record.knowledgeId === current.knowledgeId && record.version > target.version && record.relation?.kind === "correction").map((record) => ({ kind: "knowledge", id: record.knowledgeId, version: record.version })), ...current.preservedCorrections ?? [], ...target.preservedCorrections ?? []];
  const preservedCorrections = [...new Map(candidates.map((ref) => [JSON.stringify(ref), ref])).values()].sort((left, right) => left.version - right.version);
  return { ...content(target), ...target.sourceBasis ? { sourceBasis: structuredClone(target.sourceBasis) } : {}, knowledgeId: current.knowledgeId, version: KnowledgeVersion(current.version + 1), committedRevision: revision, ownerAction: { kind: "rollback", operationId: request.operationId, fromVersion: current.version, reason: request.reason, createdAt }, rollbackOf: { knowledgeId: target.knowledgeId, version: target.version }, preservedCorrections };
}
function activeKnowledgeVersions(state) {
  const latest = /* @__PURE__ */ new Map();
  for (const record of state.versions) latest.set(record.knowledgeId, record);
  const active = /* @__PURE__ */ new Map();
  const include = (record) => {
    const key2 = record.knowledgeId + ":" + record.version;
    if (active.has(key2)) return;
    active.set(key2, record);
    for (const ref of record.preservedCorrections ?? []) {
      const correction = state.versions.find((candidate) => candidate.knowledgeId === ref.id && candidate.version === ref.version);
      if (correction) include(correction);
    }
  };
  for (const record of latest.values()) include(record);
  return [...active.values()];
}
function knowledgeSourceRequirements(record) {
  return [...record.sources.map((source) => source.ref), ...record.preservedCorrections ?? []];
}
function rollbackKnowledgePair(record, state, requirements = knowledgeSourceRequirements) {
  const refs = /* @__PURE__ */ new Map();
  const include = (ref) => {
    const key2 = JSON.stringify(ref);
    if (refs.has(key2)) return;
    refs.set(key2, ref);
    if (ref.kind === "knowledge") {
      const version2 = state.versions.find((candidate) => candidate.knowledgeId === ref.id && candidate.version === ref.version);
      if (version2) for (const source of requirements(version2)) include(source);
    }
  };
  include({ kind: "knowledge", id: record.knowledgeId, version: record.version });
  return [...refs.values()];
}

// packages/companion/src/home/proposal-rules.ts
var proposalRulesDefaults = Object.freeze({ maxRestSuggestionMs: 864e5 });
function validateProposalRules(value) {
  return plainExact(value, ["maxRestSuggestionMs"]) && typeof value.maxRestSuggestionMs === "number" && Number.isSafeInteger(value.maxRestSuggestionMs) && value.maxRestSuggestionMs >= 1 && value.maxRestSuggestionMs <= 2147483647;
}
var initialProposalRules = () => ({ version: ProposalRulesVersion(1), value: proposalRulesDefaults });

// packages/companion/src/home/context-digest.ts
import { createHash } from "node:crypto";
var contextTextDigest = (text2) => createHash("sha256").update(text2, "utf8").digest("hex");

// packages/companion/src/home/file-access.ts
var fileAccessDefaults = Object.freeze({ works: "read-write", journal: "read-write", grants: Object.freeze([]) });
var initialFileAccess = () => ({ version: FileAccessVersion(1), value: fileAccessDefaults });
var exact = (value, keys) => !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).length === keys.length && keys.every((key2) => {
  const item = Object.getOwnPropertyDescriptor(value, key2);
  return !!item && "value" in item;
});
function validateFileAccess(value) {
  if (!exact(value, ["works", "journal", "grants"]) || typeof value.works !== "string" || !["none", "read-only", "read-write"].includes(value.works) || typeof value.journal !== "string" || !["none", "read-only", "read-write"].includes(value.journal) || !Array.isArray(value.grants) || Object.getPrototypeOf(value.grants) !== Array.prototype || value.grants.length > 64 || Reflect.ownKeys(value.grants).length !== value.grants.length + 1) return false;
  const ids = /* @__PURE__ */ new Set();
  for (let index = 0; index < value.grants.length; index++) {
    const item = Object.getOwnPropertyDescriptor(value.grants, String(index));
    if (!item || !("value" in item) || !exact(item.value, ["grantId", "mode"]) || item.value.mode !== "read-only" && item.value.mode !== "read-write") return false;
    let id;
    try {
      id = FileGrantId(item.value.grantId);
    } catch {
      return false;
    }
    if (ids.has(id)) return false;
    ids.add(id);
  }
  return true;
}
function admitFileAccess(value) {
  return { works: value.works, journal: value.journal, grants: value.grants.map((grant) => ({ grantId: FileGrantId(grant.grantId), mode: grant.mode })) };
}
function archivedFileContentAllowed(book, scope) {
  if (!validateFileAccess(book)) return false;
  if (scope === "works" || scope === "journal") return book[scope] !== "none";
  if (typeof scope !== "string" || !scope.startsWith("grant:")) return false;
  let id;
  try {
    id = FileGrantId(scope.slice(6));
  } catch {
    return false;
  }
  return book.grants.some((grant) => grant.grantId === id);
}
function validateEditFileAccess(value) {
  if (!exact(value, ["kind", "operationId", "value", "expectedFileAccessVersion", "expectedRevision"]) || value.kind !== "edit-file-access" || !validateFileAccess(value.value)) return false;
  try {
    OperationId(value.operationId);
    FileAccessVersion(value.expectedFileAccessVersion);
    HomeRevision(value.expectedRevision);
  } catch {
    return false;
  }
  return true;
}

// packages/companion/src/home/context-lineage.ts
function contextBindingAllowed(snapshot, id, version2) {
  return id === snapshot.panelBinding.bindingId && version2 === snapshot.panelBinding.bindingVersion || snapshot.qqBinding?.bindingId === id && snapshot.qqBinding.version === version2;
}
var refKey = (ref) => ref.kind === "core" ? "core" : ref.kind + ":" + ref.id + (ref.kind === "knowledge" ? ":" + ref.version : "");
var sameReportText = (left, right) => left.trimEnd() === right.trimEnd();
function createContextLineage(snapshot, conversation) {
  const activeKnowledge = activeKnowledgeVersions(conversation.knowledge);
  const attempts = conversation.attempts, index = new Map(attempts.map((attempt, index2) => [attempt.attemptId, index2])), cache = /* @__PURE__ */ new Map(), intrinsic = /* @__PURE__ */ new Map(), visiting = /* @__PURE__ */ new Set();
  const request = (attempt) => contextField(attempt.outcome?.data, "request");
  const session = (attempt) => attempt.kind === "model" ? contextField(request(attempt), "sessionId") : contextField(contextField(request(attempt), "native"), "sessionId");
  const sameSession = (left, right) => typeof session(left) !== "string" || typeof session(right) !== "string" || session(left) === session(right);
  const contributesToolEvidence = (attempt) => attempt.kind === "tool" && attempt.outcome?.kind !== "not-dispatched";
  const turnFor = (runId) => conversation.turns.find((turn) => turn.runId === runId);
  const unique = (refs) => [...new Map(refs.map((ref) => [refKey(ref), ref])).values()];
  function sourceRef(value) {
    if (!contextObject(value)) return;
    if (value.kind === "core") return { kind: "core" };
    if (value.kind === "knowledge") {
      const record = conversation.knowledge.versions.find((record2) => record2.knowledgeId === value.id && record2.version === value.version);
      if (record) return { kind: "knowledge", id: record.knowledgeId, version: record.version };
    }
    if (value.kind === "input") {
      const input = snapshot.inputs.find((input2) => input2.inputId === value.id);
      if (input) return { kind: "input", id: input.inputId };
    }
    if (value.kind === "reply") {
      const reply = conversation.replies.find((reply2) => reply2.replyId === value.id);
      if (reply) return { kind: "reply", id: reply.replyId };
    }
    if (value.kind === "tool") {
      const attempt = attempts.find((attempt2) => attempt2.kind === "tool" && attempt2.attemptId === value.id);
      if (attempt) return { kind: "tool", id: attempt.attemptId };
    }
  }
  function frameRefs(model, kind) {
    const manifest2 = model ? contextField(request(model), "contextManifest") : void 0, raw = contextField(manifest2, kind);
    if (Array.isArray(raw)) {
      const refs = raw.map(sourceRef);
      return { refs: refs.filter((ref) => !!ref), known: refs.every(Boolean) };
    }
    if (kind === "granted") return { refs: [], known: false };
    const inputIds = contextField(manifest2, "inputIds");
    if (Array.isArray(inputIds)) {
      const refs = inputIds.map((id) => sourceRef({ kind: "input", id }));
      return { refs: refs.filter((ref) => !!ref), known: refs.every(Boolean) };
    }
    return { refs: [], known: true };
  }
  function modelsBefore(runId, limit, anchor) {
    return attempts.filter((model) => model.kind === "model" && model.runId === runId && (index.get(model.attemptId) ?? 0) < limit && (!anchor || sameSession(model, anchor)));
  }
  function toolOrigins(attempt, model) {
    const parts = contextToolParts(attempt, conversation);
    if (parts.name === "role_propose") {
      const proposal = conversation.knowledge.proposals.find((p) => p.attemptId === attempt.attemptId);
      return { refs: proposal?.value.sources.map((source) => source.ref) ?? [], known: !!proposal, scopeBounded: false };
    }
    if (parts.name !== "role_read") return { refs: [], known: true, scopeBounded: false };
    const args = contextField(parts.request, "arguments");
    if (!contextObject(args)) return { refs: [], known: false, scopeBounded: false };
    if (args.source === "core") return { refs: [], known: true, scopeBounded: false };
    if (args.source === "knowledge") {
      const ref = sourceRef({ kind: "knowledge", id: args.id, version: args.version });
      return { refs: ref ? [ref] : [], known: !!ref, scopeBounded: false };
    }
    if (args.source === "input" || args.source === "reply" || args.source === "tool") {
      const ref = sourceRef({ kind: args.source, id: args.id });
      return { refs: ref ? [ref] : [], known: !!ref, scopeBounded: false };
    }
    if (args.source === "experience") {
      const input = snapshot.inputs.find((input2) => input2.experienceId === args.id);
      const reply = conversation.replies.find((reply2) => reply2.experienceId === args.id);
      return { refs: input ? [{ kind: "input", id: input.inputId }] : reply ? [{ kind: "reply", id: reply.replyId }] : [], known: !!input || !!reply, scopeBounded: false };
    }
    if (args.source === "material") {
      const parent = attempts.find((parent2) => parent2.kind === "tool" && parent2.materials?.some((material) => material.materialId === args.id));
      return { refs: parent ? [{ kind: "tool", id: parent.attemptId }] : [], known: !!parent, scopeBounded: false };
    }
    if (args.source === "query") {
      const value = attempt.observation?.kind === "returned" ? attempt.observation.value : void 0;
      if (contextField(value, "offset") === 0 && contextField(value, "more") === false && typeof contextField(value, "text") === "string") try {
        const data = JSON.parse(String(contextField(value, "text"))), raw = contextField(data, "sources");
        if (Array.isArray(raw)) {
          const refs = raw.map((source) => sourceRef(contextField(source, "ref")));
          return { refs: refs.filter((ref) => !!ref), known: refs.every(Boolean), scopeBounded: false };
        }
      } catch {
      }
      const granted = frameRefs(model, "granted");
      return { refs: granted.refs, known: granted.known, scopeBounded: true };
    }
    return { refs: [], known: false, scopeBounded: false };
  }
  function knowledgeRequirements(record) {
    const required = knowledgeSourceRequirements(record);
    if (record.kind !== "memory" || record.statement !== "user-report" || record.sources.length < 2 || !record.sources.every((source) => source.ref.kind === "input" && sameReportText(source.quote, record.text))) return required;
    const complete = record.sources.filter((source) => {
      const ref = source.ref;
      if (ref.kind !== "input") return false;
      const input = snapshot.inputs.find((input2) => input2.inputId === ref.id);
      return !!input && sameReportText(input.text, record.text) && describe(ref).availableForDaily && record.sourceBasis?.some((basis) => refKey(basis.ref) === refKey(ref) && basis.contentDigest === contextTextDigest(input.text));
    });
    return complete.length ? [...complete.map((source) => source.ref), ...record.preservedCorrections ?? []] : required;
  }
  function independentUserReport(record) {
    return record.kind === "memory" && record.statement === "user-report" && record.sources.every((source) => source.ref.kind === "input" && sameReportText(source.quote, record.text)) && record.sources.some((source) => {
      const ref = source.ref;
      if (ref.kind !== "input") return false;
      const input = snapshot.inputs.find((input2) => input2.inputId === ref.id);
      return !!input && sameReportText(input.text, record.text) && describe(ref).availableForDaily && !!record.sourceBasis?.some((basis) => refKey(basis.ref) === refKey(ref) && basis.contentDigest === contextTextDigest(input.text));
    });
  }
  function knowledgeOrigin(record) {
    const required = knowledgeRequirements(record);
    if (independentUserReport(record)) return { refs: [...required], models: [], known: true, available: true };
    let original = record;
    const owners = /* @__PURE__ */ new Set();
    while (original?.ownerAction) {
      const key2 = refKey({ kind: "knowledge", id: original.knowledgeId, version: original.version });
      if (owners.has(key2)) return { refs: [...required], models: [], known: false, available: false };
      owners.add(key2);
      const target = original.rollbackOf;
      original = conversation.knowledge.versions.find((previous) => previous.knowledgeId === target.knowledgeId && previous.version === target.version);
    }
    const proposal = original?.proposalId ? conversation.knowledge.proposals.find((proposal2) => proposal2.proposalId === original.proposalId) : void 0;
    const attempt = proposal && attempts.find((attempt2) => attempt2.kind === "tool" && attempt2.attemptId === proposal.attemptId), turn = attempt && turnFor(attempt.runId);
    if (!attempt || !proposal || !turn) return { refs: [...required], models: [], known: false, available: false };
    const models = modelsBefore(attempt.runId, index.get(attempt.attemptId) ?? 0, attempt), refs = [...required, ...turn.inputIds.map((id) => ({ kind: "input", id }))];
    let known = true;
    for (const model of models) {
      const used = frameRefs(model, "selected");
      refs.push(...used.refs);
      known &&= used.known;
    }
    refs.push(...attempts.filter((prior) => contributesToolEvidence(prior) && prior.runId === attempt.runId && (index.get(prior.attemptId) ?? 0) < (index.get(attempt.attemptId) ?? 0) && sameSession(prior, attempt)).map((prior) => ({ kind: "tool", id: prior.attemptId })));
    const historical = /* @__PURE__ */ new Map(), checking = /* @__PURE__ */ new Set(), expanding = /* @__PURE__ */ new Set(), expanded = /* @__PURE__ */ new Map();
    const ownEarlier = (ref) => ref.kind === "knowledge" && ref.id === record.knowledgeId && ref.version < record.version;
    const hasEarlier = (ref) => {
      const key2 = refKey(ref), found = historical.get(key2);
      if (found !== void 0) return found;
      if (ownEarlier(ref)) return true;
      if (checking.has(key2)) return false;
      checking.add(key2);
      const foundEarlier = describe(ref).dependencies.some(hasEarlier);
      checking.delete(key2);
      historical.set(key2, foundEarlier);
      return foundEarlier;
    };
    const protectedRef = (ref) => record.preservedCorrections?.some((correction) => refKey(correction) === refKey(ref));
    const contentRefs = (ref) => {
      const key2 = refKey(ref);
      if (key2 === refKey({ kind: "knowledge", id: record.knowledgeId, version: record.version })) {
        known = false;
        return [];
      }
      const cached = expanded.get(key2);
      if (cached) return [...cached];
      if (protectedRef(ref) || !hasEarlier(ref)) {
        const result2 = [ref];
        expanded.set(key2, result2);
        return result2;
      }
      if (expanding.has(key2)) {
        known = false;
        return [ref];
      }
      expanding.add(key2);
      const source = describe(ref), facts = intrinsic.get(key2), prior = ref.kind === "tool" ? conversation.knowledge.proposals.find((p) => p.attemptId === ref.id)?.processing : void 0;
      const previousProposal = prior?.knowledgeId === record.knowledgeId && typeof prior.version === "number" && prior.version < record.version;
      const result = unique(facts?.available && (facts.current || ownEarlier(ref) || previousProposal) ? source.dependencies.flatMap(contentRefs) : [ref]);
      expanding.delete(key2);
      expanded.set(key2, result);
      return [...result];
    };
    return { refs: unique(refs.flatMap(contentRefs)), models, known, available: !attempt.cleanup && !proposal.cleanup && contextToolParts(attempt, conversation).complete && contextBindingAllowed(snapshot, turn.bindingId, turn.bindingVersion) };
  }
  function describe(ref) {
    const key2 = refKey(ref), found = cache.get(key2);
    if (found) return found;
    const unavailable = { dependencies: [], dataOrigins: [], modelAttempts: [], lineage: "unavailable", derivedRead: false, availableForDaily: false };
    if (visiting.has(key2)) return unavailable;
    visiting.add(key2);
    let dependencies = [], dataOrigins = [], models = [], known = true, base = true, current = true, scopeBounded = false, derivedRead = false;
    if (ref.kind === "knowledge") {
      const record = conversation.knowledge.versions.find((record2) => record2.knowledgeId === ref.id && record2.version === ref.version);
      base = !!record && !record.cleanup;
      current = !!record && activeKnowledge.includes(record);
      if (record) {
        if (record.sources.some((source) => source.ref.kind === "core")) base &&= record.sourceBasis?.some((source) => source.ref.kind === "core" && source.contentDigest === contextTextDigest(snapshot.core.text)) ?? false;
        const origin = knowledgeOrigin(record);
        base &&= origin.available;
        known &&= origin.known;
        models = origin.models;
        dependencies.push(...origin.refs);
        dataOrigins = record.sources.map((source) => source.ref);
        derivedRead = record.kind === "summary";
      }
    } else if (ref.kind === "input") {
      const input = snapshot.inputs.find((input2) => input2.inputId === ref.id);
      base = !!input && contextBindingAllowed(snapshot, input.bindingId, input.bindingVersion) && (input.status === "resolved" || input.status === "running");
    } else if (ref.kind === "reply") {
      const reply = conversation.replies.find((reply2) => reply2.replyId === ref.id), turn = reply && turnFor(reply.runId);
      base = !!reply && !reply.cleanup && !!turn && contextBindingAllowed(snapshot, reply.bindingId, reply.bindingVersion);
      if (turn) {
        dependencies.push(...turn.inputIds.map((id) => ({ kind: "input", id })));
        const last = attempts.findLast((model) => model.kind === "model" && model.runId === turn.runId);
        models = modelsBefore(turn.runId, Number.MAX_SAFE_INTEGER, last);
        for (const model of models) {
          const used = frameRefs(model, "selected");
          dependencies.push(...used.refs);
          known &&= used.known;
        }
        const before = last ? index.get(last.attemptId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        dependencies.push(...attempts.filter((tool) => contributesToolEvidence(tool) && tool.runId === turn.runId && (index.get(tool.attemptId) ?? 0) < before && (!last || sameSession(tool, last))).map((tool) => ({ kind: "tool", id: tool.attemptId })));
      }
    } else if (ref.kind === "tool") {
      const attempt = attempts.find((attempt2) => attempt2.kind === "tool" && attempt2.attemptId === ref.id);
      if (!attempt) base = false;
      else {
        const parts = contextToolParts(attempt, conversation);
        base = parts.complete && contextBindingAllowed(snapshot, parts.turn.bindingId, parts.turn.bindingVersion);
        if (parts.name === "role_file") base &&= archivedFileContentAllowed(conversation.fileAccess.value, contextField(contextField(parts.request, "arguments"), "scope"));
        dependencies.push(...parts.turn.inputIds.map((id) => ({ kind: "input", id })));
        models = modelsBefore(attempt.runId, index.get(attempt.attemptId) ?? 0, attempt);
        for (const model of models) {
          const used = frameRefs(model, "selected");
          dependencies.push(...used.refs);
          known &&= used.known;
        }
        dependencies.push(...attempts.filter((tool) => contributesToolEvidence(tool) && tool.runId === attempt.runId && (index.get(tool.attemptId) ?? 0) < (index.get(attempt.attemptId) ?? 0) && sameSession(tool, attempt)).map((tool) => ({ kind: "tool", id: tool.attemptId })));
        if (parts.name === "role_propose") {
          const proposal = conversation.knowledge.proposals.find((p) => p.attemptId === attempt.attemptId), processed = proposal?.processing;
          base &&= !!processed && ["adopted", "unchanged"].includes(processed.status);
          current = !conversation.knowledge.versions.some((version2) => version2.knowledgeId === processed?.knowledgeId && version2.version > (processed?.version ?? 0));
          if (processed?.knowledgeId && processed.version) dependencies.push({ kind: "knowledge", id: processed.knowledgeId, version: processed.version });
        }
        const origins = toolOrigins(attempt, models.at(-1));
        dataOrigins = origins.scopeBounded ? [] : origins.refs;
        dependencies.push(...origins.refs);
        known &&= origins.known;
        if (parts.name === "role_read" && attempt.observation?.kind === "returned") {
          const qualifiers = contextField(attempt.observation.value, "qualifiers");
          if (typeof qualifiers === "string") try {
            const parsed = JSON.parse(qualifiers), sources = contextField(parsed, "sources");
            if (!Array.isArray(sources)) known = false;
            else {
              const refs = sources.map((source) => sourceRef(contextField(source, "ref")));
              known &&= refs.every(Boolean);
              const qualified = refs.filter((ref2) => !!ref2);
              dependencies.push(...qualified);
              dataOrigins = [...dataOrigins, ...qualified];
            }
          } catch {
            known = false;
          }
        }
        scopeBounded = origins.scopeBounded;
        derivedRead = parts.name === "role_read" || parts.name === "role_propose" || parts.name === "role_file";
      }
    }
    dependencies = unique(dependencies);
    intrinsic.set(key2, { available: base && known, current });
    const result = { dependencies, dataOrigins: unique(dataOrigins), modelAttempts: models.map((model) => model.attemptId), lineage: known ? scopeBounded ? "scope-bounded" : "known" : "unavailable", derivedRead, availableForDaily: base && current && known && dependencies.every((dependency) => describe(dependency).availableForDaily) };
    visiting.delete(key2);
    cache.set(key2, result);
    return result;
  }
  const frameCache = /* @__PURE__ */ new Map();
  function frameSources(runId) {
    const key2 = String(runId), found = frameCache.get(key2);
    if (found) return found;
    const refs = unique(attempts.filter((attempt) => attempt.kind === "model" && attempt.runId === runId).flatMap((attempt) => frameRefs(attempt, "selected").refs));
    frameCache.set(key2, refs);
    return refs;
  }
  return { describe, frameSources };
}

// packages/companion/src/home/file-rules.ts
var fileRulesDefaults = Object.freeze({ maxTextBytes: 1048576, listPageSize: 200, recursiveEntries: 1e3, operationTimeoutMs: 1e4 });
var fileRulesMaximums = Object.freeze({ maxTextBytes: 1048576, listPageSize: 1e3, recursiveEntries: 1e3, operationTimeoutMs: 2147483647 });
function validateFileRules(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).length !== 4 || Object.keys(value).sort().join("|") !== "listPageSize|maxTextBytes|operationTimeoutMs|recursiveEntries") return false;
  for (const key2 of ["maxTextBytes", "listPageSize", "recursiveEntries", "operationTimeoutMs"]) {
    const d = Object.getOwnPropertyDescriptor(value, key2);
    if (!d || !("value" in d) || typeof d.value !== "number" || !Number.isSafeInteger(d.value) || d.value < 1 || d.value > fileRulesMaximums[key2]) return false;
  }
  return true;
}
var initialFileRules = () => ({ version: FileRulesVersion(1), value: fileRulesDefaults });

// packages/companion/src/home/context-snapshot.ts
function key(ref) {
  if (ref?.kind === "core" && Object.keys(ref).join("|") === "kind") return "core";
  if (ref?.kind === "input" && Object.keys(ref).sort().join("|") === "id|kind") return "input:" + InputId(ref.id);
  if (ref?.kind === "reply" && Object.keys(ref).sort().join("|") === "id|kind") return "reply:" + ReplyId(ref.id);
  if (ref?.kind === "tool" && Object.keys(ref).sort().join("|") === "id|kind") return "tool:" + AttemptId(ref.id);
  if (ref?.kind === "knowledge" && Object.keys(ref).sort().join("|") === "id|kind|version" && ref.version > 0) return "knowledge:" + KnowledgeId(ref.id) + ":" + KnowledgeVersion(ref.version);
  throw new HomeError("INVALID_CONTEXT_SOURCE");
}
function toolSource(attempt, conversation) {
  const { turn, request, name, final, canonical, complete } = contextToolParts(attempt, conversation), completeness = complete ? "complete" : "gap";
  const text2 = JSON.stringify({ provenance: "historical-tool-record", completeness, request: typeof name === "string" ? { name, arguments: request && typeof request === "object" && "arguments" in request ? request.arguments : void 0 } : null, observation: attempt.observation ?? null, final: canonical ? final : { canonicalValue: "unavailable" }, materials: attempt.materials ?? [] });
  return { ref: { kind: "tool", id: attempt.attemptId }, speaker: "tool", toolName: typeof name === "string" ? name : "unknown", runId: attempt.runId, binding: { bindingId: turn.bindingId, bindingVersion: turn.bindingVersion }, occurredAt: attempt.observation?.observedAt ?? attempt.reservedAt, timeKind: attempt.observation ? "observation" : "reservation", canonicalStatus: canonical ? final.isError ? "error" : "success" : "unavailable", evidence: "tool-result-not-world-truth", text: text2, contentDigest: contextTextDigest(text2), completeness, ...attempt.cleanup ? { cleanup: attempt.cleanup } : {} };
}
function contextSourceDigest(snapshot, conversation, ref) {
  key(ref);
  if (ref.kind === "core") return contextTextDigest(snapshot.core.text);
  if (ref.kind === "knowledge") {
    const record = conversation.knowledge.versions.find((record2) => record2.knowledgeId === ref.id && record2.version === ref.version);
    return record ? contextTextDigest(JSON.stringify(record)) : void 0;
  }
  if (ref.kind === "input") {
    const input = snapshot.inputs.find((input2) => input2.inputId === ref.id);
    return input ? contextTextDigest(input.text) : void 0;
  }
  if (ref.kind === "reply") {
    const reply = conversation.replies.find((reply2) => reply2.replyId === ref.id);
    return reply ? contextTextDigest(reply.text) : void 0;
  }
  const attempt = conversation.attempts.find((attempt2) => attempt2.attemptId === ref.id && attempt2.kind === "tool");
  return attempt ? toolSource(attempt, conversation).contentDigest : void 0;
}
function modelKnowledgeBody(snapshot, conversation, source, qualified, purpose) {
  const ref = source.ref;
  if (purpose === "management" || ref.kind !== "knowledge") return source;
  const record = conversation.knowledge.versions.find((record2) => record2.knowledgeId === ref.id && record2.version === ref.version);
  const cleanup = (ref2) => ref2.kind === "input" ? snapshot.inputs.find((input) => input.inputId === ref2.id)?.cleanup : ref2.kind === "reply" ? conversation.replies.find((reply) => reply.replyId === ref2.id)?.cleanup : ref2.kind === "tool" ? conversation.attempts.find((attempt) => attempt.attemptId === ref2.id)?.cleanup : ref2.kind === "knowledge" ? conversation.knowledge.versions.find((record2) => record2.knowledgeId === ref2.id && record2.version === ref2.version)?.cleanup : void 0;
  const removed = record.sources.filter((source2) => cleanup(source2.ref) || qualified.availableForDaily && !qualified.dependencies.some((ref2) => key(ref2) === key(source2.ref)));
  if (!removed.length) return source;
  return { ...source, text: JSON.stringify({ ...record, sources: record.sources.filter((source2) => !removed.includes(source2)), cleanedSources: removed.map((source2) => ({ ref: source2.ref, ...cleanup(source2.ref) ? { cleanup: cleanup(source2.ref) } : { reason: "source-unavailable" } })), sourceUse: "Retained memory; removed original sources cannot be verified or cited as complete evidence" }) };
}
function createContextSnapshotReader(snapshot, conversation, request, validate) {
  const turn = request.purpose !== "management" ? conversation.turns.find((turn2) => turn2.runId === request.runId && turn2.status === "running") : void 0;
  const bindingAllowed = (bindingId, version2) => contextBindingAllowed(snapshot, bindingId, version2);
  if (request.purpose !== "management" && (!turn || !bindingAllowed(turn.bindingId, turn.bindingVersion))) throw new HomeError("CONTEXT_RUN_NOT_ACTIVE");
  if (request.purpose === "history" && !turn.inputIds.some((id) => snapshot.inputs.some((input) => input.inputId === id && input.contextPurpose === "history" && input.channel === void 0))) throw new HomeError("HISTORY_NOT_REQUESTED");
  const inputs = snapshot.inputs.filter((input) => request.purpose === "management" || (request.purpose === "history" || bindingAllowed(input.bindingId, input.bindingVersion)) && (input.status === "resolved" || input.status === "running" && turn?.inputIds.includes(input.inputId)));
  const replies = conversation.replies.filter((reply) => request.purpose !== "daily" || bindingAllowed(reply.bindingId, reply.bindingVersion));
  const basis = Object.freeze({ roleId: snapshot.roleId, revision: snapshot.revision, contextGeneration: snapshot.contextGeneration, coreVersion: snapshot.core.version, ...turn ? { runId: turn.runId } : {} });
  const bodies = [
    { ref: { kind: "core" }, speaker: "owner", coreVersion: snapshot.core.version, text: snapshot.core.text, contentDigest: contextTextDigest(snapshot.core.text), completeness: "complete" },
    ...conversation.knowledge.versions.map((record) => ({ ref: { kind: "knowledge", id: record.knowledgeId, version: record.version }, speaker: record.ownerAction ? "owner" : "role", knowledgeKind: record.kind, statement: record.statement, topic: record.topic, scope: record.scope, current: !conversation.knowledge.versions.some((other) => other.knowledgeId === record.knowledgeId && other.version > record.version), committedRevision: record.committedRevision, evidence: record.ownerAction ? "owner-selected-body-with-later-corrections" : "adopted-content-with-provenance-not-world-truth", text: JSON.stringify(record), contentDigest: contextTextDigest(JSON.stringify(record)), completeness: record.cleanup ? "gap" : "complete", ...record.cleanup ? { cleanup: record.cleanup } : {} })),
    ...inputs.map((input) => ({ ref: { kind: "input", id: input.inputId }, speaker: "user", experienceId: input.experienceId, receiveSequence: input.receiveSequence, runId: conversation.turns.find((turn2) => turn2.inputIds.includes(input.inputId))?.runId ?? null, binding: { bindingId: input.bindingId, bindingVersion: input.bindingVersion }, occurredAt: input.receivedAt, ...input.origin === "history" ? { origin: "history", reportedAt: input.historySource.reportedAt, receivedAt: input.receivedAt, timeKind: "admission", historySource: structuredClone(input.historySource) } : {}, committedRevision: input.committedRevision, text: input.text, contentDigest: contextTextDigest(input.text), completeness: input.cleanup ? "gap" : "complete", ...input.cleanup ? { cleanup: input.cleanup } : {} })),
    ...replies.map((reply) => {
      const turn2 = conversation.turns.find((turn3) => turn3.runId === reply.runId);
      if (!turn2) throw new HomeError("CONTEXT_SOURCE_INCOMPLETE");
      return { ref: { kind: "reply", id: reply.replyId }, speaker: "role", experienceId: reply.experienceId, binding: { bindingId: reply.bindingId, bindingVersion: reply.bindingVersion }, occurredAt: turn2.startedAt, timeKind: "turn-start", runId: reply.runId, inputIds: [...reply.inputIds], committedRevision: reply.committedRevision, evidence: "generated-output-not-delivery-or-truth", text: reply.text, contentDigest: contextTextDigest(reply.text), completeness: reply.cleanup ? "gap" : "complete", ...reply.cleanup ? { cleanup: reply.cleanup } : {} };
    }),
    ...conversation.attempts.filter((attempt) => attempt.kind === "tool").map((attempt) => toolSource(attempt, conversation)).filter((source) => request.purpose !== "daily" || source.completeness === "complete" && bindingAllowed(source.binding.bindingId, source.binding.bindingVersion)).map((source) => {
      if (request.purpose === "management") return source;
      const pair3 = JSON.parse(source.text), final = pair3.final;
      return { ...source, text: JSON.stringify({ ...pair3, final: source.canonicalStatus === "unavailable" ? { canonicalValue: "unavailable" } : final.isError ? { isError: true, error: { code: typeof final.error?.info?.code === "string" ? final.error.info.code : "TOOL_FAILED" } } : { isError: false, value: final.value }, materials: pair3.materials.map((material) => ({ materialId: material.materialId, source: material.source, bytes: material.bytes, digest: material.digest })), projection: "model-safe: canonical content/meta and private spill locators omitted; original remains in Home" }) };
    })
  ];
  const lineage = createContextLineage(snapshot, conversation), allRecords = bodies.map((source) => {
    const qualified = lineage.describe(source.ref);
    return { ...modelKnowledgeBody(snapshot, conversation, source, qualified, request.purpose), ...qualified };
  }), constraintCandidates = [];
  const dependsOn = (ref, target, seen = /* @__PURE__ */ new Set()) => {
    if (key(ref) === key(target)) return true;
    if (seen.has(key(ref))) return false;
    seen.add(key(ref));
    return lineage.describe(ref).dependencies.some((dependency) => dependsOn(dependency, target, seen));
  };
  const unavailable = /* @__PURE__ */ new Set(), activeKnowledge = activeKnowledgeVersions(conversation.knowledge);
  for (const record of conversation.knowledge.versions) {
    const target = { kind: "knowledge", id: record.knowledgeId, version: record.version }, required = record.ownerAction ? rollbackKnowledgePair(record, conversation.knowledge, (record2) => lineage.describe({ kind: "knowledge", id: record2.knowledgeId, version: record2.version }).dependencies).filter((ref) => key(ref) !== key(target)) : request.purpose === "daily" ? lineage.describe(target).dependencies : knowledgeSourceRequirements(record);
    if (required.every((ref) => allRecords.some((source) => key(source.ref) === key(ref)))) constraintCandidates.push({ kind: "provenance", target, required });
  }
  const rollbackGroups = conversation.knowledge.versions.filter((record) => record.ownerAction && !record.cleanup && activeKnowledge.includes(record) && !conversation.knowledge.versions.some((other) => other.knowledgeId === record.knowledgeId && other.version > record.version)).map((record) => {
    if (!record.ownerAction) throw new HomeError("INVALID_KNOWLEDGE_ROLLBACK");
    const group = rollbackKnowledgePair(record, conversation.knowledge, (record2) => lineage.describe({ kind: "knowledge", id: record2.knowledgeId, version: record2.version }).dependencies);
    return { group, affected: allRecords.filter((source) => source.ref.kind !== "core" && group.some((ref) => ref.kind !== "core" && dependsOn(source.ref, ref))) };
  });
  let changed = true;
  while (changed) {
    changed = false;
    for (const { group, affected } of rollbackGroups) {
      if (group.every((ref) => !unavailable.has(key(ref)) && allRecords.some((source) => key(source.ref) === key(ref) && source.availableForDaily))) continue;
      for (const source of affected) if (!unavailable.has(key(source.ref))) {
        unavailable.add(key(source.ref));
        changed = true;
      }
    }
  }
  for (const { group, affected } of rollbackGroups) {
    if (group.some((ref) => unavailable.has(key(ref)))) continue;
    for (const source of affected) {
      const required = group.filter((ref) => key(ref) !== key(source.ref));
      if (required.length && !constraintCandidates.some((c) => c.kind === "provenance" && key(c.target) === key(source.ref) && JSON.stringify(c.required) === JSON.stringify(required))) constraintCandidates.push({ kind: "provenance", target: source.ref, required });
    }
  }
  for (const record of conversation.knowledge.versions) {
    if (!record.relation || !activeKnowledge.includes(record)) continue;
    const previous = conversation.knowledge.versions.find((old) => old.knowledgeId === record.relation.targetId && old.version === record.relation.version);
    if (!previous) continue;
    const required = [{ kind: "knowledge", id: record.knowledgeId, version: record.version }, ...record.sources.map((source) => source.ref)], available = required.every((ref) => !unavailable.has(key(ref)) && allRecords.some((source) => key(source.ref) === key(ref) && source.availableForDaily));
    for (const source of allRecords) {
      if (source.ref.kind === "core" || required.some((ref) => key(ref) === key(source.ref)) || !previous.sources.some((old) => old.ref.kind !== "core" && dependsOn(source.ref, old.ref))) continue;
      if (!available) unavailable.add(key(source.ref));
      else constraintCandidates.push({ kind: record.relation.kind, target: source.ref, required });
    }
  }
  const records = allRecords.map((source) => unavailable.has(key(source.ref)) ? { ...source, availableForDaily: false } : source).filter((source) => request.purpose !== "daily" || source.availableForDaily);
  let revoked = false;
  const live = () => {
    if (revoked) throw new HomeError("CONTEXT_SNAPSHOT_REVOKED");
  };
  const check = async (refs) => {
    live();
    const selected = refs ? refs.map((ref) => {
      const source = records.find((source2) => key(source2.ref) === key(ref));
      if (!source) throw new HomeError("CONTEXT_SOURCE_NOT_GRANTED");
      return source;
    }) : records;
    await validate(selected.map(({ ref, contentDigest }) => ({ ref, contentDigest })));
    live();
  };
  return Object.freeze({
    purpose: request.purpose,
    basis,
    check,
    revoke() {
      revoked = true;
    },
    async constraints() {
      await check();
      return structuredClone(constraintCandidates.filter((constraint) => [constraint.target, ...constraint.required].every((ref) => records.some((source) => key(source.ref) === key(ref)))));
    },
    async list() {
      await check();
      return records.map(({ text: text2, ...metadata }) => structuredClone(metadata));
    },
    async read(ref) {
      const requested = key(ref), record = records.find((record2) => key(record2.ref) === requested);
      await check(record ? [ref] : []);
      if (!record) throw new HomeError("CONTEXT_SOURCE_NOT_GRANTED");
      if (record.cleanup) throw new HomeError("CONTEXT_SOURCE_CLEANED");
      return structuredClone(record);
    }
  });
}

// packages/companion/src/home/deliveries.ts
function DeliveryId(value) {
  return OperationId(value);
}
function SendAttemptId(value) {
  return OperationId(value);
}
function DeliveryRulesVersion(value) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) throw new Error("INVALID_DELIVERY_RULES_VERSION");
  return value;
}
var longReplyMarker = "\u5185\u5BB9\u8F83\u957F\uFF0C\u5B8C\u6574\u56DE\u590D\u5DF2\u4FDD\u5B58\uFF0C\u53EF\u5728 DSH \u89D2\u8272\u9762\u677F\u67E5\u770B";
var longContactMarker = "\u5185\u5BB9\u8F83\u957F\uFF0C\u5B8C\u6574\u6D88\u606F\u5DF2\u4FDD\u5B58\uFF0C\u53EF\u5728 DSH \u89D2\u8272\u9762\u677F\u67E5\u770B";
var minimumPreviewCodePoints = Math.max(Array.from(longReplyMarker).length, Array.from(longContactMarker).length) + 1;
var deliveryRulesDefaults = Object.freeze({ previewCodePoints: 1500, sendTimeoutMs: 2e4 });
function validateDeliveryRules(value) {
  return plainExact(value, ["previewCodePoints", "sendTimeoutMs"]) && Number.isSafeInteger(value.previewCodePoints) && Number(value.previewCodePoints) >= minimumPreviewCodePoints && Number(value.previewCodePoints) <= 1048576 && Number.isSafeInteger(value.sendTimeoutMs) && Number(value.sendTimeoutMs) > 0 && Number(value.sendTimeoutMs) <= 2147483647;
}
function previewText(text2, limit, marker) {
  const points = Array.from(text2);
  return points.length <= limit ? text2 : points.slice(0, limit - Array.from(marker).length).join("") + marker;
}
function previewReply(text2, limit) {
  return previewText(text2, limit, longReplyMarker);
}
function previewContact(text2, limit) {
  return previewText(text2, limit, longContactMarker);
}
function previewDelivery(qualification, text2, limit) {
  return qualification === "contact" ? previewContact(text2, limit) : previewReply(text2, limit);
}
var initialDeliveries = () => ({ deliveryRules: { version: DeliveryRulesVersion(1), value: deliveryRulesDefaults }, deliveries: [], sendAttempts: [], deliveryResolutions: [] });
function admitDelivery(value, roleId) {
  return { ...value, deliveryId: DeliveryId(value.deliveryId), qualification: value.qualification, source: value.source, ...value.replyId ? { replyId: ReplyId(value.replyId) } : {}, ...value.intentId ? { intentId: IntentId(value.intentId) } : {}, ...value.contactIntentId ? { contactIntentId: ContactIntentId(value.contactIntentId) } : {}, runId: RunId(value.runId), target: admitQQBinding(value.target, roleId), rulesVersion: DeliveryRulesVersion(value.rulesVersion), committedRevision: HomeRevision(value.committedRevision), ...value.retryOf ? { retryOf: DeliveryId(value.retryOf) } : {}, ...value.resolutionOperationId ? { resolutionOperationId: OperationId(value.resolutionOperationId) } : {}, ...value.supersedes ? { supersedes: DeliveryId(value.supersedes) } : {}, ...value.supersededBy ? { supersededBy: DeliveryId(value.supersededBy) } : {}, ...value.sendAttemptId ? { sendAttemptId: SendAttemptId(value.sendAttemptId) } : {} };
}
function sameQQTarget(a, b) {
  return !!a && a.bindingId === b.bindingId && a.version === b.version && a.connectionId === b.connectionId && a.accountId === b.accountId && a.peerId === b.peerId && a.activatedRevision === b.activatedRevision;
}

// packages/companion/src/home/delivery-resolutions.ts
function validResolutionDecision(value) {
  if (!value || typeof value !== "object") return false;
  const v = value;
  return ["no-resend", "resend"].includes(v.decision) && typeof v.note === "string" && v.note.trim().length > 0 && Array.from(v.note).length <= 4096 && !v.note.includes("\0") && v.duplicateRiskAcknowledged === (v.decision === "resend");
}
function validateResolveDelivery(value) {
  if (!plainExact(value, ["kind", "operationId", "deliveryId", "sendAttemptId", "decision", "note", "duplicateRiskAcknowledged", "expectedQQBindingVersion", "expectedDeliveryRulesVersion", "expectedRevision"]) || value.kind !== "resolve-delivery" || !validResolutionDecision(value)) return false;
  const v = value;
  try {
    OperationId(v.operationId);
    DeliveryId(v.deliveryId);
    SendAttemptId(v.sendAttemptId);
    BindingVersion(v.expectedQQBindingVersion);
    DeliveryRulesVersion(v.expectedDeliveryRulesVersion);
    HomeRevision(v.expectedRevision);
    return true;
  } catch {
    return false;
  }
}

// packages/companion/src/home/delivery-prepare.ts
import { createHash as createHash2 } from "node:crypto";
var stableId = (seed) => DeliveryId("delivery-" + createHash2("sha256").update(seed).digest("hex"));
function prepareDelivery(reply, target, rules, revision, supersedes, operationId) {
  return { deliveryId: stableId(supersedes ? operationId + ":" + supersedes : reply.replyId), qualification: "main-reply", source: "user", replyId: reply.replyId, intentId: reply.intentId, runId: reply.runId, inputIds: [...reply.inputIds], target: structuredClone(target), text: previewReply(reply.text, rules.value.previewCodePoints), rulesVersion: rules.version, status: "pending", committedRevision: revision, ...supersedes ? { supersedes } : {} };
}
function prepareRedelivery(reply, original, rules, revision, operationId) {
  const { supersedes, ...delivery } = prepareDelivery(reply, original.target, rules, revision, original.deliveryId, operationId);
  return { ...delivery, retryOf: original.deliveryId, resolutionOperationId: operationId };
}
function prepareContactDelivery(intent, target, rules, revision) {
  return { deliveryId: stableId("contact:" + intent.intentId), qualification: "contact", source: "contact", contactIntentId: intent.intentId, runId: intent.runId, inputIds: [], target: structuredClone(target), text: previewDelivery("contact", intent.text, rules.value.previewCodePoints), rulesVersion: rules.version, status: "pending", committedRevision: revision };
}

// packages/companion/src/home/contact-rules.ts
var contactRulesDefaults = Object.freeze({ cooldownMs: 72e5, dailyLimit: 3, perRoundLimit: 1, quietHours: Object.freeze({ mode: "range", start: "23:00", end: "08:00" }) });
var HHMM = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
function localMinutes(value) {
  if (typeof value !== "string" || !HHMM.test(value)) throw Error("INVALID_LOCAL_MINUTES");
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}
function validQuietHours(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const mode = value.mode;
  if (mode === "off" || mode === "all-day") return plainExact(value, ["mode"]);
  if (mode !== "range" || !plainExact(value, ["mode", "start", "end"])) return false;
  const { start, end } = value;
  if (typeof start !== "string" || typeof end !== "string" || !HHMM.test(start) || !HHMM.test(end)) return false;
  return start !== end;
}
function validateContactRules(value) {
  if (!plainExact(value, ["cooldownMs", "dailyLimit", "perRoundLimit", "quietHours"])) return false;
  const v = value;
  for (const field of ["cooldownMs", "dailyLimit", "perRoundLimit"]) {
    const raw = v[field];
    if (typeof raw !== "number" || !Number.isSafeInteger(raw) || raw < 0) return false;
  }
  return validQuietHours(v.quietHours);
}
var initialContactRules = () => ({ version: ContactRulesVersion(1), value: contactRulesDefaults });
function quietHoursActive(quietHours, minutes) {
  if (!Number.isSafeInteger(minutes) || minutes < 0 || minutes >= 1440) throw Error("INVALID_LOCAL_MINUTES");
  if (quietHours.mode === "off") return false;
  if (quietHours.mode === "all-day") return true;
  const start = localMinutes(quietHours.start), end = localMinutes(quietHours.end);
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

// packages/companion/src/home/contact.ts
var emptyContact = () => ({ intents: [] });
function contactRoundUsed(state, runId) {
  const runs = new Map(state.deliveries.map((delivery) => [delivery.deliveryId, delivery.runId]));
  return state.sendAttempts.filter((attempt) => attempt.contact && runs.get(attempt.deliveryId) === runId).length;
}
function contactBlocked(input) {
  const { rules, stamp, usage } = input, value = rules.value;
  if (stamp.rulesVersion !== rules.version) return { ok: false, code: "CONTACT_RULES_CHANGED" };
  if (value.dailyLimit <= 0 || usage.dayUsed >= value.dailyLimit) return { ok: false, code: "CONTACT_DAILY_LIMIT" };
  if (value.perRoundLimit <= 0 || usage.roundUsed >= value.perRoundLimit) return { ok: false, code: "CONTACT_ROUND_LIMIT" };
  if (usage.lastReservedAt && Number.isFinite(Date.parse(usage.lastReservedAt)) && Date.parse(stamp.clock.utc) < Date.parse(usage.lastReservedAt) + value.cooldownMs) return { ok: false, code: "CONTACT_COOLDOWN" };
  if (quietHoursActive(value.quietHours, stamp.localMinutes)) return { ok: false, code: "CONTACT_QUIET_HOURS" };
  return { ok: true };
}
function contactIntentOpen(state, intentId) {
  const intent = state.intents.find((record) => record.intentId === intentId);
  return intent?.state === "open" ? intent : void 0;
}
function validContactStamp(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const v = value;
  return v.snapshotVersion === 1 && Number.isSafeInteger(v.localMinutes) && v.localMinutes >= 0 && v.localMinutes < 1440 && Number.isSafeInteger(v.rulesVersion) && v.rulesVersion >= 1 && !!v.clock && typeof v.clock === "object" && !!v.day && typeof v.day === "object";
}

// packages/companion/src/home/web.ts
var webRulesDefaults = Object.freeze({ transportTimeoutMs: 3e4, toolTimeoutMs: 45e3, maxResults: 8, responseLimitBytes: 4194304 });
var initialWebRules = () => ({ version: WebRulesVersion(1), value: webRulesDefaults });
function validateWebRules(value) {
  const keys = ["maxResults", "responseLimitBytes", "toolTimeoutMs", "transportTimeoutMs"];
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).length !== 4 || Object.keys(value).sort().join("|") !== keys.join("|")) return false;
  if (keys.some((key2) => {
    const d = Object.getOwnPropertyDescriptor(value, key2);
    return !d || !("value" in d) || typeof d.value !== "number" || !Number.isSafeInteger(d.value) || d.value < 1;
  })) return false;
  return "maxResults" in value && typeof value.maxResults === "number" && value.maxResults <= 50 && "responseLimitBytes" in value && typeof value.responseLimitBytes === "number" && value.responseLimitBytes <= 4194304 && "toolTimeoutMs" in value && typeof value.toolTimeoutMs === "number" && value.toolTimeoutMs <= 2147483647 && "transportTimeoutMs" in value && typeof value.transportTimeoutMs === "number" && value.transportTimeoutMs <= 2147483647;
}
function isWebWireRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return "providerStatus" in value && (value.providerStatus === "unknown" || typeof value.providerStatus === "number" && Number.isInteger(value.providerStatus) && value.providerStatus >= 100 && value.providerStatus <= 599) && "rawBase64" in value && typeof value.rawBase64 === "string" && /^[A-Za-z0-9+/]*={0,2}$/.test(value.rawBase64) && "retainedBytes" in value && typeof value.retainedBytes === "number" && Number.isSafeInteger(value.retainedBytes) && value.retainedBytes >= 0 && value.retainedBytes <= 4194304 && "receivedBytes" in value && typeof value.receivedBytes === "number" && Number.isSafeInteger(value.receivedBytes) && value.receivedBytes >= value.retainedBytes && "completeness" in value && ["complete", "partial", "invalid", "not-dispatched"].includes(String(value.completeness)) && "dispatchObserved" in value && typeof value.dispatchObserved === "boolean" && (!("code" in value) || typeof value.code === "string" && /^[A-Z][A-Z0-9_]{1,63}$/.test(value.code)) && (!("providerErrorCode" in value) || typeof value.providerErrorCode === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(value.providerErrorCode)) && (!("retryAfterMs" in value) || typeof value.retryAfterMs === "number" && Number.isFinite(value.retryAfterMs) && value.retryAfterMs >= 0);
}
var terminalWebCodes = /* @__PURE__ */ new Set(["QUOTA", "INSUFFICIENT_QUOTA", "INSUFFICIENT_BALANCE", "INVALID_API_KEY", "AUTHENTICATION_ERROR", "INVALID_REQUEST_ERROR", "PERMISSION_DENIED", "SECURITY_POLICY"]);
var retryableWebRecord = (record) => !terminalWebCodes.has(record.providerErrorCode ?? "") && (record.completeness === "complete" && typeof record.providerStatus === "number" && ([408, 429].includes(record.providerStatus) || record.providerStatus >= 500) || record.code === "WEB_TRANSPORT_FAILED");
function validWebAttempt(attempt, attempts) {
  if (attempt.webTool) {
    const c = attempt.webTool;
    if (attempt.kind !== "tool" || !["search", "fetch"].includes(c.operation) || !validateWebRules(c.rules.value) || !Number.isFinite(Date.parse(c.deadline)) || attempts.some((x) => x.webTool?.logicalOpId === c.logicalOpId)) return false;
  }
  const claim = attempt.webOperation;
  if (attempt.kind !== "web") return !claim;
  if (!claim || ![0, 1].includes(claim.ordinal)) return false;
  const parent = attempts.find((x) => x.attemptId === claim.parentAttemptId && x.kind === "tool" && x.webTool?.logicalOpId === claim.logicalOpId);
  if (!parent || parent.runId !== attempt.runId || parent.source !== attempt.source) return false;
  const prior = attempts.filter((x) => x.webOperation?.logicalOpId === claim.logicalOpId);
  if (claim.ordinal === 0) return !prior.length && claim.previousAttemptId === void 0;
  const first = prior[0];
  return prior.length === 1 && first?.attemptId === claim.previousAttemptId && first.outcome?.kind === "failed" && isWebWireRecord(first.outcome.data) && retryableWebRecord(first.outcome.data);
}

// packages/companion/src/home/iana.ts
var formats = /* @__PURE__ */ new Map();
function calendar(timeZone) {
  let f = formats.get(timeZone);
  if (!f) {
    if (typeof timeZone !== "string" || !timeZone || /^[+-]/.test(timeZone)) throw Error("IANA_TIME_ZONE_UNAVAILABLE");
    try {
      f = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", calendar: "iso8601", numberingSystem: "latn" });
    } catch {
      throw Error("IANA_TIME_ZONE_UNAVAILABLE");
    }
    formats.set(timeZone, f);
  }
  return f;
}
function canonicalTimeZone(timeZone) {
  try {
    const name = new Intl.DateTimeFormat("en", { timeZone }).resolvedOptions().timeZone;
    return typeof name === "string" && name.length ? name : void 0;
  } catch {
    return void 0;
  }
}
function dateKey(ms, timeZone) {
  const parts = calendar(timeZone).formatToParts(new Date(ms)), get = (type) => parts.find((p) => p.type === type).value;
  return get("year") + "-" + get("month") + "-" + get("day");
}
function ianaDayBounds(utcOrMs, timeZone, dataVersion) {
  const ms = typeof utcOrMs === "number" ? utcOrMs : Date.parse(utcOrMs);
  if (!Number.isFinite(ms) || !dataVersion) throw Error("CLOCK_UNAVAILABLE");
  const localDate = dateKey(ms, timeZone);
  let left = Math.floor(ms / 1e3) * 1e3, right = left;
  for (let n = 0; n < 72 && dateKey(left, timeZone) === localDate; n++) left -= 36e5;
  for (let n = 0; n < 72 && dateKey(right, timeZone) === localDate; n++) right += 36e5;
  if (dateKey(left, timeZone) === localDate || dateKey(right, timeZone) === localDate) throw Error("IANA_DAY_UNAVAILABLE");
  let lo = left, hi = Math.floor(ms / 1e3) * 1e3;
  while (hi - lo > 1e3) {
    const mid = Math.floor((lo + hi) / 2e3) * 1e3;
    if (dateKey(mid, timeZone) === localDate) hi = mid;
    else lo = mid;
  }
  const startUtc = new Date(hi).toISOString();
  lo = Math.floor(ms / 1e3) * 1e3;
  hi = right;
  while (hi - lo > 1e3) {
    const mid = Math.floor((lo + hi) / 2e3) * 1e3;
    if (dateKey(mid, timeZone) === localDate) lo = mid;
    else hi = mid;
  }
  const endUtc = new Date(hi).toISOString();
  return { startUtc, endUtc, localDate };
}

// packages/companion/src/home/autonomy.ts
var autonomyDefaults = Object.freeze({ modelLimit: 4, toolLimit: 8, webLimit: 3, dailyModelLimit: 24, dailyToolLimit: 48, dailyWebLimit: 12, windowMs: 3e5, outputTokens: 2048, timeZone: "Asia/Shanghai", wakeIntervalMs: 36e5 });
var initialAutonomy = () => ({ rules: { version: AutonomyRulesVersion(1), value: autonomyDefaults }, pending: null, windows: [] });
var fail = (code2) => {
  throw new HomeError(code2);
};
function validAutonomyRules(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join("|") !== "dailyModelLimit|dailyToolLimit|dailyWebLimit|modelLimit|outputTokens|timeZone|toolLimit|wakeIntervalMs|webLimit|windowMs") return false;
  const v = value;
  if (![v.modelLimit, v.toolLimit, v.webLimit, v.dailyModelLimit, v.dailyToolLimit, v.dailyWebLimit].every((n) => Number.isSafeInteger(n) && n >= 0) || !Number.isSafeInteger(v.windowMs) || v.windowMs < 1 || v.windowMs > 2147483647 || !Number.isSafeInteger(v.outputTokens) || v.outputTokens < 1 || v.outputTokens > 256e3 || !Number.isSafeInteger(v.wakeIntervalMs) || v.wakeIntervalMs < 6e4 || v.wakeIntervalMs > 2147483647 || typeof v.timeZone !== "string" || /^[+-]/.test(v.timeZone)) return false;
  return canonicalTimeZone(v.timeZone) !== void 0;
}
function clockProblem(state, reading) {
  if (!reading || !Number.isFinite(Date.parse(reading.utc)) || !Number.isSafeInteger(reading.monotonicMs) || reading.monotonicMs < 0 || !reading.processId || !reading.dataVersion) return "CLOCK_UNAVAILABLE";
  if (state.clockBlocked) return state.clockBlocked;
  const prior = state.clock;
  if (!prior) return;
  if (prior.dataVersion !== reading.dataVersion) return "IANA_DATA_CHANGED";
  const expected = Date.parse(prior.utc) + (prior.processId === reading.processId ? Math.max(0, reading.monotonicMs - prior.monotonicMs) : 0);
  if (Date.parse(reading.utc) < expected - 6e4) return "CLOCK_ROLLBACK";
}
function transitionIanaWindow(window, rules, at, dataVersion) {
  const zone = rules.timeZone;
  if (!Number.isFinite(Date.parse(at)) || !dataVersion) fail("CLOCK_UNAVAILABLE");
  if (canonicalTimeZone(zone) === void 0) fail("INVALID_TIME_ZONE");
  if (dataVersion !== window.dataVersion) fail("IANA_DATA_CHANGED");
  const previousEndUtc = window.endUtc, startUtc = window.startUtc, startMs = Date.parse(startUtc), lowerBound = Math.max(Date.parse(previousEndUtc), startMs + 864e5);
  if (!(Date.parse(at) >= startMs)) fail("CLOCK_ROLLBACK");
  const bounds = (ms) => {
    try {
      return ianaDayBounds(ms, zone, dataVersion);
    } catch {
      return fail("IANA_DAY_UNAVAILABLE");
    }
  };
  const endUtc = bounds(lowerBound - 1e3).endUtc;
  if (!(Date.parse(endUtc) >= lowerBound) || !(Date.parse(endUtc) > startMs)) fail("IANA_DAY_UNAVAILABLE");
  const localDate = bounds(startMs).localDate;
  const transition = { kind: "time-zone-change", previousTimeZone: window.timeZone, previousEndUtc, at, nextTimeZone: zone, dataVersion };
  return { window: { windowId: window.windowId, startUtc, endUtc, localDate, timeZone: zone, dataVersion, used: { ...window.used }, transition }, transition };
}
function effectiveAutonomyDay(state, reading, day) {
  const last = state.windows.at(-1);
  if (!last || last.dataVersion !== reading.dataVersion || last.timeZone !== state.rules.value.timeZone) return day;
  const at = Date.parse(reading.utc);
  if (!(at >= Date.parse(last.startUtc) && at < Date.parse(last.endUtc))) return day;
  return { windowId: last.windowId, startUtc: last.startUtc, endUtc: last.endUtc, localDate: last.localDate, timeZone: last.timeZone, dataVersion: last.dataVersion };
}
var sameDayRecord = (window, day) => window.windowId === day.windowId && window.startUtc === day.startUtc && window.endUtc === day.endUtc && window.localDate === day.localDate && window.timeZone === day.timeZone && window.dataVersion === day.dataVersion;
function appendWindow(state, stamp, kind) {
  if (stamp.snapshotVersion !== void 0 && stamp.snapshotVersion !== 1) fail("AUTONOMY_STAMP_FORMAT");
  const problem = clockProblem(state, stamp.clock);
  if (problem) fail(problem);
  if (stamp.rulesVersion !== state.rules.version) fail("AUTONOMY_RULES_CHANGED");
  const d = stamp.day, at = Date.parse(stamp.clock.utc);
  if (d.timeZone !== state.rules.value.timeZone || d.dataVersion !== stamp.clock.dataVersion || !(Date.parse(d.startUtc) <= at && at < Date.parse(d.endUtc)) || !/^day-[0-9a-f]{64}$/.test(d.windowId)) fail("INVALID_AUTONOMY_WINDOW");
  const last = state.windows.at(-1);
  let current = state.windows.find((w) => w.windowId === d.windowId);
  if (current && !sameDayRecord(current, d)) fail("AUTONOMY_WINDOW_CONFLICT");
  if (!current && last && at < Date.parse(last.endUtc)) fail("AUTONOMY_WINDOW_OVERLAP");
  current ??= { ...d, used: { model: 0, tool: 0, web: 0 } };
  const limit = kind === "model" ? state.rules.value.dailyModelLimit : kind === "tool" ? state.rules.value.dailyToolLimit : state.rules.value.dailyWebLimit;
  if (current.used[kind] >= limit) fail("AUTONOMOUS_DAILY_" + kind.toUpperCase() + "_LIMIT");
  const next = { ...current, used: { ...current.used, [kind]: current.used[kind] + 1 } };
  return { ...state, clock: stamp.clock, windows: current === last || state.windows.some((w) => w.windowId === current.windowId) ? state.windows.map((w) => w.windowId === current.windowId ? next : w) : [...state.windows, next] };
}
function wakeBlocked(state, stamp) {
  const problem = clockProblem(state, stamp.clock);
  if (problem) return problem;
  if (state.pausedAt) return "AUTONOMY_PAUSED";
  if (state.restUntil && Date.parse(stamp.clock.utc) < Date.parse(state.restUntil)) return "AUTONOMOUS_REST";
  const v = state.rules.value, w = state.windows.find((w2) => w2.windowId === stamp.day.windowId);
  if (!v.modelLimit || !v.dailyModelLimit || (w?.used.model ?? 0) >= v.dailyModelLimit) return "AUTONOMOUS_MODEL_LIMIT";
}
function nextResetUtc(state, clock) {
  const last = state.windows.at(-1);
  if (last && clock && Date.parse(clock.utc) < Date.parse(last.endUtc)) return last.endUtc;
  if (!clock) return last?.endUtc;
  try {
    return ianaDayBounds(clock.utc, state.rules.value.timeZone, clock.dataVersion).endUtc;
  } catch {
    return last?.endUtc;
  }
}
function scheduleBase(schedule) {
  return schedule.lastSlotAt ?? schedule.anchorAt;
}
function nextSlotAfter(base, intervalMs) {
  return new Date(Date.parse(base) + intervalMs).toISOString();
}
function nextGridSlot(anchorAt, intervalMs, afterMs) {
  const anchor = Date.parse(anchorAt);
  if (!Number.isFinite(anchor) || !(intervalMs > 0) || !Number.isFinite(afterMs)) throw new Error("INVALID_SCHEDULE_GRID");
  const steps = Math.max(1, Math.ceil((afterMs - anchor) / intervalMs));
  for (let guard = 0; guard < 8; guard++) {
    const at = anchor + steps * intervalMs;
    if (at > afterMs) return { at: new Date(at).toISOString(), delta: steps };
  }
  return { at: new Date(anchor + (steps + 1) * intervalMs).toISOString(), delta: steps + 1 };
}
function validSchedule(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const v = value;
  if (Object.keys(v).sort().join("|") !== "anchorAt|lastSlotAt|missedSlots|nextOpportunityAt") return false;
  if (!Number.isSafeInteger(v.missedSlots) || v.missedSlots < 0) return false;
  if (!Number.isFinite(Date.parse(v.anchorAt)) || !Number.isFinite(Date.parse(v.nextOpportunityAt))) return false;
  if (v.lastSlotAt !== null && !Number.isFinite(Date.parse(v.lastSlotAt))) return false;
  return v.lastSlotAt === null || Date.parse(v.lastSlotAt) >= Date.parse(v.anchorAt);
}

// packages/companion/src/home/layout.ts
var ordinaryHomeRoots = Object.freeze(["works", "journal"]);
var protectedHomeEntries = Object.freeze(["identity.json", "head.json", "commits", "blobs", "views", "projection-progress", "content-generations", ".format-upgrade", ".restore", ".maintenance", ".maintenance.lock", "writer.lock", ".autonomy-schedule.json"]);
var retainedHomeEntries = Object.freeze(["identity.json", "head.json", "commits", "blobs", "views", "projection-progress", "content-generations", ".format-upgrade", ".autonomy-schedule.json", ...ordinaryHomeRoots]);
var temporaryHomeRootPrefixes = Object.freeze([".identity.json.", ".head.", ".head.json.", ".writer.lock.", "..maintenance.lock.", ".takeover-", ".autonomy-schedule.json."]);

// packages/companion/src/home/restores.ts
function validateRestoreRequest(value) {
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).some((key2) => typeof key2 !== "string" || !["operationId", "backupPath", "destination", "expectedRoleId", "expectedManifestDigest"].includes(key2)) || Reflect.ownKeys(value).length !== 5) return false;
  if (!("operationId" in value && "backupPath" in value && "destination" in value && "expectedRoleId" in value && "expectedManifestDigest" in value)) return false;
  try {
    OperationId(value.operationId);
    RoleId(value.expectedRoleId);
    BackupManifestDigest(value.expectedManifestDigest);
  } catch {
    return false;
  }
  return typeof value.backupPath === "string" && typeof value.destination === "string";
}

// packages/companion/src/home/backup-storage.ts
import { constants } from "node:fs";
import { open, mkdir, lstat as lstat2, realpath, readdir, rename, unlink } from "node:fs/promises";
import { join as join2, dirname as dirname2, resolve, sep } from "node:path";
import { createHash as createHash3, randomUUID } from "node:crypto";

// packages/companion/src/home/projections.ts
function parseProjectionJSON(source) {
  let at = 0;
  const space = () => {
    while (/\s/u.test(source[at] ?? "") && at < source.length) at++;
  };
  const string = () => {
    const start = at++;
    while (at < source.length) {
      const char = source[at++];
      if (char === "\\") at++;
      else if (char === '"') return JSON.parse(source.slice(start, at));
    }
    throw new Error("INVALID_PROJECTION");
  };
  const value = () => {
    space();
    const char = source[at];
    if (char === '"') {
      string();
      return;
    }
    if (char === "{") {
      at++;
      space();
      const keys = /* @__PURE__ */ new Set();
      if (source[at] === "}") {
        at++;
        return;
      }
      while (at < source.length) {
        space();
        if (source[at] !== '"') throw new Error("INVALID_PROJECTION");
        const key2 = string();
        if (keys.has(key2)) throw new Error("INVALID_PROJECTION");
        keys.add(key2);
        space();
        if (source[at++] !== ":") throw new Error("INVALID_PROJECTION");
        value();
        space();
        const end = source[at++];
        if (end === "}") return;
        if (end !== ",") throw new Error("INVALID_PROJECTION");
      }
    } else if (char === "[") {
      at++;
      space();
      if (source[at] === "]") {
        at++;
        return;
      }
      while (at < source.length) {
        value();
        space();
        const end = source[at++];
        if (end === "]") return;
        if (end !== ",") throw new Error("INVALID_PROJECTION");
      }
    } else {
      const match = /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/u.exec(source.slice(at));
      if (!match) throw new Error("INVALID_PROJECTION");
      at += match[0].length;
      return;
    }
    throw new Error("INVALID_PROJECTION");
  };
  value();
  space();
  if (at !== source.length) throw new Error("INVALID_PROJECTION");
  return JSON.parse(source);
}

// packages/companion/src/home/backup-storage.ts
var hash = (value) => createHash3("sha256").update(value).digest("hex");
var encode = (value) => Buffer.from(JSON.stringify(value) + "\n", "utf8");
function fail2(code2) {
  throw new HomeError(code2);
}
var object = (value) => !!value && typeof value === "object" && !Array.isArray(value);
var hex = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
var code = (error) => error instanceof HomeError ? error.code : error instanceof Error && "code" in error && typeof error.code === "string" && /^[A-Z][A-Z0-9_]{1,63}$/.test(error.code) ? error.code : "BACKUP_IO_FAILED";
var absent = (error) => error instanceof Error && "code" in error && error.code === "ENOENT";
async function exists(path) {
  try {
    await lstat2(path);
    return true;
  } catch (error) {
    if (absent(error)) return false;
    throw error;
  }
}
async function syncDir(path) {
  const file = await open(path, "r");
  try {
    await file.sync();
  } finally {
    await file.close();
  }
}
async function exactPath(input, allowMissing = false) {
  if (typeof input !== "string" || !input.startsWith("/") || input.includes("\0") || input.split("/").some((x) => x === "." || x === "..") || resolve(input) !== input || input === "/") fail2("UNSAFE_BACKUP_PATH");
  let path = "/";
  const parts = input.split("/").filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    path = join2(path, parts[i]);
    let stat;
    try {
      stat = await lstat2(path);
    } catch (error) {
      if (allowMissing && i === parts.length - 1 && absent(error)) return input;
      throw error;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink() || await realpath(path) !== path) fail2("UNSAFE_BACKUP_PATH");
  }
  return input;
}
async function directory(path) {
  try {
    await mkdir(path, { mode: 448 });
    await syncDir(dirname2(path));
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
  }
  await exactPath(path);
}
async function bytes(path, stable = true) {
  const before = await lstat2(path);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink > 1) fail2("UNSAFE_BACKUP_FILE");
  if (before.nlink !== 1) fail2(stable ? "UNSAFE_BACKUP_FILE" : "BACKUP_METADATA_CHANGED");
  const fd = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await fd.stat();
    if (!stat.isFile() || stat.ino !== before.ino || stat.dev !== before.dev || stat.nlink !== 1) fail2(stable ? "UNSAFE_BACKUP_FILE" : "BACKUP_METADATA_CHANGED");
    const value = await fd.readFile();
    const after = await fd.stat();
    const current = await lstat2(path);
    if (after.size !== value.length || after.mtimeMs !== stat.mtimeMs || stable && (after.ctimeMs !== stat.ctimeMs || current.ino !== stat.ino || current.dev !== stat.dev || current.nlink !== 1)) fail2("BACKUP_SOURCE_CHANGED");
    return value;
  } finally {
    await fd.close();
  }
}
async function json(path) {
  for (let retry = 0; retry < 4; retry++) {
    try {
      return parseProjectionJSON(new TextDecoder("utf-8", { fatal: true }).decode(await bytes(path, false)));
    } catch (error) {
      if (error instanceof HomeError && error.code === "BACKUP_METADATA_CHANGED") continue;
      if (error instanceof HomeError) throw error;
      if (absent(error)) throw error;
      return fail2("CORRUPT_BACKUP_METADATA");
    }
  }
  return fail2("BACKUP_METADATA_CHANGED");
}
async function atomic(path, value, afterSync) {
  await exactPath(dirname2(path));
  if (await exists(path)) await bytes(path);
  const temp = join2(dirname2(path), ".backup-" + randomUUID() + ".pending"), fd = await open(temp, "wx", 384);
  try {
    await fd.writeFile(encode(value));
    await fd.sync();
  } finally {
    await fd.close();
  }
  try {
    await afterSync?.();
    await rename(temp, path);
    await syncDir(dirname2(path));
  } finally {
    await unlink(temp).catch(() => {
    });
  }
}
var retained = new Set(retainedHomeEntries);
var ignored = (name) => name === ".restore" || name === ".maintenance" || name === ".maintenance.lock" || name === "writer.lock" || /^\.takeover-[a-f0-9]{64}$/.test(name) || /^\.(?:identity\.json|head|head\.json|writer\.lock|\.maintenance\.lock)\.[0-9a-f-]{36}\.pending$/.test(name);
var temporary = (area, name) => area === "views" ? /^\.[0-9a-f-]{36}\.projection$/.test(name) : area === "commits" ? /^\.[0-9]{12}\.json\.[0-9a-f-]{36}\.pending$/.test(name) : area === "blobs" ? /^\.[a-f0-9]{64}\.json\.[0-9a-f-]{36}\.pending$/.test(name) : false;
async function inventory(root, source = true) {
  await exactPath(root);
  const files = [];
  const walk = async (relative2) => {
    const path = join2(root, relative2), stat = await lstat2(path);
    if (stat.isSymbolicLink()) fail2("UNSAFE_BACKUP_FILE");
    if (stat.isDirectory()) {
      await exactPath(path);
      files.push({ path: relative2, kind: "directory", bytes: 0, digest: "" });
      for (const name of (await readdir(path)).sort()) {
        if (source && temporary(relative2, name)) continue;
        await walk(relative2 + "/" + name);
      }
    } else if (stat.isFile()) {
      const value = await bytes(path);
      files.push({ path: relative2, kind: "file", bytes: value.length, digest: hash(value) });
    } else fail2("UNSAFE_BACKUP_FILE");
  };
  for (const name of (await readdir(root)).sort()) {
    if (source && ignored(name)) continue;
    if (!retained.has(name)) fail2("UNCLASSIFIED_HOME_CONTENT");
    await walk(name);
  }
  return files;
}
function validFiles(value) {
  return Array.isArray(value) && value.every((file) => object(file) && Object.keys(file).sort().join("|") === "bytes|digest|kind|path" && typeof file.path === "string" && file.path.length > 0 && !file.path.startsWith("/") && file.path.split("/").every((p) => p !== "." && p !== ".." && p.length > 0) && !file.path.includes("\\") && !file.path.includes("\0") && retained.has(file.path.split("/")[0]) && (file.kind === "file" || file.kind === "directory") && Number.isSafeInteger(file.bytes) && Number(file.bytes) >= 0 && (file.kind === "file" ? hex(file.digest) : file.digest === "" && file.bytes === 0)) && new Set(value.map((x) => x.path)).size === value.length;
}
function validMaintenanceFiles(value) {
  return Array.isArray(value) && value.length > 0 && value.every((file) => object(file) && Object.keys(file).sort().join("|") === "bytes|digest|kind|path" && typeof file.path === "string" && /^[a-f0-9]{64}\.json$/.test(file.path) && file.kind === "file" && Number.isSafeInteger(file.bytes) && Number(file.bytes) > 0 && hex(file.digest) && file.path === file.digest + ".json") && new Set(value.map((file) => file.path)).size === value.length;
}
function recordValue(value) {
  if (!object(value) || typeof value.destination !== "string" || !["stopping", "stopped", "copying", "verifying", "uncertain", "failed", "verified-restorable"].includes(String(value.phase)) || !["requested", "stopped", "manifest-published", "verified"].includes(String(value.checkpoint)) || !validFiles(value.files) || !Number.isSafeInteger(value.copiedFiles) || !Number.isSafeInteger(value.verifiedFiles) || Number(value.copiedFiles) < 0 || Number(value.verifiedFiles) < 0 || value.error !== void 0 && typeof value.error !== "string" || value.manifestDigest !== void 0 && !hex(value.manifestDigest) || value.sourceHeadDigest !== void 0 && !hex(value.sourceHeadDigest) || value.maintenanceDigest !== void 0 && !hex(value.maintenanceDigest) || value.maintenanceFiles !== void 0 && !validMaintenanceFiles(value.maintenanceFiles)) fail2("CORRUPT_BACKUP_JOURNAL");
  OperationId(value.operationId);
  RoleId(value.roleId);
  OperationId(value.stopOperationId);
  if (value.sourceRevision !== void 0) HomeRevision(value.sourceRevision);
  return value;
}
function maintenanceSnapshot(value) {
  if (!object(value) || Object.keys(value).sort().join("|") !== "currentOperationId|format|records|roleId|sourceHeadDigest|sourceRevision" || value.format !== "role-backup-maintenance-1" || !hex(value.sourceHeadDigest) || !Array.isArray(value.records)) fail2("INVALID_BACKUP_MAINTENANCE");
  const roleId = RoleId(value.roleId), sourceRevision = HomeRevision(value.sourceRevision), currentOperationId = OperationId(value.currentOperationId), records = value.records.map(recordValue);
  if (new Set(records.map((record) => record.operationId)).size !== records.length || records.some((record) => record.roleId !== roleId || Object.hasOwn(record, "frozenMaintenance") || Object.hasOwn(record, "format") || Object.hasOwn(record, "destinationIdentity")) || !records.some((record) => record.operationId === currentOperationId && record.phase === "stopped" && record.checkpoint === "stopped" && record.sourceRevision === sourceRevision && record.sourceHeadDigest === value.sourceHeadDigest)) fail2("INVALID_BACKUP_MAINTENANCE");
  return { format: "role-backup-maintenance-1", roleId, sourceRevision, sourceHeadDigest: value.sourceHeadDigest, currentOperationId, records };
}
function restoredMaintenanceSnapshots(value, roleId) {
  if (!Array.isArray(value)) fail2("INVALID_BACKUP_MAINTENANCE");
  const snapshots = value.map(maintenanceSnapshot);
  if (snapshots.some((snapshot) => snapshot.roleId !== roleId) || new Set(snapshots.map((snapshot) => hash(encode(snapshot)))).size !== snapshots.length) fail2("INVALID_BACKUP_MAINTENANCE");
  return snapshots;
}
function journal(value) {
  if (!object(value) || value.format !== "role-backup-task-1" || !object(value.record) || value.record.format !== "role-backup-task-1" || !hex(value.digest) || hash(encode(value.record)) !== value.digest) fail2("CORRUPT_BACKUP_JOURNAL");
  recordValue(value.record);
  if (value.record.destinationIdentity !== void 0 && (!object(value.record.destinationIdentity) || Object.keys(value.record.destinationIdentity).sort().join("|") !== "dev|ino" || typeof value.record.destinationIdentity.dev !== "string" || typeof value.record.destinationIdentity.ino !== "string" || !/^[0-9]+$/.test(value.record.destinationIdentity.dev) || !/^[0-9]+$/.test(value.record.destinationIdentity.ino))) fail2("CORRUPT_BACKUP_JOURNAL");
  if (value.record.frozenMaintenance !== void 0) {
    const snapshot = maintenanceSnapshot(value.record.frozenMaintenance);
    if (snapshot.roleId !== value.record.roleId || snapshot.currentOperationId !== value.record.operationId || snapshot.sourceRevision !== value.record.sourceRevision || hash(encode(snapshot)) !== value.record.maintenanceDigest) fail2("CORRUPT_BACKUP_JOURNAL");
  }
  return value.record;
}
function publicProgress(record) {
  const { format, frozenMaintenance, destinationIdentity, ...progress } = record;
  return structuredClone(progress);
}
function manifest(record, homeFormat) {
  if (record.sourceRevision === void 0 || !record.sourceHeadDigest || !record.maintenanceDigest || !record.maintenanceFiles) fail2("BACKUP_STOP_UNCONFIRMED");
  return { format: "role-backup-1", operationId: record.operationId, roleId: record.roleId, sourceRevision: record.sourceRevision, sourceHeadDigest: record.sourceHeadDigest, stopOperationId: record.stopOperationId, homeFormat: { major: homeFormat.major, minor: homeFormat.minor }, files: record.files, maintenanceDigest: record.maintenanceDigest, maintenanceFiles: record.maintenanceFiles };
}
var BackupStore = class {
  constructor(source, roleId, deps) {
    this.source = source;
    this.roleId = roleId;
    this.deps = deps;
    this.releaseAccess = deps.releaseAccess;
    this.homeClosed = !deps.releaseAccess;
  }
  serial = Promise.resolve();
  releaseAccess;
  homeClosed = false;
  pinned = false;
  run(fn) {
    const task = this.serial.then(fn);
    this.serial = task.catch(() => {
    });
    return task;
  }
  path(id) {
    return join2(this.source, ".maintenance", "backup-" + hash(id) + ".json");
  }
  async load(id) {
    try {
      const record = journal(await json(this.path(id)));
      if (record.operationId !== id || record.roleId !== this.roleId) fail2("CORRUPT_BACKUP_JOURNAL");
      return record;
    } catch (error) {
      if (absent(error)) return void 0;
      throw error;
    }
  }
  async save(record) {
    await directory(join2(this.source, ".maintenance"));
    await atomic(this.path(record.operationId), { format: "role-backup-task-1", record, digest: hash(encode(record)) });
  }
  async barrier(stage, record) {
    await this.deps.io.barrier?.(stage, { operationId: record.operationId, revision: record.sourceRevision ?? HomeRevision(0) });
  }
  async journals() {
    const result = [];
    if (!await exists(join2(this.source, ".maintenance"))) return result;
    await exactPath(join2(this.source, ".maintenance"));
    for (const name of (await readdir(join2(this.source, ".maintenance"))).sort()) {
      if (/^\.backup-[0-9a-f-]+\.pending$/.test(name)) continue;
      if (!/^backup-[a-f0-9]{64}\.json$/.test(name)) fail2("CORRUPT_BACKUP_JOURNAL");
      const record = journal(await json(join2(this.source, ".maintenance", name)));
      if (record.roleId !== this.roleId || this.path(record.operationId) !== join2(this.source, ".maintenance", name)) fail2("CORRUPT_BACKUP_JOURNAL");
      result.push(record);
    }
    return result;
  }
  async list() {
    return (await this.journals()).map(publicProgress);
  }
  async pending() {
    return (await this.list()).filter((record) => record.checkpoint !== "verified");
  }
  async read(operationId) {
    OperationId(operationId);
    const record = await this.load(operationId);
    return record ? publicProgress(record) : { operationId, roleId: this.roleId, destination: "", phase: "not-found", checkpoint: "requested", stopOperationId: operationId, files: [], copiedFiles: 0, verifiedFiles: 0 };
  }
  async destination(request) {
    OperationId(request.operationId);
    const path = await exactPath(request.destination, true);
    if (path === this.source || path.startsWith(this.source + sep) || this.source.startsWith(path + sep)) fail2("BACKUP_PATH_OVERLAP");
    return path;
  }
  async preflight(request) {
    const destination = await this.destination(request), previous = await this.load(request.operationId);
    if (previous && previous.destination !== destination) fail2("OPERATION_CONFLICT");
    if (!previous && await exists(destination) && (await readdir(destination)).length) fail2("BACKUP_DESTINATION_NOT_EMPTY");
  }
  async reserve(request, stopOperationId, seal) {
    return this.run(async () => {
      const destination = await this.destination(request), previous = await this.load(request.operationId);
      if (previous) {
        if (previous.destination !== destination) fail2("OPERATION_CONFLICT");
        if (previous.phase === "verified-restorable" || previous.sourceRevision !== void 0) return publicProgress(previous);
      }
      if (this.homeClosed && !this.deps.releaseAccess) fail2("BACKUP_STOP_REQUIRED");
      if ((await this.pending()).some((record2) => record2.operationId !== request.operationId)) fail2("MAINTENANCE_PENDING");
      if (!previous && await exists(destination) && (await readdir(destination)).length) fail2("BACKUP_DESTINATION_NOT_EMPTY");
      const record = previous ? { ...previous, phase: "stopping", stopOperationId } : { format: "role-backup-task-1", operationId: request.operationId, roleId: this.roleId, destination, phase: "stopping", checkpoint: "requested", stopOperationId, files: [], copiedFiles: 0, verifiedFiles: 0 };
      if (this.homeClosed && !this.releaseAccess) this.releaseAccess = await this.deps.acquire();
      seal?.();
      this.pinned = true;
      await this.save(record);
      await this.barrier("after-backup-request", record);
      return publicProgress(record);
    });
  }
  async verify(operationId) {
    return this.run(async () => {
      const record = await this.load(OperationId(operationId));
      if (!record) fail2("BACKUP_NOT_FOUND");
      if (record.checkpoint !== "verified") fail2("BACKUP_NOT_COMPLETE");
      const release = this.releaseAccess ? void 0 : await this.deps.acquire();
      try {
        let next;
        try {
          await verifyBackup(record.destination, { expectedRoleId: this.roleId, operationId }, this.deps.validate);
          const { error, ...clean } = record;
          next = { ...clean, phase: "verified-restorable" };
        } catch (error) {
          const errorCode = code(error);
          next = { ...record, phase: errorCode === "BACKUP_ACCESS_BUSY" ? "uncertain" : "failed", error: errorCode };
        }
        await this.save(next);
        return publicProgress(next);
      } finally {
        await release?.();
      }
    });
  }
  async freezeMaintenance(record, restored = []) {
    if (record.sourceRevision === void 0 || !record.sourceHeadDigest) fail2("BACKUP_STOP_UNCONFIRMED");
    const journals = await this.journals();
    let snapshot = record.frozenMaintenance;
    if (!snapshot) {
      const { maintenanceDigest: maintenanceDigest2, maintenanceFiles: maintenanceFiles2, manifestDigest, error, ...clean } = publicProgress(record), current = { ...clean, phase: "stopped", checkpoint: "stopped", copiedFiles: 0, verifiedFiles: 0 };
      snapshot = { format: "role-backup-maintenance-1", roleId: this.roleId, sourceRevision: HomeRevision(record.sourceRevision), sourceHeadDigest: record.sourceHeadDigest, currentOperationId: record.operationId, records: [...journals.filter((prior) => prior.operationId !== record.operationId).map(publicProgress), current].sort((a, b) => a.operationId.localeCompare(b.operationId)) };
    }
    const documents = /* @__PURE__ */ new Map();
    for (const snapshot2 of restored) documents.set(hash(encode(snapshot2)), snapshot2);
    for (const prior of journals) if (prior.frozenMaintenance) documents.set(hash(encode(prior.frozenMaintenance)), prior.frozenMaintenance);
    const maintenanceDigest = hash(encode(snapshot));
    documents.set(maintenanceDigest, snapshot);
    const maintenanceFiles = [...documents].sort(([a], [b]) => a.localeCompare(b)).map(([digest2, value]) => ({ path: digest2 + ".json", kind: "file", bytes: encode(value).length, digest: digest2 }));
    return { ...record, frozenMaintenance: snapshot, maintenanceDigest, maintenanceFiles };
  }
  async maintenanceDocuments(record) {
    const documents = /* @__PURE__ */ new Map();
    for (const snapshot of (await this.deps.validate(this.source, this.roleId)).maintenanceSnapshots ?? []) documents.set(hash(encode(snapshot)), encode(snapshot));
    for (const prior of await this.journals()) if (prior.frozenMaintenance) documents.set(hash(encode(prior.frozenMaintenance)), encode(prior.frozenMaintenance));
    if (record.frozenMaintenance) documents.set(hash(encode(record.frozenMaintenance)), encode(record.frozenMaintenance));
    for (const file of record.maintenanceFiles ?? []) if (!documents.has(file.digest) || documents.get(file.digest).length !== file.bytes) fail2("BACKUP_MAINTENANCE_MISSING");
    return documents;
  }
  async writerClosed() {
    this.homeClosed = true;
    if (!this.pinned && this.releaseAccess) {
      await this.releaseAccess();
      this.releaseAccess = void 0;
    }
  }
  async copy(request) {
    return this.run(async () => {
      const destination = await this.destination(request);
      let record = await this.load(request.operationId);
      if (!record || record.destination !== destination) fail2(record ? "OPERATION_CONFLICT" : "BACKUP_NOT_FOUND");
      if (record.phase === "verified-restorable") return publicProgress(record);
      if (!this.homeClosed || record.sourceRevision === void 0 && !this.deps.releaseAccess) fail2("BACKUP_STOP_REQUIRED");
      if (!this.releaseAccess) this.releaseAccess = await this.deps.acquire();
      try {
        if (await exists(join2(this.source, "writer.lock"))) fail2("BACKUP_WRITER_PRESENT");
        const source = await this.deps.validate(this.source, this.roleId);
        if (source.mode !== "healthy" || source.verifiedRoleId !== this.roleId || source.verifiedRevision === null) fail2("BACKUP_INVALID_SOURCE");
        const stopId = record.stopOperationId;
        if (!source.stops.some((stop) => stop.operationId === stopId && stop.checkpoint === "ready-to-close" && stop.checkpointRevision <= source.verifiedRevision)) fail2("BACKUP_STOP_UNCONFIRMED");
        const current = await inventory(this.source), head = hash(await bytes(join2(this.source, "head.json")));
        if (record.sourceRevision === void 0) {
          record = await this.freezeMaintenance({ ...record, phase: "stopped", checkpoint: "stopped", sourceRevision: source.verifiedRevision, sourceHeadDigest: head, files: current }, source.maintenanceSnapshots);
          await this.save(record);
          await this.barrier("after-backup-stopped", record);
        } else if (source.verifiedRevision !== record.sourceRevision || head !== record.sourceHeadDigest || !encode(current).equals(encode(record.files))) fail2("BACKUP_SOURCE_CHANGED");
        if (!record.frozenMaintenance) {
          record = await this.freezeMaintenance(record, source.maintenanceSnapshots);
          await this.save(record);
        }
        const maintenanceDocuments = await this.maintenanceDocuments(record);
        await directory(destination);
        const marker = join2(destination, "backup-operation.json"), identity = { format: "role-backup-copy-1", roleId: this.roleId, operationId: request.operationId, source: this.source, destination };
        const markerExists = await exists(marker);
        if (markerExists && !encode(await json(marker)).equals(encode(identity))) fail2("BACKUP_DESTINATION_CONFLICT");
        const stat = await lstat2(destination, { bigint: true }), destinationIdentity = { dev: String(stat.dev), ino: String(stat.ino) };
        if (record.destinationIdentity) {
          if (record.destinationIdentity.dev !== destinationIdentity.dev || record.destinationIdentity.ino !== destinationIdentity.ino) fail2("BACKUP_DESTINATION_CHANGED");
        } else {
          if (!markerExists && (await readdir(destination)).length) fail2("BACKUP_DESTINATION_NOT_EMPTY");
          record = { ...record, destinationIdentity };
          await this.save(record);
        }
        await cleanupUnpublished(destination, record);
        if (!markerExists) {
          if ((await readdir(destination)).length) fail2("BACKUP_DESTINATION_NOT_EMPTY");
          const checkpoint = record;
          await atomic(marker, identity, () => this.barrier("after-backup-marker-sync", checkpoint));
        }
        await directory(join2(destination, "home"));
        record = { ...record, phase: "copying", copiedFiles: 0 };
        await this.save(record);
        for (const file of record.files) {
          const target = join2(destination, "home", file.path);
          await this.barrier("before-backup-file", record);
          if (file.kind === "directory") await directory(target);
          else {
            await exactPath(dirname2(target));
            const value = await bytes(join2(this.source, file.path));
            if (value.length !== file.bytes || hash(value) !== file.digest) fail2("BACKUP_SOURCE_CHANGED");
            const checkpoint = record;
            await atomicBytes(target, value, () => this.barrier("after-backup-file-sync", checkpoint));
          }
          record = { ...record, copiedFiles: record.copiedFiles + 1 };
          await this.save(record);
          await this.barrier("after-backup-file", record);
        }
        await directory(join2(destination, "maintenance"));
        for (const file of record.maintenanceFiles ?? []) {
          const checkpoint = record;
          await atomicBytes(join2(destination, "maintenance", file.path), maintenanceDocuments.get(file.digest), () => this.barrier("after-backup-file-sync", checkpoint));
          record = { ...record, copiedFiles: record.copiedFiles + 1 };
          await this.save(record);
        }
        const authorityFormat = source.verifiedFormat ?? { major: 1, minor: 0 };
        const body = manifest(record, authorityFormat), manifestDigest = hash(encode(body));
        await atomic(join2(destination, "manifest.json"), { ...body, manifestDigest });
        record = { ...record, phase: "verifying", checkpoint: "manifest-published", manifestDigest };
        await this.save(record);
        await this.barrier("after-backup-manifest", record);
        await verifyBackup(destination, { expectedRoleId: this.roleId, operationId: request.operationId }, this.deps.validate);
        if (!encode(await inventory(this.source)).equals(encode(record.files)) || hash(await bytes(join2(this.source, "head.json"))) !== record.sourceHeadDigest) fail2("BACKUP_SOURCE_CHANGED");
        record = { ...record, phase: "verified-restorable", checkpoint: "verified", verifiedFiles: record.files.length + (record.maintenanceFiles?.length ?? 0) };
        const { error, ...clean } = record;
        record = clean;
        await this.save(record);
        await this.barrier("after-backup-verified", record);
        return publicProgress(record);
      } catch (error) {
        const failure = code(error);
        record = { ...record, phase: "failed", error: failure };
        try {
          await this.save(record);
        } catch {
          throw new HomeError("BACKUP_PROGRESS_UNCERTAIN");
        }
        return publicProgress(record);
      } finally {
        if (this.releaseAccess) {
          await this.releaseAccess();
          this.releaseAccess = void 0;
        }
        this.pinned = false;
      }
    });
  }
};
async function cleanupUnpublished(destination, record) {
  const declared = /* @__PURE__ */ new Set(["backup-operation.json", "manifest.json", "home", "maintenance", ...record.files.map((file) => "home/" + file.path), ...(record.maintenanceFiles ?? []).map((file) => "maintenance/" + file.path)]);
  const directories = /* @__PURE__ */ new Set(["", "home", "maintenance", ...record.files.filter((file) => file.kind === "directory").map((file) => "home/" + file.path)]);
  const walk = async (relative2) => {
    const path = join2(destination, relative2);
    await exactPath(path);
    for (const name of await readdir(path)) {
      const entry = relative2 ? relative2 + "/" + name : name, full = join2(destination, entry), stat = await lstat2(full);
      if (stat.isSymbolicLink()) fail2("UNSAFE_BACKUP_FILE");
      if (!declared.has(entry) && /^\.backup-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pending$/.test(name)) {
        if (!stat.isFile() || stat.nlink !== 1) fail2("UNSAFE_BACKUP_FILE");
        await unlink(full);
        await syncDir(path);
      } else if (stat.isDirectory() && directories.has(entry)) await walk(entry);
    }
  };
  await walk("");
}
async function atomicBytes(path, value, afterSync) {
  await exactPath(dirname2(path));
  if (await exists(path)) await bytes(path);
  const temp = join2(dirname2(path), ".backup-" + randomUUID() + ".pending"), fd = await open(temp, "wx", 384);
  try {
    await fd.writeFile(value);
    await fd.sync();
  } finally {
    await fd.close();
  }
  try {
    await afterSync?.();
    await rename(temp, path);
    await syncDir(dirname2(path));
  } finally {
    await unlink(temp).catch(() => {
    });
  }
}
async function verifyBackup(destination, options, validate) {
  await exactPath(destination);
  const value = await json(join2(destination, "manifest.json"));
  if (!object(value)) fail2("INVALID_BACKUP_MANIFEST");
  const { manifestDigest, ...body } = value;
  if (Object.keys(body).sort().join("|") !== "files|format|homeFormat|maintenanceDigest|maintenanceFiles|operationId|roleId|sourceHeadDigest|sourceRevision|stopOperationId" || !hex(manifestDigest) || hash(encode(body)) !== manifestDigest || body.format !== "role-backup-1" || !validFiles(body.files) || !hex(body.maintenanceDigest) || !validMaintenanceFiles(body.maintenanceFiles) || !hex(body.sourceHeadDigest) || !object(body.homeFormat) || !Number.isSafeInteger(body.homeFormat.major) || !Number.isSafeInteger(body.homeFormat.minor)) fail2("INVALID_BACKUP_MANIFEST");
  const roleId = RoleId(body.roleId), operationId = OperationId(body.operationId), sourceRevision = HomeRevision(body.sourceRevision), stopOperationId = OperationId(body.stopOperationId);
  if (options.expectedRoleId !== void 0 && roleId !== options.expectedRoleId || options.operationId !== void 0 && operationId !== options.operationId) fail2("BACKUP_IDENTITY_CONFLICT");
  const names = (await readdir(destination)).sort();
  if (names.join("|") !== "backup-operation.json|home|maintenance|manifest.json") fail2("BACKUP_UNEXPECTED_CONTENT");
  const marker = await json(join2(destination, "backup-operation.json"));
  if (!object(marker) || Object.keys(marker).sort().join("|") !== "destination|format|operationId|roleId|source" || marker.format !== "role-backup-copy-1" || typeof marker.source !== "string" || typeof marker.destination !== "string" || marker.roleId !== roleId || marker.operationId !== operationId) fail2("BACKUP_DESTINATION_CONFLICT");
  for (const lock of ["writer.lock", ".maintenance.lock"]) if (await exists(join2(destination, "home", lock))) fail2("BACKUP_ACCESS_BUSY");
  const actual = await inventory(join2(destination, "home"), false);
  if (!encode(actual).equals(encode(body.files))) fail2("BACKUP_CONTENT_MISMATCH");
  const authority = await validate(join2(destination, "home"), roleId);
  const authorityFormat = authority.verifiedFormat;
  if (authorityFormat && (authorityFormat.major !== body.homeFormat.major || authorityFormat.minor !== body.homeFormat.minor)) fail2("INVALID_BACKUP_MANIFEST");
  if (authority.mode !== "healthy" || authority.verifiedRoleId !== roleId || authority.verifiedRevision !== sourceRevision || !authority.stops.some((stop) => stop.operationId === stopOperationId && stop.checkpoint === "ready-to-close" && stop.checkpointRevision <= sourceRevision) || hash(await bytes(join2(destination, "home/head.json"))) !== body.sourceHeadDigest) fail2("BACKUP_AUTHORITY_INVALID");
  await verifyMaintenanceFiles(destination, { operationId, roleId, sourceRevision, sourceHeadDigest: body.sourceHeadDigest, stopOperationId, files: body.files, maintenanceDigest: body.maintenanceDigest, maintenanceFiles: body.maintenanceFiles }, authority);
  return { operationId, roleId, destination, phase: "verified-restorable", checkpoint: "verified", stopOperationId, sourceRevision, sourceHeadDigest: body.sourceHeadDigest, files: body.files, copiedFiles: body.files.length + body.maintenanceFiles.length, verifiedFiles: body.files.length + body.maintenanceFiles.length, manifestDigest, maintenanceDigest: body.maintenanceDigest, maintenanceFiles: body.maintenanceFiles };
}
async function verifyMaintenanceFiles(destination, manifest2, authority) {
  const path = join2(destination, "maintenance");
  try {
    await exactPath(path);
  } catch (error) {
    if (absent(error)) fail2("BACKUP_MAINTENANCE_MISSING");
    throw error;
  }
  if ((await readdir(path)).sort().join("|") !== manifest2.maintenanceFiles.map((file) => file.path).sort().join("|")) fail2("BACKUP_MAINTENANCE_MISSING");
  const documents = /* @__PURE__ */ new Map();
  for (const file of manifest2.maintenanceFiles) {
    let value;
    try {
      value = await bytes(join2(path, file.path));
    } catch (error) {
      if (absent(error)) fail2("BACKUP_MAINTENANCE_MISSING");
      throw error;
    }
    if (value.length !== file.bytes || hash(value) !== file.digest) fail2("BACKUP_MAINTENANCE_CORRUPT");
    const snapshot = maintenanceSnapshot(parseProjectionJSON(new TextDecoder("utf-8", { fatal: true }).decode(value)));
    if (snapshot.roleId !== manifest2.roleId || snapshot.sourceRevision > manifest2.sourceRevision) fail2("INVALID_BACKUP_MAINTENANCE");
    documents.set(file.digest, snapshot);
  }
  const current = documents.get(manifest2.maintenanceDigest);
  if (!current || current.currentOperationId !== manifest2.operationId || current.sourceRevision !== manifest2.sourceRevision || current.sourceHeadDigest !== manifest2.sourceHeadDigest) fail2("INVALID_BACKUP_MAINTENANCE");
  const record = current.records.find((record2) => record2.operationId === manifest2.operationId);
  if (!record || record.stopOperationId !== manifest2.stopOperationId || !encode(record.files).equals(encode(manifest2.files))) fail2("INVALID_BACKUP_MAINTENANCE");
  for (const snapshot of documents.values()) for (const record2 of snapshot.records) {
    if (record2.maintenanceDigest && !documents.has(record2.maintenanceDigest)) fail2("BACKUP_MAINTENANCE_MISSING");
    for (const file of record2.maintenanceFiles ?? []) if (!documents.has(file.digest)) fail2("BACKUP_MAINTENANCE_MISSING");
    if (authority && record2.sourceRevision !== void 0 && !authority.stops.some((stop) => stop.operationId === record2.stopOperationId && stop.checkpoint === "ready-to-close" && stop.checkpointRevision <= record2.sourceRevision)) fail2("INVALID_BACKUP_MAINTENANCE");
  }
  return [...documents.values()];
}
async function readMaintenance(destination, options, validate) {
  const currentReceipt = await verifyBackup(destination, options, validate);
  if (!currentReceipt.maintenanceDigest || !currentReceipt.maintenanceFiles || currentReceipt.sourceRevision === void 0 || !currentReceipt.sourceHeadDigest) fail2("INVALID_BACKUP_MAINTENANCE");
  const retainedSnapshots = await verifyMaintenanceFiles(destination, { operationId: currentReceipt.operationId, roleId: currentReceipt.roleId, sourceRevision: currentReceipt.sourceRevision, sourceHeadDigest: currentReceipt.sourceHeadDigest, stopOperationId: currentReceipt.stopOperationId, files: currentReceipt.files, maintenanceDigest: currentReceipt.maintenanceDigest, maintenanceFiles: currentReceipt.maintenanceFiles });
  const snapshot = retainedSnapshots.find((value) => hash(encode(value)) === currentReceipt.maintenanceDigest);
  if (!snapshot) fail2("INVALID_BACKUP_MAINTENANCE");
  return { snapshot, retainedSnapshots, currentReceipt };
}
function restorePublic(record) {
  const { format, fingerprint: fingerprint2, destinationIdentity, acceptanceOperationId, ...progress } = record;
  return structuredClone(progress);
}
async function restoreJournal(destination) {
  try {
    await exactPath(join2(destination, ".restore"));
    const wrapped = await json(join2(destination, ".restore", "operation.json"));
    if (!object(wrapped) || wrapped.format !== "role-restore-journal-1" || Object.keys(wrapped).sort().join("|") !== "digest|format|record" || !object(wrapped.record) || wrapped.record.format !== "role-restore-task-1" || !hex(wrapped.digest) || hash(encode(wrapped.record)) !== wrapped.digest) fail2("CORRUPT_RESTORE_JOURNAL");
    const r = wrapped.record;
    if (Object.keys(r).some((key2) => !["format", "operationId", "roleId", "backupPath", "destination", "phase", "manifestDigest", "sourceRevision", "sourceStopOperationId", "files", "copiedFiles", "verifiedFiles", "error", "fingerprint", "destinationIdentity", "acceptanceOperationId"].includes(key2)) || !hex(r.fingerprint) || !object(r.destinationIdentity) || Object.keys(r.destinationIdentity).sort().join("|") !== "dev|ino" || typeof r.destinationIdentity.dev !== "string" || !/^\d+$/.test(r.destinationIdentity.dev) || typeof r.destinationIdentity.ino !== "string" || !/^\d+$/.test(r.destinationIdentity.ino) || typeof r.backupPath !== "string" || r.destination !== destination || !["copying", "verifying", "awaiting-handover", "accepted", "uncertain", "failed"].includes(String(r.phase)) || !validFiles(r.files) || !Number.isSafeInteger(r.copiedFiles) || Number(r.copiedFiles) < 0 || !Number.isSafeInteger(r.verifiedFiles) || Number(r.verifiedFiles) < 0 || r.error !== void 0 && typeof r.error !== "string") fail2("CORRUPT_RESTORE_JOURNAL");
    return { format: "role-restore-task-1", operationId: OperationId(r.operationId), roleId: RoleId(r.roleId), backupPath: r.backupPath, destination, phase: r.phase === "copying" ? "copying" : r.phase === "verifying" ? "verifying" : r.phase === "awaiting-handover" ? "awaiting-handover" : r.phase === "accepted" ? "accepted" : r.phase === "uncertain" ? "uncertain" : "failed", manifestDigest: BackupManifestDigest(r.manifestDigest), sourceRevision: HomeRevision(r.sourceRevision), sourceStopOperationId: OperationId(r.sourceStopOperationId), files: r.files, copiedFiles: Number(r.copiedFiles), verifiedFiles: Number(r.verifiedFiles), ...typeof r.error === "string" ? { error: r.error } : {}, ...r.acceptanceOperationId !== void 0 ? { acceptanceOperationId: OperationId(r.acceptanceOperationId) } : {}, fingerprint: r.fingerprint, destinationIdentity: { dev: r.destinationIdentity.dev, ino: r.destinationIdentity.ino } };
  } catch (error) {
    if (absent(error)) return void 0;
    throw error;
  }
}
async function saveRestore(record) {
  await directory(join2(record.destination, ".restore"));
  await atomic(join2(record.destination, ".restore", "operation.json"), { format: "role-restore-journal-1", record, digest: hash(encode(record)) });
}
async function readRestore(destination, request) {
  OperationId(request.operationId);
  RoleId(request.expectedRoleId);
  await exactPath(destination, true);
  const record = await restoreJournal(destination);
  if (!record) return { operationId: request.operationId, roleId: request.expectedRoleId, backupPath: "", destination, phase: "not-found", files: [], copiedFiles: 0, verifiedFiles: 0 };
  if (record.operationId !== request.operationId || record.roleId !== request.expectedRoleId) fail2("RESTORE_IDENTITY_CONFLICT");
  return restorePublic(record);
}
async function restoreBackup(request, deps) {
  if (!validateRestoreRequest(request)) fail2("INVALID_RESTORE_REQUEST");
  const backupPath = await exactPath(request.backupPath), destination = await exactPath(request.destination, true);
  if (destination === backupPath || destination.startsWith(backupPath + sep) || backupPath.startsWith(destination + sep)) fail2("RESTORE_PATH_OVERLAP");
  const source = await verifyBackup(backupPath, { expectedRoleId: request.expectedRoleId }, deps.validate);
  if (source.manifestDigest !== request.expectedManifestDigest) fail2("RESTORE_MANIFEST_CONFLICT");
  const fingerprint2 = hash(encode({ operationId: request.operationId, backupPath, destination, expectedRoleId: request.expectedRoleId, expectedManifestDigest: request.expectedManifestDigest }));
  let previous;
  if (await exists(destination)) {
    if (await exists(join2(destination, "writer.lock"))) fail2("HOME_BUSY");
    previous = await restoreJournal(destination);
    if (!previous && (await readdir(destination)).length) fail2("RESTORE_DESTINATION_NOT_EMPTY");
  }
  await directory(destination);
  const release = await deps.acquire(destination);
  let record;
  try {
    previous = await restoreJournal(destination);
    if (!previous && (await readdir(destination)).some((name) => name !== ".maintenance.lock")) fail2("RESTORE_DESTINATION_NOT_EMPTY");
    if (previous && (previous.manifestDigest !== source.manifestDigest || previous.sourceRevision !== source.sourceRevision || previous.sourceStopOperationId !== source.stopOperationId || !encode(previous.files).equals(encode(source.files)))) fail2("CORRUPT_RESTORE_JOURNAL");
    if (previous && (previous.operationId !== request.operationId || previous.roleId !== request.expectedRoleId || previous.fingerprint !== fingerprint2)) fail2("OPERATION_CONFLICT");
    const stat = await lstat2(destination, { bigint: true }), identity = { dev: String(stat.dev), ino: String(stat.ino) };
    if (previous && (previous.destinationIdentity.dev !== identity.dev || previous.destinationIdentity.ino !== identity.ino)) fail2("RESTORE_DESTINATION_CHANGED");
    record = previous ?? { format: "role-restore-task-1", operationId: request.operationId, roleId: request.expectedRoleId, backupPath, destination, phase: "copying", manifestDigest: request.expectedManifestDigest, sourceRevision: source.sourceRevision, sourceStopOperationId: source.stopOperationId, files: source.files, copiedFiles: 0, verifiedFiles: 0, fingerprint: fingerprint2, destinationIdentity: identity };
    await saveRestore(record);
    await deps.io.barrier?.("after-restore-request", { operationId: record.operationId, revision: record.sourceRevision ?? HomeRevision(0) });
    let copiedFiles = 0;
    for (const file of source.files) {
      await deps.io.barrier?.("before-restore-file", { operationId: record.operationId, revision: record.sourceRevision ?? HomeRevision(0) });
      const target = join2(destination, file.path);
      if (file.kind === "directory") await directory(target);
      else {
        await exactPath(dirname2(join2(backupPath, "home", file.path)));
        await exactPath(dirname2(target));
        const value = await bytes(join2(backupPath, "home", file.path));
        if (value.length !== file.bytes || hash(value) !== file.digest) fail2("RESTORE_SOURCE_CHANGED");
        if (await exists(target)) {
          const current = await bytes(target);
          if (!current.equals(value)) fail2("RESTORE_DESTINATION_CONFLICT");
        } else await atomicBytes(target, value);
      }
      record = { ...record, phase: "copying", copiedFiles: ++copiedFiles };
      await saveRestore(record);
      await deps.io.barrier?.("after-restore-file", { operationId: record.operationId, revision: record.sourceRevision ?? HomeRevision(0) });
    }
    record = { ...record, phase: "verifying" };
    await saveRestore(record);
    if (!encode(await inventory(destination)).equals(encode(source.files))) fail2("RESTORE_CONTENT_MISMATCH");
    const restored = await deps.validate(destination, request.expectedRoleId);
    if (restored.mode !== "healthy" || restored.verifiedRevision !== source.sourceRevision) fail2("RESTORE_AUTHORITY_INVALID");
    const rechecked = await verifyBackup(backupPath, { expectedRoleId: request.expectedRoleId }, deps.validate);
    if (rechecked.manifestDigest !== request.expectedManifestDigest) fail2("RESTORE_SOURCE_CHANGED");
    const { error: previousError, ...confirmed } = record;
    record = { ...confirmed, phase: "awaiting-handover", verifiedFiles: source.files.length };
    await saveRestore(record);
    return restorePublic(record);
  } catch (error) {
    if (!record) throw error;
    record = { ...record, phase: "uncertain", error: code(error) };
    await saveRestore(record);
    return restorePublic(record);
  } finally {
    await release();
  }
}
async function localRestoreRecord(root) {
  await exactPath(root);
  const record = await restoreJournal(root);
  if (!record) fail2("RESTORE_NOT_FOUND");
  const stat = await lstat2(root, { bigint: true });
  if (String(stat.dev) !== record.destinationIdentity.dev || String(stat.ino) !== record.destinationIdentity.ino) fail2("RESTORE_DESTINATION_CHANGED");
  return record;
}
async function prepareRestoreAcceptance(root, request, roleId, alreadyCommitted, validate) {
  const record = await localRestoreRecord(root);
  if (record.operationId !== request.restoreOperationId || record.roleId !== roleId || record.manifestDigest !== request.expectedManifestDigest) fail2("RESTORE_IDENTITY_CONFLICT");
  if (record.phase !== "awaiting-handover" && record.phase !== "accepted") fail2("RESTORE_NOT_VERIFIED");
  if (record.acceptanceOperationId && record.acceptanceOperationId !== request.operationId) fail2("OPERATION_CONFLICT");
  const source = await verifyBackup(record.backupPath, { expectedRoleId: roleId }, validate);
  if (source.manifestDigest !== record.manifestDigest || source.sourceRevision !== record.sourceRevision || source.stopOperationId !== record.sourceStopOperationId) fail2("RESTORE_SOURCE_CHANGED");
  const maintenance = await readMaintenance(record.backupPath, { expectedRoleId: roleId }, validate);
  return { progress: restorePublic(record), backupOperationId: source.operationId, maintenanceSnapshots: maintenance.retainedSnapshots, async validateTarget(additionalBlobRefs) {
    if (alreadyCommitted) return;
    const original = new Set(source.files.map((file) => file.path));
    const current = (await inventory(root)).filter((file) => original.has(file.path) || !/^blobs\/[a-f0-9]{64}\.json$/.test(file.path) || !additionalBlobRefs.has(file.path.slice(6, -5)));
    if (!encode(current).equals(encode(source.files))) fail2("RESTORE_CONTENT_MISMATCH");
  } };
}
async function markRestoreAccepted(root, acceptance) {
  const record = await localRestoreRecord(root);
  if (record.operationId !== acceptance.restoreOperationId || record.manifestDigest !== acceptance.manifestDigest || record.sourceRevision !== acceptance.sourceRevision || record.sourceStopOperationId !== acceptance.sourceStopOperationId || record.acceptanceOperationId && record.acceptanceOperationId !== acceptance.operationId) fail2("RESTORE_IDENTITY_CONFLICT");
  const { error, ...confirmed } = record;
  await saveRestore({ ...confirmed, phase: "accepted", acceptanceOperationId: acceptance.operationId });
}
async function locallyAcceptedRestore(root, acceptance) {
  let record;
  try {
    record = await localRestoreRecord(root);
  } catch (error) {
    if (absent(error) || error instanceof HomeError && error.code === "RESTORE_NOT_FOUND") return false;
    throw error;
  }
  return record.phase === "accepted" && record.acceptanceOperationId === acceptance.operationId && record.operationId === acceptance.restoreOperationId && record.manifestDigest === acceptance.manifestDigest && record.sourceRevision === acceptance.sourceRevision && record.sourceStopOperationId === acceptance.sourceStopOperationId;
}
async function acceptedRestoreSource(root, acceptance) {
  if (!acceptance) return void 0;
  const record = await localRestoreRecord(root);
  if (record.phase !== "accepted" || record.acceptanceOperationId !== acceptance.operationId || record.operationId !== acceptance.restoreOperationId || record.manifestDigest !== acceptance.manifestDigest || record.sourceRevision !== acceptance.sourceRevision || record.sourceStopOperationId !== acceptance.sourceStopOperationId) fail2("RESTORE_LOCAL_PROOF_UNAVAILABLE");
  return { operationId: record.operationId, backupPath: record.backupPath, destination: root, expectedRoleId: record.roleId, expectedManifestDigest: record.manifestDigest };
}

// packages/companion/src/home/qq-key.ts
import { createHash as createHash4 } from "node:crypto";
function qqInputIdentity(binding, source) {
  const hash3 = createHash4("sha256").update(JSON.stringify([binding.bindingId, binding.version, source.connectionId, source.accountId, source.peerId, source.direction, source.messageId])).digest("hex");
  return { externalKey: InputKey("qq-" + hash3), operationId: OperationId("qq-input-" + hash3) };
}

// packages/companion/src/home/qq-history.ts
import { createHash as createHash5 } from "node:crypto";
var token2 = (value, prefix) => {
  if (typeof value !== "string" || !new RegExp("^" + prefix + "[0-9a-f]{64}$").test(value)) throw new HomeError("INVALID_QQ_HISTORY_ID");
  return value;
};
var QQHistoryQueryId = (value) => token2(value, "history-");
var QQHistoryRequestId = (value) => token2(value, "history-request-");
var QQHistoryCandidateId = (value) => token2(value, "history-candidate-");
var historyDigest = (value) => createHash5("sha256").update(value).digest("hex");
function validQQHistoryPolicy(value) {
  if (!plainExact(value, ["pageSize", "maxPages", "cooldownMs", "readTimeoutMs", "configurationVersion"])) return false;
  return ["pageSize", "maxPages", "cooldownMs", "readTimeoutMs"].every((key2) => typeof value[key2] === "number" && Number.isSafeInteger(value[key2]) && Number(value[key2]) >= 1) && Number(value.pageSize) <= 200 && Number(value.maxPages) <= 16 && Number(value.cooldownMs) <= 2147483647 && Number(value.readTimeoutMs) <= 2147483647 && typeof value.configurationVersion === "number" && Number.isSafeInteger(value.configurationVersion) && value.configurationVersion >= 0;
}
function historyInputOperation(selection, candidate) {
  return OperationId("history-input-" + historyDigest(selection + "\0" + candidate));
}
function validateHistoryInput(input, state) {
  const source = input.historySource;
  if (input.origin !== "history" || !source || !plainExact(source, ["queryId", "candidateId", "selectionOperationId", "reportedAt"])) throw new HomeError("INVALID_INPUT");
  const q = state.queries.find((q2) => q2.queryId === source.queryId), selection = state.selections.find((x) => x.operationId === source.selectionOperationId), candidate = q?.candidates.find((c) => c.candidateId === source.candidateId);
  if (!q || !selection || selection.queryId !== q.queryId || !selection.candidateIds.includes(source.candidateId) || !candidate?.eligible || input.operationId !== historyInputOperation(selection.operationId, candidate.candidateId) || input.channel !== "qq" || input.bindingId !== q.target.bindingId || input.bindingVersion !== q.target.version || input.qqSource?.messageId !== candidate.messageId || input.text !== candidate.text || source.reportedAt !== candidate.reportedAt || input.sourceEvidence !== "explicitly-selected-onebot-history") throw new HomeError("INVALID_INPUT");
}
var emptyQQHistory = () => ({ queries: [], selections: [] });
function qqHistoryBusiness(fact) {
  if (fact.action === "select") {
    const { startedAt, phase, receipts, ...selection } = fact.selection;
    return { action: fact.action, selection };
  }
  if (fact.action !== "begin") return fact;
  const q = fact.query;
  return { action: fact.action, queryId: q.queryId, operationId: q.operationId, trigger: q.trigger, target: q.target, policy: q.policy, anchor: q.anchor };
}
var validTime = (value) => typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));
var invalid4 = () => {
  throw new HomeError("CORRUPT_QQ_HISTORY");
};
function checkRow(row) {
  if (!plainExact(row, ["messageId", "kind", "text", "reportedAt", "reason"]) || !["incoming-friend-text", "outgoing", "unsupported"].includes(row.kind) || row.text !== null && typeof row.text !== "string" || row.reportedAt !== null && !validTime(row.reportedAt) || typeof row.reason !== "string") return invalid4();
  if (row.messageId !== null) QQMessageId(row.messageId);
  if (row.kind === "incoming-friend-text" && (!row.messageId || !row.text || Buffer.byteLength(row.text) > 1048576 || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(row.text))) return invalid4();
}
function applyQQHistoryFact(state, value, scope) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid4();
  const fact = value;
  if (fact.action === "select") {
    if (!plainExact(fact, ["action", "selection"])) return invalid4();
    const selection = fact.selection, q2 = state.queries.find((q3) => q3.queryId === selection.queryId);
    if (!plainExact(selection, ["operationId", "queryId", "candidateIds", "acknowledgedGap", "startedAt", "phase", "receipts"]) || !q2 || q2.phase !== "gap" || !sameQQTarget(scope.binding, q2.target) || selection.acknowledgedGap !== true || !Array.isArray(selection.candidateIds) || selection.candidateIds.length < 1 || selection.candidateIds.length > 200 || new Set(selection.candidateIds).size !== selection.candidateIds.length || selection.candidateIds.some((id) => !q2.candidates.find((c) => c.candidateId === id)?.eligible) || !validTime(selection.startedAt) || selection.phase !== "pending" || !Array.isArray(selection.receipts) || selection.receipts.length || state.selections.some((x) => x.operationId === selection.operationId)) return invalid4();
    OperationId(selection.operationId);
    return { ...state, selections: [...state.selections, structuredClone(selection)] };
  }
  if (fact.action === "selection-receipt" || fact.action === "selection-finish") {
    const selected = state.selections.find((s) => s.operationId === fact.selectionOperationId);
    if (!selected || selected.phase !== "pending") return invalid4();
    let next2 = selected;
    if (fact.action === "selection-receipt") {
      if (!plainExact(fact, ["action", "selectionOperationId", "candidateId", "receipt"]) || !selected.candidateIds.includes(fact.candidateId) || selected.receipts.some((r) => r.candidateId === fact.candidateId) || !fact.receipt || !["accepted", "duplicate", "rejected"].includes(fact.receipt.kind)) return invalid4();
      if (fact.receipt.kind === "accepted" || fact.receipt.kind === "duplicate") {
        const receipt = fact.receipt, q2 = state.queries.find((q3) => q3.queryId === selected.queryId), candidate = q2.candidates.find((c) => c.candidateId === fact.candidateId), input = scope.inputs.find((i) => i.inputId === receipt.inputId);
        if (!input || input.text !== candidate.text || input.qqSource?.messageId !== candidate.messageId || input.bindingId !== q2.target.bindingId || input.bindingVersion !== q2.target.version || receipt.operationId !== input.operationId || receipt.receiveSequence !== input.receiveSequence || receipt.committedRevision !== input.committedRevision || receipt.roleId !== scope.roleId) return invalid4();
      }
      next2 = { ...selected, receipts: [...selected.receipts, structuredClone({ candidateId: fact.candidateId, receipt: fact.receipt })] };
    } else {
      if (!plainExact(fact, ["action", "selectionOperationId"]) || selected.receipts.length !== selected.candidateIds.length) return invalid4();
      next2 = { ...selected, phase: "completed" };
    }
    return { ...state, selections: state.selections.map((s) => s === selected ? next2 : s) };
  }
  if (fact.action === "begin") {
    if (!plainExact(fact, ["action", "query"])) return invalid4();
    const q2 = fact.query;
    if (!plainExact(q2, ["queryId", "operationId", "trigger", "target", "policy", "startedAt", "anchor", "phase", "gapReasons", "requests", "candidates"])) return invalid4();
    QQHistoryQueryId(q2.queryId);
    OperationId(q2.operationId);
    admitQQBinding(q2.target, scope.roleId);
    if (q2.queryId !== "history-" + historyDigest(q2.operationId) || !["owner", "reconnect"].includes(q2.trigger) || !sameQQTarget(scope.binding, q2.target) || !validQQHistoryPolicy(q2.policy) || !validTime(q2.startedAt) || q2.phase !== "running" || !Array.isArray(q2.gapReasons) || !Array.isArray(q2.requests) || !Array.isArray(q2.candidates) || q2.gapReasons.length || q2.requests.length || q2.candidates.length || state.queries.some((x) => x.queryId === q2.queryId || x.phase === "running")) return invalid4();
    if (q2.anchor !== null) {
      if (!plainExact(q2.anchor, ["inputId", "messageId", "text"])) return invalid4();
      InputId(q2.anchor.inputId);
      QQMessageId(q2.anchor.messageId);
      const input = scope.inputs.find((x) => x.inputId === q2.anchor.inputId);
      if (!input || input.channel !== "qq" || input.bindingId !== q2.target.bindingId || input.bindingVersion !== q2.target.version || input.qqSource?.messageId !== q2.anchor.messageId || input.text !== q2.anchor.text) return invalid4();
    }
    return { ...state, queries: [...state.queries, structuredClone(q2)] };
  }
  if (!["reserve", "enter", "observe", "finish"].includes(fact.action)) return invalid4();
  QQHistoryQueryId(fact.queryId);
  const q = state.queries.find((x) => x.queryId === fact.queryId);
  if (!q || q.phase !== "running") return invalid4();
  let next = q;
  if (fact.action === "reserve") {
    if (!plainExact(fact, ["action", "queryId", "request"])) return invalid4();
    const r = fact.request;
    QQHistoryRequestId(r.requestId);
    if (!plainExact(r, ["requestId", "pageIndex", "anchorMessageId", "limit", "reservedAt"]) || r.pageIndex !== q.requests.length || r.pageIndex >= q.policy.maxPages || r.limit !== q.policy.pageSize || !validTime(r.reservedAt) || !sameQQTarget(scope.binding, q.target) || q.requests.some((x) => !x.outcome)) return invalid4();
    const prior = q.requests.at(-1);
    if (prior && (!prior.rangeEstablished || !prior.nextAnchorMessageId || prior.outcome?.kind !== "response" || prior.outcome.rows.length !== q.policy.pageSize)) return invalid4();
    if (r.anchorMessageId !== (prior?.nextAnchorMessageId ?? q.anchor?.messageId ?? null)) return invalid4();
    if (r.anchorMessageId !== null) QQMessageId(r.anchorMessageId);
    next = { ...q, requests: [...q.requests, structuredClone(r)] };
  } else if (fact.action === "enter") {
    if (!plainExact(fact, ["action", "queryId", "requestId", "now"]) || !validTime(fact.now) || !sameQQTarget(scope.binding, q.target)) return invalid4();
    const r = q.requests.find((x) => x.requestId === fact.requestId);
    if (!r || r.enteredAt || r.outcome) return invalid4();
    next = { ...q, requests: q.requests.map((x) => x === r ? { ...r, enteredAt: fact.now } : x) };
  } else if (fact.action === "observe") {
    if (!plainExact(fact, ["action", "queryId", "requestId", "outcome"])) return invalid4();
    const r = q.requests.find((x) => x.requestId === fact.requestId), o = fact.outcome;
    if (!r || r.outcome || !o || !validTime(o.observedAt)) return invalid4();
    let rangeEstablished = false, nextAnchorMessageId, candidates = [...q.candidates], reasons = [...q.gapReasons];
    if (o.kind === "response") {
      if (!plainExact(o, ["kind", "observedAt", "generation", "echo", "responseJSON", "rows"]) || !r.enteredAt || typeof o.generation !== "string" || typeof o.echo !== "string" || typeof o.responseJSON !== "string" || Buffer.byteLength(o.responseJSON) > 16777216 || !Array.isArray(o.rows) || o.rows.length > r.limit) return invalid4();
      JSON.parse(o.responseJSON);
      for (const row of o.rows) checkRow(row);
      const previous = q.requests.at(-2), previousRow = previous?.outcome?.kind === "response" ? previous.outcome.rows.at(-1) : void 0, first = o.rows[0];
      const ordered = o.rows.every((row, i) => row.reportedAt !== null && (i === 0 || Date.parse(o.rows[i - 1].reportedAt) <= Date.parse(row.reportedAt)));
      const boundaryMatches = !!r.anchorMessageId && first?.messageId === r.anchorMessageId && (r.pageIndex === 0 ? first.kind === "incoming-friend-text" && first.text === q.anchor?.text : !!previous?.rangeEstablished && JSON.stringify(first) === JSON.stringify(previousRow));
      rangeEstablished = ordered && boundaryMatches;
      if (!ordered) reasons.push("QQ_HISTORY_ORDER_UNPROVEN");
      if (!boundaryMatches) reasons.push("QQ_HISTORY_ANCHOR_MISSING");
      reasons.push("QQ_HISTORY_COMPLETENESS_UNKNOWN");
      const previousIds = new Set(q.requests.flatMap((request) => request.outcome?.kind === "response" ? request.outcome.rows.flatMap((row) => row.messageId ? [row.messageId] : []) : []));
      const seen = /* @__PURE__ */ new Set();
      let progress = true;
      for (const [index, row] of o.rows.entries()) {
        if (!row.messageId || seen.has(row.messageId) || index > 0 && previousIds.has(row.messageId)) {
          progress = false;
          continue;
        }
        seen.add(row.messageId);
      }
      if (!progress) {
        rangeEstablished = false;
        reasons.push("QQ_HISTORY_PAGE_CYCLE");
      }
      for (const [index, row] of o.rows.entries()) {
        if (row.kind !== "incoming-friend-text" || !row.messageId || !row.text || index === 0 && row.messageId === r.anchorMessageId) continue;
        const prior = candidates.find((x) => x.messageId === row.messageId);
        if (prior) {
          if (prior.text !== row.text) {
            candidates = candidates.map((x) => x === prior ? { ...x, eligible: false, reason: "QQ_HISTORY_ID_CONFLICT" } : x);
            reasons.push("QQ_HISTORY_ID_CONFLICT");
          }
          continue;
        }
        const oldBinding = scope.inputs.some((input) => input.channel === "qq" && input.bindingVersion !== q.target.version && input.qqSource?.connectionId === q.target.connectionId && input.qqSource.accountId === q.target.accountId && input.qqSource.peerId === q.target.peerId && input.qqSource.messageId === row.messageId);
        const eligible = rangeEstablished && !oldBinding;
        const reason = oldBinding ? "QQ_HISTORY_BEFORE_BINDING" : eligible ? "" : "QQ_HISTORY_RANGE_UNPROVEN";
        candidates.push({ candidateId: QQHistoryCandidateId("history-candidate-" + historyDigest(q.queryId + "\0" + row.messageId)), requestId: r.requestId, messageId: row.messageId, text: row.text, reportedAt: row.reportedAt, eligible, reason });
      }
      const last = o.rows.at(-1);
      if (rangeEstablished && last?.messageId && last.messageId !== r.anchorMessageId) {
        if (last.kind === "unsupported") reasons.push("QQ_HISTORY_CURSOR_UNVERIFIED");
        else nextAnchorMessageId = last.messageId;
      }
    } else if (o.kind === "failed") {
      if (typeof o.code !== "string" || typeof o.dispatchObserved !== "boolean" || o.dispatchObserved && !r.enteredAt) return invalid4();
      reasons.push(o.code);
    } else return invalid4();
    next = { ...q, gapReasons: [...new Set(reasons)], candidates, requests: q.requests.map((x) => x === r ? { ...r, outcome: structuredClone(o), rangeEstablished, ...nextAnchorMessageId ? { nextAnchorMessageId } : {} } : x) };
  } else {
    if (!plainExact(fact, ["action", "queryId", "reason"]) || typeof fact.reason !== "string" || q.requests.some((x) => !x.outcome)) return invalid4();
    next = { ...q, phase: "gap", gapReasons: [.../* @__PURE__ */ new Set([...q.gapReasons, fact.reason])] };
  }
  return { ...state, queries: state.queries.map((x) => x === q ? next : x) };
}

// packages/companion/src/home/stops.ts
var isStopReason = (value) => value === "owner-stop" || value === "unload" || value === "migration";

// packages/companion/src/home/retry-rules.ts
var retryRulesDefaults = Object.freeze({ maxAutomaticRetries: 1, retryDelayMs: 1e3 });
function validateRetryRules(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).length !== 2 || Object.keys(value).sort().join("|") !== "maxAutomaticRetries|retryDelayMs") return false;
  for (const key2 of ["maxAutomaticRetries", "retryDelayMs"]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key2);
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "number" || !Number.isSafeInteger(descriptor.value)) return false;
  }
  return "maxAutomaticRetries" in value && typeof value.maxAutomaticRetries === "number" && value.maxAutomaticRetries >= 0 && value.maxAutomaticRetries <= 1 && "retryDelayMs" in value && typeof value.retryDelayMs === "number" && value.retryDelayMs >= 1 && value.retryDelayMs <= 2147483647;
}
var initialRetryRules = () => ({ version: RetryRulesVersion(1), value: retryRulesDefaults });

// packages/companion/src/home/model-operations.ts
function validateModelFailure(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((x) => !["code", "status", "providerRetryAfterMs"].includes(x)) || !("code" in value) || typeof value.code !== "string" || !/^[A-Z][A-Z0-9_]{1,63}$/.test(value.code)) return false;
  return (!("status" in value) || typeof value.status === "number" && Number.isSafeInteger(value.status) && value.status >= 100 && value.status <= 599) && (!("providerRetryAfterMs" in value) || typeof value.providerRetryAfterMs === "number" && Number.isFinite(value.providerRetryAfterMs) && value.providerRetryAfterMs > 0);
}
var transientModelFailure = (failure) => ["TRANSPORT", "TIMEOUT", "RATE_LIMIT", "SERVER"].includes(failure.code);
function validModelOperation(attempt, attempts) {
  const claim = attempt.modelOperation;
  if (!claim) return true;
  if (attempt.kind !== "model" || !["primary", "required-auxiliary", "compaction"].includes(claim.purpose) || Object.keys(claim).some((x) => !["logicalOpId", "purpose", "ordinal", "previousAttemptId"].includes(x))) return false;
  const previous = attempts.filter((x) => x.modelOperation?.logicalOpId === claim.logicalOpId);
  if (claim.ordinal === 0) return !previous.length && claim.previousAttemptId === void 0;
  if (claim.ordinal !== 1 || previous.length !== 1) return false;
  const first = previous[0];
  return first.runId === attempt.runId && first.source === attempt.source && first.modelOperation?.purpose === claim.purpose && first.modelOperation.ordinal === 0 && first.attemptId === claim.previousAttemptId && first.outcome?.kind === "failed" && !!first.outcome.modelFailure && transientModelFailure(first.outcome.modelFailure);
}

// packages/companion/src/home/read-rules.ts
var readRulesDefaults = Object.freeze({ toolConcurrency: 2, displayCodePoints: 12e3, readTimeoutMs: 1e4 });
var minimumReadDisplayCodePoints = 256;
function validateReadRules(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).length !== 3 || Object.keys(value).sort().join("|") !== "displayCodePoints|readTimeoutMs|toolConcurrency") return false;
  const keys = ["toolConcurrency", "displayCodePoints", "readTimeoutMs"];
  if (keys.some((key2) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key2);
    return !descriptor || !("value" in descriptor) || typeof descriptor.value !== "number" || !Number.isSafeInteger(descriptor.value);
  })) return false;
  if (!("toolConcurrency" in value) || typeof value.toolConcurrency !== "number" || value.toolConcurrency < 1 || !("displayCodePoints" in value) || typeof value.displayCodePoints !== "number" || value.displayCodePoints < minimumReadDisplayCodePoints || !("readTimeoutMs" in value) || typeof value.readTimeoutMs !== "number" || value.readTimeoutMs < 1 || value.readTimeoutMs > 2147483647) return false;
  return true;
}
var initialReadRules = () => ({ version: ReadRulesVersion(1), value: readRulesDefaults });

// packages/companion/src/home/settings.ts
function validateInputSettings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("|") !== "inputLimitBytes") return false;
  const limit = value.inputLimitBytes;
  return typeof limit === "number" && Number.isSafeInteger(limit) && limit >= 1 && limit <= 1048576;
}

// packages/companion/src/home/turns.ts
var conversationDefaults = Object.freeze({ modelLimit: 8, toolLimit: 16, webLimit: 4, windowMs: 6e5, outputTokens: 4096 });
function validateConversationSettings(value) {
  if (!value || typeof value !== "object" || Object.keys(value).sort().join("|") !== "modelLimit|outputTokens|toolLimit|webLimit|windowMs") return false;
  const v = value;
  return [v.modelLimit, v.toolLimit, v.webLimit].every((x) => Number.isSafeInteger(x) && x >= 0) && Number.isSafeInteger(v.outputTokens) && v.outputTokens > 0 && v.outputTokens <= 256e3 && Number.isSafeInteger(v.windowMs) && v.windowMs > 0 && v.windowMs <= 2147483647;
}
var emptyConversation = () => ({ contactRules: initialContactRules(), contact: emptyContact(), autonomy: initialAutonomy(), knowledge: emptyKnowledge(), proposalRules: initialProposalRules(), ...initialDeliveries(), rules: { version: ConversationVersion(1), value: conversationDefaults }, fileRules: initialFileRules(), fileAccess: initialFileAccess(), webRules: initialWebRules(), readRules: initialReadRules(), retryRules: initialRetryRules(), turns: [], attempts: [], replies: [], nativeRecords: [] });
function admitConversationFact(fact) {
  switch (fact.kind) {
    case "coalesce-wake":
    case "suspend-autonomous":
    case "resume-autonomous":
    case "request-wake":
    case "begin-autonomous":
    case "clock-blocked":
    case "set-autonomy-pause":
      return fact;
    case "edit-autonomy-rules":
      return { ...fact, version: AutonomyRulesVersion(fact.version) };
    case "clock-reviewed":
      return fact;
    case "rollback-knowledge":
    case "edit-proposal-rules":
    case "save-proposal":
    case "process-proposal":
      return fact;
    case "edit-file-access":
      return { ...fact, version: FileAccessVersion(fact.version) };
    case "edit-file-rules":
      return { ...fact, version: FileRulesVersion(fact.version) };
    case "resolve-delivery":
    case "begin-delivery":
    case "settle-delivery":
    case "edit-delivery-rules":
      return fact;
    case "edit-web-rules":
      return { ...fact, version: WebRulesVersion(fact.version) };
    case "reserve-web-tool": {
      const tool = admitConversationFact({ kind: "reserve-attempt", attempt: fact.tool, contextGeneration: fact.contextGeneration, settingsVersion: fact.settingsVersion }), web = admitConversationFact({ kind: "reserve-attempt", attempt: fact.web, contextGeneration: fact.contextGeneration, settingsVersion: fact.settingsVersion });
      if (tool.kind !== "reserve-attempt" || web.kind !== "reserve-attempt") throw Error("INVALID_WEB_FACT");
      return { ...fact, tool: tool.attempt, web: web.attempt, contextGeneration: ContextGeneration(fact.contextGeneration), settingsVersion: ConversationVersion(fact.settingsVersion) };
    }
    case "edit-retry-rules":
      return { ...fact, version: RetryRulesVersion(fact.version) };
    case "edit-contact-rules":
      return { ...fact, version: ContactRulesVersion(fact.version) };
    case "contact-intent":
      return { ...fact, intent: { ...fact.intent, intentId: ContactIntentId(fact.intent.intentId), runId: RunId(fact.intent.runId), proposalId: fact.intent.proposalId, knowledgeId: KnowledgeId(fact.intent.knowledgeId), knowledgeVersion: KnowledgeVersion(fact.intent.knowledgeVersion), committedRevision: HomeRevision(fact.intent.committedRevision), ...fact.intent.deliveryId ? { deliveryId: fact.intent.deliveryId } : {}, ...fact.intent.supersededBy ? { supersededBy: ContactIntentId(fact.intent.supersededBy) } : {} } };
    case "settle-contact-intent":
      return { ...fact, intentId: ContactIntentId(fact.intentId) };
    case "close-contact-intent":
      return { ...fact, intentId: ContactIntentId(fact.intentId), ...fact.supersededBy ? { supersededBy: ContactIntentId(fact.supersededBy) } : {} };
    case "edit-read-rules":
      return { ...fact, version: ReadRulesVersion(fact.version) };
    case "edit-conversation":
      return { ...fact, version: ConversationVersion(fact.version) };
    case "begin-turn": {
      const t = fact.turn;
      return { ...fact, turn: { ...t, groupId: InputGroupId(t.groupId), runId: RunId(t.runId), inputIds: t.inputIds.map(InputId), bindingId: BindingId(t.bindingId), bindingVersion: BindingVersion(t.bindingVersion), contextGeneration: ContextGeneration(t.contextGeneration), settingsVersion: ConversationVersion(t.settingsVersion), ...t.replyId ? { replyId: ReplyId(t.replyId) } : {} } };
    }
    case "reserve-attempt":
      return { ...fact, attempt: { ...fact.attempt, ...fact.attempt.fileAccessVersion !== void 0 ? { fileAccessVersion: FileAccessVersion(fact.attempt.fileAccessVersion) } : {}, ...fact.attempt.fileRules ? { fileRules: { ...fact.attempt.fileRules, version: FileRulesVersion(fact.attempt.fileRules.version) } } : {}, runId: RunId(fact.attempt.runId), attemptId: AttemptId(fact.attempt.attemptId), ...fact.attempt.webTool ? { webTool: { ...fact.attempt.webTool, logicalOpId: LogicalOpId(fact.attempt.webTool.logicalOpId), rules: { ...fact.attempt.webTool.rules, version: WebRulesVersion(fact.attempt.webTool.rules.version) } } } : {}, ...fact.attempt.webOperation ? { webOperation: { ...fact.attempt.webOperation, logicalOpId: LogicalOpId(fact.attempt.webOperation.logicalOpId), parentAttemptId: AttemptId(fact.attempt.webOperation.parentAttemptId), ...fact.attempt.webOperation.previousAttemptId ? { previousAttemptId: AttemptId(fact.attempt.webOperation.previousAttemptId) } : {} } } : {}, ...fact.attempt.retryRules ? { retryRules: { ...fact.attempt.retryRules, version: RetryRulesVersion(fact.attempt.retryRules.version) } } : {}, ...fact.attempt.modelOperation ? { modelOperation: { ...fact.attempt.modelOperation, logicalOpId: LogicalOpId(fact.attempt.modelOperation.logicalOpId), ...fact.attempt.modelOperation.previousAttemptId ? { previousAttemptId: AttemptId(fact.attempt.modelOperation.previousAttemptId) } : {} } } : {}, ...fact.attempt.readRules ? { readRules: { ...fact.attempt.readRules, version: ReadRulesVersion(fact.attempt.readRules.version) } } : {} }, contextGeneration: ContextGeneration(fact.contextGeneration), settingsVersion: ConversationVersion(fact.settingsVersion) };
    case "enter-attempt":
    case "record-attempt":
    case "observe-tool":
      return { ...fact, attemptId: AttemptId(fact.attemptId) };
    case "capture-material":
      return { ...fact, material: { ...fact.material, materialId: MaterialId(fact.material.materialId), attemptId: AttemptId(fact.material.attemptId) } };
    case "finish-turn":
      return { ...fact, runId: RunId(fact.runId), contextGeneration: ContextGeneration(fact.contextGeneration), ...fact.replyId ? { replyId: ReplyId(fact.replyId) } : {} };
    case "refresh-turn-context":
      return { ...fact, runId: RunId(fact.runId), previousGeneration: ContextGeneration(fact.previousGeneration), nextGeneration: ContextGeneration(fact.nextGeneration) };
    case "native-record":
      return { ...fact, record: { ...fact.record, runId: RunId(fact.record.runId), nativeId: NativeExposureId(fact.record.nativeId) } };
  }
}

// packages/companion/src/home/cleanup.ts
import { createHash as createHash6 } from "node:crypto";
var fail3 = () => {
  throw new HomeError("INVALID_CLEANUP_SELECTION");
};
var cleanupRefKey = (ref) => ref.kind === "core" ? "core" : ref.kind + ":" + ref.id + (ref.kind === "knowledge" ? ":" + ref.version : "");
function admitCleanupSelection(value) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join("|") !== "derived|sources" || !["retain", "remove"].includes(value.derived) || !Array.isArray(value.sources) || !value.sources.length || value.sources.length > 100) fail3();
  const sources = value.sources.map((ref) => {
    if (!ref || Object.getPrototypeOf(ref) !== Object.prototype || Object.keys(ref).sort().join("|") !== "id|kind") fail3();
    if (ref.kind === "input") return { kind: "input", id: InputId(ref.id) };
    if (ref.kind === "reply") return { kind: "reply", id: ReplyId(ref.id) };
    if (ref.kind === "tool") return { kind: "tool", id: AttemptId(ref.id) };
    return fail3();
  });
  if (new Set(sources.map(cleanupRefKey)).size !== sources.length) fail3();
  return { sources: sources.sort((a, b) => cleanupRefKey(a).localeCompare(cleanupRefKey(b))), derived: value.derived };
}
function previewSourceCleanup(snapshot, state, requested, history, storage, previousGenerations = []) {
  const selection = admitCleanupSelection(requested), lineage = createContextLineage(snapshot, state);
  const refs = [...snapshot.inputs.map((input) => ({ kind: "input", id: input.inputId })), ...state.replies.map((reply) => ({ kind: "reply", id: reply.replyId })), ...state.attempts.filter((attempt) => attempt.kind === "tool").map((attempt) => ({ kind: "tool", id: attempt.attemptId })), ...state.knowledge.versions.map((record) => ({ kind: "knowledge", id: record.knowledgeId, version: record.version }))];
  for (const ref of selection.sources) if (!refs.some((candidate) => cleanupRefKey(candidate) === cleanupRefKey(ref))) throw new HomeError("CLEANUP_SOURCE_NOT_FOUND");
  for (const ref of selection.sources) {
    const record = ref.kind === "input" ? snapshot.inputs.find((record2) => record2.inputId === ref.id) : ref.kind === "reply" ? state.replies.find((record2) => record2.replyId === ref.id) : state.attempts.find((record2) => record2.attemptId === ref.id);
    if (record?.cleanup) throw new HomeError("CLEANUP_SOURCE_ALREADY_CLEANED");
  }
  const selected = new Set(selection.sources.map(cleanupRefKey));
  const affected = (ref, seen = /* @__PURE__ */ new Set()) => {
    const key2 = cleanupRefKey(ref);
    if (selected.has(key2)) return true;
    if (seen.has(key2)) return false;
    seen.add(key2);
    const origin = lineage.describe(ref);
    return [...origin.dependencies, ...origin.dataOrigins].some((parent) => affected(parent, seen));
  };
  const impacted = refs.filter((ref) => affected(ref)), keys = new Set(impacted.map(cleanupRefKey)), effects = impacted.map((ref) => ({ kind: ref.kind, id: "id" in ref ? ref.id : "", ...ref.kind === "knowledge" ? { version: ref.version } : {}, action: ref.kind === "knowledge" && selection.derived === "retain" ? "retain-source-marked" : "revoke" }));
  const framedTurns = new Set(state.turns.filter((turn) => lineage.frameSources(turn.runId).some((used) => keys.has(cleanupRefKey(used)))).map((turn) => turn.runId));
  const turns = state.turns.filter((turn) => turn.status === "running" || framedTurns.has(turn.runId) || turn.inputIds.some((id) => keys.has("input:" + id)) || state.replies.some((reply) => reply.runId === turn.runId && keys.has("reply:" + reply.replyId)) || state.attempts.some((attempt) => attempt.runId === turn.runId && keys.has("tool:" + attempt.attemptId))), runs = new Set(turns.map((turn) => turn.runId));
  for (const turn of turns) effects.push({ kind: "turn", id: turn.runId, action: turn.status === "finished" ? "retain-result-metadata" : "cancel-pending" });
  for (const attempt of state.attempts.filter((attempt2) => runs.has(attempt2.runId))) effects.push({ kind: "attempt", id: attempt.attemptId, action: "revoke" });
  for (const record of state.nativeRecords.filter((record2) => runs.has(record2.runId))) effects.push({ kind: "native", id: record.nativeId, action: "revoke" });
  for (const delivery of state.deliveries.filter((delivery2) => runs.has(delivery2.runId))) effects.push({ kind: "delivery", id: delivery.deliveryId, action: delivery.status === "pending" ? "cancel-pending" : "retain-result-metadata" });
  for (const attempt of state.sendAttempts.filter((attempt2) => state.deliveries.some((delivery) => delivery.deliveryId === attempt2.deliveryId && runs.has(delivery.runId)))) effects.push({ kind: "send-attempt", id: attempt.sendAttemptId, action: "retain-result-metadata" });
  for (const proposal of state.knowledge.proposals.filter((proposal2) => keys.has("tool:" + proposal2.attemptId) || proposal2.value.sources.some((source) => keys.has(cleanupRefKey(source.ref))))) effects.push({ kind: "proposal", id: proposal.proposalId, action: selection.derived === "retain" ? "retain-source-marked" : "revoke" });
  const activity = state.autonomy.activity, activityProposal = activity ? state.knowledge.proposals.find((proposal) => proposal.proposalId === activity.proposalId) : void 0;
  if (activity && activityProposal && (keys.has("tool:" + activityProposal.attemptId) || activityProposal.value.sources.some((source) => keys.has(cleanupRefKey(source.ref))))) effects.push({ kind: "autonomy-activity", id: activity.proposalId, action: selection.derived === "retain" ? "retain-source-marked" : "revoke" });
  for (const query of history?.queries ?? []) if (cleanupHistoryInputs(snapshot.inputs, selection, query.target).some((input) => query.anchor?.inputId === input.inputId || query.candidates.some((candidate) => candidate.messageId === input.qqSource?.messageId) || query.requests.some((request) => request.outcome?.kind === "response" && request.outcome.rows.some((row) => row.messageId === input.qqSource?.messageId)))) effects.push({ kind: "qq-history", id: query.queryId, action: "revoke" });
  effects.sort((a, b) => (a.kind + ":" + a.id + ":" + (a.version ?? 0)).localeCompare(b.kind + ":" + b.id + ":" + (b.version ?? 0)));
  const uses = /* @__PURE__ */ new Map();
  for (const [id, text2, retained2] of [["core:" + snapshot.core.version, snapshot.core.text, true], ...snapshot.inputs.map((input) => ["input:" + input.inputId, input.text, !keys.has("input:" + input.inputId)]), ...state.replies.map((reply) => ["reply:" + reply.replyId, reply.text, !keys.has("reply:" + reply.replyId)]), ...state.knowledge.versions.map((record) => ["knowledge:" + record.knowledgeId + ":" + record.version, record.text, selection.derived === "retain" || !keys.has("knowledge:" + record.knowledgeId + ":" + record.version)])]) {
    const digest2 = createHash6("sha256").update(text2).digest("hex"), item = uses.get(digest2) ?? { text: text2, uses: [], retainedUses: [] };
    item.uses.push(id);
    if (retained2) item.retainedUses.push(id);
    uses.set(digest2, item);
  }
  const sharedContent = [...uses].filter(([, item]) => item.uses.length > 1 && item.uses.some((id) => !item.retainedUses.includes(id))).map(([digest2, item]) => ({ digest: digest2, utf8Bytes: Buffer.byteLength(item.text, "utf8"), uses: item.uses, retainedUses: item.retainedUses }));
  const value = {
    revision: snapshot.revision,
    selection,
    effects,
    quiescingRuns: state.turns.filter((turn) => turn.status === "running").map((turn) => turn.runId).sort(),
    sharedContent,
    // The current generation stays first: it is the one a cleanup rewrites. Everything older follows.
    storageGenerations: storage ? [{ id: storage.id, format: "role-home-storage-generation-1", disposition: "rewrite-before-purge" }, { id: "root-inline", format: "home-v1-inline-and-managed-content", disposition: "retained-until-purge" }, ...previousGenerations.filter((id) => id !== storage.id).map((id) => ({ id, format: "role-home-storage-generation-1", disposition: "retained-until-purge" }))] : [{ id: "current", format: "home-v1-inline-and-managed-content", disposition: "rewrite-before-purge" }],
    externalCopies: ["QQ messages", "DSH private storage", "external files", "independent backups"],
    physical: { phase: "not-started", complete: false }
  };
  return { ...value, digest: createHash6("sha256").update(JSON.stringify(value)).digest("hex") };
}
function cleanupHistoryInputs(inputs, selection, target) {
  return inputs.filter((input) => selection.sources.some((ref) => ref.kind === "input" && ref.id === input.inputId) && input.qqSource?.connectionId === target.connectionId && input.qqSource.accountId === target.accountId && input.qqSource.peerId === target.peerId);
}
function cleanupQQHistory(state, inputs, preview, operationId, revision) {
  const marker = (content2) => {
    const text2 = typeof content2 === "string" ? content2 : JSON.stringify(content2);
    return { operationId, revision, originalContentDigest: createHash6("sha256").update(text2).digest("hex"), originalUtf8Bytes: Buffer.byteLength(text2), reason: "owner-cleaned" };
  };
  return { ...state, queries: state.queries.map((query) => {
    if (!preview.effects.some((effect) => effect.kind === "qq-history" && effect.id === query.queryId)) return query;
    const revoked = cleanupHistoryInputs(inputs, preview.selection, query.target), ids = new Set(revoked.map((input) => input.qqSource.messageId));
    return {
      ...query,
      anchor: query.anchor && revoked.some((input) => input.inputId === query.anchor.inputId) ? { ...query.anchor, text: "", cleanup: marker(query.anchor.text) } : query.anchor,
      candidates: query.candidates.map((candidate) => ids.has(candidate.messageId) ? { ...candidate, text: "", eligible: false, reason: "QQ_HISTORY_SOURCE_CLEANED", cleanup: marker(candidate.text) } : candidate),
      requests: query.requests.map((request) => {
        if (!request.outcome) return request;
        const outcome = request.outcome;
        if (outcome.kind === "response") return { ...request, outcome: { ...outcome, responseJSON: "{}", rows: outcome.rows.map((row) => row.messageId && ids.has(row.messageId) ? { ...row, kind: "unsupported", text: null, reason: "QQ_HISTORY_SOURCE_CLEANED" } : row) }, cleanup: marker(outcome) };
        const { responseJSON, ...retained2 } = outcome;
        return { ...request, outcome: retained2, cleanup: marker(outcome) };
      })
    };
  }) };
}
function admitCleanupCommand(value) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join("|") !== "expectedRevision|kind|operationId|previewDigest|selection" || value.kind !== "cleanup-sources" || typeof value.previewDigest !== "string" || !/^[a-f0-9]{64}$/.test(value.previewDigest)) throw new HomeError("INVALID_CLEANUP_COMMAND");
  return { kind: "cleanup-sources", operationId: OperationId(value.operationId), selection: admitCleanupSelection(value.selection), expectedRevision: HomeRevision(value.expectedRevision), previewDigest: value.previewDigest };
}
function applyLogicalCleanup(inputs, state, preview, operationId, revision) {
  const effects = preview.effects, has = (kind, id, version2) => effects.find((effect) => effect.kind === kind && effect.id === id && (version2 === void 0 || effect.version === version2));
  const runs = new Set(effects.filter((effect) => effect.kind === "turn").map((effect) => effect.id));
  if (state.turns.some((turn) => runs.has(turn.runId) && turn.status !== "finished") || state.attempts.some((attempt) => runs.has(attempt.runId) && !attempt.outcome) || state.deliveries.some((delivery) => has("delivery", delivery.deliveryId) && delivery.status === "sending")) throw new HomeError("CLEANUP_WORK_NOT_QUIESCENT");
  const marker = (content2) => {
    const text2 = typeof content2 === "string" ? content2 : JSON.stringify(content2);
    return { operationId, revision, originalContentDigest: createHash6("sha256").update(text2).digest("hex"), originalUtf8Bytes: Buffer.byteLength(text2, "utf8"), reason: "owner-cleaned" };
  };
  return { inputs: inputs.map((input) => has("input", input.inputId) ? { ...input, text: "", utf8Bytes: 0, status: "cancelled", cleanup: marker(input.text) } : input), state: {
    ...state,
    turns: state.turns.map((turn) => has("turn", turn.runId) && turn.outcome ? { ...turn, outcome: { ...turn.outcome, ..."text" in turn.outcome ? { text: "" } : {} }, cleanup: marker(turn.outcome) } : turn),
    replies: state.replies.map((reply) => has("reply", reply.replyId) ? { ...reply, text: "", cleanup: marker(reply.text) } : reply),
    attempts: state.attempts.map((attempt) => {
      if (!has("attempt", attempt.attemptId)) return attempt;
      const { observation, materials, proposal, ...rest } = attempt;
      return { ...rest, ...rest.outcome ? { outcome: { kind: rest.outcome.kind, ...rest.outcome.code ? { code: rest.outcome.code } : {}, ...rest.outcome.modelFailure ? { modelFailure: rest.outcome.modelFailure } : {} } } : {}, cleanup: marker(attempt) };
    }),
    nativeRecords: state.nativeRecords.map((record) => has("native", record.nativeId) ? { ...record, data: { kind: "source-cleaned" }, cleanup: marker(record.data) } : record),
    deliveries: state.deliveries.map((delivery) => has("delivery", delivery.deliveryId) ? { ...delivery, text: "", status: delivery.status === "pending" ? "cancelled" : delivery.status, cleanup: marker(delivery.text) } : delivery),
    sendAttempts: state.sendAttempts.map((attempt) => {
      if (!has("send-attempt", attempt.sendAttemptId) || !attempt.observation) return attempt;
      const observation = attempt.observation;
      return { ...attempt, observation: observation.kind === "confirmed" ? { kind: observation.kind, messageId: observation.messageId, evidence: { kind: "source-cleaned" } } : { kind: observation.kind, code: observation.code }, cleanup: marker(observation) };
    }),
    deliveryResolutions: state.deliveryResolutions.map((resolution) => has("delivery", resolution.deliveryId) ? { ...resolution, note: "", cleanup: marker(resolution.note) } : resolution),
    knowledge: {
      ...state.knowledge,
      proposals: state.knowledge.proposals.map((proposal) => has("proposal", proposal.proposalId)?.action === "revoke" ? { ...proposal, value: { ...proposal.value, topic: "", text: "", reason: "", scope: "", sources: [] }, cleanup: marker(proposal.value) } : proposal),
      versions: state.knowledge.versions.map((record) => {
        if (has("knowledge", record.knowledgeId, record.version)?.action !== "revoke") return record;
        const cleared = { topic: "", text: "", reason: "", scope: "", sources: [], cleanup: marker(record) };
        return record.ownerAction ? { ...record, ...cleared, ownerAction: { ...record.ownerAction, reason: "" } } : { ...record, ...cleared };
      })
    },
    ...has("autonomy-activity", state.autonomy.activity?.proposalId ?? "")?.action === "revoke" ? { autonomy: { ...state.autonomy, activity: { ...state.autonomy.activity, reason: "" } } } : {}
  } };
}

// packages/companion/src/home/storage-generation.ts
import { constants as constants2 } from "node:fs";
import { open as open2, mkdir as mkdir2, lstat as lstat3, realpath as realpath2, readdir as readdir2, readFile as readFile2, link, unlink as unlink2, rmdir } from "node:fs/promises";
import { join as join3, dirname as dirname3, relative } from "node:path";
import { createHash as createHash7, randomUUID as randomUUID2 } from "node:crypto";
var hash2 = (value) => createHash7("sha256").update(value).digest("hex");
var encode2 = (value) => Buffer.from(JSON.stringify(value) + "\n", "utf8");
function fail4(code2) {
  throw new HomeError(code2);
}
var absent2 = (error) => !!error && typeof error === "object" && "code" in error && error.code === "ENOENT";
var object2 = (value) => !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
var hex2 = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
var storageGenerationId = (operationId, sourceHead) => "generation-" + hash2(operationId + ":" + sourceHead);
function admitStoragePointer(value) {
  if (!object2(value) || Object.keys(value).sort().join("|") !== "baseCommitDigest|baseRevision|checkpointDigest|id" || typeof value.id !== "string" || !/^generation-[a-f0-9]{64}$/.test(value.id) || !hex2(value.baseCommitDigest) || !hex2(value.checkpointDigest)) fail4("CORRUPT_STORAGE_GENERATION");
  return { id: value.id, baseRevision: HomeRevision(value.baseRevision), baseCommitDigest: value.baseCommitDigest, checkpointDigest: value.checkpointDigest };
}
async function exactDirectory(path) {
  const stat = await lstat3(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || await realpath2(path) !== path) fail4("UNSAFE_CLEANUP_PATH");
  return stat;
}
async function syncDir2(path) {
  const fd = await open2(path, "r");
  try {
    await fd.sync();
  } finally {
    await fd.close();
  }
}
async function safeBytes(path) {
  const before = await lstat3(path);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1) fail4("UNSAFE_CLEANUP_FILE");
  const fd = await open2(path, constants2.O_RDONLY | constants2.O_NOFOLLOW);
  try {
    const start = await fd.stat();
    if (start.dev !== before.dev || start.ino !== before.ino || start.nlink !== 1) fail4("CLEANUP_CONTENT_CHANGED");
    const value = await fd.readFile(), end = await fd.stat(), current = await lstat3(path);
    if (start.dev !== current.dev || start.ino !== current.ino || current.nlink !== 1 || end.size !== value.length || end.mtimeMs !== start.mtimeMs || end.ctimeMs !== start.ctimeMs) fail4("CLEANUP_CONTENT_CHANGED");
    return { bytes: value, stat: start };
  } finally {
    await fd.close();
  }
}
async function ensureDirectory(path) {
  try {
    await mkdir2(path, { mode: 448 });
    await syncDir2(dirname3(path));
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "EEXIST") throw error;
  }
  await exactDirectory(path);
}
async function publish(path, bytes2) {
  await exactDirectory(dirname3(path));
  try {
    const existing = await safeBytes(path);
    if (!existing.bytes.equals(bytes2)) fail4("CLEANUP_STAGING_CONFLICT");
    return;
  } catch (error) {
    if (!absent2(error)) throw error;
  }
  const temp = join3(dirname3(path), ".cleanup-" + randomUUID2() + ".pending"), fd = await open2(temp, "wx", 384);
  try {
    await fd.writeFile(bytes2);
    await fd.sync();
  } finally {
    await fd.close();
  }
  try {
    try {
      await link(temp, path);
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "EEXIST") throw error;
      const existing = await readFile2(path);
      if (!existing.equals(bytes2)) fail4("CLEANUP_STAGING_CONFLICT");
    }
  } finally {
    await unlink2(temp);
  }
  await syncDir2(dirname3(path));
}
async function json2(path) {
  const value = await safeBytes(path);
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(value.bytes));
  } catch {
    return fail4("CORRUPT_STORAGE_GENERATION");
  }
}
async function readStorageGeneration(root, pointer) {
  const area = join3(root, "content-generations");
  await exactDirectory(area);
  const path = join3(area, pointer.id);
  await exactDirectory(path);
  const raw = await safeBytes(join3(path, "checkpoint.json"));
  if (hash2(raw.bytes) !== pointer.checkpointDigest) fail4("CORRUPT_STORAGE_GENERATION");
  const value = await json2(join3(path, "checkpoint.json"));
  if (!object2(value) || Object.keys(value).sort().join("|") !== "body|digest" || !object2(value.body) || !hex2(value.digest) || hash2(encode2(value.body)) !== value.digest) fail4("CORRUPT_STORAGE_GENERATION");
  const body = value.body;
  if (body.format !== "role-home-storage-generation-1" || body.id !== pointer.id || body.baseRevision !== pointer.baseRevision || body.baseCommitDigest !== pointer.baseCommitDigest || !Array.isArray(body.commits) || !Array.isArray(body.replayRequests) || !Array.isArray(body.purge) || body.purpose !== void 0 && body.purpose !== "format-upgrade") fail4("CORRUPT_STORAGE_GENERATION");
  RoleId(body.roleId);
  OperationId(body.cleanupOperationId);
  return body;
}
function ownedName(area, name) {
  if (area === "commits") return /^[0-9]{12}\.json$/.test(name) || /^\.[0-9]{12}\.json\.[0-9a-f-]{36}\.pending$/.test(name);
  if (area === "blobs" || area === "projection-progress") return /^[a-f0-9]{64}\.json$/.test(name) || /^\.[a-f0-9]{64}\.json\.[0-9a-f-]{36}\.pending$/.test(name);
  if (area === "views") return name === "settings.json" || /^\.[0-9a-f-]{36}\.projection$/.test(name);
  return false;
}
async function inventory2(root, roleId, exclude) {
  const files = [];
  async function walk(path, area) {
    const stat = await lstat3(path), name = path.slice(path.lastIndexOf("/") + 1);
    if (stat.isSymbolicLink()) fail4("UNSAFE_CLEANUP_PATH");
    if (stat.isDirectory()) {
      await exactDirectory(path);
      const entries = await readdir2(path);
      for (const entry of entries) {
        if (!ownedName(area, entry) && !(area === "generation" && (entry === "checkpoint.json" || entry === "owner.json" || entry === "commits" || entry === "blobs" || entry === "views" || entry === "projection-progress" || /^\.cleanup-[0-9a-f-]{36}\.pending$/.test(entry)))) fail4("UNCLASSIFIED_CLEANUP_CONTENT");
        await walk(join3(path, entry), area === "generation" && ["commits", "blobs", "views", "projection-progress"].includes(entry) ? entry : area);
      }
      files.push({ path: relative(root, path), kind: "directory", digest: "", bytes: 0, dev: String(stat.dev), ino: String(stat.ino) });
    } else if (stat.isFile()) {
      const value = await safeBytes(path);
      files.push({ path: relative(root, path), kind: "file", digest: hash2(value.bytes), bytes: value.bytes.length, dev: String(value.stat.dev), ino: String(value.stat.ino) });
    } else fail4("UNSAFE_CLEANUP_FILE");
  }
  for (const area of ["commits", "blobs", "views", "projection-progress"]) try {
    await walk(join3(root, area), area);
  } catch (error) {
    if (!absent2(error)) throw error;
  }
  const generations = join3(root, "content-generations");
  try {
    await exactDirectory(generations);
    for (const id of (await readdir2(generations)).sort()) {
      if (id === exclude) continue;
      if (!/^generation-[a-f0-9]{64}$/.test(id)) fail4("UNCLASSIFIED_CLEANUP_CONTENT");
      const owner = await json2(join3(generations, id, "owner.json"));
      if (!object2(owner) || owner.roleId !== roleId || owner.id !== id || owner.format !== "role-cleanup-generation-owner-1") fail4("UNOWNED_CLEANUP_GENERATION");
      await walk(join3(generations, id), "generation");
    }
  } catch (error) {
    if (!absent2(error)) throw error;
  }
  return files;
}
async function prepareStorageGeneration(root, checkpoint, retainedFiles, io) {
  const id = storageGenerationId(checkpoint.cleanupOperationId, checkpoint.baseCommitDigest), area = join3(root, "content-generations"), path = join3(area, id);
  await ensureDirectory(area);
  await ensureDirectory(path);
  const owner = { format: "role-cleanup-generation-owner-1", roleId: checkpoint.roleId, operationId: checkpoint.cleanupOperationId, id, baseRevision: checkpoint.baseRevision, sourceHeadDigest: checkpoint.baseCommitDigest };
  await publish(join3(path, "owner.json"), encode2(owner));
  await io.barrier?.("after-cleanup-generation-owner", { operationId: checkpoint.cleanupOperationId, revision: checkpoint.baseRevision });
  for (const name of ["commits", "blobs", "views", "projection-progress"]) await ensureDirectory(join3(path, name));
  for (const file of retainedFiles) {
    if (!/^(blobs|views|projection-progress)\/[A-Za-z0-9.-]+$/.test(file.path)) fail4("INVALID_CLEANUP_RETAINED_FILE");
    await publish(join3(path, file.path), file.bytes);
  }
  const purge = await inventory2(root, checkpoint.roleId, id), body = { ...checkpoint, format: "role-home-storage-generation-1", id, purge }, bytes2 = encode2({ body, digest: hash2(encode2(body)) });
  if (bytes2.length > 268435456) fail4("CLEANUP_CHECKPOINT_TOO_LARGE");
  await publish(join3(path, "checkpoint.json"), bytes2);
  await syncDir2(path);
  await io.barrier?.("after-cleanup-generation-sync", { operationId: checkpoint.cleanupOperationId, revision: checkpoint.baseRevision });
  const pointer = { id, baseRevision: checkpoint.baseRevision, baseCommitDigest: checkpoint.baseCommitDigest, checkpointDigest: hash2(bytes2) };
  const actual = await readStorageGeneration(root, pointer);
  if (JSON.stringify(actual) !== JSON.stringify(body)) fail4("CLEANUP_GENERATION_VALIDATION_FAILED");
  return pointer;
}
async function purgeStorageGeneration(root, checkpoint, io, observe) {
  let count = 0;
  const files = checkpoint.purge.filter((file) => file.kind === "file");
  for (const entry of checkpoint.purge) {
    if (entry.path.startsWith("/") || entry.path.split("/").some((part) => part === ".." || part === ".") || entry.path.includes("\\")) fail4("INVALID_CLEANUP_PURGE_PATH");
    const path = join3(root, entry.path);
    await io.barrier?.("before-cleanup-purge-entry", { operationId: checkpoint.cleanupOperationId, revision: checkpoint.baseRevision });
    try {
      await exactDirectory(dirname3(path));
      const stat = await lstat3(path);
      if (String(stat.dev) !== entry.dev || String(stat.ino) !== entry.ino || stat.isSymbolicLink()) fail4("CLEANUP_CONTENT_CHANGED");
      if (entry.kind === "file") {
        const value = await safeBytes(path);
        if (value.bytes.length !== entry.bytes || hash2(value.bytes) !== entry.digest) fail4("CLEANUP_CONTENT_CHANGED");
        await unlink2(path);
      } else {
        if (!stat.isDirectory()) fail4("CLEANUP_CONTENT_CHANGED");
        await rmdir(path);
      }
      await syncDir2(dirname3(path));
    } catch (error) {
      if (!absent2(error)) throw error;
    }
    if (entry.kind === "file") count++;
    observe(count, files.length);
    await io.barrier?.("after-cleanup-purge-entry", { operationId: checkpoint.cleanupOperationId, revision: checkpoint.baseRevision });
  }
  return files.length;
}
async function discardStorageGeneration(root, pointer, operationId, io) {
  const area = join3(root, "content-generations"), path = join3(area, pointer.id);
  let entries;
  try {
    await exactDirectory(path);
    entries = await readdir2(path);
  } catch (error) {
    if (absent2(error)) return false;
    throw error;
  }
  const allowed = (areaName, name) => {
    if (areaName === "") return name === "owner.json" || name === "checkpoint.json" || ["commits", "blobs", "views", "projection-progress"].includes(name);
    if (areaName === "commits") return /^[0-9]{12}\.json$/.test(name) || /^\.[0-9]{12}\.json\.[0-9a-f-]{36}\.pending$/.test(name);
    if (areaName === "blobs" || areaName === "projection-progress") return /^[a-f0-9]{64}\.json$/.test(name) || /^\.[a-f0-9]{64}\.json\.[0-9a-f-]{36}\.pending$/.test(name);
    if (areaName === "views") return name === "settings.json" || /^\.[0-9a-f-]{36}\.projection$/.test(name) || /^\.[A-Za-z0-9.-]+\.[0-9a-f-]{36}\.pending$/.test(name);
    return false;
  };
  const walk = async (directory3, areaName) => {
    for (const name of await readdir2(directory3)) {
      if (!allowed(areaName, name)) return false;
      const full = join3(directory3, name), stat = await lstat3(full);
      if (stat.isSymbolicLink()) return false;
      if (stat.isDirectory()) {
        if (!await walk(full, name)) return false;
        await io.barrier?.("before-format-generation-discard", { operationId, revision: pointer.baseRevision });
        await rmdir(full);
      } else if (stat.isFile()) {
        if (stat.nlink !== 1) return false;
        await io.barrier?.("before-format-generation-discard", { operationId, revision: pointer.baseRevision });
        await unlink2(full);
      } else return false;
    }
    return true;
  };
  if (!await walk(path, "")) return false;
  await syncDir2(area);
  return true;
}

// packages/companion/src/home/format.ts
var HOME_FORMATS = Object.freeze([
  Object.freeze({ major: 1, minor: 0, layout: "root-inline" }),
  Object.freeze({ major: 2, minor: 0, layout: "generation" })
]);
var HOME_CURRENT_FORMAT = Object.freeze({ major: 1, minor: 0 });
var HOME_UPGRADE_TARGET = Object.freeze({ major: 2, minor: 0 });
var sameFormat = (a, b) => a.major === b.major && a.minor === b.minor;
function fail5(code2) {
  throw new HomeError(code2);
}
var pair = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail5("UNKNOWN_FORMAT");
  const raw = value;
  if (typeof raw.major !== "number" || typeof raw.minor !== "number" || !Number.isSafeInteger(raw.major) || !Number.isSafeInteger(raw.minor) || raw.major < 0 || raw.minor < 0) fail5("UNKNOWN_FORMAT");
  return { major: raw.major, minor: raw.minor };
};
var knownFormat = (value) => HOME_FORMATS.some((format) => format.major === value.major && format.minor === value.minor);
var formatLayout = (value) => value.major === 2 ? "storage-generation" : "root-inline";
function admitRootFormat(value) {
  const format = pair(value);
  if (format.major === 1 && format.minor === 0) return HOME_CURRENT_FORMAT;
  if (HOME_FORMATS.some((known) => known.major === format.major)) fail5("FORMAT_AUTHORITY_MISSING");
  fail5("UNKNOWN_FORMAT");
}
function admitHeadFormat(value) {
  const format = pair(value);
  if (!knownFormat(format)) fail5("UNKNOWN_FORMAT");
  return format;
}

// packages/companion/src/home/format-upgrade.ts
import { createHash as createHash8 } from "node:crypto";
var FORMAT_UPGRADE_TASK_FORMAT = "role-format-upgrade-task-1";
var FORMAT_UPGRADE_JOURNAL_DIRECTORY = ".format-upgrade";
var fail6 = (code2) => {
  throw new HomeError(code2);
};
var object3 = (value) => !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
var hex3 = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
var pair2 = (value) => {
  if (!object3(value) || Object.keys(value).sort().join("|") !== "major|minor") return fail6("CORRUPT_FORMAT_UPGRADE");
  const { major, minor } = value;
  if (typeof major !== "number" || typeof minor !== "number" || !Number.isSafeInteger(major) || !Number.isSafeInteger(minor) || major < 0 || minor < 0) return fail6("CORRUPT_FORMAT_UPGRADE");
  return { major, minor };
};
var formatPair = (value) => Object.freeze({ major: value.major, minor: value.minor });
var formatUpgradeJournalName = (operationId) => "upgrade-" + createHash8("sha256").update(operationId).digest("hex") + ".json";
function admitFormatUpgradeRequest(value) {
  if (!object3(value) || Object.keys(value).sort().join("|") !== "expectedRevision|operationId") fail6("INVALID_FORMAT_UPGRADE_REQUEST");
  const raw = value;
  return { operationId: OperationId(raw.operationId), expectedRevision: HomeRevision(raw.expectedRevision) };
}
var PHASES = /* @__PURE__ */ new Set(["requested", "writing", "validating", "uncertain", "switched", "failed"]);
var CHECKPOINTS = /* @__PURE__ */ new Set(["requested", "generation-written", "validated", "switched"]);
var PROGRESS_KEYS = "backupOperationId|copiedFiles|expectedRevision|from|operationId|phase|roleId|to|verifiedFiles";
var OPTIONAL_KEYS = /* @__PURE__ */ new Set(["checkpoint", "format", "generation", "sourceRevision", "sourceHeadDigest", "identityDigest", "recordDigest", "manifestDigest", "error", "interrupted", "recovery"]);
function admitFormatUpgradeProgress(value, roleId) {
  if (!object3(value)) return fail6("CORRUPT_FORMAT_UPGRADE");
  const required = new Set(PROGRESS_KEYS.split("|"));
  for (const key2 of required) if (!Object.hasOwn(value, key2)) fail6("CORRUPT_FORMAT_UPGRADE");
  for (const key2 of Object.keys(value)) if (!required.has(key2) && !OPTIONAL_KEYS.has(key2)) fail6("CORRUPT_FORMAT_UPGRADE");
  if (value.format !== void 0 && value.format !== FORMAT_UPGRADE_TASK_FORMAT) fail6("CORRUPT_FORMAT_UPGRADE");
  if (value.roleId !== roleId || !PHASES.has(String(value.phase)) || !CHECKPOINTS.has(String(value.checkpoint))) fail6("CORRUPT_FORMAT_UPGRADE");
  const progress = value;
  OperationId(progress.operationId);
  OperationId(progress.backupOperationId);
  HomeRevision(progress.expectedRevision);
  pair2(progress.from);
  pair2(progress.to);
  if (!Number.isSafeInteger(progress.copiedFiles) || progress.copiedFiles < 0 || !Number.isSafeInteger(progress.verifiedFiles) || progress.verifiedFiles < 0) fail6("CORRUPT_FORMAT_UPGRADE");
  if (progress.sourceRevision !== void 0) HomeRevision(progress.sourceRevision);
  for (const key2 of ["sourceHeadDigest", "identityDigest", "recordDigest", "manifestDigest"]) if (progress[key2] !== void 0 && !hex3(progress[key2])) fail6("CORRUPT_FORMAT_UPGRADE");
  if (progress.error !== void 0 && typeof progress.error !== "string") fail6("CORRUPT_FORMAT_UPGRADE");
  if (progress.generation !== void 0 && (!object3(progress.generation) || typeof progress.generation.id !== "string" || !hex3(progress.generation.baseCommitDigest) || !hex3(progress.generation.checkpointDigest))) fail6("CORRUPT_FORMAT_UPGRADE");
  if (progress.recovery !== void 0 && (!Array.isArray(progress.recovery) || progress.recovery.some((entry) => typeof entry !== "string"))) fail6("CORRUPT_FORMAT_UPGRADE");
  return progress;
}
var isFormatUpgradeTerminal = (phase) => phase === "switched" || phase === "failed";
var formatUpgradePhaseRank = (phase) => phase === "requested" ? 0 : phase === "writing" ? 1 : phase === "validating" ? 2 : phase === "uncertain" ? 3 : phase === "switched" ? 4 : phase === "failed" ? 5 : 0;
function formatUpgradeJournalRecord(progress) {
  return Object.freeze({ format: FORMAT_UPGRADE_TASK_FORMAT, ...formatPairBody(progress) });
}
function formatPairBody(progress) {
  const { from, to, ...rest } = progress, body = {};
  for (const [key2, value] of Object.entries(rest)) if (value !== void 0) body[key2] = value;
  return { ...body, from: formatPair(from), to: formatPair(to) };
}
async function saveFormatUpgradeTask(io, roleId, progress) {
  const admitted = admitFormatUpgradeProgress(progress, roleId), name = formatUpgradeJournalName(admitted.operationId);
  await io.write(name, formatUpgradeJournalRecord(admitted));
  return admitted;
}
async function loadFormatUpgradeTask(io, roleId, operationId) {
  const value = await io.read(formatUpgradeJournalName(operationId));
  if (value === void 0) return void 0;
  const progress = admitFormatUpgradeProgress(value, roleId);
  if (progress.operationId !== operationId) fail6("CORRUPT_FORMAT_UPGRADE");
  return progress;
}
function interruptedFormatUpgrade(progress) {
  if (isFormatUpgradeTerminal(progress.phase)) return progress;
  return { ...progress, phase: "uncertain", interrupted: true, recovery: ["resume-format-upgrade", "inspect-old-generation"] };
}

// packages/companion/src/home/index.ts
import { constants as constants3 } from "node:fs";
import { open as open3, mkdir as mkdir3, lstat as lstat4, realpath as realpath3, readdir as readdir3, link as link2, unlink as unlink3, rename as rename2 } from "node:fs/promises";
import { join as join4, resolve as resolve2, dirname as dirname4, basename as basename3 } from "node:path";
import { hostname } from "node:os";
import { createHash as createHash9, randomUUID as randomUUID3 } from "node:crypto";

// packages/companion/src/home/inputs.ts
function panelBindingFor(roleId) {
  return { bindingId: BindingId("panel-" + roleId), bindingVersion: BindingVersion(1), source: "owner-panel" };
}
function runnableInput(input, qqReplies = false) {
  return input.channel !== "qq" || qqReplies;
}

// packages/companion/src/home/index.ts
function canonicalBytes(value) {
  const seen = /* @__PURE__ */ new Set();
  const visit = (item) => {
    if (item === null)
      return "null";
    if (typeof item === "string") {
      if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(item))
        throw new HomeError("INVALID_VALUE");
      return JSON.stringify(item);
    }
    if (typeof item === "boolean")
      return String(item);
    if (typeof item === "number") {
      if (!Number.isSafeInteger(item))
        throw new HomeError("INVALID_VALUE");
      return String(Object.is(item, -0) ? 0 : item);
    }
    if (typeof item !== "object" || !item || seen.has(item))
      throw new HomeError("INVALID_VALUE");
    seen.add(item);
    let result;
    if (Array.isArray(item)) {
      if (Reflect.ownKeys(item).length !== item.length + 1 || Object.keys(item).length !== item.length)
        throw new HomeError("INVALID_VALUE");
      result = "[" + item.map(visit).join(",") + "]";
    } else {
      if (Object.getPrototypeOf(item) !== Object.prototype || Reflect.ownKeys(item).length !== Object.keys(item).length)
        throw new HomeError("INVALID_VALUE");
      result = "{" + Object.keys(item).sort().map((key2) => {
        const d = Object.getOwnPropertyDescriptor(item, key2);
        if (!("value" in d))
          throw new HomeError("INVALID_VALUE");
        return visit(key2) + ":" + visit(d.value);
      }).join(",") + "}";
    }
    seen.delete(item);
    return result;
  };
  return Buffer.from(visit(value) + "\n", "utf8");
}
function managedJSON(value) {
  const seen = /* @__PURE__ */ new Set();
  const visit = (v) => {
    if (v === null || typeof v === "string" || typeof v === "boolean") return;
    if (typeof v === "number") {
      if (!Number.isFinite(v)) fail7("INVALID_MANAGED_JSON");
      return;
    }
    if (typeof v !== "object" || !v || seen.has(v)) throw new HomeError("INVALID_MANAGED_JSON");
    seen.add(v);
    if (Array.isArray(v)) {
      if (Object.keys(v).length !== v.length) fail7("INVALID_MANAGED_JSON");
      for (const item of v) visit(item);
    } else {
      if (Object.getPrototypeOf(v) !== Object.prototype) fail7("INVALID_MANAGED_JSON");
      for (const key2 of Object.keys(v)) {
        const d = Object.getOwnPropertyDescriptor(v, key2);
        if (!("value" in d)) fail7("INVALID_MANAGED_JSON");
        if (d.value !== void 0) visit(d.value);
      }
    }
    seen.delete(v);
  };
  visit(value);
  return JSON.stringify(value);
}
var digest = (bytes2) => createHash9("sha256").update(bytes2).digest("hex");
var fingerprint = (value) => digest(canonicalBytes(value));
var fail7 = (code2) => {
  throw new HomeError(code2);
};
function exact2(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("|") !== keys.sort().join("|"))
    fail7("CORRUPT_HOME");
}
function op(value) {
  try {
    return OperationId(value);
  } catch {
    return fail7("INVALID_OPERATION_ID");
  }
}
function settings(value) {
  if (!validateInputSettings(value)) fail7("INVALID_SETTINGS");
}
function text(value) {
  if (typeof value !== "string" || !value.length || Buffer.byteLength(value) > 1048576)
    fail7("INVALID_CORE");
  canonicalBytes(value);
}
function inputBusiness(input, roleId, qqBinding, history = emptyQQHistory()) {
  const binding = input.channel === "qq" ? qqBinding && { bindingId: qqBinding.bindingId, bindingVersion: qqBinding.version } : panelBindingFor(roleId);
  if (!binding || input.bindingId !== binding.bindingId || input.bindingVersion !== binding.bindingVersion)
    fail7("INPUT_NOT_BOUND");
  op(input.operationId);
  InputKey(input.externalKey);
  if (input.channel === "qq") {
    let source;
    try {
      source = admitQQInputSource(input.qqSource);
    } catch {
      return fail7("INVALID_INPUT");
    }
    if (!qqBinding) return fail7("INPUT_NOT_BOUND");
    if (source.connectionId !== qqBinding.connectionId || source.accountId !== qqBinding.accountId || source.peerId !== qqBinding.peerId) fail7("INPUT_NOT_BOUND");
    if (input.externalKey !== qqInputIdentity(qqBinding, source).externalKey) fail7("INVALID_INPUT");
  } else if (input.qqSource !== void 0) fail7("INVALID_INPUT");
  if (typeof input.text !== "string" || !input.text.length || Buffer.byteLength(input.text, "utf8") > 1048576 || !["live", "history"].includes(input.origin) || (input.channel === "qq" ? input.sourceEvidence !== (input.origin === "history" ? "explicitly-selected-onebot-history" : "verified-onebot-friend-text") : input.channel !== void 0 || input.sourceEvidence !== "authenticated-owner-panel") || typeof input.receivedAt !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.receivedAt) || !Number.isFinite(Date.parse(input.receivedAt)))
    fail7("INVALID_INPUT");
  if (input.origin === "history") validateHistoryInput(input, history);
  else if (input.historySource !== void 0) fail7("INVALID_INPUT");
  if (Object.hasOwn(input, "contextPurpose") && (input.contextPurpose !== "history" || input.channel === "qq")) fail7("INVALID_INPUT");
  const business = { kind: "accept-input", bindingId: input.bindingId, bindingVersion: input.bindingVersion, externalKey: input.externalKey, text: input.text, origin: input.origin, sourceEvidence: input.sourceEvidence, ...input.contextPurpose ? { contextPurpose: input.contextPurpose } : {}, ...input.origin === "history" ? { historySource: input.historySource } : {}, ...input.channel === "qq" ? { channel: "qq", qqSource: input.qqSource } : {} };
  canonicalBytes(business);
  return business;
}
var inputKey = (input) => fingerprint({ bindingId: input.bindingId, bindingVersion: input.bindingVersion, externalKey: input.externalKey });
async function syncDir3(path) {
  const fd = await open3(path, "r");
  try {
    await fd.sync();
  } finally {
    await fd.close();
  }
}
async function directory2(path) {
  const s = await lstat4(path);
  if (!s.isDirectory() || s.isSymbolicLink())
    fail7("UNSAFE_PATH");
}
async function safeBytes2(path, recover = false, validateAliases = false) {
  let s = await lstat4(path);
  if (!s.isFile() || s.isSymbolicLink() || s.size > 8388608)
    fail7("UNSAFE_FILE");
  if (s.nlink > 1) {
    if (!recover && !validateAliases)
      fail7("UNSAFE_FILE");
    const aliases = [];
    for (const name of await readdir3(dirname4(path))) {
      if (!new RegExp("^\\." + basename3(path).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.[0-9a-f-]{36}\\.pending$").test(name))
        continue;
      const alias = join4(dirname4(path), name);
      const a = await lstat4(alias);
      if (a.isFile() && a.ino === s.ino && a.dev === s.dev)
        aliases.push(alias);
    }
    if (aliases.length !== s.nlink - 1)
      fail7("UNSAFE_FILE");
    if (recover) {
      for (const alias of aliases)
        await unlink3(alias);
      s = await lstat4(path);
      if (s.nlink !== 1)
        fail7("UNSAFE_FILE");
      await syncDir3(dirname4(path));
    }
  }
  const fd = await open3(path, constants3.O_RDONLY | constants3.O_NOFOLLOW);
  try {
    const current = await fd.stat();
    if (!current.isFile() || current.ino !== s.ino || current.dev !== s.dev || current.size > 8388608)
      fail7("UNSAFE_FILE");
    return await fd.readFile();
  } finally {
    await fd.close();
  }
}
async function jsonFile(path, recover = false, validateAliases = false) {
  const bytes2 = await safeBytes2(path, recover, validateAliases);
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes2));
  } catch {
    fail7("CORRUPT_HOME");
  }
  if (!canonicalBytes(value).equals(bytes2))
    fail7("CORRUPT_HOME");
  return value;
}
async function publish2(path, bytes2, afterLink) {
  const temp = join4(dirname4(path), "." + basename3(path) + "." + randomUUID3() + ".pending");
  const fd = await open3(temp, "wx", 384);
  try {
    await fd.writeFile(bytes2);
    await fd.sync();
  } finally {
    await fd.close();
  }
  try {
    await link2(temp, path);
    await afterLink?.();
  } finally {
    await unlink3(temp).catch(() => {
    });
  }
  await syncDir3(dirname4(path));
}
async function canonicalPath(path) {
  if (!path || !path.startsWith("/"))
    fail7("ABSOLUTE_PATH_REQUIRED");
  const p = resolve2(path);
  if (p === resolve2("/"))
    fail7("UNSAFE_PATH");
  return join4(await realpath3(dirname4(p)), basename3(p));
}
function headBytes(roleId, revision, commitDigest, storage, format = HOME_CURRENT_FORMAT) {
  const body = { roleId, revision, commitDigest, ...storage ? { storage, format: { major: format.major, minor: format.minor } } : {} };
  return canonicalBytes({ ...body, digest: fingerprint(body) });
}
async function readHead(path, roleId) {
  let value;
  try {
    value = await jsonFile(join4(path, "head.json"));
  } catch {
    return fail7("CORRUPT_HEAD");
  }
  const optional = ["storage", "format"].filter((key2) => Object.hasOwn(value, key2));
  exact2(value, ["roleId", "revision", "commitDigest", "digest", ...optional]);
  const { digest: claimed, ...body } = value;
  if (value.roleId !== roleId || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0 || claimed !== fingerprint(body) || (value.revision === 0 ? value.commitDigest !== null : typeof value.commitDigest !== "string" || !/^[a-f0-9]{64}$/.test(value.commitDigest))) return fail7("CORRUPT_HEAD");
  if (Object.hasOwn(value, "format") !== Object.hasOwn(value, "storage")) return fail7("CORRUPT_HEAD");
  return { roleId: RoleId(value.roleId), revision: HomeRevision(value.revision), commitDigest: value.commitDigest === null ? null : String(value.commitDigest), digest: String(value.digest), ...Object.hasOwn(value, "storage") ? { storage: admitStoragePointer(value.storage), format: admitHeadFormat(value.format) } : {} };
}
async function initializeHead(path, roleId) {
  try {
    await lstat4(join4(path, "head.json"));
    return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if ((await readdir3(join4(path, "commits"))).some((name) => !name.startsWith("."))) return fail7("CORRUPT_HEAD");
  await publish2(join4(path, "head.json"), headBytes(roleId, HomeRevision(0), null));
}
var alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH")
      return false;
    return true;
  }
};
async function acquire(path, io = {}, fileName = "writer.lock") {
  const file = join4(path, fileName);
  const own = { host: hostname(), pid: process.pid, token: randomUUID3(), path };
  const bytes2 = canonicalBytes(own);
  for (let retry = 0; retry < 3; retry++) {
    try {
      await publish2(file, bytes2, async () => io.barrier?.(fileName === "writer.lock" ? "after-lock-publish" : "after-maintenance-lock-publish", { operationId: OperationId("writer-lock"), revision: HomeRevision(0) }));
      return async () => {
        const current = await safeBytes2(file);
        if (!current.equals(bytes2))
          fail7("LOCK_LOST");
        await unlink3(file);
        await syncDir3(path);
      };
    } catch (error) {
      if (error.code !== "EEXIST")
        throw error;
    }
    let before;
    let previous;
    try {
      before = await safeBytes2(file, false, true);
      previous = await jsonFile(file, false, true);
      exact2(previous, ["host", "pid", "token", "path"]);
    } catch {
      fail7("WRITER_UNCERTAIN");
    }
    if (previous.host !== hostname() || previous.path !== path || !Number.isSafeInteger(previous.pid) || Number(previous.pid) < 1 || typeof previous.token !== "string" || alive(Number(previous.pid)))
      fail7("HOME_BUSY");
    const claim = join4(path, ".takeover-" + digest(before));
    let fd;
    try {
      fd = await open3(claim, "wx", 384);
    } catch {
      fail7("HOME_BUSY");
    }
    try {
      await fd.writeFile(bytes2);
      await fd.sync();
      if (!(await safeBytes2(file, false, true)).equals(before) || alive(Number(previous.pid)))
        fail7("HOME_BUSY");
      await safeBytes2(file, true);
      await unlink3(file);
      await syncDir3(path);
    } finally {
      await fd.close();
      await unlink3(claim);
      await syncDir3(path);
    }
  }
  return fail7("HOME_BUSY");
}
var DiskHome = class _DiskHome {
  constructor(path, identity, release, io, recoverAliases = true, backups) {
    this.path = path;
    this.identity = identity;
    this.release = release;
    this.io = io;
    this.recoverAliases = recoverAliases;
    this.backups = backups;
  }
  get fileLayout() {
    return Object.freeze({ root: this.path, protectedRelativePaths: protectedHomeEntries, ordinaryRelativeRoots: ordinaryHomeRoots, temporaryRootNamePrefixes: temporaryHomeRootPrefixes });
  }
  /** The effective layout is declared by head.json; the root identity stays frozen at creation. */
  format = HOME_CURRENT_FORMAT;
  formatStatus() {
    return { roleId: this.identity.roleId, identity: this.identity.format, format: this.format, layout: formatLayout(this.format), ...this.storage ? { generation: this.storage } : {}, upgrade: { to: HOME_UPGRADE_TARGET, available: sameFormat(this.format, HOME_CURRENT_FORMAT), reason: sameFormat(this.format, HOME_CURRENT_FORMAT) ? "UPGRADE_AVAILABLE" : "CURRENT_FORMAT" } };
  }
  pendingOwnerChanges = 0;
  get admission() {
    return { autonomyClock: { clock: this.conversation.autonomy.clock, clockBlocked: this.conversation.autonomy.clockBlocked }, autonomyRulesVersion: this.conversation.autonomy.rules.version, contextGeneration: this.snapshot.contextGeneration, settingsVersion: this.conversation.rules.version, readRulesVersion: this.conversation.readRules.version, retryRulesVersion: this.conversation.retryRules.version, fileRulesVersion: this.conversation.fileRules.version, fileAccessVersion: this.conversation.fileAccess.version, webRulesVersion: this.conversation.webRules.version, contactRulesVersion: this.conversation.contactRules.version, pendingOwnerChange: this.pendingOwnerChanges > 0 || this.cleanupTasks.some((task) => task.phase !== "complete") };
  }
  previewCleanup(selection) {
    return this.run(async () => previewSourceCleanup(this.snapshot, this.conversation, selection, this.qqHistory, this.storage, await this.retainedGenerationIds()));
  }
  /** Authority generations on disk that are not the current pointer; the upgrade leaves the old one. */
  async retainedGenerationIds() {
    try {
      await directory2(join4(this.path, "content-generations"));
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
    return (await readdir3(join4(this.path, "content-generations"))).filter((name) => /^generation-[a-f0-9]{64}$/.test(name)).sort();
  }
  async readCleanup(operationId) {
    if (this.closed) fail7("HOME_CLOSED");
    op(operationId);
    return structuredClone(this.cleanupTasks.find((task) => task.operationId === operationId) ?? { operationId, phase: "not-found" });
  }
  cleanupTasks = [];
  storage;
  replayRequests = /* @__PURE__ */ new Map();
  get storagePath() {
    return this.storage ? join4(this.path, "content-generations", this.storage.id) : this.path;
  }
  syncStorage() {
    return syncDir3(join4(this.storagePath, "commits"));
  }
  cleanupSnapshots() {
    if (this.closed) fail7("HOME_CLOSED");
    return structuredClone(this.cleanupTasks);
  }
  prepareCleanup(command) {
    return this.run(async () => {
      await this.assertWritable();
      const request = admitCleanupCommand(command), preview = previewSourceCleanup(this.snapshot, this.conversation, request.selection, this.qqHistory, this.storage, await this.retainedGenerationIds());
      if (this.cleanupTasks.some((task) => task.phase !== "complete")) fail7("CLEANUP_MAINTENANCE_PENDING");
      if (request.expectedRevision !== this.revision) fail7("REVISION_CONFLICT");
      if (request.previewDigest !== preview.digest) fail7("CLEANUP_PREVIEW_CHANGED");
      const snapshot = structuredClone(this.snapshot), closingHistory = new Set(this.qqHistory.queries.filter((query) => query.phase === "running").map((query) => query.queryId));
      let active = true;
      this.pendingOwnerChanges++;
      const release = () => {
        if (active) {
          active = false;
          this.pendingOwnerChanges--;
        }
      };
      return Object.freeze({ request: structuredClone(request), preview: structuredClone(preview), release, commit: () => this.run(async () => {
        if (!active) fail7("CLEANUP_ADMISSION_REVOKED");
        if (this.snapshot.contextGeneration !== snapshot.contextGeneration || this.snapshot.inputs.length !== snapshot.inputs.length || this.snapshot.inputs.some((input, index) => input.inputId !== snapshot.inputs[index].inputId || input.text !== snapshot.inputs[index].text)) fail7("CLEANUP_PREVIEW_CHANGED");
        const allowed = new Set(preview.quiescingRuns), closingSends = new Set(preview.effects.filter((effect) => effect.kind === "send-attempt").map((effect) => effect.id)), kinds = /* @__PURE__ */ new Set(["reserve-attempt", "reserve-web-tool", "enter-attempt", "record-attempt", "observe-tool", "capture-material", "native-record", "save-proposal", "process-proposal", "finish-turn", "refresh-turn-context", "settle-delivery", "qq-history"]);
        for (const commit of this.commits.filter((commit2) => commit2.revision > preview.revision)) {
          if (!kinds.has(commit.kind)) fail7("CLEANUP_PREVIEW_CHANGED");
          const fact = JSON.parse(await this.managedText(commit.data.payload));
          if (commit.kind === "settle-delivery" && closingSends.has(fact.sendAttemptId)) continue;
          if (commit.kind === "qq-history" && closingHistory.has(fact.queryId) && ["observe", "finish"].includes(fact.action)) continue;
          const run = fact.runId ?? fact.attempt?.runId ?? fact.tool?.runId ?? fact.record?.runId ?? fact.proposal?.runId ?? this.conversation.attempts.find((attempt) => attempt.attemptId === (fact.attemptId ?? fact.material?.attemptId))?.runId ?? this.conversation.knowledge.proposals.find((proposal) => proposal.proposalId === fact.proposalId)?.runId;
          if (!allowed.has(run)) fail7("CLEANUP_PREVIEW_CHANGED");
        }
        return this.commitCleanupRequest(request, preview);
      }).finally(release) });
    });
  }
  async commitCleanupRequest(request, approved) {
    const business = { kind: request.kind, selection: request.selection }, fp = fingerprint(business);
    if (this.uncertain) {
      if (this.uncertain !== request.operationId) fail7("IO_UNCERTAIN");
      await this.load();
      await this.syncStorage();
      await this.syncHead(request.operationId);
      this.uncertain = null;
    }
    const old = this.commits.find((commit) => commit.operationId === request.operationId);
    if (old) {
      if (old.kind !== request.kind || ![fp, fingerprint({ ...business, previewDigest: request.previewDigest })].includes(old.fingerprint)) fail7("OPERATION_CONFLICT");
      return this.receipt(old);
    }
    if (this.cleanupTasks.some((task2) => task2.phase !== "complete")) fail7("CLEANUP_MAINTENANCE_PENDING");
    if (!approved && request.expectedRevision !== this.revision) fail7("REVISION_CONFLICT");
    const preview = previewSourceCleanup(this.snapshot, this.conversation, request.selection, this.qqHistory, this.storage, await this.retainedGenerationIds());
    if (!approved && preview.digest !== request.previewDigest) fail7("CLEANUP_PREVIEW_CHANGED");
    applyLogicalCleanup(this.snapshot.inputs, this.conversation, preview, request.operationId, HomeRevision(this.revision + 1));
    const task = { operationId: request.operationId, phase: "logical-complete", logicalRevision: HomeRevision(this.revision + 1), request, ...approved && approved.digest !== preview.digest ? { requestedPreview: approved } : {}, preview, physical: { complete: false } };
    return this.append(request.kind, request.operationId, fp, { payload: await this.putManaged(task) });
  }
  async retainedGenerationFiles() {
    const refs = /* @__PURE__ */ new Set(), include = async (ref) => {
      if (typeof ref !== "string" || !/^[a-f0-9]{64}$/.test(ref) || refs.has(ref)) return;
      const value = await this.blob(ref);
      refs.add(ref);
      if (Array.isArray(value.chunks)) for (const child of value.chunks) await include(child);
    };
    const controls = /* @__PURE__ */ new Set(["create", "edit-core", "edit-settings", "bind-qq", "import-projection", "rebuild-projection", "edit-conversation", "edit-read-rules", "edit-retry-rules", "edit-file-rules", "edit-file-access", "edit-web-rules", "edit-delivery-rules", "edit-proposal-rules", "edit-autonomy-rules"]);
    for (const commit of this.commits) {
      if (controls.has(commit.kind)) {
        for (const ref of Object.values(commit.data)) if (typeof ref === "string" && /^[a-f0-9]{64}$/.test(ref)) await include(ref);
      }
      if (commit.kind === "accept-input" && !this.snapshot.inputs.find((input) => input.inputId === commit.data.inputId)?.cleanup) await include(commit.data.content);
    }
    const files = [];
    for (const ref of refs) files.push({ path: "blobs/" + ref + ".json", bytes: await safeBytes2(join4(this.storagePath, "blobs", ref + ".json")) });
    for (const area of ["views", "projection-progress"]) try {
      await directory2(join4(this.storagePath, area));
      for (const name of await readdir3(join4(this.storagePath, area))) if (!name.startsWith(".")) files.push({ path: area + "/" + name, bytes: await safeBytes2(join4(this.storagePath, area, name)) });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    return files;
  }
  // ---------------------------------------------------------------- format upgrade
  /** The journal is Home-owned maintenance state; it is not a business commit and it never rewrites content. */
  formatUpgradeJournal() {
    const directoryPath = join4(this.path, FORMAT_UPGRADE_JOURNAL_DIRECTORY);
    return {
      read: async (name) => {
        try {
          return await jsonFile(join4(directoryPath, name));
        } catch (error) {
          if (error.code === "ENOENT") return void 0;
          throw error;
        }
      },
      write: async (name, record) => {
        try {
          await mkdir3(directoryPath, { mode: 448 });
          await syncDir3(this.path);
        } catch (error) {
          if (error.code !== "EEXIST") throw error;
        }
        await directory2(directoryPath);
        const target = join4(directoryPath, name), temp = join4(directoryPath, "." + name + "." + randomUUID3() + ".pending"), bytes2 = canonicalBytes(record);
        const fd = await open3(temp, "wx", 384);
        try {
          await fd.writeFile(bytes2);
          await fd.sync();
        } finally {
          await fd.close();
        }
        try {
          await rename2(temp, target);
        } finally {
          await unlink3(temp).catch(() => {
          });
        }
        await syncDir3(directoryPath);
      }
    };
  }
  formatUpgradeTask(operationId) {
    return loadFormatUpgradeTask(this.formatUpgradeJournal(), this.roleId, operationId);
  }
  /** Operations this exact Home instance is driving; a journal from anyone else is `interrupted`. */
  runningFormatUpgrades = /* @__PURE__ */ new Set();
  saveFormatUpgrade(progress) {
    return saveFormatUpgradeTask(this.formatUpgradeJournal(), this.roleId, progress);
  }
  /**
   * Quiescence records published by a restarted lifetime do not change user content. They may sit
   * between the backup revision and the current revision without making the backup stale.
   */
  static quiescenceKinds = /* @__PURE__ */ new Set(["request-stop", "checkpoint-stop", "reconcile-stop", "request-handover", "reconcile-handover", "ready-handover"]);
  /**
   * A backup is the upgrade precondition: it must be verified and its revision must still describe
   * this Home's user content. Later quiescence commits are metadata; any other commit is drift.
   */
  async formatUpgradeBackup() {
    if (!this.backups) return { satisfied: false };
    const current = this.revision, headDigest = digest(await safeBytes2(join4(this.path, "head.json"))), records = await this.backups.list();
    const chosen = records.filter((record) => record.phase === "verified-restorable" && record.sourceRevision !== void 0 && record.sourceHeadDigest && record.sourceRevision <= current).filter((record) => this.commits.filter((commit) => commit.revision > record.sourceRevision).every((commit) => _DiskHome.quiescenceKinds.has(commit.kind))).filter((record) => record.sourceRevision !== current || record.sourceHeadDigest === headDigest).sort((a, b) => b.sourceRevision - a.sourceRevision)[0];
    return chosen ? { satisfied: true, operationId: chosen.operationId, sourceRevision: chosen.sourceRevision } : { satisfied: false };
  }
  async formatUpgradeRefusal() {
    if (!sameFormat(this.format, HOME_CURRENT_FORMAT)) return knownFormat(this.format) ? "FORMAT_UPGRADE_NOT_REQUIRED" : "FORMAT_UPGRADE_UNSUPPORTED";
    if (this.cleanupTasks.some((task) => task.phase !== "complete")) return "CLEANUP_MAINTENANCE_PENDING";
    if (this.handovers.some((record) => record.readyRevision !== void 0 && record.readyRevision >= this.revision)) return "FORMAT_UPGRADE_HANDOVER_PENDING";
    if (this.conversation.turns.some((turn) => turn.status === "running") || this.conversation.attempts.some((attempt) => !attempt.outcome)) return "FORMAT_UPGRADE_WORK_NOT_QUIESCENT";
    return void 0;
  }
  previewFormatUpgrade() {
    return this.run(async () => {
      await this.assertWritable();
      const refusal = await this.formatUpgradeRefusal();
      if (refusal) fail7(refusal);
      const backup = await this.formatUpgradeBackup(), retains = [];
      for (const part of ["identity.json", "head.json"]) retains.push({ part, bytes: (await safeBytes2(join4(this.path, part))).length });
      for (const part of ["commits", "blobs", "views", "projection-progress"]) {
        let bytes2 = 0;
        try {
          await directory2(join4(this.storagePath, part));
          for (const name of await readdir3(join4(this.storagePath, part))) if (!name.startsWith(".")) bytes2 += (await lstat4(join4(this.storagePath, part, name))).size;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        retains.push({ part, bytes: bytes2 });
      }
      for (const part of ["works", "journal"]) {
        let bytes2 = 0;
        try {
          await directory2(join4(this.path, part));
          for (const name of await readdir3(join4(this.path, part))) bytes2 += (await lstat4(join4(this.path, part, name))).size;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        retains.push({ part, bytes: bytes2 });
      }
      try {
        retains.push({ part: ".autonomy-schedule.json", bytes: (await lstat4(this.schedulePath())).size });
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      const pending = await this.pendingFormatUpgrade();
      return { roleId: this.roleId, revision: this.revision, from: this.format, to: HOME_UPGRADE_TARGET, backupOperationId: pending?.backupOperationId ?? OperationId("format-upgrade-backup-pending"), backup, retains, externalCopies: ["QQ messages", "DSH private storage", "external files", "independent backups"] };
    });
  }
  /** A single non-terminal upgrade task may exist; anything else is a durable inconsistency. */
  async pendingFormatUpgrade() {
    const names = await this.formatUpgradeJournalNames(), tasks = (await Promise.all(names.map((name) => this.formatUpgradeJournal().read(name)))).filter((value) => !!value).map((value) => admitFormatUpgradeProgress(value, this.roleId));
    const running = tasks.filter((task) => !isFormatUpgradeTerminal(task.phase)).sort((a, b) => formatUpgradePhaseRank(a.phase) - formatUpgradePhaseRank(b.phase));
    if (running.length > 1) fail7("FORMAT_UPGRADE_TASK_CONFLICT");
    return running.length ? interruptedFormatUpgrade(running[0]) : void 0;
  }
  async pendingFormatUpgradeOperation() {
    const names = await this.formatUpgradeJournalNames(), tasks = (await Promise.all(names.map((name) => this.formatUpgradeJournal().read(name)))).filter((value) => !!value);
    const running = tasks.filter((value) => !isFormatUpgradeTerminal(String(value.phase)));
    if (running.length > 1) fail7("FORMAT_UPGRADE_TASK_CONFLICT");
    return running.length ? OperationId(running[0].operationId) : OperationId("format-upgrade-none");
  }
  async formatUpgradeJournalNames() {
    try {
      await directory2(join4(this.path, FORMAT_UPGRADE_JOURNAL_DIRECTORY));
      return (await readdir3(join4(this.path, FORMAT_UPGRADE_JOURNAL_DIRECTORY))).filter((name) => !name.startsWith(".")).sort();
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }
  readFormatUpgrade(operationId) {
    return this.run(async () => {
      op(operationId);
      if (this.closed) fail7("HOME_CLOSED");
      const task = await this.formatUpgradeTask(operationId);
      if (!task) return { operationId, phase: "not-found" };
      return structuredClone(this.runningFormatUpgrades.has(operationId) || isFormatUpgradeTerminal(task.phase) ? task : interruptedFormatUpgrade(task));
    });
  }
  /** Owner-triggered upgrade: journal the request, then let the caller continue it as a task. */
  requestFormatUpgrade(raw) {
    return this.run(async () => {
      const request = admitFormatUpgradeRequest(raw);
      await this.assertWritable();
      const prior = await this.formatUpgradeTask(request.operationId);
      if (prior) {
        if (prior.expectedRevision !== request.expectedRevision) fail7("OPERATION_CONFLICT");
        return structuredClone(prior);
      }
      const refusal = await this.formatUpgradeRefusal();
      if (refusal && refusal !== "FORMAT_UPGRADE_BACKUP_REQUIRED") fail7(refusal);
      if (request.expectedRevision !== this.revision) fail7("REVISION_CONFLICT");
      const backup = await this.formatUpgradeBackup();
      const base = { operationId: request.operationId, roleId: this.roleId, phase: "requested", checkpoint: "requested", from: this.format, to: HOME_UPGRADE_TARGET, backupOperationId: backup.operationId ?? OperationId("format-upgrade-backup-missing"), expectedRevision: request.expectedRevision, sourceRevision: this.revision, ...this.head ? { sourceHeadDigest: this.head } : {}, copiedFiles: 0, verifiedFiles: 0 };
      if (!backup.satisfied) {
        await this.saveFormatUpgrade({ ...base, phase: "failed", error: "FORMAT_UPGRADE_BACKUP_REQUIRED" });
        fail7("FORMAT_UPGRADE_BACKUP_REQUIRED");
      }
      return structuredClone(await this.saveFormatUpgrade(base));
    });
  }
  /** Continue the original operation: write the successor generation, validate, then switch once. */
  continueFormatUpgrade(operationId) {
    return this.run(() => this.executeFormatUpgrade(operationId));
  }
  resumeFormatUpgrade(raw) {
    return this.run(async () => {
      const request = admitFormatUpgradeRequest(raw);
      await this.assertWritable();
      const prior = await this.formatUpgradeTask(request.operationId);
      if (!prior) fail7("FORMAT_UPGRADE_NOT_FOUND");
      if (prior.phase === "switched") return structuredClone(prior);
      if (prior.to.major !== HOME_UPGRADE_TARGET.major || prior.to.minor !== HOME_UPGRADE_TARGET.minor) fail7("OPERATION_CONFLICT");
      return this.executeFormatUpgrade(request.operationId);
    });
  }
  async executeFormatUpgrade(operationId) {
    const loaded = await this.formatUpgradeTask(operationId);
    if (!loaded) fail7("FORMAT_UPGRADE_NOT_FOUND");
    if (loaded.phase === "switched") return structuredClone(loaded);
    let current = loaded;
    if (!sameFormat(this.format, HOME_CURRENT_FORMAT)) {
      if (current.generation && this.storage?.id === current.generation.id) return structuredClone(await this.saveFormatUpgrade({ ...current, phase: "switched", checkpoint: "switched", interrupted: void 0, recovery: void 0, error: void 0 }));
      fail7("FORMAT_UPGRADE_GENERATION_CONFLICT");
    }
    let stage = "preparing";
    this.runningFormatUpgrades.add(operationId);
    try {
      const backup = await this.formatUpgradeBackup();
      if (!backup.satisfied || backup.operationId !== current.backupOperationId) fail7("FORMAT_UPGRADE_BACKUP_REQUIRED");
      const pinned = current.sourceRevision;
      if (pinned !== void 0 && this.revision !== pinned) {
        const latest = (await this.backups?.list())?.find((record) => record.operationId === current.backupOperationId);
        if (!latest || latest.phase !== "verified-restorable" || latest.sourceRevision !== pinned) fail7("FORMAT_UPGRADE_SOURCE_CHANGED");
      }
      current = await this.saveFormatUpgrade({ ...current, phase: "writing", checkpoint: "requested", sourceRevision: this.revision, ...this.head ? { sourceHeadDigest: this.head } : {}, error: void 0 });
      stage = "writing";
      const replayRequests = new Map(this.replayRequests);
      const domain = JSON.parse(JSON.stringify({ snapshot: this.snapshot, conversation: this.conversation, qqHistory: this.qqHistory, stops: this.stops, handovers: this.handovers, restoreAcceptances: this.restoreAcceptances, cleanupTasks: this.cleanupTasks, generatedHistory: this.generatedHistory.map((bytes2) => bytes2.toString("utf8")) }));
      const retained2 = await this.retainedGenerationFiles(), pointer = await prepareStorageGeneration(this.path, { roleId: this.roleId, baseRevision: this.revision, baseCommitDigest: this.head, domain, commits: this.commits, replayRequests: [...replayRequests].map(([id, fp]) => ({ operationId: id, fingerprint: fp })), cleanupOperationId: operationId, purpose: "format-upgrade" }, retained2, this.io);
      current = await this.saveFormatUpgrade({ ...current, phase: "validating", checkpoint: "generation-written", generation: pointer, copiedFiles: retained2.length + this.commits.length, verifiedFiles: 0 });
      stage = "validating";
      const { identityDigest, recordDigest, manifestDigest, verifiedFiles } = await this.validateFormatUpgrade(pointer, retained2);
      current = await this.saveFormatUpgrade({ ...current, phase: "validating", checkpoint: "validated", identityDigest, recordDigest, manifestDigest, verifiedFiles });
      await this.io.barrier?.("before-format-head-publish", { operationId, revision: this.revision });
      this.storage = pointer;
      this.format = HOME_UPGRADE_TARGET;
      try {
        await this.syncHead(operationId);
        await this.io.barrier?.("after-format-head-sync", { operationId, revision: this.revision });
        await this.load();
      } catch {
        this.uncertain = operationId;
        await this.saveFormatUpgrade({ ...current, phase: "uncertain", error: "IO_UNCERTAIN" });
        throw new HomeError("IO_UNCERTAIN", "IO_UNCERTAIN", operationId);
      }
      return structuredClone(await this.saveFormatUpgrade({ ...current, phase: "switched", checkpoint: "switched", generation: pointer }));
    } catch (error) {
      const rawCode = error instanceof HomeError ? error.code : error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : void 0;
      const code2 = rawCode && /^[A-Z][A-Z0-9_]{1,63}$/.test(rawCode) ? rawCode : "FORMAT_UPGRADE_FAILED";
      if (code2 === "FORMAT_UPGRADE_BACKUP_REQUIRED" || code2 === "IO_UNCERTAIN") throw error;
      if (this.storage?.id !== current.generation?.id && current.generation) {
        try {
          await discardStorageGeneration(this.path, current.generation, operationId, this.io);
        } catch {
        }
      }
      try {
        await this.saveFormatUpgrade({ ...current, phase: "failed", error: code2, checkpoint: current.checkpoint, generation: void 0 });
      } catch (failure) {
        throw new HomeError(code2, `FORMAT_UPGRADE_UNCERTAIN:${failure instanceof HomeError ? failure.code : "UNKNOWN"}`, operationId);
      }
      throw new HomeError(code2, code2, operationId);
    } finally {
      this.runningFormatUpgrades.delete(operationId);
    }
  }
  /**
   * The successor is replayed as an independent authority: identity, commit graph and blob bodies
   * are recomputed, then every retained state is compared with the live Home before any switch.
   */
  async validateFormatUpgrade(pointer, retainedInput) {
    const identity = await identityAt(this.path, false, true);
    if (!sameFormat(identity.format, HOME_CURRENT_FORMAT)) fail7("FORMAT_UPGRADE_IDENTITY_MISMATCH");
    const checkpoint = await readStorageGeneration(this.path, pointer);
    if (checkpoint.roleId !== this.roleId || checkpoint.purpose !== "format-upgrade" || checkpoint.baseRevision !== this.revision || checkpoint.baseCommitDigest !== this.head) fail7("FORMAT_UPGRADE_RECORD_MISMATCH");
    let owner;
    try {
      owner = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await safeBytes2(join4(this.path, "content-generations", pointer.id, "owner.json"))));
    } catch {
      return fail7("FORMAT_UPGRADE_IDENTITY_MISMATCH");
    }
    exact2(owner, ["format", "operationId", "roleId", "id", "baseRevision", "sourceHeadDigest"]);
    if (owner.format !== "role-cleanup-generation-owner-1" || owner.roleId !== this.roleId || owner.operationId !== checkpoint.cleanupOperationId || owner.id !== pointer.id || owner.baseRevision !== pointer.baseRevision || owner.sourceHeadDigest !== pointer.baseCommitDigest) fail7("FORMAT_UPGRADE_IDENTITY_MISMATCH");
    const probe = new _DiskHome(this.path, identity, async () => {
    }, {}, false);
    await probe.load({ roleId: this.roleId, revision: HomeRevision(checkpoint.baseRevision), commitDigest: checkpoint.baseCommitDigest, digest: "", storage: pointer, format: HOME_UPGRADE_TARGET });
    const domain = checkpoint.domain;
    const live = JSON.stringify({ snapshot: this.snapshot, conversation: this.conversation, qqHistory: this.qqHistory, stops: this.stops, handovers: this.handovers, restoreAcceptances: this.restoreAcceptances, cleanupTasks: this.cleanupTasks });
    const copied = JSON.stringify({ snapshot: probe.snapshot, conversation: probe.conversation, qqHistory: probe.qqHistory, stops: probe.stops, handovers: probe.handovers, restoreAcceptances: probe.restoreAcceptances, cleanupTasks: probe.cleanupTasks });
    if (live !== copied || !domain?.snapshot) fail7("FORMAT_UPGRADE_MANIFEST_MISMATCH");
    const retainedStates = [
      { name: "contact-rules", same: JSON.stringify(probe.conversation.contactRules) === JSON.stringify(this.conversation.contactRules) },
      { name: "contact-intents", same: JSON.stringify(probe.conversation.contact) === JSON.stringify(this.conversation.contact) },
      { name: "inputs", same: JSON.stringify(probe.snapshot.inputs) === JSON.stringify(this.snapshot.inputs) },
      { name: "stops", same: JSON.stringify(probe.stops) === JSON.stringify(this.stops) },
      { name: "handovers", same: JSON.stringify(probe.handovers) === JSON.stringify(this.handovers) },
      { name: "restore-acceptances", same: JSON.stringify(probe.restoreAcceptances) === JSON.stringify(this.restoreAcceptances) },
      { name: "cleanup-tasks", same: JSON.stringify(probe.cleanupTasks) === JSON.stringify(this.cleanupTasks) },
      { name: "knowledge", same: JSON.stringify(probe.conversation.knowledge) === JSON.stringify(this.conversation.knowledge) },
      { name: "autonomy", same: JSON.stringify(probe.conversation.autonomy) === JSON.stringify(this.conversation.autonomy) },
      { name: "rules", same: JSON.stringify({ read: probe.conversation.readRules, retry: probe.conversation.retryRules, file: probe.conversation.fileRules, fileAccess: probe.conversation.fileAccess, web: probe.conversation.webRules, proposal: probe.conversation.proposalRules, delivery: probe.conversation.deliveryRules, rules: probe.conversation.rules }) === JSON.stringify({ read: this.conversation.readRules, retry: this.conversation.retryRules, file: this.conversation.fileRules, fileAccess: this.conversation.fileAccess, web: this.conversation.webRules, proposal: this.conversation.proposalRules, delivery: this.conversation.deliveryRules, rules: this.conversation.rules }) }
    ];
    if (retainedStates.some((state) => !state.same)) fail7("FORMAT_UPGRADE_MANIFEST_MISMATCH");
    if (fingerprint(probe.commits) !== fingerprint(this.commits) || probe.commits.length !== this.commits.length || probe.head !== this.head) fail7("FORMAT_UPGRADE_RECORD_MISMATCH");
    const turns = new Set(probe.conversation.turns.map((turn) => turn.runId));
    if (probe.conversation.replies.some((reply) => !turns.has(reply.runId)) || probe.conversation.attempts.some((attempt) => !turns.has(attempt.runId)) || probe.conversation.nativeRecords.some((record) => !turns.has(record.runId))) fail7("FORMAT_UPGRADE_RELATION_MISMATCH");
    const replyIds = new Set(probe.conversation.replies.map((reply) => reply.replyId));
    if (probe.conversation.deliveries.some((delivery) => delivery.source === "contact" ? delivery.contactIntentId === void 0 : delivery.replyId === void 0 || !replyIds.has(delivery.replyId))) fail7("FORMAT_UPGRADE_RELATION_MISMATCH");
    const deliveryIds = new Set(probe.conversation.deliveries.map((delivery) => delivery.deliveryId));
    if (probe.conversation.sendAttempts.some((attempt) => !deliveryIds.has(attempt.deliveryId))) fail7("FORMAT_UPGRADE_RELATION_MISMATCH");
    const intentIds = new Set(probe.conversation.contact.intents.map((intent) => intent.intentId));
    if (probe.conversation.deliveries.some((delivery) => delivery.source === "contact" && (delivery.contactIntentId === void 0 || !intentIds.has(delivery.contactIntentId)))) fail7("FORMAT_UPGRADE_RELATION_MISMATCH");
    if (probe.conversation.sendAttempts.some((attempt) => attempt.source === "contact" && (!attempt.contact || !intentIds.has(attempt.contact.intentId)))) fail7("FORMAT_UPGRADE_RELATION_MISMATCH");
    const inputIds = new Set(probe.snapshot.inputs.map((input) => input.inputId));
    if (probe.conversation.turns.some((turn) => turn.inputIds.some((id) => !inputIds.has(id)))) fail7("FORMAT_UPGRADE_RELATION_MISMATCH");
    const retained2 = retainedInput ?? await this.retainedGenerationFiles(), manifest2 = [];
    for (const file of retained2) {
      const copy = await safeBytes2(join4(this.path, "content-generations", pointer.id, file.path));
      if (!copy.equals(file.bytes)) fail7("FORMAT_UPGRADE_MANIFEST_MISMATCH");
      manifest2.push({ path: file.path, digest: digest(copy), bytes: copy.length });
    }
    return { identityDigest: fingerprint({ format: identity.format, roleId: identity.roleId, creationOperationId: identity.creationOperationId, creationFingerprint: identity.creationFingerprint }), recordDigest: fingerprint(probe.commits), manifestDigest: fingerprint(manifest2), verifiedFiles: probe.commits.length + manifest2.length };
  }
  continueCleanup(operationId) {
    return this.run(async () => {
      op(operationId);
      await this.assertWritable();
      if (this.uncertain) {
        const completionOperationId = OperationId("cleanup-complete-" + fingerprint(operationId));
        if (this.uncertain !== operationId && this.uncertain !== completionOperationId) fail7("IO_UNCERTAIN");
        await this.load();
        await this.syncStorage();
        await this.syncHead(this.uncertain);
        this.uncertain = null;
      }
      let task = this.cleanupTasks.find((task2) => task2.operationId === operationId);
      if (!task) fail7("CLEANUP_NOT_FOUND");
      if (task.phase === "complete") return structuredClone(task);
      if (this.conversation.turns.some((turn) => turn.status === "running") || this.conversation.attempts.some((attempt) => !attempt.outcome) || this.conversation.deliveries.some((delivery) => delivery.status === "sending")) fail7("CLEANUP_WORK_NOT_QUIESCENT");
      let checkpoint = this.storage ? await readStorageGeneration(this.path, this.storage) : void 0;
      if (!checkpoint || checkpoint.cleanupOperationId !== operationId) {
        const id = storageGenerationId(operationId, this.head), cleanupTasks = this.cleanupTasks.map((previous) => previous.operationId === operationId ? { ...previous, phase: "purging", storageGeneration: id, physical: { complete: false, purgedFiles: 0 } } : previous);
        const replayRequests = new Map(this.replayRequests);
        for (const commit of this.commits) if (commit.kind === "finish-turn" && commit.revision > (this.storage?.baseRevision ?? 0)) {
          const fact = JSON.parse(await this.managedText(commit.data.payload));
          replayRequests.set(commit.operationId, fingerprint({ kind: "finish-turn", runId: fact.runId, outcome: JSON.stringify(fact.outcome) }));
        }
        const domain = JSON.parse(JSON.stringify({ snapshot: this.snapshot, conversation: this.conversation, qqHistory: this.qqHistory, stops: this.stops, handovers: this.handovers, restoreAcceptances: this.restoreAcceptances, cleanupTasks, generatedHistory: this.generatedHistory.map((bytes2) => bytes2.toString("utf8")) }));
        const pointer = await prepareStorageGeneration(this.path, { roleId: this.roleId, baseRevision: this.revision, baseCommitDigest: this.head, domain, commits: this.commits, replayRequests: [...replayRequests].map(([operationId2, fingerprint2]) => ({ operationId: operationId2, fingerprint: fingerprint2 })), cleanupOperationId: operationId }, await this.retainedGenerationFiles(), this.io);
        await this.io.barrier?.("before-cleanup-head-publish", { operationId, revision: this.revision });
        this.storage = pointer;
        try {
          await this.syncHead(operationId);
          await this.io.barrier?.("after-cleanup-head-sync", { operationId, revision: this.revision });
          await this.load();
        } catch {
          this.uncertain = operationId;
          throw new HomeError("IO_UNCERTAIN", "IO_UNCERTAIN", operationId);
        }
        checkpoint = await readStorageGeneration(this.path, pointer);
        task = this.cleanupTasks.find((task2) => task2.operationId === operationId);
      }
      const purgedFiles = await purgeStorageGeneration(this.path, checkpoint, this.io, (purgedFiles2, totalFiles) => {
        this.cleanupTasks = this.cleanupTasks.map((task2) => task2.operationId === operationId ? { ...task2, phase: "purging", physical: { complete: false, purgedFiles: purgedFiles2, totalFiles } } : task2);
      });
      const business = { kind: "complete-cleanup", cleanupOperationId: operationId, storageGeneration: this.storage.id, purgedFiles };
      await this.append(business.kind, OperationId("cleanup-complete-" + fingerprint(operationId)), fingerprint(business), { cleanupOperationId: operationId, storageGeneration: this.storage.id, purgedFiles });
      return structuredClone(this.cleanupTasks.find((task2) => task2.operationId === operationId));
    });
  }
  stops = [];
  handovers = [];
  restoreAcceptances = [];
  restoredMaintenance = [];
  conversation = emptyConversation();
  scheduleAnchor;
  qqHistory = emptyQQHistory();
  generatedHistory = [];
  commits = [];
  head = null;
  snapshot;
  serial = Promise.resolve();
  closed = false;
  fault;
  uncertain = null;
  get roleId() {
    return this.identity.roleId;
  }
  get revision() {
    return this.snapshot?.revision ?? HomeRevision(0);
  }
  run(fn) {
    const task = this.serial.then(() => {
      if (this.closed)
        fail7("HOME_CLOSED");
      return fn();
    });
    this.serial = task.catch(() => {
    });
    return task;
  }
  /** A probe may supply the floor it is validating instead of reading the live head. */
  async load(probe) {
    const floor = probe ?? await readHead(this.path, this.roleId);
    this.storage = floor.storage;
    this.format = floor.format ?? HOME_CURRENT_FORMAT;
    if (!this.storage && floor.format) fail7("CORRUPT_HEAD");
    let base;
    if (this.storage) {
      try {
        base = await readStorageGeneration(this.path, this.storage);
      } catch (error) {
        if (error.code === "ENOENT") fail7("FORMAT_AUTHORITY_MISSING");
        throw error;
      }
      if (base.roleId !== this.roleId) fail7("IDENTITY_CONFLICT");
    }
    for (const dir of ["commits", "blobs", "views"])
      await directory2(join4(this.storagePath, dir));
    const chainDigests = [];
    const names = (await readdir3(join4(this.storagePath, "commits"))).filter((n) => !n.startsWith(".")).sort();
    this.commits = [];
    this.generatedHistory = [];
    this.head = null;
    let core = { text: "", version: 0 };
    let rules = { value: { inputLimitBytes: 32768 }, version: 0 };
    let generation = 0;
    let qqBinding;
    const inputs = [];
    this.conversation = emptyConversation();
    this.qqHistory = emptyQQHistory();
    this.stops = [];
    this.handovers = [];
    this.restoreAcceptances = [];
    this.restoredMaintenance = [];
    this.cleanupTasks = [];
    this.replayRequests = /* @__PURE__ */ new Map();
    let baseRevision = 0;
    if (base) {
      const domain = base.domain;
      if (!domain || !domain.snapshot || domain.snapshot.roleId !== this.roleId || domain.snapshot.creationOperationId !== this.identity.creationOperationId || domain.snapshot.revision !== base.baseRevision || !Array.isArray(base.commits) || base.commits.length !== base.baseRevision || !Array.isArray(domain.snapshot.inputs) || !Array.isArray(domain.conversation.turns) || !Array.isArray(domain.conversation.attempts) || !Array.isArray(domain.cleanupTasks) || !Array.isArray(domain.generatedHistory) || domain.generatedHistory.length !== base.baseRevision) fail7("CORRUPT_STORAGE_GENERATION");
      for (const [index, raw] of base.commits.entries()) {
        const c = raw;
        exact2(c, ["digest", "roleId", "revision", "prev", "kind", "operationId", "fingerprint", "data"]);
        const { digest: claimed, ...body } = c;
        if (c.roleId !== this.roleId || c.revision !== index + 1 || c.prev !== this.head || claimed !== fingerprint(body) || !/^[a-f0-9]{64}$/.test(c.fingerprint) || this.commits.some((previous) => previous.operationId === c.operationId)) fail7("CORRUPT_STORAGE_GENERATION");
        this.commits.push(c);
        this.head = digest(canonicalBytes(c));
        chainDigests.push(this.head);
      }
      if (this.head !== base.baseCommitDigest || this.commits[0]?.operationId !== this.identity.creationOperationId || this.commits[0]?.fingerprint !== this.identity.creationFingerprint) fail7("CORRUPT_STORAGE_GENERATION");
      baseRevision = base.baseRevision;
      core = { ...domain.snapshot.core };
      rules = structuredClone(domain.snapshot.settings);
      generation = domain.snapshot.contextGeneration;
      qqBinding = structuredClone(domain.snapshot.qqBinding);
      inputs.push(...structuredClone(domain.snapshot.inputs));
      this.conversation = structuredClone(domain.conversation);
      this.qqHistory = structuredClone(domain.qqHistory);
      this.stops = structuredClone(domain.stops);
      this.handovers = structuredClone(domain.handovers ?? []);
      this.restoreAcceptances = structuredClone(domain.restoreAcceptances ?? []);
      this.cleanupTasks = structuredClone(domain.cleanupTasks);
      this.generatedHistory = domain.generatedHistory.map((text2) => Buffer.from(text2, "utf8"));
      this.replayRequests = new Map(base.replayRequests.map((record) => [OperationId(record.operationId), record.fingerprint]));
    }
    for (const [tailIndex, name] of names.entries()) {
      const index = baseRevision + tailIndex;
      if (name !== String(index + 1).padStart(12, "0") + ".json")
        fail7("CORRUPT_CHAIN");
      const c = await jsonFile(join4(this.storagePath, "commits", name), this.recoverAliases, !this.recoverAliases);
      exact2(c, ["digest", "roleId", "revision", "prev", "kind", "operationId", "fingerprint", "data"]);
      const { digest: claimed, ...body } = c;
      if (claimed !== fingerprint(body))
        fail7("CORRUPT_COMMIT");
      if (index === 0 && c.kind !== "create")
        fail7("CORRUPT_CHAIN");
      if (c.roleId !== this.roleId || c.revision !== index + 1 || c.prev !== this.head || typeof c.operationId !== "string" || typeof c.fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(c.fingerprint))
        fail7("CORRUPT_CHAIN");
      op(String(c.operationId));
      if (this.commits.some((x) => x.operationId === c.operationId))
        fail7("CORRUPT_CHAIN");
      const data = c.data;
      if (c.kind === "create") {
        if (index !== 0 || c.operationId !== this.identity.creationOperationId || c.fingerprint !== this.identity.creationFingerprint)
          fail7("CORRUPT_CHAIN");
        exact2(data, ["core", "settings"]);
        core = { text: await this.blobText(data.core), version: 1 };
        rules = { value: await this.blobSettings(data.settings), version: 1 };
        generation = 1;
        if (c.fingerprint !== fingerprint({ kind: "create", core: core.text, settings: rules.value }))
          fail7("CORRUPT_COMMIT");
      } else if (c.kind === "edit-core") {
        exact2(data, ["core", "coreVersion"]);
        if (data.coreVersion !== core.version + 1)
          fail7("CORRUPT_CHAIN");
        core = { text: await this.blobText(data.core), version: Number(data.coreVersion) };
        generation++;
        if (c.fingerprint !== fingerprint({ kind: "edit-core", text: core.text }))
          fail7("CORRUPT_COMMIT");
      } else if (c.kind === "edit-settings") {
        exact2(data, ["settings", "settingsVersion"]);
        if (data.settingsVersion !== rules.version + 1)
          fail7("CORRUPT_CHAIN");
        rules = { value: await this.blobSettings(data.settings), version: Number(data.settingsVersion) };
        generation++;
        if (c.fingerprint !== fingerprint({ kind: "edit-settings", settings: rules.value }))
          fail7("CORRUPT_COMMIT");
      } else if (c.kind === "import-projection" || c.kind === "rebuild-projection") {
        const imported = c.kind === "import-projection";
        exact2(data, imported ? ["projectionId", "observedDigest", "preserved", "core", "coreVersion", "settings", "settingsVersion", "sourceRevision", "sourceCoreVersion", "sourceSettingsVersion", "provenance"] : ["projectionId", "observedDigest", "preserved"]);
        if (data.projectionId !== "settings" || data.observedDigest !== null && (typeof data.observedDigest !== "string" || !/^[a-f0-9]{64}$/.test(data.observedDigest))) fail7("CORRUPT_COMMIT");
        const material = await this.material(data.preserved);
        if ((material === null ? null : digest(material)) !== data.observedDigest) fail7("CORRUPT_CONTENT");
        if (c.fingerprint !== fingerprint({ kind: c.kind, projectionId: data.projectionId, observedDigest: data.observedDigest })) fail7("CORRUPT_COMMIT");
        if (imported) {
          if (!material) fail7("CORRUPT_COMMIT");
          const value = this.projectionValue(material);
          if (data.sourceRevision !== value.revision || data.sourceCoreVersion !== value.core.version || data.sourceSettingsVersion !== value.settings.version || data.provenance !== "owner-import") fail7("CORRUPT_COMMIT");
          const coreChanged = value.core.text !== core.text;
          const settingsChanged = value.settings.value.inputLimitBytes !== rules.value.inputLimitBytes;
          if (!coreChanged && !settingsChanged || data.coreVersion !== core.version + Number(coreChanged) || data.settingsVersion !== rules.version + Number(settingsChanged)) fail7("CORRUPT_CHAIN");
          if (coreChanged) {
            const importedText = await this.blobText(data.core);
            if (importedText !== value.core.text) fail7("CORRUPT_COMMIT");
            core = { text: importedText, version: Number(data.coreVersion) };
          } else if (data.core !== null) fail7("CORRUPT_COMMIT");
          if (settingsChanged) {
            const importedSettings = await this.blobSettings(data.settings);
            if (importedSettings.inputLimitBytes !== value.settings.value.inputLimitBytes) fail7("CORRUPT_COMMIT");
            rules = { value: importedSettings, version: Number(data.settingsVersion) };
          } else if (data.settings !== null) fail7("CORRUPT_COMMIT");
          generation++;
        }
      } else if (c.kind === "attach-home") {
        exact2(data, ["roleId"]);
        if (data.roleId !== this.roleId || c.fingerprint !== fingerprint({ kind: "attach-home", roleId: this.roleId }))
          fail7("CORRUPT_COMMIT");
      } else if (c.kind === "register-home") {
        exact2(data, ["targetOperationId"]);
        if (!this.commits.some((x) => x.operationId === data.targetOperationId && (x.kind === "create" || x.kind === "attach-home")))
          fail7("CORRUPT_CHAIN");
        if (c.fingerprint !== fingerprint({ kind: "register-home", targetOperationId: data.targetOperationId }))
          fail7("CORRUPT_COMMIT");
      } else if (c.kind === "bind-qq") {
        exact2(data, ["binding"]);
        const candidate = await this.blob(data.binding);
        try {
          const next = admitQQBinding(candidate, this.roleId);
          if (next.version !== (qqBinding?.version ?? 0) + 1 || next.activatedRevision !== c.revision) fail7("CORRUPT_COMMIT");
          qqBinding = next;
        } catch {
          return fail7("CORRUPT_COMMIT");
        }
        if (c.fingerprint !== fingerprint({ kind: "bind-qq", connectionId: qqBinding.connectionId, accountId: qqBinding.accountId, peerId: qqBinding.peerId })) fail7("CORRUPT_COMMIT");
        for (let i = 0; i < inputs.length; i++) if (inputs[i].channel === "qq" && inputs[i].status === "queued") inputs[i] = { ...inputs[i], status: "blocked", blockedReason: "binding-changed" };
        generation++;
      } else if (c.kind === "qq-history") {
        exact2(data, ["payload"]);
        const fact = JSON.parse(await this.managedText(data.payload));
        if (c.fingerprint !== fingerprint(qqHistoryBusiness(fact)) || fact.action === "begin" && fact.query.operationId !== c.operationId) fail7("CORRUPT_COMMIT");
        this.qqHistory = applyQQHistoryFact(this.qqHistory, fact, { roleId: this.roleId, binding: qqBinding, inputs });
      } else if (c.kind === "accept-input") {
        exact2(data, ["bindingId", "bindingVersion", "inputId", "experienceId", "receiveSequence", "keyHash", "content", "status"]);
        const content2 = await this.blob(data.content);
        exact2(content2, ["externalKey", "text", "origin", "receivedAt", "sourceEvidence", ...Object.hasOwn(content2, "contextPurpose") ? ["contextPurpose"] : [], ...content2.origin === "history" ? ["historySource"] : [], ...Object.hasOwn(content2, "channel") ? ["channel", "qqSource"] : []]);
        if (Object.hasOwn(content2, "channel") && content2.channel !== "qq" || Object.hasOwn(content2, "contextPurpose") && content2.contextPurpose !== "history") fail7("CORRUPT_COMMIT");
        const input = { operationId: op(c.operationId), bindingId: BindingId(data.bindingId), bindingVersion: BindingVersion(data.bindingVersion), externalKey: InputKey(content2.externalKey), text: String(content2.text), origin: content2.origin, ...content2.origin === "history" ? { historySource: content2.historySource } : {}, receivedAt: String(content2.receivedAt), sourceEvidence: String(content2.sourceEvidence), ...content2.contextPurpose === "history" ? { contextPurpose: content2.contextPurpose } : {}, ...content2.channel === "qq" ? { channel: "qq", qqSource: admitQQInputSource(content2.qqSource) } : {} };
        if (!["live", "history"].includes(String(content2.origin)) || typeof content2.text !== "string" || typeof content2.receivedAt !== "string" || typeof content2.sourceEvidence !== "string") fail7("CORRUPT_COMMIT");
        if (c.fingerprint !== fingerprint(inputBusiness(input, this.roleId, qqBinding, this.qqHistory)) || data.keyHash !== inputKey(input))
          fail7("CORRUPT_COMMIT");
        if (data.status !== "queued" || data.receiveSequence !== inputs.length + 1 || typeof data.inputId !== "string" || !/^input-[0-9a-f-]{36}$/.test(data.inputId) || typeof data.experienceId !== "string" || !/^experience-[0-9a-f-]{36}$/.test(data.experienceId) || inputs.some((x) => x.inputId === data.inputId || x.experienceId === data.experienceId || inputKey(x) === data.keyHash))
          fail7("CORRUPT_CHAIN");
        if (Buffer.byteLength(input.text, "utf8") > rules.value.inputLimitBytes)
          fail7("CORRUPT_COMMIT");
        inputs.push({ ...input, inputId: InputId(data.inputId), experienceId: ExperienceId(data.experienceId), committedRevision: HomeRevision(c.revision), receiveSequence: Number(data.receiveSequence), utf8Bytes: Buffer.byteLength(input.text, "utf8"), status: "queued", processingUnavailableReason: input.channel === "qq" ? "qq-replies-unavailable" : "execution-unavailable" });
      } else if (c.kind === "cleanup-sources") {
        exact2(data, ["payload"]);
        const task = JSON.parse(await this.managedText(data.payload));
        if (task.operationId !== c.operationId || task.phase !== "logical-complete" || task.logicalRevision !== c.revision || task.preview.revision !== index || task.physical.complete !== false) fail7("CORRUPT_CLEANUP");
        const previous = { roleId: this.roleId, revision: HomeRevision(index), core: { ...core, version: CoreVersion(core.version) }, settings: { ...rules, version: InputSettingsVersion(rules.version) }, contextGeneration: ContextGeneration(generation), creationOperationId: this.identity.creationOperationId, projection: "current", inputs, panelBinding: panelBindingFor(this.roleId), ...qqBinding ? { qqBinding } : {} };
        const expected = previewSourceCleanup(previous, this.conversation, task.preview.selection, this.qqHistory, this.storage, await this.retainedGenerationIds());
        if (JSON.stringify(expected) !== JSON.stringify(task.preview) || ![fingerprint({ kind: "cleanup-sources", selection: task.preview.selection }), fingerprint({ kind: "cleanup-sources", selection: task.preview.selection, previewDigest: task.preview.digest })].includes(String(c.fingerprint))) fail7("CORRUPT_CLEANUP");
        this.qqHistory = cleanupQQHistory(this.qqHistory, inputs, task.preview, op(c.operationId), HomeRevision(c.revision));
        const changed = applyLogicalCleanup(inputs, this.conversation, task.preview, op(c.operationId), HomeRevision(c.revision));
        inputs.splice(0, inputs.length, ...changed.inputs);
        this.conversation = changed.state;
        this.cleanupTasks.push(task);
        generation++;
      } else if (c.kind === "complete-cleanup") {
        exact2(data, ["cleanupOperationId", "storageGeneration", "purgedFiles"]);
        const index2 = this.cleanupTasks.findIndex((task2) => task2.operationId === data.cleanupOperationId);
        if (index2 < 0 || typeof data.storageGeneration !== "string" || !Number.isSafeInteger(data.purgedFiles) || Number(data.purgedFiles) < 0 || c.fingerprint !== fingerprint({ kind: "complete-cleanup", cleanupOperationId: data.cleanupOperationId, storageGeneration: data.storageGeneration, purgedFiles: data.purgedFiles })) fail7("CORRUPT_CLEANUP");
        const task = this.cleanupTasks[index2];
        this.cleanupTasks[index2] = { ...task, phase: "complete", storageGeneration: String(data.storageGeneration), physical: { complete: true, purgedFiles: Number(data.purgedFiles), totalFiles: Number(data.purgedFiles) } };
      } else if (c.kind === "accept-restore") {
        exact2(data, ["restoreOperationId", "handoverId", "manifestDigest", "sourceRevision", "sourceStopOperationId", "inputSequence", "inheritedRunIds", ...Object.hasOwn(data, "maintenance") ? ["maintenance"] : []]);
        if (Object.hasOwn(data, "maintenance")) {
          const incoming = restoredMaintenanceSnapshots(JSON.parse(await this.managedText(data.maintenance)), this.roleId), all = new Map(this.restoredMaintenance.map((snapshot) => [fingerprint(snapshot), snapshot]));
          for (const snapshot of incoming) all.set(fingerprint(snapshot), snapshot);
          this.restoredMaintenance = [...all.values()];
        }
        const inheritedRunIds = data.inheritedRunIds;
        if (!Array.isArray(inheritedRunIds) || !Number.isSafeInteger(data.inputSequence) || Number(data.inputSequence) < 0) return fail7("CORRUPT_COMMIT");
        const record = { operationId: op(c.operationId), restoreOperationId: OperationId(data.restoreOperationId), handoverId: HandoverId(data.handoverId), manifestDigest: BackupManifestDigest(data.manifestDigest), sourceRevision: HomeRevision(data.sourceRevision), sourceStopOperationId: OperationId(data.sourceStopOperationId), inputSequence: Number(data.inputSequence), inheritedRunIds: inheritedRunIds.map((id) => RunId(id)), committedRevision: HomeRevision(c.revision) };
        const handover = this.handovers.find((item) => item.handoverId === record.handoverId);
        if (record.sourceRevision !== HomeRevision(HomeRevision(c.revision) - 1) || record.inputSequence !== (inputs.at(-1)?.receiveSequence ?? 0) || !handover?.readyRevision || handover.readyRevision > record.sourceRevision || handover.stopOperationId !== record.sourceStopOperationId || fingerprint(record.inheritedRunIds) !== fingerprint(this.conversation.turns.filter((turn) => turn.status === "running" || turn.status === "suspended").map((turn) => turn.runId)) || c.fingerprint !== fingerprint({ kind: "accept-restore", restoreOperationId: record.restoreOperationId, handoverId: record.handoverId, expectedManifestDigest: record.manifestDigest, currentSourceStoppedConfirmed: true })) fail7("CORRUPT_COMMIT");
        this.restoreAcceptances.push(record);
      } else if (c.kind === "request-handover") {
        exact2(data, ["handoverId", "backupOperationId", "stopOperationId", "destinationDigest"]);
        const request = handoverReservation({ operationId: c.operationId, ...data, expectedRevision: HomeRevision(HomeRevision(c.revision) - 1) });
        const { operationId, expectedRevision, ...business } = request;
        if (this.handovers.some((record) => currentOutgoingHandover(record, this.restoreAcceptances.at(-1)?.committedRevision)) || c.fingerprint !== fingerprint({ kind: "request-handover", ...business })) fail7("CORRUPT_COMMIT");
        this.handovers.push({ operationId, ...business, requestedRevision: HomeRevision(c.revision) });
      } else if (c.kind === "reconcile-handover") {
        exact2(data, ["handoverOperationId", "priorNativeFlush"]);
        const index2 = this.handovers.findIndex((record2) => record2.operationId === data.handoverOperationId), record = this.handovers[index2];
        if (!record || record.recovery || record.readyRevision !== void 0 || !["unknown", "source-checkpoint"].includes(String(data.priorNativeFlush)) || data.priorNativeFlush === "source-checkpoint" && !this.stops.some((stop) => stop.operationId === record.stopOperationId && stop.checkpoint === "ready-to-close" && stop.requestedRevision > record.requestedRevision) || c.fingerprint !== fingerprint({ kind: "reconcile-handover", handoverOperationId: data.handoverOperationId, priorNativeFlush: data.priorNativeFlush })) fail7("CORRUPT_COMMIT");
        this.handovers[index2] = { ...record, recovery: { revision: HomeRevision(c.revision), priorNativeFlush: data.priorNativeFlush === "source-checkpoint" ? "source-checkpoint" : "unknown" } };
      } else if (c.kind === "ready-handover") {
        exact2(data, ["handoverOperationId"]);
        const index2 = this.handovers.findIndex((record2) => record2.operationId === data.handoverOperationId), record = this.handovers[index2];
        if (!record || record.readyRevision !== void 0 || !this.stops.some((stop) => stop.operationId === record.stopOperationId && stop.checkpoint === "ready-to-close") || c.fingerprint !== fingerprint({ kind: "ready-handover", handoverOperationId: data.handoverOperationId })) fail7("CORRUPT_COMMIT");
        this.handovers[index2] = { ...record, readyRevision: HomeRevision(c.revision) };
      } else if (c.kind === "request-stop") {
        exact2(data, ["reason"]);
        const reason = data.reason;
        if (!isStopReason(reason)) return fail7("CORRUPT_COMMIT");
        if (c.fingerprint !== fingerprint({ kind: "request-stop", reason })) fail7("CORRUPT_COMMIT");
        this.stops.push({ operationId: op(c.operationId), reason, requestedRevision: HomeRevision(c.revision), checkpoint: "requested", checkpointRevision: HomeRevision(c.revision) });
      } else if (c.kind === "checkpoint-stop") {
        exact2(data, ["stopOperationId"]);
        const index2 = this.stops.findIndex((stop) => stop.operationId === data.stopOperationId);
        if (index2 < 0 || this.stops[index2].checkpoint !== "requested" || c.fingerprint !== fingerprint({ kind: "checkpoint-stop", stopOperationId: data.stopOperationId })) fail7("CORRUPT_COMMIT");
        this.stops[index2] = { ...this.stops[index2], checkpoint: "ready-to-close", checkpointRevision: HomeRevision(c.revision) };
      } else if (c.kind === "reconcile-stop") {
        exact2(data, ["stopOperationId"]);
        const index2 = this.stops.findIndex((stop) => stop.operationId === data.stopOperationId);
        if (index2 < 0 || this.stops[index2].reconciledRevision !== void 0 || c.fingerprint !== fingerprint({ kind: "reconcile-stop", stopOperationId: data.stopOperationId })) fail7("CORRUPT_COMMIT");
        this.stops[index2] = { ...this.stops[index2], reconciledRevision: HomeRevision(c.revision) };
      } else if (["rollback-knowledge", "coalesce-wake", "suspend-autonomous", "resume-autonomous", "request-wake", "begin-autonomous", "edit-autonomy-rules", "set-autonomy-pause", "clock-blocked", "clock-reviewed", "edit-file-rules", "edit-file-access", "edit-proposal-rules", "save-proposal", "process-proposal", "resolve-delivery", "edit-web-rules", "reserve-web-tool", "begin-delivery", "settle-delivery", "edit-delivery-rules", "begin-turn", "reserve-attempt", "enter-attempt", "record-attempt", "observe-tool", "capture-material", "finish-turn", "refresh-turn-context", "native-record", "edit-conversation", "edit-read-rules", "edit-retry-rules", "edit-contact-rules", "contact-intent", "settle-contact-intent", "close-contact-intent"].includes(String(c.kind))) {
        exact2(data, ["payload"]);
        const encoded = await this.managedText(data.payload);
        let fact;
        try {
          fact = JSON.parse(encoded);
        } catch {
          return fail7("CORRUPT_COMMIT");
        }
        if (fact.kind !== c.kind) fail7("CORRUPT_COMMIT");
        if (fact.kind === "rollback-knowledge" && (fact.version.ownerAction.operationId !== c.operationId || c.fingerprint !== fingerprint(rollbackKnowledgeBusiness({ knowledgeId: fact.version.knowledgeId, targetVersion: fact.version.rollbackOf.version, reason: fact.version.ownerAction.reason })))) fail7("CORRUPT_COMMIT");
        this.applyConversationFact(fact, inputs, ContextGeneration(generation), HomeRevision(c.revision), qqBinding);
        if (fact.kind === "rollback-knowledge" || fact.kind === "edit-file-access" || fact.kind === "edit-proposal-rules" || fact.kind === "process-proposal" && fact.version && fact.version.version > 1) generation++;
      } else
        fail7("UNKNOWN_FORMAT");
      this.generatedHistory.push(this.generated({ roleId: this.roleId, revision: HomeRevision(index + 1), core: { ...core, version: CoreVersion(core.version) }, settings: { ...rules, version: InputSettingsVersion(rules.version) }, contextGeneration: ContextGeneration(generation), creationOperationId: this.identity.creationOperationId, projection: "current", inputs, panelBinding: panelBindingFor(this.roleId), ...qqBinding ? { qqBinding } : {} }));
      this.commits.push({ digest: String(c.digest), roleId: RoleId(c.roleId), revision: HomeRevision(c.revision), prev: c.prev === null ? null : String(c.prev), kind: String(c.kind), operationId: op(c.operationId), fingerprint: String(c.fingerprint), data });
      this.head = digest(await safeBytes2(join4(this.storagePath, "commits", name), false, !this.recoverAliases));
      chainDigests.push(this.head);
    }
    if (floor.revision > this.commits.length || floor.revision > 0 && chainDigests[floor.revision - 1] !== floor.commitDigest) fail7("CORRUPT_HEAD");
    if (!this.commits.length)
      fail7("INCOMPLETE_HOME");
    this.snapshot = { roleId: this.roleId, revision: HomeRevision(this.commits.length), core: { ...core, version: CoreVersion(core.version) }, settings: { ...rules, version: InputSettingsVersion(rules.version) }, contextGeneration: ContextGeneration(generation), creationOperationId: this.identity.creationOperationId, projection: "lag", inputs, panelBinding: panelBindingFor(this.roleId), ...qqBinding ? { qqBinding } : {} };
    this.snapshot = { ...this.snapshot, projection: await this.projection(false) };
  }
  async syncHead(operationId = OperationId("reopen")) {
    const path = join4(this.path, "head.json");
    const bytes2 = headBytes(this.roleId, HomeRevision(this.commits.length), this.head, this.storage, this.format);
    if (!(await safeBytes2(path)).equals(bytes2)) {
      const temp = join4(this.path, ".head." + randomUUID3() + ".pending");
      const fd = await open3(temp, "wx", 384);
      try {
        await fd.writeFile(bytes2);
        await fd.sync();
      } finally {
        await fd.close();
      }
      await rename2(temp, path);
      await this.io.barrier?.("after-head-publish", { operationId, revision: HomeRevision(this.commits.length) });
    }
    await syncDir3(this.path);
    await this.io.barrier?.("after-head-sync", { operationId, revision: HomeRevision(this.commits.length) });
  }
  async blob(ref) {
    if (typeof ref !== "string" || !/^[a-f0-9]{64}$/.test(ref))
      fail7("CORRUPT_HOME");
    const path = join4(this.storagePath, "blobs", String(ref) + ".json");
    let bytes2;
    try {
      bytes2 = await safeBytes2(path, this.recoverAliases, !this.recoverAliases);
    } catch (error) {
      if (error.code === "ENOENT") fail7("MISSING_CONTENT");
      throw error;
    }
    if (digest(bytes2) !== ref)
      fail7("CORRUPT_CONTENT");
    return jsonFile(path, false, !this.recoverAliases);
  }
  async blobText(ref) {
    const b = await this.blob(ref);
    exact2(b, ["text"]);
    text(b.text);
    return String(b.text);
  }
  async blobSettings(ref) {
    const b = await this.blob(ref);
    settings(b);
    return b;
  }
  async put(value) {
    const bytes2 = canonicalBytes(value);
    if (bytes2.length > 8388608) fail7("CONTENT_RECORD_TOO_LARGE");
    const hash3 = digest(bytes2);
    const path = join4(this.storagePath, "blobs", hash3 + ".json");
    try {
      await publish2(path, bytes2);
    } catch (e) {
      if (e.code !== "EEXIST")
        throw e;
      if (!(await safeBytes2(path, true)).equals(bytes2))
        fail7("CORRUPT_CONTENT");
    }
    await syncDir3(dirname4(path));
    return hash3;
  }
  async putMaterial(bytes2) {
    const chunks = [];
    if (bytes2 && bytes2.length > 8388608) fail7("PROJECTION_TOO_LARGE");
    if (bytes2) for (let start = 0; start < bytes2.length; start += 1048576) chunks.push(await this.put({ bytesBase64: bytes2.subarray(start, start + 1048576).toString("base64") }));
    return this.put({ chunks, byteLength: bytes2?.length ?? 0, absent: bytes2 === null, contentDigest: bytes2 === null ? null : digest(bytes2) });
  }
  async material(ref) {
    const body = await this.blob(ref);
    exact2(body, ["chunks", "byteLength", "absent", "contentDigest"]);
    if (!Array.isArray(body.chunks) || body.chunks.length > 8 || !Number.isSafeInteger(body.byteLength) || Number(body.byteLength) < 0 || Number(body.byteLength) > 8388608 || typeof body.absent !== "boolean") fail7("CORRUPT_CONTENT");
    const chunks = [];
    for (const ref2 of body.chunks) {
      const chunk = await this.blob(ref2);
      exact2(chunk, ["bytesBase64"]);
      if (typeof chunk.bytesBase64 !== "string") fail7("CORRUPT_CONTENT");
      const bytes3 = Buffer.from(chunk.bytesBase64, "base64");
      if (bytes3.toString("base64") !== chunk.bytesBase64 || bytes3.length > 1048576 || bytes3.length === 0) fail7("CORRUPT_CONTENT");
      chunks.push(bytes3);
    }
    const bytes2 = Buffer.concat(chunks);
    if (bytes2.length !== body.byteLength || (body.absent ? bytes2.length !== 0 || body.contentDigest !== null : digest(bytes2) !== body.contentDigest)) fail7("CORRUPT_CONTENT");
    return body.absent ? null : bytes2;
  }
  projectionValue(bytes2) {
    if (bytes2.length > 8388608) fail7("PROJECTION_TOO_LARGE");
    let parsed;
    try {
      parsed = parseProjectionJSON(new TextDecoder("utf-8", { fatal: true }).decode(bytes2));
    } catch {
      fail7("INVALID_PROJECTION");
    }
    exact2(parsed, ["revision", "core", "settings"]);
    exact2(parsed.core, ["text", "version"]);
    exact2(parsed.settings, ["value", "version"]);
    if (!Number.isSafeInteger(parsed.revision) || Number(parsed.revision) < 1 || Number(parsed.revision) > this.generatedHistory.length) fail7("PROJECTION_METADATA_CHANGED");
    const original = JSON.parse(this.generatedHistory[Number(parsed.revision) - 1].toString("utf8"));
    if (parsed.core.version !== original.core.version || parsed.settings.version !== original.settings.version) fail7("PROJECTION_METADATA_CHANGED");
    text(parsed.core.text);
    settings(parsed.settings.value);
    return { revision: HomeRevision(parsed.revision), core: { text: String(parsed.core.text), version: CoreVersion(parsed.core.version) }, settings: { value: parsed.settings.value, version: InputSettingsVersion(parsed.settings.version) } };
  }
  async putManaged(value, refs) {
    const put = async (content2) => {
      const ref = await this.put(content2);
      refs?.add(ref);
      return ref;
    };
    const text2 = managedJSON(value), bytes2 = Buffer.from(text2, "utf8");
    if (bytes2.length > 268435456) fail7("CONTENT_RECORD_TOO_LARGE");
    if (bytes2.length <= 1048576) return put({ encoding: "json", text: text2 });
    const chunks = [];
    for (let offset = 0; offset < bytes2.length; offset += 1048576) chunks.push(await put({ base64: bytes2.subarray(offset, offset + 1048576).toString("base64") }));
    return put({ encoding: "json-chunks", byteLength: bytes2.length, contentDigest: digest(bytes2), chunks });
  }
  async managedText(ref) {
    const root = await this.blob(ref);
    if (root.encoding === "json") {
      exact2(root, ["encoding", "text"]);
      if (typeof root.text !== "string") return fail7("CORRUPT_CONTENT");
      return root.text;
    }
    exact2(root, ["encoding", "byteLength", "contentDigest", "chunks"]);
    if (root.encoding !== "json-chunks" || !Number.isSafeInteger(root.byteLength) || Number(root.byteLength) < 1 || Number(root.byteLength) > 268435456 || !Array.isArray(root.chunks) || root.chunks.length !== Math.ceil(Number(root.byteLength) / 1048576) || typeof root.contentDigest !== "string") return fail7("CORRUPT_CONTENT");
    const chunks = [];
    for (const hash3 of root.chunks) {
      const chunk = await this.blob(hash3);
      exact2(chunk, ["base64"]);
      if (typeof chunk.base64 !== "string") return fail7("CORRUPT_CONTENT");
      const bytes3 = Buffer.from(chunk.base64, "base64");
      if (bytes3.length > 1048576 || bytes3.toString("base64") !== chunk.base64) return fail7("CORRUPT_CONTENT");
      chunks.push(bytes3);
    }
    if (chunks.reduce((n, b) => n + b.length, 0) !== root.byteLength) return fail7("CORRUPT_CONTENT");
    const bytes2 = Buffer.concat(chunks);
    if (digest(bytes2) !== root.contentDigest) return fail7("CORRUPT_CONTENT");
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes2);
    } catch {
      return fail7("CORRUPT_CONTENT");
    }
  }
  generated(s) {
    return canonicalBytes({ revision: s.revision, core: s.core, settings: s.settings });
  }
  async preview(projectionId) {
    if (projectionId !== "settings") fail7("UNSUPPORTED_PROJECTION");
    const expected = this.generated(this.snapshot);
    const base = { projectionId, roleId: this.roleId, revision: this.revision, coreVersion: this.snapshot.core.version, settingsVersion: this.snapshot.settings.version, expectedText: expected.toString("utf8"), expectedDigest: digest(expected) };
    let actual;
    try {
      actual = await safeBytes2(join4(this.storagePath, "views", "settings.json"));
    } catch (error) {
      return { ...base, state: error.code === "ENOENT" ? "lag" : "unavailable", actualText: null, actualDigest: null, importable: false, reason: error.code === "ENOENT" ? "PROJECTION_MISSING" : "UNSAFE_PROJECTION", changes: [] };
    }
    let actualText;
    try {
      actualText = new TextDecoder("utf-8", { fatal: true }).decode(actual);
    } catch {
      return { ...base, state: "diff", actualText: null, actualDigest: digest(actual), importable: false, reason: "INVALID_UTF8", changes: [] };
    }
    const state = actual.equals(expected) ? "current" : this.generatedHistory.some((bytes2) => actual.equals(bytes2)) ? "lag" : "diff";
    let importable = false;
    let reason;
    const changes = [];
    let sourceTemplate;
    try {
      const value = this.projectionValue(actual);
      sourceTemplate = { revision: value.revision, coreVersion: CoreVersion(value.core.version), settingsVersion: InputSettingsVersion(value.settings.version) };
      if (value.core.text !== this.snapshot.core.text) changes.push("core");
      if (value.settings.value.inputLimitBytes !== this.snapshot.settings.value.inputLimitBytes) changes.push("settings");
      importable = changes.length > 0;
      if (!importable) reason = "NO_SUPPORTED_CHANGES";
    } catch (error) {
      reason = error instanceof HomeError && error.code === "PROJECTION_METADATA_CHANGED" ? error.code : "INVALID_PROJECTION";
    }
    return { ...base, state, actualText, actualDigest: digest(actual), importable, ...sourceTemplate ? { sourceTemplate } : {}, ...reason ? { reason } : {}, changes };
  }
  previewProjection(projectionId) {
    return this.run(async () => {
      await this.assertWritable();
      return this.preview(projectionId);
    });
  }
  readDiagnostic() {
    return this.run(async () => {
      const result = await diagnoseRoleHome(this.path, { expectedRoleId: this.roleId });
      if (result.mode === "read-only") this.fault = result;
      return this.fault ?? result;
    });
  }
  async assertWritable() {
    if (this.fault) fail7("READ_ONLY_HOME");
    const diagnostic = await diagnoseRoleHome(this.path, { expectedRoleId: this.roleId });
    if (diagnostic.mode === "read-only") {
      this.fault = diagnostic;
      fail7("READ_ONLY_HOME");
    }
  }
  readPreservedProjection(operationId) {
    return this.run(async () => {
      await this.assertWritable();
      op(operationId);
      const commit = this.commits.find((c) => c.operationId === operationId);
      if (!commit || commit.kind !== "import-projection" && commit.kind !== "rebuild-projection") fail7("PROJECTION_OPERATION_NOT_FOUND");
      const material = await this.material(commit.data.preserved);
      return { operationId, materialRef: String(commit.data.preserved), bytesBase64: material?.toString("base64") ?? "", absent: material === null };
    });
  }
  async projection(write, previous) {
    const file = join4(this.storagePath, "views", "settings.json");
    const desired = this.generated(this.snapshot);
    let existing;
    try {
      existing = await safeBytes2(file);
    } catch (e) {
      if (e.code !== "ENOENT")
        return "diff";
    }
    if (existing?.equals(desired))
      return "current";
    if (existing && !this.generatedHistory.some((bytes2) => existing.equals(bytes2)) && (!previous || !existing.equals(this.generated(previous))))
      return "diff";
    if (!write)
      return "lag";
    try {
      const temp = join4(this.storagePath, "views", "." + randomUUID3() + ".projection");
      const fd = await open3(temp, "wx", 384);
      try {
        await fd.writeFile(desired);
        await fd.sync();
      } finally {
        await fd.close();
      }
      await rename2(temp, file);
      await syncDir3(dirname4(file));
      return "current";
    } catch {
      return "lag";
    }
  }
  async append(kind, operationId, fp, data) {
    if (this.backups && (await this.backups.read(operationId)).phase !== "not-found") fail7("OPERATION_CONFLICT");
    const body = { roleId: this.roleId, revision: HomeRevision(this.commits.length + 1), prev: this.head, kind, operationId, fingerprint: fp, data };
    const c = { ...body, digest: fingerprint(body) };
    let published = false;
    const previous = this.snapshot;
    try {
      await this.io.barrier?.("before-commit-publish", { operationId, revision: c.revision });
      await publish2(join4(this.storagePath, "commits", String(c.revision).padStart(12, "0") + ".json"), canonicalBytes(c), async () => {
        published = true;
        await this.io.barrier?.("after-commit-publish", { operationId, revision: c.revision });
      });
      await this.io.barrier?.("after-commit-sync", { operationId, revision: c.revision });
    } catch (e) {
      if (published) {
        this.uncertain = operationId;
        throw new HomeError("IO_UNCERTAIN");
      }
      throw e;
    }
    try {
      await this.load();
      await this.syncHead(operationId);
    } catch {
      this.uncertain = operationId;
      throw new HomeError("IO_UNCERTAIN");
    }
    this.snapshot = { ...this.snapshot, projection: await this.projection(kind !== "import-projection" && kind !== "rebuild-projection", previous) };
    return this.receipt(c);
  }
  receipt(c) {
    return { operationId: c.operationId, kind: "committed", roleId: this.roleId, committedRevision: c.revision, stage: (c.kind === "create" || c.kind === "attach-home") && !this.commits.some((x) => x.kind === "register-home" && x.data.targetOperationId === c.operationId) ? "created-unregistered" : "applied", projection: this.snapshot.projection };
  }
  applyConversationFact(fact, inputs, generation, revision, qqBinding) {
    fact = admitConversationFact(fact);
    const state = this.conversation;
    const invalid5 = () => fail7("CORRUPT_CONVERSATION");
    const active = (id) => state.turns.find((t) => t.runId === id && t.status === "running") ?? invalid5();
    if (fact.kind === "suspend-autonomous") {
      const t = active(fact.runId);
      if (t.source !== "autonomous" || state.attempts.some((a) => a.runId === t.runId && !a.outcome)) invalid5();
      this.conversation = { ...state, turns: state.turns.map((x) => x === t ? { ...t, status: "suspended" } : x) };
      return;
    }
    if (fact.kind === "resume-autonomous") {
      const t = state.turns.find((t2) => t2.runId === fact.runId && t2.status === "suspended" && restoreRunEligible(this.restoreAcceptances.at(-1), t2.runId)), p = state.autonomy.pending;
      if (!t || t.source !== "autonomous" || !p || p.opportunityId !== fact.opportunityId || fact.contextGeneration !== generation || fact.admittedInputSequence !== Math.max(0, ...inputs.map((i) => i.receiveSequence))) invalid5();
      this.conversation = { ...state, autonomy: { ...state.autonomy, pending: null }, turns: state.turns.map((x) => x === t ? { ...t, status: "running", admittedInputSequence: fact.admittedInputSequence, contextGeneration: fact.contextGeneration } : x) };
      return;
    }
    if (fact.kind === "coalesce-wake") {
      if (!state.autonomy.pending || JSON.stringify(state.autonomy.pending) !== JSON.stringify(fact.opportunity) || clockProblem(state.autonomy, fact.clock)) invalid5();
      this.conversation = { ...state, autonomy: { ...state.autonomy, clock: fact.clock } };
      return;
    }
    if (fact.kind === "request-wake") {
      if (state.autonomy.pending || clockProblem(state.autonomy, fact.clock) || fact.opportunity.requestedAt !== fact.clock.utc) invalid5();
      this.conversation = { ...state, autonomy: { ...state.autonomy, pending: fact.opportunity, clock: fact.clock } };
      return;
    }
    if (fact.kind === "clock-blocked") {
      if (!clockProblem(state.autonomy, fact.clock) || fact.reason !== clockProblem(state.autonomy, fact.clock)) invalid5();
      this.conversation = { ...state, autonomy: { ...state.autonomy, clockBlocked: fact.reason } };
      return;
    }
    if (fact.kind === "clock-reviewed") {
      if (fact.review !== "trusted-owner" || !state.autonomy.clockBlocked || fact.previousBlock !== state.autonomy.clockBlocked || clockProblem({ ...state.autonomy, clockBlocked: void 0 }, fact.clock)) invalid5();
      const { clockBlocked, ...rest } = state.autonomy;
      this.conversation = { ...state, autonomy: { ...rest, clock: fact.clock } };
      return;
    }
    if (fact.kind === "edit-autonomy-rules") {
      if (!validAutonomyRules(fact.value) || fact.version !== state.autonomy.rules.version + 1) invalid5();
      const last = state.autonomy.windows.at(-1), transition = fact.transition;
      if (!transition) {
        if (fact.clock) invalid5();
        this.conversation = { ...state, autonomy: { ...state.autonomy, rules: { version: fact.version, value: fact.value } } };
        return;
      }
      const clock = fact.clock, before = last;
      if (!before || !clock || fact.value.timeZone === state.autonomy.rules.value.timeZone) invalid5();
      else if (transition.kind !== "time-zone-change" || transition.nextTimeZone !== fact.value.timeZone || transition.previousTimeZone !== before.timeZone || transition.previousEndUtc !== before.endUtc || transition.at !== clock.utc || transition.dataVersion !== clock.dataVersion) invalid5();
      else if (clockProblem(state.autonomy, clock)) invalid5();
      else {
        const recomputed = transitionIanaWindow(before, fact.value, transition.at, transition.dataVersion);
        if (JSON.stringify(recomputed.transition) !== JSON.stringify(transition)) invalid5();
        this.conversation = { ...state, autonomy: { ...state.autonomy, clock, rules: { version: fact.version, value: fact.value }, windows: state.autonomy.windows.map((window) => window === last ? recomputed.window : window) } };
      }
      return;
    }
    if (fact.kind === "set-autonomy-pause") {
      if (typeof fact.paused !== "boolean" || !Number.isFinite(Date.parse(fact.at))) invalid5();
      if (fact.paused ? state.autonomy.pausedAt !== void 0 : state.autonomy.pausedAt === void 0) invalid5();
      const { pausedAt: ignored2, ...rest } = state.autonomy;
      this.conversation = { ...state, autonomy: fact.paused ? { ...rest, pausedAt: fact.at } : rest };
      return;
    }
    if (fact.kind === "begin-autonomous") {
      const t = fact.turn, p = state.autonomy.pending;
      if (!p || p.opportunityId !== fact.opportunityId || t.opportunityId !== p.opportunityId || t.source !== "autonomous" || t.inputIds.length || t.status !== "running" || t.admittedInputSequence !== Math.max(0, ...inputs.map((i) => i.receiveSequence)) || t.bindingId !== panelBindingFor(this.roleId).bindingId || t.bindingVersion !== 1 || t.contextGeneration !== generation || t.settingsVersion !== state.rules.version || state.turns.some((x) => x.runId === t.runId) || Date.parse(t.deadline) !== Date.parse(t.startedAt) + state.autonomy.rules.value.windowMs) invalid5();
      this.conversation = { ...state, turns: [...state.turns, t], autonomy: { ...state.autonomy, pending: null } };
      return;
    }
    if (fact.kind === "rollback-knowledge") {
      const version2 = fact.version;
      if (!version2.ownerAction || version2.ownerAction.kind !== "rollback" || version2.proposalId !== void 0 || version2.rollbackOf.knowledgeId !== version2.knowledgeId) invalid5();
      const command = parseKnowledgeRollback({ kind: "rollback-knowledge", operationId: version2.ownerAction.operationId, knowledgeId: version2.knowledgeId, targetVersion: version2.rollbackOf.version, expectedKnowledgeVersion: version2.ownerAction.fromVersion, expectedRevision: HomeRevision(revision - 1), reason: version2.ownerAction.reason });
      const expected = createKnowledgeRollback(state.knowledge, command, revision, version2.ownerAction.createdAt);
      if (JSON.stringify(expected) !== JSON.stringify(version2)) invalid5();
      this.conversation = { ...state, knowledge: { ...state.knowledge, versions: [...state.knowledge.versions, expected] } };
      return;
    }
    if (fact.kind === "save-proposal") {
      const raw = fact.proposal, a = state.attempts.find((a2) => a2.attemptId === raw.attemptId), value = parseKnowledgeProposal(raw.value), claim = proposalClaim(raw.claim);
      if (!a || a.kind !== "tool" || !a.proposal || !a.enteredAt || a.outcome || raw.runId !== a.runId || raw.committedRevision !== revision || raw.processing || claim.sourceBasis && JSON.stringify(claim.sourceBasis.map((source) => source.ref)) !== JSON.stringify(value.sources.map((source) => source.ref)) || !Number.isFinite(Date.parse(raw.createdAt)) || state.knowledge.proposals.some((p) => p.proposalId === raw.proposalId || p.attemptId === a.attemptId) || JSON.stringify(claim) !== JSON.stringify(a.proposal)) invalid5();
      active(a.runId);
      for (const source of value.sources) {
        const ref = source.ref;
        if (ref.kind === "input" && !inputs.some((input) => input.inputId === ref.id) || ref.kind === "reply" && !state.replies.some((reply) => reply.replyId === ref.id) || ref.kind === "tool" && !state.attempts.some((tool) => tool.kind === "tool" && tool.attemptId === ref.id) || ref.kind === "knowledge" && !state.knowledge.versions.some((version2) => version2.knowledgeId === ref.id && version2.version === ref.version)) invalid5();
      }
      const proposal = { ...raw, proposalId: ProposalId(raw.proposalId), operationId: OperationId(raw.operationId), runId: RunId(raw.runId), attemptId: AttemptId(raw.attemptId), claim, value, committedRevision: revision };
      this.conversation = { ...state, knowledge: { ...state.knowledge, proposals: [...state.knowledge.proposals, proposal] } };
      return;
    }
    if (fact.kind === "process-proposal") {
      const contactFact = fact.contact;
      const p = state.knowledge.proposals.find((p2) => p2.proposalId === fact.proposalId), a = p && state.attempts.find((a2) => a2.attemptId === p.attemptId), result = fact.processing;
      if (!p || !a?.outcome || !canonicalProposalRecorded(a, p, state.nativeRecords) || p.processing || result.committedRevision !== revision || !["adopted", "pending-review", "rejected", "unchanged"].includes(result.status) || !/^[A-Z][A-Z0-9_]{1,127}$/.test(result.reason)) invalid5();
      if (result.status === "adopted") {
        if (!canonicalProposalSucceeded(a, p) || p.claim.contextGeneration !== generation || p.claim.settingsVersion !== state.rules.version || p.claim.inputSequence !== void 0 && inputs.some((input) => input.receiveSequence > p.claim.inputSequence) || fact.assessment.status !== "adopt" || !fact.version) invalid5();
        active(p.runId);
        const v = fact.version, previous = state.knowledge.versions.filter((v2) => p.value.targetId ? v2.knowledgeId === p.value.targetId : v2.kind === p.value.kind && v2.topic === p.value.topic).at(-1), expected = previous?.version ?? 0;
        const { knowledgeId: ignoredId, version: ignoredVersion, proposalId: ignoredProposal, committedRevision: ignoredRevision, sourceBasis: ignoredBasis, ...value } = v;
        if (v.sourceBasis && (v.sourceBasis.length !== p.value.sources.length || v.sourceBasis.some((basis, index) => JSON.stringify(basis.ref) !== JSON.stringify(p.value.sources[index].ref) || !/^[0-9a-f]{64}$/.test(basis.contentDigest)) || JSON.stringify(v.sourceBasis) !== JSON.stringify(fact.assessment.sources))) invalid5();
        if (previous && previous.kind !== p.value.kind) invalid5();
        if (p.value.expectedVersion !== expected || v.version !== expected + 1 || v.version < 1 || v.knowledgeId !== (previous?.knowledgeId ?? KnowledgeId("knowledge-" + p.proposalId)) || result.knowledgeId !== v.knowledgeId || result.version !== v.version || v.proposalId !== p.proposalId || v.committedRevision !== revision || JSON.stringify(parseKnowledgeProposal(value)) !== JSON.stringify(p.value)) invalid5();
        if (fact.assessment.sources.length !== p.value.sources.length) invalid5();
        if (v.kind === "contact" && !qqBinding && contactFact) return invalid5();
        if (v.kind === "contact" && qqBinding) {
          const intent = contactFact?.intent, binding = qqBinding, delivery = contactFact?.delivery;
          if (!intent || !binding) return invalid5();
          if (intent.state !== "open" || intent.deliveryId !== delivery?.deliveryId || intent.runId !== p.runId || intent.proposalId !== p.proposalId || intent.knowledgeId !== v.knowledgeId || intent.knowledgeVersion !== v.version || intent.committedRevision !== revision || state.contact.intents.some((record) => record.intentId === intent.intentId)) return invalid5();
          if (contactFact.supersedes !== void 0) {
            const prior = state.contact.intents.find((record) => record.intentId === contactFact.supersedes);
            if (!prior || prior.state !== "open" || prior.deliveryId !== void 0 || prior.runId !== p.runId) return invalid5();
          }
          if (delivery) {
            const expected2 = prepareContactDelivery({ intentId: intent.intentId, runId: intent.runId, text: String(v.text) }, binding, state.deliveryRules, revision);
            if (JSON.stringify(delivery) !== JSON.stringify(expected2) || state.deliveries.some((record) => record.deliveryId === delivery.deliveryId)) return invalid5();
          } else if (intent.deliveryId) return invalid5();
        } else if (v.kind !== "contact" && contactFact) return invalid5();
      } else if (result.status === "unchanged") {
        const previous = state.knowledge.versions.findLast((version2) => version2.knowledgeId === p.value.targetId);
        if (!previous || fact.version || result.knowledgeId !== previous.knowledgeId || result.version !== previous.version || p.value.expectedVersion !== previous.version || !unchangedKnowledge(p.value, previous) || !canonicalProposalSucceeded(a, p)) invalid5();
      } else if (fact.version || result.knowledgeId || result.version) invalid5();
      const processing = { ...result, ...result.knowledgeId ? { knowledgeId: KnowledgeId(result.knowledgeId) } : {}, ...result.version !== void 0 ? { version: KnowledgeVersion(result.version) } : {}, committedRevision: revision };
      let autonomy = state.autonomy;
      if (fact.activity) {
        const value = p.value, at = Date.parse(fact.activity.adoptedAt), turn = active(p.runId);
        if (value.kind !== "activity" || !["adopted", "unchanged"].includes(result.status) || !Number.isFinite(at) || at < Date.parse(p.createdAt) || at >= Date.parse(turn.deadline) || fact.activity.restUntil !== (value.decision === "rest" ? new Date(at + value.restMs).toISOString() : void 0)) invalid5();
        autonomy = { ...autonomy, activity: { proposalId: p.proposalId, decision: value.kind === "activity" ? value.decision : "", reason: value.reason, committedRevision: revision }, ...fact.activity.restUntil ? { restUntil: fact.activity.restUntil } : {} };
      }
      const contact = contactFact?.intent ? { intents: [...state.contact.intents.map((record) => record.intentId === contactFact.supersedes ? { ...record, state: "closed", closedReason: "CONTACT_SUPERSEDED", supersededBy: contactFact.intent.intentId } : record), { ...contactFact.intent, ...contactFact.delivery ? { deliveryId: contactFact.delivery.deliveryId } : {} }] } : state.contact;
      this.conversation = { ...state, autonomy, contact, knowledge: { proposals: state.knowledge.proposals.map((record) => record === p ? { ...record, processing } : record), versions: fact.version ? [...state.knowledge.versions, admitProposedKnowledge(fact.version)] : state.knowledge.versions }, deliveries: contactFact?.delivery ? [...state.deliveries, admitDelivery(contactFact.delivery, this.roleId)] : state.deliveries };
      return;
    }
    if (fact.kind === "edit-file-access") {
      if (!validateFileAccess(fact.value) || fact.version !== state.fileAccess.version + 1) invalid5();
      this.conversation = { ...state, fileAccess: { version: fact.version, value: admitFileAccess(fact.value) } };
      return;
    }
    if (fact.kind === "edit-file-rules") {
      if (!validateFileRules(fact.value) || fact.version !== state.fileRules.version + 1) invalid5();
      this.conversation = { ...state, fileRules: { version: fact.version, value: fact.value } };
      return;
    }
    if (fact.kind === "resolve-delivery") {
      const r = fact.resolution, d = state.deliveries.find((d2) => d2.deliveryId === r.deliveryId), a = state.sendAttempts.find((a2) => a2.sendAttemptId === r.sendAttemptId);
      if (!validResolutionDecision(r) || !d || !a || d.sendAttemptId !== a.sendAttemptId || a.deliveryId !== d.deliveryId || !a.observation || !["unknown", "rejected"].includes(d.status) || r.committedRevision !== revision || state.deliveryResolutions.some((x) => x.operationId === r.operationId)) invalid5();
      OperationId(r.operationId);
      if (r.decision === "resend") {
        if (d.qualification === "contact") invalid5();
        const reply = state.replies.find((x) => x.replyId === d.replyId);
        if (!reply || !sameQQTarget(qqBinding, d.target) || state.deliveryResolutions.some((x) => x.deliveryId === d.deliveryId && x.newDeliveryId)) invalid5();
        const expected = prepareRedelivery(reply, d, state.deliveryRules, revision, r.operationId);
        if (!fact.delivery || JSON.stringify(fact.delivery) !== JSON.stringify(expected) || r.newDeliveryId !== expected.deliveryId || state.deliveries.some((x) => x.deliveryId === expected.deliveryId)) invalid5();
      } else if (fact.delivery || r.newDeliveryId) invalid5();
      const resolution = { ...r, operationId: OperationId(r.operationId), deliveryId: DeliveryId(r.deliveryId), sendAttemptId: SendAttemptId(r.sendAttemptId), committedRevision: HomeRevision(r.committedRevision), ...r.newDeliveryId ? { newDeliveryId: DeliveryId(r.newDeliveryId) } : {} };
      this.conversation = { ...state, deliveryResolutions: [...state.deliveryResolutions, resolution], deliveries: fact.delivery ? [...state.deliveries, admitDelivery(fact.delivery, this.roleId)] : state.deliveries };
      return;
    }
    if (fact.kind === "edit-delivery-rules") {
      if (!validateDeliveryRules(fact.value) || fact.version !== state.deliveryRules.version + 1) invalid5();
      const pending = state.deliveries.filter((d) => d.status === "pending");
      const sourceText = (delivery) => {
        if (delivery.qualification === "contact") {
          const intent = delivery.contactIntentId ? state.contact.intents.find((intent2) => intent2.intentId === delivery.contactIntentId) : void 0, record = intent && state.knowledge.versions.find((version2) => version2.knowledgeId === intent.knowledgeId && version2.version === intent.knowledgeVersion);
          if (!record) invalid5();
          return String(record.text);
        }
        const reply = state.replies.find((reply2) => reply2.replyId === delivery.replyId);
        if (!reply) return invalid5();
        return reply.text;
      };
      const changed = pending.filter((d) => previewDelivery(d.qualification, sourceText(d), fact.value.previewCodePoints) !== d.text);
      if (fact.replacements.length !== changed.length) invalid5();
      const replacements = fact.replacements.map((d) => admitDelivery(d, this.roleId));
      for (const original of changed) {
        const next = replacements.find((d) => d.supersedes === original.deliveryId);
        if (!next || next.status !== "pending" || next.qualification !== original.qualification || next.source !== original.source || next.replyId !== original.replyId || next.intentId !== original.intentId || next.contactIntentId !== original.contactIntentId || next.runId !== original.runId || JSON.stringify(next.inputIds) !== JSON.stringify(original.inputIds) || !sameQQTarget(next.target, original.target) || next.rulesVersion !== fact.version || next.text !== previewDelivery(original.qualification, sourceText(original), fact.value.previewCodePoints) || next.retryOf !== original.retryOf || next.resolutionOperationId !== original.resolutionOperationId || next.committedRevision !== revision || state.deliveries.some((d) => d.deliveryId === next.deliveryId) || next.sendAttemptId || next.supersededBy) invalid5();
      }
      this.conversation = { ...state, deliveryRules: { version: fact.version, value: fact.value }, deliveries: [...state.deliveries.map((d) => {
        const next = replacements.find((n) => n.supersedes === d.deliveryId);
        return next ? { ...d, status: "cancelled", supersededBy: next.deliveryId } : d;
      }), ...replacements] };
      return;
    }
    if (fact.kind === "begin-delivery") {
      const a = fact.attempt, found = state.deliveries.find((delivery2) => delivery2.deliveryId === a.deliveryId);
      if (!found) return invalid5();
      const delivery = found;
      const contactStamp = a.contact;
      if (!(delivery.status === "pending" && restoreDeliveryEligible(this.restoreAcceptances.at(-1), delivery, state) && sameQQTarget(qqBinding, delivery.target) && a.rules.version === state.deliveryRules.version && JSON.stringify(a.rules.value) === JSON.stringify(state.deliveryRules.value) && Number.isFinite(Date.parse(a.reservedAt)) && Date.parse(a.deadline) === Date.parse(a.reservedAt) + a.rules.value.sendTimeoutMs && a.committedRevision === revision && !a.observation && !state.sendAttempts.some((x) => x.sendAttemptId === a.sendAttemptId || x.deliveryId === delivery.deliveryId))) return invalid5();
      let sendingIntents = state.contact.intents;
      if (a.source === "user") {
        const reply = state.replies.find((reply2) => reply2.replyId === delivery.replyId);
        if (!reply || delivery.qualification !== "main-reply" || delivery.source !== "user" || contactStamp || delivery.text !== previewReply(reply.text, state.deliveryRules.value.previewCodePoints)) return invalid5();
      } else {
        if (delivery.qualification !== "contact" || delivery.source !== "contact" || !contactStamp || !validContactStamp(contactStamp) || contactStamp.intentId !== delivery.contactIntentId || contactStamp.rulesVersion !== state.contactRules.version || contactStamp.clock.utc !== a.reservedAt) return invalid5();
        if (contactStamp.localMinutes < 0 || contactStamp.localMinutes > 1439) return invalid5();
        const intent = state.contact.intents.find((intent2) => intent2.intentId === contactStamp.intentId);
        if (!intent || intent.state !== "open" || intent.deliveryId !== delivery.deliveryId || intent.runId !== contactStamp.runId || !sameQQTarget(qqBinding, delivery.target)) return invalid5();
        const day = contactStamp.day, at = Date.parse(contactStamp.clock.utc);
        if (!/^day-[0-9a-f]{64}$/.test(day.windowId) || !Number.isFinite(Date.parse(day.startUtc)) || !Number.isFinite(Date.parse(day.endUtc)) || day.dataVersion !== contactStamp.clock.dataVersion || !(Date.parse(day.startUtc) <= at && at < Date.parse(day.endUtc))) return invalid5();
        const record = state.knowledge.versions.find((version2) => version2.knowledgeId === intent.knowledgeId && version2.version === intent.knowledgeVersion);
        if (!record || delivery.text !== previewDelivery("contact", String(record.text), state.deliveryRules.value.previewCodePoints)) return invalid5();
        const blocked = contactBlocked({ rules: state.contactRules, stamp: contactStamp, usage: { dayUsed: state.sendAttempts.filter((attempt2) => attempt2.contact && attempt2.contact.day.windowId === day.windowId).length, roundUsed: contactRoundUsed(state, intent.runId), lastReservedAt: state.sendAttempts.filter((attempt2) => attempt2.contact).at(-1)?.reservedAt ?? null } });
        if (!blocked.ok) return invalid5();
        sendingIntents = state.contact.intents.map((record2) => record2.intentId === intent.intentId ? { ...record2, state: "sending" } : record2);
      }
      const attempt = { ...a, sendAttemptId: SendAttemptId(a.sendAttemptId), deliveryId: DeliveryId(a.deliveryId), committedRevision: HomeRevision(a.committedRevision), rules: { ...a.rules, version: DeliveryRulesVersion(a.rules.version) } };
      this.conversation = { ...state, sendAttempts: [...state.sendAttempts, attempt], deliveries: state.deliveries.map((x) => x === delivery ? { ...delivery, status: "sending", sendAttemptId: attempt.sendAttemptId } : x), contact: { ...state.contact, intents: sendingIntents } };
      return;
    }
    if (fact.kind === "settle-delivery") {
      const attempt = state.sendAttempts.find((a) => a.sendAttemptId === fact.sendAttemptId);
      if (!attempt) return invalid5();
      const delivery = state.deliveries.find((d) => d.deliveryId === attempt.deliveryId);
      if (!delivery || delivery.status !== "sending" || attempt.observation) return invalid5();
      const o = fact.observation;
      if (!["confirmed", "unknown", "rejected"].includes(o.kind)) return invalid5();
      if (o.kind === "confirmed") {
        QQMessageId(o.messageId);
        if (!o.evidence) return invalid5();
      } else if (!/^[A-Z][A-Z0-9_]{1,63}$/.test(o.code)) return invalid5();
      const nextState = o.kind === "confirmed" ? "sent" : o.kind === "unknown" ? "unknown" : "rejected";
      const contact = attempt.contact ? { ...state.contact, intents: state.contact.intents.map((intent) => intent.intentId === attempt.contact.intentId ? { ...intent, state: nextState, ...nextState === "sent" ? {} : { closedReason: o.kind } } : intent) } : state.contact;
      this.conversation = { ...state, sendAttempts: state.sendAttempts.map((x) => x === attempt ? { ...attempt, observation: o } : x), deliveries: state.deliveries.map((x) => x === delivery ? { ...delivery, status: o.kind } : x), contact };
      return;
    }
    if (fact.kind === "edit-web-rules") {
      if (!validateWebRules(fact.value) || fact.version !== state.webRules.version + 1) invalid5();
      this.conversation = { ...state, webRules: { version: fact.version, value: fact.value } };
      return;
    }
    if (fact.kind === "reserve-web-tool") {
      const previous = this.conversation;
      try {
        this.applyConversationFact({ kind: "reserve-attempt", attempt: fact.tool, contextGeneration: fact.contextGeneration, settingsVersion: fact.settingsVersion }, inputs, generation, revision);
        this.applyConversationFact({ kind: "reserve-attempt", attempt: fact.web, contextGeneration: fact.contextGeneration, settingsVersion: fact.settingsVersion }, inputs, generation, revision);
      } catch (error) {
        this.conversation = previous;
        throw error;
      }
      return;
    }
    if (fact.kind === "edit-proposal-rules") {
      if (!validateProposalRules(fact.value) || fact.version !== state.proposalRules.version + 1) invalid5();
      this.conversation = { ...state, proposalRules: { version: fact.version, value: fact.value } };
      return;
    }
    if (fact.kind === "edit-retry-rules") {
      if (!validateRetryRules(fact.value) || fact.version !== state.retryRules.version + 1) invalid5();
      this.conversation = { ...state, retryRules: { version: fact.version, value: fact.value } };
      return;
    }
    if (fact.kind === "edit-read-rules") {
      if (!validateReadRules(fact.value) || fact.version !== state.readRules.version + 1) invalid5();
      this.conversation = { ...state, readRules: { version: fact.version, value: fact.value } };
      return;
    }
    if (fact.kind === "edit-contact-rules") {
      if (!validateContactRules(fact.value) || fact.version !== state.contactRules.version + 1) invalid5();
      this.conversation = { ...state, contactRules: { version: fact.version, value: { ...fact.value, quietHours: { ...fact.value.quietHours } } } };
      return;
    }
    if (fact.kind === "contact-intent") {
      const intent = fact.intent, proposal = state.knowledge.proposals.find((record) => record.proposalId === intent.proposalId);
      const version2 = state.knowledge.versions.find((record) => record.knowledgeId === intent.knowledgeId && record.version === intent.knowledgeVersion);
      if (!proposal || proposal.value.kind !== "contact" || !version2 || version2.proposalId !== proposal.proposalId || version2.kind !== "contact" || intent.state !== "open" || intent.deliveryId !== void 0 || intent.committedRevision !== revision || state.contact.intents.some((record) => record.intentId === intent.intentId) || !Number.isFinite(Date.parse(intent.createdAt)) || active(intent.runId).runId !== intent.runId) return invalid5();
      const delivery = fact.delivery;
      if (delivery) {
        const expected = prepareContactDelivery({ intentId: intent.intentId, runId: intent.runId, text: String(version2.text) }, qqBinding ?? invalid5(), state.deliveryRules, revision);
        if (JSON.stringify(delivery) !== JSON.stringify(expected) || state.deliveries.some((record) => record.deliveryId === delivery.deliveryId)) invalid5();
      }
      this.conversation = { ...state, contact: { intents: [...state.contact.intents, { ...intent, ...delivery ? { deliveryId: delivery.deliveryId } : {} }] }, deliveries: delivery ? [...state.deliveries, admitDelivery(delivery, this.roleId)] : state.deliveries };
      return;
    }
    if (fact.kind === "settle-contact-intent") {
      const intent = state.contact.intents.find((record) => record.intentId === fact.intentId);
      if (!intent || !["sending", "open"].includes(intent.state) || !intent.deliveryId || !["sent", "unknown"].includes(fact.state)) invalid5();
      this.conversation = { ...state, contact: { intents: state.contact.intents.map((record) => record === intent ? { ...record, state: fact.state } : record) } };
      return;
    }
    if (fact.kind === "close-contact-intent") {
      const intent = state.contact.intents.find((record) => record.intentId === fact.intentId);
      if (!intent || ["sent", "unknown"].includes(intent.state) || !/^[A-Z][A-Z0-9_]{1,127}$/.test(fact.reason) || fact.supersededBy !== void 0 && !state.contact.intents.some((record) => record.intentId === fact.supersededBy)) invalid5();
      this.conversation = { ...state, contact: { intents: state.contact.intents.map((record) => record === intent ? { ...record, state: "closed", closedReason: fact.reason, ...fact.supersededBy ? { supersededBy: fact.supersededBy } : {} } : record) } };
      return;
    }
    if (fact.kind === "edit-conversation") {
      if (!validateConversationSettings(fact.value) || fact.version !== state.rules.version + 1) invalid5();
      this.conversation = { ...state, rules: { version: fact.version, value: fact.value } };
      return;
    }
    if (fact.kind === "begin-turn") {
      const t = fact.turn;
      if (!t || t.source !== "user" || t.status !== "running" || t.contextGeneration !== generation || t.settingsVersion !== state.rules.version || !t.inputIds.length || t.inputIds.length > 8 || new Set(t.inputIds).size !== t.inputIds.length || state.turns.some((x) => x.runId === t.runId || x.groupId === t.groupId) || !Number.isFinite(Date.parse(t.startedAt)) || Date.parse(t.deadline) !== Date.parse(t.startedAt) + state.rules.value.windowMs) invalid5();
      const queued = inputs.filter((x) => restoreInputEligible(this.restoreAcceptances.at(-1), x) && runnableInput(x, x.bindingId === t.bindingId && x.bindingVersion === t.bindingVersion) && (x.status === "queued" || x.status === "running"));
      const chosen = t.inputIds.map((id) => inputs.find((x) => x.inputId === id) ?? invalid5());
      if (chosen.some((x, i) => queued[i]?.inputId !== x.inputId || x.bindingId !== t.bindingId || x.bindingVersion !== t.bindingVersion)) invalid5();
      for (const x of chosen) inputs[inputs.indexOf(x)] = { ...x, status: "running", processingUnavailableReason: void 0 };
      this.conversation = { ...state, turns: [...state.turns, t] };
      return;
    }
    if (fact.kind === "reserve-attempt") {
      const a = fact.attempt, t = active(a.runId);
      const claim = a.proposal;
      if (claim && (a.kind !== "tool" || claim.contextGeneration !== generation || claim.settingsVersion !== state.rules.version || claim.sourceBasis?.some((source) => source.currentRun && (source.currentRun.runId !== a.runId || source.currentRun.initialRevision !== claim.initialRevision || source.committedRevision === void 0 || source.committedRevision >= revision)) || claim.proposalRulesVersion !== void 0 && claim.proposalRulesVersion !== state.proposalRules.version || claim.inputSequence !== void 0 && claim.inputSequence !== (t.source === "autonomous" ? t.admittedInputSequence : Math.max(...inputs.filter((input) => t.inputIds.includes(input.inputId)).map((input) => input.receiveSequence))) || (t.source === "autonomous" ? claim.autonomyRulesVersion !== state.autonomy.rules.version : claim.autonomyRulesVersion !== void 0))) invalid5();
      if (a.fileOperation !== void 0 && (a.kind !== "tool" || !a.fileRules || a.fileOperation !== "read" && a.fileOperation !== "write") || a.fileAccessVersion !== void 0 && (a.kind !== "tool" || !a.fileRules || a.fileAccessVersion !== state.fileAccess.version) || a.fileRules && a.fileAccessVersion === void 0 && state.fileAccess.version !== 1 || a.fileRules && (a.kind !== "tool" || !validateFileRules(a.fileRules.value) || a.fileRules.version !== state.fileRules.version || JSON.stringify(a.fileRules.value) !== JSON.stringify(state.fileRules.value)) || a.retryRules && (!["model", "web"].includes(a.kind) || !validateRetryRules(a.retryRules.value) || a.retryRules.version !== state.retryRules.version || JSON.stringify(a.retryRules.value) !== JSON.stringify(state.retryRules.value)) || a.modelOperation?.ordinal === 1 && state.retryRules.value.maxAutomaticRetries < 1 || !validModelOperation(a, state.attempts) || !validWebAttempt(a, state.attempts) || !["model", "tool", "web"].includes(a.kind) || a.source !== t.source || a.outcome || a.observation || a.enteredAt || a.readRules && (a.kind !== "tool" || !validateReadRules(a.readRules.value) || a.readRules.version !== state.readRules.version || JSON.stringify(a.readRules.value) !== JSON.stringify(state.readRules.value)) || state.attempts.some((x) => x.attemptId === a.attemptId) || fact.contextGeneration !== generation || fact.settingsVersion !== state.rules.version || t.contextGeneration !== generation || !Number.isFinite(Date.parse(a.reservedAt)) || Date.parse(a.reservedAt) >= Date.parse(t.deadline) || state.attempts.filter((x) => x.runId === t.runId && x.kind === a.kind).length >= (a.kind === "model" ? (t.source === "autonomous" ? state.autonomy.rules.value : state.rules.value).modelLimit : a.kind === "web" ? (t.source === "autonomous" ? state.autonomy.rules.value : state.rules.value).webLimit : (t.source === "autonomous" ? state.autonomy.rules.value : state.rules.value).toolLimit)) invalid5();
      if (a.webTool && (a.webTool.rules.version !== state.webRules.version || JSON.stringify(a.webTool.rules.value) !== JSON.stringify(state.webRules.value) || Date.parse(a.webTool.deadline) > Date.parse(t.deadline) || Date.parse(a.webTool.deadline) !== Math.min(Date.parse(t.deadline), Date.parse(a.reservedAt) + a.webTool.rules.value.toolTimeoutMs))) invalid5();
      const autonomy = t.source === "autonomous" ? a.autonomy ? appendWindow(state.autonomy, a.autonomy, a.kind) : invalid5() : state.autonomy;
      if (t.source === "autonomous" && (a.windowId !== a.autonomy.day.windowId || a.autonomy.snapshotVersion === 1 && a.reservedAt !== a.autonomy.clock.utc) || t.source === "user" && (a.autonomy || a.windowId)) invalid5();
      this.conversation = { ...state, autonomy, attempts: [...state.attempts, a] };
      return;
    }
    if (fact.kind === "capture-material") {
      const material = fact.material, a = state.attempts.find((x) => x.attemptId === material.attemptId) ?? invalid5();
      active(a.runId);
      if (a.kind !== "tool" || !a.observation || a.outcome || !["sdk-local-spill", "role-read-result", "role-file-result", "role-web-result"].includes(material.source) || typeof material.text !== "string" || !Number.isSafeInteger(material.bytes) || material.bytes !== Buffer.byteLength(material.text, "utf8") || digest(Buffer.from(material.text, "utf8")) !== material.digest || state.attempts.some((x) => x.materials?.some((m) => m.materialId === material.materialId))) invalid5();
      this.conversation = { ...state, attempts: state.attempts.map((x) => x === a ? { ...a, materials: [...a.materials ?? [], material] } : x) };
      return;
    }
    if (fact.kind === "observe-tool") {
      const a = state.attempts.find((x) => x.attemptId === fact.attemptId) ?? invalid5();
      active(a.runId);
      if (a.kind !== "tool" || !a.enteredAt || a.outcome || a.observation || !Number.isFinite(Date.parse(fact.observation.observedAt)) || !["returned", "threw"].includes(fact.observation.kind)) invalid5();
      this.conversation = { ...state, attempts: state.attempts.map((x) => x === a ? { ...a, observation: fact.observation } : x) };
      return;
    }
    if (fact.kind === "enter-attempt" || fact.kind === "record-attempt") {
      const a = state.attempts.find((x) => x.attemptId === fact.attemptId) ?? invalid5();
      active(a.runId);
      if (fact.kind === "enter-attempt") {
        if (a.enteredAt || a.outcome || a.fileRules && a.fileRules.version !== state.fileRules.version || !Number.isFinite(Date.parse(fact.now))) invalid5();
        this.conversation = { ...state, attempts: state.attempts.map((x) => x === a ? { ...a, enteredAt: fact.now } : x) };
      } else {
        if (fact.outcome.modelFailure && !validateModelFailure(fact.outcome.modelFailure) || a.outcome || !["completed", "failed", "cancelled", "not-dispatched"].includes(fact.outcome.kind) || !a.enteredAt && fact.outcome.kind !== "not-dispatched") invalid5();
        this.conversation = { ...state, attempts: state.attempts.map((x) => x === a ? { ...a, outcome: fact.outcome } : x) };
      }
      return;
    }
    if (fact.kind === "refresh-turn-context") {
      const t = active(fact.runId);
      if (t.contextGeneration !== fact.previousGeneration || fact.nextGeneration !== generation || fact.nextGeneration === fact.previousGeneration || state.attempts.some((x) => x.runId === t.runId && !x.outcome)) invalid5();
      this.conversation = { ...state, turns: state.turns.map((x) => x === t ? { ...t, contextGeneration: fact.nextGeneration } : x) };
      return;
    }
    if (fact.kind === "native-record") {
      active(fact.record.runId);
      if (!["tools-result", "native-session", "host-denial"].includes(fact.record.provenance) || state.nativeRecords.some((x) => x.runId === fact.record.runId && x.nativeId === fact.record.nativeId && x.provenance === fact.record.provenance)) invalid5();
      this.conversation = { ...state, nativeRecords: [...state.nativeRecords, fact.record] };
      return;
    }
    if (fact.kind === "finish-turn") {
      const t = active(fact.runId), first = inputs.find((x) => x.inputId === t.inputIds[0]);
      const closesRevokedQQ = first?.channel === "qq" && (!qqBinding || qqBinding.bindingId !== t.bindingId || qqBinding.version !== t.bindingVersion) && fact.outcome.kind === "failure" && fact.outcome.reason === "QQ_BINDING_CHANGED";
      if (fact.contextGeneration !== t.contextGeneration || !closesRevokedQQ && (fact.contextGeneration !== generation || t.contextGeneration !== generation) || state.attempts.some((x) => x.runId === t.runId && !x.outcome) || !["reply", "no-reply", "internal", "failure"].includes(fact.outcome.kind)) invalid5();
      if (fact.outcome.kind === "reply" && (!fact.replyId || typeof fact.outcome.text !== "string" || !fact.outcome.text.length)) invalid5();
      if (fact.outcome.kind !== "reply" && (!fact.outcome.reason || fact.replyId)) invalid5();
      const external = first?.channel === "qq" && fact.outcome.kind === "reply";
      if (external) {
        const expected = prepareDelivery({ replyId: fact.replyId, intentId: IntentId("intent-" + t.runId), runId: t.runId, inputIds: t.inputIds, text: fact.outcome.kind === "reply" ? fact.outcome.text : "" }, qqBinding, state.deliveryRules, revision);
        if (!qqBinding || qqBinding.bindingId !== t.bindingId || qqBinding.version !== t.bindingVersion || JSON.stringify(fact.delivery) !== JSON.stringify(expected)) invalid5();
      } else if (fact.delivery) invalid5();
      for (const id of t.inputIds) {
        const i = inputs.findIndex((x) => x.inputId === id);
        if (i < 0 || inputs[i].status !== "running") invalid5();
        inputs[i] = { ...inputs[i], status: "resolved" };
      }
      this.conversation = { ...state, deliveries: fact.delivery ? [...state.deliveries, admitDelivery(fact.delivery, this.roleId)] : state.deliveries, turns: state.turns.map((x) => x === t ? { ...t, status: "finished", outcome: fact.outcome, ...fact.replyId ? { replyId: fact.replyId } : {} } : x), replies: fact.outcome.kind === "reply" ? [...state.replies, { replyId: fact.replyId, experienceId: ExperienceId("experience-" + t.runId), intentId: IntentId("intent-" + t.runId), runId: t.runId, inputIds: t.inputIds, bindingId: t.bindingId, bindingVersion: t.bindingVersion, text: fact.outcome.text, display: "queryable", committedRevision: revision }] : state.replies };
      return;
    }
    invalid5();
  }
  async conversationCommit(operationId, business, fact, expectedRevision) {
    op(operationId);
    const fp = fingerprint(business);
    await this.assertWritable();
    if (this.uncertain) {
      if (this.uncertain !== operationId) fail7("IO_UNCERTAIN");
      await this.load();
      await syncDir3(join4(this.storagePath, "commits"));
      await this.syncHead(operationId);
      this.uncertain = null;
    }
    const old = this.commits.find((x) => x.operationId === operationId);
    if (old) {
      if (old.kind !== fact.kind || old.fingerprint !== fp) fail7("OPERATION_CONFLICT");
      return this.receipt(old);
    }
    if (expectedRevision !== void 0 && expectedRevision !== this.revision) fail7("REVISION_CONFLICT");
    const previous = this.conversation;
    try {
      this.applyConversationFact(fact, structuredClone([...this.snapshot.inputs]), this.snapshot.contextGeneration, HomeRevision(this.revision + 1), this.snapshot.qqBinding);
    } catch (e) {
      this.conversation = previous;
      throw e;
    }
    this.conversation = previous;
    const payload = await this.putManaged(fact);
    return this.append(fact.kind, operationId, fp, { payload });
  }
  readDeliveryRules() {
    return this.run(async () => structuredClone({ ...this.conversation.deliveryRules, revision: this.revision }));
  }
  readContactRules() {
    return this.run(async () => structuredClone({ ...this.conversation.contactRules, revision: this.revision }));
  }
  /**
   * The only atomic frequency/cooldown reservation. The reply branch is unchanged; the contact branch
   * re-checks user priority prerequisites (done by the Runtime), binding, intent, rest/pause, quiet
   * hours, daily/round limits and cooldown in the same commit as the attempt record.
   */
  beginDelivery(request) {
    return this.run(async () => {
      const { operationId, expectedRevision, expectedRulesVersion, now, contact, ...business } = request;
      const prior = this.commits.find((c) => c.operationId === operationId);
      if (!prior && expectedRulesVersion !== this.conversation.deliveryRules.version) fail7("DELIVERY_RULES_VERSION_CONFLICT");
      if (!prior) {
        const delivery = this.conversation.deliveries.find((d) => d.deliveryId === request.deliveryId);
        if (!delivery || delivery.status !== "pending") fail7("DELIVERY_NOT_PENDING");
        if (!restoreDeliveryEligible(this.restoreAcceptances.at(-1), delivery, this.conversation)) fail7("RESTORE_DELIVERY_REVIEW_REQUIRED");
        if (!sameQQTarget(this.snapshot.qqBinding, delivery.target)) fail7("QQ_BINDING_CHANGED");
      }
      let attempt;
      if (contact) {
        if (!validContactStamp(contact.stamp) || contact.stamp.rulesVersion !== this.conversation.contactRules.version) fail7("CONTACT_RULES_CHANGED");
        if (!prior) {
          const delivery = this.conversation.deliveries.find((d) => d.deliveryId === request.deliveryId);
          if (delivery.qualification !== "contact" || delivery.contactIntentId !== contact.intentId) fail7("DELIVERY_NOT_PENDING");
          const intent = this.conversation.contact.intents.find((intent2) => intent2.intentId === contact.intentId);
          if (!intent || intent.state !== "open" || intent.deliveryId !== delivery.deliveryId) fail7("CONTACT_INTENT_CLOSED");
          const autonomy = this.conversation.autonomy;
          if (autonomy.pausedAt) fail7("AUTONOMY_PAUSED");
          if (autonomy.restUntil && Date.parse(contact.stamp.clock.utc) < Date.parse(autonomy.restUntil)) fail7("AUTONOMOUS_REST");
          const problem = clockProblem(autonomy, contact.stamp.clock);
          if (problem) fail7(problem);
          const blocked = contactBlocked({ rules: this.conversation.contactRules, stamp: contact.stamp, usage: { dayUsed: this.conversation.sendAttempts.filter((attempt2) => attempt2.contact && attempt2.contact.day.windowId === contact.stamp.day.windowId).length, roundUsed: contactRoundUsed(this.conversation, intent.runId), lastReservedAt: this.conversation.sendAttempts.filter((attempt2) => attempt2.contact).at(-1)?.reservedAt ?? null } });
          if (!blocked.ok) fail7(blocked.code);
          attempt = { sendAttemptId: request.sendAttemptId, deliveryId: request.deliveryId, source: "contact", reservedAt: now, deadline: new Date(Date.parse(now) + this.conversation.deliveryRules.value.sendTimeoutMs).toISOString(), rules: structuredClone(this.conversation.deliveryRules), committedRevision: HomeRevision(this.revision + 1), contact: { snapshotVersion: 1, intentId: contact.intentId, runId: intent.runId, day: structuredClone(contact.stamp.day), clock: structuredClone(contact.stamp.clock), localMinutes: contact.stamp.localMinutes, rulesVersion: contact.stamp.rulesVersion } };
        } else {
          const saved = structuredClone(this.conversation.sendAttempts.find((a) => a.sendAttemptId === request.sendAttemptId));
          attempt = saved;
        }
      } else {
        attempt = { sendAttemptId: request.sendAttemptId, deliveryId: request.deliveryId, source: "user", reservedAt: now, deadline: new Date(Date.parse(now) + this.conversation.deliveryRules.value.sendTimeoutMs).toISOString(), rules: structuredClone(this.conversation.deliveryRules), committedRevision: HomeRevision(this.revision + 1) };
      }
      await this.conversationCommit(operationId, { kind: "begin-delivery", ...business, ...contact ? { contact: { intentId: contact.intentId } } : {} }, { kind: "begin-delivery", attempt }, expectedRevision);
      return structuredClone(this.conversation.sendAttempts.find((a) => a.sendAttemptId === request.sendAttemptId));
    });
  }
  /** Owner/remote close of a contact intent: archives the decision, never sends. */
  closeContactIntent(request) {
    return this.run(async () => {
      const fact = { kind: "close-contact-intent", intentId: request.intentId, reason: request.reason, ...request.supersededBy ? { supersededBy: request.supersededBy } : {} };
      await this.conversationCommit(request.operationId, { kind: "close-contact-intent", intentId: request.intentId, reason: request.reason, ...request.supersededBy ? { supersededBy: request.supersededBy } : {} }, fact, request.expectedRevision);
    });
  }
  settleDelivery(request) {
    return this.run(async () => {
      const fact = { kind: "settle-delivery", sendAttemptId: request.sendAttemptId, observation: structuredClone(request.observation) };
      await this.conversationCommit(request.operationId, { ...fact, observation: JSON.stringify(fact.observation) }, fact);
    });
  }
  readWebRules() {
    return this.run(async () => structuredClone({ ...this.conversation.webRules, revision: this.revision }));
  }
  readRetryRules() {
    return this.run(async () => structuredClone({ ...this.conversation.retryRules, revision: this.revision }));
  }
  initializeFileAreas(areas) {
    return this.run(async () => {
      await this.assertWritable();
      if (!Array.isArray(areas) || areas.some((area) => area !== "works" && area !== "journal") || new Set(areas).size !== areas.length) fail7("INVALID_FILE_AREA");
      for (const area of areas) {
        const target = join4(this.path, area);
        await this.io.barrier?.("before-file-area-create", { operationId: OperationId("initialize-file-areas-" + this.roleId), revision: this.revision });
        try {
          await mkdir3(target, { mode: 448 });
        } catch (error) {
          if (!error || typeof error !== "object" || !("code" in error) || error.code !== "EEXIST") fail7("FILE_AREA_INITIALIZATION_FAILED");
        }
        await directory2(target);
      }
      await syncDir3(this.path);
    });
  }
  readFileAccess() {
    return this.run(async () => structuredClone({ ...this.conversation.fileAccess, revision: this.revision }));
  }
  readFileRules() {
    return this.run(async () => structuredClone({ ...this.conversation.fileRules, revision: this.revision }));
  }
  readReadRules() {
    return this.run(async () => structuredClone({ ...this.conversation.readRules, revision: this.revision }));
  }
  readConversation() {
    return this.run(async () => structuredClone({ ...this.conversation, revision: this.revision }));
  }
  readCurrentToolSource(request) {
    return this.run(() => this.currentToolSource(request));
  }
  async currentToolSource(request) {
    if (request.roleId !== this.roleId) fail7("CONTEXT_ROLE_CHANGED");
    if (this.fault || this.uncertain || this.pendingOwnerChanges || request.contextGeneration !== this.snapshot.contextGeneration) fail7("CONTEXT_SNAPSHOT_STALE");
    const turn = this.conversation.turns.find((turn2) => turn2.runId === request.runId && turn2.status === "running"), attempt = this.conversation.attempts.find((attempt2) => attempt2.attemptId === request.attemptId);
    if (!turn || turn.contextGeneration !== request.contextGeneration || !contextBindingAllowed(this.snapshot, turn.bindingId, turn.bindingVersion)) return fail7("CONTEXT_RUN_NOT_ACTIVE");
    if (!attempt || attempt.kind !== "tool" || attempt.runId !== turn.runId || !attempt.enteredAt || !attempt.observation || !attempt.outcome) return fail7("CURRENT_TOOL_SOURCE_NOT_READY");
    const canonical = confirmedToolCanonical(attempt, this.conversation), result = contextField(contextField(attempt.outcome.data, "result"), "final");
    if (!canonical || contextField(contextField(result, "value"), "toolAttemptId") !== attempt.attemptId || attempt.observation.kind !== "returned" || contextField(attempt.observation.value, "toolAttemptId") !== attempt.attemptId) return fail7("CURRENT_TOOL_CANONICAL_REQUIRED");
    let reserved, outcome, final, generation;
    for (const commit of this.commits.toReversed()) {
      if (commit.revision <= (this.storage?.baseRevision ?? 0)) break;
      if (!["reserve-attempt", "reserve-web-tool", "record-attempt", "native-record"].includes(commit.kind)) continue;
      const fact = JSON.parse(await this.managedText(commit.data.payload)), kind = contextField(fact, "kind");
      const candidate = kind === "reserve-web-tool" ? contextField(fact, "tool") : contextField(fact, "attempt");
      if (!reserved && (kind === "reserve-attempt" || kind === "reserve-web-tool") && contextField(candidate, "attemptId") === attempt.attemptId) {
        reserved = commit.revision;
        generation = contextField(fact, "contextGeneration");
      }
      if (!outcome && kind === "record-attempt" && contextField(fact, "attemptId") === attempt.attemptId) outcome = commit.revision;
      if (!final && kind === "native-record" && contextField(contextField(fact, "record"), "nativeId") === canonical.nativeId && contextField(contextField(fact, "record"), "runId") === turn.runId) final = commit.revision;
      if (reserved && outcome && final) break;
    }
    if (!reserved || !outcome || !final || reserved <= HomeRevision(request.initialRevision) || generation !== request.contextGeneration) return fail7("CURRENT_TOOL_SOURCE_STALE");
    const reader = createContextSnapshotReader(this.snapshot, this.conversation, { purpose: request.purpose, runId: request.runId }, async () => {
    });
    try {
      const source = await reader.read({ kind: "tool", id: attempt.attemptId });
      if (!("toolName" in source)) return fail7("CURRENT_TOOL_SOURCE_NOT_READY");
      return { source: { ...source, committedRevision: HomeRevision(Math.max(outcome, final)), currentRun: { runId: turn.runId, initialRevision: HomeRevision(request.initialRevision) } }, observedRevision: this.revision };
    } finally {
      reader.revoke();
    }
  }
  readProposalRules() {
    return this.run(async () => structuredClone({ ...this.conversation.proposalRules, revision: this.revision }));
  }
  readKnowledge() {
    return this.run(async () => structuredClone({ ...this.conversation.knowledge, revision: this.revision }));
  }
  saveProposal(request) {
    return this.run(async () => {
      const value = parseKnowledgeProposal(request.value), id = ProposalId("proposal-" + AttemptId(request.attemptId)), old = this.conversation.knowledge.proposals.find((p) => p.proposalId === id);
      if (old) {
        if (old.operationId !== request.operationId || !old.cleanup && JSON.stringify(old.value) !== JSON.stringify(value)) fail7("OPERATION_CONFLICT");
        await this.conversationCommit(request.operationId, { kind: "save-proposal", attemptId: request.attemptId, value }, { kind: "save-proposal", proposal: old });
        return structuredClone(this.conversation.knowledge.proposals.find((p) => p.proposalId === id));
      }
      const attempt = this.conversation.attempts.find((a) => a.attemptId === request.attemptId);
      if (!attempt?.proposal) return fail7("PROPOSAL_PERMISSION_REQUIRED");
      const proposal = { proposalId: id, operationId: OperationId(request.operationId), runId: attempt.runId, attemptId: attempt.attemptId, claim: proposalClaim(attempt.proposal), value, createdAt: request.now, committedRevision: HomeRevision(this.revision + 1) };
      await this.conversationCommit(request.operationId, { kind: "save-proposal", attemptId: request.attemptId, value }, { kind: "save-proposal", proposal });
      return structuredClone(this.conversation.knowledge.proposals.find((p) => p.proposalId === id));
    });
  }
  processProposal(request) {
    return this.run(async () => {
      const p = this.conversation.knowledge.proposals.find((p2) => p2.proposalId === request.proposalId);
      if (!p) return fail7("PROPOSAL_NOT_FOUND");
      if (p.processing) {
        if (!this.commits.some((commit) => commit.operationId === request.operationId)) {
          await this.assertWritable();
          if (this.uncertain) fail7("IO_UNCERTAIN");
          return structuredClone(p);
        }
        const version3 = this.conversation.knowledge.versions.find((v) => v.proposalId === p.proposalId && v.version === p.processing?.version);
        await this.conversationCommit(request.operationId, { kind: "process-proposal", proposalId: p.proposalId, assessment: request.assessment }, { kind: "process-proposal", proposalId: p.proposalId, assessment: request.assessment, processing: p.processing, ...version3 ? { version: version3 } : {} });
        return structuredClone(this.conversation.knowledge.proposals.find((record) => record.proposalId === p.proposalId));
      }
      const a = this.conversation.attempts.find((a2) => a2.attemptId === p.attemptId);
      if (!a?.outcome) return fail7("PROPOSAL_FINAL_PENDING");
      const previous = this.conversation.knowledge.versions.filter((v) => p.value.targetId ? v.knowledgeId === p.value.targetId : v.kind === p.value.kind && v.topic === p.value.topic).at(-1);
      const contactIntent = p.value.kind === "contact" ? p.value.intentId : void 0;
      let checked = request.assessment;
      if (checked.status === "adopt") {
        try {
          const reader = createContextSnapshotReader(this.snapshot, this.conversation, { purpose: "daily", runId: p.runId }, async () => {
          }), sources = [];
          for (const source of p.value.sources) {
            const basis = request.assessment.sources.find((basis2) => JSON.stringify(basis2.ref) === JSON.stringify(source.ref));
            if (source.ref.kind === "tool" && basis?.currentRun) {
              if (basis.currentRun.runId !== p.runId || basis.currentRun.initialRevision !== p.claim.initialRevision) throw new HomeError("CURRENT_TOOL_SOURCE_STALE");
              const turn = this.conversation.turns.find((turn2) => turn2.runId === p.runId);
              sources.push((await this.currentToolSource({ roleId: this.roleId, runId: p.runId, contextGeneration: p.claim.contextGeneration, initialRevision: basis.currentRun.initialRevision, attemptId: source.ref.id, purpose: turn.inputIds.some((id) => this.snapshot.inputs.some((input) => input.inputId === id && input.contextPurpose === "history" && input.channel === void 0)) ? "history" : "daily" })).source);
            } else sources.push(await reader.read(source.ref));
          }
          checked = assessKnowledgeProposal(p.value, sources, this.snapshot.inputs);
        } catch {
          checked = { status: "reject", reason: "PROPOSAL_SOURCE_UNAVAILABLE", sources: [] };
        }
      }
      let status = checked.status === "adopt" ? "adopted" : checked.status === "reject" ? "rejected" : "pending-review", reason = checked.reason;
      if (!canonicalProposalSucceeded(a, p)) {
        status = "rejected";
        reason = "CANONICAL_NOT_SUCCESSFUL";
      } else if (p.claim.contextGeneration !== this.snapshot.contextGeneration || p.claim.settingsVersion !== this.conversation.rules.version) {
        status = "rejected";
        reason = "PROPOSAL_CONTEXT_STALE";
      } else if (p.claim.autonomyRulesVersion !== void 0 && this.conversation.autonomy.clockBlocked) {
        status = "rejected";
        reason = "AUTONOMOUS_CLOCK_BLOCKED";
      } else if (p.claim.autonomyRulesVersion !== void 0 && p.claim.autonomyRulesVersion !== this.conversation.autonomy.rules.version) {
        status = "rejected";
        reason = "AUTONOMY_RULES_CHANGED";
      } else if (p.claim.proposalRulesVersion !== this.conversation.proposalRules.version) {
        status = "rejected";
        reason = "PROPOSAL_RULES_STALE";
      } else if (p.value.kind === "activity" && p.value.decision === "rest" && p.value.restMs > this.conversation.proposalRules.value.maxRestSuggestionMs) {
        status = "rejected";
        reason = "REST_SUGGESTION_LIMIT";
      } else if (contactIntent && !this.conversation.replies.some((reply) => reply.intentId === contactIntent)) {
        status = "rejected";
        reason = "CONTACT_INTENT_NOT_FOUND";
      } else if (p.claim.inputSequence === void 0 || this.snapshot.inputs.some((input) => input.receiveSequence > p.claim.inputSequence)) {
        status = "rejected";
        reason = "PROPOSAL_NEW_INPUT";
      } else if (p.value.expectedVersion !== (previous?.version ?? 0)) {
        status = "rejected";
        reason = "KNOWLEDGE_VERSION_CONFLICT";
      } else if (previous && previous.kind !== p.value.kind) {
        status = "rejected";
        reason = "KNOWLEDGE_KIND_CONFLICT";
      }
      let supersedes;
      if (status === "adopted" && p.value.kind === "contact") {
        const open4 = this.conversation.contact.intents.find((intent2) => intent2.state === "open" && intent2.deliveryId === void 0 && intent2.runId === p.runId);
        if (open4) supersedes = open4.intentId;
      }
      if (status === "adopted" && ownerActionSourceReused(p.value, this.conversation.knowledge, createContextLineage(this.snapshot, this.conversation).describe)) {
        status = "pending-review";
        reason = "OWNER_ACTION_REQUIRES_NEW_EVIDENCE";
      }
      if (status === "adopted" && correctedSourceReused(p.value, this.conversation.knowledge, createContextLineage(this.snapshot, this.conversation).describe)) {
        status = "rejected";
        reason = "CORRECTED_SOURCE_REUSE";
      } else if (status === "adopted" && previous && unchangedKnowledge(p.value, previous)) {
        status = "unchanged";
        reason = "KNOWLEDGE_UNCHANGED";
      }
      const revision = HomeRevision(this.revision + 1), version2 = status === "adopted" ? { ...p.value, sourceBasis: structuredClone(checked.sources), knowledgeId: previous?.knowledgeId ?? KnowledgeId("knowledge-" + p.proposalId), version: KnowledgeVersion((previous?.version ?? 0) + 1), proposalId: p.proposalId, committedRevision: revision } : void 0, processing = { status, reason, committedRevision: revision, ...version2 ? { knowledgeId: version2.knowledgeId, version: version2.version } : status === "unchanged" && previous ? { knowledgeId: previous.knowledgeId, version: previous.version } : {} };
      const activity = (status === "adopted" || status === "unchanged") && p.value.kind === "activity" && request.now !== void 0 ? { adoptedAt: request.now, ...p.value.decision === "rest" ? { restUntil: new Date(Date.parse(request.now) + p.value.restMs).toISOString() } : {} } : void 0;
      const binding = this.snapshot.qqBinding, intent = version2 && version2.kind === "contact" && binding ? { intentId: ContactIntentId("contact-intent-" + version2.knowledgeId.slice("knowledge-".length) + "-" + version2.version), runId: p.runId, proposalId: p.proposalId, knowledgeId: version2.knowledgeId, knowledgeVersion: version2.version, createdAt: request.now ?? (/* @__PURE__ */ new Date()).toISOString(), committedRevision: revision, state: "open" } : void 0;
      const contactDelivery = version2 && version2.kind === "contact" && binding && intent ? prepareContactDelivery({ intentId: intent.intentId, runId: intent.runId, text: String(version2.text) }, binding, this.conversation.deliveryRules, revision) : void 0;
      const arrivedIntent = intent && contactDelivery ? { ...intent, deliveryId: contactDelivery.deliveryId } : intent;
      await this.conversationCommit(request.operationId, { kind: "process-proposal", proposalId: p.proposalId, assessment: request.assessment }, { kind: "process-proposal", proposalId: p.proposalId, assessment: request.assessment, processing, ...version2 ? { version: version2 } : {}, ...activity ? { activity } : {}, ...arrivedIntent ? { contact: { intent: arrivedIntent, ...contactDelivery ? { delivery: contactDelivery } : {}, ...supersedes ? { supersedes } : {} } } : {} });
      return structuredClone(this.conversation.knowledge.proposals.find((record) => record.proposalId === p.proposalId));
    });
  }
  readQQHistory() {
    return this.run(async () => structuredClone({ ...this.qqHistory, revision: this.revision }));
  }
  async qqHistoryCommit(operationId, fact) {
    op(operationId);
    const fp = fingerprint(qqHistoryBusiness(fact));
    await this.assertWritable();
    if (this.uncertain) {
      if (this.uncertain !== operationId) fail7("IO_UNCERTAIN");
      await this.load();
      await syncDir3(join4(this.storagePath, "commits"));
      await this.syncHead(operationId);
      this.uncertain = null;
    }
    const old = this.commits.find((c) => c.operationId === operationId);
    if (old) {
      if (old.kind !== "qq-history" || old.fingerprint !== fp) fail7("OPERATION_CONFLICT");
      return;
    }
    applyQQHistoryFact(this.qqHistory, fact, { roleId: this.roleId, binding: this.snapshot.qqBinding, inputs: this.snapshot.inputs });
    await this.append("qq-history", operationId, fp, { payload: await this.putManaged(fact) });
  }
  beginQQHistory(request) {
    return this.run(async () => {
      op(request.operationId);
      if (!validQQHistoryPolicy(request.policy) || !Number.isFinite(Date.parse(request.now))) fail7("INVALID_QQ_HISTORY_POLICY");
      await this.assertWritable();
      if (this.uncertain && this.uncertain !== request.operationId) fail7("IO_UNCERTAIN");
      const prior = this.qqHistory.queries.find((q) => q.operationId === request.operationId);
      if (prior) {
        await this.qqHistoryCommit(request.operationId, { action: "begin", query: prior });
        return structuredClone(this.qqHistory.queries.find((q) => q.queryId === prior.queryId));
      }
      const binding = this.snapshot.qqBinding;
      if (!binding) fail7("QQ_NOT_BOUND");
      if (this.qqHistory.queries.some((q) => q.phase === "running")) fail7("QQ_HISTORY_QUERY_RUNNING");
      if (request.expectedBindingVersion !== void 0 && request.expectedBindingVersion !== binding.version) fail7("QQ_BINDING_CHANGED");
      const last = this.qqHistory.queries.at(-1);
      if (last && Date.parse(request.now) < Date.parse(last.startedAt) + request.policy.cooldownMs) fail7("QQ_HISTORY_COOLDOWN");
      const input = this.snapshot.inputs.filter((i) => (request.anchorInputId === void 0 || i.inputId === request.anchorInputId) && i.channel === "qq" && i.bindingId === binding.bindingId && i.bindingVersion === binding.version && i.qqSource).at(-1);
      if (request.anchorInputId !== void 0 && !input) fail7("QQ_HISTORY_ANCHOR_CHANGED");
      if (request.trigger === "reconnect" && !input) fail7("QQ_HISTORY_INITIAL_BINDING");
      const query = { queryId: QQHistoryQueryId("history-" + historyDigest(request.operationId)), operationId: request.operationId, trigger: request.trigger, target: structuredClone(binding), policy: structuredClone(request.policy), startedAt: request.now, anchor: input ? { inputId: input.inputId, messageId: input.qqSource.messageId, text: input.text } : null, phase: "running", gapReasons: [], requests: [], candidates: [] };
      await this.qqHistoryCommit(request.operationId, { action: "begin", query });
      return structuredClone(this.qqHistory.queries.find((q) => q.queryId === query.queryId));
    });
  }
  beginQQHistorySelection(request) {
    return this.run(async () => {
      op(request.operationId);
      const prior = this.qqHistory.selections.find((s) => s.operationId === request.operationId);
      const selection = { operationId: request.operationId, queryId: request.queryId, candidateIds: [...request.candidateIds], acknowledgedGap: request.acknowledgedGap, startedAt: prior?.startedAt ?? request.now, phase: "pending", receipts: [] };
      if (prior && this.uncertain && this.uncertain !== request.operationId) {
        const original = this.commits.find((c) => c.operationId === request.operationId);
        if (original?.kind !== "qq-history" || original.fingerprint !== fingerprint(qqHistoryBusiness({ action: "select", selection }))) fail7("OPERATION_CONFLICT");
        return structuredClone(prior);
      }
      if (!prior) {
        if (this.uncertain && this.uncertain !== request.operationId) fail7("IO_UNCERTAIN");
        const query = this.qqHistory.queries.find((q) => q.queryId === request.queryId);
        if (!query) fail7("QQ_HISTORY_QUERY_NOT_FOUND");
        if (!sameQQTarget(this.snapshot.qqBinding, query.target)) fail7("QQ_BINDING_CHANGED");
        if (this.commits.some((c) => c.operationId === request.operationId)) fail7("OPERATION_CONFLICT");
        if (this.revision !== request.expectedRevision) fail7("REVISION_CONFLICT");
        if (this.snapshot.qqBinding?.version !== request.expectedBindingVersion) fail7("QQ_BINDING_CHANGED");
      }
      await this.qqHistoryCommit(request.operationId, { action: "select", selection });
      return structuredClone(this.qqHistory.selections.find((s) => s.operationId === request.operationId));
    });
  }
  recordQQHistorySelection(request) {
    return this.run(() => this.qqHistoryCommit(request.operationId, { action: "selection-receipt", selectionOperationId: request.selectionOperationId, candidateId: request.candidateId, receipt: structuredClone(request.receipt) }));
  }
  finishQQHistorySelection(request) {
    return this.run(() => this.qqHistoryCommit(request.operationId, { action: "selection-finish", selectionOperationId: request.selectionOperationId }));
  }
  reserveQQHistoryPage(request) {
    return this.run(() => this.qqHistoryCommit(request.operationId, { action: "reserve", queryId: request.queryId, request: structuredClone(request.page) }));
  }
  enterQQHistoryPage(request) {
    return this.run(() => this.qqHistoryCommit(request.operationId, { action: "enter", queryId: request.queryId, requestId: request.requestId, now: request.now }));
  }
  observeQQHistoryPage(request) {
    return this.run(() => this.qqHistoryCommit(request.operationId, { action: "observe", queryId: request.queryId, requestId: request.requestId, outcome: structuredClone(request.outcome) }));
  }
  finishQQHistory(request) {
    return this.run(() => this.qqHistoryCommit(request.operationId, { action: "finish", queryId: request.queryId, reason: request.reason }));
  }
  readAutonomy() {
    return this.run(async () => structuredClone({ ...this.conversation.autonomy, revision: this.revision }));
  }
  /** Cross-window attribution comes from the same attempt ledger; it never invents a second window record. */
  readAutonomyAttribution(request) {
    return this.run(async () => {
      const runs = this.conversation.turns.filter((turn) => turn.source === "autonomous" && (!request.runId || turn.runId === request.runId));
      if (request.runId && !runs.length) fail7("ACTIVITY_NOT_FOUND");
      return structuredClone(runs.map((turn) => {
        const attempts = this.conversation.attempts.filter((attempt) => attempt.runId === turn.runId), windows = [...new Set(attempts.flatMap((attempt) => attempt.windowId ? [attempt.windowId] : []))];
        return { runId: turn.runId, status: turn.status, startedAt: turn.startedAt, deadline: turn.deadline, windows, attempts: attempts.map((attempt) => ({ attemptId: attempt.attemptId, kind: attempt.kind, windowId: attempt.windowId ?? "", reservedAt: attempt.reservedAt, ...attempt.outcome ? { outcome: attempt.outcome.kind } : {} })) };
      }));
    });
  }
  async guardAutonomyClock(operationId, clock) {
    const problem = clockProblem(this.conversation.autonomy, clock);
    if (!problem) return;
    if (!this.conversation.autonomy.clockBlocked && problem !== "CLOCK_UNAVAILABLE") {
      const id = OperationId("clock-" + createHash9("sha256").update(operationId).digest("hex")), fact = { kind: "clock-blocked", reason: problem, clock };
      await this.conversationCommit(id, fact, fact);
    }
    fail7(problem);
  }
  checkAutonomyClock(request) {
    return this.run(async () => {
      await this.assertWritable();
      await this.guardAutonomyClock(request.operationId, request.clock);
    });
  }
  requestWake(request) {
    return this.run(async () => {
      await this.assertWritable();
      op(request.operationId);
      if (this.uncertain) {
        if (this.uncertain !== request.operationId) fail7("IO_UNCERTAIN");
        await this.load();
        await syncDir3(join4(this.path, "commits"));
        await this.syncHead(request.operationId);
        this.uncertain = null;
      }
      const prior = this.commits.find((c) => c.operationId === request.operationId);
      if (prior) {
        if (prior.kind === "request-wake" || prior.kind === "coalesce-wake") {
          const fact = JSON.parse(await this.managedText(prior.data.payload));
          if ((prior.kind === "request-wake" ? fact.opportunity.reason : fact.reason) !== request.reason) fail7("OPERATION_CONFLICT");
          return { kind: "accepted", opportunity: structuredClone(fact.opportunity), dispatchOpportunity: false };
        }
        if (prior.kind === "clock-blocked") {
          const fact = JSON.parse(await this.managedText(prior.data.payload));
          return { kind: "skipped", reason: String(fact.reason) };
        }
        fail7("OPERATION_CONFLICT");
      }
      const problem = clockProblem(this.conversation.autonomy, request.stamp.clock);
      if (problem) {
        await this.conversationCommit(request.operationId, { kind: "clock-blocked", reason: problem, clock: request.stamp.clock }, { kind: "clock-blocked", reason: problem, clock: request.stamp.clock });
        return { kind: "skipped", reason: problem };
      }
      const blocked = wakeBlocked(this.conversation.autonomy, request.stamp);
      if (blocked) return { kind: "skipped", reason: blocked };
      if (this.conversation.autonomy.pending) {
        const opportunity2 = structuredClone(this.conversation.autonomy.pending), fact = { kind: "coalesce-wake", opportunity: opportunity2, reason: request.reason, clock: request.stamp.clock };
        await this.conversationCommit(request.operationId, { kind: "coalesce-wake", opportunityId: opportunity2.opportunityId, reason: request.reason }, fact);
        return { kind: "accepted", opportunity: opportunity2, dispatchOpportunity: true };
      }
      const opportunity = { opportunityId: request.operationId, requestedAt: request.stamp.clock.utc, reason: request.reason };
      await this.conversationCommit(request.operationId, { kind: "request-wake", reason: request.reason }, { kind: "request-wake", opportunity, clock: request.stamp.clock });
      return { kind: "accepted", opportunity, dispatchOpportunity: true };
    });
  }
  suspendAutonomous(request) {
    return this.run(async () => {
      const fact = { kind: "suspend-autonomous", runId: request.runId, reason: request.reason };
      await this.conversationCommit(request.operationId, fact, fact);
    });
  }
  /**
   * The periodic schedule is a Home-owned sidecar (`.autonomy-schedule.json`), not a commit: it is
   * runtime progress, not a business fact, and must not consume user-visible Home revisions.
   */
  schedulePath() {
    return join4(this.path, ".autonomy-schedule.json");
  }
  async readScheduleFile() {
    if (this.scheduleAnchor) return structuredClone(this.scheduleAnchor);
    let value;
    try {
      value = await jsonFile(this.schedulePath(), this.recoverAliases, !this.recoverAliases);
    } catch (error) {
      if (error.code === "ENOENT") return void 0;
      if (error instanceof HomeError && error.code === "CORRUPT_HOME") fail7("CORRUPT_AUTONOMY_SCHEDULE");
      throw error;
    }
    if (!validSchedule(value)) fail7("CORRUPT_AUTONOMY_SCHEDULE");
    const schedule = { anchorAt: String(value.anchorAt), lastSlotAt: value.lastSlotAt === null ? null : String(value.lastSlotAt), nextOpportunityAt: String(value.nextOpportunityAt), missedSlots: Number(value.missedSlots) };
    this.scheduleAnchor = structuredClone(schedule);
    return structuredClone(schedule);
  }
  async writeScheduleFile(schedule) {
    if (!validSchedule(schedule)) fail7("INVALID_AUTONOMY_SCHEDULE");
    const target = this.schedulePath(), temp = join4(this.path, ".autonomy-schedule.json." + randomUUID3() + ".pending");
    const fd = await open3(temp, "wx", 384);
    try {
      await fd.writeFile(canonicalBytes(schedule));
      await fd.sync();
    } finally {
      await fd.close();
    }
    try {
      await rename2(temp, target);
    } finally {
      await unlink3(temp).catch(() => {
      });
    }
    await syncDir3(this.path);
    this.scheduleAnchor = structuredClone(schedule);
  }
  readAutonomySchedule() {
    return this.run(async () => {
      const saved = await this.readScheduleFile();
      return saved ? structuredClone(saved) : null;
    });
  }
  armAutonomySchedule(request) {
    return this.run(async () => {
      await this.assertWritable();
      if (!validSchedule(request.schedule)) fail7("INVALID_AUTONOMY_SCHEDULE");
      const saved = await this.readScheduleFile();
      if (saved && JSON.stringify(saved) !== JSON.stringify(request.schedule)) fail7("AUTONOMY_SCHEDULE_EXISTS");
      if (saved) return structuredClone(saved);
      await this.writeScheduleFile(request.schedule);
      this.scheduleAnchor = request.schedule;
      return structuredClone(request.schedule);
    });
  }
  advanceAutonomySchedule(request) {
    return this.run(async () => {
      await this.assertWritable();
      const current = await this.readScheduleFile() ?? fail7("AUTONOMY_SCHEDULE_MISSING");
      const interval = this.conversation.autonomy.rules.value.wakeIntervalMs;
      if (request.slotAt !== current.nextOpportunityAt) fail7("AUTONOMY_SCHEDULE_STALE");
      if (!Number.isFinite(Date.parse(request.nextOpportunityAt)) || !Number.isSafeInteger(request.missedSlots) || request.missedSlots < 0 || typeof request.dispatchedSlot !== "boolean") fail7("INVALID_AUTONOMY_SCHEDULE");
      if (!(Date.parse(request.slotAt) < Date.parse(request.nextOpportunityAt))) fail7("INVALID_AUTONOMY_SCHEDULE");
      const delta = (Date.parse(request.nextOpportunityAt) - Date.parse(request.slotAt)) / interval;
      if (!Number.isSafeInteger(delta) || delta < 1) fail7("INVALID_AUTONOMY_SCHEDULE");
      const expected = current.missedSlots + delta - (request.dispatchedSlot ? 1 : 0);
      if (request.missedSlots !== expected) fail7("INVALID_AUTONOMY_SCHEDULE");
      const next = { anchorAt: current.anchorAt, lastSlotAt: request.slotAt, nextOpportunityAt: request.nextOpportunityAt, missedSlots: request.missedSlots };
      await this.writeScheduleFile(next);
      this.scheduleAnchor = next;
      return structuredClone(next);
    });
  }
  /** Interval edits recompute only the next future opportunity: consumed slots and usage stay. */
  rescheduleAutonomyFuture(request) {
    return this.run(async () => {
      await this.assertWritable();
      const current = await this.readScheduleFile() ?? fail7("AUTONOMY_SCHEDULE_MISSING");
      if (!Number.isFinite(Date.parse(request.nextOpportunityAt)) || Date.parse(request.nextOpportunityAt) <= Date.parse(current.lastSlotAt ?? current.anchorAt)) fail7("INVALID_AUTONOMY_SCHEDULE");
      const next = { anchorAt: current.anchorAt, lastSlotAt: current.lastSlotAt, nextOpportunityAt: request.nextOpportunityAt, missedSlots: current.missedSlots };
      await this.writeScheduleFile(next);
      return structuredClone(next);
    });
  }
  setAutonomyPause(request) {
    return this.run(async () => {
      const prior = this.commits.find((c) => c.operationId === request.operationId);
      if (prior) {
        if (prior.kind === "set-autonomy-pause") return;
        fail7("OPERATION_CONFLICT");
      }
      const fact = { kind: "set-autonomy-pause", paused: request.paused, at: request.at };
      await this.conversationCommit(request.operationId, { kind: fact.kind, paused: fact.paused }, fact, request.expectedRevision);
    });
  }
  beginAutonomous(request) {
    return this.run(async () => {
      await this.assertWritable();
      if (this.revision !== request.expectedRevision) fail7("REVISION_CONFLICT");
      if (request.stamp) {
        await this.guardAutonomyClock(request.operationId, request.stamp.clock);
        if (request.stamp.rulesVersion !== this.conversation.autonomy.rules.version) fail7("AUTONOMY_RULES_CHANGED");
        const blocked = wakeBlocked(this.conversation.autonomy, request.stamp);
        if (blocked) fail7(blocked);
        if (request.now !== request.stamp.clock.utc) fail7("AUTONOMY_STAMP_UTC_MISMATCH");
      }
      const pending = this.conversation.autonomy.pending ?? fail7("AUTONOMOUS_OPPORTUNITY_MISSING");
      const panel = this.snapshot.panelBinding;
      const suspended = this.conversation.turns.find((t) => t.source === "autonomous" && t.status === "suspended" && restoreRunEligible(this.restoreAcceptances.at(-1), t.runId));
      if (suspended) {
        const fact2 = { kind: "resume-autonomous", runId: suspended.runId, opportunityId: pending.opportunityId, admittedInputSequence: Math.max(0, ...this.snapshot.inputs.map((i) => i.receiveSequence)), contextGeneration: this.snapshot.contextGeneration };
        await this.conversationCommit(request.operationId, { kind: fact2.kind, runId: suspended.runId, opportunityId: pending.opportunityId }, fact2, request.expectedRevision);
        return structuredClone(this.conversation.turns.find((t) => t.runId === suspended.runId));
      }
      const turn = { groupId: InputGroupId("group-" + request.runId), runId: request.runId, inputIds: [], bindingId: panel.bindingId, bindingVersion: panel.bindingVersion, source: "autonomous", opportunityId: pending.opportunityId, admittedInputSequence: Math.max(0, ...this.snapshot.inputs.map((i) => i.receiveSequence)), startedAt: request.now, deadline: new Date(Date.parse(request.now) + this.conversation.autonomy.rules.value.windowMs).toISOString(), contextGeneration: this.snapshot.contextGeneration, settingsVersion: this.conversation.rules.version, status: "running" };
      const fact = { kind: "begin-autonomous", turn, opportunityId: pending.opportunityId };
      await this.conversationCommit(request.operationId, { kind: fact.kind, runId: request.runId, opportunityId: pending.opportunityId }, fact, request.expectedRevision);
      return structuredClone(this.conversation.turns.find((t) => t.runId === request.runId));
    });
  }
  beginTurn(request) {
    return this.run(async () => {
      const first = this.snapshot.inputs.find((x) => x.inputId === request.inputIds[0]) ?? fail7("INPUT_NOT_FOUND");
      const turn = { groupId: InputGroupId("group-" + request.runId), runId: request.runId, inputIds: [...request.inputIds], bindingId: first.bindingId, bindingVersion: first.bindingVersion, source: "user", startedAt: request.now, deadline: new Date(Date.parse(request.now) + this.conversation.rules.value.windowMs).toISOString(), contextGeneration: this.snapshot.contextGeneration, settingsVersion: this.conversation.rules.version, status: "running" };
      await this.conversationCommit(request.operationId, { kind: "begin-turn", inputIds: request.inputIds, runId: request.runId }, { kind: "begin-turn", turn }, request.expectedRevision);
      return structuredClone(this.conversation.turns.find((x) => x.runId === request.runId));
    });
  }
  refreshTurnContext(request) {
    return this.run(async () => {
      const { operationId, ...data } = request;
      const fact = { kind: "refresh-turn-context", ...data };
      await this.conversationCommit(operationId, fact, fact);
    });
  }
  reserveAttempt(request) {
    return this.run(async () => {
      const { operationId, expectedRevision, now, ...business } = request;
      const attempt = { attemptId: request.attemptId, runId: request.runId, source: request.source, kind: request.kind, reservedAt: now, ...request.autonomy ? { autonomy: structuredClone(request.autonomy), windowId: request.autonomy.day.windowId } : {}, ...request.proposal ? { proposal: proposalClaim(request.proposal) } : {}, ...request.fileOperation !== void 0 ? { fileOperation: request.fileOperation } : {}, ...request.fileAccessVersion !== void 0 ? { fileAccessVersion: request.fileAccessVersion } : {}, ...request.fileRules ? { fileRules: structuredClone(request.fileRules) } : {}, ...request.modelOperation ? { modelOperation: structuredClone(request.modelOperation) } : {}, ...request.webOperation ? { webOperation: structuredClone(request.webOperation) } : {}, ...["model", "web"].includes(request.kind) ? { retryRules: structuredClone(request.retryRules ?? this.conversation.retryRules) } : {}, ...request.kind === "tool" ? { readRules: structuredClone(request.readRules ?? this.conversation.readRules) } : {} };
      const group = this.conversation.turns.find((x) => x.runId === request.runId && x.status === "running") ?? fail7("RUN_NOT_ACTIVE");
      if (request.source !== group.source) fail7("SOURCE_MISMATCH");
      if (group.source === "autonomous" && !this.commits.some((c) => c.operationId === operationId) && request.autonomy) await this.guardAutonomyClock(operationId, request.autonomy.clock);
      if (request.modelOperation?.ordinal === 1 && this.conversation.retryRules.value.maxAutomaticRetries < 1) fail7("MODEL_RETRY_LIMIT");
      if (!this.commits.some((x) => x.operationId === operationId) && this.conversation.attempts.filter((x) => x.runId === group.runId && x.kind === request.kind).length >= (request.kind === "model" ? (group.source === "autonomous" ? this.conversation.autonomy.rules.value : this.conversation.rules.value).modelLimit : request.kind === "web" ? (group.source === "autonomous" ? this.conversation.autonomy.rules.value : this.conversation.rules.value).webLimit : (group.source === "autonomous" ? this.conversation.autonomy.rules.value : this.conversation.rules.value).toolLimit)) fail7(request.kind === "model" ? "MODEL_LIMIT" : request.kind === "web" ? "WEB_LIMIT" : "TOOL_LIMIT");
      if (!this.commits.some((x) => x.operationId === operationId) && Date.parse(now) >= Date.parse(group.deadline)) fail7("TURN_DEADLINE");
      await this.conversationCommit(operationId, { action: "reserve-attempt", ...business }, { kind: "reserve-attempt", attempt, contextGeneration: request.contextGeneration, settingsVersion: request.settingsVersion }, expectedRevision);
      return structuredClone(this.conversation.attempts.find((x) => x.attemptId === request.attemptId));
    });
  }
  reserveWebTool(request) {
    return this.run(async () => {
      const { operationId, expectedRevision, now, webAttemptId, webTool, ...business } = request;
      const group = this.conversation.turns.find((x) => x.runId === request.runId && x.status === "running") ?? fail7("RUN_NOT_ACTIVE");
      if (request.source !== group.source) fail7("SOURCE_MISMATCH");
      if (group.source === "autonomous" && !this.commits.some((c) => c.operationId === operationId) && request.autonomy) await this.guardAutonomyClock(operationId, request.autonomy.clock);
      if (!this.commits.some((x) => x.operationId === operationId)) {
        for (const kind of ["tool", "web"]) if (this.conversation.attempts.filter((x) => x.runId === group.runId && x.kind === kind).length >= (kind === "tool" ? (group.source === "autonomous" ? this.conversation.autonomy.rules.value : this.conversation.rules.value).toolLimit : (group.source === "autonomous" ? this.conversation.autonomy.rules.value : this.conversation.rules.value).webLimit)) fail7(kind === "tool" ? "TOOL_LIMIT" : "WEB_LIMIT");
        if (Date.parse(now) >= Date.parse(group.deadline)) fail7("TURN_DEADLINE");
      }
      const tool = { attemptId: request.attemptId, runId: request.runId, source: request.source, kind: "tool", reservedAt: now, ...request.autonomy ? { autonomy: structuredClone(request.autonomy), windowId: request.autonomy.day.windowId } : {}, readRules: structuredClone(request.readRules ?? this.conversation.readRules), webTool: structuredClone(webTool) };
      const web = { attemptId: webAttemptId, runId: request.runId, source: request.source, kind: "web", reservedAt: now, ...request.autonomy ? { autonomy: structuredClone(request.autonomy), windowId: request.autonomy.day.windowId } : {}, retryRules: structuredClone(request.retryRules ?? this.conversation.retryRules), webOperation: { logicalOpId: webTool.logicalOpId, parentAttemptId: tool.attemptId, ordinal: 0 } };
      await this.conversationCommit(operationId, { action: "reserve-web-tool", ...business, webAttemptId, webTool }, { kind: "reserve-web-tool", tool, web, contextGeneration: request.contextGeneration, settingsVersion: request.settingsVersion }, expectedRevision);
      return structuredClone({ tool: this.conversation.attempts.find((x) => x.attemptId === tool.attemptId), web: this.conversation.attempts.find((x) => x.attemptId === web.attemptId) });
    });
  }
  enterAttempt(request) {
    return this.run(async () => {
      await this.conversationCommit(request.operationId, { kind: "enter-attempt", attemptId: request.attemptId }, { kind: "enter-attempt", attemptId: request.attemptId, now: request.now });
    });
  }
  recordAttempt(request) {
    return this.run(async () => {
      await this.conversationCommit(request.operationId, { kind: "record-attempt", attemptId: request.attemptId, outcome: JSON.stringify(request.outcome) }, { kind: "record-attempt", attemptId: request.attemptId, outcome: request.outcome });
    });
  }
  observeAttempt(request) {
    return this.run(async () => {
      await this.conversationCommit(request.operationId, { kind: "observe-tool", attemptId: request.attemptId, observation: JSON.stringify(request.observation) }, { kind: "observe-tool", attemptId: request.attemptId, observation: request.observation });
    });
  }
  captureMaterial(request) {
    return this.run(async () => {
      await this.conversationCommit(request.operationId, { kind: "capture-material", material: JSON.stringify(request.material) }, { kind: "capture-material", material: request.material });
    });
  }
  recordNative(request) {
    return this.run(async () => {
      await this.conversationCommit(request.operationId, { kind: "native-record", record: JSON.stringify(request.record) }, { kind: "native-record", record: request.record });
    });
  }
  finishTurn(request) {
    return this.run(async () => {
      if (request.outcome.kind === "reply" && this.conversation.turns.find((t) => t.runId === request.runId)?.source === "autonomous") fail7("AUTONOMOUS_REPLY_FORBIDDEN");
      const replay = this.replayRequests.get(request.operationId);
      if (replay) {
        if (replay !== fingerprint({ kind: "finish-turn", runId: request.runId, outcome: JSON.stringify(request.outcome) })) fail7("OPERATION_CONFLICT");
        const original = this.commits.find((commit) => commit.operationId === request.operationId);
        return { ...this.receipt(original), ...request.outcome.kind === "reply" ? { replyId: ReplyId("reply-" + request.runId) } : {} };
      }
      if (request.outcome.kind === "reply") {
        if (typeof request.outcome.text !== "string" || !request.outcome.text.length) fail7("INVALID_REPLY");
        canonicalBytes(request.outcome.text);
      }
      const fact = { kind: "finish-turn", runId: request.runId, contextGeneration: request.contextGeneration, outcome: request.outcome, ...request.outcome.kind === "reply" ? { replyId: ReplyId("reply-" + request.runId) } : {} };
      const turn = this.conversation.turns.find((t) => t.runId === request.runId), input = turn && this.snapshot.inputs.find((x) => x.inputId === turn.inputIds[0]), prior = this.commits.find((c) => c.operationId === request.operationId), binding = this.snapshot.qqBinding;
      if (prior && prior.kind !== "finish-turn") fail7("OPERATION_CONFLICT");
      const revoked = turn && input?.channel === "qq" && (!binding || binding.bindingId !== turn.bindingId || binding.version !== turn.bindingVersion);
      if (!prior && revoked && !(request.outcome.kind === "failure" && request.outcome.reason === "QQ_BINDING_CHANGED")) fail7("QQ_BINDING_CHANGED");
      if (request.outcome.kind === "reply" && turn && input?.channel === "qq") {
        const reply = { replyId: fact.replyId, intentId: IntentId("intent-" + turn.runId), runId: turn.runId, inputIds: turn.inputIds, text: request.outcome.text };
        if (prior) {
          const saved = JSON.parse(await this.managedText(prior.data.payload));
          if (saved.delivery) fact.delivery = saved.delivery;
        } else fact.delivery = prepareDelivery(reply, binding, this.conversation.deliveryRules, HomeRevision(this.revision + 1));
      }
      const receipt = await this.conversationCommit(request.operationId, { ...fact, outcome: JSON.stringify(request.outcome) }, fact);
      return { ...receipt, ...fact.replyId ? { replyId: fact.replyId } : {} };
    });
  }
  readExecutionRecord(request) {
    return this.run(async () => {
      if (!Number.isSafeInteger(request.offset) || request.offset < 0 || !Number.isSafeInteger(request.limit) || request.limit < 1 || request.limit > 65536 || !["attempt", "native"].includes(request.kind)) fail7("INVALID_RECORD_PAGE");
      const value = request.kind === "attempt" ? this.conversation.attempts.find((x) => x.attemptId === request.recordId) : this.conversation.nativeRecords.find((x) => x.provenance + "/" + x.nativeId === request.recordId);
      if (!value) return fail7("EXECUTION_RECORD_NOT_FOUND");
      const points = Array.from(JSON.stringify(value));
      const page = { runId: value.runId, json: points.slice(request.offset, request.offset + request.limit).join(""), offset: request.offset, totalCodePoints: points.length, more: request.offset + request.limit < points.length };
      return request.kind === "attempt" ? { ...page, kind: "attempt", recordId: request.recordId } : { ...page, kind: "native", recordId: request.recordId };
    });
  }
  readReply(request) {
    return this.run(async () => {
      if (!Number.isSafeInteger(request.offset) || request.offset < 0 || !Number.isSafeInteger(request.limit) || request.limit < 1 || request.limit > 1048576) fail7("INVALID_REPLY_PAGE");
      const reply = this.conversation.replies.find((x) => x.replyId === request.replyId) ?? fail7("REPLY_NOT_FOUND");
      if (reply.cleanup) fail7("REPLY_SOURCE_CLEANED");
      const points = Array.from(reply.text);
      return { ...structuredClone(reply), text: points.slice(request.offset, request.offset + request.limit).join(""), offset: request.offset, totalCodePoints: points.length, more: request.offset + request.limit < points.length };
    });
  }
  async initialize(request) {
    const core = await this.put({ text: request.core });
    const config = await this.put(request.settings);
    return this.append("create", request.operationId, this.identity.creationFingerprint, { core, settings: config });
  }
  readSnapshot() {
    return this.run(async () => structuredClone({ ...this.snapshot, ...this.uncertain ? { uncertainOperationId: this.uncertain } : {} }));
  }
  openContextReader(request) {
    return this.run(async () => {
      if (!request || Object.getPrototypeOf(request) !== Object.prototype || Reflect.ownKeys(request).some((key2) => typeof key2 !== "string" || !("value" in Object.getOwnPropertyDescriptor(request, key2)))) fail7("INVALID_CONTEXT_PURPOSE");
      const purpose = Object.getOwnPropertyDescriptor(request, "purpose")?.value;
      if (purpose !== "management" && purpose !== "daily" && purpose !== "history" || Object.keys(request).sort().join("|") !== (purpose === "management" ? "purpose" : "purpose|runId")) fail7("INVALID_CONTEXT_PURPOSE");
      const owned = purpose === "management" ? Object.freeze({ purpose: "management" }) : purpose === "daily" ? Object.freeze({ purpose: "daily", runId: RunId(Object.getOwnPropertyDescriptor(request, "runId")?.value) }) : Object.freeze({ purpose: "history", runId: RunId(Object.getOwnPropertyDescriptor(request, "runId")?.value) });
      const snapshot = structuredClone(this.snapshot), validate = (sources) => this.run(async () => {
        if (this.fault || this.uncertain || this.pendingOwnerChanges || this.snapshot.contextGeneration !== snapshot.contextGeneration || this.snapshot.core.version !== snapshot.core.version) fail7("CONTEXT_SNAPSHOT_STALE");
        if (owned.purpose !== "management" && !this.conversation.turns.some((turn) => turn.runId === owned.runId && turn.status === "running")) fail7("CONTEXT_RUN_NOT_ACTIVE");
        const lineage = owned.purpose === "daily" ? createContextLineage(this.snapshot, this.conversation) : void 0;
        for (const source of sources) {
          if (lineage && !lineage.describe(source.ref).availableForDaily) fail7("CONTEXT_SNAPSHOT_STALE");
          if (contextSourceDigest(this.snapshot, this.conversation, source.ref) !== source.contentDigest) fail7("CONTEXT_SOURCE_CHANGED");
        }
      });
      if (this.fault || this.uncertain || this.pendingOwnerChanges) fail7("CONTEXT_SNAPSHOT_STALE");
      return createContextSnapshotReader(snapshot, structuredClone(this.conversation), owned, validate);
    });
  }
  inputReceipt(operationId, kind) {
    const input = this.snapshot.inputs.find((x) => x.operationId === operationId);
    if (!input) return fail7("CORRUPT_CHAIN");
    return { kind, operationId: input.operationId, roleId: this.roleId, inputId: input.inputId, experienceId: input.experienceId, committedRevision: input.committedRevision, receiveSequence: input.receiveSequence, bindingId: input.bindingId, bindingVersion: input.bindingVersion, status: "queued" };
  }
  acceptInput(input) {
    return this.run(async () => {
      await this.assertWritable();
      const fp = fingerprint(inputBusiness(input, this.roleId, this.snapshot.qqBinding, this.qqHistory));
      if (this.uncertain) {
        if (input.operationId !== this.uncertain) throw new HomeError("IO_UNCERTAIN", "IO_UNCERTAIN", this.uncertain);
        try {
          await this.load();
          await syncDir3(join4(this.storagePath, "commits"));
          await this.syncHead(input.operationId);
        } catch {
          throw new HomeError("IO_UNCERTAIN", "IO_UNCERTAIN", this.uncertain);
        }
        this.uncertain = null;
      }
      const operation = this.commits.find((x) => x.operationId === input.operationId);
      if (operation) {
        if (operation.kind !== "accept-input" || operation.fingerprint !== fp) fail7("OPERATION_CONFLICT");
        this.snapshot = { ...this.snapshot, projection: await this.projection(true) };
        return this.inputReceipt(operation.operationId, "duplicate");
      }
      const previous = this.commits.find((x) => x.kind === "accept-input" && x.data.keyHash === inputKey(input));
      if (previous) {
        if (previous.fingerprint !== fp) {
          const original = this.snapshot.inputs.find((i) => i.operationId === previous.operationId);
          if (input.channel !== "qq" || !original || original.text !== input.text || fingerprint(original.qqSource) !== fingerprint(input.qqSource)) fail7("INPUT_KEY_CONFLICT");
        }
        return this.inputReceipt(previous.operationId, "duplicate");
      }
      if (Buffer.byteLength(input.text, "utf8") > this.snapshot.settings.value.inputLimitBytes) fail7("INPUT_TOO_LARGE");
      const content2 = await this.put({ externalKey: input.externalKey, text: input.text, origin: input.origin, receivedAt: input.receivedAt, sourceEvidence: input.sourceEvidence, ...input.contextPurpose ? { contextPurpose: input.contextPurpose } : {}, ...input.origin === "history" ? { historySource: input.historySource } : {}, ...input.channel === "qq" ? { channel: "qq", qqSource: input.qqSource } : {} });
      await this.append("accept-input", input.operationId, fp, { bindingId: input.bindingId, bindingVersion: input.bindingVersion, inputId: InputId("input-" + randomUUID3()), experienceId: ExperienceId("experience-" + randomUUID3()), receiveSequence: this.snapshot.inputs.length + 1, keyHash: inputKey(input), content: content2, status: "queued" });
      return this.inputReceipt(input.operationId, "accepted");
    });
  }
  /** Read-only projection of the last verified authority; does not wait behind a pending write. */
  operationSnapshot(operationId) {
    if (this.closed) fail7("HOME_CLOSED");
    op(operationId);
    if (this.uncertain === operationId) return { operationId, kind: "uncertain", stage: "commit-uncertain" };
    const c = this.commits.find((commit) => commit.operationId === operationId);
    if (!c) return { operationId, kind: "not-found" };
    const stop = this.stops.find((record) => record.operationId === operationId);
    return { ...this.receipt(c), ...stop ? { stop: { ...structuredClone(stop), phase: "unverified" } } : {} };
  }
  async readActivationDiagnostic() {
    if (this.closed) fail7("HOME_CLOSED");
    let accepted, reason = "";
    const previous = this.restoreAcceptances.at(-1);
    try {
      if (previous && await locallyAcceptedRestore(this.path, previous)) accepted = previous;
    } catch {
      reason = "RESTORE_LOCAL_PROOF_UNAVAILABLE";
    }
    const portable = await portableRestoreRequired(this.path), outgoing = this.handovers.filter((record) => record.requestedRevision > (accepted?.committedRevision ?? 0)).at(-1);
    if (!reason) {
      if (portable && !accepted || previous && !accepted) reason = "RESTORE_HANDOVER_REQUIRED";
      else if (outgoing) reason = outgoing.readyRevision !== void 0 ? "SOURCE_HANDOVER_RELEASED" : "SOURCE_HANDOVER_PENDING";
    }
    if (!reason) return void 0;
    return { ...await diagnoseRoleHome(this.path, { expectedRoleId: this.roleId }), mode: "read-only", reason, recovery: ["restore-and-confirm-handover"] };
  }
  readRestoreSource() {
    return this.run(() => acceptedRestoreSource(this.path, this.restoreAcceptances.at(-1)));
  }
  restoredMaintenanceSnapshotFacts() {
    return structuredClone(this.restoredMaintenance);
  }
  restoreAcceptanceSnapshot() {
    if (this.closed) fail7("HOME_CLOSED");
    return structuredClone(this.restoreAcceptances.at(-1));
  }
  confirmRestore(raw) {
    return this.run(async () => {
      const request = restoreConfirmation(raw), { operationId, expectedRevision, ...business } = request, fp = fingerprint({ kind: "accept-restore", ...business });
      await this.assertWritable();
      if (this.uncertain) {
        if (this.uncertain !== operationId) fail7("IO_UNCERTAIN");
        await this.load();
        await syncDir3(join4(this.path, "commits"));
        await this.syncHead(operationId);
        this.uncertain = null;
      }
      const old = this.commits.find((commit) => commit.operationId === operationId);
      if (old && (old.kind !== "accept-restore" || old.fingerprint !== fp)) fail7("OPERATION_CONFLICT");
      if (old) {
        const accepted = this.restoreAcceptances.find((record) => record.operationId === operationId);
        if (accepted && await locallyAcceptedRestore(this.path, accepted)) return structuredClone(accepted);
      }
      if (!old && this.revision !== expectedRevision) fail7("REVISION_CONFLICT");
      const prepared = await prepareRestoreAcceptance(this.path, request, this.roleId, !!old, validateBackupAuthority), progress = prepared.progress;
      const handover = this.handovers.find((record) => record.handoverId === request.handoverId);
      if (!handover?.readyRevision || handover.backupOperationId !== prepared.backupOperationId || handover.stopOperationId !== progress.sourceStopOperationId || handover.readyRevision > (progress.sourceRevision ?? 0)) fail7("SOURCE_HANDOVER_UNPROVEN");
      if (!old) {
        if (progress.sourceRevision !== this.revision) fail7("RESTORE_CONTENT_CHANGED");
        const refs = /* @__PURE__ */ new Set(), maintenance = await this.putManaged(prepared.maintenanceSnapshots, refs);
        await prepared.validateTarget(refs);
        await this.append("accept-restore", operationId, fp, { restoreOperationId: request.restoreOperationId, handoverId: request.handoverId, manifestDigest: request.expectedManifestDigest, sourceRevision: HomeRevision(progress.sourceRevision), sourceStopOperationId: handover.stopOperationId, inputSequence: this.snapshot.inputs.at(-1)?.receiveSequence ?? 0, inheritedRunIds: this.conversation.turns.filter((turn) => turn.status === "running" || turn.status === "suspended").map((turn) => turn.runId), maintenance });
      }
      const acceptance = this.restoreAcceptances.find((record) => record.operationId === operationId);
      if (!acceptance) fail7("RESTORE_ACCEPTANCE_UNCERTAIN");
      await markRestoreAccepted(this.path, acceptance);
      return structuredClone(acceptance);
    });
  }
  reconcileOperation(operationId) {
    return this.run(async () => {
      op(operationId);
      await this.assertWritable();
      if (this.uncertain) {
        if (this.uncertain !== operationId) fail7("IO_UNCERTAIN");
        await this.load();
        if (!this.commits.some((commit) => commit.operationId === operationId)) fail7("IO_UNCERTAIN");
        await syncDir3(join4(this.path, "commits"));
        await this.syncHead(operationId);
        this.uncertain = null;
      }
      return this.operationSnapshot(operationId);
    });
  }
  reconcileHandover(request) {
    return this.run(async () => {
      const operationId = OperationId(request.operationId), handoverOperationId = OperationId(request.handoverOperationId), priorNativeFlush = request.priorNativeFlush, business = { kind: "reconcile-handover", handoverOperationId, priorNativeFlush }, fp = fingerprint(business);
      await this.assertWritable();
      if (this.uncertain) {
        if (this.uncertain !== operationId) fail7("IO_UNCERTAIN");
        await this.load();
        await syncDir3(join4(this.path, "commits"));
        await this.syncHead(operationId);
        this.uncertain = null;
      }
      const old = this.commits.find((commit) => commit.operationId === operationId);
      if (old) {
        if (old.kind !== business.kind || old.fingerprint !== fp) fail7("OPERATION_CONFLICT");
        return this.receipt(old);
      }
      const record = this.handovers.find((record2) => record2.operationId === handoverOperationId);
      if (!record || record.readyRevision !== void 0 || record.recovery || !["unknown", "source-checkpoint"].includes(priorNativeFlush) || priorNativeFlush === "source-checkpoint" && !this.stops.some((stop) => stop.operationId === record.stopOperationId && stop.checkpoint === "ready-to-close" && stop.requestedRevision > record.requestedRevision)) fail7("INVALID_HANDOVER_RECONCILIATION");
      return this.append("reconcile-handover", operationId, fp, { handoverOperationId, priorNativeFlush });
    });
  }
  handoverSnapshots() {
    if (this.closed) fail7("HOME_CLOSED");
    return structuredClone(this.handovers);
  }
  requestHandover(raw, seal) {
    return this.run(async () => {
      const request = handoverReservation(raw), { operationId, expectedRevision, ...business } = request, fp = fingerprint({ kind: "request-handover", ...business });
      await this.assertWritable();
      if (this.uncertain) {
        if (this.uncertain !== operationId) fail7("IO_UNCERTAIN");
        await this.load();
        await syncDir3(join4(this.path, "commits"));
        await this.syncHead(operationId);
        this.uncertain = null;
      }
      const old = this.commits.find((commit) => commit.operationId === operationId);
      if (old) {
        if (old.kind !== "request-handover" || old.fingerprint !== fp) fail7("OPERATION_CONFLICT");
        return this.receipt(old);
      }
      if (this.handovers.some((record) => currentOutgoingHandover(record, this.restoreAcceptances.at(-1)?.committedRevision))) fail7("HANDOVER_ALREADY_REQUESTED");
      if (expectedRevision !== this.revision) fail7("REVISION_CONFLICT");
      seal?.();
      return this.append("request-handover", operationId, fp, business);
    });
  }
  readyHandover(request) {
    return this.run(async () => {
      const operationId = OperationId(request.operationId), handoverOperationId = OperationId(request.handoverOperationId), business = { kind: "ready-handover", handoverOperationId }, fp = fingerprint(business);
      await this.assertWritable();
      if (this.uncertain) {
        if (this.uncertain !== operationId) fail7("IO_UNCERTAIN");
        await this.load();
        await syncDir3(join4(this.path, "commits"));
        await this.syncHead(operationId);
        this.uncertain = null;
      }
      const old = this.commits.find((commit) => commit.operationId === operationId);
      if (old) {
        if (old.kind !== business.kind || old.fingerprint !== fp) fail7("OPERATION_CONFLICT");
        return this.receipt(old);
      }
      const record = this.handovers.find((record2) => record2.operationId === handoverOperationId);
      if (!record || record.readyRevision !== void 0 || !this.stops.some((stop) => stop.operationId === record.stopOperationId && stop.checkpoint === "ready-to-close")) fail7("HANDOVER_NOT_SETTLED");
      return this.append("ready-handover", operationId, fp, { handoverOperationId });
    });
  }
  stopSnapshots() {
    if (this.closed) fail7("HOME_CLOSED");
    return structuredClone(this.stops);
  }
  async stopCommit(operationId, business) {
    op(operationId);
    const fp = fingerprint(business);
    await this.assertWritable();
    if (this.uncertain) {
      if (this.uncertain !== operationId) fail7("IO_UNCERTAIN");
      await this.load();
      await syncDir3(join4(this.storagePath, "commits"));
      await this.syncHead(operationId);
      this.uncertain = null;
    }
    const old = this.commits.find((commit) => commit.operationId === operationId);
    if (old) {
      if (old.kind !== business.kind || old.fingerprint !== fp) fail7("OPERATION_CONFLICT");
      return this.receipt(old);
    }
    if (business.kind === "request-stop") {
      if (!["owner-stop", "unload", "migration"].includes(business.reason)) fail7("INVALID_STOP");
      return this.append(business.kind, operationId, fp, { reason: business.reason });
    }
    const previous = this.stops.find((record) => record.operationId === business.stopOperationId);
    if (!previous || (business.kind === "checkpoint-stop" ? previous.checkpoint !== "requested" : previous.reconciledRevision !== void 0)) fail7("STOP_CHECKPOINT_CONFLICT");
    return this.append(business.kind, operationId, fp, { stopOperationId: business.stopOperationId });
  }
  reconcileStop(request) {
    return this.run(() => this.stopCommit(request.operationId, { kind: "reconcile-stop", stopOperationId: request.stopOperationId }));
  }
  requestStop(request) {
    return this.run(() => this.stopCommit(request.operationId, { kind: "request-stop", reason: request.reason }));
  }
  checkpointStop(request) {
    return this.run(() => this.stopCommit(request.operationId, { kind: "checkpoint-stop", stopOperationId: request.stopOperationId }));
  }
  readOperation(operationId) {
    return this.run(async () => {
      op(operationId);
      const diagnostic = await diagnoseRoleHome(this.path, { expectedRoleId: this.roleId });
      if (diagnostic.mode === "read-only") {
        this.fault = diagnostic;
        return { operationId, kind: "unavailable", reason: "READ_ONLY_HOME" };
      }
      if (this.uncertain === operationId)
        return { operationId, kind: "uncertain", stage: "commit-uncertain" };
      const c = this.commits.find((x) => x.operationId === operationId);
      return c ? { ...await this.projectionReceipt(c), ...this.stops.find((stop) => stop.operationId === operationId) ? { stop: this.operationSnapshot(operationId).stop } : {}, ...c.kind === "accept-input" ? { inputReceipt: this.inputReceipt(operationId, "accepted") } : {} } : { operationId, kind: "not-found" };
    });
  }
  progressPath(c) {
    return join4(this.storagePath, "projection-progress", fingerprint(c.operationId) + ".json");
  }
  async progress(c) {
    const base = { intent: "committed", preservedMaterialRef: String(c.data.preserved) };
    try {
      await directory2(join4(this.storagePath, "projection-progress"));
      const value = await jsonFile(this.progressPath(c));
      exact2(value, ["operationId", "revision", "targetDigest", "digest"]);
      const { digest: claimed, ...body } = value;
      if (claimed !== fingerprint(body) || value.operationId !== c.operationId || value.revision !== c.revision || value.targetDigest !== digest(this.generatedHistory[c.revision - 1])) fail7("CORRUPT_PROJECTION_PROGRESS");
      return { ...base, state: "complete" };
    } catch (error) {
      if (error.code !== "ENOENT") return { ...base, state: "unavailable", reason: "CORRUPT_PROJECTION_PROGRESS" };
    }
    const preview = await this.preview("settings");
    if (c.revision !== this.revision) return { ...base, state: "blocked", reason: "PROJECTION_TARGET_SUPERSEDED" };
    if (preview.state === "unavailable") return { ...base, state: "unavailable", reason: preview.reason ?? "UNSAFE_PROJECTION" };
    if (preview.actualDigest !== c.data.observedDigest && preview.actualDigest !== digest(this.generatedHistory[c.revision - 1])) return { ...base, state: "blocked", reason: "PROJECTION_DIGEST_CONFLICT" };
    return { ...base, state: "pending" };
  }
  async projectionReceipt(c) {
    if (c.kind !== "import-projection" && c.kind !== "rebuild-projection") return this.receipt(c);
    return { ...this.receipt(c), projection: await this.projection(false), projectionOperation: await this.progress(c) };
  }
  async completeProjection(c) {
    let progress = await this.progress(c);
    if (progress.state !== "pending") return this.projectionReceipt(c);
    const desired = this.generatedHistory[c.revision - 1];
    const file = join4(this.storagePath, "views", "settings.json");
    try {
      const before = await this.preview("settings");
      if (before.actualDigest !== digest(desired)) {
        const temp = join4(this.storagePath, "views", "." + randomUUID3() + ".projection");
        const fd = await open3(temp, "wx", 384);
        try {
          await fd.writeFile(desired);
          await fd.sync();
        } finally {
          await fd.close();
        }
        try {
          await this.io.barrier?.("before-projection-replace", { operationId: c.operationId, revision: c.revision });
          const current = await this.preview("settings");
          if (current.actualDigest !== before.actualDigest || current.state === "unavailable") fail7("PROJECTION_DIGEST_CONFLICT");
          await rename2(temp, file);
          await this.io.barrier?.("after-projection-replace", { operationId: c.operationId, revision: c.revision });
        } finally {
          await unlink3(temp).catch(() => {
          });
        }
      }
      await syncDir3(dirname4(file));
      await this.io.barrier?.("before-projection-progress", { operationId: c.operationId, revision: c.revision });
      const progressDir = join4(this.storagePath, "projection-progress");
      try {
        await mkdir3(progressDir, { mode: 448 });
        await syncDir3(this.path);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
      await directory2(progressDir);
      const body = { operationId: c.operationId, revision: c.revision, targetDigest: digest(desired) };
      try {
        await publish2(this.progressPath(c), canonicalBytes({ ...body, digest: fingerprint(body) }));
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
      await syncDir3(progressDir);
      await this.io.barrier?.("after-projection-progress", { operationId: c.operationId, revision: c.revision });
      this.snapshot = { ...this.snapshot, projection: await this.projection(false) };
      return this.projectionReceipt(c);
    } catch (error) {
      progress = await this.progress(c);
      return { ...this.receipt(c), projection: await this.projection(false), projectionOperation: { ...progress, ...progress.state === "pending" ? { reason: "PROJECTION_WRITE_FAILED" } : {} } };
    }
  }
  applyProjection(command) {
    return this.run(async () => {
      await this.assertWritable();
      op(command.operationId);
      if (command.projectionId !== "settings" || command.observedDigest !== null && (typeof command.observedDigest !== "string" || !/^[a-f0-9]{64}$/.test(command.observedDigest))) fail7("INVALID_PROJECTION_COMMAND");
      const fp = fingerprint({ kind: command.kind, projectionId: command.projectionId, observedDigest: command.observedDigest });
      if (this.uncertain) {
        if (this.uncertain !== command.operationId) fail7("IO_UNCERTAIN");
        await this.load();
        await syncDir3(join4(this.storagePath, "commits"));
        await this.syncHead(command.operationId);
        this.uncertain = null;
      }
      const existing = this.commits.find((c) => c.operationId === command.operationId);
      if (existing) {
        if (existing.fingerprint !== fp) fail7("OPERATION_CONFLICT");
        return this.completeProjection(existing);
      }
      if (command.expectedRevision !== this.revision) fail7("REVISION_CONFLICT");
      if (command.expectedCoreVersion !== this.snapshot.core.version) fail7("CORE_VERSION_CONFLICT");
      if (command.expectedSettingsVersion !== this.snapshot.settings.version) fail7("SETTINGS_VERSION_CONFLICT");
      const preview = await this.preview(command.projectionId);
      if (preview.state === "unavailable") fail7("UNSAFE_PROJECTION");
      if (preview.actualDigest !== command.observedDigest) fail7("PROJECTION_DIGEST_CONFLICT");
      const actual = preview.actualDigest === null ? null : await safeBytes2(join4(this.storagePath, "views", "settings.json"));
      if ((actual === null ? null : digest(actual)) !== command.observedDigest) fail7("PROJECTION_DIGEST_CONFLICT");
      if (actual && actual.length > 8388608) fail7("PROJECTION_TOO_LARGE");
      let imported;
      if (command.kind === "import-projection") {
        if (!actual) fail7("INVALID_PROJECTION");
        imported = this.projectionValue(actual);
        if (!preview.importable) fail7(preview.reason ?? "INVALID_PROJECTION");
      } else if (command.kind !== "rebuild-projection") fail7("UNSUPPORTED_COMMAND");
      const preserved = await this.putMaterial(actual);
      const data = { projectionId: command.projectionId, observedDigest: command.observedDigest, preserved };
      if (imported) {
        data.sourceRevision = imported.revision;
        data.sourceCoreVersion = imported.core.version;
        data.sourceSettingsVersion = imported.settings.version;
        data.provenance = "owner-import";
        const coreChanged = imported.core.text !== this.snapshot.core.text;
        const settingsChanged = imported.settings.value.inputLimitBytes !== this.snapshot.settings.value.inputLimitBytes;
        data.core = coreChanged ? await this.put({ text: imported.core.text }) : null;
        data.coreVersion = CoreVersion(this.snapshot.core.version + Number(coreChanged));
        data.settings = settingsChanged ? await this.put(imported.settings.value) : null;
        data.settingsVersion = InputSettingsVersion(this.snapshot.settings.version + Number(settingsChanged));
      }
      await this.append(command.kind, command.operationId, fp, data);
      return this.completeProjection(this.commits.find((c) => c.operationId === command.operationId));
    });
  }
  applyOwner(command) {
    const dependencyChange = ["rollback-knowledge", "edit-autonomy-rules", "edit-file-rules", "edit-file-access", "edit-proposal-rules", "edit-web-rules", "edit-delivery-rules", "edit-contact-rules", "bind-qq", "edit-core", "edit-settings", "edit-conversation", "edit-read-rules", "edit-retry-rules", "import-projection", "cleanup-sources"].includes(command.kind);
    if (dependencyChange) this.pendingOwnerChanges++;
    if (command.kind === "import-projection" || command.kind === "rebuild-projection") return this.applyProjection(command).finally(() => {
      if (dependencyChange) this.pendingOwnerChanges--;
    });
    return this.run(async () => {
      await this.assertWritable();
      op(command.operationId);
      let business;
      if (command.kind === "cleanup-sources") return this.commitCleanupRequest(admitCleanupCommand(command));
      if (this.uncertain) {
        if (this.uncertain !== command.operationId) fail7("IO_UNCERTAIN");
        await this.load();
        await syncDir3(join4(this.storagePath, "commits"));
        await this.syncHead(command.operationId);
        this.uncertain = null;
      }
      if (command.kind === "rollback-knowledge") {
        const request = parseKnowledgeRollback(command), business2 = rollbackKnowledgeBusiness(request), old = this.commits.find((commit) => commit.operationId === request.operationId);
        if (old) {
          if (old.kind !== "rollback-knowledge" || old.fingerprint !== fingerprint(business2)) fail7("OPERATION_CONFLICT");
          return this.receipt(old);
        }
        const version2 = createKnowledgeRollback(this.conversation.knowledge, request, HomeRevision(this.revision + 1), (/* @__PURE__ */ new Date()).toISOString());
        return this.conversationCommit(request.operationId, business2, { kind: "rollback-knowledge", version: version2 }, request.expectedRevision);
      }
      if (command.kind === "bind-qq") {
        if (!validateBindQQ(command)) fail7("INVALID_QQ_BINDING");
        if (this.uncertain) {
          if (this.uncertain !== command.operationId) fail7("IO_UNCERTAIN");
          await this.load();
          await syncDir3(join4(this.storagePath, "commits"));
          await this.syncHead(command.operationId);
          this.uncertain = null;
        }
        const business2 = { kind: "bind-qq", connectionId: command.connectionId, accountId: command.accountId, peerId: command.peerId }, fp2 = fingerprint(business2);
        const old = this.commits.find((x) => x.operationId === command.operationId);
        if (old) {
          if (old.kind !== "bind-qq" || old.fingerprint !== fp2) fail7("OPERATION_CONFLICT");
          return this.receipt(old);
        }
        if (command.expectedRevision !== this.revision) fail7("REVISION_CONFLICT");
        if (command.expectedBindingVersion !== (this.snapshot.qqBinding?.version ?? 0)) fail7("QQ_BINDING_VERSION_CONFLICT");
        const binding = { bindingId: BindingId("qq-" + this.roleId), version: BindingVersion((this.snapshot.qqBinding?.version ?? 0) + 1), connectionId: command.connectionId, accountId: command.accountId, peerId: command.peerId, activatedRevision: HomeRevision(this.revision + 1) };
        return this.append("bind-qq", command.operationId, fp2, { binding: await this.put(binding) });
      }
      if (command.kind === "create") {
        text(command.core);
        settings(command.settings);
        business = { kind: "create", core: command.core, settings: command.settings };
      } else if (command.kind === "edit-core") {
        text(command.text);
        business = { kind: command.kind, text: command.text };
      } else if (command.kind === "edit-settings") {
        settings(command.settings);
        business = { kind: command.kind, settings: command.settings };
      } else if (command.kind === "set-autonomy-pause") {
        if (typeof command.paused !== "boolean" || !Number.isFinite(Date.parse(command.at))) fail7("INVALID_AUTONOMY_PAUSE");
        const prior = this.commits.find((c) => c.operationId === command.operationId);
        if (prior) {
          if (prior.kind !== "set-autonomy-pause") fail7("OPERATION_CONFLICT");
          const stored = JSON.parse(await this.managedText(prior.data.payload));
          if (stored.kind !== "set-autonomy-pause") fail7("OPERATION_CONFLICT");
          const fact2 = { kind: "set-autonomy-pause", paused: stored.paused, at: stored.at };
          return this.conversationCommit(command.operationId, { kind: fact2.kind, paused: fact2.paused }, fact2);
        }
        if (command.paused === !!this.conversation.autonomy.pausedAt) fail7("AUTONOMY_PAUSE_UNCHANGED");
        const fact = { kind: "set-autonomy-pause", paused: command.paused, at: command.at };
        return this.conversationCommit(command.operationId, { kind: fact.kind, paused: fact.paused }, fact, command.expectedRevision);
      } else if (command.kind === "edit-autonomy-rules") {
        if (!validAutonomyRules(command.value)) fail7("INVALID_AUTONOMY_RULES");
        const replay = this.commits.some((x) => x.operationId === command.operationId);
        if (!replay && command.expectedAutonomyRulesVersion !== this.conversation.autonomy.rules.version) fail7("AUTONOMY_RULES_VERSION_CONFLICT");
        if (!replay && command.clock) {
          const problem = clockProblem(this.conversation.autonomy, command.clock);
          if (problem) fail7(problem);
        }
        const priorRules = this.conversation.autonomy.rules.value, window = this.conversation.autonomy.windows.at(-1);
        const transition = replay || command.value.timeZone === priorRules.timeZone || !window || !command.clock ? void 0 : transitionIanaWindow(window, command.value, command.clock.utc, command.clock.dataVersion);
        const fact = { kind: "edit-autonomy-rules", value: command.value, version: AutonomyRulesVersion(this.conversation.autonomy.rules.version + 1), ...transition ? { transition: transition.transition, clock: command.clock } : {} };
        return this.conversationCommit(command.operationId, { kind: command.kind, value: command.value }, { ...fact }, command.expectedRevision);
      } else if (command.kind === "review-autonomy-clock") {
        const block = this.conversation.autonomy.clockBlocked ?? fail7("CLOCK_NOT_BLOCKED");
        const reading = command.clock;
        if (!reading) fail7("CLOCK_UNAVAILABLE");
        const problem = clockProblem({ ...this.conversation.autonomy, clockBlocked: void 0 }, reading);
        if (problem) fail7(problem);
        const reviewed = { kind: "clock-reviewed", clock: reading, review: "trusted-owner", previousBlock: block };
        return this.conversationCommit(command.operationId, { kind: command.kind, previousBlock: block }, reviewed, command.expectedRevision);
      } else if (command.kind === "edit-file-access") {
        if (!validateEditFileAccess(command)) fail7("INVALID_FILE_ACCESS");
        if (!this.commits.some((commit) => commit.operationId === command.operationId) && command.expectedFileAccessVersion !== this.conversation.fileAccess.version) fail7("FILE_ACCESS_VERSION_CONFLICT");
        const value = admitFileAccess(command.value);
        return this.conversationCommit(command.operationId, { kind: command.kind, value }, { kind: command.kind, value, version: FileAccessVersion(this.conversation.fileAccess.version + 1) }, command.expectedRevision);
      } else if (command.kind === "edit-file-rules") {
        if (!validateFileRules(command.value)) fail7("INVALID_FILE_RULES");
        if (!this.commits.some((x) => x.operationId === command.operationId) && command.expectedFileRulesVersion !== this.conversation.fileRules.version) fail7("FILE_RULES_VERSION_CONFLICT");
        const value = { maxTextBytes: command.value.maxTextBytes, listPageSize: command.value.listPageSize, recursiveEntries: command.value.recursiveEntries, operationTimeoutMs: command.value.operationTimeoutMs };
        return this.conversationCommit(command.operationId, { kind: command.kind, value }, { kind: "edit-file-rules", value, version: FileRulesVersion(this.conversation.fileRules.version + 1) }, command.expectedRevision);
      } else if (command.kind === "resolve-delivery") {
        if (!validateResolveDelivery(command)) fail7("INVALID_DELIVERY_RESOLUTION");
        const { expectedRevision, expectedQQBindingVersion, expectedDeliveryRulesVersion, operationId, kind, ...choice } = command;
        const old = this.commits.find((c) => c.operationId === operationId);
        if (old) {
          if (old.kind !== kind || old.fingerprint !== fingerprint({ kind, ...choice })) fail7("OPERATION_CONFLICT");
          return this.receipt(old);
        }
        if (command.expectedDeliveryRulesVersion !== this.conversation.deliveryRules.version) fail7("DELIVERY_RULES_VERSION_CONFLICT");
        if (command.expectedQQBindingVersion !== this.snapshot.qqBinding?.version) fail7("QQ_BINDING_VERSION_CONFLICT");
        const original = this.conversation.deliveries.find((d) => d.deliveryId === command.deliveryId), attempt = this.conversation.sendAttempts.find((a) => a.sendAttemptId === command.sendAttemptId);
        if (!original || !attempt || original.sendAttemptId !== attempt.sendAttemptId || !attempt.observation || !["unknown", "rejected"].includes(original.status)) fail7("DELIVERY_NOT_RESOLVABLE");
        if (command.decision === "resend" && original.qualification === "contact") fail7("CONTACT_NOT_RESOLVABLE");
        if (command.decision === "resend" && this.conversation.deliveryResolutions.some((x) => x.deliveryId === original.deliveryId && x.newDeliveryId)) fail7("DELIVERY_ALREADY_REISSUED");
        if (command.decision === "resend" && !sameQQTarget(this.snapshot.qqBinding, original.target)) fail7("QQ_BINDING_CHANGED");
        const delivery = command.decision === "resend" ? prepareRedelivery(this.conversation.replies.find((r) => r.replyId === original.replyId), original, this.conversation.deliveryRules, HomeRevision(this.revision + 1), operationId) : void 0;
        const resolution = { ...choice, operationId, committedRevision: HomeRevision(this.revision + 1), ...delivery ? { newDeliveryId: delivery.deliveryId } : {} };
        return this.conversationCommit(operationId, { kind, ...choice }, { kind, resolution, ...delivery ? { delivery } : {} }, expectedRevision);
      } else if (command.kind === "edit-delivery-rules") {
        if (!validateDeliveryRules(command.value)) fail7("INVALID_DELIVERY_RULES");
        if (!this.commits.some((x) => x.operationId === command.operationId) && command.expectedDeliveryRulesVersion !== this.conversation.deliveryRules.version) fail7("DELIVERY_RULES_VERSION_CONFLICT");
        const value = { previewCodePoints: command.value.previewCodePoints, sendTimeoutMs: command.value.sendTimeoutMs }, version2 = DeliveryRulesVersion(this.conversation.deliveryRules.version + 1), revision = HomeRevision(this.revision + 1);
        const replacements = this.conversation.deliveries.filter((d) => d.status === "pending").flatMap((d) => {
          if (d.qualification === "contact") {
            const intent = d.contactIntentId ? this.conversation.contact.intents.find((intent2) => intent2.intentId === d.contactIntentId) : void 0, record = intent && this.conversation.knowledge.versions.find((version3) => version3.knowledgeId === intent.knowledgeId && version3.version === intent.knowledgeVersion);
            if (!record || !intent) return [];
            const text2 = previewDelivery("contact", String(record.text), value.previewCodePoints);
            return text2 === d.text ? [] : [{ ...d, deliveryId: DeliveryId("delivery-" + createHash9("sha256").update(command.operationId + ":" + d.deliveryId).digest("hex")), text: text2, rulesVersion: version2, committedRevision: revision, supersedes: d.deliveryId }];
          }
          const reply = this.conversation.replies.find((r) => r.replyId === d.replyId);
          if (!reply) return [];
          return previewReply(reply.text, value.previewCodePoints) === d.text ? [] : [{ ...prepareDelivery(reply, d.target, { value, version: version2 }, revision, d.deliveryId, command.operationId), ...d.retryOf ? { retryOf: d.retryOf, resolutionOperationId: d.resolutionOperationId } : {} }];
        });
        return this.conversationCommit(command.operationId, { kind: command.kind, value }, { kind: "edit-delivery-rules", value, version: version2, replacements }, command.expectedRevision);
      } else if (command.kind === "edit-web-rules") {
        if (!validateWebRules(command.value)) fail7("INVALID_WEB_RULES");
        if (!this.commits.some((x) => x.operationId === command.operationId) && command.expectedWebRulesVersion !== this.conversation.webRules.version) fail7("WEB_RULES_VERSION_CONFLICT");
        return this.conversationCommit(command.operationId, { kind: command.kind, value: command.value }, { kind: "edit-web-rules", value: command.value, version: WebRulesVersion(this.conversation.webRules.version + 1) }, command.expectedRevision);
      } else if (command.kind === "edit-proposal-rules") {
        if (!validateProposalRules(command.value)) fail7("INVALID_PROPOSAL_RULES");
        if (!this.commits.some((x) => x.operationId === command.operationId) && command.expectedProposalRulesVersion !== this.conversation.proposalRules.version) fail7("PROPOSAL_RULES_VERSION_CONFLICT");
        return this.conversationCommit(command.operationId, { kind: command.kind, value: command.value }, { kind: "edit-proposal-rules", value: command.value, version: ProposalRulesVersion(this.conversation.proposalRules.version + 1) }, command.expectedRevision);
      } else if (command.kind === "edit-retry-rules") {
        if (!validateRetryRules(command.value)) fail7("INVALID_RETRY_RULES");
        if (!this.commits.some((x) => x.operationId === command.operationId) && command.expectedRetryRulesVersion !== this.conversation.retryRules.version) fail7("RETRY_RULES_VERSION_CONFLICT");
        const value = { maxAutomaticRetries: command.value.maxAutomaticRetries, retryDelayMs: command.value.retryDelayMs };
        return this.conversationCommit(command.operationId, { kind: command.kind, value }, { kind: "edit-retry-rules", value, version: RetryRulesVersion(this.conversation.retryRules.version + 1) }, command.expectedRevision);
      } else if (command.kind === "edit-contact-rules") {
        if (!validateContactRules(command.value)) fail7("INVALID_CONTACT_RULES");
        if (!this.commits.some((x) => x.operationId === command.operationId) && command.expectedContactRulesVersion !== this.conversation.contactRules.version) fail7("CONTACT_RULES_VERSION_CONFLICT");
        const value = { cooldownMs: command.value.cooldownMs, dailyLimit: command.value.dailyLimit, perRoundLimit: command.value.perRoundLimit, quietHours: { ...command.value.quietHours } };
        return this.conversationCommit(command.operationId, { kind: command.kind, value }, { kind: "edit-contact-rules", value, version: ContactRulesVersion(this.conversation.contactRules.version + 1) }, command.expectedRevision);
      } else if (command.kind === "edit-read-rules") {
        if (!validateReadRules(command.value)) fail7("INVALID_READ_RULES");
        if (!this.commits.some((x) => x.operationId === command.operationId) && command.expectedReadRulesVersion !== this.conversation.readRules.version) fail7("READ_RULES_VERSION_CONFLICT");
        const value = { toolConcurrency: command.value.toolConcurrency, displayCodePoints: command.value.displayCodePoints, readTimeoutMs: command.value.readTimeoutMs };
        return this.conversationCommit(command.operationId, { kind: command.kind, value }, { kind: "edit-read-rules", value, version: ReadRulesVersion(this.conversation.readRules.version + 1) }, command.expectedRevision);
      } else if (command.kind === "edit-conversation") {
        if (!validateConversationSettings(command.value)) fail7("INVALID_CONVERSATION_SETTINGS");
        if (!this.commits.some((x) => x.operationId === command.operationId) && command.expectedConversationVersion !== this.conversation.rules.version) fail7("CONVERSATION_VERSION_CONFLICT");
        return this.conversationCommit(command.operationId, { kind: command.kind, value: command.value }, { kind: "edit-conversation", value: command.value, version: ConversationVersion(this.conversation.rules.version + 1) }, command.expectedRevision);
      } else if (command.kind === "attach-home")
        business = { kind: command.kind, roleId: command.roleId };
      else if (command.kind === "register-home")
        business = { kind: command.kind, targetOperationId: command.targetOperationId };
      else
        return fail7("UNSUPPORTED_COMMAND");
      const fp = fingerprint(business);
      if (this.uncertain) {
        if (command.operationId !== this.uncertain)
          fail7("IO_UNCERTAIN");
        await this.load();
        await syncDir3(join4(this.storagePath, "commits"));
        await this.syncHead(command.operationId);
        this.uncertain = null;
      }
      const existing = this.commits.find((x) => x.operationId === command.operationId);
      if (existing) {
        if (existing.fingerprint !== fp)
          fail7("OPERATION_CONFLICT");
        this.snapshot = { ...this.snapshot, projection: await this.projection(true) };
        return this.receipt(existing);
      }
      if (command.kind === "create")
        return fail7("CREATE_CONFLICT");
      if (command.kind === "attach-home") {
        if (command.roleId !== this.roleId)
          fail7("IDENTITY_CONFLICT");
        return this.append(command.kind, command.operationId, fp, { roleId: this.roleId });
      }
      if (command.kind === "register-home") {
        if (!this.commits.some((x) => x.operationId === command.targetOperationId && (x.kind === "create" || x.kind === "attach-home")))
          fail7("IDENTITY_CONFLICT");
        return this.append(command.kind, command.operationId, fp, { targetOperationId: command.targetOperationId });
      }
      if (command.expectedRevision !== this.revision)
        fail7("REVISION_CONFLICT");
      if (command.kind === "edit-core") {
        if (command.expectedCoreVersion !== this.snapshot.core.version)
          fail7("CORE_VERSION_CONFLICT");
        return this.append(command.kind, command.operationId, fp, { core: await this.put({ text: command.text }), coreVersion: CoreVersion(this.snapshot.core.version + 1) });
      }
      if (command.expectedSettingsVersion !== this.snapshot.settings.version)
        fail7("SETTINGS_VERSION_CONFLICT");
      return this.append(command.kind, command.operationId, fp, { settings: await this.put(command.settings), settingsVersion: InputSettingsVersion(this.snapshot.settings.version + 1) });
    }).finally(() => {
      if (dependencyChange) this.pendingOwnerChanges--;
    });
  }
  close() {
    return this.run(async () => {
      if (this.uncertain)
        fail7("IO_UNCERTAIN");
      await this.release();
      this.closed = true;
    });
  }
};
async function identityAt(path, recover = false, validateAliases = false) {
  const value = await jsonFile(join4(path, "identity.json"), recover, validateAliases);
  exact2(value, ["formatMajor", "formatMinor", "roleId", "creationOperationId", "creationFingerprint"]);
  const format = admitRootFormat({ major: value.formatMajor, minor: value.formatMinor });
  if (typeof value.roleId !== "string" || !/^role-[0-9a-f-]{36}$/.test(value.roleId) || typeof value.creationOperationId !== "string" || typeof value.creationFingerprint !== "string" || !/^[a-f0-9]{64}$/.test(value.creationFingerprint))
    fail7("CORRUPT_HOME");
  return { format, roleId: RoleId(value.roleId), creationOperationId: op(value.creationOperationId), creationFingerprint: String(value.creationFingerprint) };
}
function backupStore(path, roleId, io = {}, releaseAccess) {
  return new BackupStore(path, roleId, { io, releaseAccess, acquire: () => acquire(path, io, ".maintenance.lock"), validate: validateBackupAuthority });
}
async function openRoleHome(input, options = {}) {
  return openWriterHome(input, options, false);
}
async function openWriterHome(input, options, maintenanceRecovery) {
  const path = await canonicalPath(input);
  await directory2(path);
  if (await realpath3(path) !== path) fail7("UNSAFE_PATH");
  const releaseAccess = await acquire(path, options.io, ".maintenance.lock");
  let releaseWriter;
  try {
    const identity = await identityAt(path, false, true);
    if (options.expectedRoleId !== void 0 && identity.roleId !== options.expectedRoleId) fail7("IDENTITY_CONFLICT");
    const backups = backupStore(path, identity.roleId, options.io, releaseAccess), pending = await backups.pending();
    if (pending.length && (!maintenanceRecovery || pending.some((record) => record.sourceRevision !== void 0))) fail7("MAINTENANCE_PENDING");
    releaseWriter = await acquire(path, options.io);
    const writerRelease = releaseWriter;
    const home = new DiskHome(path, identity, async () => {
      await writerRelease();
      await backups.writerClosed();
    }, options.io ?? {}, true, backups);
    await new DiskHome(path, identity, async () => {
    }, {}, false).load();
    await identityAt(path, true);
    await home.load();
    await home.syncStorage();
    await home.syncHead();
    return home;
  } catch (error) {
    if (releaseWriter) await releaseWriter();
    await releaseAccess();
    throw error;
  }
}
async function validateBackupAuthority(path, roleId) {
  const identity = await identityAt(path, false, true);
  if (identity.roleId !== roleId) fail7("IDENTITY_CONFLICT");
  const home = new DiskHome(path, identity, async () => {
  }, {}, false);
  await home.load();
  const status = home.formatStatus();
  return { mode: "healthy", reason: "AUTHORITY_VERIFIED", verifiedRoleId: home.roleId, verifiedRevision: home.revision, verifiedFormat: { major: status.format.major, minor: status.format.minor }, stops: home.stopSnapshots(), maintenanceSnapshots: home.restoredMaintenanceSnapshotFacts() };
}
async function verifyRoleBackup(destination, options = {}) {
  return verifyBackup(destination, options, validateBackupAuthority);
}
function restoreRoleBackup(request, io = {}) {
  return restoreBackup(request, { validate: validateBackupAuthority, acquire: (destination) => acquire(destination, io, ".maintenance.lock"), io });
}
function readRoleRestore(destination, request) {
  return readRestore(destination, request);
}
async function readBackupMaintenance(destination, options = {}) {
  return readMaintenance(destination, options, validateBackupAuthority);
}
async function createRoleHome(input, request, io = {}) {
  op(request.operationId);
  text(request.core);
  settings(request.settings);
  const path = await canonicalPath(input);
  const fp = fingerprint({ kind: "create", core: request.core, settings: request.settings });
  let created = false;
  try {
    await mkdir3(path, { mode: 448 });
    created = true;
    await syncDir3(dirname4(path));
  } catch (e) {
    if (e.code !== "EEXIST")
      throw e;
  }
  if (created) {
    for (const name of ["commits", "blobs", "views"])
      await mkdir3(join4(path, name), { mode: 448 });
    await publish2(join4(path, "identity.json"), canonicalBytes({ formatMajor: HOME_CURRENT_FORMAT.major, formatMinor: HOME_CURRENT_FORMAT.minor, roleId: RoleId("role-" + randomUUID3()), creationOperationId: request.operationId, creationFingerprint: fp }), async () => io.barrier?.("after-identity-publish", { operationId: request.operationId, revision: HomeRevision(0) }));
    await syncDir3(path);
  }
  await directory2(path);
  if (await realpath3(path) !== path)
    fail7("UNSAFE_PATH");
  const releaseAccess = await acquire(path, io, ".maintenance.lock");
  let releaseWriter;
  try {
    const identity = await identityAt(path, true);
    const backups = backupStore(path, identity.roleId, io, releaseAccess);
    if ((await backups.pending()).length) fail7("MAINTENANCE_PENDING");
    releaseWriter = await acquire(path, io);
    const writerRelease = releaseWriter;
    const release = async () => {
      await writerRelease();
      await backups.writerClosed();
    };
    if (identity.creationOperationId !== request.operationId || identity.creationFingerprint !== fp)
      fail7("CREATE_CONFLICT");
    await initializeHead(path, identity.roleId);
    const home = new DiskHome(path, identity, release, io, true, backups);
    try {
      await home.load();
      await syncDir3(join4(path, "commits"));
      await home.syncHead(request.operationId);
    } catch (e) {
      if (!(e instanceof HomeError) || e.code !== "INCOMPLETE_HOME")
        throw e;
      await home.initialize(request);
    }
    return home;
  } catch (e) {
    if (releaseWriter) await releaseWriter();
    await releaseAccess();
    throw e;
  }
}
async function diagnoseRoleHome(input, options = {}) {
  let claimedRoleId = null;
  let claimedFormat;
  const evidence = [];
  let path;
  try {
    path = await canonicalPath(input);
    await directory2(path);
    if (await realpath3(path) !== path) fail7("UNSAFE_PATH");
    let generation;
    try {
      const head = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await safeBytes2(join4(path, "head.json"), false, true)));
      const id = head.storage?.id;
      if (typeof id === "string" && /^generation-[a-f0-9]{64}$/.test(id)) generation = id;
    } catch {
    }
    const areas = generation ? ["", "content-generations/" + generation + "/commits", "content-generations/" + generation + "/blobs", "content-generations/" + generation + "/views", "content-generations/" + generation + "/projection-progress", "commits", "blobs"] : ["", "commits", "blobs"];
    for (const area of areas) {
      let names;
      try {
        if (area) await directory2(join4(path, area));
        names = area ? (await readdir3(join4(path, area))).filter((name) => !name.startsWith(".")).sort() : ["identity.json", "head.json"];
      } catch {
        continue;
      }
      for (const name of names) {
        if (evidence.length >= 2048) break;
        const relative2 = area ? area + "/" + name : name;
        try {
          const bytes2 = await safeBytes2(join4(path, relative2), false, true);
          evidence.push({ file: relative2, digest: digest(bytes2), bytes: bytes2.length });
        } catch {
        }
      }
    }
    try {
      const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await safeBytes2(join4(path, "identity.json"), false, true)));
      if (typeof value.roleId === "string" && /^role-[0-9a-f-]{36}$/.test(value.roleId)) claimedRoleId = value.roleId;
      if (Number.isSafeInteger(value.formatMajor) && Number.isSafeInteger(value.formatMinor)) claimedFormat = { major: Number(value.formatMajor), minor: Number(value.formatMinor) };
    } catch {
    }
    const identity = await identityAt(path, false, true);
    if (options.expectedRoleId !== void 0 && identity.roleId !== options.expectedRoleId) fail7("IDENTITY_CONFLICT");
    let floor;
    try {
      floor = await readHead(path, identity.roleId);
    } catch {
    }
    const home = new DiskHome(path, identity, async () => {
    }, {}, false);
    await home.load(floor);
    return { mode: "healthy", reason: "AUTHORITY_VERIFIED", claimedRoleId, format: { major: home.formatStatus().format.major, minor: home.formatStatus().format.minor }, verifiedRoleId: home.roleId, verifiedRevision: home.revision, recovery: [], evidence };
  } catch (error) {
    const reason = error instanceof HomeError ? error.code : error.code === "ENOENT" ? "MISSING_AUTHORITY" : "HOME_UNREADABLE";
    return { mode: "read-only", reason, claimedRoleId, claimedFormat, verifiedRoleId: null, verifiedRevision: null, recovery: ["retry-open", "inspect-validated-backup"], evidence };
  }
}
async function openRoleHomeForRuntime(input, options = {}) {
  const diagnostic = await diagnoseRoleHome(input, options);
  if (diagnostic.mode === "read-only") return { kind: "diagnostic", readDiagnostic: async () => structuredClone(diagnostic), close: async () => {
  } };
  try {
    return await openWriterHome(input, options, true);
  } catch (error) {
    const current = await diagnoseRoleHome(input, options);
    const openingReason = error instanceof HomeError ? error.code : "HOME_UNREADABLE";
    return { kind: "diagnostic", ...current.verifiedRoleId ? { backups: backupStore(await canonicalPath(input), current.verifiedRoleId, options.io) } : {}, readDiagnostic: async () => ({ ...current, mode: "read-only", reason: current.mode === "healthy" ? openingReason : current.reason, recovery: ["retry-open", "inspect-validated-backup"] }), close: async () => {
    } };
  }
}
export {
  AttemptId,
  AutonomyRulesVersion,
  BackupManifestDigest,
  BindingId,
  BindingVersion,
  ContactIntentId,
  ContactRulesVersion,
  ContextGeneration,
  ConversationVersion,
  CoreVersion,
  DayWindowId,
  DeliveryId,
  DeliveryRulesVersion,
  ExperienceId,
  FileAccessVersion,
  FileGrantId,
  FileRulesVersion,
  FileTag,
  HOME_CURRENT_FORMAT,
  HOME_FORMATS,
  HOME_UPGRADE_TARGET,
  HandoverId,
  HomeError,
  HomeRevision,
  InputGroupId,
  InputId,
  InputKey,
  InputSettingsVersion,
  IntentId,
  KnowledgeId,
  KnowledgeVersion,
  LogicalOpId,
  MaterialId,
  NativeExposureId,
  NativeRecordRef,
  OperationId,
  ProposalId,
  ProposalRulesVersion,
  QQAccountId,
  QQConnectionId,
  QQHistoryCandidateId,
  QQHistoryQueryId,
  QQHistoryRequestId,
  QQMessageId,
  QQPeerId,
  ReadRulesVersion,
  ReplyId,
  RetryRulesVersion,
  RoleId,
  RunId,
  SendAttemptId,
  WebRulesVersion,
  activeKnowledgeVersions,
  admitDelivery,
  admitFileAccess,
  admitProposedKnowledge,
  admitQQBinding,
  admitQQInputSource,
  appendWindow,
  applyQQHistoryFact,
  archivedFileContentAllowed,
  assessKnowledgeProposal,
  autonomyDefaults,
  canonicalBytes,
  canonicalProposalRecorded,
  canonicalProposalSucceeded,
  clockProblem,
  contactBlocked,
  contactIntentOpen,
  contactRoundUsed,
  contactRulesDefaults,
  correctedSourceReused,
  createKnowledgeRollback,
  createRoleHome,
  deliveryRulesDefaults,
  diagnoseRoleHome,
  directUserReport,
  effectiveAutonomyDay,
  emptyContact,
  emptyKnowledge,
  emptyQQHistory,
  fileAccessDefaults,
  fileRulesDefaults,
  historyDigest,
  historyInputOperation,
  initialAutonomy,
  initialContactRules,
  initialDeliveries,
  initialFileAccess,
  knowledgeRollbackCommand,
  knowledgeSourceBasis,
  knowledgeSourceRequirements,
  localMinutes,
  longContactMarker,
  longReplyMarker,
  minimumPreviewCodePoints,
  minimumReadDisplayCodePoints,
  nextGridSlot,
  nextResetUtc,
  nextSlotAfter,
  openRoleHome,
  openRoleHomeForRuntime,
  ordinaryHomeRoots,
  ownerActionSourceReused,
  parseKnowledgeProposal,
  parseKnowledgeRollback,
  plainExact,
  prepareContactDelivery,
  prepareDelivery,
  prepareRedelivery,
  previewContact,
  previewDelivery,
  previewReply,
  previewText,
  proposalClaim,
  proposalQuotePresent,
  proposalRulesDefaults,
  protectedHomeEntries,
  qqHistoryBusiness,
  qqInputIdentity,
  quietHoursActive,
  readBackupMaintenance,
  readRoleRestore,
  readRulesDefaults,
  restoreRoleBackup,
  retainedHomeEntries,
  retryRulesDefaults,
  rollbackKnowledgeBusiness,
  rollbackKnowledgePair,
  sameQQTarget,
  scheduleBase,
  temporaryHomeRootPrefixes,
  transitionIanaWindow,
  unchangedKnowledge,
  validAutonomyRules,
  validContactStamp,
  validQQHistoryPolicy,
  validResolutionDecision,
  validSchedule,
  validateBindQQ,
  validateContactRules,
  validateConversationSettings,
  validateDeliveryRules,
  validateEditFileAccess,
  validateFileAccess,
  validateFileRules,
  validateHistoryInput,
  validateInputSettings,
  validateProposalRules,
  validateReadRules,
  validateResolveDelivery,
  validateRetryRules,
  validateWebRules,
  verifyRoleBackup,
  wakeBlocked
};
