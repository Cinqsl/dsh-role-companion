import type {HomeBackupMaintenance} from './backups.ts';
import { type RoleId, type OperationId, type HomeRevision, type CoreVersion, type InputSettingsVersion } from './ids.ts';
/** A stable projection identifier never grants a path or file capability. */
export type ProjectionId = 'settings';
export interface ProjectionPreview {
    readonly projectionId: ProjectionId;
    readonly roleId: RoleId;
    readonly revision: HomeRevision;
    readonly coreVersion: CoreVersion;
    readonly settingsVersion: InputSettingsVersion;
    readonly state: 'current' | 'diff' | 'lag' | 'unavailable';
    readonly expectedText: string;
    readonly expectedDigest: string;
    readonly actualText: string | null;
    readonly actualDigest: string | null;
    readonly importable: boolean;
    readonly sourceTemplate?: { readonly revision: HomeRevision; readonly coreVersion: CoreVersion; readonly settingsVersion: InputSettingsVersion };
    readonly reason?: string;
    readonly changes: readonly string[];
}
export interface ProjectionCommand {
    readonly kind: 'import-projection' | 'rebuild-projection';
    readonly operationId: OperationId;
    readonly projectionId: ProjectionId;
    readonly observedDigest: string | null;
    readonly expectedRevision: HomeRevision;
    readonly expectedCoreVersion: CoreVersion;
    readonly expectedSettingsVersion: InputSettingsVersion;
}
export interface ProjectionProgress {
    readonly intent: 'committed';
    readonly state: 'pending' | 'complete' | 'blocked' | 'unavailable';
    readonly preservedMaterialRef: string;
    readonly reason?: string;
}
export interface HomeDiagnostic {
    readonly mode: 'healthy' | 'read-only';
    readonly reason: string;
    readonly claimedRoleId: string | null;
    readonly verifiedRoleId: RoleId | null;
    readonly verifiedRevision: HomeRevision | null;
    /** Effective format when the authority read reached it; absent for an unreadable layout. */
    readonly format?: {readonly major: number; readonly minor: number};
    /** Declared identity pair when only the claim is readable; never a verified authority. */
    readonly claimedFormat?: {readonly major: number; readonly minor: number};
    readonly recovery: readonly string[];
    readonly evidence: readonly { readonly file: string; readonly digest: string; readonly bytes: number }[];
}
export interface DiagnosticRoleHome {
    readonly backups?:HomeBackupMaintenance;
    readonly kind: 'diagnostic';
    readDiagnostic(): Promise<HomeDiagnostic>;
    close(): Promise<void>;
}
/** JSON.parse alone silently accepts duplicate fields. Scan keys before decoding. */
export function parseProjectionJSON(source: string): unknown {
    let at = 0;
    const space = () => { while (/\s/u.test(source[at] ?? '') && at < source.length) at++; };
    const string = () => {
        const start = at++;
        while (at < source.length) { const char = source[at++]; if (char === '\\') at++; else if (char === '"') return JSON.parse(source.slice(start, at)) as string; }
        throw new Error('INVALID_PROJECTION');
    };
    const value = (): void => {
        space(); const char = source[at];
        if (char === '"') { string(); return; }
        if (char === '{') {
            at++; space(); const keys = new Set<string>();
            if (source[at] === '}') { at++; return; }
            while (at < source.length) {
                space(); if (source[at] !== '"') throw new Error('INVALID_PROJECTION');
                const key = string(); if (keys.has(key)) throw new Error('INVALID_PROJECTION'); keys.add(key);
                space(); if (source[at++] !== ':') throw new Error('INVALID_PROJECTION'); value(); space();
                const end = source[at++]; if (end === '}') return; if (end !== ',') throw new Error('INVALID_PROJECTION');
            }
        } else if (char === '[') {
            at++; space(); if (source[at] === ']') { at++; return; }
            while (at < source.length) { value(); space(); const end = source[at++]; if (end === ']') return; if (end !== ',') throw new Error('INVALID_PROJECTION'); }
        } else { const match = /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/u.exec(source.slice(at)); if (!match) throw new Error('INVALID_PROJECTION'); at += match[0].length; return; }
        throw new Error('INVALID_PROJECTION');
    };
    value(); space(); if (at !== source.length) throw new Error('INVALID_PROJECTION');
    return JSON.parse(source);
}
export interface PreservedProjection {
    readonly operationId: OperationId;
    readonly materialRef: string;
    readonly bytesBase64: string;
    readonly absent: boolean;
}
