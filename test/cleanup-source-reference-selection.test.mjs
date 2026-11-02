import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCurrentTopicCleanup} from '../scripts/58-next-memory-cleanup-selection.mjs';

const source='input-11111111-1111-4111-8111-111111111111';
const correction='input-22222222-2222-4222-8222-222222222222';
const instruction='input-33333333-3333-4333-8333-333333333333';
const unrelated='input-44444444-4444-4444-8444-444444444444';
const cleaned='input-55555555-5555-4555-8555-555555555555';
const knowledgeId='knowledge-proposal-tool-99999999-9999-4999-8999-999999999999';
const inputs=[
 {inputId:source,text:'旧集合地点与暗号。'},
 {inputId:correction,text:'这是后来对新地点和编号的纠正。'},
 {inputId:instruction,text:`请核对上一条新的独立确认 ${source}，并通过 role_read 读取完整原文；targetId 为 ${knowledgeId}，expectedVersion 为 4。`},
 {inputId:unrelated,text:'一块蓝色圆形贴纸。'},
 {inputId:cleaned,text:'',cleanup:{revision:187}},
];
const versions=[
 {knowledgeId,version:5,sources:[{ref:{kind:'input',id:source}}]},
 {knowledgeId,version:6,sources:[{ref:{kind:'input',id:correction}}]},
];

test('默认选择保持历史来源范围，不纳入引用来源 ID 的旧指令',()=>{
 const selected=selectCurrentTopicCleanup(inputs,versions);
 assert.deepEqual(selected.selection.sources.map(source=>source.id),[source,correction]);
 assert.equal(selected.selection.derived,'retain');
});

test('扩展选择纳入引用当前主题来源 ID 的旧操作指令',()=>{
 const selected=selectCurrentTopicCleanup(inputs,versions,{includeReferencedInstructions:true});
 assert.deepEqual(selected.selection.sources.map(source=>source.id),[source,instruction,correction].sort());
 assert.equal(selected.selection.derived,'retain');
 assert(!selected.selection.sources.some(source=>source.id===unrelated));
 assert(!selected.selection.sources.some(source=>source.id===cleaned));
});

test('扩展选择仍排除已清理墓碑且保留来源顺序稳定',()=>{
 const selected=selectCurrentTopicCleanup([...inputs,{inputId:cleaned,text:`引用 ${source} 但正文已被清理`,cleanup:{revision:188}}],versions,{includeReferencedInstructions:true});
 assert(selected.excluded.some(item=>item.id===cleaned&&item.reason==='already-cleaned'));
 const first=selectCurrentTopicCleanup(inputs,versions,{includeReferencedInstructions:true});
 const second=selectCurrentTopicCleanup([...inputs].reverse(),versions,{includeReferencedInstructions:true});
 assert.deepEqual(first.selection,second.selection);
});
