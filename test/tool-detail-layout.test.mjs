import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('完整工具记录紧邻触发项渲染并进入可视区域',async()=>{
  const source=await readFile('packages/companion/src/client/tool-panel.tsx','utf8');
  assert.match(source,/读取此工具完整记录与材料<\/button>\{detail\('attempt',attempt\.attemptId\)\}/);
  assert.match(source,/读取此原生完整记录<\/button>\{detail\('native',native\.recordId\)\}/);
  assert.match(source,/scrollIntoView\(\{block:'nearest'\}\)/);
  assert.doesNotMatch(source,/\{record&&<div><p>完整记录已读取/);
});
