import type {Context} from '@deepseek-ai/cordis';
import type {CompanionView,LibraryOverviewTarget} from '../../types.ts';

export type RoleLibraryView = 'overview' | 'sources' | 'knowledge' | 'executions' | 'maintenance';

export interface RoleLibraryViewProps {
    readonly ctx:Context;
    readonly view:CompanionView;
    readonly refresh:()=>Promise<unknown>;
    readonly readOnly:boolean;
    readonly readable:boolean;
    readonly target?:LibraryOverviewTarget;
}
