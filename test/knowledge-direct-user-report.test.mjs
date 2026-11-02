import test from 'node:test';
import assert from 'node:assert/strict';
import {directUserReport} from '../packages/companion/lib/home.js';

const input={inputId:'input-11111111-1111-4111-8111-111111111111',text:'事实。\n'};
const value=(text,quote)=>({kind:'memory',statement:'user-report',text,sources:[{ref:{kind:'input',id:input.inputId},quote}]});

test('仅尾随空白不同仍视为逐字用户报告',()=>{
 assert.equal(directUserReport(value('事实。','事实。\n'),[input]),true);
 assert.equal(directUserReport(value('事实。\n\n','事实。'),[input]),true);
});

test('正文差异不是尾随空白时仍拒绝',()=>{
 assert.equal(directUserReport(value('事实','事实。\n'),[input]),false);
 assert.equal(directUserReport(value('事 实。','事实。\n'),[input]),false);
 assert.equal(directUserReport(value('事实。','事实\n'),[input]),false);
});
