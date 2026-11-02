import {createUserMessage} from '@deepseek-ai/dsh-llm';
import type {ContextFrame} from '../context/index.ts';
/** Home provenance is a notice; the original input remains a complete independent block. */
export function nativeRoleInput(input:ContextFrame['inputs'][number]){
 return createUserMessage({source:{kind:'role-input',form:'notice'},content:[...(input.history?[{type:'text' as const,text:'历史补查：以下原文由用户明确选择后于 '+input.history.receivedAt+' 接纳；提供方报告时间：'+(input.history.reportedAt??'未知')+'。这不是刚收到的实时来信；历史范围和完整性未获保证。'}]:[]),{type:'text',text:input.text}]});
}
