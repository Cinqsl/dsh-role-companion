import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

function createHookRuntime(leafTypes = []) {
  const leafs = new Set(leafTypes);
  let stores = new Map();
  let currentKey = '';
  let cursor = 0;
  let effects = [];
  let dirty = false;
  let cleanups = new Map();

  function store() {
    if (!stores.has(currentKey)) stores.set(currentKey, []);
    return stores.get(currentKey);
  }

  function useState(initial) {
    const index = cursor++;
    const hooks = store();
    if (!(index in hooks)) {
      hooks[index] = typeof initial === 'function' ? initial() : initial;
    }
    const setState = value => {
      const next = typeof value === 'function' ? value(hooks[index]) : value;
      if (Object.is(next, hooks[index])) return;
      hooks[index] = next;
      dirty = true;
    };
    return [hooks[index], setState];
  }

  function useEffect(effect, dependencies) {
    const index = cursor++;
    const hooks = store();
    const previous = hooks[index];
    const changed = !previous
      || !dependencies
      || !previous.dependencies
      || dependencies.length !== previous.dependencies.length
      || dependencies.some((value, position) => !Object.is(value, previous.dependencies[position]));
    hooks[index] = {dependencies, kind: 'effect'};
    if (changed) effects.push({effect, index, key: currentKey});
  }

  function useRef(initial) {
    const index = cursor++;
    const hooks = store();
    if (!(index in hooks)) hooks[index] = {current: initial};
    return hooks[index];
  }

  function reset() {
    for (const cleanup of [...cleanups.values()].reverse()) cleanup?.();
    stores = new Map();
    cursor = 0;
    effects = [];
    dirty = false;
    cleanups = new Map();
  }

  function renderNode(node, path) {
    if (node === null || node === undefined || typeof node === 'boolean') return node;
    if (typeof node === 'string' || typeof node === 'number') return node;
    if (Array.isArray(node)) return node.map((child, index) => renderNode(child, `${path}.${index}`));
    if (typeof node.type === 'function') {
      const name = node.type.name || 'Anonymous';
      if (leafs.has(name)) return node;
      const previousKey = currentKey;
      currentKey = `${path}:${name}`;
      cursor = 0;
      const rendered = node.type(node.props);
      currentKey = previousKey;
      return renderNode(rendered, `${path}:${name}`);
    }
    if (typeof node.type === 'symbol') return renderNode(node.props?.children, path);
    const props = {...node.props};
    if ('children' in props) props.children = renderNode(props.children, `${path}.children`);
    return {...node, props};
  }

  async function render(element) {
    let tree;
    do {
      dirty = false;
      effects = [];
      currentKey = 'root';
      cursor = 0;
      tree = renderNode(element, 'root');
      for (const descriptor of effects) {
        const cleanupKey = `${descriptor.key}:${descriptor.index}`;
        cleanups.get(cleanupKey)?.();
        const cleanup = descriptor.effect();
        if (typeof cleanup === 'function') cleanups.set(cleanupKey, cleanup);
        else cleanups.delete(cleanupKey);
      }
      await new Promise(resolve => setImmediate(resolve));
    } while (dirty);
    return tree;
  }

  return {
    exports: {useEffect, useRef, useState},
    render,
    reset,
  };
}

function textContent(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return textContent(node.props?.children);
}

function findNode(node, predicate) {
  if (!node || typeof node !== 'object') return undefined;
  if (!Array.isArray(node) && predicate(node)) return node;
  const children = Array.isArray(node) ? node : node.props?.children;
  if (!Array.isArray(children)) return findNode(children, predicate);
  for (const child of children) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return undefined;
}

function findButton(node, label) {
  return findNode(node, candidate => candidate.type === 'button' && textContent(candidate) === label);
}

function findAllNodes(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (!Array.isArray(node) && predicate(node)) found.push(node);
  const children = Array.isArray(node) ? node : node.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) findAllNodes(child, predicate, found);
  } else {
    findAllNodes(children, predicate, found);
  }
  return found;
}

function sampleView() {
  return {
    packageName: 'dsh-role-companion',
    packageVersion: '0.1.3',
    requiredDsh: '0.2.1-rc.3',
    installed: true,
    enabled: true,
    fiberPhase: 'active',
    bootstrap: {
      path: '',
      roleId: '',
      creationOperationId: '',
      registrationOperationId: '',
      version: 1,
    },
    role: {
      status: 'not-ready',
      reason: 'HOME_NOT_OPEN',
      roleId: null,
      revision: null,
      backups: [],
    },
    selectedRoleId: null,
    capabilities: [],
  };
}

function readyView() {
  const view = sampleView();
  view.bootstrap.path = '/tmp/role-home';
  view.bootstrap.roleId = 'role-1';
  view.role = {
    status: 'ready',
    reason: '',
    roleId: 'role-1',
    revision: 12,
    backups: [],
    cleanups: [],
    home: {
      roleId: 'role-1',
      revision: 12,
      panelBinding: {
        bindingId: 'panel-role-1',
        bindingVersion: 1,
        source: 'owner-panel',
      },
    },
  };
  view.selectedRoleId = 'role-1';
  return view;
}

function componentNames(node, names) {
  return findAllNodes(node, candidate => typeof candidate.type === 'function' && names.includes(candidate.type.name))
    .map(candidate => candidate.type.name);
}

test('角色伙伴注册入口、资料库切换和状态提示可交互', async t => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const appendedStyles = [];
  let loaded;
  globalThis.window = {
    __ModuleLoader__: {
      load(value) {
        loaded = value;
      },
    },
  };
  globalThis.document = {
    querySelector() {
      return null;
    },
    createElement() {
      return {dataset: {}};
    },
    head: {
      appendChild(element) {
        appendedStyles.push(element);
      },
    },
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });

  await import(`${pathToFileURL('packages/companion/lib/client.js').href}?settings-test=${Date.now()}`);
  assert.equal(loaded.id, 'dsh-role-companion');

  const nodeRequire = createRequire(import.meta.url);
  const hookRuntime = createHookRuntime(['MaintenanceCleanup', 'ContextSourcesPanel', 'KnowledgePanel', 'ProjectionPanel', 'ToolPanel']);
  const plugin = loaded.factory(name => {
    if (name === 'react') return hookRuntime.exports;
    if (name === 'react/jsx-runtime') {
      return {
        Fragment: Symbol('Fragment'),
        jsx: (type, props) => ({type, props}),
        jsxs: (type, props) => ({type, props}),
      };
    }
    return nodeRequire(name);
  });

  const registrations = [];
  const injections = [];
  const openedBundles = [];
  const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
    },
  });
  t.after(() => {
    hookRuntime.reset();
    if (previousLocalStorage === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', previousLocalStorage);
  });
  let currentInspect = sampleView();
  let inspectFailure = '';
  let overviewFailure = false;
  const ctx = {
    remote: {
      async $mount() {},
      roleCompanion: {
        async inspect() {
          if (inspectFailure) return {ok: false, error: {code: inspectFailure}};
          return {ok: true, value: currentInspect};
        },
        async readMaintenance() {
          return {
            ok: true,
            value: {
              health: {tone: 'success', label: '可以维护', detail: '维护资料可读取。', pendingCleanupCount: 0},
              cleanup: {basis: {roleId: 'role-1', revision: 12}, items: [], offset: 0, total: 0, more: false},
            },
          };
        },
        async readDiagnostic() {
          return {
            ok: true,
            value: {
              mode: 'healthy',
              reason: 'fixture',
              claimedRoleId: 'role-1',
              verifiedRoleId: 'role-1',
              verifiedRevision: 12,
              recovery: [],
              evidence: [],
            },
          };
        },
        async readLibraryOverview(roleId, bindingVersion) {
          assert.equal(roleId, 'role-1');
          assert.equal(bindingVersion, 1);
          if (overviewFailure) return {ok: false, error: {code: 'OVERVIEW_UNAVAILABLE'}};
          return {
            ok: true,
            value: {
              roleId: 'role-1',
              revision: 12,
              actionCount: 5,
              actions: [
                {
                  id: 'fault',
                  kind: 'fault',
                  reason: '角色运行状态需要核对',
                  impact: '执行或归档可能暂时停止。',
                  actionLabel: '进入诊断恢复',
                  target: {view: 'maintenance', tab: 'diagnostics'},
                },
                {
                  id: 'execution',
                  kind: 'execution',
                  reason: '1 项执行尚未闭合',
                  impact: '最终结果仍在写入。',
                  actionLabel: '查看执行记录',
                  target: {view: 'executions', collection: 'tools'},
                },
                {
                  id: 'projection',
                  kind: 'projection',
                  reason: '文本投影与角色之家内容不一致',
                  impact: '投影文件需要核对。',
                  actionLabel: '处理投影差异',
                  target: {view: 'maintenance', tab: 'projection'},
                },
              ],
              recent: [{
                id: 'source:input-1',
                kind: 'source',
                typeLabel: '用户来信',
                title: '用户来信',
                summary: '最近记录了一封来信。',
                occurredAt: '2026-10-31T08:00:00.000Z',
                target: {
                  view: 'sources',
                  ref: {
                    kind: 'input',
                    id: 'input-11111111-1111-4111-8111-111111111111',
                  },
                },
              }],
            },
          };
        },
        async queryKnowledgeLibrary(roleId, bindingVersion, query) {
          return {
            ok: true,
            value: {
              revision: 12,
              collection: query.collection,
              offset: query.offset,
              limit: query.limit,
              range: {start: 0, end: 0},
              total: 0,
              more: false,
              nextOffset: null,
              records: [],
            },
          };
        },
        async readLibrarySources() {
          return {
            ok: true,
            value: {
              basis: {roleId: 'role-1', revision: 12, contextGeneration: 3, coreVersion: 1},
              purpose: 'management',
              revision: 12,
              query: {keyword: '', types: ['core', 'input', 'reply'], completeness: 'all', availability: 'all', from: null, to: null, sort: 'newest'},
              filterKey: 'fixture',
              sources: [],
              offset: 0,
              limit: 20,
              total: 0,
              datasetTotal: 0,
              rangeStart: 0,
              rangeEnd: 0,
              more: false,
              nextOffset: null,
            },
          };
        },
        async readContextSource() {
          return {ok: false, error: {code: 'NOT_CALLED'}};
        },
      },
    },
    pluginNavigation: {
      openBundle(packageName) {
        openedBundles.push(packageName);
      },
    },
    inject(names, callback) {
      assert.deepEqual(names, ['remote.roleCompanion']);
      callback(this);
    },
    slots: {
      inject(name, callback) {
        injections.push(name);
        callback();
      },
      register(options, component) {
        registrations.push({options, component});
        return () => {};
      },
    },
  };

  await plugin.apply(ctx);

  assert.equal(appendedStyles.length, 1);
  assert.equal(appendedStyles[0].dataset.plugin, 'dsh-role-companion');
  assert.match(appendedStyles[0].textContent, /\.rcPanel/);
  assert.match(appendedStyles[0].textContent, /\.rcGroup\[open\] > \.rcGroupHeader::after/);
  assert.match(appendedStyles[0].textContent, /\.rcSectionNav button\[aria-expanded="true"\]/);
  assert.match(appendedStyles[0].textContent, /\.rcUpdateFacts/);
  assert.deepEqual(injections, ['plugins.bundle.config', 'settings.section']);
  assert.equal(registrations.length, 2);
  assert.deepEqual(registrations[0].options, {
    name: 'plugins.bundle.config',
    key: 'dsh-role-companion',
  });
  assert.deepEqual(registrations[1].options, {
    name: 'settings.section',
    id: 'dsh-role-companion',
    order: 23,
    label: 'DSH 角色伙伴',
  });
  assert.equal(
    registrations[0].component({view: 'summary'}),
    '角色资料库：概览、来源、知识、执行记录与维护',
  );
  const pluginPage = registrations[0].component({view: 'page'});
  const settingsPage = registrations[1].component();
  assert.equal(pluginPage.props.surface, 'library');
  assert.equal(settingsPage.props.surface, 'settings');
  const settingsTree = await hookRuntime.render(settingsPage);
  assert.equal(findButton(settingsTree, '资料记录'), undefined);
  assert.deepEqual(componentNames(settingsTree, ['CleanupPanel', 'ContextSourcesPanel', 'KnowledgePanel', 'ProjectionPanel', 'ToolPanel']), []);
  const openLibrary = findButton(settingsTree, '打开完整资料库');
  assert.ok(openLibrary, 'settings page should render the full library entry');
  openLibrary.props.onClick();
  assert.deepEqual(openedBundles, ['dsh-role-companion']);

  let libraryTree;
  hookRuntime.reset();
  libraryTree = await hookRuntime.render(pluginPage);
  assert.match(textContent(libraryTree), /尚未配置角色之家/);
  assert.ok(findButton(libraryTree, '来源'));

  currentInspect = readyView();
  hookRuntime.reset();
  libraryTree = await hookRuntime.render(pluginPage);
  const libraryNav = findNode(libraryTree, candidate => candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料库一级视图');
  assert.ok(libraryNav, 'library page should render its top-level view navigation');
  const views = [
    ['概览', 'overview'],
    ['来源', 'sources'],
    ['知识', 'knowledge'],
    ['执行记录', 'executions'],
    ['维护', 'maintenance'],
  ];
  for (const [label] of views) assert.ok(findButton(libraryNav, label), `missing library view: ${label}`);
  const activeViews = tree => findAllNodes(tree, candidate => candidate.props?.['data-library-view'] !== undefined)
    .map(candidate => candidate.props['data-library-view']);
  assert.deepEqual(activeViews(libraryTree), ['overview']);
  assert.match(textContent(libraryTree), /待处理 5 项/);
  assert.match(textContent(libraryTree), /用户来信/);
  assert.equal(findAllNodes(libraryTree, candidate =>
    candidate.type === 'button'
    && ['进入诊断恢复', '查看执行记录', '处理投影差异'].includes(textContent(candidate))).length, 3);
  const categoryNav = findNode(libraryTree, candidate =>
    candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料分类入口');
  for (const label of ['概览', '来源', '知识', '执行记录', '维护']) {
    assert.ok(findButton(categoryNav, label), `missing category entry: ${label}`);
  }
  findButton(libraryTree, '进入诊断恢复').props.onClick();
  libraryTree = await hookRuntime.render(pluginPage);
  const diagnosticMaintenance = findNode(libraryTree, candidate =>
    candidate.props?.['data-maintenance-tab'] !== undefined);
  assert.equal(diagnosticMaintenance.props['data-maintenance-tab'], 'diagnostics');
  const overviewNavButton = findButton(findNode(libraryTree, candidate =>
    candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料库一级视图'), '概览');
  overviewNavButton.props.onClick();
  libraryTree = await hookRuntime.render(pluginPage);
  const recentSource = findNode(libraryTree, candidate =>
    candidate.type === 'button' && textContent(candidate).includes('最近记录了一封来信'));
  recentSource.props.onClick();
  libraryTree = await hookRuntime.render(pluginPage);
  assert.deepEqual(activeViews(libraryTree), ['sources']);
  findButton(findNode(libraryTree, candidate =>
    candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料库一级视图'), '概览').props.onClick();
  libraryTree = await hookRuntime.render(pluginPage);
  overviewFailure = true;
  hookRuntime.reset();
  libraryTree = await hookRuntime.render(pluginPage);
  assert.match(textContent(libraryTree), /概览读取未完成/);
  const failedCategories = findNode(libraryTree, candidate =>
    candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料分类入口');
  assert.ok(findButton(failedCategories, '维护'));
  overviewFailure = false;
  findButton(libraryTree, '重新读取概览').props.onClick();
  libraryTree = await hookRuntime.render(pluginPage);
  assert.match(textContent(libraryTree), /待处理 5 项/);
  const expectedPanels = new Map([
    ['overview', []],
    ['sources', []],
    ['knowledge', []],
    ['executions', []],
    ['maintenance', ['MaintenanceCleanup']],
  ]);
  for (const [label, view] of views) {
    const currentNavigation = findNode(libraryTree, candidate =>
      candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料库一级视图');
    const button = findButton(currentNavigation, label);
    button.props.onClick();
    libraryTree = await hookRuntime.render(pluginPage);
    assert.deepEqual(activeViews(libraryTree), [view]);
    assert.deepEqual(componentNames(libraryTree, [...expectedPanels.values()].flat()), expectedPanels.get(view));
  }

  currentInspect = readyView();
  currentInspect.role.status = 'read-only';
  currentInspect.role.reason = 'READ_ONLY_DIAGNOSTIC';
  hookRuntime.reset();
  libraryTree = await hookRuntime.render(pluginPage);
  assert.match(textContent(libraryTree), /当前为只读副本/);
  const readOnlyNav = findNode(libraryTree, candidate => candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料库一级视图');
  findButton(readOnlyNav, '执行记录').props.onClick();
  libraryTree = await hookRuntime.render(pluginPage);
  assert.match(textContent(findNode(libraryTree, candidate => candidate.props?.['aria-label'] === '执行记录')), /只读浏览/);
  const maintenanceNav = findNode(libraryTree, candidate => candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料库一级视图');
  findButton(maintenanceNav, '维护').props.onClick();
  libraryTree = await hookRuntime.render(pluginPage);
  assert.equal(findNode(libraryTree, candidate => candidate.type?.name === 'MaintenanceCleanup').props.readOnly, true);

  inspectFailure = 'CONNECTION_LOST';
  hookRuntime.reset();
  const failedTree = await hookRuntime.render(pluginPage);
  assert.match(textContent(failedTree), /读取失败（CONNECTION_LOST）/);
  assert.ok(findButton(failedTree, '重新查询'));
});

test('知识资料库支持版本与提议筛选、详情、回退和只读保护', async t => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let loaded;
  globalThis.window = {
    __ModuleLoader__: {
      load(value) {
        loaded = value;
      },
    },
  };
  globalThis.document = {
    querySelector() {
      return null;
    },
    createElement() {
      return {dataset: {}};
    },
    head: {
      appendChild() {},
    },
  };
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
  });

  await import(`${pathToFileURL('packages/companion/lib/client.js').href}?knowledge-library-test=${Date.now()}`);
  const nodeRequire = createRequire(import.meta.url);
  const hookRuntime = createHookRuntime(['CleanupPanel', 'ContextSourcesPanel', 'ProjectionPanel', 'ToolPanel']);
  const plugin = loaded.factory(name => {
    if (name === 'react') return hookRuntime.exports;
    if (name === 'react/jsx-runtime') {
      return {
        Fragment: Symbol('Fragment'),
        jsx: (type, props) => ({type, props}),
        jsxs: (type, props) => ({type, props}),
      };
    }
    return nodeRequire(name);
  });

  const digest = 'a'.repeat(64);
  const versionRecord = {
    ref: {kind: 'version', knowledgeId: 'knowledge-1', version: 1},
    origin: 'proposal',
    knowledgeId: 'knowledge-1',
    version: 1,
    kind: 'memory',
    topicExcerpt: '散步偏好',
    textExcerpt: '以前喜欢夜间散步，后来已纠正。',
    status: 'adopted',
    reasonExcerpt: 'EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH',
    current: false,
    effectiveAt: '2026-10-30T08:00:00.000Z',
    sourceCount: 1,
    sourceRefs: [{kind: 'input', id: 'input-1'}],
    sourcesMore: false,
    proposalId: 'proposal-1',
    ownerOperationId: null,
    committedRevision: 11,
    contentDigest: digest,
    totalCodePoints: 50,
  };
  const proposalRecord = {
    ...versionRecord,
    ref: {kind: 'proposal', proposalId: 'proposal-1'},
    origin: 'proposal',
    knowledgeId: 'knowledge-1',
    version: 1,
    topicExcerpt: '散步提议',
    textExcerpt: '等待核对的散步提议。',
    status: 'pending-review',
    current: null,
    effectiveAt: '2026-10-31T08:00:00.000Z',
  };
  const versionDetail = {
    ref: versionRecord.ref,
    revision: 12,
    contentDigest: digest,
    totalCodePoints: 50,
    committedRevision: 11,
    origin: 'proposal',
    knowledgeId: 'knowledge-1',
    version: 1,
    proposalId: 'proposal-1',
    ownerOperationId: null,
    kind: 'memory',
    topic: '散步偏好',
    text: '以前喜欢夜间散步。',
    offset: 0,
    bodyTotalCodePoints: 9,
    more: false,
    nextOffset: null,
    statement: 'user-report',
    scope: '当时偏好',
    status: 'adopted',
    current: false,
    effectiveAt: '2026-10-30T08:00:00.000Z',
    proposalReason: '保留用户原话',
    processingReason: 'EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH',
    sources: [{ref: {kind: 'input', id: 'input-1'}, quote: '以前喜欢夜间散步。'}],
    preservedCorrections: [{kind: 'knowledge', id: 'knowledge-1', version: 2}],
    ownerAction: null,
    rollbackOf: null,
    difference: {
      revision: 12,
      knowledgeId: 'knowledge-1',
      targetVersion: 1,
      currentVersion: 2,
      targetDigest: digest,
      currentDigest: 'b'.repeat(64),
      fields: [{
        field: 'text',
        targetExcerpt: '以前喜欢夜间散步。',
        currentExcerpt: '现在喜欢清晨散步。',
        targetMore: false,
        currentMore: false,
      }],
      preservedCorrections: [],
    },
  };
  const calls = [];
  const inspections = [];
  let currentInspect = readyView();
  const ctx = {
    remote: {
      async $mount() {},
      roleCompanion: {
        async inspect() {
          return {ok: true, value: currentInspect};
        },
        async queryKnowledgeLibrary(roleId, bindingVersion, query) {
          calls.push({method: 'query', query});
          return {
            ok: true,
            value: {
              revision: 12,
              collection: query.collection,
              offset: query.offset,
              limit: query.limit,
              range: {start: 1, end: 1},
              total: 1,
              more: false,
              nextOffset: null,
              records: [query.collection === 'versions'
                ? {...versionRecord, textExcerpt: query.keyword ? '筛选后的知识摘要。' : versionRecord.textExcerpt}
                : proposalRecord],
            },
          };
        },
        async readKnowledgeLibraryDetail(roleId, bindingVersion, request) {
          calls.push({method: 'detail', request});
          return {ok: true, value: versionDetail};
        },
        async readKnowledgeRecord() {
          return {
            ok: true,
            value: {
              ref: versionRecord.ref,
              revision: 12,
              contentDigest: digest,
              text: '{"raw":true}',
              offset: 0,
              totalCodePoints: 13,
              more: false,
            },
          };
        },
        async rollbackKnowledge(roleId, bindingVersion, request) {
          calls.push({method: 'rollback', request});
          return {ok: true, value: {kind: 'committed', committedRevision: 13}};
        },
        async readKnowledgeOperation(roleId, bindingVersion, operationId) {
          inspections.push(operationId);
          return {ok: true, value: {kind: 'committed', operationId, committedRevision: 13}};
        },
      },
    },
    pluginNavigation: {openBundle() {}},
    inject(names, callback) {
      assert.deepEqual(names, ['remote.roleCompanion']);
      callback(this);
    },
    slots: {
      inject(name, callback) {
        callback();
      },
      register(options, component) {
        if (options.name === 'plugins.bundle.config') ctx.pluginPage = component({view: 'page'});
        return () => {};
      },
    },
  };

  t.after(() => {
    hookRuntime.reset();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousLocalStorage === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', previousLocalStorage);
  });

  await plugin.apply(ctx);
  let tree = await hookRuntime.render(ctx.pluginPage);
  const navigation = findNode(tree, candidate => candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料库一级视图');
  findButton(navigation, '知识').props.onClick();
  tree = await hookRuntime.render(ctx.pluginPage);

  assert.ok(findButton(tree, '知识版本'));
  assert.ok(findButton(tree, '提议'));
  assert.match(textContent(tree), /散步偏好/);
  assert.equal(calls.at(-1).query.collection, 'versions');
  assert.equal(calls.at(-1).query.limit, 20);

  const selectVersion = findNode(tree, candidate => candidate.type === 'button' && textContent(candidate).includes('散步偏好'));
  selectVersion.props.onClick();
  tree = await hookRuntime.render(ctx.pluginPage);
  assert.match(textContent(tree), /以前喜欢夜间散步/);
  assert.match(textContent(tree), /来源引用/);
  assert.match(textContent(tree), /后来纠正/);
  assert.match(textContent(tree), /正文/);
  assert.ok(findButton(tree, '返回知识列表'));
  assert.ok(findNode(tree, candidate => candidate.type === 'textarea' && candidate.props?.['aria-label'] === '回退理由'));

  const keyword = findNode(tree, candidate => candidate.type === 'input' && candidate.props?.['aria-label'] === '关键词');
  keyword.props.onChange({currentTarget: {value: 'correction'}});
  tree = await hookRuntime.render(ctx.pluginPage);
  assert.equal(calls.at(-1).query.keyword, 'correction');
  assert.equal(calls.at(-1).query.offset, 0);
  assert.match(textContent(tree), /散步偏好/);
  assert.match(textContent(tree), /筛选后的知识摘要/);
  assert.equal(findNode(tree, candidate => candidate.type === 'textarea' && candidate.props?.['aria-label'] === '回退理由'), undefined);

  findButton(tree, '提议').props.onClick();
  tree = await hookRuntime.render(ctx.pluginPage);
  assert.equal(calls.at(-1).query.collection, 'proposals');
  assert.match(textContent(tree), /散步提议/);

  findButton(tree, '知识版本').props.onClick();
  tree = await hookRuntime.render(ctx.pluginPage);
  const selectHistorical = findNode(tree, candidate => candidate.type === 'button' && textContent(candidate).includes('散步偏好'));
  selectHistorical.props.onClick();
  tree = await hookRuntime.render(ctx.pluginPage);
  const reason = findNode(tree, candidate => candidate.type === 'textarea' && candidate.props?.['aria-label'] === '回退理由');
  reason.props.onChange({currentTarget: {value: '恢复旧正文，同时保留后来纠正。'}});
  tree = await hookRuntime.render(ctx.pluginPage);
  findButton(tree, '提交回退').props.onClick();
  tree = await hookRuntime.render(ctx.pluginPage);
  const rollback = calls.find(call => call.method === 'rollback');
  assert.ok(rollback.request.operationId.startsWith('rollback-'));
  assert.equal(rollback.request.expectedKnowledgeVersion, 2);
  assert.equal(rollback.request.expectedRevision, 12);
  assert.ok([...storage.keys()].some(key => key.includes('knowledge-rollback')));
  findButton(tree, '查询原回退操作').props.onClick();
  tree = await hookRuntime.render(ctx.pluginPage);
  assert.deepEqual(inspections, [rollback.request.operationId]);

  currentInspect = readyView();
  currentInspect.role.status = 'read-only';
  currentInspect.role.reason = 'READ_ONLY_DIAGNOSTIC';
  hookRuntime.reset();
  tree = await hookRuntime.render(ctx.pluginPage);
  const readonlyNavigation = findNode(tree, candidate => candidate.type === 'nav' && candidate.props?.['aria-label'] === '资料库一级视图');
  findButton(readonlyNavigation, '知识').props.onClick();
  tree = await hookRuntime.render(ctx.pluginPage);
  const readonlyRecord = findNode(tree, candidate => candidate.type === 'button' && textContent(candidate).includes('散步偏好'));
  readonlyRecord.props.onClick();
  tree = await hookRuntime.render(ctx.pluginPage);
  assert.match(textContent(tree), /只读角色.*不能提交回退/);
  assert.equal(findButton(tree, '提交回退'), undefined);
});
