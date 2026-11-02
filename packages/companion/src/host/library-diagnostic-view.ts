import type {HomeDiagnostic,ProjectionPreview,ProjectionProgress} from '../home/projections.ts';

export interface MaintenanceStatus {
  readonly tone:'success'|'warning'|'danger'|'neutral';
  readonly label:string;
  readonly detail:string;
}

export function projectionMaintenanceStatus(preview:ProjectionPreview):MaintenanceStatus {
  switch(preview.state){
    case 'current':
      return {tone:'success',label:'已完成：投影与权威内容一致',detail:'当前可读投影无需处理。'};
    case 'diff':
      return {tone:'warning',label:'可处理：存在投影差异',detail:'核对权威内容与实际文件后，选择受控导入或保留手改原文重建。'};
    case 'lag':
      return {tone:'warning',label:'版本过期：需要重新预览',detail:'预览所基于的角色之家版本已经变化，不能按旧结果继续提交。'};
    case 'unavailable':
      return {tone:'danger',label:'不可处理：投影暂不可用',detail:'投影文件超出安全边界或无法读取。保留原文件并检查故障证据。'};
  }
}

export function projectionProgressStatus(progress:ProjectionProgress|undefined):MaintenanceStatus {
  switch(progress?.state){
    case 'complete':
      return {tone:'success',label:'物理投影已完成',detail:'操作意图和物理投影均已完成。'};
    case 'pending':
      return {tone:'warning',label:'物理投影未完成',detail:'原操作已经提交，但物理投影仍需继续。请查询原操作后接续，不新建同一操作。'};
    case 'blocked':
      return {tone:'danger',label:'物理投影被阻止',detail:'投影写入遇到摘要或安全冲突。受管保留原文仍可核对。'};
    case 'unavailable':
      return {tone:'danger',label:'物理投影不可用',detail:'当前无法完成物理投影。保留故障现场并查询原操作。'};
    default:
      return {tone:'neutral',label:'物理投影状态待核对',detail:'尚未取得明确的物理投影进度。'};
  }
}

export function diagnosticSummary(diagnostic:HomeDiagnostic):MaintenanceStatus {
  if(diagnostic.mode==='healthy'){
    return {tone:'success',label:'资料完整性已通过',detail:`身份 ${diagnostic.verifiedRoleId??'尚未验证'}，revision ${diagnostic.verifiedRevision??'无'}。`};
  }
  return {tone:'danger',label:'资料完整性故障',detail:`${diagnostic.reason}。保留故障现场，不跳过坏记录、不重置确认下界、不初始化覆盖。`};
}
