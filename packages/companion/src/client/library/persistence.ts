import type {RoleId} from '../../types.ts';

const prefix='dsh-role-companion:library-preference:v1';

function record(value:unknown):value is Record<string,unknown> {
    return !!value&&typeof value==='object'&&!Array.isArray(value);
}

export function readLibraryPreference<T>(
    roleId:RoleId|string,
    surface:string,
    validate:(value:unknown)=>value is T,
):T|null {
    try {
        const value:unknown=JSON.parse(localStorage.getItem(`${prefix}:${roleId}:${surface}`)||'null');
        return validate(value)?value:null;
    } catch {
        return null;
    }
}

export function writeLibraryPreference(roleId:RoleId|string,surface:string,value:unknown):void {
    try {
        localStorage.setItem(`${prefix}:${roleId}:${surface}`,JSON.stringify(value));
    } catch {}
}

export function isRecord(value:unknown):value is Record<string,unknown> {
    return record(value);
}

export function isNonNegativeInteger(value:unknown):value is number {
    return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;
}

export function isPageLimit(value:unknown):value is 20|50 {
    return value===20||value===50;
}
