// packages/companion/src/runtime/restore-registration.ts
import { createHash } from "node:crypto";

// packages/companion/src/home/ids.ts
var ContractError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};
function token(value, code, pattern = /^[a-zA-Z0-9_-]{1,128}$/) {
  if (typeof value !== "string" || !pattern.test(value)) throw new ContractError(code);
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
function OperationId(value) {
  return token(value, "INVALID_OPERATION_ID");
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
function HomeRevision(value) {
  return version(value, 0);
}
function BindingVersion(value) {
  return version(value, 1);
}
function LogicalOpId(value) {
  return token(value, "INVALID_LOGICAL_OP_ID", /^logical-[0-9a-f-]{36}$/);
}
function BackupManifestDigest(value) {
  return token(value, "INVALID_BACKUP_MANIFEST_DIGEST", /^[a-f0-9]{64}$/);
}
function KnowledgeId(value) {
  return token(value, "INVALID_KNOWLEDGE_ID", /^knowledge-[A-Za-z0-9_-]+$/);
}
function KnowledgeVersion(value) {
  return version(value, 0);
}
function DayWindowId(value) {
  return token(value, "INVALID_DAY_WINDOW_ID", /^day-[0-9a-f]{64}$/);
}
function HandoverId(value) {
  return token(value, "INVALID_HANDOVER_ID", /^handover-[a-f0-9]{64}$/);
}

// packages/companion/src/runtime/restore-registration.ts
function restoreRegistrationIds(acceptanceOperationId) {
  const attachOperationId = OperationId("restore-attach-" + createHash("sha256").update(OperationId(acceptanceOperationId)).digest("hex"));
  return { attachOperationId, registrationOperationId: OperationId("registration-" + createHash("sha256").update(attachOperationId).digest("hex")) };
}

// packages/companion/src/home/errors.ts
var HomeError = class extends Error {
  constructor(code, message = code, operationId) {
    super(message);
    this.code = code;
    this.operationId = operationId;
  }
};

// packages/companion/src/home/restore-acceptance.ts
var restoreInputEligible = (accepted, input) => !accepted || input.receiveSequence > accepted.inputSequence;
var restoreRunEligible = (accepted, runId) => !accepted || !accepted.inheritedRunIds.includes(runId);
var restoreRevisionEligible = (accepted, revision) => !accepted || revision > accepted.sourceRevision;
function restoreDeliveryEligible(accepted, delivery, state) {
  if (!accepted) return true;
  const reply = state.replies.find((reply2) => reply2.replyId === delivery.replyId);
  if (reply && reply.committedRevision > accepted.sourceRevision) return true;
  const resolution = state.deliveryResolutions.find((resolution2) => resolution2.operationId === delivery.resolutionOperationId);
  return !!resolution && resolution.decision === "resend" && resolution.committedRevision > accepted.sourceRevision && resolution.deliveryId === delivery.retryOf && !!resolution.newDeliveryId;
}

// packages/companion/src/runtime/clock.ts
import { randomUUID, createHash as createHash2 } from "node:crypto";

// packages/companion/src/home/iana.ts
var formats = /* @__PURE__ */ new Map();
var clockFormats = /* @__PURE__ */ new Map();
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
function wallClock(timeZone) {
  let f = clockFormats.get(timeZone);
  if (!f) {
    if (typeof timeZone !== "string" || !timeZone || /^[+-]/.test(timeZone)) throw Error("IANA_TIME_ZONE_UNAVAILABLE");
    try {
      f = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, calendar: "iso8601", numberingSystem: "latn" });
    } catch {
      throw Error("IANA_TIME_ZONE_UNAVAILABLE");
    }
    clockFormats.set(timeZone, f);
  }
  return f;
}
function dateKey(ms, timeZone) {
  const parts = calendar(timeZone).formatToParts(new Date(ms)), get = (type) => parts.find((p) => p.type === type).value;
  return get("year") + "-" + get("month") + "-" + get("day");
}
function ianaLocalMinutes(utcOrMs, timeZone) {
  const ms = typeof utcOrMs === "number" ? utcOrMs : Date.parse(utcOrMs);
  if (!Number.isFinite(ms)) throw Error("CLOCK_UNAVAILABLE");
  const parts = wallClock(timeZone).formatToParts(new Date(ms)), get = (type) => {
    const part = parts.find((entry) => entry.type === type);
    if (!part) throw Error("IANA_TIME_ZONE_UNAVAILABLE");
    return part.value;
  };
  const hour = Number(get("hour")), minute = Number(get("minute"));
  if (!Number.isSafeInteger(hour) || hour < 0 || hour > 23 || !Number.isSafeInteger(minute) || minute < 0 || minute > 59) throw Error("IANA_TIME_ZONE_UNAVAILABLE");
  return { localDate: get("year") + "-" + get("month") + "-" + get("day"), localMinutes: hour * 60 + minute };
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

// packages/companion/src/runtime/clock.ts
function ianaWindowId(startUtc, endUtc, timeZone, dataVersion) {
  return DayWindowId("day-" + createHash2("sha256").update(JSON.stringify({ startUtc, endUtc, timeZone, dataVersion })).digest("hex"));
}
function ianaDay(utc, timeZone, dataVersion) {
  const { startUtc, endUtc, localDate } = ianaDayBounds(utc, timeZone, dataVersion);
  return { windowId: ianaWindowId(startUtc, endUtc, timeZone, dataVersion), startUtc, endUtc, localDate, timeZone, dataVersion };
}
function createNodeClock(now = () => /* @__PURE__ */ new Date()) {
  const processId = randomUUID(), dataVersion = process.versions.tz && process.versions.icu ? "node-icu:" + process.versions.icu + "/tz:" + process.versions.tz : "";
  return Object.freeze({ read() {
    if (!dataVersion) throw Error("IANA_DATA_UNAVAILABLE");
    return { utc: now().toISOString(), monotonicMs: Math.floor(performance.now()), processId, dataVersion };
  }, day(utc, timeZone) {
    if (!dataVersion) throw Error("IANA_DATA_UNAVAILABLE");
    return ianaDay(utc, timeZone, dataVersion);
  }, local(utc, timeZone) {
    if (!dataVersion) throw Error("IANA_DATA_UNAVAILABLE");
    return ianaLocalMinutes(utc, timeZone);
  } });
}

// packages/companion/src/home/autonomy.ts
var autonomyDefaults = Object.freeze({ modelLimit: 4, toolLimit: 8, webLimit: 3, dailyModelLimit: 24, dailyToolLimit: 48, dailyWebLimit: 12, windowMs: 3e5, outputTokens: 2048, timeZone: "Asia/Shanghai", wakeIntervalMs: 36e5 });
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
function effectiveAutonomyDay(state, reading, day) {
  const last = state.windows.at(-1);
  if (!last || last.dataVersion !== reading.dataVersion || last.timeZone !== state.rules.value.timeZone) return day;
  const at = Date.parse(reading.utc);
  if (!(at >= Date.parse(last.startUtc) && at < Date.parse(last.endUtc))) return day;
  return { windowId: last.windowId, startUtc: last.startUtc, endUtc: last.endUtc, localDate: last.localDate, timeZone: last.timeZone, dataVersion: last.dataVersion };
}
function wakeBlocked(state, stamp) {
  const problem = clockProblem(state, stamp.clock);
  if (problem) return problem;
  if (state.pausedAt) return "AUTONOMY_PAUSED";
  if (state.restUntil && Date.parse(stamp.clock.utc) < Date.parse(state.restUntil)) return "AUTONOMOUS_REST";
  const v = state.rules.value, w = state.windows.find((w2) => w2.windowId === stamp.day.windowId);
  if (!v.modelLimit || !v.dailyModelLimit || (w?.used.model ?? 0) >= v.dailyModelLimit) return "AUTONOMOUS_MODEL_LIMIT";
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

// packages/companion/src/home/restores.ts
function validateRestoreRequest(value) {
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).some((key) => typeof key !== "string" || !["operationId", "backupPath", "destination", "expectedRoleId", "expectedManifestDigest"].includes(key)) || Reflect.ownKeys(value).length !== 5) return false;
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
function sameRestoreRequest(left, right) {
  return left.operationId === right.operationId && left.backupPath === right.backupPath && left.destination === right.destination && left.expectedRoleId === right.expectedRoleId && left.expectedManifestDigest === right.expectedManifestDigest;
}

// packages/companion/src/runtime/execution.ts
var ExecutionError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};
var safeExecutionCode = (error) => error instanceof ExecutionError ? error.code : error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Z][A-Z0-9_]{1,63}$/.test(error.code) ? error.code : "EXECUTION_FAILED";

// packages/companion/src/runtime/restore.ts
function createRestoreRuntime(port, canRequest) {
  const calls = /* @__PURE__ */ new Map(), pending = /* @__PURE__ */ new Set();
  async function read(destination, request2) {
    OperationId(request2.operationId);
    RoleId(request2.expectedRoleId);
    if (!port) throw new ExecutionError("RESTORE_UNAVAILABLE");
    const live = calls.get(request2.operationId);
    if (live && (live.request.destination !== destination || live.request.expectedRoleId !== request2.expectedRoleId)) throw new ExecutionError("RESTORE_IDENTITY_CONFLICT");
    const saved = await port.read(destination, request2);
    if ((saved.phase === "copying" || saved.phase === "verifying") && (!live || !pending.has(live.task))) return { ...saved, phase: "uncertain", error: "RESTORE_RECONCILIATION_REQUIRED" };
    return saved.phase === "not-found" && live ? structuredClone(live.progress) : saved;
  }
  async function request(raw) {
    if (!validateRestoreRequest(raw)) throw new ExecutionError("INVALID_RESTORE_REQUEST");
    if (!port) throw new ExecutionError("RESTORE_UNAVAILABLE");
    const owned = Object.freeze({ ...raw }), previous = calls.get(owned.operationId);
    if (previous) {
      if (!sameRestoreRequest(previous.request, owned)) throw new ExecutionError("OPERATION_CONFLICT");
      if (pending.has(previous.task) || (previous.progress.phase === "awaiting-handover" || previous.progress.phase === "accepted")) return previous.task;
    }
    if (!canRequest()) throw new ExecutionError("RESTORE_ADMISSION_CLOSED");
    const call = { request: owned, progress: { operationId: owned.operationId, roleId: owned.expectedRoleId, backupPath: owned.backupPath, destination: owned.destination, manifestDigest: owned.expectedManifestDigest, phase: "copying", files: [], copiedFiles: 0, verifiedFiles: 0 }, task: Promise.resolve({ operationId: owned.operationId, roleId: owned.expectedRoleId, backupPath: owned.backupPath, destination: owned.destination, phase: "copying", files: [], copiedFiles: 0, verifiedFiles: 0 }) };
    call.task = Promise.resolve().then(() => port.request(owned)).then((progress) => {
      call.progress = progress;
      return structuredClone(progress);
    }, (error) => {
      call.progress = { ...call.progress, phase: "uncertain", error: safeExecutionCode(error) };
      throw error;
    });
    calls.set(owned.operationId, call);
    pending.add(call.task);
    const settle = () => pending.delete(call.task);
    void call.task.then(settle, settle);
    return call.task;
  }
  return { request, read, async drain() {
    while (pending.size) await Promise.allSettled([...pending]);
  } };
}

// packages/companion/src/home/handovers.ts
function validateHandoverRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join("|") !== "destination|expectedRevision|operationId" || !("destination" in value) || typeof value.destination !== "string" || !value.destination.startsWith("/") || value.destination.includes("\0")) return false;
  try {
    if (!("operationId" in value) || !("expectedRevision" in value)) return false;
    OperationId(value.operationId);
    HomeRevision(value.expectedRevision);
    return true;
  } catch {
    return false;
  }
}
var currentOutgoingHandover = (record, acceptedRevision) => record.requestedRevision > (acceptedRevision ?? 0);

// packages/companion/src/home/qq.ts
function plainExact(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).length !== keys.length) return false;
  return keys.every((key) => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return !!field && "value" in field;
  });
}

// packages/companion/src/home/context-tools.ts
var contextObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);
var contextField = (value, name) => contextObject(value) ? value[name] : void 0;

// packages/companion/src/home/knowledge.ts
function invalid() {
  throw new HomeError("INVALID_ROLE_PROPOSE");
}
var nonempty = (value) => typeof value === "string" && !!value.trim() && !value.includes("\0");
function admitProposalRef(value) {
  if (plainExact(value, ["kind"]) && value.kind === "core") return { kind: "core" };
  if (plainExact(value, ["kind", "id", "version"]) && value.kind === "knowledge" && Number(value.version) > 0) return { kind: "knowledge", id: KnowledgeId(value.id), version: KnowledgeVersion(value.version) };
  if (!plainExact(value, ["kind", "id"])) return invalid();
  if (value.kind === "input") return { kind: "input", id: InputId(value.id) };
  if (value.kind === "reply") return { kind: "reply", id: ReplyId(value.id) };
  if (value.kind === "tool") return { kind: "tool", id: AttemptId(value.id) };
  return invalid();
}
function knowledgeSourceBasis(source) {
  return { ref: source.ref, contentDigest: source.contentDigest, ..."committedRevision" in source && source.committedRevision !== void 0 ? { committedRevision: source.committedRevision } : {}, ..."currentRun" in source && source.currentRun ? { currentRun: source.currentRun } : {} };
}
function parseKnowledgeProposal(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  const kind = contextField(value, "kind"), extra = kind === "growth" ? ["area", "phase"] : kind === "goal" ? ["state"] : kind === "activity" ? ["decision", ...Object.hasOwn(value, "restMs") ? ["restMs"] : []] : kind === "contact" && Object.hasOwn(value, "intentId") ? ["intentId"] : [];
  if (!plainExact(value, ["kind", "topic", "expectedVersion", "text", "statement", "sources", "scope", "reason", ...extra, ...["targetId", "relation"].filter((key) => Object.hasOwn(value, key))]) || !["memory", "growth", "summary", "goal", "activity", "contact"].includes(String(kind)) || !nonempty(value.topic) || !nonempty(value.text) || !nonempty(value.scope) || !nonempty(value.reason) || !["user-report", "role-choice", "external-observation", "tentative"].includes(String(value.statement)) || !Array.isArray(value.sources) || !value.sources.length) invalid();
  const expectedVersion = KnowledgeVersion(value.expectedVersion), targetId = Object.hasOwn(value, "targetId") ? KnowledgeId(value.targetId) : void 0;
  if (!!targetId !== expectedVersion > 0) invalid();
  const relation = Object.hasOwn(value, "relation") ? value.relation : void 0;
  if (relation !== void 0 && (!plainExact(relation, ["kind", "targetId", "version"]) || !["correction", "replacement"].includes(String(relation.kind)) || !targetId || relation.targetId !== targetId || relation.version !== expectedVersion)) invalid();
  const sources = value.sources.map((source) => {
    if (!plainExact(source, ["ref", "quote"]) || !nonempty(source.quote)) return invalid();
    return { ref: admitProposalRef(source.ref), quote: source.quote };
  });
  if (new Set(sources.map((source) => JSON.stringify(source.ref))).size !== sources.length) invalid();
  const base = { topic: value.topic, ...targetId ? { targetId } : {}, expectedVersion, text: value.text, statement: value.statement, sources, scope: value.scope, reason: value.reason, ...relation ? { relation: { kind: relation.kind, targetId: KnowledgeId(relation.targetId), version: KnowledgeVersion(relation.version) } } : {} };
  if (kind === "memory" || kind === "summary") return { ...base, kind };
  if (kind === "growth" && ["interest", "preference", "relationship", "habit"].includes(String(value.area)) && ["exploring", "stable"].includes(String(value.phase))) return { ...base, kind, area: value.area, phase: value.phase };
  if (kind === "goal" && ["planned", "in-progress", "paused", "completed", "abandoned"].includes(String(value.state))) return { ...base, kind, state: value.state };
  if (kind === "activity" && ["continue", "switch-interest", "rest"].includes(String(value.decision)) && (value.decision === "rest" ? Number.isSafeInteger(value.restMs) && Number(value.restMs) > 0 : !Object.hasOwn(value, "restMs"))) return { ...base, kind, decision: value.decision, ...value.decision === "rest" ? { restMs: Number(value.restMs) } : {} };
  if (kind === "contact") return { ...base, kind, ...Object.hasOwn(value, "intentId") ? { intentId: IntentId(value.intentId) } : {} };
  return invalid();
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
function directUserReport(value, inputs) {
  const sameText = (left, right) => left.trimEnd() === right.trimEnd();
  return value.statement === "user-report" && value.sources.length > 0 && value.sources.every((source) => {
    const ref = source.ref;
    return ref.kind === "input" && inputs.some((input) => input.inputId === ref.id && sameText(input.text, source.quote) && sameText(value.text, input.text));
  });
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

// packages/companion/src/home/file-access.ts
var fileAccessDefaults = Object.freeze({ works: "read-write", journal: "read-write", grants: Object.freeze([]) });

// packages/companion/src/home/cleanup.ts
var fail = () => {
  throw new HomeError("INVALID_CLEANUP_SELECTION");
};
var cleanupRefKey = (ref) => ref.kind === "core" ? "core" : ref.kind + ":" + ref.id + (ref.kind === "knowledge" ? ":" + ref.version : "");
function admitCleanupSelection(value) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join("|") !== "derived|sources" || !["retain", "remove"].includes(value.derived) || !Array.isArray(value.sources) || !value.sources.length || value.sources.length > 100) fail();
  const sources = value.sources.map((ref) => {
    if (!ref || Object.getPrototypeOf(ref) !== Object.prototype || Object.keys(ref).sort().join("|") !== "id|kind") fail();
    if (ref.kind === "input") return { kind: "input", id: InputId(ref.id) };
    if (ref.kind === "reply") return { kind: "reply", id: ReplyId(ref.id) };
    if (ref.kind === "tool") return { kind: "tool", id: AttemptId(ref.id) };
    return fail();
  });
  if (new Set(sources.map(cleanupRefKey)).size !== sources.length) fail();
  return { sources: sources.sort((a, b) => cleanupRefKey(a).localeCompare(cleanupRefKey(b))), derived: value.derived };
}
function admitCleanupCommand(value) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join("|") !== "expectedRevision|kind|operationId|previewDigest|selection" || value.kind !== "cleanup-sources" || typeof value.previewDigest !== "string" || !/^[a-f0-9]{64}$/.test(value.previewDigest)) throw new HomeError("INVALID_CLEANUP_COMMAND");
  return { kind: "cleanup-sources", operationId: OperationId(value.operationId), selection: admitCleanupSelection(value.selection), expectedRevision: HomeRevision(value.expectedRevision), previewDigest: value.previewDigest };
}

// packages/companion/src/host/library-preview.ts
function boundedPreview(text, max = 160, fallback = "") {
  const normalized2 = text.replace(/\s+/gu, " ").trim();
  return Array.from(normalized2).slice(0, max).join("") || fallback;
}

// packages/companion/src/host/library-maintenance-view.ts
function pageRange(value) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join("|") !== "limit|offset" || !Number.isSafeInteger(value.offset) || value.offset < 0 || !Number.isSafeInteger(value.limit) || value.limit < 1 || value.limit > 50) {
    throw new HomeError("INVALID_CLEANUP_PAGE");
  }
  return value;
}
function toolPreview(attempt) {
  if (!attempt.observation) return "\u5DE5\u5177\u8C03\u7528\u5DF2\u9884\u7559\uFF0C\u5C1A\u672A\u8BB0\u5F55\u8FD4\u56DE\u7ED3\u679C\u3002";
  if (attempt.observation.kind === "threw") return `\u5DE5\u5177\u6267\u884C\u5931\u8D25\uFF1A${attempt.observation.code}`;
  return "\u5DE5\u5177\u8C03\u7528\u5DF2\u8FD4\u56DE\u7ED3\u679C\uFF0C\u6B63\u6587\u548C\u6750\u6599\u8BF7\u5230\u6267\u884C\u8BB0\u5F55\u67E5\u770B\u3002";
}
function rowState(cleaned, complete) {
  if (cleaned) return { state: "cleaned", stateLabel: "\u6B63\u6587\u5DF2\u6E05\u7406\uFF0C\u4E0D\u80FD\u518D\u6B21\u9009\u62E9" };
  if (!complete) return { state: "incomplete", stateLabel: "\u8BB0\u5F55\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u5148\u6838\u5BF9" };
  return { state: "available", stateLabel: "\u53EF\u9009\u62E9\u6E05\u7406" };
}
function cleanupCatalogPage(snapshot, conversation, requested) {
  const page = pageRange(requested);
  if (snapshot.revision !== conversation.revision) {
    throw new HomeError("CLEANUP_SOURCE_CHANGED");
  }
  const rows = [];
  for (const input of snapshot.inputs) {
    const state = rowState(!!input.cleanup, input.text.length > 0 || !!input.cleanup);
    rows.push({
      ref: { kind: "input", id: input.inputId },
      kind: "input",
      kindLabel: "\u7528\u6237\u6765\u4FE1",
      preview: input.cleanup ? "\u6B63\u6587\u5DF2\u6E05\u7406\uFF0C\u4FDD\u7559\u6E05\u7406\u7ED3\u679C\u3002" : boundedPreview(input.text, 160, "\u6B63\u6587\u4E3A\u7A7A"),
      occurredAt: input.receivedAt,
      ...state
    });
  }
  for (const reply of conversation.replies) {
    const turn = conversation.turns.find((candidate) => candidate.runId === reply.runId);
    if (!turn) continue;
    const state = rowState(!!reply.cleanup, reply.text.length > 0 || !!reply.cleanup);
    rows.push({
      ref: { kind: "reply", id: reply.replyId },
      kind: "reply",
      kindLabel: "\u89D2\u8272\u56DE\u590D",
      preview: reply.cleanup ? "\u6B63\u6587\u5DF2\u6E05\u7406\uFF0C\u4FDD\u7559\u56DE\u590D\u7ED3\u679C\u3002" : boundedPreview(reply.text, 160, "\u6B63\u6587\u4E3A\u7A7A"),
      occurredAt: turn.startedAt,
      ...state
    });
  }
  for (const attempt of conversation.attempts.filter((candidate) => candidate.kind === "tool")) {
    const state = rowState(!!attempt.cleanup, !!attempt.observation);
    rows.push({
      ref: { kind: "tool", id: attempt.attemptId },
      kind: "tool",
      kindLabel: "\u5DE5\u5177\u6267\u884C",
      preview: attempt.cleanup ? "\u5DE5\u5177\u6B63\u6587\u5DF2\u6E05\u7406\uFF0C\u4FDD\u7559\u7ED3\u679C\u5143\u6570\u636E\u3002" : toolPreview(attempt),
      occurredAt: attempt.observation?.observedAt ?? attempt.reservedAt,
      ...state
    });
  }
  rows.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || cleanupRefKey(left.ref).localeCompare(cleanupRefKey(right.ref)));
  return {
    basis: { roleId: snapshot.roleId, revision: snapshot.revision },
    items: rows.slice(page.offset, page.offset + page.limit),
    offset: page.offset,
    total: rows.length,
    more: page.offset + page.limit < rows.length
  };
}

// packages/companion/src/home/proposal-rules.ts
var proposalRulesDefaults = Object.freeze({ maxRestSuggestionMs: 864e5 });

// packages/companion/src/home/file-rules.ts
var fileRulesDefaults = Object.freeze({ maxTextBytes: 1048576, listPageSize: 200, recursiveEntries: 1e3, operationTimeoutMs: 1e4 });
var fileRulesMaximums = Object.freeze({ maxTextBytes: 1048576, listPageSize: 1e3, recursiveEntries: 1e3, operationTimeoutMs: 2147483647 });

// packages/companion/src/home/context-snapshot.ts
function pageRange2(value, maximum) {
  if (!value || !Number.isSafeInteger(value.offset) || value.offset < 0 || !Number.isSafeInteger(value.limit) || value.limit < 1 || value.limit > maximum) throw new HomeError("INVALID_CONTEXT_PAGE");
}
async function readContextSourcePage(reader, page) {
  pageRange2(page, 100);
  if (reader.purpose !== "management") throw new HomeError("INVALID_CONTEXT_PURPOSE");
  const sources = await reader.list();
  return { basis: reader.basis, purpose: "management", constraints: await reader.constraints(), sources: sources.slice(page.offset, page.offset + page.limit), offset: page.offset, total: sources.length, more: page.offset + page.limit < sources.length };
}
async function readContextSourcePart(reader, request) {
  pageRange2(request, 65536);
  if (reader.purpose !== "management") throw new HomeError("INVALID_CONTEXT_PURPOSE");
  if (request.revision !== reader.basis.revision) throw new HomeError("CONTEXT_SOURCE_CHANGED");
  const { text, ...source } = await reader.read(request.ref);
  if (source.contentDigest !== request.contentDigest) throw new HomeError("CONTEXT_SOURCE_CHANGED");
  const points = Array.from(text);
  return { basis: reader.basis, source, text: points.slice(request.offset, request.offset + request.limit).join(""), offset: request.offset, totalCodePoints: points.length, more: request.offset + request.limit < points.length };
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

// packages/companion/src/home/contact-rules.ts
var contactRulesDefaults = Object.freeze({ cooldownMs: 72e5, dailyLimit: 3, perRoundLimit: 1, quietHours: Object.freeze({ mode: "range", start: "23:00", end: "08:00" }) });

// packages/companion/src/home/web.ts
var webRulesDefaults = Object.freeze({ transportTimeoutMs: 3e4, toolTimeoutMs: 45e3, maxResults: 8, responseLimitBytes: 4194304 });
var terminalWebCodes = /* @__PURE__ */ new Set(["QUOTA", "INSUFFICIENT_QUOTA", "INSUFFICIENT_BALANCE", "INVALID_API_KEY", "AUTHENTICATION_ERROR", "INVALID_REQUEST_ERROR", "PERMISSION_DENIED", "SECURITY_POLICY"]);
var retryableWebRecord = (record) => !terminalWebCodes.has(record.providerErrorCode ?? "") && (record.completeness === "complete" && typeof record.providerStatus === "number" && ([408, 429].includes(record.providerStatus) || record.providerStatus >= 500) || record.code === "WEB_TRANSPORT_FAILED");

// packages/companion/src/home/layout.ts
var ordinaryHomeRoots = Object.freeze(["works", "journal"]);
var protectedHomeEntries = Object.freeze(["identity.json", "head.json", "commits", "blobs", "views", "projection-progress", "content-generations", ".format-upgrade", ".restore", ".maintenance", ".maintenance.lock", "writer.lock", ".autonomy-schedule.json"]);
var retainedHomeEntries = Object.freeze(["identity.json", "head.json", "commits", "blobs", "views", "projection-progress", "content-generations", ".format-upgrade", ".autonomy-schedule.json", ...ordinaryHomeRoots]);
var temporaryHomeRootPrefixes = Object.freeze([".identity.json.", ".head.", ".head.json.", ".writer.lock.", "..maintenance.lock.", ".takeover-", ".autonomy-schedule.json."]);

// packages/companion/src/home/backup-storage.ts
var retained = new Set(retainedHomeEntries);

// packages/companion/src/home/qq-key.ts
import { createHash as createHash3 } from "node:crypto";
function qqInputIdentity(binding, source) {
  const hash = createHash3("sha256").update(JSON.stringify([binding.bindingId, binding.version, source.connectionId, source.accountId, source.peerId, source.direction, source.messageId])).digest("hex");
  return { externalKey: InputKey("qq-" + hash), operationId: OperationId("qq-input-" + hash) };
}

// packages/companion/src/home/qq-history.ts
import { createHash as createHash4 } from "node:crypto";
var token2 = (value, prefix) => {
  if (typeof value !== "string" || !new RegExp("^" + prefix + "[0-9a-f]{64}$").test(value)) throw new HomeError("INVALID_QQ_HISTORY_ID");
  return value;
};
var QQHistoryRequestId = (value) => token2(value, "history-request-");
var historyDigest = (value) => createHash4("sha256").update(value).digest("hex");
function historyInputOperation(selection, candidate) {
  return OperationId("history-input-" + historyDigest(selection + "\0" + candidate));
}

// packages/companion/src/home/retry-rules.ts
var retryRulesDefaults = Object.freeze({ maxAutomaticRetries: 1, retryDelayMs: 1e3 });

// packages/companion/src/home/model-operations.ts
var transientModelFailure = (failure) => ["TRANSPORT", "TIMEOUT", "RATE_LIMIT", "SERVER"].includes(failure.code);

// packages/companion/src/home/read-rules.ts
var readRulesDefaults = Object.freeze({ toolConcurrency: 2, displayCodePoints: 12e3, readTimeoutMs: 1e4 });

// packages/companion/src/home/turns.ts
var conversationDefaults = Object.freeze({ modelLimit: 8, toolLimit: 16, webLimit: 4, windowMs: 6e5, outputTokens: 4096 });
function validateConversationSettings(value) {
  if (!value || typeof value !== "object" || Object.keys(value).sort().join("|") !== "modelLimit|outputTokens|toolLimit|webLimit|windowMs") return false;
  const v = value;
  return [v.modelLimit, v.toolLimit, v.webLimit].every((x) => Number.isSafeInteger(x) && x >= 0) && Number.isSafeInteger(v.outputTokens) && v.outputTokens > 0 && v.outputTokens <= 256e3 && Number.isSafeInteger(v.windowMs) && v.windowMs > 0 && v.windowMs <= 2147483647;
}

// packages/companion/src/home/format.ts
var HOME_FORMATS = Object.freeze([
  Object.freeze({ major: 1, minor: 0, layout: "root-inline" }),
  Object.freeze({ major: 2, minor: 0, layout: "generation" })
]);
var HOME_CURRENT_FORMAT = Object.freeze({ major: 1, minor: 0 });
var HOME_UPGRADE_TARGET = Object.freeze({ major: 2, minor: 0 });

// packages/companion/src/home/format-upgrade.ts
var isFormatUpgradeTerminal = (phase) => phase === "switched" || phase === "failed";

// packages/companion/src/home/inputs.ts
function runnableInput(input, qqReplies = false) {
  return input.channel !== "qq" || qqReplies;
}

// packages/companion/src/runtime/file-recovery.ts
async function recoverFileEffects(home, turn, state) {
  let blocked = state.nativeRecords.some((record) => record.runId === turn.runId && record.data && typeof record.data === "object" && "kind" in record.data && record.data.kind === "file-effect-gap");
  for (const attempt of state.attempts) {
    if (attempt.runId !== turn.runId || !attempt.fileRules || !attempt.enteredAt || attempt.fileOperation === "read") continue;
    if (state.nativeRecords.some((record) => record.runId === turn.runId && record.provenance === "host-denial" && record.nativeId === "file-recovery-" + attempt.attemptId)) continue;
    const value = attempt.observation?.kind === "returned" ? attempt.observation.value : void 0;
    const effect = value && typeof value === "object" && "effect" in value && value.effect === "published" ? "published" : "unknown";
    const interrupted = !attempt.outcome || attempt.outcome.code === "PROCESS_INTERRUPTED";
    await home.recordNative({ operationId: OperationId("file-recovery-" + attempt.attemptId), record: { runId: turn.runId, nativeId: NativeExposureId("file-recovery-" + attempt.attemptId), provenance: "host-denial", data: { kind: "file-effect-gap", attemptId: attempt.attemptId, reason: interrupted ? "PROCESS_INTERRUPTED" : "TURN_CONTINUATION_UNAVAILABLE", fileOperation: attempt.fileOperation ?? "unproven-legacy", effect, observation: attempt.observation?.kind ?? "not-recorded", canonicalOutcome: attempt.outcome?.kind ?? "not-recorded", entryEvidence: attempt.observation ? "recorded-observation" : "durable-intent-only" } } });
    blocked = true;
  }
  return blocked;
}

// packages/companion/src/context/index.ts
function contextMeasurement(kind, allocation, bytes) {
  if (!Number.isSafeInteger(allocation.contextWindow) || allocation.contextWindow <= 0 || !Number.isSafeInteger(allocation.outputLimit) || allocation.outputLimit < 1 || !Number.isSafeInteger(bytes) || bytes < 0) throw new ContextError("CONTEXT_CAPACITY");
  return { kind, contextWindow: allocation.contextWindow, outputReserve: allocation.outputLimit, framingReserve: 2048, toolsAndMessagesBytes: bytes };
}
var isContextInvalidation = (code) => ["CONTEXT_STALE", "CONTEXT_SNAPSHOT_STALE", "CONTEXT_SOURCE_CHANGED"].includes(code);
var ContextError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};
var normalized = (text) => text.normalize("NFKC").toLocaleLowerCase("en-US");
function terms(text) {
  const parts = normalized(text).match(/[\p{Script=Han}]+|[\p{Letter}\p{Number}_-]+/gu) ?? [];
  return [...new Set(parts.flatMap((part) => new RegExp("\\p{Script=Han}", "u").test(part) ? [part, ...Array.from({ length: Math.max(0, part.length - 1) }, (_, index) => part.slice(index, index + 2))] : [part]))];
}
var refKey = (ref) => JSON.stringify(ref);
var sourceRoot = (source) => "runId" in source && source.runId ? "run:" + source.runId : refKey(source.ref);
var sourceOrder = (source) => source.ref.kind === "input" ? 0 : source.ref.kind === "tool" ? 1 : 2;
function unitRoots(sources, constraints) {
  const roots = new Map(sources.map((source) => [refKey(source.ref), sourceRoot(source)])), parent = new Map(sources.map((source) => [sourceRoot(source), sourceRoot(source)]));
  const find = (root) => {
    let current = root;
    while (parent.get(current) !== current) current = parent.get(current);
    return current;
  };
  for (const constraint of constraints) {
    const linked = [constraint.target, ...constraint.required].flatMap((ref) => roots.has(refKey(ref)) ? [find(roots.get(refKey(ref)))] : []);
    for (const root of linked.slice(1)) {
      const left = find(root), right = find(linked[0]);
      parent.set(left > right ? left : right, left > right ? right : left);
    }
  }
  return new Map([...roots].map(([ref, root]) => [ref, find(root)]));
}
async function searchContextSources(reader, query, exclude = []) {
  const queryTerms = terms(query), omitted = [], all = [], constraints = await reader.constraints(), metadata = await reader.list();
  const seen = /* @__PURE__ */ new Set();
  for (const source of metadata) if (source.ref.kind !== "core" && !seen.has(refKey(source.ref))) {
    seen.add(refKey(source.ref));
    all.push(await reader.read(source.ref));
  }
  for (const constraint of constraints) {
    if (!["correction", "replacement", "provenance"].includes(constraint.kind) || constraint.target.kind === "core" || !constraint.required.length) throw new ContextError("CONTEXT_INVALID_CONSTRAINT");
    for (const ref of [constraint.target, ...constraint.required]) if (!metadata.some((source) => refKey(source.ref) === refKey(ref))) throw new ContextError("CONTEXT_REQUIRED_SOURCE_UNAVAILABLE");
  }
  const roots = unitRoots(all, constraints), groups = /* @__PURE__ */ new Map(), replaced = reader.purpose === "daily" ? new Set(constraints.filter((constraint) => constraint.kind === "replacement").flatMap((constraint) => all.filter((source) => refKey(source.ref) === refKey(constraint.target)).map((source) => sourceRoot(source)))) : /* @__PURE__ */ new Set();
  for (const source of all) {
    const root = roots.get(refKey(source.ref)), group = groups.get(root) ?? [];
    group.push(source);
    groups.set(root, group);
  }
  const unitOrder = /* @__PURE__ */ new Map();
  for (const source of all) if (source.ref.kind === "input" && "receiveSequence" in source) unitOrder.set(sourceRoot(source), Math.min(unitOrder.get(sourceRoot(source)) ?? Number.MAX_SAFE_INTEGER, source.receiveSequence));
  const ranked = [], selectedConstraints = [];
  for (const [root, sources] of groups) {
    const candidates = sources.filter((source) => !exclude.some((ref) => refKey(ref) === refKey(source.ref))), body = normalized(candidates.map((source) => source.text).join("\n")), sourceTerms = new Set(terms(body));
    const exact = candidates.some((source) => source.ref.kind !== "core" && normalized(query).includes(normalized(source.ref.id))) ? 1 : 0, phrase = queryTerms.filter((term) => term.length > 2 && body.includes(term)).length, coverage = queryTerms.filter((term) => sourceTerms.has(term)).length;
    const payload = sources.filter((source) => {
      const reason = exclude.some((ref) => refKey(ref) === refKey(source.ref)) ? "current-input" : replaced.has(sourceRoot(source)) ? "replaced" : null;
      if (reason) {
        omitted.push({ ref: source.ref, reason });
        return false;
      }
      return true;
    });
    if (!exact && !phrase && !coverage) {
      omitted.push(...payload.map((source) => ({ ref: source.ref, reason: "no-match" })));
      continue;
    }
    selectedConstraints.push(...constraints.filter((constraint) => [constraint.target, ...constraint.required].some((ref) => roots.get(refKey(ref)) === root)));
    payload.sort((a, b) => (unitOrder.get(sourceRoot(a)) ?? Number.MAX_SAFE_INTEGER) - (unitOrder.get(sourceRoot(b)) ?? Number.MAX_SAFE_INTEGER) || sourceOrder(a) - sourceOrder(b) || ("occurredAt" in a && "occurredAt" in b ? a.occurredAt.localeCompare(b.occurredAt) : 0) || refKey(a.ref).localeCompare(refKey(b.ref)));
    ranked.push({ root, sources: payload, score: [exact, phrase, coverage, Math.max(...sources.map((source) => Date.parse("occurredAt" in source ? source.occurredAt : "1970-01-01")))] });
  }
  ranked.sort((a, b) => {
    for (let index = 0; index < a.score.length; index++) {
      const difference = b.score[index] - a.score[index];
      if (difference) return difference;
    }
    return a.root.localeCompare(b.root);
  });
  return { sources: ranked.flatMap((item) => item.sources), constraints: selectedConstraints, omitted };
}
async function prepareCharacterContext(snapshot, turn, route, reader) {
  if (snapshot.contextGeneration !== turn.contextGeneration) throw new ContextError("CONTEXT_STALE");
  const inputs = turn.inputIds.map((id) => {
    const x = snapshot.inputs.find((x2) => x2.inputId === id);
    if (!x || x.status !== "running" || x.bindingId !== turn.bindingId || x.bindingVersion !== turn.bindingVersion) throw new ContextError("INPUT_SCOPE_CHANGED");
    return { inputId: x.inputId, experienceId: x.experienceId, text: x.text, ...x.origin === "history" ? { history: { reportedAt: x.historySource?.reportedAt ?? null, receivedAt: x.receivedAt } } : {} };
  });
  if (reader.purpose === "management" || reader.basis.roleId !== snapshot.roleId || reader.basis.contextGeneration !== snapshot.contextGeneration || reader.basis.runId !== turn.runId) throw new ContextError("CONTEXT_STALE");
  const metadata = await reader.list(), granted = [...new Map(metadata.map((source) => [refKey(source.ref), source.ref])).values()];
  const { sources: history, omitted, constraints } = await searchContextSources(reader, turn.source === "autonomous" ? [snapshot.core.text, ...metadata.flatMap((source) => source.ref.kind === "knowledge" && "current" in source && source.current && "topic" in source ? [source.topic] : [])].join("\n") : inputs.map((input) => input.text).join("\n"), turn.inputIds.map((id) => ({ kind: "input", id })));
  const requiredBytes = Buffer.byteLength(JSON.stringify({ core: snapshot.core.text, inputs }), "utf8"), measurement = contextMeasurement("required-estimate", route, requiredBytes);
  const selected = [{ kind: "core" }, ...inputs.map((input) => ({ kind: "input", id: input.inputId })), ...history.map((source) => source.ref)], sources = selected.map((ref) => {
    const source = metadata.find((source2) => refKey(source2.ref) === refKey(ref));
    if (!source) throw new ContextError("CONTEXT_REQUIRED_SOURCE_UNAVAILABLE");
    return { ref, contentDigest: source.contentDigest };
  });
  const frame = { roleId: snapshot.roleId, revision: reader.basis.revision, contextGeneration: snapshot.contextGeneration, core: snapshot.core.text, inputs, history, manifest: { snapshot: reader.basis, sources, coreVersion: snapshot.core.version, inputIds: turn.inputIds, granted, measurement, retrieval: "local-lexical", purpose: reader.purpose, constraints, selected, omitted } };
  if (requiredBytes + measurement.outputReserve + measurement.framingReserve > measurement.contextWindow) throw new ContextError("CONTEXT_CAPACITY");
  await reader.check(frame.manifest.selected);
  for (const input of frame.inputs) Object.freeze(input);
  Object.freeze(frame.inputs);
  Object.freeze(frame.manifest.inputIds);
  Object.freeze(frame.manifest);
  return Object.freeze(frame);
}
function fitCharacterContext(frame, measure, allocation) {
  let history = [...frame.history], omitted = [...frame.manifest.omitted];
  const project = () => {
    const selected = frame.manifest.selected.filter((ref) => !frame.history.some((source) => refKey(source.ref) === refKey(ref)) || history.some((source) => refKey(source.ref) === refKey(ref)));
    return { ...frame, history, manifest: { ...frame.manifest, selected, sources: frame.manifest.sources.filter((source) => selected.some((ref) => refKey(source.ref) === refKey(ref))), omitted } };
  };
  while (measure(project()) + allocation.outputLimit + 2048 > allocation.contextWindow) {
    const last = history.at(-1);
    if (!last) throw new ContextError("CONTEXT_CAPACITY");
    const roots = unitRoots(history, frame.manifest.constraints), root = roots.get(refKey(last.ref)), removed = history.filter((source) => roots.get(refKey(source.ref)) === root);
    history = history.filter((source) => roots.get(refKey(source.ref)) !== root);
    omitted.push(...removed.map((source) => ({ ref: source.ref, reason: "capacity" })));
  }
  const fitted = project();
  return { ...fitted, manifest: { ...fitted.manifest, measurement: contextMeasurement("adapter-allocation", allocation, measure(fitted)) } };
}

// packages/companion/src/context/proposals.ts
async function checkKnowledgeProposal(value, reader, inputs) {
  const sources = [];
  for (const quote of value.sources) sources.push(await reader.read(quote.ref));
  return assessKnowledgeProposal(value, sources, inputs);
}

// packages/companion/src/host/library-source-time.ts
var normalizedSpace = (value) => value.replace(/\s+/gu, " ").trim();
function librarySourceTime(source) {
  const kind = source.ref.kind;
  switch (kind) {
    case "core":
    case "knowledge":
      return null;
    case "input": {
      const input = source;
      return input.origin === "history" ? normalizedSpace(input.reportedAt ?? input.occurredAt) : input.occurredAt;
    }
    case "reply":
    case "tool": {
      const timed = source;
      return timed.occurredAt;
    }
    default: {
      const unreachable = kind;
      return unreachable;
    }
  }
}

// packages/companion/src/host/library-sources-view.ts
var sourceKinds = ["core", "input", "reply"];
var completenessValues = ["all", "complete", "gap"];
var availabilityValues = ["all", "daily", "archive"];
var sortValues = ["newest", "oldest"];
function invalid2() {
  throw new HomeError("INVALID_LIBRARY_SOURCE_QUERY");
}
function plainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function normalizedSpace2(value) {
  return value.replace(/\s+/gu, " ").trim();
}
function canonicalTime(value) {
  if (value === void 0 || value === null || value === "") return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return invalid2();
  return new Date(value).toISOString();
}
function normalizeQuery(value) {
  if (!plainObject(value)) return invalid2();
  const allowed = ["availability", "completeness", "from", "keyword", "limit", "offset", "sort", "to", "types"];
  if (Object.keys(value).some((key) => !allowed.includes(key))) return invalid2();
  const offset = value.offset ?? 0, limit = value.limit ?? 20;
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit !== 20 && limit !== 50) return invalid2();
  const keyword = typeof value.keyword === "string" ? normalizedSpace2(value.keyword) : value.keyword === void 0 ? "" : invalid2();
  if (Array.from(keyword).length > 200) return invalid2();
  const requestedTypes = value.types === void 0 ? sourceKinds : value.types;
  if (!Array.isArray(requestedTypes) || !requestedTypes.length || requestedTypes.some((type) => !sourceKinds.includes(type))) return invalid2();
  const types = sourceKinds.filter((type) => requestedTypes.includes(type));
  if (new Set(requestedTypes).size !== requestedTypes.length) return invalid2();
  const completeness = value.completeness ?? "all", availability = value.availability ?? "all", sort = value.sort ?? "newest";
  if (!completenessValues.includes(completeness) || !availabilityValues.includes(availability) || !sortValues.includes(sort)) return invalid2();
  const from = canonicalTime(value.from), to = canonicalTime(value.to);
  if (from && to && Date.parse(from) > Date.parse(to)) return invalid2();
  const query = { keyword, types, completeness, availability, from, to, sort };
  return { query, offset, limit, filterKey: JSON.stringify(query) };
}
function sourceKey(source, kind) {
  return kind === "core" ? "core" : kind + ":" + String(source.ref.id);
}
function matchesTime(source, kind, query) {
  if (kind === "core") return true;
  const occurredAt = librarySourceTime(source);
  if (!occurredAt || !Number.isFinite(Date.parse(occurredAt))) return false;
  const time = Date.parse(occurredAt);
  return (!query.from || time >= Date.parse(query.from)) && (!query.to || time <= Date.parse(query.to));
}
function compare(left, right, order) {
  const leftKind = left.source.ref.kind, rightKind = right.source.ref.kind;
  if (leftKind === "core" || rightKind === "core") return leftKind === rightKind ? 0 : leftKind === "core" ? -1 : 1;
  const timeDifference = (Date.parse(left.occurredAt) || 0) - (Date.parse(right.occurredAt) || 0);
  if (timeDifference) return order === "newest" ? -timeDifference : timeDifference;
  return sourceKey(left.source, leftKind).localeCompare(sourceKey(right.source, rightKind));
}
async function readLibrarySources(reader, request) {
  if (reader.purpose !== "management") throw new HomeError("INVALID_CONTEXT_PURPOSE");
  const { query, offset, limit, filterKey } = normalizeQuery(request);
  const dataset = (await reader.list()).filter((source) => sourceKinds.includes(source.ref.kind));
  const candidates = [];
  for (const source of dataset) {
    const kind = source.ref.kind;
    if (!query.types.includes(kind)) continue;
    let body = "";
    try {
      body = (await reader.read(source.ref)).text;
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "CONTEXT_SOURCE_CLEANED") throw error;
    }
    const searchable = normalizedSpace2(body).toLocaleLowerCase();
    if (query.keyword && !searchable.includes(query.keyword.toLocaleLowerCase())) continue;
    if (query.completeness !== "all" && source.completeness !== query.completeness) continue;
    if (query.availability === "daily" && !source.availableForDaily || query.availability === "archive" && source.availableForDaily) continue;
    if (!matchesTime(source, kind, query)) continue;
    candidates.push({ source, preview: boundedPreview(body), occurredAt: librarySourceTime(source) });
  }
  candidates.sort((left, right) => compare(left, right, query.sort));
  const sources = candidates.slice(offset, offset + limit), total = candidates.length, end = Math.min(offset + sources.length, total);
  return {
    basis: reader.basis,
    purpose: "management",
    revision: reader.basis.revision,
    query,
    filterKey,
    sources,
    offset,
    limit,
    total,
    datasetTotal: dataset.length,
    rangeStart: sources.length ? offset + 1 : 0,
    rangeEnd: end,
    more: offset + sources.length < total,
    nextOffset: offset + sources.length < total ? offset + sources.length : null
  };
}

// packages/companion/src/host/library-overview-view.ts
async function readLibraryOverviewSources(reader) {
  if (reader.purpose !== "management") throw new Error("INVALID_CONTEXT_PURPOSE");
  const sources = await reader.list();
  const recentMetadata = sources.filter((source) => source.ref.kind === "input" || source.ref.kind === "reply").sort((left, right) => (librarySourceTime(right) ?? "").localeCompare(librarySourceTime(left) ?? "")).slice(0, 6);
  const recentSources = [];
  for (const source of recentMetadata) {
    let text = "";
    try {
      text = (await reader.read(source.ref)).text;
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "CONTEXT_SOURCE_CLEANED") throw error;
    }
    recentSources.push({
      source,
      preview: source.cleanup ? "\u6B63\u6587\u5DF2\u6E05\u7406\uFF0C\u4FDD\u7559\u6E05\u7406\u7ED3\u679C\u3002" : boundedPreview(text, 160, "\u6B63\u6587\u4E3A\u7A7A"),
      occurredAt: librarySourceTime(source)
    });
  }
  return { sources, recentSources };
}

// packages/companion/src/actions/web.ts
import { BlockList, isIP } from "node:net";
var denied = new BlockList();
for (const [address, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]]) denied.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of [["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["2001:db8::", 32]]) denied.addSubnet(address, prefix, "ipv6");
function validateWebUrl(value) {
  if (typeof value !== "string" || Array.from(value).length > 8192 || value !== value.trim()) throw new ExecutionError("INVALID_WEB_URL");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new ExecutionError("INVALID_WEB_URL");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase(), family = isIP(host);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !host || host === "localhost" || host === "local" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".lan") || !family && !host.includes(".") || family && denied.check(host, family === 4 ? "ipv4" : "ipv6")) throw new ExecutionError("WEB_URL_NOT_ALLOWED");
  return value;
}
function parseRoleWeb(operation, value, maxResults = 50) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).some((key) => typeof key !== "string" || !Object.getOwnPropertyDescriptor(value, key)?.enumerable || !("value" in Object.getOwnPropertyDescriptor(value, key)))) throw new ExecutionError("INVALID_ROLE_WEB");
  if (operation === "fetch") {
    if (Object.keys(value).join("|") !== "url" || !("url" in value)) throw new ExecutionError("INVALID_ROLE_WEB");
    return { operation, url: validateWebUrl(value.url) };
  }
  if (Object.keys(value).some((key) => !["query", "limit"].includes(key)) || !("query" in value) || typeof value.query !== "string" || !value.query.trim() || /[\uD800-\uDFFF]/u.test(value.query) || Array.from(value.query).length > 128) throw new ExecutionError("INVALID_WEB_QUERY");
  if ("limit" in value && (typeof value.limit !== "number" || !Number.isSafeInteger(value.limit) || value.limit < 1 || value.limit > Math.min(50, maxResults))) throw new ExecutionError("INVALID_WEB_LIMIT");
  return { operation, query: value.query, ..."limit" in value && typeof value.limit === "number" ? { limit: value.limit } : {} };
}

// packages/companion/src/runtime/web.ts
import { randomUUID as randomUUID2 } from "node:crypto";
function issueWebOperation(owner) {
  const remainingMs = () => Math.max(0, Date.parse(owner.claim.deadline) - Date.parse(owner.now()));
  const records = [];
  const issue = (attempt) => {
    const state = { attempt, started: false, confirmed: false };
    records.push(state);
    return Object.freeze({
      attemptId: attempt.attemptId,
      now: owner.now,
      remainingMs,
      async dispatch(signal, effect) {
        await owner.drain();
        await owner.parameters();
        owner.check();
        signal.throwIfAborted();
        if (state.started || state.outcome) throw new ExecutionError("WEB_ATTEMPT_CAPABILITY_SPENT");
        await owner.home.enterAttempt({ operationId: OperationId("enter-" + attempt.attemptId), attemptId: attempt.attemptId, now: owner.now() });
        owner.check();
        signal.throwIfAborted();
        if (Date.parse(owner.now()) >= Date.parse(owner.claim.deadline)) throw new ExecutionError("WEB_TOOL_TIMEOUT");
        if (attempt.webOperation?.ordinal === 1 && owner.home.admission.retryRulesVersion !== attempt.retryRules?.version) throw new ExecutionError("WEB_RETRY_RULES_CHANGED");
        const clockGate = owner.dispatchClock?.();
        if (clockGate) await clockGate;
        state.started = true;
        return effect();
      },
      settle(record) {
        if (state.outcome) throw new ExecutionError("WEB_ATTEMPT_ALREADY_SETTLED");
        const stable = structuredClone({ ...record, dispatchObserved: state.started });
        state.outcome = stable;
        state.saved = owner.archive(OperationId("web-outcome-" + attempt.attemptId), async () => {
          await owner.home.recordAttempt({ operationId: OperationId("web-outcome-" + attempt.attemptId), attemptId: attempt.attemptId, outcome: { kind: !state.started ? "not-dispatched" : stable.code === "WEB_CANCELLED" ? "cancelled" : stable.code ? "failed" : "completed", ...stable.code ? { code: stable.code } : {}, data: stable } });
          state.confirmed = true;
        });
        return state.saved;
      }
    });
  };
  const first = issue(owner.first);
  return Object.freeze({
    logicalOpId: owner.claim.logicalOpId,
    claim: owner.claim,
    now: owner.now,
    remainingMs,
    first,
    async retry(record, signal) {
      if (records.length !== 1 || !retryableWebRecord(record) || !records[0]?.saved) return;
      await records[0].saved;
      await owner.drain();
      await owner.parameters();
      owner.check();
      const rules = await owner.home.readRetryRules();
      if (!rules.value.maxAutomaticRetries) return;
      const delay = Math.ceil(record.retryAfterMs ?? rules.value.retryDelayMs), remaining = Date.parse(owner.claim.deadline) - Date.parse(owner.now());
      if (delay >= remaining || delay > 2147483647 || signal.aborted) return;
      await new Promise((resolve, reject) => {
        const cancel = () => {
          clearTimeout(timer);
          signal.removeEventListener("abort", cancel);
          reject(new ExecutionError("WEB_CANCELLED"));
        };
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", cancel);
          resolve();
        }, delay);
        signal.addEventListener("abort", cancel, { once: true });
      });
      await owner.drain();
      await owner.parameters();
      owner.check();
      if ((await owner.home.readRetryRules()).version !== rules.version) return;
      const id = AttemptId("web-" + randomUUID2());
      while (true) {
        const conversation = await owner.home.readConversation(), snapshot = await owner.home.readSnapshot();
        owner.check();
        try {
          const autonomy = owner.first.source === "autonomous" ? await owner.stamp?.() : void 0;
          const attempt = await owner.home.reserveAttempt({ operationId: OperationId("reserve-" + id), runId: owner.first.runId, attemptId: id, source: owner.first.source, ...autonomy ? { autonomy } : {}, kind: "web", webOperation: { logicalOpId: owner.claim.logicalOpId, parentAttemptId: owner.toolId, ordinal: 1, previousAttemptId: owner.first.attemptId }, retryRules: rules, contextGeneration: snapshot.contextGeneration, settingsVersion: conversation.rules.version, expectedRevision: conversation.revision, now: autonomy?.clock.utc ?? owner.now() });
          return issue(attempt);
        } catch (error) {
          if (error && typeof error === "object" && "code" in error && error.code === "REVISION_CONFLICT") continue;
          throw error;
        }
      }
    },
    async finishReservations() {
      for (const state of records) {
        if (state.saved) {
          if (!state.confirmed) await state.saved;
          continue;
        }
        const record = { providerStatus: "unknown", rawBase64: "", retainedBytes: 0, receivedBytes: 0, completeness: "not-dispatched", dispatchObserved: false, code: "WEB_NOT_DISPATCHED" };
        state.outcome = record;
        state.saved = owner.archive(OperationId("web-outcome-" + state.attempt.attemptId), async () => {
          await owner.home.recordAttempt({ operationId: OperationId("web-outcome-" + state.attempt.attemptId), attemptId: state.attempt.attemptId, outcome: { kind: "not-dispatched", code: record.code, data: record } });
          state.confirmed = true;
        });
        await state.saved;
      }
    }
  });
}

// packages/companion/src/runtime/history.ts
function createQQHistoryRuntime(options) {
  const { home, port, archive } = options;
  const idleWaiters = /* @__PURE__ */ new Set();
  const selections = /* @__PURE__ */ new Map();
  let task, started;
  const read = () => home.readQQHistory();
  let reconnect, activating = false;
  const offVerified = port?.onVerified?.(async (generation, target) => {
    const snapshot = await home.readSnapshot(), anchor = snapshot.inputs.filter((i) => i.channel === "qq" && i.bindingId === target.bindingId && i.bindingVersion === target.version && i.qqSource).at(-1);
    reconnect = anchor ? { operationId: OperationId("history-reconnect-" + historyDigest(home.roleId + "\0" + generation)), target, anchorInputId: anchor.inputId } : void 0;
  });
  const offAvailability = port?.onAvailability?.(() => {
    void activate();
  });
  async function activate() {
    if (activating || !reconnect || !port?.canRead(reconnect.target)) return;
    activating = true;
    const captured = reconnect;
    try {
      await options.guard();
      await query({ operationId: captured.operationId, trigger: "reconnect", expectedBindingVersion: captured.target.version, anchorInputId: captured.anchorInputId });
      if (reconnect === captured) reconnect = void 0;
    } catch (error) {
      if (safeExecutionCode(error) !== "STOP_RECOVERY_PENDING" && reconnect === captured) reconnect = void 0;
    } finally {
      activating = false;
    }
  }
  const id = (prefix, value) => OperationId(prefix + historyDigest(value));
  const denials = /* @__PURE__ */ new Set(["INVALID_QQ_HISTORY_POLICY", "INVALID_QQ_HISTORY_ID", "INVALID_OPERATION_ID", "QQ_NOT_BOUND", "QQ_BINDING_CHANGED", "QQ_HISTORY_QUERY_RUNNING", "QQ_HISTORY_COOLDOWN", "QQ_HISTORY_INITIAL_BINDING", "QQ_HISTORY_ANCHOR_CHANGED", "REVISION_CONFLICT", "OPERATION_CONFLICT", "QQ_HISTORY_QUERY_NOT_FOUND", "CORRUPT_QQ_HISTORY", "READ_ONLY_HOME", "HOME_CLOSED"]);
  async function saveIntent(operationId, save, onRepair) {
    let value, denied2, first = true;
    await archive(operationId, async () => {
      const repairing = !first;
      first = false;
      let result;
      try {
        result = await save();
      } catch (error) {
        if (denials.has(safeExecutionCode(error))) {
          denied2 = error;
          return;
        }
        throw error;
      }
      if (repairing) await onRepair?.(result);
      value = result;
    });
    if (denied2) throw denied2;
    return value;
  }
  async function gate(query2) {
    await options.guard();
    const target = (await home.readSnapshot()).qqBinding;
    if (!sameQQTarget(target, query2.target)) throw new ExecutionError("QQ_BINDING_CHANGED");
    if (!port?.canRead(query2.target)) throw new ExecutionError("QQ_HISTORY_NOT_CONNECTED");
    if (JSON.stringify(port.policy()) !== JSON.stringify(query2.policy)) throw new ExecutionError("QQ_HISTORY_CONFIGURATION_CHANGED");
  }
  async function run(query2) {
    let reason = "QQ_HISTORY_COMPLETENESS_UNKNOWN";
    try {
      for (let pageIndex = 0; pageIndex < query2.policy.maxPages; pageIndex++) {
        await gate(query2);
        const waiter = new AbortController();
        idleWaiters.add(waiter);
        try {
          await options.localIdle(query2.target, waiter.signal);
        } finally {
          idleWaiters.delete(waiter);
        }
        await gate(query2);
        const current = (await read()).queries.find((q) => q.queryId === query2.queryId), previous = current.requests.at(-1);
        const request = { requestId: QQHistoryRequestId("history-request-" + historyDigest(query2.queryId + ":" + pageIndex)), pageIndex, anchorMessageId: previous?.nextAnchorMessageId ?? query2.anchor?.messageId ?? null, limit: query2.policy.pageSize, reservedAt: options.now() };
        await archive(id("history-reserve-", request.requestId), () => home.reserveQQHistoryPage({ operationId: id("history-reserve-", request.requestId), queryId: query2.queryId, page: request }));
        let invoked = false, entered = false;
        const prepared = Object.freeze({ query: query2, request, async invoke(effect) {
          if (invoked) throw new ExecutionError("QQ_HISTORY_PERMIT_USED");
          invoked = true;
          await gate(query2);
          const now = options.now();
          await archive(id("history-enter-", request.requestId), () => home.enterQQHistoryPage({ operationId: id("history-enter-", request.requestId), queryId: query2.queryId, requestId: request.requestId, now }));
          await gate(query2);
          entered = true;
          return effect();
        } });
        let outcome;
        try {
          outcome = await port.read(prepared);
          if (!entered && (outcome.kind === "response" || outcome.dispatchObserved)) throw new ExecutionError("QQ_HISTORY_NOT_DISPATCHED");
        } catch (error) {
          outcome = { kind: "failed", code: safeExecutionCode(error), dispatchObserved: entered, observedAt: options.now() };
        }
        const stable = structuredClone(outcome);
        await archive(id("history-result-", request.requestId), () => home.observeQQHistoryPage({ operationId: id("history-result-", request.requestId), queryId: query2.queryId, requestId: request.requestId, outcome: stable }));
        const saved = (await read()).queries.find((q) => q.queryId === query2.queryId).requests.at(-1);
        if (outcome.kind === "failed") {
          reason = outcome.code;
          break;
        }
        if (!saved.rangeEstablished) {
          reason = query2.anchor ? "QQ_HISTORY_RANGE_UNPROVEN" : "QQ_HISTORY_ANCHOR_MISSING";
          break;
        }
        if (outcome.rows.length < request.limit || !saved.nextAnchorMessageId) break;
        if (pageIndex === query2.policy.maxPages - 1) reason = "QQ_HISTORY_PAGE_LIMIT";
      }
    } catch (error) {
      reason = safeExecutionCode(error);
    }
    await archive(id("history-finish-", query2.queryId), () => home.finishQQHistory({ operationId: id("history-finish-", query2.queryId), queryId: query2.queryId, reason }));
  }
  function launch(query2) {
    if (query2.phase !== "running" || started === query2.queryId) return;
    started = query2.queryId;
    const current = run(query2);
    task = current;
    void current.finally(() => {
      if (task === current) task = void 0;
    }).catch(() => {
    });
  }
  async function query(request) {
    OperationId(request.operationId);
    await options.guard();
    const previous = (await read()).queries.find((q) => q.operationId === request.operationId);
    if (previous) {
      const recovered = await home.beginQQHistory({ operationId: request.operationId, trigger: previous.trigger, policy: previous.policy, now: previous.startedAt });
      launch(recovered);
      return recovered;
    }
    if (!port) throw new ExecutionError("QQ_HISTORY_UNAVAILABLE");
    const binding = (await home.readSnapshot()).qqBinding;
    if (!binding || !port.canRead(binding)) throw new ExecutionError("QQ_HISTORY_NOT_CONNECTED");
    const begin = { operationId: request.operationId, trigger: request.trigger ?? "owner", policy: structuredClone(port.policy()), now: options.now(), expectedBindingVersion: request.expectedBindingVersion ?? binding.version, ...request.anchorInputId ? { anchorInputId: request.anchorInputId } : {} };
    const query2 = await saveIntent(request.operationId, () => home.beginQQHistory(begin), async (original) => {
      if (original.phase === "running") await home.finishQQHistory({ operationId: id("history-finish-", original.queryId), queryId: original.queryId, reason: "QQ_HISTORY_NOT_DISPATCHED" });
    });
    launch(query2);
    return query2;
  }
  return {
    read,
    activate,
    interrupt(code) {
      for (const waiter of idleWaiters) waiter.abort(code);
    },
    dispose() {
      offVerified?.();
      offAvailability?.();
      reconnect = void 0;
    },
    async recover() {
      for (const query2 of (await read()).queries.filter((q) => q.phase === "running")) {
        for (const request of query2.requests.filter((r) => !r.outcome)) {
          const operationId = id("history-result-", request.requestId);
          await home.observeQQHistoryPage({ operationId, queryId: query2.queryId, requestId: request.requestId, outcome: { kind: "failed", observedAt: options.now(), code: "PROCESS_INTERRUPTED", dispatchObserved: !!request.enteredAt } });
        }
        await home.finishQQHistory({ operationId: id("history-finish-", query2.queryId), queryId: query2.queryId, reason: "PROCESS_INTERRUPTED" });
      }
    },
    query,
    async select(request) {
      OperationId(request.operationId);
      await options.guard();
      const begin = structuredClone({ ...request, now: options.now() });
      let selection = await saveIntent(request.operationId, () => home.beginQQHistorySelection(begin));
      if (selection.phase === "completed") return selection;
      const active = selections.get(request.operationId);
      if (active) return active;
      const work = (async () => {
        const state = await read(), query2 = state.queries.find((q) => q.queryId === selection.queryId);
        for (const candidateId of selection.candidateIds) {
          if (selection.receipts.some((r) => r.candidateId === candidateId)) continue;
          const candidate = query2.candidates.find((c) => c.candidateId === candidateId);
          const source = { connectionId: query2.target.connectionId, accountId: query2.target.accountId, peerId: query2.target.peerId, direction: "incoming", messageId: candidate.messageId };
          const input = { ...qqInputIdentity(query2.target, source), operationId: historyInputOperation(selection.operationId, candidateId), bindingId: query2.target.bindingId, bindingVersion: query2.target.version, channel: "qq", qqSource: source, text: candidate.text, origin: "history", historySource: { queryId: query2.queryId, candidateId, selectionOperationId: selection.operationId, reportedAt: candidate.reportedAt }, receivedAt: options.now(), sourceEvidence: "explicitly-selected-onebot-history" };
          let receipt;
          const operationId2 = id("history-selected-", selection.operationId + "\0" + candidateId);
          await archive(input.operationId, async () => {
            if (!receipt) receipt = await options.receive(input);
            else if (receipt.kind === "uncertain") receipt = await home.acceptInput(input);
            if (receipt.kind === "uncertain") throw new ExecutionError("IO_UNCERTAIN");
            await home.recordQQHistorySelection({ operationId: operationId2, selectionOperationId: selection.operationId, candidateId, receipt });
          });
        }
        const operationId = id("history-selection-finish-", selection.operationId);
        await archive(operationId, () => home.finishQQHistorySelection({ operationId, selectionOperationId: selection.operationId }));
        return (await read()).selections.find((s) => s.operationId === selection.operationId);
      })();
      selections.set(request.operationId, work);
      try {
        return await work;
      } finally {
        if (selections.get(request.operationId) === work) selections.delete(request.operationId);
      }
    },
    async drain() {
      await task;
      await Promise.all(selections.values());
    }
  };
}

// packages/companion/src/runtime/index.ts
import { createHash as createHash5, randomUUID as randomUUID3 } from "node:crypto";
function projectFormat(home, report, task) {
  const claimed = report?.claimedFormat;
  const status = home && home.formatStatus ? home.formatStatus() : void 0;
  const format = status?.format ?? report?.format ?? claimed;
  if (!format) {
    return void 0;
  }
  const known = HOME_FORMATS.some((candidate) => candidate.major === format.major && candidate.minor === format.minor);
  if (!known) return { status: "unsupported", format, layout: "root-inline", upgradesAvailable: false };
  if (!status) return { status: report?.mode === "read-only" ? "unsupported" : "compatible", format, layout: format.major === 2 ? "storage-generation" : "root-inline", upgradesAvailable: format.major === 1 };
  const base = { format: status.format, layout: status.layout, upgradesAvailable: status.upgrade.available };
  if (!task) return { status: base.upgradesAvailable ? "needs-upgrade" : "compatible", ...base, target: status.upgrade.to };
  if (task.phase === "failed") return { status: "failed", ...base, target: task.to, operationId: task.operationId, phase: task.phase, checkpoint: task.checkpoint, ...task.error ? { error: task.error } : {}, ...task.recovery ? { recovery: task.recovery } : {} };
  if (task.phase === "switched") return { status: "migrated", ...base, format: task.to, layout: "storage-generation", upgradesAvailable: false, target: task.to, operationId: task.operationId, phase: task.phase, checkpoint: task.checkpoint };
  return { status: "processing", ...base, target: task.to, operationId: task.operationId, phase: task.phase, checkpoint: task.checkpoint, upgradesAvailable: false, ...task.error ? { error: task.error } : {}, ...task.recovery ? { recovery: task.recovery } : {} };
}
async function projectHome(home, available = false) {
  const snapshot = await home.readSnapshot();
  const { inputs, roleId, revision, core, settings, contextGeneration, creationOperationId, projection, panelBinding, uncertainOperationId } = snapshot;
  return { roleId, revision, core, settings, contextGeneration, creationOperationId, projection, panelBinding, ...uncertainOperationId ? { uncertainOperationId } : {}, inputSummary: { total: inputs.length, queued: inputs.filter((x) => x.status === "queued").length, running: inputs.filter((x) => x.status === "running").length, resolved: inputs.filter((x) => x.status === "resolved").length, cancelled: inputs.filter((x) => x.status === "cancelled").length, blocked: inputs.filter((x) => x.status === "blocked").length, processing: available ? "available" : "unavailable" } };
}
var defaultTimers = { setTimeout: (run, delayMs) => ({ id: Number(setTimeout(run, delayMs)) }), clearTimeout: (timer) => clearTimeout(timer.id) };
function recordedNativeEvent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const type = "type" in value && typeof value.type === "string" ? value.type : void 0;
  const sessionId = "sessionId" in value && typeof value.sessionId === "string" ? value.sessionId : void 0;
  const seq = "seq" in value && typeof value.seq === "number" && Number.isSafeInteger(value.seq) ? value.seq : void 0;
  const data = "data" in value && value.data && typeof value.data === "object" ? value.data : void 0;
  const callId = data && "callId" in data && typeof data.callId === "string" ? data.callId : void 0;
  const sourceEventSeqs = "sourceEventSeqs" in value && Array.isArray(value.sourceEventSeqs) ? value.sourceEventSeqs.filter((entry) => typeof entry === "number" && Number.isSafeInteger(entry)) : [];
  return { type, sessionId, seq, callId, sourceEventSeqs };
}
async function recoverNativeGaps(home, turn, state) {
  for (const record of state.nativeRecords.filter((x) => x.runId === turn.runId && x.provenance === "native-session")) {
    const raw = recordedNativeEvent(record.data);
    if (raw?.type !== "tool/call" || !raw.callId) continue;
    const callId = raw.callId;
    const closed = raw.sessionId !== void 0 && raw.seq !== void 0 && state.nativeRecords.some((x) => {
      const data = recordedNativeEvent(x.data);
      return x.runId === turn.runId && x.provenance === "native-session" && data?.type === "tool/result" && data.sessionId === raw.sessionId && data.sourceEventSeqs.some((seq) => seq === raw.seq);
    });
    const gap = state.nativeRecords.some((x) => x.data.sourceNativeId === record.nativeId);
    if (!closed && !gap) await home.recordNative({ operationId: OperationId("gap-" + createHash5("sha256").update(turn.runId + record.nativeId).digest("hex")), record: { runId: turn.runId, nativeId: NativeExposureId("interrupted-" + record.nativeId), provenance: "native-session", data: { kind: "native-exposure-gap", sourceNativeId: record.nativeId, callId, reason: "PROCESS_INTERRUPTED", toolAdmission: "unavailable" } } });
  }
}
async function recoverPendingAttempts(home, turn, state) {
  for (const old of state.attempts.filter((x) => x.runId === turn.runId && !x.outcome)) await home.recordAttempt({ operationId: OperationId("recover-" + old.attemptId), attemptId: old.attemptId, outcome: { kind: old.enteredAt ? "failed" : "not-dispatched", code: "PROCESS_INTERRUPTED" } });
  return recoverFileEffects(home, turn, state);
}
async function startRole(capability, ports) {
  let activationReadHome;
  if (capability && "readSnapshot" in capability) {
    const diagnostic2 = await capability.readActivationDiagnostic?.() ?? (ports.readOnlyAdmission ? { ...await capability.readDiagnostic(), mode: "read-only", reason: ports.readOnlyAdmission, recovery: ["complete-local-registration"] } : void 0);
    if (diagnostic2) {
      const readonlyHome = capability;
      activationReadHome = readonlyHome;
      capability = { kind: "diagnostic", readDiagnostic: async () => {
        const current = await readonlyHome.readActivationDiagnostic?.();
        return current ?? { ...await readonlyHome.readDiagnostic(), mode: "read-only", reason: readonlyHome.restoreAcceptanceSnapshot() ? "RESTORE_ACCEPTED_REOPEN_REQUIRED" : "RESTORE_ADMISSION_RECHECK_REQUIRED", recovery: ["complete-local-registration"] };
      }, close: () => readonlyHome.close() };
    }
  }
  const home = capability && "readSnapshot" in capability ? capability : void 0;
  const execution = home ? ports.execution : void 0;
  const restored = home?.restoreAcceptanceSnapshot();
  const backups = (home ?? activationReadHome)?.backups ?? capability?.backups;
  let maintenancePending = !!(await backups?.pending())?.length;
  let cleanupSealed = !!home?.cleanupSnapshots().some((task) => task.phase !== "complete");
  let formatUpgradeSealed = false;
  const sealed = () => cleanupSealed || formatUpgradeSealed;
  const cleanupRuns = /* @__PURE__ */ new Map();
  const backupRequests = /* @__PURE__ */ new Map();
  const backupRuns = /* @__PURE__ */ new Map(), backupErrors = /* @__PURE__ */ new Map();
  let status = "not-ready", stopReason = "", fault = "", archiveFault = "", lifecycleFault = "", blockedTurnReason = "", blockedTurn, working, currentAbort, reschedule = false;
  const clock = ports.clock ?? createNodeClock(ports.now);
  const now = () => {
    if (ports.clock) {
      try {
        return new Date(clock.read().utc).toISOString();
      } catch {
      }
    }
    return (ports.now?.() ?? /* @__PURE__ */ new Date()).toISOString();
  };
  const autonomyStamp = async () => {
    if (!home) throw new ExecutionError("HOME_UNAVAILABLE");
    const state = await home.readAutonomy(), reading = clock.read();
    return { snapshotVersion: 1, clock: reading, day: effectiveAutonomyDay(state, reading, clock.day(reading.utc, state.rules.value.timeZone)), rulesVersion: state.rules.version };
  };
  const contactStamp = async () => {
    if (!home) throw new ExecutionError("HOME_UNAVAILABLE");
    const state = await home.readAutonomy(), reading = clock.read(), rules = await home.readContactRules();
    if (!clock.local) throw new ExecutionError("CLOCK_LOCAL_UNAVAILABLE");
    const local = clock.local(reading.utc, state.rules.value.timeZone);
    return { snapshotVersion: 1, clock: reading, day: effectiveAutonomyDay(state, reading, clock.day(reading.utc, state.rules.value.timeZone)), localMinutes: local.localMinutes, rulesVersion: rules.version };
  };
  const contactReadStamp = async () => {
    try {
      return await contactStamp();
    } catch {
      return void 0;
    }
  };
  let homeClosed = false, homeReleased;
  const homeRelease = new Promise((resolve) => homeReleased = resolve);
  execution?.retainRecordingUntil?.(homeRelease);
  let activeStopId, stopRequest, stopTask, stopOperation, stopError = "", stopStep = "actions";
  const retainedStops = /* @__PURE__ */ new Map();
  const retainedCleanups = /* @__PURE__ */ new Map();
  const retainedFormatUpgrades = /* @__PURE__ */ new Map();
  let formatUpgradeTask;
  let activeHandover;
  const retainedHandovers = /* @__PURE__ */ new Map();
  const handoverRequests = /* @__PURE__ */ new Map();
  const handoverIntents = /* @__PURE__ */ new Map();
  const handoverRecoveryWrites = /* @__PURE__ */ new Map();
  if (home) {
    const upgrade = await home.pendingFormatUpgrade();
    if (upgrade) {
      formatUpgradeTask = upgrade;
      if (!isFormatUpgradeTerminal(upgrade.phase)) formatUpgradeSealed = true;
    }
  }
  let retainedHome = home ? await projectHome(home) : activationReadHome ? await projectHome(activationReadHome) : void 0;
  let resolveStopped;
  const stopped = new Promise((r) => resolveStopped = r);
  if (home && execution?.restoreOwnership) {
    const history = await home.readConversation();
    execution.restoreOwnership(history.attempts.flatMap((attempt) => {
      const data = attempt.outcome?.data;
      const id = data?.request?.sessionId;
      return typeof id === "string" && id.length <= 512 ? [id] : [];
    }));
  }
  let ready = home && execution ? (await execution.inspect()).available : false;
  status = capability && !home ? "read-only" : ready ? "ready" : "not-ready";
  let reason = home ? execution ? ready ? "ready" : (await execution.inspect()).reason : "execution-unavailable" : capability ? "read-only-home" : "home-not-open";
  let availabilityReason = reason;
  let exclusiveFileSlot;
  const waitingFileWriters = /* @__PURE__ */ new Set();
  const readSlots = /* @__PURE__ */ new Set(), slotWaiters = /* @__PURE__ */ new Set();
  const wakeSlots = () => {
    for (const wake2 of slotWaiters) wake2();
    slotWaiters.clear();
  };
  const bodies = /* @__PURE__ */ new Set(), finals = /* @__PURE__ */ new Map();
  const quiesceTools = async () => {
    while (bodies.size) await Promise.all([...bodies]);
    while (finals.size) await Promise.all([...finals.values()]);
    await drain();
  };
  const afterTools = (action) => {
    if (!bodies.size && !finals.size && !toolDebts.size) action();
    else void quiesceTools().then(action).catch(() => {
    });
  };
  const debts = /* @__PURE__ */ new Set(), toolDebts = /* @__PURE__ */ new Set();
  const archives = /* @__PURE__ */ new Map();
  const archiveJobs = () => [...archives].flatMap(([operationId, jobs]) => [...jobs].map((job) => ({ operationId, job })));
  const removeArchive = (operationId, job) => {
    const jobs = archives.get(operationId);
    if (!jobs) return;
    jobs.delete(job);
    if (!jobs.size && archives.get(operationId) === jobs) archives.delete(operationId);
  };
  function archive(operationId, save, toolLifetime = false) {
    const job = { save, task: Promise.resolve(), code: "", toolLifetime }, jobs = archives.get(operationId) ?? /* @__PURE__ */ new Set();
    jobs.add(job);
    archives.set(operationId, jobs);
    job.task = Promise.resolve().then(save);
    debts.add(job.task);
    if (toolLifetime) toolDebts.add(job.task);
    void job.task.then(() => {
      debts.delete(job.task);
      toolDebts.delete(job.task);
      removeArchive(operationId, job);
    }, (error) => {
      job.code = safeExecutionCode(error);
      archiveFault = archiveFault || job.code;
    });
    return job.task;
  }
  const drain = async () => {
    while (debts.size) await Promise.all([...debts]);
    if (fault || archiveFault) throw new ExecutionError(archiveFault || fault);
  };
  let autonomyWakeIssued = false, autonomyEpoch = 0, receivingInputs = 0, activeAutonomous;
  const timers = ports.timers ?? defaultTimers;
  let schedulerTimer, schedulersRunning = false, schedulerSkipReason = null, schedulerNextAt, schedulerArmed = false;
  function clearScheduler() {
    if (schedulerTimer !== void 0) {
      timers.clearTimeout(schedulerTimer);
      schedulerTimer = void 0;
      schedulerArmed = false;
    }
  }
  const schedulableSchedule = (schedule2) => ({ ...schedule2 });
  const sealAutonomy = () => {
    autonomyEpoch++;
    const active = activeAutonomous;
    if (active) afterTools(() => active.abort("AUTONOMOUS_PREEMPTED"));
    wakeSlots();
  };
  const writable = () => !maintenancePending && (status === "ready" || status === "not-ready");
  const restoreRuntime = createRestoreRuntime(ports.restore, () => !home && status !== "stopping" && status !== "stopped");
  const readHome = () => {
    if (!homeClosed && home && writable()) return home;
    if (!homeClosed && activationReadHome && status === "read-only") return activationReadHome;
    throw new ExecutionError("HOME_UNAVAILABLE");
  };
  async function receiveInput(input) {
    if (sealed()) return { kind: "rejected", reason: "stopping" };
    sealAutonomy();
    receivingInputs++;
    try {
      return await receiveBoundInput(input);
    } finally {
      receivingInputs--;
      schedule();
    }
  }
  async function receiveBoundInput(input) {
    if (maintenancePending || sealed()) return { kind: "rejected", reason: "stopping" };
    if (!writable()) return { kind: "rejected", reason: status === "read-only" ? "read-only" : "stopping" };
    if (home && !input.bindingId && Buffer.byteLength(input.text, "utf8") > (await home.readSnapshot()).settings.value.inputLimitBytes) return { kind: "rejected", reason: "input-too-large" };
    if (!home || !input.bindingId) return { kind: "rejected", reason: "not-ready" };
    try {
      const receipt = await home.acceptInput(input);
      schedule();
      return receipt;
    } catch (error) {
      const code = safeExecutionCode(error);
      if (code === "READ_ONLY_HOME") status = "read-only";
      if (code === "IO_UNCERTAIN") return { kind: "uncertain", operationId: error instanceof Error && "operationId" in error && typeof error.operationId === "string" ? OperationId(error.operationId) : input.operationId, reason: "IO_UNCERTAIN" };
      const reason2 = code === "READ_ONLY_HOME" ? "read-only" : code === "INPUT_TOO_LARGE" ? "input-too-large" : code === "INPUT_NOT_BOUND" ? "not-bound" : code === "INPUT_KEY_CONFLICT" ? "key-conflict" : code === "OPERATION_CONFLICT" ? "operation-conflict" : ["INVALID_INPUT", "INVALID_VALUE", "INVALID_OPERATION_ID"].includes(code) ? "invalid-input" : "storage-error";
      return { kind: "rejected", operationId: input.operationId, reason: reason2, errorCode: code };
    }
  }
  function historyWait(pending, signal) {
    if (signal.aborted) return Promise.reject(new ExecutionError(typeof signal.reason === "string" ? signal.reason : "QQ_HISTORY_ADMISSION_CHANGED"));
    return new Promise((resolve, reject) => {
      const cancel = () => {
        signal.removeEventListener("abort", cancel);
        reject(new ExecutionError(typeof signal.reason === "string" ? signal.reason : "QQ_HISTORY_ADMISSION_CHANGED"));
      };
      signal.addEventListener("abort", cancel, { once: true });
      void pending.then(() => {
        signal.removeEventListener("abort", cancel);
        resolve();
      }, (error) => {
        signal.removeEventListener("abort", cancel);
        reject(error);
      });
    });
  }
  async function historyLocalIdle(target, signal) {
    for (; ; ) {
      if (signal.aborted) throw new ExecutionError(typeof signal.reason === "string" ? signal.reason : "QQ_HISTORY_ADMISSION_CHANGED");
      if (!writable() || !home || homeClosed || sealed()) throw new ExecutionError("ROLE_STOPPING");
      if (!sameQQTarget((await home.readSnapshot()).qqBinding, target)) throw new ExecutionError("QQ_BINDING_CHANGED");
      if (working) {
        await historyWait(working, signal);
        continue;
      }
      if (deliveryScheduler) {
        await historyWait(deliveryScheduler, signal);
        continue;
      }
      const send = sendingTasks.get(deliveryLane(target));
      if (send) {
        await historyWait(send, signal);
        continue;
      }
      return;
    }
  }
  const historyRuntime = home ? createQQHistoryRuntime({ home, port: ports.history, now, archive, receive: receiveInput, guard: async () => {
    if (!writable() || homeClosed || sealed()) throw new ExecutionError("ROLE_STOPPING");
    if (blockedTurn) throw new ExecutionError("TURN_FINALIZATION_PENDING");
    if (startupPending || !startupRecovered) throw new ExecutionError("STOP_RECOVERY_PENDING");
    await drain();
  }, localIdle: historyLocalIdle }) : void 0;
  const diagnostic = async () => {
    if (status === "stopping" || status === "stopped") return { mode: "read-only", reason: status, claimedRoleId: home?.roleId ?? null, verifiedRoleId: null, verifiedRevision: null, recovery: [], evidence: [] };
    const result = capability ? await capability.readDiagnostic() : { mode: "read-only", reason: "HOME_NOT_OPEN", claimedRoleId: null, verifiedRoleId: null, verifiedRevision: null, recovery: [], evidence: [] };
    if (capability && result.mode === "read-only" && writable()) status = "read-only";
    return result;
  };
  let recovering = true, startupPending = false, startupRecovered = true, lastContactBlocked = null;
  let deliveryScheduler, deliveryReschedule = false;
  const sendingTasks = /* @__PURE__ */ new Map(), queuedDeliveryLanes = /* @__PURE__ */ new Set(), abandonedSends = /* @__PURE__ */ new Set();
  const deliveryPort = home ? ports.delivery : void 0;
  const deliveryLane = (binding) => JSON.stringify([binding.bindingId, binding.version, binding.connectionId, binding.accountId, binding.peerId]);
  async function sendPending(binding) {
    if (!home || !deliveryPort || !writable() || sealed() || fault || archiveFault || blockedTurn) return;
    for (; ; ) {
      if (!writable() || sealed() || fault || archiveFault || blockedTurn) return;
      const snapshot = await home.readSnapshot(), state = await home.readConversation();
      if (!writable() || sealed() || fault || archiveFault || blockedTurn || !sameQQTarget(snapshot.qqBinding, binding)) return;
      if (snapshot.uncertainOperationId) return;
      if (snapshot.revision !== state.revision) continue;
      const eligible = (d) => restoreDeliveryEligible(restored, d, state) && d.status === "pending" && sameQQTarget(binding, d.target) && deliveryPort.canSend(d.target);
      const candidate = state.deliveries.find((d) => d.qualification === "main-reply" && eligible(d)) ?? state.deliveries.find((d) => d.qualification === "contact" && eligible(d));
      if (!candidate) return;
      const delivery = candidate;
      const id = SendAttemptId("send-" + randomUUID3()), operationId = OperationId("begin-delivery-" + id);
      let attempt;
      const contact = candidate.qualification === "contact";
      let stamp, deliveryNow;
      if (contact) {
        try {
          stamp = await contactStamp();
          deliveryNow = stamp.clock.utc;
        } catch (error) {
          const code = safeExecutionCode(error);
          if (!["CLOCK_LOCAL_UNAVAILABLE", "CLOCK_UNAVAILABLE", "IANA_DATA_CHANGED", "CLOCK_ROLLBACK", "HOME_UNAVAILABLE"].includes(code)) throw error;
          return;
        }
      } else deliveryNow = now();
      try {
        await archive(operationId, async () => {
          try {
            attempt = await home.beginDelivery({ operationId, deliveryId: candidate.deliveryId, sendAttemptId: id, expectedRevision: state.revision, expectedRulesVersion: state.deliveryRules.version, now: deliveryNow, ...contact && stamp && candidate.contactIntentId ? { contact: { stamp, intentId: candidate.contactIntentId } } : {} });
          } catch (error) {
            const code = safeExecutionCode(error);
            if (contact) lastContactBlocked = code;
            if (["REVISION_CONFLICT", "DELIVERY_RULES_VERSION_CONFLICT", "DELIVERY_NOT_PENDING", "QQ_BINDING_CHANGED", "CONTACT_QUIET_HOURS", "CONTACT_COOLDOWN", "CONTACT_DAILY_LIMIT", "CONTACT_ROUND_LIMIT", "CONTACT_INTENT_CLOSED", "CONTACT_RULES_CHANGED", "AUTONOMOUS_REST", "AUTONOMY_PAUSED", "CLOCK_ROLLBACK", "IANA_DATA_CHANGED", "CLOCK_UNAVAILABLE"].includes(code)) return;
            throw error;
          }
        });
      } catch {
        abandonedSends.add(id);
        return;
      }
      if (!attempt) return;
      if (contact) lastContactBlocked = null;
      let dispatched = false;
      const savedAttempt = attempt;
      const prepared = Object.freeze({ delivery: structuredClone(delivery), attempt: structuredClone(savedAttempt), async invoke(effect) {
        const admission = home.admission;
        if (dispatched || admission.contextGeneration !== snapshot.contextGeneration || !writable() || fault || archiveFault || blockedTurn || admission.pendingOwnerChange || !deliveryPort.canSend(delivery.target) || Date.parse(now()) >= Date.parse(savedAttempt.deadline)) throw new ExecutionError("SEND_NOT_DISPATCHED");
        dispatched = true;
        return effect();
      } });
      let observation;
      try {
        observation = await deliveryPort.send(prepared);
        if (!dispatched && observation.kind !== "rejected") observation = { kind: "rejected", code: "SEND_NOT_DISPATCHED" };
      } catch {
        observation = { kind: dispatched ? "unknown" : "rejected", code: dispatched ? "QQ_SEND_UNCERTAIN" : "SEND_NOT_DISPATCHED" };
      }
      const stable = structuredClone(observation);
      await archive(OperationId("settle-" + id), () => home.settleDelivery({ operationId: OperationId("settle-" + id), sendAttemptId: id, observation: stable }));
    }
  }
  function scheduleDelivery() {
    const owner = home, port = deliveryPort;
    if (!owner || !port || !writable() || sealed() || archiveFault || fault) return;
    if (deliveryScheduler) {
      deliveryReschedule = true;
      return;
    }
    const task = Promise.resolve().then(async () => {
      const binding = (await owner.readSnapshot()).qqBinding;
      if (!binding || !writable() || sealed() || fault || archiveFault || blockedTurn || !port.canSend(binding)) return;
      const key = deliveryLane(binding);
      if (sendingTasks.has(key)) {
        queuedDeliveryLanes.add(key);
        return;
      }
      const send = Promise.resolve().then(() => sendPending(binding)).catch((error) => {
        if (!archiveFault) fault = safeExecutionCode(error);
      }).finally(() => {
        if (sendingTasks.get(key) === send) sendingTasks.delete(key);
        if (queuedDeliveryLanes.delete(key)) scheduleDelivery();
      });
      sendingTasks.set(key, send);
    }).catch((error) => {
      if (!archiveFault) fault = safeExecutionCode(error);
    }).finally(() => {
      if (deliveryScheduler === task) deliveryScheduler = void 0;
      if (deliveryReschedule) {
        deliveryReschedule = false;
        scheduleDelivery();
      }
    });
    deliveryScheduler = task;
  }
  const unlistenDelivery = deliveryPort?.onAvailability?.(() => {
    scheduleDelivery();
    schedule();
  });
  if (home) {
    for (const attempt of (await home.readConversation()).sendAttempts.filter((a) => !a.observation)) await archive(OperationId("recover-send-" + attempt.sendAttemptId), () => home.settleDelivery({ operationId: OperationId("recover-send-" + attempt.sendAttemptId), sendAttemptId: attempt.sendAttemptId, observation: { kind: "unknown", code: "PROCESS_INTERRUPTED" } }));
  }
  const completeStartup = () => {
    void historyRuntime?.activate();
    if (maintenancePending) {
      reason = "BACKUP_MAINTENANCE_PENDING";
      return;
    }
    if (sealed()) {
      reason = formatUpgradeSealed ? "FORMAT_UPGRADE_PENDING" : "SOURCE_CLEANUP_PENDING";
      return;
    }
    if (startupRecovered && !fault && !archiveFault && status === "not-ready") {
      status = ready ? "ready" : "not-ready";
      reason = ready ? "ready" : availabilityReason;
    }
  };
  async function work() {
    if (!home || !execution || status !== "ready" || fault || archiveFault || blockedTurn || maintenancePending || sealed()) return;
    while (status === "ready" && !fault && !archiveFault && !blockedTurn && !sealed()) {
      const snapshot = await home.readSnapshot(), state = await home.readConversation();
      let turn = state.turns.find((x) => x.status === "running" && restoreRunEligible(restored, x.runId));
      if (turn && recovering) {
        await recoverNativeGaps(home, turn, state);
        if (turn.source === "autonomous") {
          await recoverPendingAttempts(home, turn, state);
          await home.suspendAutonomous({ operationId: OperationId("recover-autonomous-" + turn.runId), runId: turn.runId, reason: "PROCESS_INTERRUPTED" });
          recovering = false;
          continue;
        }
      }
      recovering = false;
      const queued = snapshot.inputs.filter((x) => x.status === "queued" && restoreInputEligible(restored, x));
      const first = queued.find((x) => runnableInput(x, !!deliveryPort && !!snapshot.qqBinding && deliveryPort.canSend(snapshot.qqBinding)));
      if (!turn && !first) {
        if (receivingInputs || !autonomyWakeIssued || !state.autonomy.pending) return;
        try {
          const stamp = await autonomyStamp();
          turn = await home.beginAutonomous({ operationId: OperationId("autonomous-" + randomUUID3()), runId: RunId("run-" + randomUUID3()), expectedRevision: state.revision, now: stamp.clock.utc, stamp });
        } catch (error) {
          const code = safeExecutionCode(error);
          if (code === "REVISION_CONFLICT") continue;
          if (["AUTONOMOUS_MODEL_LIMIT", "AUTONOMOUS_REST", "CLOCK_ROLLBACK", "IANA_DATA_CHANGED", "CLOCK_UNAVAILABLE", "AUTONOMY_RULES_CHANGED"].includes(code)) return;
          throw error;
        }
      }
      if (!turn) {
        const group = [];
        for (const x of queued.slice(queued.indexOf(first))) {
          if (group.length === 8 || x.bindingId !== first.bindingId || x.bindingVersion !== first.bindingVersion) break;
          group.push(x.inputId);
        }
        try {
          turn = await home.beginTurn({ operationId: OperationId("begin-" + randomUUID3()), inputIds: group, runId: RunId("run-" + randomUUID3()), expectedRevision: snapshot.revision, now: now() });
        } catch (e) {
          if (safeExecutionCode(e) === "REVISION_CONFLICT") continue;
          throw e;
        }
      }
      if (await recoverPendingAttempts(home, turn, state)) {
        const latest = await home.readSnapshot(), input = latest.inputs.find((item) => item.inputId === turn.inputIds[0]), revoked = input?.channel === "qq" && (!latest.qqBinding || latest.qqBinding.bindingId !== turn.bindingId || latest.qqBinding.version !== turn.bindingVersion);
        if (!revoked && turn.contextGeneration !== latest.contextGeneration) await home.refreshTurnContext({ operationId: OperationId("file-recovery-refresh-" + turn.runId), runId: turn.runId, previousGeneration: turn.contextGeneration, nextGeneration: latest.contextGeneration });
        await home.finishTurn({ operationId: OperationId("file-recovery-finish-" + turn.runId), runId: turn.runId, contextGeneration: revoked ? turn.contextGeneration : latest.contextGeneration, outcome: { kind: "failure", reason: revoked ? "QQ_BINDING_CHANGED" : "FILE_ACTION_RECONCILIATION_REQUIRED" } });
        continue;
      }
      const abort = new AbortController();
      currentAbort = abort;
      const timer = setTimeout(() => {
        runFault = runFault || "TURN_DEADLINE";
        afterTools(() => abort.abort());
      }, Math.max(1, Date.parse(turn.deadline) - Date.parse(now())));
      const currentTurn = turn, issuedEpoch = autonomyEpoch, issuedAutonomyRulesVersion = state.autonomy.rules.version;
      let runFault = "";
      const preempted = () => currentTurn.source === "autonomous" && (issuedEpoch !== autonomyEpoch || receivingInputs > 0 || home.admission.autonomyRulesVersion !== issuedAutonomyRulesVersion);
      if (currentTurn.source === "autonomous") activeAutonomous = abort;
      const grantedMaterials = /* @__PURE__ */ new Map();
      const dispatchClock = () => {
        if (currentTurn.source !== "autonomous") return;
        const reading = clock.read(), problem = clockProblem(home.admission.autonomyClock, reading);
        if (problem) return home.checkAutonomyClock({ operationId: OperationId("clock-dispatch-" + randomUUID3()), clock: reading }).then(() => {
          throw new ExecutionError(problem);
        });
      };
      const bindingRevoked = (snapshot2) => snapshot2.inputs.find((input) => input.inputId === currentTurn.inputIds[0])?.channel === "qq" && (!snapshot2.qqBinding || snapshot2.qqBinding.bindingId !== currentTurn.bindingId || snapshot2.qqBinding.version !== currentTurn.bindingVersion);
      const issueSources = async () => {
        let reader;
        try {
          const readSnapshot2 = await home.readSnapshot(), currentInputs2 = currentTurn.inputIds.map((id) => {
            const input = readSnapshot2.inputs.find((input2) => input2.inputId === id);
            if (!input || input.status !== "running" || input.bindingId !== currentTurn.bindingId || input.bindingVersion !== currentTurn.bindingVersion) throw new ExecutionError("INPUT_SCOPE_CHANGED");
            return input;
          });
          reader = await home.openContextReader({ purpose: currentInputs2.some((input) => input.contextPurpose === "history") ? "history" : "daily", runId: currentTurn.runId });
          return { readSnapshot: readSnapshot2, currentInputs: currentInputs2, contextReader: reader, grantedSources: await reader.list() };
        } catch (error) {
          reader?.revoke();
          throw error;
        }
      };
      let admitted;
      try {
        admitted = await issueSources();
      } catch (error) {
        clearTimeout(timer);
        abort.abort();
        currentAbort = void 0;
        const latest = await home.readSnapshot();
        if (bindingRevoked(latest)) {
          await archive(OperationId("failure-" + currentTurn.runId), async () => {
            await home.finishTurn({ operationId: OperationId("failure-" + currentTurn.runId), runId: currentTurn.runId, contextGeneration: currentTurn.contextGeneration, outcome: { kind: "failure", reason: "QQ_BINDING_CHANGED" } });
          });
          continue;
        }
        if (isContextInvalidation(safeExecutionCode(error)) && latest.contextGeneration !== currentTurn.contextGeneration) {
          await home.refreshTurnContext({ operationId: OperationId("refresh-" + randomUUID3()), runId: currentTurn.runId, previousGeneration: currentTurn.contextGeneration, nextGeneration: latest.contextGeneration });
          continue;
        }
        throw error;
      }
      const { readSnapshot, currentInputs, contextReader, grantedSources } = admitted;
      let contextDependencies = [];
      const firstSequence = Math.min(...currentInputs.map((input) => input.receiveSequence));
      const previousInput = readSnapshot.inputs.filter((input) => input.status === "resolved" && input.receiveSequence < firstSequence && input.bindingId === currentTurn.bindingId && input.bindingVersion === currentTurn.bindingVersion).at(-1);
      const readGrants = Object.freeze({ rule: contextReader.purpose === "history" ? "fixed-history-snapshot" : "fixed-daily-snapshot", basis: contextReader.basis, sources: grantedSources, coreVersion: readSnapshot.core.version, inputs: Object.freeze(currentInputs.map((input) => Object.freeze({ inputId: input.inputId, experienceId: input.experienceId }))), previousExperience: previousInput ? Object.freeze({ inputId: previousInput.inputId, experienceId: previousInput.experienceId }) : null });
      const initialSourceKeys = new Set(grantedSources.map((source) => JSON.stringify(source.ref)));
      const readScopedSource = async (ref) => {
        if (initialSourceKeys.has(JSON.stringify(ref))) return contextReader.read(ref);
        await contextReader.check([]);
        if (ref.kind !== "tool") throw new ExecutionError("CONTEXT_SOURCE_NOT_GRANTED");
        return (await home.readCurrentToolSource({ roleId: readSnapshot.roleId, runId: currentTurn.runId, contextGeneration: currentTurn.contextGeneration, initialRevision: contextReader.basis.revision, attemptId: ref.id, purpose: contextReader.purpose === "history" ? "history" : "daily" })).source;
      };
      const proposalReader = Object.freeze({ ...contextReader, read: readScopedSource });
      let processingProposals;
      const processReadyProposals = async () => {
        if (processingProposals) return processingProposals;
        const task = (async () => {
          await drain();
          const knowledge = await home.readKnowledge(), conversation = await home.readConversation();
          for (const p of knowledge.proposals.filter((p2) => p2.runId === currentTurn.runId && !p2.processing)) {
            const attempt = conversation.attempts.find((a) => a.attemptId === p.attemptId);
            if (!attempt?.outcome || !canonicalProposalRecorded(attempt, p, conversation.nativeRecords)) continue;
            let assessment = { status: "reject", reason: "PROPOSAL_RUN_CLOSED", sources: [] };
            if (!sealed() && status === "ready" && !abort.signal.aborted && !runFault && Date.parse(now()) < Date.parse(currentTurn.deadline)) try {
              assessment = await checkKnowledgeProposal(p.value, Object.freeze({ ...proposalReader, read: async (ref) => {
                const basis = p.claim.sourceBasis?.find((basis2) => JSON.stringify(basis2.ref) === JSON.stringify(ref));
                const source = basis?.currentRun && ref.kind === "tool" ? (await home.readCurrentToolSource({ roleId: readSnapshot.roleId, runId: p.runId, contextGeneration: p.claim.contextGeneration, initialRevision: basis.currentRun.initialRevision, attemptId: ref.id, purpose: contextReader.purpose === "history" ? "history" : "daily" })).source : await proposalReader.read(ref);
                if (basis && basis.contentDigest !== source.contentDigest) throw new ExecutionError("CONTEXT_SOURCE_CHANGED");
                return source;
              } }), (await home.readSnapshot()).inputs);
            } catch {
              assessment = { status: "reject", reason: "PROPOSAL_CONTEXT_STALE", sources: [] };
            }
            if (sealed() || status !== "ready" || abort.signal.aborted || runFault || Date.parse(now()) >= Date.parse(currentTurn.deadline)) assessment = { status: "reject", reason: Date.parse(now()) >= Date.parse(currentTurn.deadline) ? "PROPOSAL_DEADLINE" : "PROPOSAL_RUN_CLOSED", sources: [] };
            const stable = structuredClone(assessment);
            await archive(OperationId("process-" + p.proposalId), () => home.processProposal({ operationId: OperationId("process-" + p.proposalId), proposalId: p.proposalId, assessment: stable, now: now() }).then(() => {
            }), true);
          }
        })();
        processingProposals = task;
        try {
          await task;
        } finally {
          if (processingProposals === task) processingProposals = void 0;
        }
      };
      const parameters = async () => {
        if (sealed()) throw new ExecutionError("SOURCE_CLEANUP");
        if (preempted()) throw new ExecutionError("AUTONOMOUS_PREEMPTED");
        if (currentTurn.source === "autonomous") await home.checkAutonomyClock({ operationId: OperationId("clock-admission-" + randomUUID3()), clock: clock.read() });
        await processReadyProposals();
        if (blockedTurn) throw new ExecutionError(lifecycleFault || archiveFault || "TURN_FINALIZATION_PENDING");
        if (runFault) throw new ExecutionError(runFault);
        if (Date.parse(now()) >= Date.parse(currentTurn.deadline)) throw new ExecutionError("TURN_DEADLINE");
        if (sealed() || status !== "ready" || abort.signal.aborted) throw new ExecutionError(status === "ready" ? "TURN_DEADLINE" : "ROLE_STOPPING");
        const s = await home.readSnapshot();
        if (bindingRevoked(s)) throw new ExecutionError("QQ_BINDING_CHANGED");
        if (s.contextGeneration !== currentTurn.contextGeneration) throw new ExecutionError("CONTEXT_STALE");
        await contextReader.check(contextDependencies);
        const state2 = await home.readConversation();
        if (currentTurn.source === "autonomous" && state2.autonomy.restUntil && Date.parse(now()) < Date.parse(state2.autonomy.restUntil)) throw new ExecutionError("AUTONOMOUS_REST");
        return currentTurn.source === "autonomous" ? state2.autonomy.rules.value : state2.rules.value;
      };
      const readSourceContent = async (request) => {
        await parameters();
        if (!Number.isSafeInteger(request.offset) || request.offset < 0 || !Number.isSafeInteger(request.limit) || request.limit < 1) throw new ExecutionError("INVALID_ROLE_READ");
        const snapshot2 = await home.readSnapshot(), admission = home.admission;
        if (snapshot2.roleId !== readSnapshot.roleId || admission.pendingOwnerChange || admission.contextGeneration !== currentTurn.contextGeneration || snapshot2.core.version !== readGrants.coreVersion) throw new ExecutionError("CONTEXT_STALE");
        if (request.source === "core") return { source: "core", version: snapshot2.core.version, text: snapshot2.core.text };
        if (request.source === "material") {
          const material = grantedMaterials.get(request.id);
          if (!material) throw new ExecutionError("MATERIAL_NOT_GRANTED");
          return { source: "material", materialId: material.materialId, text: material.text };
        }
        if (request.source === "query") {
          const result = await searchContextSources(contextReader, request.query);
          return { source: "query", query: request.query, version: contextReader.basis.revision, text: JSON.stringify({ provenance: "local-lexical-query", purpose: contextReader.purpose, basis: contextReader.basis, notFound: !result.sources.length, sources: result.sources, constraints: result.constraints }) };
        }
        if (request.source === "knowledge") {
          const source = await contextReader.read({ kind: "knowledge", id: request.id, version: request.version });
          return { source: "knowledge", knowledgeId: request.id, version: request.version, text: source.text };
        }
        if (request.source === "reply") {
          const source = await contextReader.read({ kind: "reply", id: request.id });
          if (source.ref.kind !== "reply" || !("experienceId" in source) || !("committedRevision" in source)) throw new ExecutionError("ROLE_READ_NOT_GRANTED");
          return { source: "reply", replyId: request.id, experienceId: source.experienceId, version: source.committedRevision, text: source.text };
        }
        if (request.source === "tool") {
          const source = await readScopedSource({ kind: "tool", id: request.id });
          return { source: "tool", attemptId: request.id, version: source.ref.kind === "tool" && "committedRevision" in source && source.committedRevision !== void 0 ? source.committedRevision : contextReader.basis.revision, text: source.text };
        }
        const listed = await contextReader.list();
        const candidate = listed.find((source) => source.ref.kind === "input" && (request.source === "input" ? source.ref.id === request.id : "experienceId" in source && source.experienceId === request.id));
        const grant = candidate && candidate.ref.kind === "input" && "experienceId" in candidate ? { inputId: candidate.ref.id, experienceId: candidate.experienceId } : void 0;
        if (!grant) throw new ExecutionError("ROLE_READ_NOT_GRANTED");
        const input = snapshot2.inputs.find((x) => x.inputId === grant.inputId && x.experienceId === grant.experienceId);
        if (!input) throw new ExecutionError("ROLE_READ_SOURCE_UNAVAILABLE");
        await contextReader.check([{ kind: "input", id: input.inputId }]);
        return { source: request.source, version: input.committedRevision, inputId: input.inputId, experienceId: input.experienceId, text: input.text };
      };
      const readSource = async (request) => {
        const content = await readSourceContent(request);
        let ref;
        if (request.source === "input" || request.source === "experience") {
          if ("inputId" in content) ref = { kind: "input", id: content.inputId };
        } else if (request.source === "tool") ref = { kind: "tool", id: request.id };
        else if (request.source === "reply") ref = { kind: "reply", id: request.id };
        else if (request.source === "knowledge") ref = { kind: "knowledge", id: request.id, version: request.version };
        else if (request.source === "material") {
          const material = grantedMaterials.get(request.id);
          if (material) ref = { kind: "tool", id: material.attemptId };
        }
        if (!ref) return content;
        const constraints = (await contextReader.constraints()).filter((constraint) => JSON.stringify(constraint.target) === JSON.stringify(ref));
        if (!constraints.length) return content;
        const required = [...new Map(constraints.flatMap((constraint) => constraint.required).map((ref2) => [JSON.stringify(ref2), ref2])).values()], sources = [];
        for (const requiredRef of required) sources.push(await contextReader.read(requiredRef));
        return { ...content, qualifiers: JSON.stringify({ constraints, sources }) };
      };
      const scope = Object.freeze({
        runId: turn.runId,
        source: currentTurn.source,
        signal: abort.signal,
        parameters,
        async drain() {
          await drain();
          await processReadyProposals();
        },
        quiesceTools,
        afterTools,
        ...ports.files ? { roleFiles: ports.files } : {},
        selectContext(refs) {
          contextDependencies = refs;
        },
        rolePropose: Object.freeze({ async check(value) {
          const proposal = parseKnowledgeProposal(value);
          await parameters();
          const rules = await home.readProposalRules();
          if (proposal.kind === "activity" && proposal.decision === "rest" && proposal.restMs > rules.value.maxRestSuggestionMs) throw new ExecutionError("REST_SUGGESTION_LIMIT");
          for (const source of proposal.sources) await readScopedSource(source.ref);
        } }),
        roleRead: Object.freeze({ grants: readGrants, async check(request) {
          await readSource(request);
        }, async read(request) {
          const source = await readSource(request), points = Array.from(source.text);
          return { ...source, text: points.slice(request.offset, request.offset + request.limit).join(""), offset: request.offset, totalCodePoints: points.length, more: request.offset + request.limit < points.length };
        } }),
        rejectRun(code) {
          runFault = runFault || (/^[A-Z][A-Z0-9_]{1,63}$/.test(code) ? code : "NATIVE_RUN_REJECTED");
        },
        registerFinalization(key, save) {
          const operationId = OperationId("final-registration-" + createHash5("sha256").update(currentTurn.runId + ":" + key).digest("hex"));
          archive(operationId, async () => {
            await save();
          }, true);
        },
        registerNative(record) {
          try {
            const stable = structuredClone(record);
            const operationId = OperationId("native-" + createHash5("sha256").update(JSON.stringify({ runId: currentTurn.runId, provenance: stable.provenance, nativeId: stable.nativeId })).digest("hex"));
            const data = stable.data, toolLifetime = stable.provenance === "tools-result" || !!data && typeof data === "object" && ("type" in data && ["tool/call", "tool/result"].includes(String(data.type)) || "kind" in data && data.kind === "sdk-spill-gap");
            archive(operationId, () => home.recordNative({ operationId, record: { ...stable, runId: currentTurn.runId } }), toolLifetime);
          } catch (e) {
            fault = safeExecutionCode(e);
          }
        },
        async reserveTool(request, options) {
          const proposalValue = options?.kind === "proposal" ? request && typeof request === "object" && "name" in request && request.name === "role_propose" && "arguments" in request ? parseKnowledgeProposal(request.arguments) : (() => {
            throw new ExecutionError("INVALID_ROLE_PROPOSE");
          })() : void 0;
          const proposalSources = proposalValue ? await Promise.all(proposalValue.sources.map(async (source) => knowledgeSourceBasis(await readScopedSource(source.ref)))) : void 0;
          const id = AttemptId("tool-" + randomUUID3()), webId = AttemptId("web-" + randomUUID3()), logicalOpId = LogicalOpId("logical-" + randomUUID3());
          let reservedVersion, reservedReadRules, reservedFileRules, webClaim, firstWeb;
          while (true) {
            await drain();
            await parameters();
            const snapshot2 = await home.readSnapshot(), conversation = await home.readConversation();
            try {
              const autonomy = currentTurn.source === "autonomous" ? await autonomyStamp() : void 0, stamp = autonomy?.clock.utc ?? now(), common = { operationId: OperationId("reserve-" + id), runId: currentTurn.runId, attemptId: id, source: currentTurn.source, ...autonomy ? { autonomy } : {}, contextGeneration: snapshot2.contextGeneration, settingsVersion: conversation.rules.version, readRules: conversation.readRules, ...options?.kind === "file-read" || options?.kind === "file-write" ? { fileRules: conversation.fileRules, fileAccessVersion: conversation.fileAccess.version, fileOperation: options.kind === "file-write" ? "write" : "read" } : {}, expectedRevision: conversation.revision, now: stamp };
              let reserved;
              if (options?.kind === "web-search" || options?.kind === "web-fetch") {
                const rules = conversation.webRules;
                if (!request || typeof request !== "object" || !("arguments" in request) || !("name" in request) || request.name !== (options.kind === "web-search" ? "role_web_search" : "role_web_fetch")) throw new ExecutionError("INVALID_ROLE_WEB");
                parseRoleWeb(options.kind === "web-search" ? "search" : "fetch", request.arguments, rules.value.maxResults);
                webClaim = { logicalOpId, operation: options.kind === "web-search" ? "search" : "fetch", deadline: new Date(Math.min(Date.parse(currentTurn.deadline), Date.parse(stamp) + rules.value.toolTimeoutMs)).toISOString(), rules: structuredClone(rules) };
                const compound = await home.reserveWebTool({ ...common, webAttemptId: webId, webTool: webClaim });
                reserved = compound.tool;
                firstWeb = compound.web;
              } else reserved = await home.reserveAttempt({ ...common, kind: "tool", ...options?.kind === "proposal" ? { proposal: { contextGeneration: snapshot2.contextGeneration, settingsVersion: conversation.rules.version, proposalRulesVersion: conversation.proposalRules.version, initialRevision: contextReader.basis.revision, sourceBasis: proposalSources, ...currentTurn.source === "autonomous" ? { autonomyRulesVersion: conversation.autonomy.rules.version } : {}, inputSequence: currentTurn.source === "autonomous" ? currentTurn.admittedInputSequence : Math.max(...snapshot2.inputs.filter((input) => currentTurn.inputIds.includes(input.inputId)).map((input) => input.receiveSequence)) } } : {} });
              reservedVersion = conversation.rules.version;
              reservedReadRules = reserved.readRules;
              reservedFileRules = reserved.fileRules;
              break;
            } catch (error) {
              if (safeExecutionCode(error) === "REVISION_CONFLICT") continue;
              throw error;
            }
          }
          if (!reservedReadRules) throw new ExecutionError("READ_RULES_UNCONFIRMED");
          const effectiveReadRules = Object.freeze({ version: reservedReadRules.version, value: Object.freeze({ ...reservedReadRules.value }) });
          const prerequisites = [];
          let dispatched = false, observed = false, finalized = false, finalizedOutcome, bodyDone = () => {
          };
          let finalDone;
          const final = new Promise((r) => finalDone = r);
          finals.set(id, final);
          const exclusive = options?.kind === "file-write" || options?.kind === "proposal";
          const releaseSlot = () => {
            let changed = waitingFileWriters.delete(id);
            if (exclusiveFileSlot === id) {
              exclusiveFileSlot = void 0;
              changed = true;
            }
            if (readSlots.delete(id)) changed = true;
            if (changed) wakeSlots();
          };
          const acquireSlot = async () => {
            if (exclusive) waitingFileWriters.add(id);
            while (true) {
              await drain();
              await parameters();
              if (home.admission.readRulesVersion !== effectiveReadRules.version) throw new ExecutionError("READ_RULES_CHANGED");
              if (!exclusiveFileSlot && (exclusive ? readSlots.size === 0 : !waitingFileWriters.size && readSlots.size < effectiveReadRules.value.toolConcurrency)) {
                readSlots.add(id);
                if (exclusive) {
                  waitingFileWriters.delete(id);
                  exclusiveFileSlot = id;
                }
                return;
              }
              await new Promise((resolve) => slotWaiters.add(resolve));
            }
          };
          const registerMaterial = (body) => {
            const material = { ...structuredClone(body), materialId: MaterialId("material-" + randomUUID3()), attemptId: id };
            const operationId = OperationId("capture-" + material.materialId), prerequisite = { confirmed: false, task: Promise.resolve() };
            prerequisites.push(prerequisite);
            prerequisite.task = archive(operationId, async () => {
              await home.captureMaterial({ operationId, material });
              prerequisite.confirmed = true;
              grantedMaterials.set(material.materialId, material);
            }, true);
            return { material, saved: prerequisite.task };
          };
          const web = webClaim && firstWeb ? issueWebOperation({ home, first: firstWeb, toolId: id, claim: webClaim, dispatchClock, ...currentTurn.source === "autonomous" ? { stamp: autonomyStamp } : {}, now, parameters, drain, archive: (operationId, save) => archive(operationId, save, true), check: () => {
            const admission = home.admission;
            if (fault || archiveFault || runFault || preempted() || maintenancePending || status !== "ready" || abort.signal.aborted || admission.pendingOwnerChange || admission.contextGeneration !== currentTurn.contextGeneration || admission.settingsVersion !== reservedVersion || admission.webRulesVersion !== webClaim.rules.version || admission.readRulesVersion !== effectiveReadRules.version || Date.parse(now()) >= Date.parse(webClaim.deadline)) throw new ExecutionError("WEB_DISPATCH_ADMISSION_CHANGED");
          } }) : void 0;
          let proposalTask;
          const proposal = proposalValue ? Object.freeze({ save(value) {
            if (proposalTask) return proposalTask;
            if (!dispatched || JSON.stringify(parseKnowledgeProposal(value)) !== JSON.stringify(proposalValue)) throw new ExecutionError("PROPOSAL_PERMISSION_REQUIRED");
            const stable = structuredClone(proposalValue), createdAt = now(), operationId = OperationId("save-proposal-" + id), prerequisite = { confirmed: false, task: Promise.resolve() };
            let savedId;
            prerequisites.push(prerequisite);
            prerequisite.task = archive(operationId, async () => {
              const saved = await home.saveProposal({ operationId, attemptId: id, value: stable, now: createdAt });
              savedId = saved.proposalId;
              prerequisite.confirmed = true;
            }, true);
            proposalTask = prerequisite.task.then(() => {
              if (!savedId) throw new ExecutionError("PROPOSAL_SAVE_UNCONFIRMED");
              return { proposalId: savedId, toolAttemptId: id, status: "pending-final" };
            });
            return proposalTask;
          } }) : void 0;
          return Object.freeze({
            attemptId: id,
            readRules: effectiveReadRules,
            ...proposal ? { proposal } : {},
            ...web ? { web } : {},
            ...reservedFileRules ? { fileRules: reservedFileRules } : {},
            async enter() {
              try {
                await acquireSlot();
                await drain();
                await parameters();
                await home.enterAttempt({ operationId: OperationId("enter-" + id), attemptId: id, now: now() });
              } catch (error) {
                releaseSlot();
                throw error;
              }
            },
            async invoke(signal, effect) {
              while (true) {
                await drain();
                await parameters();
                if (!debts.size) break;
              }
              if (signal?.aborted) {
                releaseSlot();
                throw new ExecutionError("ROLE_READ_CANCELLED");
              }
              const admission = home.admission;
              if (fault || archiveFault || debts.size || runFault || preempted() || status !== "ready" || abort.signal.aborted || admission.pendingOwnerChange || admission.contextGeneration !== currentTurn.contextGeneration || admission.settingsVersion !== reservedVersion || admission.readRulesVersion !== effectiveReadRules.version || reservedFileRules && admission.fileRulesVersion !== reservedFileRules.version || Date.parse(now()) >= Date.parse(currentTurn.deadline)) {
                releaseSlot();
                throw new ExecutionError("DISPATCH_ADMISSION_CHANGED");
              }
              if (dispatched) throw new ExecutionError("TOOL_ALREADY_DISPATCHED");
              if (!readSlots.has(id)) throw new ExecutionError("TOOL_SLOT_UNCONFIRMED");
              const clockGate = dispatchClock();
              if (clockGate) try {
                await clockGate;
              } catch (error) {
                releaseSlot();
                throw error;
              }
              dispatched = true;
              let resolve;
              const body = new Promise((r) => resolve = r);
              bodies.add(body);
              bodyDone = () => {
                bodies.delete(body);
                releaseSlot();
                resolve();
              };
              return effect();
            },
            async observe(observation) {
              if (observed) throw new ExecutionError("TOOL_ALREADY_OBSERVED");
              observed = true;
              const stable = structuredClone({ ...observation, observedAt: now() }), prerequisite = { confirmed: false, task: Promise.resolve() };
              prerequisites.push(prerequisite);
              try {
                prerequisite.task = archive(OperationId("tool-observation-" + id), async () => {
                  await home.observeAttempt({ operationId: OperationId("tool-observation-" + id), attemptId: id, observation: stable });
                  prerequisite.confirmed = true;
                }, true);
                await prerequisite.task;
                return home.revision;
              } finally {
                bodyDone();
              }
            },
            async captureMaterial(body) {
              const registered = registerMaterial(body);
              await registered.saved;
              return registered.material;
            },
            recordDisplay(body) {
              return registerMaterial(body).material;
            },
            finalize(outcome) {
              if (!dispatched) releaseSlot();
              if (finalized) {
                if (finalizedOutcome !== outcome) fault = "TOOL_FINAL_DUPLICATE";
                return;
              }
              finalized = true;
              finalizedOutcome = outcome;
              const stable = structuredClone({ ...outcome, ...!dispatched ? { kind: "not-dispatched" } : {}, data: { request, result: outcome.data, dispatchObserved: dispatched } });
              const saved = { ...stable, kind: dispatched ? outcome.kind : "not-dispatched" };
              archive(OperationId("tool-final-" + id), async () => {
                for (const prerequisite of prerequisites) if (!prerequisite.confirmed) {
                  try {
                    await prerequisite.task;
                  } catch {
                    if (!prerequisite.confirmed) throw new ExecutionError("TOOL_ARCHIVE_PREREQUISITE");
                  }
                }
                await web?.finishReservations();
                await home.recordAttempt({ operationId: OperationId("tool-final-" + id), attemptId: id, outcome: saved });
              }, true);
              finals.delete(id);
              finalDone();
            }
          });
        },
        createModelOperation(purpose) {
          const logicalOpId = LogicalOpId("logical-" + randomUUID3());
          const issued = [];
          let retryReady = false, plannedRetryVersion;
          return Object.freeze({
            logicalOpId,
            async reserve(request) {
              if (issued.length > 1 || issued.length === 1 && !retryReady) throw new ExecutionError("MODEL_LOGICAL_OPERATION_EXHAUSTED");
              const prior = issued[0];
              if (prior && (await home.readRetryRules()).version !== plannedRetryVersion) throw new ExecutionError("MODEL_RETRY_RULES_CHANGED");
              const claim = prior ? { logicalOpId, purpose, ordinal: 1, previousAttemptId: prior.attemptId } : { logicalOpId, purpose, ordinal: 0 };
              retryReady = false;
              const attempt = await scope.reserveModel(request, claim);
              issued.push(attempt);
              return attempt;
            },
            async retry(failure, signal) {
              if (issued.length !== 1 || retryReady || !transientModelFailure(failure) || state.attempts.some((x) => x.runId === currentTurn.runId)) return false;
              await quiesceTools();
              await parameters();
              const saved = (await home.readConversation()).attempts.find((x) => x.attemptId === issued[0].attemptId);
              if (saved?.outcome?.kind !== "failed" || JSON.stringify(saved.outcome.modelFailure) !== JSON.stringify(failure)) return false;
              const retryRules = await home.readRetryRules();
              if (!retryRules.value.maxAutomaticRetries) return false;
              const delayMs = Math.ceil(failure.providerRetryAfterMs ?? retryRules.value.retryDelayMs), remaining = Date.parse(currentTurn.deadline) - Date.parse(now());
              if (delayMs >= remaining || delayMs > 2147483647) return false;
              const cancellation = AbortSignal.any([signal, abort.signal]);
              if (cancellation.aborted) return false;
              await new Promise((resolve, reject) => {
                const done = () => {
                  clearTimeout(timer2);
                  cancellation.removeEventListener("abort", cancel);
                  resolve();
                };
                const cancel = () => {
                  clearTimeout(timer2);
                  cancellation.removeEventListener("abort", cancel);
                  reject(new ExecutionError("MODEL_RETRY_CANCELLED"));
                };
                const timer2 = setTimeout(done, delayMs);
                cancellation.addEventListener("abort", cancel, { once: true });
              });
              await quiesceTools();
              await parameters();
              const latest = await home.readRetryRules();
              if (latest.version !== retryRules.version || !latest.value.maxAutomaticRetries) return false;
              plannedRetryVersion = latest.version;
              retryReady = true;
              return true;
            }
          });
        },
        async reserveModel(request, modelOperation) {
          const id = AttemptId("attempt-" + randomUUID3());
          let reservedVersion, reservedRetryVersion;
          while (true) {
            await parameters();
            await quiesceTools();
            await parameters();
            const s = await home.readSnapshot(), c = await home.readConversation();
            try {
              const autonomy = currentTurn.source === "autonomous" ? await autonomyStamp() : void 0;
              await home.reserveAttempt({ operationId: OperationId("reserve-" + id), runId: currentTurn.runId, attemptId: id, source: currentTurn.source, ...autonomy ? { autonomy } : {}, kind: "model", retryRules: c.retryRules, ...modelOperation ? { modelOperation } : {}, contextGeneration: s.contextGeneration, settingsVersion: c.rules.version, expectedRevision: c.revision, now: autonomy?.clock.utc ?? now() });
              reservedVersion = c.rules.version;
              reservedRetryVersion = c.retryRules.version;
              break;
            } catch (e) {
              if (safeExecutionCode(e) === "REVISION_CONFLICT") continue;
              throw e;
            }
          }
          let entered = false, dispatched = false, settled = false;
          return Object.freeze({ attemptId: id, async enter() {
            await drain();
            await parameters();
            await home.enterAttempt({ operationId: OperationId("enter-" + id), attemptId: id, now: now() });
            entered = true;
          }, async *iterate(effect) {
            while (true) {
              await quiesceTools();
              await parameters();
              if (!debts.size && !bodies.size && !finals.size) break;
            }
            if (!entered || dispatched || settled) throw new ExecutionError("MODEL_ATTEMPT_CAPABILITY_SPENT");
            const current = home.admission;
            if (modelOperation?.ordinal === 1 && current.retryRulesVersion !== reservedRetryVersion) throw new ExecutionError("MODEL_RETRY_RULES_CHANGED");
            if (fault || archiveFault || debts.size || bodies.size || finals.size || runFault || preempted() || status !== "ready" || abort.signal.aborted || current.pendingOwnerChange || current.contextGeneration !== currentTurn.contextGeneration || current.settingsVersion !== reservedVersion || Date.parse(now()) >= Date.parse(currentTurn.deadline)) throw new ExecutionError("DISPATCH_ADMISSION_CHANGED");
            const clockGate = dispatchClock();
            if (clockGate) await clockGate;
            dispatched = true;
            yield* effect();
          }, async settle(outcome) {
            if (settled) throw new ExecutionError("ATTEMPT_ALREADY_SETTLED");
            const saved = structuredClone({ ...outcome, ...outcome.data === void 0 ? {} : { data: { request, result: outcome.data, dispatchObserved: dispatched } }, ...!dispatched ? { kind: "not-dispatched" } : {} });
            await archive(OperationId("record-" + id), () => home.recordAttempt({ operationId: OperationId("record-" + id), attemptId: id, outcome: saved }));
            settled = true;
          } });
        }
      });
      let finished = false, quiesceFailed = false;
      const quiesceCurrent = async () => {
        try {
          const quiet = await execution.quiesce(currentTurn.runId);
          if (!quiet.idle || !quiet.flushed) throw new ExecutionError("NATIVE_FLUSH_UNCONFIRMED");
        } catch (error) {
          quiesceFailed = true;
          throw error;
        }
      };
      const retainQuiesceFailure = (code) => {
        blockedTurn = currentTurn;
        blockedTurnReason = code;
        lifecycleFault = code;
      };
      try {
        const rules = await scope.parameters();
        if (currentTurn.source === "autonomous" && (await home.readConversation()).attempts.filter((attempt) => attempt.runId === currentTurn.runId && attempt.kind === "model").length >= rules.modelLimit) throw new ExecutionError("MODEL_LIMIT");
        const route = await execution.prepare(rules.outputTokens, abort.signal);
        const frame = await prepareCharacterContext(await home.readSnapshot(), currentTurn, route, contextReader);
        contextDependencies = frame.manifest.selected;
        const received = await execution.run({ turn: currentTurn, frame, route }, scope);
        const outcome = runFault ? { kind: "failure", reason: runFault } : received;
        await quiesceTools();
        await quiesceCurrent();
        await processReadyProposals();
        if (currentTurn.source === "autonomous" && (await home.readAutonomy()).restUntil && Date.parse(now()) < Date.parse((await home.readAutonomy()).restUntil)) {
          const latest = await home.readSnapshot();
          if (latest.contextGeneration !== currentTurn.contextGeneration) await home.refreshTurnContext({ operationId: OperationId("rest-context-" + currentTurn.runId), runId: currentTurn.runId, previousGeneration: currentTurn.contextGeneration, nextGeneration: latest.contextGeneration });
          await home.finishTurn({ operationId: OperationId("rest-finish-" + currentTurn.runId), runId: currentTurn.runId, contextGeneration: latest.contextGeneration, outcome: { kind: "internal", reason: "ACTIVITY_REST" } });
          await execution.release?.(currentTurn.runId);
          finished = true;
          continue;
        }
        if (preempted()) {
          await home.suspendAutonomous({ operationId: OperationId("suspend-" + currentTurn.runId + "-" + issuedEpoch), runId: currentTurn.runId, reason: "USER_PRIORITY" });
          await execution.release?.(currentTurn.runId);
          finished = true;
          continue;
        }
        if (outcome.kind === "failure" && isContextInvalidation(outcome.reason)) throw new ExecutionError(outcome.reason);
        if ((await home.readSnapshot()).contextGeneration !== currentTurn.contextGeneration) throw new ExecutionError("CONTEXT_STALE");
        await archive(OperationId("finish-" + currentTurn.runId), async () => {
          try {
            await home.finishTurn({ operationId: OperationId("finish-" + currentTurn.runId), runId: currentTurn.runId, contextGeneration: currentTurn.contextGeneration, outcome });
          } catch (error) {
            if (safeExecutionCode(error) !== "QQ_BINDING_CHANGED") throw error;
            await home.finishTurn({ operationId: OperationId("finish-" + currentTurn.runId), runId: currentTurn.runId, contextGeneration: currentTurn.contextGeneration, outcome: { kind: "failure", reason: "QQ_BINDING_CHANGED" } });
          }
        });
        finished = true;
        await execution.release?.(currentTurn.runId);
        scheduleDelivery();
      } catch (error) {
        if (finished) {
          fault = safeExecutionCode(error);
          return;
        }
        const code = runFault || safeExecutionCode(error);
        if (quiesceFailed) {
          retainQuiesceFailure(code);
          return;
        }
        if (!fault && !archiveFault) {
          try {
            await quiesceTools();
            await drain();
            await quiesceCurrent();
            await processReadyProposals();
            if (preempted()) {
              await home.suspendAutonomous({ operationId: OperationId("suspend-" + currentTurn.runId + "-" + issuedEpoch), runId: currentTurn.runId, reason: "USER_PRIORITY" });
              await execution.release?.(currentTurn.runId);
              finished = true;
              continue;
            }
            const latest = await home.readSnapshot();
            if (bindingRevoked(latest)) {
              await archive(OperationId("failure-" + currentTurn.runId), async () => {
                await home.finishTurn({ operationId: OperationId("failure-" + currentTurn.runId), runId: currentTurn.runId, contextGeneration: currentTurn.contextGeneration, outcome: { kind: "failure", reason: "QQ_BINDING_CHANGED" } });
              });
            } else if (latest.contextGeneration !== currentTurn.contextGeneration) {
              await home.refreshTurnContext({ operationId: OperationId("refresh-" + randomUUID3()), runId: currentTurn.runId, previousGeneration: currentTurn.contextGeneration, nextGeneration: latest.contextGeneration });
              if (runFault) await home.finishTurn({ operationId: OperationId("failure-" + currentTurn.runId), runId: currentTurn.runId, contextGeneration: latest.contextGeneration, outcome: { kind: "failure", reason: runFault } });
              if (runFault) await execution.release?.(currentTurn.runId);
            } else if (!runFault && isContextInvalidation(code)) {
            } else await home.finishTurn({ operationId: OperationId("failure-" + currentTurn.runId), runId: currentTurn.runId, contextGeneration: currentTurn.contextGeneration, outcome: { kind: "failure", reason: code } });
            await execution.release?.(currentTurn.runId);
          } catch (e) {
            if (quiesceFailed) retainQuiesceFailure(code);
            else if (archiveFault) {
              blockedTurn = currentTurn;
              blockedTurnReason = bindingRevoked(await home.readSnapshot()) ? "QQ_BINDING_CHANGED" : code;
            } else fault = safeExecutionCode(e);
          }
        } else if (archiveFault) {
          blockedTurn = currentTurn;
          blockedTurnReason = code;
        }
      } finally {
        contextReader.revoke();
        clearTimeout(timer);
        abort.abort();
        currentAbort = void 0;
        if (activeAutonomous === abort) activeAutonomous = void 0;
      }
      if (fault || archiveFault || blockedTurn) return;
    }
  }
  async function wake(hint) {
    if (!home || !writable() || sealed() || status !== "ready") return { kind: "skipped", reason: sealed() ? "SOURCE_CLEANUP_PENDING" : status === "read-only" ? "read-only" : reason };
    const receipt = await home.requestWake({ operationId: hint?.operationId ? OperationId(hint.operationId) : OperationId("wake-" + randomUUID3()), reason: typeof hint?.reason === "string" ? hint.reason.slice(0, 256) : "wake", stamp: await autonomyStamp() });
    if (receipt.kind === "skipped") return receipt;
    if (receipt.dispatchOpportunity) {
      autonomyWakeIssued = true;
      schedule();
    }
    return { kind: "accepted", opportunityId: receipt.opportunity.opportunityId, requestedAt: receipt.opportunity.requestedAt };
  }
  function scheduleOffset(baseMs, anchorAt, intervalMs) {
    return ((baseMs - Date.parse(anchorAt)) % intervalMs + intervalMs) % intervalMs || intervalMs;
  }
  function recomputedSchedule(schedule2, intervalMs) {
    if (!schedule2) return void 0;
    const base = Math.max(Date.parse(clock.read().utc), Date.parse(scheduleBase(schedule2)));
    return { ...schedule2, nextOpportunityAt: new Date(base + intervalMs - scheduleOffset(base, schedule2.anchorAt, intervalMs)).toISOString() };
  }
  const scheduleOperation = (prefix, slotAt) => OperationId(prefix + "-" + createHash5("sha256").update("role-wake-schedule:" + slotAt).digest("hex").slice(0, 40));
  function nextFutureSlot(schedule2, intervalMs, nowMs) {
    let next = nextSlotAfter(scheduleBase(schedule2), intervalMs);
    if (!(intervalMs > 0)) return next;
    for (let guard = 0; Date.parse(next) <= nowMs; guard++) {
      if (guard > 1e5) break;
      next = nextSlotAfter(next, intervalMs);
    }
    return next;
  }
  const pauseActive = async () => {
    if (!home || homeClosed) return void 0;
    const state = await home.readAutonomy();
    return state.pausedAt;
  };
  let arming = false;
  async function armTimer() {
    if (arming) return;
    arming = true;
    try {
      await armTimerInner();
    } finally {
      arming = false;
    }
  }
  async function armTimerInner() {
    clearScheduler();
    if (!home || homeClosed || status !== "ready" || !writable() || maintenancePending || sealed()) return;
    let state;
    try {
      state = await home.readAutonomy();
    } catch {
      return;
    }
    schedulerArmed = false;
    if (state.pausedAt) {
      schedulerSkipReason = "AUTONOMY_PAUSED";
      return;
    }
    let schedule2;
    try {
      schedule2 = await home.readAutonomySchedule() ?? void 0;
    } catch (error) {
      schedulerSkipReason = safeExecutionCode(error);
      return;
    }
    if (!schedule2) {
      const anchor = clock.read().utc;
      try {
        schedule2 = await home.armAutonomySchedule({ operationId: scheduleOperation("arm", anchor), schedule: { anchorAt: anchor, lastSlotAt: null, nextOpportunityAt: nextSlotAfter(anchor, state.rules.value.wakeIntervalMs), missedSlots: 0 } });
      } catch (error) {
        schedulerSkipReason = safeExecutionCode(error);
        return;
      }
    }
    if (!schedule2) return;
    const nowMs = Date.parse(clock.read().utc);
    for (let guard = 0; Date.parse(schedule2.nextOpportunityAt) <= nowMs && guard < 64; guard++) {
      const current = schedule2, grid = nextGridSlot(current.anchorAt, state.rules.value.wakeIntervalMs, nowMs), delta = Math.max(1, (Date.parse(grid.at) - Date.parse(current.nextOpportunityAt)) / state.rules.value.wakeIntervalMs);
      try {
        schedule2 = await home.advanceAutonomySchedule({ operationId: scheduleOperation("missed", current.nextOpportunityAt), slotAt: current.nextOpportunityAt, dispatchedSlot: false, nextOpportunityAt: grid.at, missedSlots: current.missedSlots + delta });
      } catch (error) {
        schedulerSkipReason = safeExecutionCode(error);
        return;
      }
    }
    if (!schedule2) return;
    schedulerNextAt = schedule2.nextOpportunityAt;
    schedulerArmed = true;
    if (homeClosed || status !== "ready" || !writable() || sealed()) {
      schedulerArmed = false;
      return;
    }
    const delay = Math.max(0, Date.parse(schedule2.nextOpportunityAt) - Date.parse(clock.read().utc));
    schedulerTimer = timers.setTimeout(() => {
      schedulerTimer = void 0;
      void scheduledSlot();
    }, Math.min(delay, 2147483647));
  }
  let schedulerTask;
  async function scheduledSlot() {
    if (schedulerTask) return;
    schedulerTask = (async () => {
      try {
        if (!home || homeClosed || status !== "ready" || !writable() || maintenancePending || sealed()) return;
        const state = await home.readAutonomy(), schedule2 = await home.readAutonomySchedule(), reading = clock.read();
        if (state.pausedAt) {
          schedulerSkipReason = "AUTONOMY_PAUSED";
          return;
        }
        if (!schedule2) return;
        if (Date.parse(reading.utc) < Date.parse(schedule2.nextOpportunityAt)) return;
        const slot = schedule2.nextOpportunityAt;
        const stamp = await autonomyStamp();
        const problem = clockProblem(state, stamp.clock), blocked = problem ?? wakeBlocked(state, stamp);
        if (blocked) {
          schedulerSkipReason = blocked;
        } else {
          const receipt = await wake({ operationId: scheduleOperation("scheduled", slot), reason: "scheduled-opportunity" });
          schedulerSkipReason = receipt.kind === "skipped" ? receipt.reason : null;
        }
        const live = await home.readAutonomy(), current = await home.readAutonomySchedule(), interval = live.rules.value.wakeIntervalMs, grid = nextGridSlot(current?.anchorAt ?? slot, interval, Math.max(Date.parse(slot), Date.parse(clock.read().utc))), delta = Math.max(1, (Date.parse(grid.at) - Date.parse(slot)) / interval), dispatched = blocked === void 0;
        await home.advanceAutonomySchedule({ operationId: scheduleOperation("advance", slot), slotAt: slot, dispatchedSlot: dispatched, nextOpportunityAt: grid.at, missedSlots: (current?.missedSlots ?? 0) + delta - (dispatched ? 1 : 0) });
      } catch (error) {
        schedulerSkipReason = safeExecutionCode(error);
      } finally {
        schedulerTask = void 0;
        void armTimer();
      }
    })();
    await schedulerTask;
  }
  function stopScheduler() {
    clearScheduler();
  }
  async function projectSchedule() {
    if (!home || homeClosed || status === "stopping" || status === "stopped") return void 0;
    let state;
    try {
      state = await home.readAutonomy();
    } catch {
      return void 0;
    }
    let schedule2;
    try {
      schedule2 = await home.readAutonomySchedule() ?? void 0;
    } catch {
      return void 0;
    }
    if (!schedule2) return { intervalMs: state.rules.value.wakeIntervalMs, paused: state.pausedAt !== void 0, pausedAt: state.pausedAt ?? null, anchorAt: "", lastSlotAt: null, nextOpportunityAt: "", missedSlots: 0, armed: false, lastSkipReason: schedulerSkipReason };
    return { intervalMs: state.rules.value.wakeIntervalMs, paused: state.pausedAt !== void 0, pausedAt: state.pausedAt ?? null, anchorAt: schedule2.anchorAt, lastSlotAt: schedule2.lastSlotAt, nextOpportunityAt: schedule2.nextOpportunityAt, missedSlots: schedule2.missedSlots, armed: schedulerArmed && !state.pausedAt && schedulerTimer !== void 0, lastSkipReason: schedulerSkipReason };
  }
  function schedule() {
    scheduleDelivery();
    if (working) {
      reschedule = true;
      return;
    }
    if (!ready || !writable() || fault || archiveFault || blockedTurn || maintenancePending || sealed()) return;
    if (!schedulerTimer && !schedulerTask) void armTimer();
    working = Promise.resolve().then(work).catch((e) => {
      fault = safeExecutionCode(e);
    }).finally(() => {
      working = void 0;
      if (reschedule) {
        reschedule = false;
        schedule();
      }
    });
  }
  function stopView() {
    if (!activeStopId) throw new ExecutionError("STOP_NOT_REQUESTED");
    const view = stopOperation ?? { operationId: activeStopId, kind: "unavailable", reason: "STOP_COMMIT_PENDING" };
    return { ...structuredClone(view), ...view.stop ? { stop: { ...view.stop, step: stopStep, phase: status === "stopped" ? "stopped" : stopError || archiveFault ? "blocked" : "stopping", ...stopError || archiveFault ? { error: stopError || archiveFault } : {} } } : {} };
  }
  function advanceStop() {
    if (stopTask || status === "stopped") return;
    const task = (async () => {
      try {
        stopError = "";
        stopScheduler();
        if (!homeClosed) {
          stopStep = "actions";
          await Promise.all([...handoverRecoveryWrites.values()]);
          await restoreRuntime.drain();
          await ports.inbound?.drain();
          await working;
          await historyRuntime?.drain();
          await deliveryScheduler;
          await Promise.all([...sendingTasks.values()]);
          await Promise.all([...cleanupRuns.values()].flatMap((entry) => entry.task ? [entry.task] : []));
          stopStep = "records";
          if (blockedTurn) throw new ExecutionError(lifecycleFault || archiveFault || "TURN_FINALIZATION_PENDING");
          await quiesceTools();
          await drain();
          stopStep = "model-and-flush";
          await execution?.close();
          if (home && activeStopId) {
            const id = activeStopId;
            await archive(OperationId("stop-checkpoint-" + createHash5("sha256").update(id).digest("hex")), async () => {
              await home.checkpointStop({ operationId: OperationId("stop-checkpoint-" + createHash5("sha256").update(id).digest("hex")), stopOperationId: id });
              stopOperation = home.operationSnapshot(id);
            });
            retainedHome = await projectHome(home);
            for (const stop of home.stopSnapshots()) retainedStops.set(stop.operationId, home.operationSnapshot(stop.operationId));
          }
          if (home && activeHandover) {
            const record = activeHandover, id = OperationId("handover-ready-" + createHash5("sha256").update(record.operationId).digest("hex"));
            await archive(id, async () => {
              await home.readyHandover({ operationId: id, handoverOperationId: record.operationId });
              activeHandover = home.handoverSnapshots().find((item) => item.operationId === record.operationId);
              if (activeHandover) retainedHandovers.set(record.operationId, activeHandover);
            });
            retainedHome = await projectHome(home);
          }
          for (const task2 of cleanupViews()) retainedCleanups.set(task2.operationId, task2);
          stopStep = "home";
          await capability?.close();
          homeClosed = true;
          homeReleased();
        }
        stopStep = "observers";
        historyRuntime?.dispose();
        await ports.inbound?.dispose();
        await execution?.dispose?.();
        unlisten?.();
        unlistenClose?.();
        unlistenDelivery?.();
        status = "stopped";
        stopStep = "complete";
        stopError = "";
        resolveStopped({ status: "stopped", reason: stopReason });
      } catch (error) {
        stopError = safeExecutionCode(error);
      }
    })();
    stopTask = task;
    void task.finally(() => {
      if (stopTask === task) stopTask = void 0;
    });
  }
  function beginStop(why, operationId) {
    if (status === "stopped") return Promise.resolve();
    if (activeStopId) return stopRequest ?? Promise.resolve();
    status = "stopping";
    stopReason = why;
    historyRuntime?.interrupt("ROLE_STOPPING");
    ports.inbound?.seal();
    if (home) {
      const id = operationId ?? OperationId("stop-" + randomUUID3());
      activeStopId = id;
      stopRequest = archive(id, async () => {
        try {
          await home.requestStop({ operationId: id, reason: why });
          stopOperation = home.operationSnapshot(id);
        } catch (error) {
          if (safeExecutionCode(error) === "IO_UNCERTAIN") stopOperation = { operationId: id, kind: "uncertain", stage: "commit-uncertain" };
          throw error;
        }
      });
    }
    afterTools(() => currentAbort?.abort());
    advanceStop();
    return stopRequest ?? Promise.resolve();
  }
  function requestStop(why) {
    void beginStop(why).catch(() => {
    });
  }
  async function readHandover(operationId) {
    const id = OperationId(operationId), reader = home ?? activationReadHome;
    const record = homeClosed ? retainedHandovers.get(id) : reader?.handoverSnapshots().find((item) => item.operationId === id);
    const roleId = reader?.roleId;
    if (!roleId) throw new ExecutionError("HOME_UNAVAILABLE");
    if (!record) {
      const intent = handoverIntents.get(id), operation = !homeClosed ? reader?.operationSnapshot(id) : void 0;
      if (operation?.kind === "uncertain" || intent?.sealed) return { operationId: id, roleId, phase: "uncertain", error: operation?.kind === "uncertain" ? "IO_UNCERTAIN" : intent?.error || "HANDOVER_PUBLICATION_UNCONFIRMED" };
      return { operationId: id, roleId, phase: "not-found" };
    }
    const accepted = homeClosed ? restored : reader?.restoreAcceptanceSnapshot();
    if (!currentOutgoingHandover(record, accepted?.committedRevision)) return { operationId: id, roleId, phase: "uncertain", record: structuredClone(record), history: true, error: "HANDOVER_IMPORTED_HISTORY" };
    const backup = backups ? await readBackup(record.backupOperationId) : void 0;
    const error = stopError || archiveFault || backup?.error;
    const phase = error ? "uncertain" : record.readyRevision === void 0 ? "closing" : backup?.phase === "verified-restorable" ? "verified" : backup?.phase === "failed" ? "failed" : "copying";
    return { operationId: id, roleId, phase, record: structuredClone(record), ...backup ? { backup } : {}, ...error ? { error } : {} };
  }
  function recoverReadonlyHandover(request, record) {
    const reader = activationReadHome;
    if (!reader || homeClosed || !backups || execution) throw new ExecutionError("HANDOVER_RECOVERY_UNAVAILABLE");
    const previous = handoverRequests.get(request.operationId);
    if (previous) {
      if (previous.destination !== request.destination) throw new ExecutionError("OPERATION_CONFLICT");
      return previous.task;
    }
    const task = (async () => {
      const diagnostic2 = await reader.readActivationDiagnostic?.();
      if (diagnostic2?.reason !== "SOURCE_HANDOVER_PENDING" && diagnostic2?.reason !== "SOURCE_HANDOVER_RELEASED") throw new ExecutionError("READ_ONLY_HOME");
      maintenancePending = true;
      reason = "HANDOVER_RECORD_RECONCILIATION";
      const writes = Promise.resolve().then(async () => {
        await backups.reserve({ operationId: record.backupOperationId, destination: request.destination }, record.stopOperationId);
        const uncertain = (await reader.readSnapshot()).uncertainOperationId;
        if (uncertain) await reader.reconcileOperation(uncertain);
        let current = reader.handoverSnapshots().find((item) => item.operationId === record.operationId);
        if (current.readyRevision === void 0) {
          const state = await reader.readConversation();
          for (const turn of state.turns.filter((turn2) => turn2.status !== "finished")) {
            await recoverNativeGaps(reader, turn, state);
            await recoverPendingAttempts(reader, turn, state);
          }
          const prior = reader.stopSnapshots().find((stop) => stop.operationId === record.stopOperationId), priorNativeFlush = prior?.checkpoint === "ready-to-close" && prior.requestedRevision > record.requestedRevision ? "source-checkpoint" : "unknown";
          if (!current.recovery) await reader.reconcileHandover({ operationId: OperationId("handover-reconcile-" + createHash5("sha256").update(record.operationId).digest("hex")), handoverOperationId: record.operationId, priorNativeFlush });
          if (!prior) await reader.requestStop({ operationId: record.stopOperationId, reason: "owner-stop" });
          if (reader.stopSnapshots().find((stop) => stop.operationId === record.stopOperationId)?.checkpoint === "requested") await reader.checkpointStop({ operationId: OperationId("stop-checkpoint-" + createHash5("sha256").update(record.stopOperationId).digest("hex")), stopOperationId: record.stopOperationId });
          await reader.readyHandover({ operationId: OperationId("handover-ready-" + createHash5("sha256").update(record.operationId).digest("hex")), handoverOperationId: record.operationId });
          current = reader.handoverSnapshots().find((item) => item.operationId === record.operationId);
        }
        activeHandover = current;
        retainedHandovers.set(current.operationId, current);
        retainedHome = await projectHome(reader);
      });
      handoverRecoveryWrites.set(request.operationId, writes);
      void writes.then(() => {
        if (handoverRecoveryWrites.get(request.operationId) === writes) handoverRecoveryWrites.delete(request.operationId);
      }, () => {
      });
      try {
        await writes;
        backupErrors.delete(record.backupOperationId);
        await beginStop("owner-stop");
        const copy = (async () => {
          try {
            await stopped;
            await backups.copy({ operationId: record.backupOperationId, destination: request.destination });
          } catch (error) {
            backupErrors.set(record.backupOperationId, safeExecutionCode(error));
          }
        })();
        backupRuns.set(record.backupOperationId, copy);
        void copy.finally(() => {
          if (backupRuns.get(record.backupOperationId) === copy) backupRuns.delete(record.backupOperationId);
        });
        return readHandover(request.operationId);
      } catch (error) {
        backupErrors.set(record.backupOperationId, safeExecutionCode(error));
        throw error;
      }
    })();
    handoverRequests.set(request.operationId, { destination: request.destination, task });
    const clear = () => {
      if (handoverRequests.get(request.operationId)?.task === task) handoverRequests.delete(request.operationId);
    };
    void task.then(clear, clear);
    return task;
  }
  async function requestHandover(request) {
    if (!validateHandoverRequest(request)) throw new ExecutionError("INVALID_HANDOVER");
    const old = handoverRequests.get(request.operationId);
    if (old) {
      if (old.destination !== request.destination) throw new ExecutionError("OPERATION_CONFLICT");
      return old.task;
    }
    if (!home || homeClosed) {
      const result = await readHandover(request.operationId);
      if (!result.record) throw new ExecutionError("HOME_UNAVAILABLE");
      if (result.record.destinationDigest !== createHash5("sha256").update(request.destination).digest("hex")) throw new ExecutionError("OPERATION_CONFLICT");
      if (result.history) return result;
      if (result.phase !== "verified" && activationReadHome && !homeClosed) return recoverReadonlyHandover(request, result.record);
      if (result.phase !== "verified" && homeClosed && result.record.readyRevision !== void 0) {
        await requestBackup({ operationId: result.record.backupOperationId, destination: request.destination });
        return readHandover(request.operationId);
      }
      return result;
    }
    const task = (async () => {
      const digest = createHash5("sha256").update(request.destination).digest("hex"), existing = home.handoverSnapshots().find((record) => record.operationId === request.operationId);
      if (existing) {
        if (existing.destinationDigest !== digest) throw new ExecutionError("OPERATION_CONFLICT");
        if (!currentOutgoingHandover(existing, home.restoreAcceptanceSnapshot()?.committedRevision)) return readHandover(request.operationId);
        activeHandover = existing;
      } else {
        const previous = handoverIntents.get(request.operationId);
        if (previous && (previous.request.destination !== request.destination || previous.request.expectedRevision !== request.expectedRevision)) throw new ExecutionError("OPERATION_CONFLICT");
        if (!writable() && !previous?.sealed && home.operationSnapshot(request.operationId).kind !== "uncertain") throw new ExecutionError("READ_ONLY_HOME");
        const key = createHash5("sha256").update(home.roleId + ":" + request.operationId).digest("hex");
        if (!previous?.sealed) {
          if (!backups) throw new ExecutionError("BACKUP_UNAVAILABLE");
          await backups.preflight({ operationId: OperationId("handover-backup-" + key), destination: request.destination });
        }
        const intent = previous ?? { request: Object.freeze({ ...request }), sealed: false };
        handoverIntents.set(request.operationId, intent);
        try {
          await home.requestHandover({ operationId: request.operationId, handoverId: HandoverId("handover-" + key), backupOperationId: OperationId("handover-backup-" + key), stopOperationId: OperationId("handover-stop-" + key), destinationDigest: digest, expectedRevision: request.expectedRevision }, () => {
            intent.sealed = true;
            maintenancePending = true;
            status = "stopping";
            reason = "HANDOVER_REQUEST_PENDING";
            ports.inbound?.seal();
            historyRuntime?.interrupt("ROLE_STOPPING");
          });
        } catch (error) {
          if (intent.sealed) {
            intent.error = safeExecutionCode(error);
            reason = intent.error;
          } else if (handoverIntents.get(request.operationId) === intent) handoverIntents.delete(request.operationId);
          throw error;
        }
        activeHandover = home.handoverSnapshots().find((record) => record.operationId === request.operationId);
        if (activeHandover) handoverIntents.delete(request.operationId);
      }
      if (!activeHandover) throw new ExecutionError("HANDOVER_NOT_FOUND");
      retainedHandovers.set(request.operationId, activeHandover);
      await requestBackup({ operationId: activeHandover.backupOperationId, destination: request.destination });
      return readHandover(request.operationId);
    })();
    handoverRequests.set(request.operationId, { destination: request.destination, task });
    const clear = () => {
      if (handoverRequests.get(request.operationId)?.task === task) handoverRequests.delete(request.operationId);
    };
    void task.then(clear, clear);
    return task;
  }
  function projectBackup(progress) {
    const error = backupErrors.get(progress.operationId);
    if (error) return { ...progress, phase: "uncertain", error };
    if (progress.phase === "stopping" && activeStopId === progress.stopOperationId && (stopError || archiveFault)) return { ...progress, error: stopError || archiveFault };
    if (["stopping", "stopped", "copying", "verifying"].includes(progress.phase) && !backupRequests.has(progress.operationId) && !backupRuns.has(progress.operationId) && !(progress.phase === "stopping" && activeStopId === progress.stopOperationId && status === "stopping")) return { ...progress, phase: "uncertain", error: "BACKUP_RECONCILIATION_REQUIRED" };
    return progress;
  }
  async function readBackup(operationId) {
    if (!backups) throw new ExecutionError("BACKUP_UNAVAILABLE");
    return projectBackup(await backups.read(OperationId(operationId)));
  }
  async function requestBackup(request) {
    const owned = Object.freeze({ operationId: OperationId(request.operationId), destination: request.destination }), prior = backupRequests.get(owned.operationId);
    if (prior) {
      if (prior.destination !== owned.destination) throw new ExecutionError("OPERATION_CONFLICT");
      return prior.task;
    }
    const task = prepareBackup(owned);
    backupRequests.set(owned.operationId, { destination: owned.destination, task });
    const clear = () => {
      if (backupRequests.get(owned.operationId)?.task === task) backupRequests.delete(owned.operationId);
    };
    void task.then(clear, clear);
    return task;
  }
  async function prepareBackup(request) {
    if (!backups) throw new ExecutionError("BACKUP_UNAVAILABLE");
    OperationId(request.operationId);
    const prior = await backups.read(request.operationId);
    if (prior.phase !== "not-found" && prior.destination !== request.destination) throw new ExecutionError("OPERATION_CONFLICT");
    if (prior.phase === "not-found" && home && !homeClosed && home.operationSnapshot(request.operationId).kind !== "not-found") throw new ExecutionError("OPERATION_CONFLICT");
    if (prior.checkpoint === "verified") {
      backupErrors.delete(request.operationId);
      if (prior.phase === "verified-restorable") return prior;
      return backups.verify(request.operationId);
    }
    const runningBackup = backupRuns.get(request.operationId);
    if (runningBackup) {
      if (prior.phase !== "failed" && prior.phase !== "uncertain" && !backupErrors.has(request.operationId)) return readBackup(request.operationId);
      await runningBackup;
      if (backupRuns.get(request.operationId) === runningBackup) backupRuns.delete(request.operationId);
    }
    backupErrors.delete(request.operationId);
    if (prior.sourceRevision === void 0) {
      if (!home) throw new ExecutionError("BACKUP_STOP_REQUIRED");
      if (status === "read-only") throw new ExecutionError("READ_ONLY_HOME");
      const stopOperationId = activeStopId ?? (activeHandover?.backupOperationId === request.operationId ? activeHandover.stopOperationId : OperationId("backup-stop-" + randomUUID3()));
      try {
        await backups.reserve(request, stopOperationId, () => {
          maintenancePending = true;
          if (status !== "stopped") status = "stopping";
        });
      } catch (error) {
        const saved = await backups.read(request.operationId);
        if (saved.phase !== "not-found" || status === "stopping") {
          maintenancePending = true;
          void beginStop("owner-stop", saved.phase === "not-found" ? stopOperationId : saved.stopOperationId).catch(() => {
          });
        }
        throw error;
      }
      maintenancePending = true;
      await beginStop("owner-stop", stopOperationId);
    }
    const task = (async () => {
      try {
        if (prior.sourceRevision === void 0) await stopped;
        await backups.copy(request);
        maintenancePending = !!(await backups.pending()).length;
      } catch (error) {
        backupErrors.set(request.operationId, safeExecutionCode(error));
      }
    })();
    backupRuns.set(request.operationId, task);
    void task.finally(() => {
      if (backupRuns.get(request.operationId) === task) backupRuns.delete(request.operationId);
    });
    return readBackup(request.operationId);
  }
  function cleanupViews() {
    const reader = home ?? activationReadHome, views = new Map(retainedCleanups);
    if (reader && !homeClosed) for (const task of reader.cleanupSnapshots()) views.set(task.operationId, task);
    for (const [id, entry] of cleanupRuns) if (!views.has(id) || entry.view.error) views.set(id, entry.view);
    return [...views.values()];
  }
  async function readCleanup(operationId) {
    const id = OperationId(operationId);
    if (homeClosed) return structuredClone(cleanupViews().find((task) => task.operationId === id) ?? { operationId: id, phase: "not-found" });
    const saved = await readHome().readCleanup(id), entry = cleanupRuns.get(id);
    return saved.phase === "not-found" ? entry?.view ?? saved : entry?.view.error ? { ...saved, error: entry.view.error } : saved;
  }
  async function requestCleanup(value) {
    const request = admitCleanupCommand(value);
    if (!home || homeClosed || status === "read-only") throw new ExecutionError("READ_ONLY_HOME");
    if (status === "stopping" || status === "stopped" || maintenancePending) throw new ExecutionError("ROLE_STOPPING");
    const saved = await home.readCleanup(request.operationId), prior = cleanupRuns.get(request.operationId);
    if (saved.phase !== "not-found" && JSON.stringify(saved.request?.selection ?? saved.preview.selection) !== JSON.stringify(request.selection)) throw new ExecutionError("OPERATION_CONFLICT");
    if (saved.phase === "complete") return saved;
    if (prior?.task) {
      if (JSON.stringify(prior.request) !== JSON.stringify(request)) throw new ExecutionError("OPERATION_CONFLICT");
      return readCleanup(request.operationId);
    }
    let admission;
    cleanupSealed = true;
    try {
      if (saved.phase === "not-found") admission = await home.prepareCleanup(request);
    } catch (error) {
      cleanupSealed = home.cleanupSnapshots().some((task2) => task2.phase !== "complete");
      schedule();
      throw error;
    }
    const entry = { request, view: saved.phase === "not-found" ? { operationId: request.operationId, phase: "waiting-actions", request, preview: admission.preview, physical: { complete: false } } : saved };
    cleanupRuns.set(request.operationId, entry);
    const task = Promise.resolve().then(async () => {
      try {
        if (admission) {
          historyRuntime?.interrupt("SOURCE_CLEANUP");
          afterTools(() => currentAbort?.abort());
          await working;
          await deliveryScheduler;
          await Promise.all([...sendingTasks.values()]);
          await historyRuntime?.drain();
          await quiesceTools();
          await drain();
          if (blockedTurn) throw new ExecutionError(lifecycleFault || archiveFault || "TURN_FINALIZATION_PENDING");
          for (const turn of (await home.readConversation()).turns.filter((turn2) => turn2.status === "running")) {
            const quiet = await execution?.quiesce(turn.runId);
            if (!quiet?.idle || !quiet.flushed) throw new ExecutionError("NATIVE_FLUSH_UNCONFIRMED");
            await home.finishTurn({ operationId: OperationId("cleanup-interrupted-" + turn.runId), runId: turn.runId, contextGeneration: turn.contextGeneration, outcome: { kind: "failure", reason: "SOURCE_CLEANUP" } });
            await execution?.release?.(turn.runId);
          }
          await admission.commit();
          entry.view = await home.readCleanup(request.operationId);
        }
        entry.view = await home.continueCleanup(request.operationId);
      } catch (error) {
        entry.view = { ...entry.view, error: safeExecutionCode(error) };
      } finally {
        admission?.release();
        cleanupSealed = home.cleanupSnapshots().some((task2) => task2.phase !== "complete");
        if (entry.view.phase === "complete") cleanupRuns.delete(request.operationId);
        if (!cleanupSealed) {
          completeStartup();
          schedule();
        }
      }
    });
    entry.task = task;
    void task.finally(() => {
      if (entry.task === task) entry.task = void 0;
    });
    return structuredClone(entry.view);
  }
  const unlistenClose = execution?.onClosing?.((code) => {
    requestStop("unload");
    if (code) stopReason = code;
  });
  const unlisten = execution?.onAvailability?.(() => {
    void execution.inspect().then((info) => {
      if (!writable()) return;
      ready = info.available;
      availabilityReason = info.reason;
      status = ready ? "ready" : "not-ready";
      reason = info.reason;
      if (startupPending || !startupRecovered) {
        status = "not-ready";
        reason = "STOP_RECOVERY_PENDING";
        return;
      }
      if (ready) schedule();
    }).catch(() => {
      fault = "EXECUTION_STATUS_FAILED";
    });
  });
  const pendingStops = home?.stopSnapshots().filter((stop) => stop.reconciledRevision === void 0 && restoreRevisionEligible(restored, stop.requestedRevision)) ?? [];
  const pendingHistory = home ? (await home.readQQHistory()).queries.filter((q) => q.phase === "running") : [];
  if (home && (pendingStops.length || pendingHistory.length)) {
    startupPending = true;
    startupRecovered = false;
    status = "not-ready";
    reason = "STOP_RECOVERY_PENDING";
    const recovery = archive(OperationId("stop-recovery-" + createHash5("sha256").update([...pendingStops.map((stop) => stop.operationId), ...pendingHistory.map((query) => query.operationId)].join(":")).digest("hex")), async () => {
      await historyRuntime?.recover();
      const state = await home.readConversation();
      for (const turn of state.turns.filter((turn2) => turn2.status === "running")) {
        await recoverNativeGaps(home, turn, state);
        await recoverPendingAttempts(home, turn, state);
      }
      for (const stop of pendingStops) await home.reconcileStop({ operationId: OperationId("stop-reconcile-" + createHash5("sha256").update(stop.operationId).digest("hex")), stopOperationId: stop.operationId });
      if (pendingStops.length) recovering = false;
      startupRecovered = true;
    });
    void recovery.then(() => {
      startupPending = false;
      completeStartup();
      schedule();
    }, () => {
      startupPending = false;
      reason = archiveFault || "STOP_RECOVERY_BLOCKED";
    });
  } else if (maintenancePending) {
    status = home ? "not-ready" : status;
    reason = "BACKUP_MAINTENANCE_PENDING";
  } else schedule();
  return Object.freeze({
    runtime: Object.freeze({
      receive: receiveInput,
      wake,
      async inspect() {
        const report = status === "stopping" || status === "stopped" ? void 0 : await diagnostic(), viewHome = home ?? activationReadHome, scheduleView = await projectSchedule(), formatView = projectFormat(viewHome, report, formatUpgradeTask);
        return { ...formatView ? { format: formatView } : {}, ...viewHome && cleanupViews().length ? { cleanups: cleanupViews() } : {}, ...scheduleView ? { schedule: scheduleView } : {}, ...backups ? { backups: (await backups.list()).map(projectBackup) } : {}, status, reason: archiveFault || lifecycleFault || fault || stopReason || (formatUpgradeSealed ? "FORMAT_UPGRADE_PENDING" : cleanupSealed ? "SOURCE_CLEANUP_PENDING" : "") || (status === "read-only" ? report?.reason : reason) || reason, roleId: status === "read-only" ? report?.verifiedRoleId ?? null : home?.roleId ?? activationReadHome?.roleId ?? null, revision: status === "read-only" ? report?.verifiedRevision ?? null : home?.revision ?? activationReadHome?.revision ?? null, ...viewHome ? { home: homeClosed || status === "stopping" || startupPending ? retainedHome : await projectHome(viewHome, !!home && !!ready && !fault && !archiveFault && !blockedTurn && !maintenancePending) } : {}, ...activeStopId && stopOperation?.stop ? { stop: stopView().stop } : {}, ...report && capability ? { diagnostic: report } : {}, ...execution ? { execution: await execution.inspect() } : {} };
      }
    }),
    owner: Object.freeze({
      async readLibraryOverviewFacts() {
        const reader = await readHome().openContextReader({ purpose: "management" });
        try {
          const [snapshot, conversation, knowledge, sourceFacts] = await Promise.all([
            readHome().readSnapshot(),
            readHome().readConversation(),
            readHome().readKnowledge(),
            readLibraryOverviewSources(reader)
          ]);
          if (snapshot.revision !== conversation.revision || snapshot.revision !== knowledge.revision || snapshot.revision !== reader.basis.revision) throw new ExecutionError("LIBRARY_OVERVIEW_CHANGED");
          return structuredClone({
            snapshot,
            conversation,
            knowledge,
            sources: sourceFacts.sources,
            recentSources: sourceFacts.recentSources,
            health: {
              archivePending: archiveJobs().length,
              archiveFault,
              executionFault: fault,
              lifecycleFault,
              blockedTurnReason
            }
          });
        } finally {
          reader.revoke();
        }
      },
      async readCleanupCatalog(page) {
        const reader = readHome();
        const [snapshot, conversation] = await Promise.all([reader.readSnapshot(), reader.readConversation()]);
        return cleanupCatalogPage(snapshot, conversation, page);
      },
      async previewFormatUpgrade() {
        if (!home || homeClosed) throw new ExecutionError("HOME_UNAVAILABLE");
        return home.previewFormatUpgrade();
      },
      async requestFormatUpgrade(request) {
        if (!home || homeClosed) throw new ExecutionError("HOME_UNAVAILABLE");
        if (status === "read-only") throw new ExecutionError("READ_ONLY_HOME");
        if (status === "stopping" || status === "stopped") throw new ExecutionError("ROLE_STOPPING");
        if (maintenancePending) throw new ExecutionError("BACKUP_MAINTENANCE_PENDING");
        if (cleanupSealed) throw new ExecutionError("SOURCE_CLEANUP_PENDING");
        if (formatUpgradeSealed) throw new ExecutionError("FORMAT_UPGRADE_PENDING");
        let progress;
        try {
          progress = await home.requestFormatUpgrade(request);
        } catch (error) {
          const code = safeExecutionCode(error);
          if (code === "FORMAT_UPGRADE_BACKUP_REQUIRED") {
            const failed = await home.readFormatUpgrade(OperationId(request.operationId));
            if (failed.phase !== "not-found") {
              retainedFormatUpgrades.set(failed.operationId, failed);
              formatUpgradeTask = failed;
            }
          }
          throw error;
        }
        retainedFormatUpgrades.set(progress.operationId, progress);
        formatUpgradeTask = progress;
        if (progress.phase === "failed") return structuredClone(progress);
        formatUpgradeSealed = true;
        stopScheduler();
        historyRuntime?.interrupt("FORMAT_UPGRADE");
        afterTools(() => currentAbort?.abort());
        try {
          await working;
          await deliveryScheduler;
          await Promise.all([...sendingTasks.values()]);
          await historyRuntime?.drain();
          await quiesceTools();
          await drain();
          if (blockedTurn) throw new ExecutionError(lifecycleFault || archiveFault || "TURN_FINALIZATION_PENDING");
          for (const turn of (await home.readConversation()).turns.filter((turn2) => turn2.status === "running")) {
            const quiet = await execution?.quiesce(turn.runId);
            if (!quiet?.idle || !quiet.flushed) throw new ExecutionError("NATIVE_FLUSH_UNCONFIRMED");
            await home.finishTurn({ operationId: OperationId("format-upgrade-interrupted-" + turn.runId), runId: turn.runId, contextGeneration: turn.contextGeneration, outcome: { kind: "failure", reason: "FORMAT_UPGRADE" } });
            await execution?.release?.(turn.runId);
          }
          progress = await home.continueFormatUpgrade(progress.operationId);
        } catch (error) {
          const code = safeExecutionCode(error), saved = await home.readFormatUpgrade(progress.operationId);
          progress = saved.phase === "not-found" ? { ...progress, phase: "failed", error: code } : saved;
          retainedFormatUpgrades.set(progress.operationId, progress);
          formatUpgradeTask = progress;
          throw error;
        } finally {
          retainedFormatUpgrades.set(progress.operationId, progress);
          formatUpgradeTask = progress;
          formatUpgradeSealed = progress.phase !== "switched" && progress.phase !== "failed";
          if (!sealed()) {
            completeStartup();
            schedule();
          }
        }
        return structuredClone(progress);
      },
      async readFormatUpgrade(operationId) {
        const id = OperationId(operationId);
        if (formatUpgradeTask?.operationId === id) return structuredClone(formatUpgradeTask);
        const retained2 = retainedFormatUpgrades.get(id);
        if (retained2) return structuredClone(retained2);
        if (home && !homeClosed) return home.readFormatUpgrade(id);
        return { operationId: id, phase: "not-found" };
      },
      async resumeFormatUpgrade(request) {
        if (!home || homeClosed) throw new ExecutionError("HOME_UNAVAILABLE");
        if (status === "read-only") throw new ExecutionError("READ_ONLY_HOME");
        if (maintenancePending) throw new ExecutionError("BACKUP_MAINTENANCE_PENDING");
        if (cleanupSealed) throw new ExecutionError("SOURCE_CLEANUP_PENDING");
        const progress = await home.resumeFormatUpgrade(request);
        retainedFormatUpgrades.set(progress.operationId, progress);
        formatUpgradeTask = progress;
        formatUpgradeSealed = progress.phase !== "switched" && progress.phase !== "failed";
        if (!sealed()) {
          completeStartup();
          schedule();
        }
        return structuredClone(progress);
      },
      async previewCleanup(selection) {
        if (status === "read-only") throw new ExecutionError("READ_ONLY_HOME");
        return readHome().previewCleanup(selection);
      },
      requestCleanup,
      readCleanup,
      async queryQQHistory(request) {
        if (!historyRuntime) throw new ExecutionError("HOME_UNAVAILABLE");
        return historyRuntime.query(request);
      },
      async selectQQHistory(request) {
        if (!historyRuntime) throw new ExecutionError("HOME_UNAVAILABLE");
        return historyRuntime.select(request);
      },
      async readQQHistory() {
        if (!historyRuntime || homeClosed) throw new ExecutionError("HOME_UNAVAILABLE");
        return historyRuntime.read();
      },
      async confirmRestore(request) {
        const reader = activationReadHome ?? (home?.restoreAcceptanceSnapshot()?.operationId === request.operationId ? home : void 0);
        if (!reader || homeClosed || status === "stopping" || status === "stopped") throw new ExecutionError("RESTORE_CONFIRMATION_UNAVAILABLE");
        return reader.confirmRestore(request);
      },
      async completeRestoreRegistration(request) {
        if (!request || typeof request !== "object" || Object.getPrototypeOf(request) !== Object.prototype || Object.keys(request).sort().join("|") !== "acceptanceOperationId|stage" || !["attach", "register"].includes(request.stage)) throw new ExecutionError("INVALID_RESTORE_REGISTRATION");
        const id = OperationId(request.acceptanceOperationId), reader = activationReadHome ?? home;
        if (!reader || homeClosed || status === "stopping" || status === "stopped") throw new ExecutionError("HOME_UNAVAILABLE");
        if (reader.restoreAcceptanceSnapshot()?.operationId !== id || await reader.readActivationDiagnostic?.()) throw new ExecutionError("RESTORE_NOT_CONFIRMED");
        const ids = restoreRegistrationIds(id);
        return reader.applyOwner(request.stage === "attach" ? { kind: "attach-home", operationId: ids.attachOperationId, roleId: reader.roleId } : { kind: "register-home", operationId: ids.registrationOperationId, targetOperationId: ids.attachOperationId });
      },
      requestRestore: restoreRuntime.request,
      readRestore: restoreRuntime.read,
      requestHandover,
      readHandover,
      requestBackup,
      readBackup,
      resumeBackup: requestBackup,
      async verifyBackup(operationId) {
        if (!backups) throw new ExecutionError("BACKUP_UNAVAILABLE");
        const result = await backups.verify(OperationId(operationId));
        backupErrors.delete(operationId);
        return result;
      },
      async stop(request) {
        const id = OperationId(request.operationId);
        if (activeStopId === id) {
          await stopRequest;
          return stopView();
        }
        if (!home || homeClosed) throw new ExecutionError("HOME_UNAVAILABLE");
        const prior = home.operationSnapshot(id);
        if (prior.stop) {
          if (prior.stop.reason !== "owner-stop") throw new ExecutionError("OPERATION_CONFLICT");
          return prior;
        }
        if (prior.kind !== "not-found") throw new ExecutionError("OPERATION_CONFLICT");
        if (activeStopId) throw new ExecutionError("STOP_ALREADY_REQUESTED");
        if (!writable()) throw new ExecutionError("READ_ONLY_HOME");
        await beginStop("owner-stop", id);
        return stopView();
      },
      async retryArchives() {
        if (!home) throw new ExecutionError("HOME_UNAVAILABLE");
        const priorReason = archiveFault;
        for (const { operationId, job } of archiveJobs()) {
          try {
            await job.task;
          } catch {
          }
          if (job.code) {
            debts.delete(job.task);
            toolDebts.delete(job.task);
            removeArchive(operationId, job);
            await archive(operationId, job.save, job.toolLifetime);
          }
        }
        while (true) {
          const pending = archiveJobs().map((x) => x.job).filter((job) => !job.code);
          if (!pending.length) break;
          await Promise.all(pending.map((job) => job.task));
        }
        if (archives.size) return { pending: archiveJobs().length, revision: home.revision };
        for (const id of abandonedSends) {
          const attempt = (await home.readConversation()).sendAttempts.find((a) => a.sendAttemptId === id);
          if (attempt && !attempt.observation) await archive(OperationId("abandon-" + id), () => home.settleDelivery({ operationId: OperationId("abandon-" + id), sendAttemptId: id, observation: { kind: "rejected", code: "SEND_NOT_DISPATCHED" } }));
          abandonedSends.delete(id);
        }
        archiveFault = "";
        if (blockedTurn) {
          const alreadyFinished = (await home.readConversation()).turns.some((turn) => turn.runId === blockedTurn.runId && turn.status === "finished");
          if (!alreadyFinished) {
            const quiet = await execution.quiesce(blockedTurn.runId);
            if (!quiet.flushed) throw new ExecutionError("NATIVE_FLUSH_UNCONFIRMED");
            const latest = await home.readSnapshot();
            if (latest.contextGeneration !== blockedTurn.contextGeneration) await home.refreshTurnContext({ operationId: OperationId("refresh-" + randomUUID3()), runId: blockedTurn.runId, previousGeneration: blockedTurn.contextGeneration, nextGeneration: latest.contextGeneration });
            await home.finishTurn({ operationId: OperationId("archive-failure-" + blockedTurn.runId), runId: blockedTurn.runId, contextGeneration: latest.contextGeneration, outcome: { kind: "failure", reason: blockedTurnReason || priorReason || lifecycleFault || "ARCHIVE_RECOVERED_RUN_FAILED" } });
          }
          await execution.release?.(blockedTurn.runId);
          blockedTurn = void 0;
          blockedTurnReason = "";
          lifecycleFault = "";
        }
        if (status === "stopping") advanceStop();
        else {
          completeStartup();
          schedule();
        }
        return { pending: archiveJobs().length, revision: home.revision };
      },
      async previewProjection(projectionId) {
        if (!home || !writable()) throw Object.assign(new Error("HOME_UNAVAILABLE"), { code: "READ_ONLY_HOME" });
        return home.previewProjection(projectionId);
      },
      readDiagnostic: diagnostic,
      async readPreservedProjection(operationId) {
        if (!home || !writable()) throw Object.assign(new Error("HOME_UNAVAILABLE"), { code: "READ_ONLY_HOME" });
        return home.readPreservedProjection(operationId);
      },
      async apply(command) {
        if (command.kind === "edit-autonomy-rules") command = Object.freeze({ ...command, clock: clock.read() });
        else if (command.kind === "review-autonomy-clock") command = Object.freeze({ ...command, clock: clock.read() });
        if (command.kind === "cleanup-sources") {
          const progress = await requestCleanup(command);
          if (progress.phase === "waiting-actions") return { operationId: command.operationId, kind: "unavailable", reason: "SOURCE_CLEANUP_PENDING" };
          return home.applyOwner(command);
        }
        if (formatUpgradeSealed) return { operationId: command.operationId, kind: "unavailable", reason: "FORMAT_UPGRADE_PENDING" };
        if (cleanupSealed) return { operationId: command.operationId, kind: "unavailable", reason: "SOURCE_CLEANUP_PENDING" };
        if (command.kind === "edit-autonomy-rules") {
          sealAutonomy();
          if (home && writable()) {
            if (!validAutonomyRules(command.value)) throw new ExecutionError("INVALID_AUTONOMY_RULES");
            const old = await home.readOperation(command.operationId);
            if (old.kind === "not-found") {
              const a = await home.readAutonomy();
              if (command.expectedAutonomyRulesVersion !== a.rules.version) throw new ExecutionError("AUTONOMY_RULES_VERSION_CONFLICT");
              if (command.value.outputTokens !== a.rules.value.outputTokens) {
                if (!execution) throw new ExecutionError("MODEL_ROUTE_UNAVAILABLE");
                await execution.prepare(command.value.outputTokens);
              }
              if (command.value.wakeIntervalMs !== a.rules.value.wakeIntervalMs) {
                const savedSchedule = await home.readAutonomySchedule().catch(() => null);
                const nextSchedule = recomputedSchedule(savedSchedule ?? void 0, command.value.wakeIntervalMs);
                if (nextSchedule) await home.rescheduleAutonomyFuture({ operationId: OperationId("interval-" + createHash5("sha256").update(command.operationId + ":schedule").digest("hex").slice(0, 40)), nextOpportunityAt: nextSchedule.nextOpportunityAt });
              }
            }
          }
        }
        if (command.kind === "resolve-delivery" && home && writable()) {
          if (!validateResolveDelivery(command)) throw new ExecutionError("INVALID_DELIVERY_RESOLUTION");
          const snapshot = await home.readSnapshot();
          if (snapshot.uncertainOperationId && snapshot.uncertainOperationId !== command.operationId) throw new ExecutionError("IO_UNCERTAIN");
          const previous = await home.readOperation(command.operationId);
          if (previous.kind === "not-found" && command.decision === "resend") {
            const state = await home.readConversation(), original = state.deliveries.find((d) => d.deliveryId === command.deliveryId);
            if (!original || !sameQQTarget(snapshot.qqBinding, original.target)) throw new ExecutionError("QQ_BINDING_CHANGED");
            if (!deliveryPort?.canSend(original.target)) throw new ExecutionError("QQ_SEND_UNAVAILABLE");
          }
        }
        if (command.kind === "edit-conversation" && home && writable()) {
          if (!validateConversationSettings(command.value)) throw new ExecutionError("INVALID_CONVERSATION_SETTINGS");
          const old = await home.readOperation(command.operationId);
          if (old.kind === "not-found") {
            const c = await home.readConversation();
            if (command.expectedConversationVersion !== c.rules.version) throw new ExecutionError("CONVERSATION_VERSION_CONFLICT");
            if (!execution) throw new ExecutionError("MODEL_ROUTE_UNAVAILABLE");
            await execution.prepare(command.value.outputTokens);
          }
        }
        if (home && writable()) {
          const before = command.kind === "bind-qq" ? (await home.readSnapshot()).qqBinding : void 0;
          const result = await home.applyOwner(command);
          if (command.kind === "bind-qq") {
            const after = (await home.readSnapshot()).qqBinding;
            if (after && !sameQQTarget(before, after)) historyRuntime?.interrupt("QQ_BINDING_CHANGED");
          }
          if (command.kind === "set-autonomy-pause" || command.kind === "edit-autonomy-rules") {
            clearScheduler();
            schedulerSkipReason = null;
            if (result.kind === "committed") void armTimer();
          }
          schedule();
          return result;
        }
        return { operationId: command.operationId, kind: "unavailable", reason: maintenancePending ? "BACKUP_MAINTENANCE_PENDING" : status === "read-only" ? "read-only-home" : stopReason || reason };
      },
      async readOperation(operationId) {
        if (activeStopId === operationId) return stopView();
        if (homeClosed && retainedStops.has(operationId)) return structuredClone(retainedStops.get(operationId));
        return home && !homeClosed ? home.readOperation(operationId) : activationReadHome && status === "read-only" && !homeClosed ? activationReadHome.readOperation(operationId) : capability ? { operationId, kind: "unavailable", reason: status } : { operationId, kind: "not-found" };
      },
      async readDeliveryRules() {
        return readHome().readDeliveryRules();
      },
      async readWebRules() {
        return readHome().readWebRules();
      },
      async readRetryRules() {
        return readHome().readRetryRules();
      },
      async readContactRules() {
        return readHome().readContactRules();
      },
      async readContactState() {
        const snapshot = await contactReadStamp();
        return { state: await readHome().readConversation(), stamp: snapshot, lastBlockedReason: lastContactBlocked };
      },
      async readFileAccess() {
        return readHome().readFileAccess();
      },
      async readFileRules() {
        return readHome().readFileRules();
      },
      async readReadRules() {
        return readHome().readReadRules();
      },
      async readProposalRules() {
        return readHome().readProposalRules();
      },
      async readAutonomy() {
        return readHome().readAutonomy();
      },
      async readAutonomyAttribution(request) {
        return readHome().readAutonomyAttribution(request);
      },
      async readKnowledge() {
        return readHome().readKnowledge();
      },
      async readContextSources(page) {
        const reader = await readHome().openContextReader({ purpose: "management" });
        try {
          return await readContextSourcePage(reader, page);
        } finally {
          reader.revoke();
        }
      },
      async readContextSource(request) {
        const reader = await readHome().openContextReader({ purpose: "management" });
        try {
          return await readContextSourcePart(reader, request);
        } finally {
          reader.revoke();
        }
      },
      async readLibrarySources(request) {
        const reader = await readHome().openContextReader({ purpose: "management" });
        try {
          return await readLibrarySources(reader, request);
        } finally {
          reader.revoke();
        }
      },
      async readConversation() {
        return readHome().readConversation();
      },
      async readExecutionRecord(request) {
        return readHome().readExecutionRecord(request);
      },
      async readReply(request) {
        return readHome().readReply(request);
      }
    }),
    lifetime: Object.freeze({ stopped, requestStop })
  });
}
export {
  createNodeClock,
  defaultTimers,
  fitCharacterContext,
  ianaDay,
  prepareCharacterContext,
  searchContextSources,
  startRole
};
