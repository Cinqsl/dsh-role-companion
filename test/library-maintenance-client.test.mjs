import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHookRuntime} from './react-hook-runtime.mjs';

function textContent(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return textContent(node.props?.children);
}

function findAll(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (!Array.isArray(node) && predicate(node)) found.push(node);
  const children = Array.isArray(node) ? node : node.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) findAll(child, predicate, found);
  } else {
    findAll(children, predicate, found);
  }
  return found;
}

function findButton(node, label) {
  return findAll(node, candidate => candidate.type === 'button'
    && (textContent(candidate) === label || candidate.props?.['aria-label'] === label))[0];
}

function readyView() {
  return {
    packageName: 'dsh-role-companion',
    packageVersion: '0.1.3',
    requiredDsh: '0.2.1-rc.3',
    installed: true,
    enabled: true,
    fiberPhase: 'active',
    bootstrap: {
      path: '/tmp/role-home',
      roleId: 'role-1',
      creationOperationId: 'create-1',
      registrationOperationId: 'register-1',
      version: 1,
    },
    role: {
      status: 'ready',
      reason: '',
      roleId: 'role-1',
      revision: 12,
      backups: [],
      cleanups: [],
      home: {
        roleId: 'role-1',
        revision: 12,
        projection: 'current',
        panelBinding: {
          bindingId: 'panel-role-1',
          bindingVersion: 1,
          source: 'owner-panel',
        },
      },
    },
    selectedRoleId: 'role-1',
    capabilities: [],
  };
}

async function harness(t) {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  let loaded;
  globalThis.window = {__ModuleLoader__: {load(value) { loaded = value; }}};
  globalThis.document = {
    querySelector() { return null; },
    createElement() { return {dataset: {}}; },
    head: {appendChild() {}},
  };
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); },
    },
  });
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousStorage === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', previousStorage);
  });
  await import(`${pathToFileURL('packages/companion/lib/client.js').href}?maintenance-test=${Date.now()}`);
  const nodeRequire = createRequire(import.meta.url);
  const hooks = createHookRuntime(['SourcesView', 'KnowledgeView', 'ExecutionsView']);
  t.after(() => hooks.reset());
  const plugin = loaded.factory(name => {
    if (name === 'react') return hooks.exports;
    if (name === 'react/jsx-runtime') {
      return {
        Fragment: Symbol('Fragment'),
        jsx: (type, props) => ({type, props}),
        jsxs: (type, props) => ({type, props}),
      };
    }
    return nodeRequire(name);
  });
  let currentView = readyView();
  const calls = [];
  let previewDigest = 'a'.repeat(64);
  const queryCalls = [];
  const maintenance = async (_roleId, _bindingVersion, page) => {
    calls.push(['readMaintenance', page]);
    const allItems = [
      {
        ref: {kind: 'input', id: 'input-1'},
        kind: 'input',
        kindLabel: '用户来信',
        preview: '雨停后去河边散步。',
        occurredAt: '2026-10-31T10:00:00.000Z',
        state: 'available',
        stateLabel: '可选择清理',
      },
      {
        ref: {kind: 'reply', id: 'reply-1'},
        kind: 'reply',
        kindLabel: '角色回复',
        preview: '河边的风很轻。',
        occurredAt: '2026-10-31T09:00:00.000Z',
        state: 'available',
        stateLabel: '可选择清理',
      },
      {
        ref: {kind: 'tool', id: 'tool-1'},
        kind: 'tool',
        kindLabel: '工具执行',
        preview: '工具调用已返回结果，正文和材料请到执行记录查看。',
        occurredAt: '2026-10-31T08:00:00.000Z',
        state: 'available',
        stateLabel: '可选择清理',
      },
      ...Array.from({length: 18}, (_, index) => ({
        ref: {kind: 'input', id: `input-${index + 2}`},
        kind: 'input',
        kindLabel: '用户来信',
        preview: `补充经历 ${index + 2}。`,
        occurredAt: `2026-10-30T${String(23 - index).padStart(2, '0')}:00:00.000Z`,
        state: 'available',
        stateLabel: '可选择清理',
      })),
    ];
    const items = allItems.slice(page.offset, page.offset + page.limit);
    return {
      ok: true,
      value: {
        health: {
          tone: 'success',
          label: '可以维护',
          detail: '角色之家可读可写，当前没有待继续的清理任务。',
          pendingCleanupCount: 0,
        },
        cleanup: {
          basis: {roleId: 'role-1', revision: 12},
          items,
          offset: page.offset,
          total: allItems.length,
          more: page.offset + page.limit < allItems.length,
        },
      },
    };
  };
  let projection = {
    projectionId: 'settings',
    roleId: 'role-1',
    revision: 12,
    coreVersion: 3,
    settingsVersion: 2,
    state: 'diff',
    expectedText: '{"core":{"text":"权威核心","version":3}}',
    expectedDigest: 'd'.repeat(64),
    actualText: '{"core":{"text":"手改核心","version":3}}',
    actualDigest: 'e'.repeat(64),
    importable: true,
    reason: 'PROJECTION_DIFF',
    changes: ['core'],
  };
  let projectionOperationState = 'complete';
  const operationCalls = [];
  const preservedCalls = [];
  const diagnosticCalls = [];
  const verificationCalls = [];
  const archiveRetryCalls = [];
  const ctx = {
    remote: {
      async $mount() {},
      roleCompanion: {
        async inspect() { return {ok: true, value: currentView}; },
        readMaintenance: maintenance,
        async previewProjection(_projectionId, _roleId) {
          calls.push(['previewProjection', _projectionId, _roleId]);
          return {ok: true, value: projection};
        },
        async manageProjection(command, roleId) {
          calls.push(['manageProjection', command, roleId]);
          projection = projectionOperationState === 'complete'
            ? {...projection, state: 'current', actualText: projection.expectedText, actualDigest: projection.expectedDigest}
            : projection;
          return {
            ok: true,
            value: {
              operationId: command.operationId,
              kind: 'committed',
              committedRevision: 13,
              projectionOperation: {
                intent: 'committed',
                state: projectionOperationState,
                preservedMaterialRef: 'material/projection',
              },
            },
          };
        },
        async readOperation(operationId, roleId) {
          operationCalls.push([operationId, roleId]);
          return {
            ok: true,
            value: {
              operationId,
              roleId,
              kind: 'committed',
              committedRevision: 13,
              projectionOperation: {
                intent: 'committed',
                state: projectionOperationState,
                preservedMaterialRef: 'material/projection',
              },
            },
          };
        },
        async readPreservedProjection(operationId, roleId) {
          preservedCalls.push([operationId, roleId]);
          return {
            ok: true,
            value: {
              operationId,
              materialRef: 'material/projection',
              bytesBase64: Buffer.from('保留下来的手改核心', 'utf8').toString('base64'),
              absent: false,
            },
          };
        },
        async readDiagnostic(roleId) {
          diagnosticCalls.push(roleId);
          return {
            ok: true,
            value: {
              mode: 'healthy',
              reason: 'healthy',
              claimedRoleId: 'role-1',
              verifiedRoleId: 'role-1',
              verifiedRevision: 12,
              recovery: ['retry-open', 'inspect-validated-backup'],
              evidence: [{file: 'identity.json', digest: 'f'.repeat(64), bytes: 128}],
            },
          };
        },
        async verifyBackup(roleId, operationId) {
          verificationCalls.push([roleId, operationId]);
          return {
            ok: true,
            value: {
              ...currentView.role.backups.find(record => record.operationId === operationId),
              phase: 'verified-restorable',
              checkpoint: 'verified',
            },
          };
        },
        async retryArchives(roleId, bindingVersion) {
          archiveRetryCalls.push([roleId, bindingVersion]);
          return {ok: true, value: {pending: 0, revision: 13}};
        },
        async previewCleanup(_roleId, _bindingVersion, selection) {
          calls.push(['previewCleanup', selection]);
          return {
            ok: true,
            value: {
              revision: 12,
              selection,
              digest: previewDigest,
              effects: [
                {kind: 'input', id: 'input-1', action: 'revoke'},
                {kind: 'reply', id: 'reply-1', action: 'revoke'},
                {kind: 'turn', id: 'run-1', action: 'retain-result-metadata'},
                {kind: 'knowledge', id: 'knowledge-1', version: 2, action: 'retain-source-marked'},
                {kind: 'proposal', id: 'proposal-1', action: 'retain-source-marked'},
              ],
              quiescingRuns: ['run-live'],
              sharedContent: [{
                digest: 'b'.repeat(64),
                utf8Bytes: 18,
                uses: ['input:input-1', 'knowledge:knowledge-1:2'],
                retainedUses: ['knowledge:knowledge-1:2'],
              }],
              storageGenerations: [],
              externalCopies: ['QQ messages', 'DSH private storage', 'external files', 'independent backups'],
              physical: {phase: 'not-started', complete: false},
            },
          };
        },
        async requestCleanup(_roleId, _bindingVersion, request) {
          calls.push(['requestCleanup', request]);
          return {
            ok: true,
            value: {
              operationId: request.operationId,
              phase: 'waiting-actions',
              request,
              preview: {
                revision: request.expectedRevision,
                selection: request.selection,
                digest: request.previewDigest,
                effects: [],
                quiescingRuns: [],
                sharedContent: [],
                storageGenerations: [],
                externalCopies: [],
                physical: {phase: 'not-started', complete: false},
              },
              physical: {complete: false},
            },
          };
        },
        async readCleanup(_roleId, _bindingVersion, operationId) {
          queryCalls.push(operationId);
          return {ok: true, value: {operationId, phase: 'not-found'}};
        },
      },
    },
    pluginNavigation: {openBundle() {}},
    inject(names, callback) {
      assert.deepEqual(names, ['remote.roleCompanion']);
      callback(this);
    },
    slots: {
      inject(_name, callback) { callback(); },
      register(options, component) {
        if (options.name === 'plugins.bundle.config') this.page = component;
        return () => {};
      },
    },
  };
  await plugin.apply(ctx);
  return {
    calls,
    ctx,
    archiveRetryCalls,
    diagnosticCalls,
    hooks,
    page: () => ctx.slots.page({view: 'page'}),
    operationCalls,
    preservedCalls,
    queryCalls,
    storage,
    setProjection(value) { projection = {...projection, ...value}; },
    setProjectionOperationState(value) { projectionOperationState = value; },
    setPreviewDigest(value) { previewDigest = value; },
    setView(view) { currentView = view; },
    verificationCalls,
  };
}

test('维护页显示健康摘要、内部标签和中文清理目录', async t => {
  const app = await harness(t);
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());

  assert.match(textContent(tree), /可以维护/);
  assert.ok(findButton(tree, '清理'));
  assert.ok(findButton(tree, '投影'));
  assert.ok(findButton(tree, '诊断恢复'));
  assert.match(textContent(tree), /用户来信/);
  assert.match(textContent(tree), /雨停后去河边散步/);
  assert.match(textContent(tree), /可选择清理/);
  assert.deepEqual(app.calls[0], ['readMaintenance', {offset: 0, limit: 20}]);
});

test('投影维护显示权威与实际差异并在独立标签提交受控导入', async t => {
  const app = await harness(t);
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '投影').props.onClick();
  tree = await app.hooks.render(app.page());

  assert.equal(findButton(tree, '检查资料完整性'), undefined);
  assert.equal(findButton(tree, '仅校验所选备份'), undefined);
  findButton(tree, '查看最新投影差异').props.onClick();
  tree = await app.hooks.render(app.page());

  assert.match(textContent(tree), /可处理：存在投影差异/);
  assert.match(textContent(tree), /权威内容生成结果/);
  assert.equal(
    findAll(tree, candidate => candidate.type === 'textarea' && candidate.props?.['aria-label'] === '权威内容生成结果')[0].props.value,
    '{"core":{"text":"权威核心","version":3}}',
  );
  assert.match(textContent(tree), /实际文件内容/);
  assert.equal(
    findAll(tree, candidate => candidate.type === 'textarea' && candidate.props?.['aria-label'] === '实际文件内容')[0].props.value,
    '{"core":{"text":"手改核心","version":3}}',
  );
  assert.match(textContent(tree), /核心/);

  findButton(tree, '受控导入当前差异').props.onClick();
  tree = await app.hooks.render(app.page());
  const manageCall = app.calls.find(([method]) => method === 'manageProjection');
  assert.equal(manageCall[1].kind, 'import-projection');
  assert.equal(manageCall[1].projectionId, 'settings');
  assert.equal(manageCall[1].observedDigest, 'e'.repeat(64));
  assert.equal(manageCall[1].expectedRevision, 12);
  assert.equal(manageCall[1].expectedCoreVersion, 3);
  assert.equal(manageCall[1].expectedSettingsVersion, 2);
  assert.equal(manageCall[2], 'role-1');
  assert.match(textContent(tree), /物理投影已完成/);
});

test('不可导入的手改投影仍可保留原字节并按同一版本重建', async t => {
  const app = await harness(t);
  app.setProjection({
    state: 'diff',
    importable: false,
    reason: 'INVALID_PROJECTION',
    actualText: '这是不能解析的手工笔记',
    actualDigest: '9'.repeat(64),
  });
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '投影').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '查看最新投影差异').props.onClick();
  tree = await app.hooks.render(app.page());

  assert.equal(findButton(tree, '受控导入当前差异').props.disabled, true);
  findButton(tree, '保留手改原文并重建投影').props.onClick();
  tree = await app.hooks.render(app.page());
  const manageCall = app.calls.find(([method]) => method === 'manageProjection');
  assert.equal(manageCall[1].kind, 'rebuild-projection');
  assert.equal(manageCall[1].observedDigest, '9'.repeat(64));
  assert.equal(manageCall[1].expectedRevision, 12);
  assert.match(textContent(tree), /物理投影已完成/);
});

test('投影待核对操作在切换资料视图和维护标签后按原 ID 查询、读取保留原文并接续', async t => {
  const app = await harness(t);
  app.setProjectionOperationState('pending');
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '投影').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '查看最新投影差异').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '受控导入当前差异').props.onClick();
  tree = await app.hooks.render(app.page());

  const firstManage = app.calls.find(([method]) => method === 'manageProjection');
  const operationId = firstManage[1].operationId;
  assert.match(textContent(tree), new RegExp(`操作 ID：${operationId}`));
  assert.match(textContent(tree), /物理投影未完成/);

  findButton(tree, '诊断恢复').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '投影').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.match(textContent(tree), new RegExp(`操作 ID：${operationId}`));

  findButton(tree, '来源').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '投影').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.match(textContent(tree), new RegExp(`操作 ID：${operationId}`));
  assert.deepEqual(app.operationCalls, []);

  findButton(tree, '查询投影原操作').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.deepEqual(app.operationCalls, [[operationId, 'role-1']]);
  findButton(tree, '查看受管保留原文').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.deepEqual(app.preservedCalls, [[operationId, 'role-1']]);
  assert.equal(
    findAll(tree, candidate => candidate.type === 'textarea' && candidate.props?.['aria-label'] === '受管保留原文')[0].props.value,
    '保留下来的手改核心',
  );

  app.setProjectionOperationState('complete');
  findButton(tree, '接续投影原操作').props.onClick();
  tree = await app.hooks.render(app.page());
  const manageCalls = app.calls.filter(([method]) => method === 'manageProjection');
  assert.equal(manageCalls.length, 2);
  assert.equal(manageCalls[1][1].operationId, operationId);
  assert.equal(findButton(tree, '查询投影原操作'), undefined);
  assert.match(textContent(tree), /物理投影已完成/);
});

test('诊断恢复集中读取完整性事实、只校验所选备份并只重试原工具保存', async t => {
  const app = await harness(t);
  const diagnosticView = readyView();
  diagnosticView.role.backups = [{
    operationId: 'backup-1',
    roleId: 'role-1',
    destination: '/tmp/verified-copy',
    phase: 'verified-restorable',
    checkpoint: 'verified',
    stopOperationId: 'stop-1',
    sourceRevision: 12,
    files: [{path: 'identity.json', kind: 'file', bytes: 128, digest: 'f'.repeat(64)}],
    copiedFiles: 1,
    verifiedFiles: 1,
  }];
  app.setView(diagnosticView);
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '诊断恢复').props.onClick();
  tree = await app.hooks.render(app.page());

  assert.deepEqual(app.diagnosticCalls, ['role-1']);
  assert.match(textContent(tree), /资料完整性已通过/);
  assert.match(textContent(tree), /identity\.json/);
  assert.match(textContent(tree), /只校验所选副本，不替换资料或启动副本/);
  assert.match(textContent(tree), /只补写已经捕获的工具记录，不重新执行工具/);
  assert.equal(findButton(tree, '查看最新投影差异'), undefined);
  assert.equal(findButton(tree, '受控导入当前差异'), undefined);

  findButton(tree, '仅校验所选备份').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.deepEqual(app.verificationCalls, [['role-1', 'backup-1']]);
  assert.match(textContent(tree), /所选副本校验为可恢复备份/);

  findButton(tree, '重试原工具记录保存').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.deepEqual(app.archiveRetryCalls, [['role-1', 1]]);
  assert.match(textContent(tree), /原工具记录保存重试完成，仍待保存 0 项/);
});

test('只读角色保留投影原操作查询和诊断读取但禁用所有写入与受控重试', async t => {
  const app = await harness(t);
  app.setProjectionOperationState('pending');
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '投影').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '查看最新投影差异').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '受控导入当前差异').props.onClick();
  tree = await app.hooks.render(app.page());
  const operationId = app.calls.find(([method]) => method === 'manageProjection')[1].operationId;

  const readOnly = readyView();
  readOnly.role.status = 'read-only';
  readOnly.role.reason = 'MISSING_CONTENT';
  readOnly.role.backups = [{
    operationId: 'backup-readonly',
    roleId: 'role-1',
    destination: '/tmp/readonly-copy',
    phase: 'verified-restorable',
    checkpoint: 'verified',
    stopOperationId: 'stop-readonly',
    sourceRevision: 12,
    files: [],
    copiedFiles: 0,
    verifiedFiles: 0,
  }];
  app.setView(readOnly);
  tree = await app.hooks.render(app.page());
  findButton(tree, '刷新资料').props.onClick();
  tree = await app.hooks.render(app.page());

  assert.equal(findButton(tree, '查看最新投影差异').props.disabled, true);
  assert.equal(findButton(tree, '受控导入当前差异').props.disabled, true);
  assert.equal(findButton(tree, '保留手改原文并重建投影').props.disabled, true);
  assert.equal(findButton(tree, '接续投影原操作').props.disabled, true);
  findButton(tree, '查询投影原操作').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.deepEqual(app.operationCalls, [[operationId, 'role-1']]);
  assert.equal(findButton(tree, '查看受管保留原文').props.disabled, true);
  assert.deepEqual(app.preservedCalls, []);

  findButton(tree, '诊断恢复').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.ok(app.diagnosticCalls.includes('role-1'));
  assert.equal(findButton(tree, '重新检查资料完整性').props.disabled, false);
  assert.equal(findButton(tree, '仅校验所选备份').props.disabled, false);
  assert.equal(findButton(tree, '重试原工具记录保存').props.disabled, true);
  findButton(tree, '仅校验所选备份').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.deepEqual(app.verificationCalls, [['role-1', 'backup-readonly']]);
  assert.match(textContent(tree), /所选副本校验为可恢复备份/);
  assert.deepEqual(app.archiveRetryCalls, []);
});

test('清理来源跨页选择保留在固定选择栏中', async t => {
  const app = await harness(t);
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());

  let checkboxes = findAll(tree, candidate => candidate.type === 'input' && candidate.props?.type === 'checkbox');
  checkboxes[0].props.onChange({target: {checked: true}});
  tree = await app.hooks.render(app.page());
  findButton(tree, '下一页清理来源').props.onClick();
  tree = await app.hooks.render(app.page());
  checkboxes = findAll(tree, candidate => candidate.type === 'input' && candidate.props?.type === 'checkbox');
  checkboxes[0].props.onChange({target: {checked: true}});
  tree = await app.hooks.render(app.page());

  assert.match(textContent(tree), /已选择 2 项/);
  assert.ok(findButton(tree, '移除用户来信：雨停后去河边散步。'));
  assert.ok(findButton(tree, '移除用户来信：补充经历 19。'));
  assert.ok(findButton(tree, '清空选择'));
  assert.ok(findButton(tree, '继续预览'));
  findButton(tree, '移除用户来信：补充经历 19。').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.match(textContent(tree), /已选择 1 项/);
  assert.equal(app.calls.filter(([method]) => method === 'readMaintenance').length, 2);
});

test('清理预览分类展示影响并由单个确认按钮绑定当前版本与摘要', async t => {
  const app = await harness(t);
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());
  findAll(tree, candidate => candidate.type === 'input' && candidate.props?.type === 'checkbox')[0]
    .props.onChange({target: {checked: true}});
  tree = await app.hooks.render(app.page());
  findButton(tree, '下一页清理来源').props.onClick();
  tree = await app.hooks.render(app.page());
  findAll(tree, candidate => candidate.type === 'input' && candidate.props?.type === 'checkbox')[0]
    .props.onChange({target: {checked: true}});
  tree = await app.hooks.render(app.page());
  findButton(tree, '继续预览').props.onClick();
  tree = await app.hooks.render(app.page());

  const previewCall = app.calls.find(([method]) => method === 'previewCleanup');
  assert.deepEqual(previewCall[1].sources, [
    {kind: 'input', id: 'input-1'},
    {kind: 'input', id: 'input-19'},
  ]);
  assert.equal(previewCall[1].derived, 'retain');
  assert.match(textContent(tree), /将撤销的记录/);
  assert.match(textContent(tree), /保留的结果元数据/);
  assert.match(textContent(tree), /仍被其他资料使用的共享正文/);
  assert.match(textContent(tree), /保留派生知识并重新判定日常用途/);
  assert.match(textContent(tree), /QQ 消息/);
  const confirm = findAll(tree, candidate => candidate.type === 'button'
    && textContent(candidate) === '确认清理所选记录');
  assert.equal(confirm.length, 1);
  confirm[0].props.onClick();
  tree = await app.hooks.render(app.page());

  const requestCall = app.calls.find(([method]) => method === 'requestCleanup');
  assert.equal(requestCall[1].expectedRevision, 12);
  assert.equal(requestCall[1].previewDigest, 'a'.repeat(64));
  assert.deepEqual(requestCall[1].selection.sources, previewCall[1].sources);
  assert.equal(findButton(tree, '确认清理所选记录'), undefined);
  assert.match(textContent(tree), /等待已进入动作及最终归档/);
  findButton(tree, '来源').props.onClick();
  tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.match(textContent(tree), new RegExp(`待核对原操作：${requestCall[1].operationId}`));
  findButton(tree, '查询原清理任务').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.deepEqual(app.queryCalls, [requestCall[1].operationId]);
  findButton(tree, '继续原清理操作').props.onClick();
  tree = await app.hooks.render(app.page());
  const requestCalls = app.calls.filter(([method]) => method === 'requestCleanup');
  assert.equal(requestCalls.length, 2);
  assert.equal(requestCalls[1][1].operationId, requestCall[1].operationId);
});

test('清理预览版本变化后禁止确认并保留原操作恢复入口', async t => {
  const app = await harness(t);
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());
  findAll(tree, candidate => candidate.type === 'input' && candidate.props?.type === 'checkbox')[0]
    .props.onChange({target: {checked: true}});
  tree = await app.hooks.render(app.page());
  findButton(tree, '继续预览').props.onClick();
  tree = await app.hooks.render(app.page());

  const changed = readyView();
  changed.role.revision = 13;
  changed.role.home.revision = 13;
  app.setView(changed);
  tree = await app.hooks.render(app.page());
  findButton(tree, '刷新资料').props.onClick();
  tree = await app.hooks.render(app.page());
  const confirm = findButton(tree, '确认清理所选记录');
  assert.equal(confirm.props.disabled, true);
  assert.match(textContent(tree), /旧预览不能确认/);
  assert.ok(findButton(tree, '查询原清理任务'));
});

test('只读角色可查询保存的原操作但不能选择或继续清理', async t => {
  const app = await harness(t);
  app.storage.set(
    'dsh-role-companion:pending-cleanup-operation:v1:role-1',
    JSON.stringify({
      roleId: 'role-1',
      bindingVersion: 1,
      command: {
        kind: 'cleanup-sources',
        operationId: 'readonly-saved-cleanup',
        selection: {sources: [{kind: 'input', id: 'input-1'}], derived: 'retain'},
        expectedRevision: 12,
        previewDigest: 'c'.repeat(64),
      },
    }),
  );
  const readOnly = readyView();
  readOnly.role.status = 'read-only';
  readOnly.role.reason = 'READ_ONLY_DIAGNOSTIC';
  app.setView(readOnly);
  let tree = await app.hooks.render(app.page());
  findButton(tree, '维护').props.onClick();
  tree = await app.hooks.render(app.page());

  const checkboxes = findAll(tree, candidate => candidate.type === 'input' && candidate.props?.type === 'checkbox');
  assert.ok(checkboxes.length > 0);
  assert.ok(checkboxes.every(candidate => candidate.props.disabled === true));
  assert.match(textContent(tree), /不能选择、预览、确认或继续写入/);
  assert.equal(findButton(tree, '继续原清理操作'), undefined);
  findButton(tree, '查询原清理任务').props.onClick();
  tree = await app.hooks.render(app.page());
  assert.deepEqual(app.queryCalls, ['readonly-saved-cleanup']);
});
