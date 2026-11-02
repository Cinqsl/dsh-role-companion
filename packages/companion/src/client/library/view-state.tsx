import type {CompanionView} from '../../types.ts';

export const roleReasonLabels:Readonly<Record<string,string>>={
    OFFICIAL_PROVIDER_CHANGED:'官方模型提供方配置已变化。请在 DSH 模型设置核对后重新启用插件。',
    OFFICIAL_ENDPOINT_REQUIRED:'当前模型没有使用官方 DeepSeek 端点。请在 DSH 模型设置中重新选择。',
    MODEL_CREDENTIAL_MISSING:'尚未配置官方模型凭据。请先在 DSH 模型设置中完成配置。',
    ROLE_STOPPING:'角色正在停稳，已有动作完成后会释放资源。',
    HOME_NOT_OPEN:'角色之家尚未打开。',
};

export function roleStatus(view:CompanionView):{readonly label:string;readonly tone:'success'|'warning'|'danger'|'neutral'} {
    const home=view.role.home;
    if(home&&view.role.status==='ready')return {label:'原生对话已就绪',tone:'success'};
    if(view.role.status==='read-only')return {label:'当前为只读副本',tone:'warning'};
    if(view.role.status==='stopping'||view.role.status==='stopped')return {label:'角色已停止',tone:'warning'};
    if(home)return {label:'运行状态待核对',tone:'danger'};
    return {label:'等待配置',tone:'neutral'};
}

export function libraryAvailability(view:CompanionView,readable:boolean):string {
    const home=view.role.home;
    if(!readable)return home?'角色已停止或需要核对运行状态，资料读取暂不可用。':'尚未配置角色之家。请先在角色设置中创建或接入角色之家。';
    if(!home)return '角色之家尚未打开，当前无法读取这项资料。';
    return '';
}

export function LibraryUnavailable({children}:{readonly children:string}) {
    return <p className="rcLibraryState" role="status">{children}</p>;
}
