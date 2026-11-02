// #51 主动联系规则：仅消费公开契约（ContactRulesValue / validateContactRules / quietHoursActive）。
// 真实 RED 基线：模块尚不存在，import 即失败（保留原日志）。
import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {contactRulesDefaults, validateContactRules, quietHoursActive, localMinutes} from 'dsh-role-companion/home';

const valid = () => ({cooldownMs: 7200000, dailyLimit: 3, perRoundLimit: 1, quietHours: {mode: 'range', start: '23:00', end: '08:00'}});
const rejects = value => assert.equal(validateContactRules(value), false, JSON.stringify(value));
const accepts = value => assert.equal(validateContactRules(value), true, JSON.stringify(value));

test('默认联系规则匹配已确认运行表：冷却120分钟、每日3次、每轮1次、免打扰23:00-08:00区间', () => {
  assert.deepEqual(contactRulesDefaults, valid());
  accepts({...valid()});
});

test('免打扰三态：关闭、全天、合法区间；同起止与非法HH:mm整笔拒绝', () => {
  accepts({...valid(), quietHours: {mode: 'off'}});
  accepts({...valid(), quietHours: {mode: 'all-day'}});
  accepts({...valid(), quietHours: {mode: 'range', start: '00:00', end: '23:59'}});
  rejects({...valid(), quietHours: {mode: 'range', start: '08:00', end: '08:00'}});
  rejects({...valid(), quietHours: {mode: 'range', start: '7:00', end: '08:00'}});
  rejects({...valid(), quietHours: {mode: 'range', start: '24:00', end: '08:00'}});
  rejects({...valid(), quietHours: {mode: 'range', start: '23:60', end: '08:00'}});
  rejects({...valid(), quietHours: {mode: 'range', start: '-1:00', end: '08:00'}});
  rejects({...valid(), quietHours: {mode: 'always'}});
  rejects({...valid(), quietHours: {mode: 'range', start: '23:00'}});
  // 同起止在解析层被拒绝，不能猜测为“全天”。
  rejects({...valid(), quietHours: {mode: 'range', start: '00:00', end: '00:00'}});
});

test('限额与冷却为非负安全整数；未知键、自有__proto__、小数、负数、数组整笔拒绝', () => {
  for (const key of ['cooldownMs', 'dailyLimit', 'perRoundLimit']) {
    rejects({...valid(), [key]: -1});
    rejects({...valid(), [key]: 1.5});
    rejects({...valid(), [key]: Number.MAX_SAFE_INTEGER + 1});
    rejects({...valid(), [key]: '3'});
  }
  rejects({...valid(), extra: 1});
  rejects({...valid(), quietHours: {mode: 'off', start: '08:00'}});
  rejects(null);
  rejects([]);
  const own = JSON.parse('{"__proto__":{"x":1}}');
  rejects({...valid(), ...own});
  const proto = Object.create({mode: 'off'});
  rejects({...valid(), quietHours: proto});
  // 危险自有键必须被拒绝，而不是被读出原型链。
  const polluted = valid();
  Object.defineProperty(polluted, '__proto__', {value: {cooldownMs: 0}, enumerable: true, configurable: true});
  rejects(polluted);
});

test('免打扰区间含起点不含终点：22:59通、23:00阻、07:59阻、08:00通（跨午夜区间）', () => {
  const q = contactRulesDefaults.quietHours;
  assert.equal(quietHoursActive(q, localMinutes('22:59')), false);
  assert.equal(quietHoursActive(q, localMinutes('23:00')), true);
  assert.equal(quietHoursActive(q, localMinutes('07:59')), true);
  assert.equal(quietHoursActive(q, localMinutes('08:00')), false);
  assert.equal(quietHoursActive(q, localMinutes('00:00')), true);
  assert.equal(quietHoursActive({mode: 'off'}, localMinutes('03:00')), false);
  assert.equal(quietHoursActive({mode: 'all-day'}, localMinutes('12:00')), true);
  // 非跨午夜区间同样含起点不含终点。
  assert.equal(quietHoursActive({mode: 'range', start: '12:00', end: '13:00'}, localMinutes('12:00')), true);
  assert.equal(quietHoursActive({mode: 'range', start: '12:00', end: '13:00'}, localMinutes('13:00')), false);
});
