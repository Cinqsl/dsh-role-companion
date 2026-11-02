import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

const outputDirectory = await mkdtemp(join(tmpdir(), 'dsh-library-knowledge-view-'));
const output = join(outputDirectory, 'library-knowledge-view.mjs');
await build({
  entryPoints: [new URL('../packages/companion/src/host/library-knowledge-view.ts', import.meta.url).pathname],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  outfile: output,
});
const {queryKnowledgeLibrary,readKnowledgeLibraryDetail} = await import(pathToFileURL(output).href);
await rm(outputDirectory, {recursive: true, force: true});

function version(index, overrides = {}) {
  const proposalId = `proposal-${index - 1}`;
  return {
    knowledgeId: 'knowledge-walk',
    version: index,
    proposalId,
    topic: `Topic ${index}`,
    text: index === 25 ? 'Hidden lantern phrase' : `Body ${index}`,
    statement: 'user-report',
    sources: [{ref: {kind: 'input', id: `input-${String(index).padStart(8, '0')}-0000-4000-8000-000000000000`}, quote: `Quote ${index}`}],
    scope: `Scope ${index}`,
    reason: `Reason ${index}`,
    kind: 'memory',
    committedRevision: index,
    ...overrides,
  };
}

const targetSource = index => ({
  kind: 'input',
  id: `input-${String(index).padStart(8, '0')}-0000-4000-8000-000000000000`,
});

function snapshot() {
  const proposals = Array.from({length: 25}, (_, index) => ({
    proposalId: `proposal-${index}`,
    operationId: `operation-${index}`,
    runId: `run-${index}`,
    attemptId: `attempt-${index}`,
    claim: {},
    value: {
      kind: 'memory',
      topic: `Proposal topic ${index}`,
      text: `Proposal body ${index}`,
      statement: 'user-report',
      sources: [{ref: {kind: 'input', id: `input-${String(index).padStart(8, '0')}-0000-4000-8000-000000000000`}, quote: `Quote ${index}`}],
      scope: `Proposal scope ${index}`,
      reason: `Proposal reason ${index}`,
      expectedVersion: 0,
    },
    createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    committedRevision: index + 1,
    processing: {
      status: 'adopted',
      reason: 'EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH',
      committedRevision: index + 2,
      knowledgeId: 'knowledge-walk',
      version: index + 1,
    },
  }));
  return {
    revision: 100,
    proposals,
    versions: Array.from({length: 25}, (_, index) => version(index + 1)),
  };
}

test('knowledge keyword query filters the full version collection before paging', () => {
  const page = queryKnowledgeLibrary(snapshot(), {
    collection: 'versions',
    offset: 0,
    limit: 20,
    keyword: 'lantern',
    kind: '',
    scope: 'all',
    status: '',
    from: '',
    to: '',
    order: 'newest',
  });

  assert.equal(page.total, 1);
  assert.equal(page.records.length, 1);
  assert.equal(page.records[0].topicExcerpt, 'Topic 25');
  assert.equal(page.more, false);
  assert.deepEqual(page.range, {start: 1, end: 1});
});

test('knowledge keyword query searches beyond the displayed 160-code-point excerpt', () => {
  const state = snapshot();
  state.versions[19] = version(20, {
    kind: 'growth',
    area: 'relationship',
    phase: 'stable',
    text: `${'前'.repeat(200)}深处的蓝盐灯塔`,
  });
  state.proposals[19].processing.reason = '关系边界需要人工核对，保留处理原因';

  const query = {
    collection: 'versions',
    offset: 0,
    limit: 20,
    keyword: '',
    kind: '',
    scope: 'all',
    status: '',
    from: '',
    to: '',
    order: 'newest',
  };
  const body = queryKnowledgeLibrary(state, {...query, keyword: '蓝盐灯塔'});
  const metadata = queryKnowledgeLibrary(state, {...query, keyword: 'relationship'});
  const processing = queryKnowledgeLibrary(state, {...query, keyword: '人工核对'});

  assert.equal(body.total, 1);
  assert.equal(body.records[0].version, 20);
  assert.equal(metadata.total, 1);
  assert.equal(metadata.records[0].version, 20);
  assert.equal(processing.total, 1);
  assert.equal(processing.records[0].version, 20);
});

test('knowledge version scope separates the current version from history', () => {
  const query = {
    collection: 'versions',
    offset: 0,
    limit: 50,
    keyword: '',
    kind: '',
    scope: 'current',
    status: '',
    from: '',
    to: '',
    order: 'newest',
  };
  const current = queryKnowledgeLibrary(snapshot(), query);
  const historical = queryKnowledgeLibrary(snapshot(), {...query, scope: 'historical'});

  assert.equal(current.total, 1);
  assert.equal(current.records[0].version, 25);
  assert.equal(current.records[0].current, true);
  assert.equal(historical.total, 24);
  assert.ok(historical.records.every(record => record.current === false));
});

test('knowledge query combines type, processing status, and real effective time', () => {
  const state = snapshot();
  state.proposals[5].value.kind = 'growth';
  state.proposals[5].processing.status = 'rejected';
  state.versions[5] = version(6, {
    proposalId: 'proposal-5',
    kind: 'growth',
    area: 'preference',
    phase: 'stable',
  });

  const page = queryKnowledgeLibrary(state, {
    collection: 'versions',
    offset: 0,
    limit: 20,
    keyword: '',
    kind: 'growth',
    scope: 'all',
    status: 'rejected',
    from: '2026-01-05T00:00:00.000Z',
    to: '2026-01-07T23:59:59.999Z',
    order: 'oldest',
  });

  assert.equal(page.total, 1);
  assert.equal(page.records[0].version, 6);
  assert.equal(page.records[0].effectiveAt, '2026-01-06T00:00:00.000Z');
});

test('knowledge paging reports the filtered range after newest-first sorting', () => {
  const query = {
    collection: 'versions',
    offset: 0,
    limit: 20,
    keyword: '',
    kind: '',
    scope: 'all',
    status: '',
    from: '',
    to: '',
    order: 'newest',
  };
  const first = queryKnowledgeLibrary(snapshot(), query);
  const second = queryKnowledgeLibrary(snapshot(), {...query, offset: 20});

  assert.equal(first.records[0].version, 25);
  assert.deepEqual(first.range, {start: 1, end: 20});
  assert.equal(first.nextOffset, 20);
  assert.equal(second.records.length, 5);
  assert.equal(second.records[0].version, 5);
  assert.deepEqual(second.range, {start: 21, end: 25});
  assert.equal(second.nextOffset, null);
});

test('knowledge pages expose a stable canonical filter identifier', () => {
  const first = queryKnowledgeLibrary(snapshot(), {
    collection: 'versions',
    offset: 0,
    limit: 20,
    keyword: 'Lantern',
    kind: '',
    scope: 'all',
    status: '',
    from: '2026-01-01T00:00:00.000Z',
    to: '',
    order: 'newest',
  });
  const sameFiltersReordered = queryKnowledgeLibrary(snapshot(), {
    order: 'newest',
    to: '',
    from: '2026-01-01T00:00:00.000Z',
    status: '',
    scope: 'all',
    kind: '',
    keyword: 'Lantern',
    limit: 50,
    offset: 20,
    collection: 'versions',
  });
  const changed = queryKnowledgeLibrary(snapshot(), {
    collection: 'versions',
    offset: 0,
    limit: 20,
    keyword: 'lantern',
    kind: 'growth',
    scope: 'all',
    status: '',
    from: '2026-01-01T00:00:00.000Z',
    to: '',
    order: 'newest',
  });

  assert.equal(
    first.filterKey,
    '{"collection":"versions","keyword":"lantern","kind":"","scope":"all","status":"","from":"2026-01-01T00:00:00.000Z","to":"","order":"newest"}',
  );
  assert.equal(first.filterKey, sameFiltersReordered.filterKey);
  assert.notEqual(first.filterKey, changed.filterKey);
});

function rollbackSnapshot() {
  const state = snapshot();
  const target = version(1, {text: 'old body', scope: 'old scope'});
  const correction = version(2, {
    text: 'corrected body',
    scope: 'corrected scope',
    relation: {kind: 'correction', targetId: 'knowledge-walk', version: 1},
  });
  const {proposalId, ...base} = target;
  const ownerVersion = {
    ...base,
    version: 3,
    text: 'old body',
    committedRevision: 30,
    ownerAction: {
      kind: 'rollback',
      operationId: 'rollback-operation',
      fromVersion: 2,
      reason: 'Restore the earlier wording while retaining the correction.',
      createdAt: '2026-02-01T12:00:00.000Z',
    },
    rollbackOf: {knowledgeId: 'knowledge-walk', version: 1},
    preservedCorrections: [{kind: 'knowledge', id: 'knowledge-walk', version: 2}],
  };
  state.versions = [target, correction, ownerVersion];
  return state;
}

test('knowledge detail reads one bounded body range, retains corrections, and rejects stale continuation', () => {
  const state = rollbackSnapshot();
  const listed = queryKnowledgeLibrary(state, {
    collection: 'versions',
    offset: 0,
    limit: 20,
    keyword: '',
    kind: '',
    scope: 'all',
    status: '',
    from: '',
    to: '',
    order: 'oldest',
  }).records.find(record => record.version === 2);

  const detail = readKnowledgeLibraryDetail(state, {
    ref: listed.ref,
    revision: state.revision,
    contentDigest: listed.contentDigest,
    offset: 0,
    limit: 7,
  });

  assert.equal(detail.topic, 'Topic 2');
  assert.equal(detail.text, 'correct');
  assert.equal(detail.offset, 0);
  assert.equal(detail.bodyTotalCodePoints, 14);
  assert.equal(detail.more, true);
  assert.equal(detail.nextOffset, 7);
  assert.equal(detail.scope, 'corrected scope');
  assert.equal(detail.current, false);
  assert.deepEqual(detail.sources, [{ref: targetSource(2), quote: 'Quote 2'}]);
  assert.deepEqual(detail.preservedCorrections, [{kind: 'knowledge', id: 'knowledge-walk', version: 2}]);
  assert.equal(detail.difference.currentVersion, 3);
  assert.ok(detail.difference.fields.some(field => field.field === 'text'));

  const continuation = readKnowledgeLibraryDetail(state, {
    ref: listed.ref,
    revision: state.revision,
    contentDigest: listed.contentDigest,
    offset: detail.nextOffset,
    limit: 7,
  });
  assert.equal(continuation.text, 'ed body');
  assert.equal(continuation.more, false);
  assert.equal(continuation.nextOffset, null);

  assert.throws(
    () => readKnowledgeLibraryDetail({...state,revision:state.revision+1}, {
      ref: listed.ref,
      revision: state.revision,
      contentDigest: listed.contentDigest,
      offset: 7,
      limit: 7,
    }),
    error => error.code === 'KNOWLEDGE_RECORD_CHANGED',
  );
  const changedBody = structuredClone(state);
  changedBody.versions[1].text = 'changed body!!';
  assert.throws(
    () => readKnowledgeLibraryDetail(changedBody, {
      ref: listed.ref,
      revision: state.revision,
      contentDigest: listed.contentDigest,
      offset: 7,
      limit: 7,
    }),
    error => error.code === 'KNOWLEDGE_RECORD_CHANGED',
  );
});
